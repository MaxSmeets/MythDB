// Project page functionality

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
const recentArticlesCollapseBtn = recentArticlesCard?.querySelector(".btn-collapse");

if (recentArticlesCollapseBtn) {
  recentArticlesCollapseBtn.addEventListener("click", () => {
    const isExpanded = recentArticlesCollapseBtn.getAttribute("aria-expanded") === "true";
    recentArticlesCollapseBtn.setAttribute("aria-expanded", !isExpanded);
    recentArticlesContent.classList.toggle("hidden");
  });
}
