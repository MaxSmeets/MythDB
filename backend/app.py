from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def admin_dashboard():
    return render_template("admin.html", active_page="admin")

@app.route("/projects")
def projects_overview():
    return render_template("projects.html", active_page="projects")

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)
