from flask import Flask, render_template, request, redirect, url_for
from services.project_store import load_projects, add_project
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
    return render_template("projects.html", active_page="projects", projects=projects)

@app.route("/projects/new", methods=["POST"])
def create_project():
    name = request.form.get("name", "")
    genre = request.form.get("genre", "")
    try:
        add_project(name, genre)
    except ValueError:
        # Keep it simple for now, later you can show inline errors in the modal
        return redirect(url_for("projects_overview"))
    return redirect(url_for("projects_overview"))

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
