from flask import Flask
from schema import init_schema
from config import get_config
from routes import register_blueprints


def create_app():
    """Application factory function."""
    config = get_config()
    
    app = Flask(__name__)
    app.config.from_object(config)
    
    # Initialize database schema
    init_schema()
    
    # Register all blueprints
    register_blueprints(app)
    
    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=app.config["DEBUG"])
