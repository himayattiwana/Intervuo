"""
One-off parser: turns a copy-pasted TietPrep "Master Set" page (e.g. the
Software category's 1545-question dump, Batch 2026) into structured JSON.

The site's Master Set view has no per-question company label — it's a flat,
deduplicated pool across all question sets in that role category. Layout,
line by line, once blank lines are stripped:

    <Category> - Master Set
    <N> questions from <M> sets
    Batch <year>
    Search questions...
    Similar to...
    Technical Questions
    <count> questions
    1
    <question text>
    2
    <question text>
    ...
    Showing <count> of <count>
    Show less
    HR Questions            <- not always literally present; the next
    <count> questions          numbered-list run after Technical is HR
    1
    <question text>
    ...
    Showing <count> of <count>
    Show less
    Topics Covered
    <tag>
    <tag>
    ...
    TietPrep
    TietPrep
    Placement Interview Prep Portal
    A Humble Solutions Product

Usage:
    python parse_master_set.py <input.txt> <output.json> [category_name]
"""

import json
import re
import sys


def parse(text, category_hint=None):
    lines = [l.strip() for l in text.splitlines()]
    lines = [l for l in lines if l != '']

    category = category_hint or 'General'
    if lines and 'Master Set' in lines[0]:
        category = lines[0].split(' - ')[0].strip()

    # Find the two numbered-question runs (Technical, then HR) and the
    # "Topics Covered" tag list. A numbered run is a contiguous sequence of
    # lines that look like sequential integers "1", "2", "3", ... each
    # followed by a question line, terminated by "Showing X of X".
    technical_questions = []
    hr_questions = []
    topics = []

    i = 0
    n = len(lines)
    runs = []
    while i < n:
        if lines[i] == '1' and i + 1 < n:
            # candidate start of a numbered run
            start = i
            questions = []
            expected = 1
            j = i
            while j < n and lines[j] == str(expected):
                q_text = lines[j + 1] if j + 1 < n else ''
                questions.append(q_text)
                j += 2
                expected += 1
            if len(questions) >= 2:
                runs.append(questions)
                i = j
                continue
        i += 1

    if len(runs) >= 1:
        technical_questions = runs[0]
    if len(runs) >= 2:
        hr_questions = runs[1]

    topics_idx = None
    for idx, l in enumerate(lines):
        if l == 'Topics Covered':
            topics_idx = idx
            break
    if topics_idx is not None:
        for l in lines[topics_idx + 1:]:
            if l in ('TietPrep', 'Placement Interview Prep Portal', 'A Humble Solutions Product'):
                break
            topics.append(l)

    return {
        'category': category,
        'batch': '2026',
        'technical_questions': technical_questions,
        'hr_questions': hr_questions,
        'topics': topics,
    }


def main():
    if len(sys.argv) < 3:
        print('Usage: python parse_master_set.py <input.txt> <output.json> [category_name]')
        sys.exit(1)

    in_path = sys.argv[1]
    out_path = sys.argv[2]
    category_hint = sys.argv[3] if len(sys.argv) > 3 else None

    with open(in_path, 'r', encoding='utf-8') as f:
        text = f.read()

    result = parse(text, category_hint)

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"Category: {result['category']}")
    print(f"Technical questions: {len(result['technical_questions'])}")
    print(f"HR questions: {len(result['hr_questions'])}")
    print(f"Topics: {len(result['topics'])}")
    print(f"Written to {out_path}")


if __name__ == '__main__':
    main()
