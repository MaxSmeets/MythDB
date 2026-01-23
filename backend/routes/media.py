"""Media management routes."""

from flask import Blueprint, render_template, request, redirect, url_for, abort, send_from_directory
from services.project_store import get_project_by_slug
from services.media_store import list_media, save_uploaded_image, get_media_dir

bp = Blueprint("media", __name__, url_prefix="/projects")


@bp.route("/<slug>/media")
def project_media(slug: str):
    """List all media in a project."""
    project = get_project_by_slug(slug)
    if not project:
        abort(404)

    error = request.args.get("error")
    items = list_media(project)
    return render_template(
        "media.html",
        active_page="projects",
        project=project,
        items=items,
        error=error,
    )


@bp.route("/<slug>/media/upload", methods=["POST"])
def media_upload(slug: str):
    """Upload a new media file to a project."""
    project = get_project_by_slug(slug)
    if not project:
        abort(404)

    file = request.files.get("file")
    try:
        save_uploaded_image(project, file)
        return redirect(url_for("media.project_media", slug=slug))
    except ValueError as e:
        return redirect(url_for("media.project_media", slug=slug, error=str(e)))


@bp.route("/<slug>/media/files/<path:filename>")
def media_file(slug: str, filename: str):
    """Serve a media file from a project."""
    project = get_project_by_slug(slug)
    if not project:
        abort(404)

    media_dir = get_media_dir(project)
    # send_from_directory safely serves only within that directory
    return send_from_directory(media_dir, filename)
