from __future__ import annotations

from db import db_conn
from constants import DEFAULT_ARTICLE_TYPES, DEFAULT_PROMPTS_PER_ARTICLE_TYPE


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

        # Prompts (structured fields for articles)
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS prompts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                article_type_id INTEGER NOT NULL,
                key TEXT NOT NULL,
                text TEXT NOT NULL,
                type TEXT NOT NULL,
                linked_style_key TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY(article_type_id) REFERENCES article_types(id) ON DELETE CASCADE,
                UNIQUE(article_type_id, key)
            );
            """
        )

        # Prompt values (answers to prompts for specific articles)
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS prompt_values (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                article_id INTEGER NOT NULL,
                prompt_id INTEGER NOT NULL,
                value TEXT,
                linked_article_id INTEGER,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE,
                FOREIGN KEY(prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
                FOREIGN KEY(linked_article_id) REFERENCES articles(id) ON DELETE SET NULL,
                UNIQUE(article_id, prompt_id)
            );
            """
        )

        # Indexes for prompt values
        conn.execute("CREATE INDEX IF NOT EXISTS idx_prompt_values_article_id ON prompt_values(article_id);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_prompt_values_prompt_id ON prompt_values(prompt_id);")

        # Seed default prompts (idempotent)
        from datetime import datetime
        now = datetime.now().isoformat()
        
        for prompt_config in DEFAULT_PROMPTS_PER_ARTICLE_TYPE:
            article_type_key = prompt_config["article_type_key"]
            # Get the article type id
            type_result = conn.execute(
                "SELECT id FROM article_types WHERE key = ?",
                (article_type_key,)
            ).fetchone()
            
            if type_result:
                type_id = type_result[0]
                conn.execute(
                    """
                    INSERT OR IGNORE INTO prompts 
                    (article_type_id, key, text, type, linked_style_key, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        type_id,
                        prompt_config["prompt_key"],
                        prompt_config["prompt_text"],
                        prompt_config["prompt_type"],
                        prompt_config.get("prompt_linked_type_key"),
                        now,
                    ),
                )
