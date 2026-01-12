from flask import Flask, render_template, request, redirect, url_for, abort, send_from_directory
from schema import init_schema
from services.project_store import load_projects, add_project, get_project_by_slug
from services.project_fs import get_project_root, build_tree, create_folder, create_article
from services.media_store import list_media, save_uploaded_image, get_media_dir


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

    root = get_project_root(project)
    tree = build_tree(root)

    error = request.args.get("error")
    return render_template("project.html", active_page="projects", project=project, tree=tree, error=error)

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

    parent = request.form.get("parent", "")
    title = request.form.get("title", "")

    try:
        create_article(project, parent, title)
        return redirect(url_for("project_home", slug=slug))
    except ValueError as e:
        return redirect(url_for("project_home", slug=slug, error=str(e)))

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

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
