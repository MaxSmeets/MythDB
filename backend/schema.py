from __future__ import annotations

from db import db_conn


DEFAULT_ARTICLE_TYPES = [
    ("npc", "NPC"),
    ("location", "Location"),
    ("settlement", "Settlement"),
    ("faction", "Faction"),
    ("item", "Item"),
    ("species", "Species"),
    ("conflict", "Conflict"),
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

        # Folders (organize articles hierarchically)
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS folders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                parent_id INTEGER,
                name TEXT NOT NULL,
                slug TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY(parent_id) REFERENCES folders(id) ON DELETE CASCADE,
                UNIQUE(project_id, parent_id, slug)
            );
            """
        )

        # Articles (markdown content stored directly in DB)
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                folder_id INTEGER,
                type_id INTEGER NOT NULL,
                slug TEXT NOT NULL,
                title TEXT NOT NULL,
                body_content TEXT NOT NULL DEFAULT '',
                featured_image TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY(folder_id) REFERENCES folders(id) ON DELETE CASCADE,
                FOREIGN KEY(type_id) REFERENCES article_types(id),
                UNIQUE(project_id, slug)
            );
            """
        )

        # Helpful indexes
        conn.execute("CREATE INDEX IF NOT EXISTS idx_folders_project_id ON folders(project_id);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_articles_project_id ON articles(project_id);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_articles_folder_id ON articles(folder_id);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_articles_type_id ON articles(type_id);")

        # Migration: Add featured_image column if it doesn't exist
        try:
            conn.execute("ALTER TABLE articles ADD COLUMN featured_image TEXT;")
        except:
            # Column already exists
            pass

        # Seed default article types (idempotent)
        for key, name in DEFAULT_ARTICLE_TYPES:
            conn.execute(
                "INSERT OR IGNORE INTO article_types (key, name) VALUES (?, ?);",
                (key, name),
            )
