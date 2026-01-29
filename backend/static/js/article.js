// Article page functionality

// Mode toggle (Read/Edit)
const modeToggle = document.getElementById('modeToggle');
const saveBtn = document.getElementById('saveBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const readMode = document.getElementById('readMode');
const editMode = document.getElementById('editMode');
const fieldInputs = document.querySelectorAll('.field-input');
const editorTextarea = document.getElementById('editorTextarea');

// Formatting buttons
const boldBtn = document.getElementById('boldBtn');
const italicBtn = document.getElementById('italicBtn');
const strikethroughBtn = document.getElementById('strikethroughBtn');
const codeBtn = document.getElementById('codeBtn');
const quoteBtn = document.getElementById('quoteBtn');
const unorderedListBtn = document.getElementById('unorderedListBtn');
const orderedListBtn = document.getElementById('orderedListBtn');
const codeBlockBtn = document.getElementById('codeBlockBtn');
const horizontalRuleBtn = document.getElementById('horizontalRuleBtn');
const imageBtn = document.getElementById('imageBtn');
const headingBtn = document.getElementById('headingBtn');
const headingDropdown = document.getElementById('headingDropdown');

// Editor image dropdown
const editorImageDropdown = document.getElementById('editorImageDropdown');
const editorImageSearchInput = document.getElementById('editorImageSearchInput');
const editorImageList = document.getElementById('editorImageList');

let editorMediaFiles = [];

let currentMode = 'read';
let pendingChanges = {}; // Store changes to save on button click
let originalFieldValues = {}; // Store original field values for cancel

// Enable/disable structured fields based on mode
function updateFieldsState() {
  fieldInputs.forEach(input => {
    input.disabled = currentMode === 'read';
  });
}

// Helper function to insert markdown formatting
function insertMarkdown(before, after = '') {
  const textarea = editorTextarea;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  const beforeCursor = textarea.value.substring(0, start);
  const afterCursor = textarea.value.substring(end);
  
  if (selectedText) {
    // If text is selected, wrap it
    textarea.value = beforeCursor + before + selectedText + after + afterCursor;
    textarea.selectionStart = start + before.length;
    textarea.selectionEnd = start + before.length + selectedText.length;
  } else {
    // If no selection, just insert the markup with cursor in the middle
    textarea.value = beforeCursor + before + after + afterCursor;
    textarea.selectionStart = start + before.length;
    textarea.selectionEnd = start + before.length;
  }
  
  textarea.focus();
}

// Bold button
boldBtn.addEventListener('click', () => {
  insertMarkdown('**', '**');
});

// Italic button
italicBtn.addEventListener('click', () => {
  insertMarkdown('*', '*');
});

// Strikethrough button
strikethroughBtn.addEventListener('click', () => {
  insertMarkdown('~~', '~~');
});

// Inline code button
codeBtn.addEventListener('click', () => {
  insertMarkdown('`', '`');
});

// Unordered list button
unorderedListBtn.addEventListener('click', () => {
  const textarea = editorTextarea;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  const beforeCursor = textarea.value.substring(0, start);
  const afterCursor = textarea.value.substring(end);
  
  if (selectedText) {
    // If text is selected, add list bullet to each line
    const listMarkdown = '- ' + selectedText.split('\n').join('\n- ');
    textarea.value = beforeCursor + listMarkdown + afterCursor;
    textarea.selectionStart = start;
    textarea.selectionEnd = start + listMarkdown.length;
  } else {
    // If no selection, insert list marker with cursor after it
    const listMarkdown = '- ';
    textarea.value = beforeCursor + listMarkdown + afterCursor;
    textarea.selectionStart = start + listMarkdown.length;
    textarea.selectionEnd = start + listMarkdown.length;
  }
  
  textarea.focus();
});

// Ordered list button
orderedListBtn.addEventListener('click', () => {
  const textarea = editorTextarea;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  const beforeCursor = textarea.value.substring(0, start);
  const afterCursor = textarea.value.substring(end);
  
  if (selectedText) {
    // If text is selected, add numbered list to each line
    const lines = selectedText.split('\n');
    const numberedList = lines.map((line, i) => `${i + 1}. ${line}`).join('\n');
    textarea.value = beforeCursor + numberedList + afterCursor;
    textarea.selectionStart = start;
    textarea.selectionEnd = start + numberedList.length;
  } else {
    // If no selection, insert numbered list marker
    const listMarkdown = '1. ';
    textarea.value = beforeCursor + listMarkdown + afterCursor;
    textarea.selectionStart = start + listMarkdown.length;
    textarea.selectionEnd = start + listMarkdown.length;
  }
  
  textarea.focus();
});

// Code block button
codeBlockBtn.addEventListener('click', () => {
  const textarea = editorTextarea;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  const beforeCursor = textarea.value.substring(0, start);
  const afterCursor = textarea.value.substring(end);
  
  if (selectedText) {
    // If text is selected, wrap in code block
    const codeBlockMarkdown = '```\n' + selectedText + '\n```';
    textarea.value = beforeCursor + codeBlockMarkdown + afterCursor;
    textarea.selectionStart = start;
    textarea.selectionEnd = start + codeBlockMarkdown.length;
  } else {
    // If no selection, insert empty code block
    const codeBlockMarkdown = '```\n\n```';
    textarea.value = beforeCursor + codeBlockMarkdown + afterCursor;
    textarea.selectionStart = start + 4; // Position cursor inside the code block
    textarea.selectionEnd = start + 4;
  }
  
  textarea.focus();
});

// Horizontal rule button
horizontalRuleBtn.addEventListener('click', () => {
  const textarea = editorTextarea;
  const start = textarea.selectionStart;
  const beforeCursor = textarea.value.substring(0, start);
  const afterCursor = textarea.value.substring(start);
  
  // Add horizontal rule on its own line
  const hrMarkdown = '\n---\n';
  textarea.value = beforeCursor + hrMarkdown + afterCursor;
  textarea.selectionStart = start + hrMarkdown.length;
  textarea.selectionEnd = start + hrMarkdown.length;
  
  textarea.focus();
});

// Header buttons
function insertHeader(level) {
  const textarea = editorTextarea;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  const beforeCursor = textarea.value.substring(0, start);
  const afterCursor = textarea.value.substring(end);
  
  const headerPrefix = '#'.repeat(level) + ' ';
  
  if (selectedText) {
    // If text is selected, wrap it with header prefix
    textarea.value = beforeCursor + headerPrefix + selectedText + afterCursor;
    textarea.selectionStart = start + headerPrefix.length;
    textarea.selectionEnd = start + headerPrefix.length + selectedText.length;
  } else {
    // If no selection, insert header prefix with cursor ready to type
    textarea.value = beforeCursor + headerPrefix + afterCursor;
    textarea.selectionStart = start + headerPrefix.length;
    textarea.selectionEnd = start + headerPrefix.length;
  }
  
  textarea.focus();
}

// Header button and dropdown
headingBtn.addEventListener('click', (e) => {
  e.preventDefault();
  headingDropdown.classList.toggle('hidden');
});

// Header selection items
document.querySelectorAll('.toolbar-dropdown-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const level = parseInt(item.getAttribute('data-level'), 10);
    insertHeader(level);
    headingDropdown.classList.add('hidden');
  });
});

