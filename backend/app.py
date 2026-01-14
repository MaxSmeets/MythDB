from flask import Flask, render_template, request, redirect, url_for, abort, send_from_directory
from pathlib import Path
import markdown as md
from schema import init_schema
from services.project_store import load_projects, add_project, get_project_by_slug
from services.project_fs import get_project_dir, get_content_root, build_tree, create_folder, article_body_path, write_article_stub
from services.media_store import list_media, save_uploaded_image, get_media_dir
from services.article_store import list_article_types, create_article as db_create_article, get_article_by_id
import re

def rewrite_media_urls(html: str, project_slug: str) -> str:
    """
    Rewrite relative media references from markdown:
      src="media/foo.png" -> src="/projects/<slug>/media/files/foo.png"
    """
    return re.sub(
        r'src="media/([^"]+)"',
        f'src="/projects/{project_slug}/media/files/\\1"',
        html
    )

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB
init_schema()

@app.route("/")
def index():
    return render_template("index.html", active_page=None)

@app.route("/admin")
def admin_dashboard():
    return render_template("admin.html", active_page="admin")

@app.route("/projects")
def projects_overview():
    projects = load_projects()
    error = request.args.get("error")
    return render_template("projects.html", active_page="projects", projects=projects, error=error)

@app.route("/projects/new", methods=["POST"])
def create_project():
    name = request.form.get("name", "")
    genre = request.form.get("genre", "")
    try:
        add_project(name, genre)
        return redirect(url_for("projects_overview"))
    except ValueError as e:
        return redirect(url_for("projects_overview", error=str(e)))

@app.route("/projects/<slug>")
def project_home(slug: str):
    project = get_project_by_slug(slug)
    if not project:
        abort(404)

    content_root = get_content_root(project)
    tree = build_tree(content_root)

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

@app.route("/projects/<slug>/folders/new", methods=["POST"])
def project_create_folder(slug: str):
    project = get_project_by_slug(slug)
    if not project:
        abort(404)

    parent = request.form.get("parent", "")
    name = request.form.get("name", "")

    try:
        create_folder(project, parent, name)
        return redirect(url_for("project_home", slug=slug))
    except ValueError as e:
        return redirect(url_for("project_home", slug=slug, error=str(e)))


@app.route("/projects/<slug>/articles/new", methods=["POST"])
def project_create_article(slug: str):
    project = get_project_by_slug(slug)
    if not project:
        abort(404)

    parent_rel = request.form.get("parent", "")
    title = request.form.get("title", "")
    type_key = request.form.get("type_key", "npc")

    try:
        # 1) Create DB row (article_slug computed inside store)
        # We need project_id from the project dict (SQLite projects store must include id)
        project_id = int(project["id"])

        # compute body path using the *final* slug after DB creation:
        # We first create with a temporary body_path, then update? Let's avoid that.
        # Instead: compute base slug here, ask store for unique slug? We'll keep it simple:
        # create_article returns the final slug, so we can build body_path after insert,
        # then update the row's body_path. We'll do that update in one small step.

        # Create with placeholder path first
        placeholder_path = "content/__pending__.md"
        article = db_create_article(
            project_id=project_id,
            type_key=type_key,
            title=title,
            body_path=placeholder_path,
        )

        # 2) Now that we have final article slug, compute real body_path
        body_path = article_body_path(project, parent_rel, article["slug"])

        # 3) Update DB with real body_path
        from db import db_conn
        with db_conn() as conn:
            conn.execute("UPDATE articles SET body_path = ?, updated_at = updated_at WHERE id = ?;",
                         (body_path, article["id"]))

        # 4) Write markdown stub on disk
        write_article_stub(project, body_path, article["title"])

        return redirect(url_for("project_home", slug=slug))

    except ValueError as e:
        return redirect(url_for("project_home", slug=slug, error=str(e)))
    except Exception as e:
        # If file write fails, you may end up with a DB row but no file.
        # For v0, surface error; later we can add a cleanup routine/transaction strategy.
        return redirect(url_for("project_home", slug=slug, error=f"Failed to create article: {e}"))


@app.route("/projects/<slug>/media")
def project_media(slug: str):
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


@app.route("/projects/<slug>/media/upload", methods=["POST"])
def project_media_upload(slug: str):
    project = get_project_by_slug(slug)
    if not project:
        abort(404)

    file = request.files.get("file")
    try:
        save_uploaded_image(project, file)
        return redirect(url_for("project_media", slug=slug))
    except ValueError as e:
        return redirect(url_for("project_media", slug=slug, error=str(e)))


@app.route("/projects/<slug>/media/files/<path:filename>")
def project_media_file(slug: str, filename: str):
    project = get_project_by_slug(slug)
    if not project:
        abort(404)

    media_dir = get_media_dir(project)
    # send_from_directory safely serves only within that directory
    return send_from_directory(media_dir, filename)

@app.route("/projects/<slug>/a/<path:path>")
def project_article_view(slug: str, path: str):
    project = get_project_by_slug(slug)
    if not project:
        abort(404)

    # Map filesystem path (relative under content) -> body_path in DB
    body_path = f"content/{path}".replace("\\", "/")

    from db import db_conn
    with db_conn() as conn:
        row = conn.execute(
            """
            SELECT a.id, a.project_id, a.slug, a.title, a.body_path, a.created_at, a.updated_at,
                   t.key AS type_key, t.name AS type_name
            FROM articles a
            JOIN article_types t ON t.id = a.type_id
            WHERE a.project_id = ? AND a.body_path = ?
            LIMIT 1;
            """,
            (int(project["id"]), body_path),
        ).fetchone()

    if not row:
        abort(404)

    article = dict(row)

    # Read markdown from disk and render
    project_dir = get_project_dir(project)
    md_file = (project_dir / article["body_path"]).resolve()

    if not md_file.exists():
        # still show metadata but warn
        rendered_html = "<p><strong>Body file missing.</strong></p>"
    else:
        raw_md = md_file.read_text(encoding="utf-8")
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



if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
