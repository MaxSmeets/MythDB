import markdown
from flask import Flask, render_template
from pathlib import Path

app = Flask(__name__)

@app.route("/")
def index():
    md_path = Path("../data/test.md")

    if md_path.exists():
        raw_md = md_path.read_text(encoding="utf-8")
        html = markdown.markdown(raw_md, extensions=["fenced_code"])
    else:
        html = "<p><strong>data/test.md not found</strong></p>"

    return render_template(
        "index.html",
        rendered_html=html,
        active_page="index"
    )

@app.route("/admin")
def admin_dashboard():
    return render_template("admin.html", active_page="admin")

@app.route("/projects")
def projects_overview():
    return render_template("projects.html", active_page="projects")

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
