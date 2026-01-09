from flask import Flask, render_template, request, redirect, url_for, abort
from services.project_store import load_projects, add_project, get_project_by_slug
from services.project_fs import get_project_root, build_tree, create_folder, create_article
from services.markdown_service import render_markdown_file


app = Flask(__name__)

@app.route("/")
def index():
    rendered_html = render_markdown_file("test.md")
    return render_template("index.html", rendered_html=rendered_html, active_page="index")

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



if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
