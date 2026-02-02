"""Project management routes."""

from flask import Blueprint, render_template, request, redirect, url_for, abort, jsonify
import markdown as md
from services.project_store import load_projects, add_project, get_project_by_slug, _get_project_statistics, update_project_description
from services.folder_store import get_folders_tree
from services.article_store import list_article_types
from services.media_store import rewrite_media_urls
from services.markdown_service import process_article_links
from db import db_conn

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

    # Render project description markdown
    raw_md = project.get("description", "")
    if raw_md:
        raw_md = process_article_links(raw_md, slug)
        rendered_html = md.markdown(
            raw_md,
            extensions=["tables", "fenced_code", "footnotes", "toc"],
        )
    else:
        rendered_html = ""
        
    rendered_html = rewrite_media_urls(rendered_html, slug)
    project["rendered_description"] = rendered_html

    tree = get_folders_tree(int(project["id"]))
    types = list_article_types()
    stats = _get_project_statistics(int(project["id"]))
    error = request.args.get("error")

    return render_template(
        "project.html",
        active_page="projects",
        project=project,
        tree=tree,
        types=types,
        stats=stats,
        error=error,
    )

@bp.route("/<slug>/api/articles", methods=["GET"])
def get_project_articles_api(slug: str):
    """API endpoint to get all articles in a project for linking.
    
    Optional query parameter:
      - exclude_id: Article ID to exclude (for excluding current article)
    
    Returns JSON list of articles with id, slug, title, type_name.
    """
    project = get_project_by_slug(slug)
    if not project:
        abort(404)
    
    exclude_id = request.args.get("exclude_id", type=int)
    
    with db_conn() as conn:
        query = """
            SELECT a.id, a.slug, a.title, t.name AS type_name
            FROM articles a
            JOIN article_types t ON a.type_id = t.id
            WHERE a.project_id = ?
        """
        params = [int(project["id"])]
        
        if exclude_id:
            query += " AND a.id != ?"
            params.append(exclude_id)
        
        query += " ORDER BY a.title ASC;"
        
        rows = conn.execute(query, params).fetchall()
        articles = [dict(r) for r in rows]
    
    return jsonify(articles)


@bp.route("/<slug>/api/media", methods=["GET"])
def get_project_media_api(slug: str):
    """API endpoint to get all media files in a project.
    
    Returns JSON list of media files with filename.
    """
    project = get_project_by_slug(slug)
    if not project:
        abort(404)
    
    from pathlib import Path
    media_dir = Path("data/projects") / project["slug"] / "media"
    
    media_files = []
    if media_dir.exists():
        allowed_exts = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
        for file_path in sorted(media_dir.iterdir()):
            if file_path.is_file() and file_path.suffix.lower() in allowed_exts:
                media_files.append({
                    "filename": file_path.name,
                    "url": f"/projects/{project['slug']}/media/files/{file_path.name}"
                })
    
    return jsonify(media_files)

@bp.route("/<slug>/edit", methods=["POST"])
def edit_project(slug: str):
    """Update project description (markdown content)."""
    project = get_project_by_slug(slug)
    if not project:
        abort(404)

    description = request.form.get("description", "")
    
    try:
        update_project_description(int(project["id"]), description)
        return redirect(url_for("projects.project_home", slug=slug))
    except Exception as e:
        return redirect(
            url_for("projects.project_home", slug=slug, error=str(e))
        )

