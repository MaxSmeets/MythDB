from __future__ import annotations

from db import db_conn


DEFAULT_ARTICLE_TYPES = [
    ("npc", "NPC"),
    ("location", "Location"),
    ("settlement", "Settlement"),
    ("faction", "Faction"),
    ("item", "Item"),
]


def init_schema() -> None:
    with db_conn() as conn:
        # Projects
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

        # Article types
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS article_types (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL
            );
            """
        )

        # Articles (metadata + body file path)
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                type_id INTEGER NOT NULL,
                slug TEXT NOT NULL,
                title TEXT NOT NULL,
                body_path TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY(type_id) REFERENCES article_types(id),
                UNIQUE(project_id, slug)
            );
            """
        )

        # Helpful indexes
        conn.execute("CREATE INDEX IF NOT EXISTS idx_articles_project_id ON articles(project_id);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_articles_type_id ON articles(type_id);")

        # Seed default article types (idempotent)
        for key, name in DEFAULT_ARTICLE_TYPES:
            conn.execute(
                "INSERT OR IGNORE INTO article_types (key, name) VALUES (?, ?);",
                (key, name),
            )
