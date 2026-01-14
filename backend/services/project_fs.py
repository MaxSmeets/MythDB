from __future__ import annotations

import re
from pathlib import Path
from typing import Any

BASE_PROJECTS_DIR = Path("data/projects")
RESERVED_DIRS = {"media", ".mythdb", "_cache", "__pycache__"}  # still useful for content scans


def _safe_name(name: str) -> str:
    name = (name or "").strip()
    name = re.sub(r"\s+", " ", name)
    return name


def _slugify(name: str) -> str:
    s = (name or "").strip().lower()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s).strip("-")
    return s or "untitled"


def get_project_dir(project: dict[str, Any]) -> Path:
    """
    Stable project folder that does NOT depend on mutable display name.
      data/projects/<slug>/
    """
    project_slug = project["slug"]
    root = BASE_PROJECTS_DIR / project_slug
    root.mkdir(parents=True, exist_ok=True)
    return root


def get_content_root(project: dict[str, Any]) -> Path:
    """
    User-managed content root:
      data/projects/<slug>/content/
    """
    root = get_project_dir(project)
    content = root / "content"
    content.mkdir(parents=True, exist_ok=True)
    return content


def _resolve_under_root(root: Path, rel_path: str) -> Path:
    """
    Prevent path traversal. rel_path is like "" or "Locations/Cities".
    Also blocks reserved top-level folders.
    """
    rel_path = (rel_path or "").strip().strip("/")

    if rel_path:
        top = rel_path.split("/", 1)[0]
        if top in RESERVED_DIRS:
            raise ValueError("That folder is reserved by MythDB.")

    candidate = (root / rel_path).resolve()
    root_resolved = root.resolve()

    if root_resolved not in candidate.parents and candidate != root_resolved:
        raise ValueError("Invalid path.")
    return candidate


def build_tree(root: Path) -> dict[str, Any]:
    """
    Recursively scan directories and markdown files.
    Intended to be called with content root.
    """
    def walk_dir(dir_path: Path, rel: str) -> dict[str, Any]:
        folders: list[dict[str, Any]] = []
        articles: list[dict[str, Any]] = []

        for p in sorted(dir_path.iterdir(), key=lambda x: (x.is_file(), x.name.lower())):
            if p.name.startswith("."):
                continue

            if p.is_dir():
                if p.name in RESERVED_DIRS:
                    continue
                child_rel = f"{rel}/{p.name}".strip("/")
                folders.append(walk_dir(p, child_rel))

            elif p.is_file() and p.suffix.lower() == ".md":
                articles.append({
                    "title": p.stem,
                    "path": f"{rel}/{p.name}".strip("/"),
                })

        return {
            "name": dir_path.name,
            "path": rel,
            "folders": folders,
            "articles": articles,
        }

    return walk_dir(root, "")


def create_folder(project: dict[str, Any], parent_rel: str, folder_name: str) -> None:
    root = get_content_root(project)
    parent = _resolve_under_root(root, parent_rel)

    folder_name = _safe_name(folder_name)
    if not folder_name:
        raise ValueError("Folder name is required.")

    new_dir = parent / folder_name
    new_dir.mkdir(parents=True, exist_ok=False)


def create_article(project: dict[str, Any], parent_rel: str, title: str) -> Path:
    root = get_content_root(project)
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

def article_body_path(project: dict[str, Any], parent_rel: str, article_slug: str) -> str:
    """
    Returns a project-relative path to the markdown body file, under content/.
    Example: content/Locations/Cities/ashfall.md
    """
    parent_rel = (parent_rel or "").strip().strip("/")
    parts = ["content"]
    if parent_rel:
        parts.append(parent_rel)
    parts.append(f"{article_slug}.md")
    return "/".join(parts)

def write_article_stub(project: dict[str, Any], body_path: str, title: str) -> Path:
    """
    Writes the markdown file stub under the project's root.
    body_path is project-relative (e.g. content/foo/bar.md).
    """
    project_dir = get_project_dir(project)
    target = (project_dir / body_path).resolve()

    # Ensure we do not escape project_dir
    root_resolved = project_dir.resolve()
    if root_resolved not in target.parents:
        raise ValueError("Invalid body path.")

    target.parent.mkdir(parents=True, exist_ok=True)

    if target.exists():
        raise ValueError("Body file already exists.")

    target.write_text(f"# {title}\n\n", encoding="utf-8")
    return target
