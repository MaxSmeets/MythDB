"""Search API routes."""
from flask import Blueprint, request, jsonify, url_for
from db import db_conn
from services.media_store import list_media
import re

bp = Blueprint('search', __name__, url_prefix='/api')


def extract_text_excerpt(markdown_text, query, max_length=150):
    """Extract a clean text excerpt from markdown, preserving inline formatting."""
    if not markdown_text:
        return None
    
    # Remove code blocks first
    text = re.sub(r'```[\s\S]*?```', '', markdown_text)
    text = re.sub(r'`[^`]+`', '', text)
    
    # Remove headers but keep the text
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
    
    # Remove list markers but keep the text
    text = re.sub(r'^\s*[-*+]\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\d+\.\s+', '', text, flags=re.MULTILINE)
    
    # Remove blockquotes markers but keep text
    text = re.sub(r'^>\s+', '', text, flags=re.MULTILINE)
    
    # Remove horizontal rules
    text = re.sub(r'^---+$', '', text, flags=re.MULTILINE)
    
    # Remove image syntax but keep alt text
    text = re.sub(r'!\[([^\]]*)\]\([^\)]+\)', r'\1', text)
    
    # Convert links to just the text
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    
    # Clean up multiple newlines
    text = re.sub(r'\n\s*\n+', ' ', text)
    
    # Remove leading/trailing whitespace
    text = text.strip()
    
    # Find excerpt around the query match if possible
    if query:
        query_lower = query.lower()
        text_lower = text.lower()
        match_pos = text_lower.find(query_lower)
        
        if match_pos != -1:
            # Extract context around the match
            start = max(0, match_pos - 50)
            end = min(len(text), match_pos + max_length)
            excerpt = text[start:end].strip()
            if start > 0:
                excerpt = '...' + excerpt
            if end < len(text):
                excerpt = excerpt + '...'
            return excerpt
    
    # Otherwise just take the beginning
    if len(text) > max_length:
        return text[:max_length].strip() + '...'
    return text


@bp.route('/search')
def search():
    """Global search across projects and articles."""
    query = request.args.get('q', '').strip()
    
    if not query:
        return jsonify({'results': [], 'query': query})
    
    results = []
    
    # Search query pattern
    search_pattern = f'%{query}%'
    
    with db_conn() as db:
        # Search projects
        projects = db.execute(
            '''
            SELECT id, name, slug, genre, description
            FROM projects
            WHERE name LIKE ? OR description LIKE ? OR genre LIKE ?
            ORDER BY name
            LIMIT 10
            ''',
            (search_pattern, search_pattern, search_pattern)
        ).fetchall()
        
        for project in projects:
            excerpt = extract_text_excerpt(project['description'], query, 150) if project['description'] else None
            results.append({
                'title': project['name'],
                'type': 'Project',
                'url': url_for('projects.project_home', slug=project['slug']),
                'excerpt': excerpt,
                'project': None
            })
        
        # Search articles
        articles = db.execute(
            '''
            SELECT 
                a.id,
                a.title,
                a.slug,
                a.body_content,
                p.name as project_name,
                p.slug as project_slug,
                at.name as type_name
            FROM articles a
            JOIN projects p ON a.project_id = p.id
            LEFT JOIN article_types at ON a.type_id = at.id
            WHERE a.title LIKE ? OR a.body_content LIKE ? OR at.name LIKE ?
            ORDER BY a.title
            LIMIT 20
            ''',
            (search_pattern, search_pattern, search_pattern)
        ).fetchall()
        
        for article in articles:
            # Create excerpt from body content
            excerpt = extract_text_excerpt(article['body_content'], query, 150) if article['body_content'] else None
            
            results.append({
                'title': article['title'],
                'type': article['type_name'] or 'Article',
                'url': url_for('articles.article_view', slug=article['project_slug'], article_id=article['id']),
                'excerpt': excerpt,
                'project': article['project_name']
            })
        
        # Search media files
        # Get all projects to search their media
        all_projects = db.execute('SELECT id, name, slug FROM projects').fetchall()
        
        for project in all_projects:
            media_items = list_media(project)
            
            for item in media_items:
                filename = item['filename']
                # Check if filename matches the query
                if query.lower() in filename.lower():
                    results.append({
                        'title': filename,
                        'type': 'Media',
                        'url': url_for('media.project_media', slug=project['slug']),
                        'excerpt': f"Image file in {project['name']}",
                        'project': project['name'],
                        'thumbnail': url_for('media.media_file', slug=project['slug'], filename=filename)
                    })
    
    return jsonify({
        'results': results[:30],  # Limit total results
        'query': query
    })
