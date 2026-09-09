"""
Real signup / login for Intervuo.

Adds a `users` table (created at boot, same pattern as the other tables in
api.py) and JWT-based auth. A user who signs up with a @thapar.edu email is
flagged `is_thapar = 1`, which is what gates the previous-year company
question bank in thapar_routes.py.

NOTE: this is a domain-only check on the email string — there is no email
verification step. That's a deliberate, lighter-weight tradeoff (see the
project plan discussion): it's easy to spoof by typing a fake @thapar.edu
address, so don't treat `is_thapar` as a strong identity guarantee. If that
becomes a problem, add an OTP-over-SMTP verification step before flipping
`is_thapar` to true.
"""

import re
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import Blueprint, request, jsonify, g

from config import JWT_SECRET, JWT_EXPIRY_HOURS, THAPAR_EMAIL_DOMAIN

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

EMAIL_RE = re.compile(r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')

# Set by api.py after it establishes db_connection / db_cursor.
_db_connection = None
_db_cursor = None


def init_auth(db_connection, db_cursor):
    """Create the users table. Mirrors the table-creation pattern already
    used for interview_sessions / interview_answers in api.py."""
    global _db_connection, _db_cursor
    _db_connection = db_connection
    _db_cursor = db_cursor

    if not db_connection or not db_cursor:
        print("⚠️  Auth: database not available, skipping users table setup")
        return

    users_table_sql = """
    CREATE TABLE IF NOT EXISTS users (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        is_thapar TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    db_cursor.execute(users_table_sql)
    db_connection.commit()
    print("✅ Auth: users table ready")


def _is_thapar_email(email):
    return email.lower().endswith('@' + THAPAR_EMAIL_DOMAIN)


def _make_token(user):
    payload = {
        'sub': user['id'],
        'email': user['email'],
        'name': user['name'],
        'is_thapar': bool(user['is_thapar']),
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')


def _user_public(user):
    return {
        'id': user['id'],
        'name': user['name'],
        'email': user['email'],
        'is_thapar': bool(user['is_thapar']),
    }


def require_auth(f):
    """Decorator: validates the Bearer JWT and stashes the payload on
    flask.g.current_user. Returns 401 if missing/invalid/expired."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        header = request.headers.get('Authorization', '')
        if not header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid Authorization header'}), 401
        token = header[len('Bearer '):].strip()
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Session expired, please log in again'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid auth token'}), 401
        g.current_user = payload
        return f(*args, **kwargs)
    return wrapper


def require_thapar(f):
    """Stack under require_auth: blocks non-Thapar accounts server-side.
    This is the real enforcement boundary — hiding the tab in the UI is
    just a UX nicety, not the security control."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        user = getattr(g, 'current_user', None)
        if not user or not user.get('is_thapar'):
            return jsonify({'error': 'This feature is only available to verified Thapar accounts'}), 403
        return f(*args, **kwargs)
    return wrapper


@auth_bp.route('/signup', methods=['POST'])
def signup():
    if not _db_connection or not _db_cursor:
        return jsonify({'error': 'Database not available'}), 500

    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not name or len(name) < 2:
        return jsonify({'error': 'Please enter your name'}), 400
    if not EMAIL_RE.match(email):
        return jsonify({'error': 'Please enter a valid email address'}), 400
    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400

    try:
        _db_cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if _db_cursor.fetchone():
            return jsonify({'error': 'An account with this email already exists'}), 409

        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        is_thapar = 1 if _is_thapar_email(email) else 0

        _db_cursor.execute(
            "INSERT INTO users (name, email, password_hash, is_thapar) VALUES (%s, %s, %s, %s)",
            (name, email, password_hash, is_thapar)
        )
        _db_connection.commit()
        user_id = _db_cursor.lastrowid

        user = {'id': user_id, 'name': name, 'email': email, 'is_thapar': is_thapar}
        token = _make_token(user)

        print(f"✅ Auth: new signup {email} (thapar={bool(is_thapar)})")
        return jsonify({'token': token, 'user': _user_public(user)}), 201

    except Exception as e:
        print(f"❌ Auth signup error: {e}")
        return jsonify({'error': 'Signup failed, please try again'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    if not _db_connection or not _db_cursor:
        return jsonify({'error': 'Database not available'}), 500

    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    try:
        _db_cursor.execute(
            "SELECT id, name, email, password_hash, is_thapar FROM users WHERE email = %s",
            (email,)
        )
        row = _db_cursor.fetchone()
        if not row:
            return jsonify({'error': 'Invalid email or password'}), 401

        user_id, name, user_email, password_hash, is_thapar = row
        if not bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8')):
            return jsonify({'error': 'Invalid email or password'}), 401

        user = {'id': user_id, 'name': name, 'email': user_email, 'is_thapar': is_thapar}
        token = _make_token(user)
        return jsonify({'token': token, 'user': _user_public(user)}), 200

    except Exception as e:
        print(f"❌ Auth login error: {e}")
        return jsonify({'error': 'Login failed, please try again'}), 500


@auth_bp.route('/me', methods=['GET'])
@require_auth
def me():
    payload = g.current_user
    return jsonify({'user': {
        'id': payload['sub'],
        'name': payload['name'],
        'email': payload['email'],
        'is_thapar': bool(payload['is_thapar']),
    }}), 200
