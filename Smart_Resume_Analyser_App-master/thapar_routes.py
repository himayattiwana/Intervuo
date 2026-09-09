"""
Previous-year Thapar placement interview questions, unlocked for accounts
signed up with a @thapar.edu email (see auth.py: users.is_thapar).

Data comes from a one-time snapshot of TietPrep's "Master Set" view
(data/software_master_set.json — a flat, deduplicated pool of technical +
HR questions for a role category, Batch 2026; not attributed per-question
to a company). It's seeded into the `question_bank` table at boot.

Rather than browsing by company, the flow is: after a resume is analyzed
and skills are extracted (/api/analyze-resume), the candidate can choose
real, last-year questions matched to their skills instead of fresh
Gemini-generated ones. Matching is a local TF-IDF similarity search
(question_matcher.py) — no external API call, so it's instant. Whichever
question source is used, answers are still scored by Gemini via the
existing /api/analyze-answer endpoint.
"""

import json
import os
from flask import Blueprint, request, jsonify, g

from auth import require_auth, require_thapar
from question_matcher import QuestionMatcher
from db_utils import ensure_alive

thapar_bp = Blueprint('thapar', __name__, url_prefix='/api/thapar')

_db_connection = None
_db_cursor = None
_matcher = None  # QuestionMatcher, built after seeding

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'software_master_set.json')


def init_thapar(db_connection, db_cursor):
    """Create the question_bank table, seed it from the JSON snapshot if
    empty, and build the in-memory TF-IDF match index."""
    global _db_connection, _db_cursor
    _db_connection = db_connection
    _db_cursor = db_cursor

    if not db_connection or not db_cursor:
        print("⚠️  Thapar bank: database not available, skipping setup")
        return

    db_cursor.execute("""
        CREATE TABLE IF NOT EXISTS question_bank (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            category VARCHAR(100) NOT NULL,
            question_type VARCHAR(20) NOT NULL,
            question_text TEXT NOT NULL,
            batch VARCHAR(10) DEFAULT '2026'
        );
    """)
    db_connection.commit()
    print("✅ Thapar bank: question_bank table ready")

    _seed_if_empty()
    _load_matcher()


def _seed_if_empty():
    _db_cursor.execute("SELECT COUNT(*) FROM question_bank")
    (count,) = _db_cursor.fetchone()
    if count > 0:
        print(f"ℹ️  Thapar bank: already seeded ({count} questions)")
        return

    if not os.path.exists(DATA_FILE):
        print(f"⚠️  Thapar bank: no snapshot found at {DATA_FILE}, skipping seed")
        return

    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        snapshot = json.load(f)

    category = snapshot.get('category', 'General')
    batch = snapshot.get('batch', '2026')
    rows = (
        [(category, 'technical', q, batch) for q in snapshot.get('technical_questions', [])] +
        [(category, 'hr', q, batch) for q in snapshot.get('hr_questions', [])]
    )
    if not rows:
        print("⚠️  Thapar bank: snapshot had no questions, skipping seed")
        return

    _db_cursor.executemany(
        "INSERT INTO question_bank (category, question_type, question_text, batch) VALUES (%s, %s, %s, %s)",
        rows
    )
    _db_connection.commit()
    print(f"✅ Thapar bank: seeded {len(rows)} questions ({category}, batch {batch})")


def _load_matcher():
    global _matcher
    _db_cursor.execute("SELECT id, category, question_type, question_text FROM question_bank")
    rows = _db_cursor.fetchall()
    questions = [
        {'id': r[0], 'category': r[1], 'question_type': r[2], 'question_text': r[3]}
        for r in rows
    ]
    if not questions:
        print("⚠️  Thapar bank: no questions to index, matching disabled")
        _matcher = None
        return
    _matcher = QuestionMatcher(questions)
    print(f"✅ Thapar bank: match index built over {len(questions)} questions")


@thapar_bp.route('/stats', methods=['GET'])
@require_auth
@require_thapar
def stats():
    if not _db_connection or not _db_cursor:
        return jsonify({'error': 'Database not available'}), 500
    ensure_alive(_db_connection)
    _db_cursor.execute(
        "SELECT category, question_type, COUNT(*) FROM question_bank GROUP BY category, question_type"
    )
    breakdown = [{'category': c, 'type': t, 'count': n} for c, t, n in _db_cursor.fetchall()]
    return jsonify({'breakdown': breakdown}), 200


@thapar_bp.route('/match-questions', methods=['POST'])
@require_auth
@require_thapar
def match_questions():
    """Body: { skills: [str], resume_text?: str, top_n?: int }
    Returns the top-N previous-year questions ranked by relevance to the
    candidate's resume skills, mixing technical and HR questions."""
    if _matcher is None:
        return jsonify({'error': 'Question bank is not available yet'}), 503

    data = request.get_json(silent=True) or {}
    skills = data.get('skills') or []
    resume_text = data.get('resume_text') or ''
    top_n = data.get('top_n') or 10
    try:
        top_n = max(1, min(20, int(top_n)))
    except (TypeError, ValueError):
        top_n = 10

    if not skills and not resume_text:
        return jsonify({'error': 'Provide skills and/or resume_text to match against'}), 400

    # Mix ~70% technical / ~30% HR (rounded), same pattern as a real interview.
    n_technical = max(1, round(top_n * 0.7))
    n_hr = max(1, top_n - n_technical)

    technical = _matcher.match(skills, resume_text, top_n=n_technical, question_type='technical')
    hr = _matcher.match(skills, resume_text, top_n=n_hr, question_type='hr')

    matched = technical + hr
    return jsonify({
        'matched_count': len(matched),
        'questions': [
            {
                'id': q['id'],
                'question_text': q['question_text'],
                'question_type': q['question_type'],
                'category': q['category'],
                'relevance_score': round(q['score'], 4)
            }
            for q in matched
        ]
    }), 200