// Close heading dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('#headingBtn') && 
      !e.target.closest('#headingDropdown')) {
    headingDropdown.classList.add('hidden');
  }
});

// Quote button
quoteBtn.addEventListener('click', () => {
  const textarea = editorTextarea;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  const beforeCursor = textarea.value.substring(0, start);
  const afterCursor = textarea.value.substring(end);
  
  if (selectedText) {
    // If text is selected, add quote prefix to each line
    const quoteMarkdown = '> ' + selectedText.split('\n').join('\n> ');
    textarea.value = beforeCursor + quoteMarkdown + afterCursor;
    textarea.selectionStart = start;
    textarea.selectionEnd = start + quoteMarkdown.length;
  } else {
    // If no selection, insert quote marker with cursor after it
    const quoteMarkdown = '> ';
    textarea.value = beforeCursor + quoteMarkdown + afterCursor;
    textarea.selectionStart = start + quoteMarkdown.length;
    textarea.selectionEnd = start + quoteMarkdown.length;
  }
  
  textarea.focus();
});

// Insert image markdown at cursor
function insertImageMarkdown(filename) {
  const textarea = editorTextarea;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const beforeCursor = textarea.value.substring(0, start);
  const afterCursor = textarea.value.substring(end);
  const imageMarkdown = `![image](media/${filename})`;
  
  textarea.value = beforeCursor + imageMarkdown + afterCursor;
  
  const newPosition = start + imageMarkdown.length;
  textarea.selectionStart = newPosition;
  textarea.selectionEnd = newPosition;
  textarea.focus();
}

