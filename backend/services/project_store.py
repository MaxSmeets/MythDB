from __future__ import annotations

import json
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
        # If file gets corrupted during dev, don't crash the app
        return []


def save_projects(projects: list[dict[str, Any]]) -> None:
    _ensure_data_dir()
    PROJECTS_FILE.write_text(json.dumps(projects, indent=2), encoding="utf-8")


def add_project(name: str, genre: str) -> dict[str, Any]:
    name = (name or "").strip()
    genre = (genre or "").strip()

    if not name or not genre:
        raise ValueError("Project name and genre are required.")

    projects = load_projects()

    project = {
        "id": f"proj_{int(datetime.now(tz=timezone.utc).timestamp())}",
        "name": name,
        "genre": genre,
        "created_at": datetime.now(tz=timezone.utc).isoformat(),
    }

    projects.append(project)
    save_projects(projects)
    return project
