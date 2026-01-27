"""Prompt and prompt value management."""

from datetime import datetime
from db import db_conn


def get_prompts_for_article_type(article_type_id: int) -> list[dict]:
    """Get all prompts for a given article type."""
    with db_conn() as conn:
        rows = conn.execute(
            """
            SELECT id, key, text, type, linked_style_key
            FROM prompts
            WHERE article_type_id = ?
            ORDER BY id
            """,
            (article_type_id,),
        ).fetchall()
        
        return [
            {
                "id": row[0],
                "key": row[1],
                "text": row[2],
                "type": row[3],
                "linked_style_key": row[4],
            }
            for row in rows
        ]


def get_prompt_values_for_article(article_id: int) -> dict:
    """Get all prompt values for a given article, keyed by prompt key."""
    with db_conn() as conn:
        rows = conn.execute(
            """
            SELECT p.key, pv.value, pv.linked_article_id, pv.id
            FROM prompt_values pv
            JOIN prompts p ON pv.prompt_id = p.id
            WHERE pv.article_id = ?
            """,
            (article_id,),
        ).fetchall()
        
        return {
            row[0]: {
                "value": row[1],
                "linked_article_id": row[2],
                "prompt_value_id": row[3],
            }
            for row in rows
        }


def get_linked_articles(article_type_key: str, project_id: int) -> list[dict]:
    """Get all articles of a given type for linking in select prompts."""
    with db_conn() as conn:
        rows = conn.execute(
            """
            SELECT a.id, a.title, a.slug
            FROM articles a
            JOIN article_types at ON a.type_id = at.id
            WHERE at.key = ? AND a.project_id = ?
            ORDER BY a.title
            """,
            (article_type_key, project_id),
        ).fetchall()
        
        return [
            {
                "id": row[0],
                "title": row[1],
                "slug": row[2],
            }
            for row in rows
        ]


def save_prompt_value(article_id: int, prompt_id: int, value: str | None, linked_article_id: int | None = None) -> None:
    """Save or update a prompt value for an article."""
    now = datetime.now().isoformat()
    
    with db_conn() as conn:
        # Check if value exists
        existing = conn.execute(
            "SELECT id FROM prompt_values WHERE article_id = ? AND prompt_id = ?",
            (article_id, prompt_id),
        ).fetchone()
        
        if existing:
            # Update existing
            conn.execute(
                """
                UPDATE prompt_values
                SET value = ?, linked_article_id = ?, updated_at = ?
                WHERE article_id = ? AND prompt_id = ?
                """,
                (value, linked_article_id, now, article_id, prompt_id),
            )
        else:
            # Insert new
            conn.execute(
                """
                INSERT INTO prompt_values
                (article_id, prompt_id, value, linked_article_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (article_id, prompt_id, value, linked_article_id, now, now),
            )


def create_prompt_values_for_article(article_id: int, article_type_id: int) -> None:
    """Create empty prompt values for all prompts of an article type."""
    now = datetime.now().isoformat()
    
    with db_conn() as conn:
        prompts = conn.execute(
            "SELECT id FROM prompts WHERE article_type_id = ?",
            (article_type_id,),
        ).fetchall()
        
        for (prompt_id,) in prompts:
            conn.execute(
                """
                INSERT OR IGNORE INTO prompt_values
                (article_id, prompt_id, value, linked_article_id, created_at, updated_at)
                VALUES (?, ?, NULL, NULL, ?, ?)
                """,
                (article_id, prompt_id, now, now),
            )