// Load editor media files
async function loadEditorMediaFiles() {
  const projectSlug = document.querySelector('[data-project-slug]')?.dataset.projectSlug;
  
  try {
    const response = await fetch(`/projects/${projectSlug}/api/media`);
    if (response.ok) {
      editorMediaFiles = await response.json();
      renderEditorMediaList(editorMediaFiles);
    }
  } catch (error) {
    console.error('Failed to load media files:', error);
  }
}

// Render editor media list
function renderEditorMediaList(files) {
  if (files.length === 0) {
    editorImageList.innerHTML = '<div class="image-dropdown-empty">No images found</div>';
    return;
  }
  
  editorImageList.innerHTML = files.map(file => `
    <div class="image-dropdown-item" data-filename="${file.filename}">
      <img src="${file.url}" alt="${file.filename}" class="image-dropdown-thumb">
      <div class="image-dropdown-name">${file.filename}</div>
    </div>
  `).join('');
  
  // Add click handlers to items
  document.querySelectorAll('#editorImageList .image-dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      const filename = item.dataset.filename;
      insertImageMarkdown(filename);
      editorImageDropdown.classList.add('hidden');
    });
  });
}

// Filter editor media files
function filterEditorMediaFiles(searchTerm) {
  const filtered = editorMediaFiles.filter(file => 
    file.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );
  renderEditorMediaList(filtered);
}

// Load editor media on init
loadEditorMediaFiles();

modeToggle.addEventListener('click', () => {
  if (currentMode === 'read') {
    // Switch to edit
    readMode.classList.add('hidden');
    editMode.classList.remove('hidden');
    document.getElementById('viewModeFields')?.classList.add('hidden');
    document.getElementById('editModeFields')?.classList.remove('hidden');
    modeToggle.textContent = '👁️ View';
    modeToggle.dataset.mode = 'edit';
    saveBtn.classList.remove('hidden');
    cancelEditBtn.classList.remove('hidden');
    selectImageBtn?.classList.remove('hidden');
    changeImageBtn?.classList.remove('hidden');
    currentMode = 'edit';
    updateFieldsState();
    
    // Store original field values for cancel
    originalFieldValues = {};
    fieldInputs.forEach(input => {
      originalFieldValues[input.id] = input.value;
    });
    
    // Initialize tooltips for the edit mode fields
    initializeTooltips();
    
    editMode.querySelector('textarea').focus();
  } else {
    // Switch to read (without saving)
    readMode.classList.remove('hidden');
    editMode.classList.add('hidden');
    document.getElementById('viewModeFields')?.classList.remove('hidden');
    document.getElementById('editModeFields')?.classList.add('hidden');
    modeToggle.textContent = '✏️ Edit';
    modeToggle.dataset.mode = 'read';
    saveBtn.classList.add('hidden');
    cancelEditBtn.classList.add('hidden');
    selectImageBtn?.classList.add('hidden');
    changeImageBtn?.classList.add('hidden');
    currentMode = 'read';
    updateFieldsState();
  }
});

cancelEditBtn.addEventListener('click', () => {
  const textarea = editMode.querySelector('textarea');
  const markdownChanged = textarea.value !== textarea.defaultValue;
  const hasFieldChanges = Object.keys(pendingChanges).length > 0;
  
  if (markdownChanged || hasFieldChanges) {
    const confirmed = confirm('You have unsaved changes. Are you sure you want to discard them?');
    if (!confirmed) return;
  }
  
  // Clear pending changes
  pendingChanges = {};
  originalFieldValues = {};
  
  // Reload the page to restore original state
  window.location.reload();
});

