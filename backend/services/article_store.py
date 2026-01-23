from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Optional

from db import db_conn


def slugify(text: str) -> str:
    s = (text or "").strip().lower()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s).strip("-")
    return s or "article"


def list_article_types() -> list[dict[str, Any]]:
    with db_conn() as conn:
        rows = conn.execute(
            "SELECT id, key, name FROM article_types ORDER BY name ASC;"
        ).fetchall()
    return [dict(r) for r in rows]


def get_article_type_by_key(type_key: str) -> Optional[dict[str, Any]]:
    with db_conn() as conn:
        row = conn.execute(
            "SELECT id, key, name FROM article_types WHERE key = ? LIMIT 1;",
            (type_key,),
        ).fetchone()
    return dict(row) if row else None


def _article_slug_exists(project_id: int, slug: str) -> bool:
    with db_conn() as conn:
        row = conn.execute(
            "SELECT 1 FROM articles WHERE project_id = ? AND slug = ? LIMIT 1;",
            (project_id, slug),
        ).fetchone()
    return row is not None


def unique_article_slug(project_id: int, base_slug: str) -> str:
    if not _article_slug_exists(project_id, base_slug):
        return base_slug

    i = 2
    while True:
        candidate = f"{base_slug}-{i}"
        if not _article_slug_exists(project_id, candidate):
            return candidate
        i += 1


def create_article(
    *,
    project_id: int,
    folder_id: int | None,
    type_key: str,
    title: str,
    body_content: str = "",
) -> dict[str, Any]:
    """
    Creates an article record with markdown content stored in the database.
    
    Args:
        project_id: The project this article belongs to
        folder_id: The folder this article is in (None for root)
        type_key: The article type (npc, location, etc.)
        title: Article title
        body_content: Markdown content (defaults to empty)
    
    Returns:
        Created article dict with all metadata
    """
    title = (title or "").strip()
    if not title:
        raise ValueError("Article title is required.")

    type_row = get_article_type_by_key(type_key)
    if not type_row:
        raise ValueError("Invalid article type.")

    now = datetime.now(tz=timezone.utc).isoformat()
    base_slug = slugify(title)
    slug = unique_article_slug(project_id, base_slug)

    with db_conn() as conn:
        conn.execute(
            """
            INSERT INTO articles (project_id, folder_id, type_id, slug, title, body_content, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """,
            (project_id, folder_id, type_row["id"], slug, title, body_content, now, now),
        )
        row = conn.execute(
            """
            SELECT a.id, a.project_id, a.folder_id, a.slug, a.title, a.body_content, a.created_at, a.updated_at,
                   t.key AS type_key, t.name AS type_name
            FROM articles a
            JOIN article_types t ON t.id = a.type_id
            WHERE a.project_id = ? AND a.slug = ?
            LIMIT 1;
            """,
            (project_id, slug),
        ).fetchone()

    return dict(row)


def get_article_by_id(article_id: int) -> Optional[dict[str, Any]]:
    with db_conn() as conn:
        row = conn.execute(
            """
            SELECT a.id, a.project_id, a.folder_id, a.slug, a.title, a.created_at, a.updated_at,
                   t.key AS type_key, t.name AS type_name
            FROM articles a
            JOIN article_types t ON t.id = a.type_id
            WHERE a.id = ?
            LIMIT 1;
            """,
            (article_id,),
        ).fetchone()
    return dict(row) if row else None


def get_article_full(article_id: int) -> Optional[dict[str, Any]]:
    """Get article with full body_content."""
    with db_conn() as conn:
        row = conn.execute(
            """
            SELECT a.id, a.project_id, a.folder_id, a.slug, a.title, a.body_content,
                   a.created_at, a.updated_at,
                   t.key AS type_key, t.name AS type_name
            FROM articles a
            JOIN article_types t ON t.id = a.type_id
            WHERE a.id = ?
            LIMIT 1;
            """,
            (article_id,),
        ).fetchone()
    return dict(row) if row else None


def update_article_content(article_id: int, body_content: str) -> None:
    """Update the markdown content of an article."""
    now = datetime.now(tz=timezone.utc).isoformat()
    with db_conn() as conn:
        conn.execute(
            "UPDATE articles SET body_content = ?, updated_at = ? WHERE id = ?;",
            (body_content, now, article_id),
        )


def touch_article(article_id: int) -> None:
    now = datetime.now(tz=timezone.utc).isoformat()
    with db_conn() as conn:
        conn.execute("UPDATE articles SET updated_at = ? WHERE id = ?;", (now, article_id))
