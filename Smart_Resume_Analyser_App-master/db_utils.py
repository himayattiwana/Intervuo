"""
Shared helper to keep the single global MySQL connection alive.

The app opens one pymysql connection at boot (see api.py) and reuses it for
the whole process lifetime — no connection pool, no per-request reconnect.
That's fine while the connection stays open, but MySQL hosts commonly close
idle connections after a timeout (Clever Cloud's free tier does this more
aggressively than some), and the next query on a dead connection fails with
an opaque pymysql error like `(0, '')` — surfaced to users as "Login failed"
or "Failed to create session".

Call `ensure_alive(connection)` at the top of any request handler that's
about to run a query. pymysql's `ping(reconnect=True)` checks the socket and
transparently reconnects if it's gone, so this is cheap when the connection
is already fine and self-healing when it isn't.
"""


import os


def ensure_alive(connection, db_name=None):
    if connection is None:
        return
    if db_name is None:
        db_name = os.environ.get('DB_NAME', 'sra')
    was_dead = getattr(connection, '_sock', None) is None
    try:
        connection.ping(reconnect=True)
    except Exception as e:
        print(f"⚠️  DB ping failed: {e}")

    # Belt-and-braces: on some proxied MySQL hosts (seen with Clever Cloud's
    # connection proxy) ping(reconnect=True) can return without raising yet
    # still leave the socket closed, so the next query fails with a bare
    # pymysql.err.InterfaceError(0, ''). If the socket is still gone after
    # ping, force an explicit reconnect using the connection's own stored
    # credentials.
    if getattr(connection, '_sock', None) is None:
        try:
            connection.connect()
            was_dead = True
            print("✅ DB connection re-established")
        except Exception as e:
            print(f"❌ DB reconnect failed: {e}")
            return

    # The app connects with pymysql.connect(...) and only selects the
    # database afterwards via connection.select_db(DB_NAME) — that "USE db"
    # context does NOT automatically survive a reconnect (whether pymysql's
    # own ping(reconnect=True) did it, or the explicit connect() above), so
    # a freshly reconnected socket lands with no database selected and the
    # next query fails with (1046, 'No database selected'). Re-select it
    # explicitly whenever we know (or suspect) a reconnect just happened.
    if was_dead and db_name:
        try:
            connection.select_db(db_name)
        except Exception as e:
            print(f"❌ Failed to re-select database after reconnect: {e}")