// Save button handler - save all pending changes and switch to view mode
saveBtn.addEventListener('click', async () => {
  const projectSlug = document.querySelector('[data-project-slug]')?.dataset.projectSlug;
  const articleId = parseInt(document.querySelector('[data-article-id]')?.dataset.articleId || 0, 10);
  const textarea = document.getElementById('editorTextarea');
  const bodyContent = textarea.value;
  
  try {
    // Save markdown content
    const markdownResponse = await fetch(
      `/projects/${projectSlug}/a/${articleId}/edit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          body_content: bodyContent,
        }).toString(),
      }
    );
    
    if (!markdownResponse.ok) {
      throw new Error('Failed to save markdown');
    }
    
    // Save all pending field changes
    const savePromises = Object.entries(pendingChanges).map(([promptId, change]) => 
      fetch(
        `/projects/${projectSlug}/a/${articleId}/api/set-prompt`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt_id: parseInt(promptId, 10),
            value: change.value,
            linked_article_id: change.linkedArticleId,
          }),
        }
      )
    );
    
    await Promise.all(savePromises);
    pendingChanges = {}; // Clear pending changes
    
    // Reload the page to show updated content
    window.location.reload();
  } catch (error) {
    console.error('Error saving changes:', error);
    alert('Failed to save changes');
  }
});

// Article linking functionality
const linkArticleBtn = document.getElementById('linkArticleBtn');
const linkDropdown = document.getElementById('linkDropdown');
const articleSearchInput = document.getElementById('articleSearchInput');
const articleList = document.getElementById('articleList');

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

// Load media files on page load
loadMediaFiles();

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
  document.querySelectorAll('#imageList .image-dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      const filename = item.dataset.filename;
      selectImage(filename);
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

// Image button - open editor image dropdown
imageBtn.addEventListener('click', (e) => {
  e.preventDefault();
  editorImageDropdown.classList.toggle('hidden');
  if (!editorImageDropdown.classList.contains('hidden')) {
    editorImageSearchInput.focus();
  }
});

// Editor image search
editorImageSearchInput.addEventListener('input', (e) => {
  filterEditorMediaFiles(e.target.value);
});

// Close editor image dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('#imageBtn') && 
      !e.target.closest('#editorImageDropdown')) {
    editorImageDropdown.classList.add('hidden');
  }
});

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

// Structured fields functionality - track changes for deferred save
fieldInputs.forEach(input => {
  input.addEventListener('change', () => {
    const fieldGroup = input.closest('.field-group');
    const promptId = fieldGroup.dataset.promptId;
    const promptType = fieldGroup.dataset.promptType;
    
    let value = null;
    let linkedArticleId = null;
    
    if (promptType === 'text') {
      value = input.value || null;
    } else if (promptType === 'select') {
      linkedArticleId = input.value ? parseInt(input.value, 10) : null;
    }
    
    // Track the change for later saving
    pendingChanges[promptId] = {
      value: value,
      linkedArticleId: linkedArticleId,
    };
  });
});

// Initialize field states on page load
updateFieldsState();

// Tooltip functionality for select field linked types
function initializeTooltips() {
  const tooltipTriggers = document.querySelectorAll('.tooltip-trigger');
  
  tooltipTriggers.forEach(trigger => {
    trigger.addEventListener('mouseenter', () => {
      const tooltipKey = trigger.getAttribute('data-tooltip-key');
      const tooltip = document.querySelector(`.tooltip-content[data-tooltip-key="${tooltipKey}"]`);
      if (tooltip) {
        tooltip.classList.add('visible');
      }
    });
    
    trigger.addEventListener('mouseleave', () => {
      const tooltipKey = trigger.getAttribute('data-tooltip-key');
      const tooltip = document.querySelector(`.tooltip-content[data-tooltip-key="${tooltipKey}"]`);
      if (tooltip) {
        tooltip.classList.remove('visible');
      }
    });
    
    // Also support click to toggle tooltip
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const tooltipKey = trigger.getAttribute('data-tooltip-key');
      const tooltip = document.querySelector(`.tooltip-content[data-tooltip-key="${tooltipKey}"]`);
      if (tooltip) {
        tooltip.classList.toggle('visible');
      }
    });
  });
}

// Initialize tooltips on page load
initializeTooltips();

// Re-initialize tooltips when switching to edit mode
const editModeFields = document.getElementById('editModeFields');
if (editModeFields) {
  const observer = new MutationObserver(() => {
    if (!editModeFields.classList.contains('hidden')) {
      initializeTooltips();
    }
  });
  
  observer.observe(editModeFields, { attributes: true, attributeFilter: ['class'] });
}

// Close tooltip when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.tooltip-trigger')) {
    document.querySelectorAll('.tooltip-content').forEach(tooltip => {
      tooltip.classList.remove('visible');
    });
  }
});

// ===========================
// TABLE BUILDER FUNCTIONALITY
// ===========================

const tableBuilderBtn = document.getElementById('tableBuilderBtn');
const tableBuilderModal = document.getElementById('tableBuilderModal');
const closeTableModal = document.getElementById('closeTableModal');
const cancelTableBtn = document.getElementById('cancelTableBtn');
const insertTableBtn = document.getElementById('insertTableBtn');
const tableRowsInput = document.getElementById('tableRows');
const tableColumnsInput = document.getElementById('tableColumns');
const tablePreviewContainer = document.getElementById('tablePreviewContainer');

let currentTableData = []; // Store table cell data

// Open table builder modal
tableBuilderBtn.addEventListener('click', () => {
  tableBuilderModal.classList.remove('hidden');
  tableRowsInput.focus();
  generateTablePreview();
});

// Close modal
function closeModal() {
  tableBuilderModal.classList.add('hidden');
  currentTableData = [];
}

closeTableModal.addEventListener('click', closeModal);
cancelTableBtn.addEventListener('click', closeModal);

// Close modal when clicking the overlay
document.getElementById('tableBuilderModal').addEventListener('click', (e) => {
  if (e.target.id === 'tableBuilderModal') {
    closeModal();
  }
});

// Generate table preview
function generateTablePreview() {
  const rows = parseInt(tableRowsInput.value) || 1;
  const cols = parseInt(tableColumnsInput.value) || 1;
  
  // Initialize table data if needed
  if (currentTableData.length === 0) {
    currentTableData = Array(rows).fill(null).map(() => Array(cols).fill(''));
  }
  
  // Update table data dimensions if rows/cols changed
  if (currentTableData.length !== rows) {
    if (rows > currentTableData.length) {
      // Add new rows
      for (let i = currentTableData.length; i < rows; i++) {
        currentTableData.push(Array(cols).fill(''));
      }
    } else {
      // Remove rows
      currentTableData = currentTableData.slice(0, rows);
    }
  }
  
  // Update columns in existing rows
  currentTableData.forEach(row => {
    if (row.length !== cols) {
      if (cols > row.length) {
        // Add new columns
        for (let i = row.length; i < cols; i++) {
          row.push('');
        }
      } else {
        // Remove columns
        row.length = cols;
      }
    }
  });
  
  // Render preview
  const table = document.createElement('table');
  table.className = 'table-builder-preview';
  
  currentTableData.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    row.forEach((cell, colIndex) => {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = `Row ${rowIndex + 1}, Col ${colIndex + 1}`;
      input.value = cell;
      input.className = 'table-cell-input';
      
      // Update cell data when user types
      input.addEventListener('input', (e) => {
        currentTableData[rowIndex][colIndex] = e.target.value;
      });
      
      td.appendChild(input);
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });
  
  tablePreviewContainer.innerHTML = '';
  tablePreviewContainer.appendChild(table);
}

// Update preview when rows/columns change
tableRowsInput.addEventListener('change', generateTablePreview);
tableColumnsInput.addEventListener('change', generateTablePreview);

// Convert table data to markdown
function tableToMarkdown(tableData) {
  if (tableData.length === 0) return '';
  
  const rows = tableData.length;
  const cols = tableData[0].length;
  
  let markdown = '';
  
  // Add each row
  tableData.forEach((row) => {
    markdown += '| ' + row.join(' | ') + ' |\n';
    
    // Add separator after first row
    if (tableData.indexOf(row) === 0) {
      markdown += '| ' + Array(cols).fill('---').join(' | ') + ' |\n';
    }
  });
  
  return markdown;
}

// Insert table into editor
insertTableBtn.addEventListener('click', () => {
  if (currentTableData.length === 0 || currentTableData[0].length === 0) {
    alert('Please configure the table dimensions');
    return;
  }
  
  const markdownTable = tableToMarkdown(currentTableData);
  const textarea = document.getElementById('editorTextarea');
  
  // Insert at cursor position
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const beforeCursor = textarea.value.substring(0, start);
  const afterCursor = textarea.value.substring(end);
  
  textarea.value = beforeCursor + '\n\n' + markdownTable + '\n\n' + afterCursor;
  
  // Set cursor position after the table
  const newPosition = start + markdownTable.length + 4; // +4 for the newlines
  textarea.selectionStart = newPosition;
  textarea.selectionEnd = newPosition;
  textarea.focus();
  
  closeModal();
});

