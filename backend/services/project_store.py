from __future__ import annotations

import json
import re
from pathlib import Path
from datetime import datetime, timezone
from typing import Any

PROJECTS_FILE = Path("data/projects.json")


def _ensure_data_dir() -> None:
    PROJECTS_FILE.parent.mkdir(parents=True, exist_ok=True)


def load_projects() -> list[dict[str, Any]]:
    _ensure_data_dir()
    if not PROJECTS_FILE.exists():
        return []
    try:
        return json.loads(PROJECTS_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []


def save_projects(projects: list[dict[str, Any]]) -> None:
    _ensure_data_dir()
    PROJECTS_FILE.write_text(json.dumps(projects, indent=2), encoding="utf-8")


def _normalize_name(name: str) -> str:
    # Collapse whitespace + lower for duplicate detection
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


def _unique_slug(base_slug: str, projects: list[dict[str, Any]]) -> str:
    existing = {p.get("slug", "") for p in projects}
    if base_slug not in existing:
        return base_slug

    i = 2
    while f"{base_slug}-{i}" in existing:
        i += 1
    return f"{base_slug}-{i}"


def add_project(name: str, genre: str) -> dict[str, Any]:
    name = (name or "").strip()
    genre = (genre or "").strip()

    if not name or not genre:
        raise ValueError("Project name and genre are required.")

    projects = load_projects()

    # Prevent duplicate names (case-insensitive, whitespace-normalized)
    new_norm = _normalize_name(name)
    for p in projects:
        if _normalize_name(p.get("name", "")) == new_norm:
            raise ValueError("A project with that name already exists.")

    base_slug = slugify(name)
    slug = _unique_slug(base_slug, projects)

    project = {
        "id": f"proj_{int(datetime.now(tz=timezone.utc).timestamp())}",
        "slug": slug,
        "name": name,
        "genre": genre,
        "created_at": datetime.now(tz=timezone.utc).isoformat(),
    }

    projects.append(project)
    save_projects(projects)
    return project

def get_project_by_slug(slug: str) -> dict[str, Any] | None:
    projects = load_projects()
    for p in projects:
        if p.get("slug") == slug:
            return p
    return None
