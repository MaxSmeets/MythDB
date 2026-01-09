from __future__ import annotations

import re
from pathlib import Path
from typing import Any


BASE_PROJECTS_DIR = Path("data/projects")


def _safe_name(name: str) -> str:
    # Keep folder/file names safe & predictable
    name = (name or "").strip()
    name = re.sub(r"\s+", " ", name)
    return name


def _slugify(name: str) -> str:
    s = (name or "").strip().lower()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s).strip("-")
    return s or "untitled"


def get_project_root(project: dict[str, Any]) -> Path:
    """
    Root folder is always the *project name* inside a stable slug-based folder:
      data/projects/<slug>/<project_name>/
    """
    project_slug = project["slug"]
    project_name = _safe_name(project["name"])
    root = BASE_PROJECTS_DIR / project_slug / project_name
    root.mkdir(parents=True, exist_ok=True)
    return root


def _resolve_under_root(root: Path, rel_path: str) -> Path:
    """
    Prevent path traversal. rel_path is like "" or "Locations/Cities".
    """
    rel_path = (rel_path or "").strip().strip("/")
    candidate = (root / rel_path).resolve()
    root_resolved = root.resolve()

    if root_resolved not in candidate.parents and candidate != root_resolved:
        raise ValueError("Invalid path.")
    return candidate


def build_tree(root: Path) -> dict[str, Any]:
    """
    Recursively scan directories and markdown files.
    Returns a tree structure suitable for Jinja rendering.
    """
    def walk_dir(dir_path: Path, rel: str) -> dict[str, Any]:
        folders: list[dict[str, Any]] = []
        articles: list[dict[str, Any]] = []

        for p in sorted(dir_path.iterdir(), key=lambda x: (x.is_file(), x.name.lower())):
            if p.name.startswith("."):
                continue

            if p.is_dir():
                child_rel = f"{rel}/{p.name}".strip("/")
                folders.append(walk_dir(p, child_rel))

            elif p.is_file() and p.suffix.lower() == ".md":
                articles.append({
                    "title": p.stem,
                    "path": f"{rel}/{p.name}".strip("/"),
                })

        return {
            "name": dir_path.name,
            "path": rel,  # relative path from root, "" for root itself
            "folders": folders,
            "articles": articles,
        }

    return walk_dir(root, "")


def create_folder(project: dict[str, Any], parent_rel: str, folder_name: str) -> None:
    root = get_project_root(project)
    parent = _resolve_under_root(root, parent_rel)

    folder_name = _safe_name(folder_name)
    if not folder_name:
        raise ValueError("Folder name is required.")

    new_dir = parent / folder_name
    new_dir.mkdir(parents=True, exist_ok=False)


def create_article(project: dict[str, Any], parent_rel: str, title: str) -> Path:
    root = get_project_root(project)
    parent = _resolve_under_root(root, parent_rel)

    title = _safe_name(title)
    if not title:
        raise ValueError("Article title is required.")

    filename = f"{_slugify(title)}.md"
    target = parent / filename

    if target.exists():
        raise ValueError("An article with that name already exists in this folder.")

    target.write_text(f"# {title}\n\n", encoding="utf-8")
    return target
