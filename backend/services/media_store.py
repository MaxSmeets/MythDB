from __future__ import annotations

import re
from pathlib import Path
from typing import Any
from werkzeug.utils import secure_filename

from services.project_fs import get_project_dir


ALLOWED_IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}  # keep it simple for v0


def get_media_dir(project: dict[str, Any]) -> Path:
    root = get_project_dir(project)
    media_dir = root / "media"
    media_dir.mkdir(parents=True, exist_ok=True)
    return media_dir


def is_allowed_image(filename: str) -> bool:
    ext = Path(filename).suffix.lower()
    return ext in ALLOWED_IMAGE_EXTS


def _dedupe_filename(target_dir: Path, filename: str) -> str:
    """
    If filename exists, create filename-2.ext, filename-3.ext, ...
    """
    base = Path(filename).stem
    ext = Path(filename).suffix
    candidate = filename
    i = 2
    while (target_dir / candidate).exists():
        candidate = f"{base}-{i}{ext}"
        i += 1
    return candidate


def save_uploaded_image(project: dict[str, Any], file_storage) -> str:
    """
    Saves an uploaded file into the project's media folder.
    Returns the saved filename (relative in media dir).
    """
    if not file_storage or not file_storage.filename:
        raise ValueError("No file selected.")

    filename = secure_filename(file_storage.filename)
    if not filename:
        raise ValueError("Invalid filename.")

    if not is_allowed_image(filename):
        raise ValueError("Unsupported file type. Upload PNG, JPG, JPEG, WEBP, or GIF.")

    media_dir = get_media_dir(project)

    filename = _dedupe_filename(media_dir, filename)
    file_storage.save(media_dir / filename)
    return filename


def list_media(project: dict[str, Any]) -> list[dict[str, str]]:
    media_dir = get_media_dir(project)
    items = []
    for p in sorted(media_dir.iterdir(), key=lambda x: x.name.lower()):
        if p.is_file() and p.suffix.lower() in ALLOWED_IMAGE_EXTS:
            items.append({"filename": p.name})
    return items
