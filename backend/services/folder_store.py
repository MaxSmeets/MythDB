"""Folder management service - organizes articles hierarchically in the database."""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Optional

from db import db_conn


def slugify(text: str) -> str:
    """Convert folder name to URL-safe slug."""
    s = (text or "").strip().lower()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s).strip("-")
    return s or "folder"


def _folder_slug_exists(project_id: int, parent_id: Optional[int], slug: str) -> bool:
    """Check if a folder with this slug already exists in the same parent."""
    with db_conn() as conn:
        row = conn.execute(
            "SELECT 1 FROM folders WHERE project_id = ? AND parent_id IS ? AND slug = ? LIMIT 1;",
            (project_id, parent_id, slug),
        ).fetchone()
    return row is not None


def unique_folder_slug(project_id: int, parent_id: Optional[int], base_slug: str) -> str:
    """Generate a unique slug for a folder within its parent."""
    if not _folder_slug_exists(project_id, parent_id, base_slug):
        return base_slug

    i = 2
    while True:
        candidate = f"{base_slug}-{i}"
        if not _folder_slug_exists(project_id, parent_id, candidate):
            return candidate
        i += 1


def create_folder(
    project_id: int,
    parent_id: Optional[int],
    name: str,
) -> dict[str, Any]:
    """
    Create a folder in the database.
    
    Args:
        project_id: The project this folder belongs to
        parent_id: Parent folder ID (None for root level)
        name: Display name of the folder
    
    Returns:
        Created folder dict with id, name, slug, etc.
    """
    name = (name or "").strip()
    if not name:
        raise ValueError("Folder name is required.")

    # Verify project exists
    with db_conn() as conn:
        project_row = conn.execute(
            "SELECT id FROM projects WHERE id = ? LIMIT 1;",
            (project_id,),
        ).fetchone()
    
    if not project_row:
        raise ValueError("Project not found.")

    # If parent_id provided, verify it exists and belongs to this project
    if parent_id is not None:
        with db_conn() as conn:
            parent_row = conn.execute(
                "SELECT id FROM folders WHERE id = ? AND project_id = ? LIMIT 1;",
                (parent_id, project_id),
            ).fetchone()
        
        if not parent_row:
            raise ValueError("Parent folder not found or does not belong to this project.")

    now = datetime.now(tz=timezone.utc).isoformat()
    base_slug = slugify(name)
    slug = unique_folder_slug(project_id, parent_id, base_slug)

    with db_conn() as conn:
        conn.execute(
            """
            INSERT INTO folders (project_id, parent_id, name, slug, created_at)
            VALUES (?, ?, ?, ?, ?);
            """,
            (project_id, parent_id, name, slug, now),
        )
        row = conn.execute(
            """
            SELECT id, project_id, parent_id, name, slug, created_at
            FROM folders
            WHERE project_id = ? AND parent_id IS ? AND slug = ?
            LIMIT 1;
            """,
            (project_id, parent_id, slug),
        ).fetchone()

    return dict(row)


def get_folder_by_id(folder_id: int) -> Optional[dict[str, Any]]:
    """Get a single folder by ID."""
    with db_conn() as conn:
        row = conn.execute(
            "SELECT id, project_id, parent_id, name, slug, created_at FROM folders WHERE id = ? LIMIT 1;",
            (folder_id,),
        ).fetchone()
    return dict(row) if row else None


