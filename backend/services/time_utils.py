from datetime import datetime, timezone
from typing import Tuple


def format_timestamp_with_relative(iso_timestamp: str) -> Tuple[str, str]:
    """
    Format an ISO timestamp into:
    1. Clean date/time format: "Jan 27, 2026 at 2:30 PM"
    2. Relative time: "2 hours ago" or "3 days ago"
    
    Returns a tuple of (clean_time, relative_time)
    """
    try:
        # Parse ISO timestamp
        dt = datetime.fromisoformat(iso_timestamp.replace('Z', '+00:00'))
        now = datetime.now(tz=timezone.utc)
        
        # Calculate time difference
        delta = now - dt
        total_seconds = delta.total_seconds()
        
        # Format clean time
        clean_time = dt.strftime("%b %d, %Y at %I:%M %p")
        
        # Calculate relative time
        if total_seconds < 60:
            relative = "just now"
        elif total_seconds < 3600:  # Less than 1 hour
            minutes = int(total_seconds // 60)
            relative = f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        elif total_seconds < 86400:  # Less than 1 day
            hours = int(total_seconds // 3600)
            relative = f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif total_seconds < 2592000:  # Less than 30 days
            days = int(total_seconds // 86400)
            relative = f"{days} day{'s' if days != 1 else ''} ago"
        elif total_seconds < 31536000:  # Less than 1 year
            months = int(total_seconds // 2592000)
            relative = f"{months} month{'s' if months != 1 else ''} ago"
        else:
            years = int(total_seconds // 31536000)
            relative = f"{years} year{'s' if years != 1 else ''} ago"
        
        return (clean_time, relative)
    
    except Exception:
        # Fallback if parsing fails
        return (iso_timestamp, "unknown")
