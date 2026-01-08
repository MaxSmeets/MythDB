from flask import Flask, render_template
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
    return render_template("projects.html", active_page="projects")

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
