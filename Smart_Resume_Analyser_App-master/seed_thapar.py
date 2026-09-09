"""
Standalone reseed for the Thapar question bank.

api.py auto-seeds `question_bank` from data/software_master_set.json on
boot, but ONLY if the table is empty (see thapar_routes.py::_seed_if_empty).
Run this to force a re-seed after updating the snapshot file:

    python seed_thapar.py

It drops and recreates question_bank, then reloads it from
data/software_master_set.json, using the same DB_HOST/DB_USER/... env vars
api.py uses.
"""

import os
import pymysql

from thapar_routes import init_thapar

DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
DB_NAME = os.environ.get('DB_NAME', 'sra')
DB_PORT = int(os.environ.get('DB_PORT', '3306'))


def main():
    conn = pymysql.connect(
        host=DB_HOST, user=DB_USER, password=DB_PASSWORD,
        port=DB_PORT, charset='utf8mb4'
    )
    cursor = conn.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME};")
    conn.select_db(DB_NAME)

    print("🗑️  Clearing existing question_bank table (if any)...")
    cursor.execute("DROP TABLE IF EXISTS question_bank;")
    conn.commit()

    init_thapar(conn, cursor)
    print("✅ Reseed complete.")


if __name__ == '__main__':
    main()
