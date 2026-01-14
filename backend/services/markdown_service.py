from __future__ import annotations

from pathlib import Path
import markdown as md
from config import DATA_DIR


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
