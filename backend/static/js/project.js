// Project page functionality

// Sidebar Tab Functionality
const sidebarTabBtns = document.querySelectorAll(".sidebar-tab-btn");
const sidebarTabPanels = document.querySelectorAll(".sidebar-tab-panel");

sidebarTabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tabName = btn.getAttribute("data-tab");

    // Remove active class from all buttons and panels
    sidebarTabBtns.forEach((b) => b.classList.remove("active"));
    sidebarTabPanels.forEach((p) => p.classList.remove("active"));

    // Add active class to clicked button and corresponding panel
    btn.classList.add("active");
    document.getElementById(`${tabName}-panel`).classList.add("active");

    // Load media when switching to media tab
    if (tabName === "media") {
      loadMediaSidebar();
    }
  });
});

// Media Sidebar Functionality
const projectSlug =
  document.querySelector(".project-layout")?.dataset.projectSlug;
let mediaFiles = [];

async function loadMediaSidebar() {
  try {
    const response = await fetch(`/projects/${projectSlug}/api/media`);
    if (response.ok) {
      mediaFiles = await response.json();
      renderMediaSidebar(mediaFiles);
    }
  } catch (error) {
    console.error("Failed to load media:", error);
  }
}

function renderMediaSidebar(files) {
  const grid = document.getElementById("mediaSidebarGrid");
  if (files.length === 0) {
    grid.innerHTML = '<p class="text-muted">No images yet</p>';
    return;
  }

  grid.innerHTML = files
    .map(
      (file) => `
    <div class="media-sidebar-item" title="${file.filename}">
      <div class="media-sidebar-item-image">
        <img src="${file.url}" alt="${file.filename}" loading="lazy">
      </div>
      <div class="media-sidebar-item-name">${file.filename}</div>
    </div>
  `,
    )
    .join("");
}

function filterMediaSidebar(searchTerm) {
  const filtered = mediaFiles.filter((file) =>
    file.filename.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  renderMediaSidebar(filtered);
}

// Media search
const mediaSearchInput = document.getElementById("mediaSidebarSearch");
if (mediaSearchInput) {
  mediaSearchInput.addEventListener("input", (e) => {
    filterMediaSidebar(e.target.value);
  });
}

// Media upload
const mediaSidebarForm = document.getElementById("mediaSidebarForm");
const mediaFileInput = document.querySelector(".media-file-input");

if (mediaFileInput) {
  mediaFileInput.addEventListener("change", async () => {
    if (!mediaFileInput.files.length) return;

    const formData = new FormData(mediaSidebarForm);

    try {
      const response = await fetch(mediaSidebarForm.action, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        mediaFileInput.value = ""; // Clear input
        loadMediaSidebar(); // Refresh the grid
      } else {
        alert("Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading image");
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
    // Only close if clicking on the backdrop (the dialog element itself, not its children)
    if (e.target === modal) {
      modal.close();
    }
  });
}

// Recently Updated section collapse/expand
const recentArticlesCard = document.getElementById("recentArticlesCard");
const recentArticlesContent = document.getElementById("recentArticlesContent");
const recentArticlesHeader =
  recentArticlesCard?.querySelector(".card-header-row");
const recentArticlesCollapseBtn =
  recentArticlesCard?.querySelector(".btn-collapse");

if (recentArticlesHeader) {
  recentArticlesHeader.addEventListener("click", () => {
    const isExpanded =
      recentArticlesCollapseBtn.getAttribute("aria-expanded") === "true";
    recentArticlesCollapseBtn.setAttribute("aria-expanded", !isExpanded);
    recentArticlesContent.classList.toggle("hidden");
  });
}

// Rename folder functionality
document.addEventListener("click", (e) => {
  const btn = e.target.closest('button[data-action="rename-folder"]');
  if (!btn) return;

  const folderId = btn.getAttribute("data-folder-id");
  const folderItem = document.querySelector(
    `.tree-folder[data-folder-id="${folderId}"]`,
  );
  if (!folderItem) return;

  const nameSpan = folderItem.querySelector(".tree-name");
  const currentName = nameSpan.textContent.replace("📁 ", "").trim();

  const newName = prompt("Enter new folder name:", currentName);
  if (!newName || newName.trim() === currentName) return;

  fetch(`/projects/${projectSlug}/folders/${folderId}/rename`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `name=${encodeURIComponent(newName.trim())}`,
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        nameSpan.textContent = `📁 ${data.folder.name}`;
      } else {
        alert("Error renaming folder: " + (data.error || "Unknown error"));
      }
    })
    .catch((err) => {
      console.error("Rename error:", err);
      alert("Error renaming folder");
    });
});

// Rename article functionality
document.addEventListener("click", (e) => {
  const btn = e.target.closest(
    ".article-action-btn:not(.article-action-danger)",
  );
  if (!btn) return;

  const articleItem = btn.closest(".tree-article");
  if (!articleItem) return;

  const articleId = parseInt(
    articleItem.getAttribute("data-article-id") || "0",
  );
  if (!articleId) return;

  const titleLink = articleItem.querySelector(".tree-article-name a");
  if (!titleLink) return;

  const currentName = titleLink.textContent.trim();
  const newName = prompt("Enter new article title:", currentName);
  if (!newName || newName.trim() === currentName) return;

  fetch(`/projects/${projectSlug}/articles/${articleId}/rename`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `title=${encodeURIComponent(newName.trim())}`,
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        titleLink.textContent = data.article.title;
      } else {
        alert("Error renaming article: " + (data.error || "Unknown error"));
      }
    })
    .catch((err) => {
      console.error("Rename error:", err);
      alert("Error renaming article");
    });
});

