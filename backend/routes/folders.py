"""Folder management routes."""

from flask import Blueprint, request, redirect, url_for, abort
from services.project_store import get_project_by_slug
from services.folder_store import create_folder, delete_folder

bp = Blueprint("folders", __name__, url_prefix="/projects")


@bp.route("/<slug>/folders/new", methods=["POST"])
def create_folder_route(slug: str):
    """Create a new folder in a project."""
    project = get_project_by_slug(slug)
    if not project:
        abort(404)

    parent_id_str = request.form.get("parent_id", "")
    parent_id = int(parent_id_str) if parent_id_str else None
    
    name = request.form.get("name", "")

    try:
        create_folder(int(project["id"]), parent_id, name)
        return redirect(url_for("projects.project_home", slug=slug))
    except ValueError as e:
        return redirect(url_for("projects.project_home", slug=slug, error=str(e)))


@bp.route("/<slug>/folders/<int:folder_id>/delete", methods=["POST"])
def delete_folder_route(slug: str, folder_id: int):
    """Delete a folder and cascade-delete its contents."""
    project = get_project_by_slug(slug)
    if not project:
        abort(404)

    try:
        delete_folder(folder_id)
        return redirect(url_for("projects.project_home", slug=slug))
    except ValueError as e:
        return redirect(url_for("projects.project_home", slug=slug, error=str(e)))
