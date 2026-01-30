// Project page functionality

// Sidebar Tab Functionality
const sidebarTabBtns = document.querySelectorAll('.sidebar-tab-btn');
const sidebarTabPanels = document.querySelectorAll('.sidebar-tab-panel');

sidebarTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.getAttribute('data-tab');
    
    // Remove active class from all buttons and panels
    sidebarTabBtns.forEach(b => b.classList.remove('active'));
    sidebarTabPanels.forEach(p => p.classList.remove('active'));
    
    // Add active class to clicked button and corresponding panel
    btn.classList.add('active');
    document.getElementById(`${tabName}-panel`).classList.add('active');
    
    // Load media when switching to media tab
    if (tabName === 'media') {
      loadMediaSidebar();
    }
  });
});

// Media Sidebar Functionality
const projectSlug = document.querySelector('.project-layout')?.dataset.projectSlug;
let mediaFiles = [];

async function loadMediaSidebar() {
  try {
    const response = await fetch(`/projects/${projectSlug}/api/media`);
    if (response.ok) {
      mediaFiles = await response.json();
      renderMediaSidebar(mediaFiles);
    }
  } catch (error) {
    console.error('Failed to load media:', error);
  }
}

function renderMediaSidebar(files) {
  const grid = document.getElementById('mediaSidebarGrid');
  if (files.length === 0) {
    grid.innerHTML = '<p class="text-muted">No images yet</p>';
    return;
  }
  
  grid.innerHTML = files.map(file => `
    <div class="media-sidebar-item" title="${file.filename}">
      <div class="media-sidebar-item-image">
        <img src="${file.url}" alt="${file.filename}" loading="lazy">
      </div>
      <div class="media-sidebar-item-name">${file.filename}</div>
    </div>
  `).join('');
}

function filterMediaSidebar(searchTerm) {
  const filtered = mediaFiles.filter(file =>
    file.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );
  renderMediaSidebar(filtered);
}

// Media search
const mediaSearchInput = document.getElementById('mediaSidebarSearch');
if (mediaSearchInput) {
  mediaSearchInput.addEventListener('input', (e) => {
    filterMediaSidebar(e.target.value);
  });
}

// Media upload
const mediaSidebarForm = document.getElementById('mediaSidebarForm');
const mediaFileInput = document.querySelector('.media-file-input');

if (mediaFileInput) {
  mediaFileInput.addEventListener('change', async () => {
    if (!mediaFileInput.files.length) return;
    
    const formData = new FormData(mediaSidebarForm);
    
    try {
      const response = await fetch(mediaSidebarForm.action, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        mediaFileInput.value = ''; // Clear input
        loadMediaSidebar(); // Refresh the grid
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading image');
    }
  });
}

const folderModal = document.getElementById("folderModal");
const articleModal = document.getElementById("articleModal");
const folderParentId = document.getElementById("folderParentId");
const articleFolderId = document.getElementById("articleFolderId");
const quickGuideSection = document.getElementById("quickGuide");
const hideQuickGuideBtn = document.getElementById("hideQuickGuide");

// Quick Guide visibility
function initQuickGuideVisibility() {
  const isHidden = localStorage.getItem("quickGuideHidden") === "true";
  if (isHidden) {
    quickGuideSection.classList.add("hidden");
  }
}

if (hideQuickGuideBtn) {
  hideQuickGuideBtn.addEventListener("click", () => {
    quickGuideSection.classList.add("hidden");
    localStorage.setItem("quickGuideHidden", "true");
  });
}

// Initialize on page load
initQuickGuideVisibility();

document.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const parentId = btn.getAttribute("data-parent-id") || "";
  const action = btn.getAttribute("data-action");

  if (action === "new-folder") {
    folderParentId.value = parentId;
    folderModal.showModal();
    folderModal.querySelector('input[name="name"]').focus();
  }

  if (action === "new-article") {
    articleFolderId.value = parentId;
    articleModal.showModal();
    articleModal.querySelector('input[name="title"]').focus();
  }
});

document.addEventListener("click", (e) => {
  const closeBtn = e.target.closest("[data-close]");
  if (!closeBtn) return;
  const id = closeBtn.getAttribute("data-close");
  document.getElementById(id).close();
});

// Click outside to close dialogs
for (const modal of [folderModal, articleModal]) {
  modal.addEventListener("click", (e) => {
    const rect = modal.getBoundingClientRect();
    const clickedInDialog =
      rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX && e.clientX <= rect.left + rect.width;
    if (!clickedInDialog) modal.close();
  });
}

// Recently Updated section collapse/expand
const recentArticlesCard = document.getElementById("recentArticlesCard");
const recentArticlesContent = document.getElementById("recentArticlesContent");
const recentArticlesHeader = recentArticlesCard?.querySelector(".card-header-row");
const recentArticlesCollapseBtn = recentArticlesCard?.querySelector(".btn-collapse");

if (recentArticlesHeader) {
  recentArticlesHeader.addEventListener("click", () => {
    const isExpanded = recentArticlesCollapseBtn.getAttribute("aria-expanded") === "true";
    recentArticlesCollapseBtn.setAttribute("aria-expanded", !isExpanded);
    recentArticlesContent.classList.toggle("hidden");
  });
}