def get_folders_tree(project_id: int) -> dict[str, Any]:
    """
    Build a hierarchical tree of folders for a project.
    Returns a nested dict structure suitable for rendering in templates.
    """
    with db_conn() as conn:
        # Fetch all folders for this project
        folders = conn.execute(
            "SELECT id, parent_id, name, slug FROM folders WHERE project_id = ? ORDER BY name ASC;",
            (project_id,),
        ).fetchall()
        
        # Fetch all articles with their folder associations
        articles = conn.execute(
            """
            SELECT a.id, a.folder_id, a.title, a.slug, a.created_at
            FROM articles a
            WHERE a.project_id = ?
            ORDER BY a.created_at DESC;
            """,
            (project_id,),
        ).fetchall()

    # Convert to dicts
    folder_list = [dict(f) for f in folders]
    article_list = [dict(a) for a in articles]

    # Group articles by folder_id
    articles_by_folder = {}
    for article in article_list:
        folder_id = article["folder_id"]
        if folder_id not in articles_by_folder:
            articles_by_folder[folder_id] = []
        articles_by_folder[folder_id].append(article)

    # Build nested structure
    def build_tree_recursive(parent_id: Optional[int]) -> dict[str, Any]:
        # Get immediate children of this parent
        children = [f for f in folder_list if f["parent_id"] == parent_id]
        
        return {
            "folders": [
                {
                    "id": child["id"],
                    "name": child["name"],
                    "slug": child["slug"],
                    "articles": articles_by_folder.get(child["id"], []),
                    **build_tree_recursive(child["id"]),
                }
                for child in children
            ]
        }

    # Root level (parent_id = None)
    tree_data = build_tree_recursive(None)
    
    # Add root articles (articles with folder_id = None)
    root_articles = articles_by_folder.get(None, [])
    
    return {
        "id": None,
        "name": "Root",
        "articles": root_articles,
        "folders": tree_data["folders"],
    }


def list_articles_in_folder(folder_id: Optional[int], project_id: int) -> list[dict[str, Any]]:
    """
    List all articles in a specific folder.
    If folder_id is None, lists root-level articles.
    """
    with db_conn() as conn:
        rows = conn.execute(
            """
            SELECT a.id, a.slug, a.title, a.folder_id, a.created_at, a.updated_at,
                   t.name AS type_name
            FROM articles a
            JOIN article_types t ON t.id = a.type_id
            WHERE a.project_id = ? AND a.folder_id IS ?
            ORDER BY a.created_at DESC;
            """,
            (project_id, folder_id),
        ).fetchall()
    return [dict(r) for r in rows]


def delete_folder(folder_id: int) -> None:
    """
    Delete a folder only if it's empty (no articles or subfolders).
    
    Args:
        folder_id: The folder to delete
        
    Raises:
        ValueError: If folder is not found or is not empty
    """
    folder = get_folder_by_id(folder_id)
    if not folder:
        raise ValueError("Folder not found.")
    
    with db_conn() as conn:
        # Check if folder has any articles
        articles = conn.execute(
            "SELECT COUNT(*) as count FROM articles WHERE folder_id = ?;",
            (folder_id,),
        ).fetchone()
        
        if articles and articles['count'] > 0:
            raise ValueError(f"Cannot delete folder '{folder['name']}' - it contains {articles['count']} article(s). Please delete all articles first.")
        
        # Check if folder has any subfolders
        subfolders = conn.execute(
            "SELECT COUNT(*) as count FROM folders WHERE parent_id = ?;",
            (folder_id,),
        ).fetchone()
        
        if subfolders and subfolders['count'] > 0:
            raise ValueError(f"Cannot delete folder '{folder['name']}' - it contains {subfolders['count']} subfolder(s). Please delete all subfolders first.")
        
        # Folder is empty, safe to delete
        conn.execute("DELETE FROM folders WHERE id = ?;", (folder_id,))


def rename_folder(folder_id: int, new_name: str) -> dict[str, Any]:
    """
    Rename a folder.
    
    Args:
        folder_id: The folder to rename
        new_name: The new name for the folder
    
    Returns:
        Updated folder dict
        
    Raises:
        ValueError: If folder not found or name is empty
    """
    folder = get_folder_by_id(folder_id)
    if not folder:
        raise ValueError("Folder not found.")
    
    new_name = (new_name or "").strip()
    if not new_name:
        raise ValueError("Folder name is required.")
    
    new_base_slug = slugify(new_name)
    new_slug = unique_folder_slug(folder["project_id"], folder["parent_id"], new_base_slug)
    
    with db_conn() as conn:
        conn.execute(
            "UPDATE folders SET name = ?, slug = ? WHERE id = ?;",
            (new_name, new_slug, folder_id),
        )
        row = conn.execute(
            "SELECT id, project_id, parent_id, name, slug, created_at FROM folders WHERE id = ? LIMIT 1;",
            (folder_id,),
        ).fetchone()
    
    return dict(row)
