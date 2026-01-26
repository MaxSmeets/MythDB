"""Article management routes."""

from flask import Blueprint, render_template, request, redirect, url_for, abort
import markdown as md
from db import db_conn
from services.project_store import get_project_by_slug
from services.article_store import (
    create_article as db_create_article,
    get_article_full,
    update_article_content,
    delete_article,
    list_article_types,
)
from services.media_store import rewrite_media_urls
from services.markdown_service import process_article_links

bp = Blueprint("articles", __name__, url_prefix="/projects")


@bp.route("/<slug>/articles/new", methods=["POST"])
def create_article(slug: str):
    """Create a new article in a project."""
    project = get_project_by_slug(slug)
    if not project:
        abort(404)

    folder_id_str = request.form.get("folder_id", "")
    folder_id = int(folder_id_str) if folder_id_str else None
    
    title = request.form.get("title", "")
    type_key = request.form.get("type_key", "npc")

    try:
        project_id = int(project["id"])
        
        # Create with default markdown template
        body_content = f"# {title}\n\n"
        article = db_create_article(
            project_id=project_id,
            folder_id=folder_id,
            type_key=type_key,
            title=title,
            body_content=body_content,
        )

        return redirect(url_for("projects.project_home", slug=slug))

    except ValueError as e:
        return redirect(url_for("projects.project_home", slug=slug, error=str(e)))
    except Exception as e:
        return redirect(
            url_for("projects.project_home", slug=slug, error=f"Failed to create article: {e}")
        )


@bp.route("/<slug>/a/<int:article_id>")
def article_view(slug: str, article_id: int):
    """View a single article."""
    project = get_project_by_slug(slug)
    if not project:
        abort(404)

    article = get_article_full(article_id)
    if not article or article["project_id"] != int(project["id"]):
        abort(404)

    # Render markdown content
    raw_md = article["body_content"]
    # Process article links before markdown rendering
    raw_md = process_article_links(raw_md, project["slug"])
    rendered_html = md.markdown(
        raw_md,
        extensions=["tables", "fenced_code", "footnotes", "toc"],
    )
    rendered_html = rewrite_media_urls(rendered_html, project["slug"])

    return render_template(
        "article.html",
        active_page="projects",
        project=project,
        article=article,
        rendered_html=rendered_html,
    )


@bp.route("/<slug>/a/<int:article_id>/edit", methods=["POST"])
def edit_article(slug: str, article_id: int):
    """Update article content."""
    project = get_project_by_slug(slug)
    if not project:
        abort(404)

    article = get_article_full(article_id)
    if not article or article["project_id"] != int(project["id"]):
        abort(404)

    body_content = request.form.get("body_content", "")
    
    try:
        update_article_content(article_id, body_content)
        return redirect(url_for("articles.article_view", slug=slug, article_id=article_id))
    except Exception as e:
        return redirect(
            url_for("articles.article_view", slug=slug, article_id=article_id, error=str(e))
        )


@bp.route("/<slug>/a/<int:article_id>/delete", methods=["POST"])
def delete_article_route(slug: str, article_id: int):
    """Delete an article."""
    project = get_project_by_slug(slug)
    if not project:
        abort(404)

    article = get_article_full(article_id)
    if not article or article["project_id"] != int(project["id"]):
        abort(404)

    try:
        delete_article(article_id)
        return redirect(url_for("projects.project_home", slug=slug))
    except Exception as e:
        return redirect(url_for("projects.project_home", slug=slug, error=str(e)))
