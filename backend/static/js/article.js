// Article page functionality

// Mode toggle (Read/Edit)
const modeToggle = document.getElementById('modeToggle');
const readMode = document.getElementById('readMode');
const editMode = document.getElementById('editMode');
const cancelEdit = document.getElementById('cancelEdit');

let currentMode = 'read';

modeToggle.addEventListener('click', () => {
  if (currentMode === 'read') {
    // Switch to edit
    readMode.classList.add('hidden');
    editMode.classList.remove('hidden');
    modeToggle.textContent = '👁️ View';
    modeToggle.dataset.mode = 'edit';
    currentMode = 'edit';
    editMode.querySelector('textarea').focus();
  } else {
    // Switch to read
    readMode.classList.remove('hidden');
    editMode.classList.add('hidden');
    modeToggle.textContent = '✏️ Edit';
    modeToggle.dataset.mode = 'read';
    currentMode = 'read';
  }
});

cancelEdit.addEventListener('click', () => {
  // Reset textarea to original content
  const textarea = editMode.querySelector('textarea');
  textarea.value = textarea.defaultValue;
  // Switch back to read mode
  modeToggle.click();
});

// Article linking functionality
const linkArticleBtn = document.getElementById('linkArticleBtn');
const linkDropdown = document.getElementById('linkDropdown');
const articleSearchInput = document.getElementById('articleSearchInput');
const articleList = document.getElementById('articleList');
const editorTextarea = document.getElementById('editorTextarea');

let allArticles = [];

// Fetch articles from API
async function loadArticles() {
  const projectSlug = document.querySelector('[data-project-slug]')?.dataset.projectSlug;
  const articleId = parseInt(document.querySelector('[data-article-id]')?.dataset.articleId || 0, 10);
  
  try {
    const response = await fetch(`/projects/${projectSlug}/api/articles?exclude_id=${articleId}`);
    if (response.ok) {
      allArticles = await response.json();
      renderArticleList(allArticles);
    }
  } catch (error) {
    console.error('Failed to load articles:', error);
  }
}

// Render article list
function renderArticleList(articles) {
  if (articles.length === 0) {
    articleList.innerHTML = '<div class="article-dropdown-empty">No articles found</div>';
    return;
  }
  
  articleList.innerHTML = articles.map(article => `
    <div class="article-dropdown-item" data-slug="${article.slug}" data-title="${article.title}">
      <div class="article-dropdown-title">${article.title}</div>
      <div class="article-dropdown-type">${article.type_name}</div>
    </div>
  `).join('');
  
  // Add click handlers to items
  document.querySelectorAll('.article-dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      insertArticleLink(item.dataset.slug, item.dataset.title);
      linkDropdown.classList.add('hidden');
    });
  });
}

// Filter articles based on search
function filterArticles(searchTerm) {
  const filtered = allArticles.filter(article => 
    article.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  renderArticleList(filtered);
}

// Insert article link at cursor position
function insertArticleLink(slug, title) {
  const textarea = editorTextarea;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const beforeCursor = textarea.value.substring(0, start);
  const afterCursor = textarea.value.substring(end);
  const markdownLink = `[${title}](article:${slug})`;
  
  textarea.value = beforeCursor + markdownLink + afterCursor;
  
  // Set cursor position after the inserted link
  const newPosition = start + markdownLink.length;
  textarea.selectionStart = newPosition;
  textarea.selectionEnd = newPosition;
  textarea.focus();
}

// Toggle dropdown on button click
linkArticleBtn.addEventListener('click', (e) => {
  e.preventDefault();
  linkDropdown.classList.toggle('hidden');
  if (!linkDropdown.classList.contains('hidden')) {
    articleSearchInput.focus();
  }
});

// Filter articles as user types
articleSearchInput.addEventListener('input', (e) => {
  filterArticles(e.target.value);
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('#linkArticleBtn') && !e.target.closest('#linkDropdown')) {
    linkDropdown.classList.add('hidden');
  }
});

// Load articles on page load
loadArticles();

// Image selection functionality
const imageDropdown = document.getElementById('imageDropdown');
const imageSearchInput = document.getElementById('imageSearchInput');
const imageList = document.getElementById('imageList');
const selectImageBtn = document.getElementById('selectImageBtn');
const changeImageBtn = document.getElementById('changeImageBtn');
const imagePickerPlaceholder = document.getElementById('imagePickerPlaceholder');

