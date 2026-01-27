from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any
from pathlib import Path

from db import db_conn
from services.time_utils import format_timestamp_with_relative


def _normalize_name(name: str) -> str:
    return " ".join(name.strip().split()).lower()


def slugify(text: str) -> str:
    """
    Turn 'Ashfall: The Empire' into 'ashfall-the-empire'
    """
    s = text.strip().lower()
    s = re.sub(r"[^a-z0-9\s-]", "", s)     # drop weird chars
    s = re.sub(r"[\s_-]+", "-", s)         # spaces/underscores -> hyphen
    s = s.strip("-")
    return s or "project"


def _slug_exists(slug: str) -> bool:
    with db_conn() as conn:
        row = conn.execute(
            "SELECT 1 FROM projects WHERE slug = ? LIMIT 1;",
            (slug,),
        ).fetchone()
    return row is not None


def _unique_slug(base_slug: str) -> str:
    if not _slug_exists(base_slug):
        return base_slug

    i = 2
    while True:
        candidate = f"{base_slug}-{i}"
        if not _slug_exists(candidate):
            return candidate
        i += 1


def load_projects() -> list[dict[str, Any]]:
    with db_conn() as conn:
        rows = conn.execute(
            "SELECT id, slug, name, genre, created_at FROM projects ORDER BY id DESC;"
        ).fetchall()
    return [dict(r) for r in rows]


def add_project(name: str, genre: str) -> dict[str, Any]:
    name = (name or "").strip()
    genre = (genre or "").strip()

    if not name or not genre:
        raise ValueError("Project name and genre are required.")

    created_at = datetime.now(tz=timezone.utc).isoformat()

    # Prevent duplicate names (case-insensitive, whitespace-normalized)
    new_norm = _normalize_name(name)
    with db_conn() as conn:
        existing_names = conn.execute("SELECT name FROM projects;").fetchall()
        for r in existing_names:
            if _normalize_name(r["name"]) == new_norm:
                raise ValueError("A project with that name already exists.")

    base_slug = slugify(name)
    slug = _unique_slug(base_slug)

    with db_conn() as conn:
        conn.execute(
            "INSERT INTO projects (slug, name, genre, created_at) VALUES (?, ?, ?, ?);",
            (slug, name, genre, created_at),
        )
        row = conn.execute(
            "SELECT id, slug, name, genre, created_at FROM projects WHERE slug = ? LIMIT 1;",
            (slug,),
        ).fetchone()

    return dict(row)


def get_project_by_slug(slug: str) -> dict[str, Any] | None:
    with db_conn() as conn:
        row = conn.execute(
            "SELECT id, slug, name, genre, created_at FROM projects WHERE slug = ? LIMIT 1;",
            (slug,),
        ).fetchone()
    return dict(row) if row else None

def _get_project_statistics(project_id: int):
    """Get statistics for a project."""
    with db_conn() as conn:
        # Count total articles
        articles_count = conn.execute(
            "SELECT COUNT(*) as count FROM articles WHERE project_id = ?;",
            (project_id,),
        ).fetchone()["count"]
        
        # Count total folders
        folders_count = conn.execute(
            "SELECT COUNT(*) as count FROM folders WHERE project_id = ?;",
            (project_id,),
        ).fetchone()["count"]
        
        # Count total words in all articles
        articles_content = conn.execute(
            "SELECT body_content FROM articles WHERE project_id = ?;",
            (project_id,),
        ).fetchall()
        
        total_words = 0
        for row in articles_content:
            content = row["body_content"] or ""
            # Count words by splitting on whitespace
            words = len(content.split())
            total_words += words
        
        # Get project slug to count media files
        project_row = conn.execute(
            "SELECT slug FROM projects WHERE id = ? LIMIT 1;",
            (project_id,),
        ).fetchone()
        
        media_count = 0
        if project_row:
            project_slug = project_row["slug"]
            media_dir = Path("data/projects") / project_slug / "media"
            if media_dir.exists():
                # Count image files
                allowed_exts = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
                media_count = sum(
                    1 for f in media_dir.iterdir() 
                    if f.is_file() and f.suffix.lower() in allowed_exts
                )
        
        # Get recent articles
        recent_articles = conn.execute(
            """
            SELECT a.id, a.slug, a.title, a.updated_at, 
                   t.name AS type_name, t.key AS type_key
            FROM articles a
            JOIN article_types t ON a.type_id = t.id
            WHERE a.project_id = ?
            ORDER BY a.updated_at DESC
            LIMIT 5;
            """,
            (project_id,),
        ).fetchall()
    
    # Format recent articles with clean time formatting
    formatted_articles = []
    for article in recent_articles:
        article_dict = dict(article)
        clean_time, relative_time = format_timestamp_with_relative(article_dict["updated_at"])
        article_dict["updated_at_formatted"] = clean_time
        article_dict["updated_at_relative"] = relative_time
        formatted_articles.append(article_dict)
    
    return {
        "articles_count": articles_count,
        "folders_count": folders_count,
        "total_words": total_words,
        "media_count": media_count,
        "recent_articles": formatted_articles,
    }