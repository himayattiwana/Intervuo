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


def ensure_alive(connection):
    if connection is None:
        return
    try:
        connection.ping(reconnect=True)
    except Exception as e:
        print(f"⚠️  DB reconnect failed: {e}")