let allMediaFiles = [];

// Fetch media files from API
async function loadMediaFiles() {
  const projectSlug = document.querySelector('[data-project-slug]')?.dataset.projectSlug;
  
  try {
    const response = await fetch(`/projects/${projectSlug}/api/media`);
    if (response.ok) {
      allMediaFiles = await response.json();
      renderMediaList(allMediaFiles);
    }
  } catch (error) {
    console.error('Failed to load media files:', error);
  }
}

// Render media list
function renderMediaList(files) {
  if (files.length === 0) {
    imageList.innerHTML = '<div class="image-dropdown-empty">No images found</div>';
    return;
  }
  
  imageList.innerHTML = files.map(file => `
    <div class="image-dropdown-item" data-filename="${file.filename}">
      <img src="${file.url}" alt="${file.filename}" class="image-dropdown-thumb">
      <div class="image-dropdown-name">${file.filename}</div>
    </div>
  `).join('');
  
  // Add click handlers to items
  document.querySelectorAll('.image-dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      selectImage(item.dataset.filename);
      imageDropdown.classList.add('hidden');
    });
  });
}

// Filter media files based on search
function filterMediaFiles(searchTerm) {
  const filtered = allMediaFiles.filter(file => 
    file.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );
  renderMediaList(filtered);
}

// Select image and update article
async function selectImage(filename) {
  const projectSlug = document.querySelector('[data-project-slug]')?.dataset.projectSlug;
  const articleId = parseInt(document.querySelector('[data-article-id]')?.dataset.articleId || 0, 10);
  
  try {
    const response = await fetch(`/projects/${projectSlug}/a/${articleId}/api/set-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured_image: filename })
    });
    
    if (response.ok) {
      // Update the image display without reloading
      const mediaUrl = `/projects/${projectSlug}/media/files/${filename}`;
      
      // Replace placeholder with image if needed
      const placeholder = document.getElementById('imagePickerPlaceholder');
      if (placeholder && !placeholder.classList.contains('hidden')) {
        const container = document.createElement('div');
        container.className = 'article-image-container';
        container.innerHTML = `
          <img 
            src="${mediaUrl}" 
            alt="Featured image"
            class="article-image"
          >
          <button type="button" id="changeImageBtn" class="btn-change-image">Change Image</button>
        `;
        placeholder.replaceWith(container);
        
        // Re-attach event listener to the new button
        document.getElementById('changeImageBtn')?.addEventListener('click', (e) => {
          e.preventDefault();
          imageDropdown.classList.toggle('hidden');
          if (!imageDropdown.classList.contains('hidden')) {
            imageSearchInput.focus();
          }
        });
      } else {
        // Update existing image
        const img = document.querySelector('.article-image');
        if (img) {
          img.src = mediaUrl;
        }
      }
    } else {
      alert('Failed to set featured image');
    }
  } catch (error) {
    console.error('Error setting featured image:', error);
    alert('Error setting featured image');
  }
}

// Toggle dropdown on button click
if (selectImageBtn) {
  selectImageBtn.addEventListener('click', (e) => {
    e.preventDefault();
    imageDropdown.classList.toggle('hidden');
    if (!imageDropdown.classList.contains('hidden')) {
      imageSearchInput.focus();
    }
  });
}

if (changeImageBtn) {
  changeImageBtn.addEventListener('click', (e) => {
    e.preventDefault();
    imageDropdown.classList.toggle('hidden');
    if (!imageDropdown.classList.contains('hidden')) {
      imageSearchInput.focus();
    }
  });
}

// Filter media as user types
imageSearchInput.addEventListener('input', (e) => {
  filterMediaFiles(e.target.value);
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('#selectImageBtn') && 
      !e.target.closest('#changeImageBtn') && 
      !e.target.closest('#imageDropdown')) {
    imageDropdown.classList.add('hidden');
  }
});

// Metadata card collapse/expand
const metadataCard = document.getElementById('metadataCard');
const metadataContent = document.getElementById('metadataContent');
const collapseBtn = metadataCard?.querySelector('.btn-collapse');

if (collapseBtn) {
  collapseBtn.addEventListener('click', () => {
    const isExpanded = collapseBtn.getAttribute('aria-expanded') === 'true';
    collapseBtn.setAttribute('aria-expanded', !isExpanded);
    metadataContent.classList.toggle('hidden');
  });
}

// Load media on page load
loadMediaFiles();
