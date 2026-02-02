# Markdown Editor Component Guide

This guide explains how to add the rich markdown editor (with toolbar, shortcuts, and table builder) to any new page in the application.

## 1. Template Setup (`.html`)

To use the editor, your Jinja2 template must extend `base.html` (which provides the CSS) and import the necessary macros.

### Step-by-Step Implementation

1. **Import Macros**: At the top of your template.

   ```jinja
   {% from "components/markdown_editor.html" import render_markdown_editor %}
   {% from "components/markdown_modals.html" import render_markdown_modals %}
   ```

2. **Render the Editor**: Inside your form (or wherever you want the editor), call `render_markdown_editor`.

   ```jinja
   <form method="POST">
       <!--
           Arguments:
           1. name: The 'name' attribute for the textarea (used in request.form)
           2. content: The initial value (e.g., article.content)
           3. project_slug: Required for image/article link lookups
           4. placeholder: (Optional) Placeholder text
           5. id: (Optional) ID for the textarea
       -->
       {{ render_markdown_editor(
           'body_content',
           article.content,
           project.slug,
           placeholder="Start writing..."
       ) }}

       <button type="submit">Save</button>
   </form>
   ```

3. **Render Modals**: At the bottom of your `{% block content %}`, include the modals macro. This adds the hidden dialogs for the Table Builder and Shortcuts help.

   ```jinja
   {{ render_markdown_modals() }}
   ```

4. **Include Script**: Add the editor logic in the scripts block.
   ```jinja
   {% block scripts %}
   <script src="{{ url_for('static', filename='js/markdown-editor.js') }}"></script>
   <!-- Your page-specific script -->
   <script src="{{ url_for('static', filename='js/your_page.js') }}"></script>
   {% endblock %}
   ```

## 2. JavaScript Initialization (`.js`)

You must manually initialize the editor in your page's JavaScript file. This allows you flexibility in when and how it loads.

```javascript
document.addEventListener("DOMContentLoaded", () => {
  // 1. Select the container created by the macro
  const editorContainer = document.querySelector(".markdown-editor-instance");

  // 2. Check if it exists to avoid errors on pages without the editor
  if (editorContainer) {
    // 3. Initialize the class
    // The projectSlug is automatically read from the data attribute on
    // the container, but you can pass it explicitly if needed.
    new MarkdownEditor(editorContainer);
  }
});
```

### Multiple Editors

If you have multiple editors on one page, iterate through them:

```javascript
document.querySelectorAll(".markdown-editor-instance").forEach((container) => {
  new MarkdownEditor(container);
});
```

## 3. Features Included

By following the steps above, you automatically get:

- **Toolbar**: H1-H6, Bold, Italic, Strikethrough, Code, Quote, Lists, HR.
- **Smart Lists**: Pressing Enter in a list continues the list automatically.
- **Image Drodown**: Fetches project media via API.
- **Link Dropdown**: Fetches project articles via API.
- **Table Builder**: Graphical UI for creating markdown tables.
- **Shortcuts**: `Alt+B` (Bold), `Alt+I` (Italic), `Alt+H` (Header menu), etc.
- **Auto-expand**: Textarea grows as you type.

## 4. CSS Dependencies

The styles are located in:

- `backend/static/css/markdown-editor.css`

This file is already included in `base.html`, so no extra work is needed unless you are not using the base template.
