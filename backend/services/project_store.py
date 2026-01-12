from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any

from db import db_conn


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