// ===== Project Markdown Editing =====

const projectModeToggle = document.getElementById("projectModeToggle");
const projectReadMode = document.getElementById("projectReadMode");
const projectEditMode = document.getElementById("projectEditMode");
const projectEditorTextarea = document.getElementById("projectEditorTextarea");
const projectSaveBtn = document.getElementById("projectSaveBtn");
const projectCancelEditBtn = document.getElementById("projectCancelEditBtn");

let currentMode = "read";
let originalDescription = "";

// Toggle between read and edit mode
if (projectModeToggle) {
  projectModeToggle.addEventListener("click", () => {
    if (currentMode === "read") {
      // Switch to edit mode
      originalDescription = projectEditorTextarea.value;
      projectReadMode.classList.add("hidden");
      projectEditMode.classList.remove("hidden");
      projectSaveBtn.classList.remove("hidden");
      projectCancelEditBtn.classList.remove("hidden");
      projectModeToggle.classList.add("hidden");
      projectEditorTextarea.focus();
      currentMode = "edit";
    }
  });
}

// Save project description
if (projectSaveBtn) {
  projectSaveBtn.addEventListener("click", () => {
    const description = projectEditorTextarea.value;
    const form = document.createElement("form");
    form.method = "POST";
    form.action = `/projects/${projectSlug}/edit`;

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "description";
    input.value = description;

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
  });
}

// Cancel edit
if (projectCancelEditBtn) {
  projectCancelEditBtn.addEventListener("click", () => {
    // Reset textarea
    projectEditorTextarea.value = originalDescription;

    // Switch back to read mode
    projectEditMode.classList.add("hidden");
    projectReadMode.classList.remove("hidden");
    projectSaveBtn.classList.add("hidden");
    projectCancelEditBtn.classList.add("hidden");
    projectModeToggle.classList.remove("hidden");
    currentMode = "read";
  });
}

// Toolbar buttons for project markdown editing
const projectToolbarButtons = {
  heading: document.getElementById("projectHeadingBtn"),
  bold: document.getElementById("projectBoldBtn"),
  italic: document.getElementById("projectItalicBtn"),
  strikethrough: document.getElementById("projectStrikethroughBtn"),
  code: document.getElementById("projectCodeBtn"),
  quote: document.getElementById("projectQuoteBtn"),
  unorderedList: document.getElementById("projectUnorderedListBtn"),
  orderedList: document.getElementById("projectOrderedListBtn"),
  codeBlock: document.getElementById("projectCodeBlockBtn"),
  horizontalRule: document.getElementById("projectHorizontalRuleBtn"),
};

const projectHeadingDropdown = document.getElementById(
  "projectHeadingDropdown",
);

function insertMarkdown(before, after = "") {
  const textarea = projectEditorTextarea;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  const beforeText = textarea.value.substring(0, start);
  const afterText = textarea.value.substring(end);

  const newText = beforeText + before + selectedText + after + afterText;
  textarea.value = newText;

  textarea.selectionStart = start + before.length;
  textarea.selectionEnd = start + before.length + selectedText.length;
  textarea.focus();
}

// Toolbar event listeners for project markdown
if (projectToolbarButtons.heading) {
  projectToolbarButtons.heading.addEventListener("click", (e) => {
    e.preventDefault();
    projectHeadingDropdown.classList.toggle("hidden");
  });
}

if (projectHeadingDropdown) {
  projectHeadingDropdown
    .querySelectorAll(".toolbar-dropdown-item")
    .forEach((item) => {
      item.addEventListener("click", (e) => {
        const level = item.getAttribute("data-level");
        insertMarkdown(`${"#".repeat(level)} `);
        projectHeadingDropdown.classList.add("hidden");
      });
    });
}

if (projectToolbarButtons.bold) {
  projectToolbarButtons.bold.addEventListener("click", (e) => {
    e.preventDefault();
    insertMarkdown("**", "**");
  });
}

if (projectToolbarButtons.italic) {
  projectToolbarButtons.italic.addEventListener("click", (e) => {
    e.preventDefault();
    insertMarkdown("*", "*");
  });
}

if (projectToolbarButtons.strikethrough) {
  projectToolbarButtons.strikethrough.addEventListener("click", (e) => {
    e.preventDefault();
    insertMarkdown("~~", "~~");
  });
}

if (projectToolbarButtons.code) {
  projectToolbarButtons.code.addEventListener("click", (e) => {
    e.preventDefault();
    insertMarkdown("`", "`");
  });
}

if (projectToolbarButtons.quote) {
  projectToolbarButtons.quote.addEventListener("click", (e) => {
    e.preventDefault();
    insertMarkdown("> ");
  });
}

if (projectToolbarButtons.unorderedList) {
  projectToolbarButtons.unorderedList.addEventListener("click", (e) => {
    e.preventDefault();
    insertMarkdown("- ");
  });
}

if (projectToolbarButtons.orderedList) {
  projectToolbarButtons.orderedList.addEventListener("click", (e) => {
    e.preventDefault();
    insertMarkdown("1. ");
  });
}

if (projectToolbarButtons.codeBlock) {
  projectToolbarButtons.codeBlock.addEventListener("click", (e) => {
    e.preventDefault();
    insertMarkdown("```\n", "\n```");
  });
}

if (projectToolbarButtons.horizontalRule) {
  projectToolbarButtons.horizontalRule.addEventListener("click", (e) => {
    e.preventDefault();
    insertMarkdown("\n---\n");
  });
}
