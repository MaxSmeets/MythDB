from __future__ import annotations

from pathlib import Path
import markdown as md
import re
from config import DATA_DIR
from db import db_conn


# Keep extensions centralized so you don’t repeat config everywhere
DEFAULT_MD_EXTENSIONS = [
    "tables",
    "fenced_code",
    "footnotes",
    "toc"
]


def render_markdown_file(path: str | Path, *, extensions=None) -> str:
    """
    Read a markdown file from disk and return HTML.

    - Does not know anything about Flask routes or templates.
    - Returns a safe-ish HTML string (you still decide where to mark it safe in Jinja).
    """
    p = Path(DATA_DIR / path)

    if not p.exists():
        # Return HTML so you can display it directly
        return f"<h1>Missing file</h1><p>Could not find: <code>{p}</code></p>"

    raw_md = p.read_text(encoding="utf-8")

    return md.markdown(
        raw_md,
        extensions=extensions or DEFAULT_MD_EXTENSIONS,
    )


def process_article_links(markdown_content: str, project_slug: str) -> str:
    """
    Convert article reference links from markdown format to proper links.
    
    Transforms:
      [Article Title](article:article-slug) 
    Into:
      [Article Title](/projects/project-slug/a/article-id)
    
    Invalid article slugs are left as-is and will appear as broken links.
    """
    def replace_article_link(match):
        title = match.group(1)
        slug = match.group(2)
        
        # Look up article ID by slug in the project
        with db_conn() as conn:
            row = conn.execute(
                """
                SELECT a.id FROM articles a
                JOIN projects p ON a.project_id = p.id
                WHERE p.slug = ? AND a.slug = ?
                LIMIT 1;
                """,
                (project_slug, slug),
            ).fetchone()
        
        if row:
            article_id = row["id"]
            return f"[{title}](/projects/{project_slug}/a/{article_id})"
        else:
            # Keep the original format if article not found
            return match.group(0)
    
    # Replace [text](article:slug) with proper links
    pattern = r'\[([^\]]+)\]\(article:([a-z0-9-]+)\)'
    return re.sub(pattern, replace_article_link, markdown_content)
