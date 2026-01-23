"""Project management routes."""

from flask import Blueprint, render_template, request, redirect, url_for, abort
from services.project_store import load_projects, add_project, get_project_by_slug
from services.folder_store import get_folders_tree
from services.article_store import list_article_types

bp = Blueprint("projects", __name__, url_prefix="/projects")


@bp.route("/")
def projects_overview():
    """List all projects."""
    projects = load_projects()
    error = request.args.get("error")
    return render_template(
        "projects.html",
        active_page="projects",
        projects=projects,
        error=error,
    )


@bp.route("/new", methods=["POST"])
def create_project():
    """Create a new project."""
    name = request.form.get("name", "")
    genre = request.form.get("genre", "")
    try:
        add_project(name, genre)
        return redirect(url_for("projects.projects_overview"))
    except ValueError as e:
        return redirect(url_for("projects.projects_overview", error=str(e)))


@bp.route("/<slug>")
def project_home(slug: str):
    """Display project home and folder/article tree."""
    project = get_project_by_slug(slug)
    if not project:
        abort(404)

    tree = get_folders_tree(int(project["id"]))
    types = list_article_types()
    error = request.args.get("error")

    return render_template(
        "project.html",
        active_page="projects",
        project=project,
        tree=tree,
        types=types,
        error=error,
    )
