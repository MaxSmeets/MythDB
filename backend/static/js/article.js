// Article page functionality

// Mode toggle (Read/Edit)
const modeToggle = document.getElementById("modeToggle");
const saveBtn = document.getElementById("saveBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const readMode = document.getElementById("readMode");
const editMode = document.getElementById("editMode");
const fieldInputs = document.querySelectorAll(".field-input");
const editorTextarea = document.getElementById("editorTextarea");

// Image viewer modal
const featuredImage = document.getElementById("featuredImage");
const imageViewerModal = document.getElementById("imageViewerModal");
const modalImage = document.getElementById("modalImage");
const closeImageModalBtn = document.getElementById("closeImageModal");

// Editor Instantiation
const editorInstance = document.querySelector(".markdown-editor-instance");
if (editorInstance) {
  const projectSlug =
    document.querySelector(".article-layout")?.dataset.projectSlug;
  new MarkdownEditor(editorInstance, { projectSlug });
}

let currentMode = "read";
let pendingChanges = {}; // Store changes to save on button click
let originalFieldValues = {}; // Store original field values for cancel

// Enable/disable structured fields based on mode
function updateFieldsState() {
  fieldInputs.forEach((input) => {
    input.disabled = currentMode === "read";
  });
}

modeToggle.addEventListener("click", () => {
  if (currentMode === "read") {
    // Switch to edit
    readMode.classList.add("hidden");
    editMode.classList.remove("hidden");
    document.getElementById("viewModeFields")?.classList.add("hidden");
    document.getElementById("editModeFields")?.classList.remove("hidden");
    modeToggle.classList.add("hidden");
    modeToggle.dataset.mode = "edit";
    saveBtn.classList.remove("hidden");
    cancelEditBtn.classList.remove("hidden");
    selectImageBtn?.classList.remove("hidden");
    changeImageBtn?.classList.remove("hidden");
    currentMode = "edit";
    updateFieldsState();

    // Store original field values for cancel
    originalFieldValues = {};
    fieldInputs.forEach((input) => {
      originalFieldValues[input.id] = input.value;
    });

    // Initialize tooltips for the edit mode fields
    initializeTooltips();

    editMode.querySelector("textarea").focus();
  } else {
    // Switch to read (without saving)
    readMode.classList.remove("hidden");
    editMode.classList.add("hidden");
    document.getElementById("viewModeFields")?.classList.remove("hidden");
    document.getElementById("editModeFields")?.classList.add("hidden");
    modeToggle.classList.remove("hidden");
    modeToggle.dataset.mode = "read";
    saveBtn.classList.add("hidden");
    cancelEditBtn.classList.add("hidden");
    selectImageBtn?.classList.add("hidden");
    changeImageBtn?.classList.add("hidden");
    currentMode = "read";
    updateFieldsState();
  }
});

cancelEditBtn.addEventListener("click", () => {
  const textarea = editMode.querySelector("textarea");
  const markdownChanged = textarea.value !== textarea.defaultValue;
  const hasFieldChanges = Object.keys(pendingChanges).length > 0;

  if (markdownChanged || hasFieldChanges) {
    const confirmed = confirm(
      "You have unsaved changes. Are you sure you want to discard them?",
    );
    if (!confirmed) return;
  }

  // Clear pending changes
  pendingChanges = {};
  originalFieldValues = {};

  // Reload the page to restore original state
  window.location.reload();
});

// Save button handler - save all pending changes and switch to view mode
saveBtn.addEventListener("click", async () => {
  const projectSlug = document.querySelector("[data-project-slug]")?.dataset
    .projectSlug;
  const articleId = parseInt(
    document.querySelector("[data-article-id]")?.dataset.articleId || 0,
    10,
  );
  const textarea = document.getElementById("editorTextarea");
  const bodyContent = textarea.value;

  try {
    // Save markdown content
    const markdownResponse = await fetch(
      `/projects/${projectSlug}/a/${articleId}/edit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          body_content: bodyContent,
        }).toString(),
      },
    );

    if (!markdownResponse.ok) {
      throw new Error("Failed to save markdown");
    }

    // Save all pending field changes
    const savePromises = Object.entries(pendingChanges).map(
      ([promptId, change]) =>
        fetch(`/projects/${projectSlug}/a/${articleId}/api/set-prompt`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt_id: parseInt(promptId, 10),
            value: change.value,
            linked_article_id: change.linkedArticleId,
          }),
        }),
    );

    await Promise.all(savePromises);
    pendingChanges = {}; // Clear pending changes

    // Reload the page to show updated content
    window.location.reload();
  } catch (error) {
    console.error("Error saving changes:", error);
    alert("Failed to save changes");
  }
});

// Load media files on page load
loadMediaFiles();

// Image selection functionality
const imageDropdown = document.getElementById("imageDropdown");
const imageSearchInput = document.getElementById("imageSearchInput");
const imageList = document.getElementById("imageList");
const selectImageBtn = document.getElementById("selectImageBtn");
const changeImageBtn = document.getElementById("changeImageBtn");
const imagePickerPlaceholder = document.getElementById(
  "imagePickerPlaceholder",
);

let allMediaFiles = [];

// Fetch media files from API
async function loadMediaFiles() {
  const projectSlug = document.querySelector("[data-project-slug]")?.dataset
    .projectSlug;

  try {
    const response = await fetch(`/projects/${projectSlug}/api/media`);
    if (response.ok) {
      allMediaFiles = await response.json();
      renderMediaList(allMediaFiles);
    }
  } catch (error) {
    console.error("Failed to load media files:", error);
  }
}

// Render media list
function renderMediaList(files) {
  if (files.length === 0) {
    imageList.innerHTML =
      '<div class="image-dropdown-empty">No images found</div>';
    return;
  }

  imageList.innerHTML = files
    .map(
      (file) => `
    <div class="image-dropdown-item" data-filename="${file.filename}">
      <img src="${file.url}" alt="${file.filename}" class="image-dropdown-thumb">
      <div class="image-dropdown-name">${file.filename}</div>
    </div>
  `,
    )
    .join("");

  // Add click handlers to items
  document
    .querySelectorAll("#imageList .image-dropdown-item")
    .forEach((item) => {
      item.addEventListener("click", () => {
        const filename = item.dataset.filename;
        selectImage(filename);
        imageDropdown.classList.add("hidden");
      });
    });
}

// Filter media files based on search
function filterMediaFiles(searchTerm) {
  const filtered = allMediaFiles.filter((file) =>
    file.filename.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  renderMediaList(filtered);
}

// Select image and update article
async function selectImage(filename) {
  const projectSlug = document.querySelector("[data-project-slug]")?.dataset
    .projectSlug;
  const articleId = parseInt(
    document.querySelector("[data-article-id]")?.dataset.articleId || 0,
    10,
  );

  try {
    const response = await fetch(
      `/projects/${projectSlug}/a/${articleId}/api/set-image`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured_image: filename }),
      },
    );

    if (response.ok) {
      // Update the image display without reloading
      const mediaUrl = `/projects/${projectSlug}/media/files/${filename}`;

      // Replace placeholder with image if needed
      const placeholder = document.getElementById("imagePickerPlaceholder");
      if (placeholder && !placeholder.classList.contains("hidden")) {
        const container = document.createElement("div");
        container.className = "article-image-container";
        container.innerHTML = `
          <img 
            src="${mediaUrl}" 
            alt="Featured image"
            class="article-image"
            style="cursor: pointer;"
          >
          <button type="button" id="changeImageBtn" class="btn-change-image">Change Image</button>
        `;
        placeholder.replaceWith(container);

        // Re-attach event listener to the new button
        document
          .getElementById("changeImageBtn")
          ?.addEventListener("click", (e) => {
            e.preventDefault();
            imageDropdown.classList.toggle("hidden");
            if (!imageDropdown.classList.contains("hidden")) {
              imageSearchInput.focus();
            }
          });
      } else {
        // Update existing image
        const img = document.querySelector(".article-image");
        if (img) {
          img.src = mediaUrl;
        }
      }
    } else {
      alert("Failed to set featured image");
    }
  } catch (error) {
    console.error("Error setting featured image:", error);
    alert("Error setting featured image");
  }
}

// Toggle dropdown on button click
if (selectImageBtn) {
  selectImageBtn.addEventListener("click", (e) => {
    e.preventDefault();
    imageDropdown.classList.toggle("hidden");
    if (!imageDropdown.classList.contains("hidden")) {
      imageSearchInput.focus();
    }
  });
}

if (changeImageBtn) {
  changeImageBtn.addEventListener("click", (e) => {
    e.preventDefault();
    imageDropdown.classList.toggle("hidden");
    if (!imageDropdown.classList.contains("hidden")) {
      imageSearchInput.focus();
    }
  });
}

// Filter media as user types
imageSearchInput.addEventListener("input", (e) => {
  filterMediaFiles(e.target.value);
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (
    !e.target.closest("#selectImageBtn") &&
    !e.target.closest("#changeImageBtn") &&
    !e.target.closest("#imageDropdown")
  ) {
    imageDropdown.classList.add("hidden");
  }
});

// Metadata card collapse/expand
const metadataCard = document.getElementById("metadataCard");
const metadataContent = document.getElementById("metadataContent");
const collapseBtn = metadataCard?.querySelector(".btn-collapse");

if (collapseBtn) {
  collapseBtn.addEventListener("click", () => {
    const isExpanded = collapseBtn.getAttribute("aria-expanded") === "true";
    collapseBtn.setAttribute("aria-expanded", !isExpanded);
    metadataContent.classList.toggle("hidden");
  });
}

// Structured fields functionality - track changes for deferred save
fieldInputs.forEach((input) => {
  input.addEventListener("change", () => {
    const fieldGroup = input.closest(".field-group");
    const promptId = fieldGroup.dataset.promptId;
    const promptType = fieldGroup.dataset.promptType;

    let value = null;
    let linkedArticleId = null;

    if (promptType === "text") {
      value = input.value || null;
    } else if (promptType === "select") {
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
  const tooltipTriggers = document.querySelectorAll(".tooltip-trigger");

  tooltipTriggers.forEach((trigger) => {
    trigger.addEventListener("mouseenter", () => {
      const tooltipKey = trigger.getAttribute("data-tooltip-key");
      const tooltip = document.querySelector(
        `.tooltip-content[data-tooltip-key="${tooltipKey}"]`,
      );
      if (tooltip) {
        tooltip.classList.add("visible");
      }
    });

    trigger.addEventListener("mouseleave", () => {
      const tooltipKey = trigger.getAttribute("data-tooltip-key");
      const tooltip = document.querySelector(
        `.tooltip-content[data-tooltip-key="${tooltipKey}"]`,
      );
      if (tooltip) {
        tooltip.classList.remove("visible");
      }
    });

    // Also support click to toggle tooltip
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const tooltipKey = trigger.getAttribute("data-tooltip-key");
      const tooltip = document.querySelector(
        `.tooltip-content[data-tooltip-key="${tooltipKey}"]`,
      );
      if (tooltip) {
        tooltip.classList.toggle("visible");
      }
    });
  });
}

// Initialize tooltips on page load
initializeTooltips();

// Re-initialize tooltips when switching to edit mode
const editModeFields = document.getElementById("editModeFields");
if (editModeFields) {
  const observer = new MutationObserver(() => {
    if (!editModeFields.classList.contains("hidden")) {
      initializeTooltips();
    }
  });

  observer.observe(editModeFields, {
    attributes: true,
    attributeFilter: ["class"],
  });
}

// Close tooltip when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".tooltip-trigger")) {
    document.querySelectorAll(".tooltip-content").forEach((tooltip) => {
      tooltip.classList.remove("visible");
    });
  }
});

// ===========================
// IMAGE VIEWER FUNCTIONALITY
// ==========================

// Open image viewer modal when clicking featured image
document.addEventListener("click", (e) => {
  if (
    e.target.classList.contains("article-image") ||
    e.target.id === "featuredImage"
  ) {
    modalImage.src = e.target.src;
    imageViewerModal.classList.remove("hidden");
  }
});

// Close image viewer modal
function closeImageViewer() {
  imageViewerModal.classList.add("hidden");
}

closeImageModalBtn?.addEventListener("click", closeImageViewer);

// Close modal when clicking the overlay
imageViewerModal?.addEventListener("click", (e) => {
  if (e.target.id === "imageViewerModal") {
    closeImageViewer();
  }
});

// Close modal on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !imageViewerModal?.classList.contains("hidden")) {
    closeImageViewer();
  }
});
