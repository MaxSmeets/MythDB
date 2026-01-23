"""Route blueprints for the application."""

from flask import Blueprint
from . import pages, projects, articles, media, folders


def register_blueprints(app):
    """Register all blueprints with the Flask app."""
    app.register_blueprint(pages.bp)
    app.register_blueprint(projects.bp)
    app.register_blueprint(articles.bp)
    app.register_blueprint(media.bp)
    app.register_blueprint(folders.bp)
