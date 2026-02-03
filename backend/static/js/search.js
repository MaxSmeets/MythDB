// Global search functionality

const searchModal = document.getElementById("searchModal");
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const closeSearchModalBtn = document.getElementById("closeSearchModal");
const searchResults = document.getElementById("searchResults");

let searchTimeout = null;

// Open search modal
function openSearchModal() {
  searchModal.classList.remove("hidden");
  searchInput.focus();
}

// Close search modal
function closeSearchModal() {
  searchModal.classList.add("hidden");
  searchInput.value = "";
  searchResults.innerHTML = '<div class="search-empty">Type to search...</div>';
}

// Search button click
searchBtn?.addEventListener("click", () => {
  openSearchModal();
});

// Close button click
closeSearchModalBtn?.addEventListener("click", closeSearchModal);

// Close modal when clicking overlay
searchModal?.addEventListener("click", (e) => {
  if (
    e.target.id === "searchModal" ||
    e.target.classList.contains("modal-overlay")
  ) {
    closeSearchModal();
  }
});

// Keyboard shortcut: ALT+K
document.addEventListener("keydown", (e) => {
  if (e.altKey && e.key.toLowerCase() === "k") {
    e.preventDefault();
    openSearchModal();
  }

  // Close on Escape key
  if (e.key === "Escape" && !searchModal?.classList.contains("hidden")) {
    closeSearchModal();
  }
});

// Perform search with debouncing
searchInput?.addEventListener("input", (e) => {
  const query = e.target.value.trim();

  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  if (!query) {
    searchResults.innerHTML =
      '<div class="search-empty">Type to search...</div>';
    return;
  }

  // Show loading state
  searchResults.innerHTML = '<div class="search-loading">Searching...</div>';

  // Debounce search requests
  searchTimeout = setTimeout(async () => {
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`,
      );
      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      displaySearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
      searchResults.innerHTML =
        '<div class="search-error">Search failed. Please try again.</div>';
    }
  }, 300); // 300ms debounce
});

// Display search results
function displaySearchResults(data) {
  if (!data.results || data.results.length === 0) {
    searchResults.innerHTML =
      '<div class="search-empty">No results found.</div>';
    return;
  }

  const resultsHTML = data.results
    .map(
      (result) => `
    <a href="${result.url}" class="search-result-item">
      ${
        result.thumbnail
          ? `<div class="search-result-thumbnail"><img src="${result.thumbnail}" alt="${result.title}"></div>`
          : ""
      }
      <div class="search-result-content">
        <div class="search-result-header">
          <span class="search-result-title">${highlightMatch(result.title, data.query)}</span>
          <span class="search-result-type">${result.type}</span>
        </div>
        ${
          result.project
            ? `<div class="search-result-meta">Project: ${result.project}</div>`
            : ""
        }
        ${
          result.excerpt
            ? `<div class="search-result-excerpt">${highlightMatch(result.excerpt, data.query)}</div>`
            : ""
        }
      </div>
    </a>
  `,
    )
    .join("");

  searchResults.innerHTML = resultsHTML;
}

// Highlight matching text
function highlightMatch(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

// Escape regex special characters
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
