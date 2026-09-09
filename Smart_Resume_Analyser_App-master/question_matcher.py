"""
Lightweight retrieval step matching a candidate's resume skills against the
Thapar previous-year question bank (data/software_master_set.json, seeded
into the `question_bank` table by thapar_routes.py).

This is a small TF-IDF + cosine-similarity index built in-process at boot —
no external vector DB or embedding API call needed, so matching is instant
and free. Given resume skills (already extracted by /api/analyze-resume),
it ranks every question in the bank by relevance and returns the top N,
which the frontend then feeds into the same interview flow used for
Gemini-generated questions (answers are still scored by Gemini either way).

Deliberately dependency-light: only numpy (already a project dependency),
no scikit-learn.
"""

import math
import re
from collections import Counter

import numpy as np

_TOKEN_RE = re.compile(r"[a-zA-Z][a-zA-Z0-9+#.]*")
_STOPWORDS = {
    'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'is', 'are',
    'was', 'were', 'be', 'been', 'with', 'your', 'you', 'how', 'what', 'why',
    'do', 'does', 'did', 'can', 'could', 'would', 'should', 'this', 'that',
    'it', 'its', 'as', 'at', 'by', 'from', 'if', 'when', 'which', 'who',
    'explain', 'describe', 'define', 'given', 'write', 'implement',
}


def _tokenize(text):
    return [t.lower() for t in _TOKEN_RE.findall(text or '') if t.lower() not in _STOPWORDS]


class QuestionMatcher:
    """In-memory TF-IDF index over a list of question rows."""

    def __init__(self, questions):
        """`questions`: list of dicts with at least 'id' and 'question_text'."""
        self.questions = questions
        self._build_index()

    def _build_index(self):
        docs_tokens = [_tokenize(q['question_text']) for q in self.questions]
        vocab = {}
        for tokens in docs_tokens:
            for t in tokens:
                if t not in vocab:
                    vocab[t] = len(vocab)

        n_docs = len(docs_tokens)
        n_vocab = len(vocab)
        df = np.zeros(n_vocab, dtype=np.float64)
        for tokens in docs_tokens:
            for t in set(tokens):
                df[vocab[t]] += 1
        idf = np.log((1 + n_docs) / (1 + df)) + 1.0

        matrix = np.zeros((n_docs, n_vocab), dtype=np.float64)
        for i, tokens in enumerate(docs_tokens):
            counts = Counter(tokens)
            for t, c in counts.items():
                matrix[i, vocab[t]] = c * idf[vocab[t]]

        norms = np.linalg.norm(matrix, axis=1)
        norms[norms == 0] = 1.0
        matrix = matrix / norms[:, None]

        self.vocab = vocab
        self.idf = idf
        self.matrix = matrix  # (n_docs, n_vocab), L2-normalized rows

    def _vectorize_query(self, tokens):
        vec = np.zeros(len(self.vocab), dtype=np.float64)
        counts = Counter(tokens)
        for t, c in counts.items():
            idx = self.vocab.get(t)
            if idx is not None:
                vec[idx] = c * self.idf[idx]
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

    def match(self, skills, resume_text='', top_n=12, question_type=None):
        """Rank questions by relevance to the given skills (+ optional resume
        text for extra context). Skill tokens are repeated to weight them
        more heavily than incidental resume wording.

        `question_type`: optionally restrict to 'technical' or 'hr'.
        Returns a list of question dicts (subset of self.questions) with an
        added 'score' field, highest first.
        """
        skill_tokens = []
        for s in skills or []:
            skill_tokens.extend(_tokenize(str(s)) * 3)  # upweight explicit skills
        resume_tokens = _tokenize(resume_text)[:400]  # cap noise from a long resume

        query_tokens = skill_tokens + resume_tokens
        if not query_tokens:
            return []

        query_vec = self._vectorize_query(query_tokens)
        scores = self.matrix @ query_vec  # cosine similarity (rows are unit-normalized)

        candidates = [
            (i, score) for i, score in enumerate(scores)
            if question_type is None or self.questions[i]['question_type'] == question_type
        ]
        candidates.sort(key=lambda x: x[1], reverse=True)

        results = []
        for i, score in candidates[:top_n]:
            row = dict(self.questions[i])
            row['score'] = float(score)
            results.append(row)
        return results
