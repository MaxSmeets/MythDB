"""Page routes - static pages and dashboard."""

from flask import Blueprint, render_template

bp = Blueprint("pages", __name__)


@bp.route("/")
def index():
    """Render landing page."""
    return render_template("index.html", active_page=None)


@bp.route("/admin")
def admin_dashboard():
    """Render admin dashboard."""
    return render_template("admin.html", active_page="admin")
