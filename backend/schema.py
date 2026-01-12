from __future__ import annotations

from db import db_conn


def init_schema() -> None:
    with db_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                genre TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            """
        )
