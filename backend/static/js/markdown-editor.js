class MarkdownEditor {
  constructor(element, options = {}) {
    this.container = element;
    this.options = options;
    this.projectSlug = options.projectSlug || element.dataset.projectSlug;
    this.textarea = this.container.querySelector(".editor-textarea");

    if (!this.textarea) {
      console.error("MarkdownEditor: Textarea not found in container", element);
      return;
    }

    // State
    this.cachedMedia = null;
    this.cachedArticles = null;

    this.init();
  }

  init() {
    this.initAutoExpand();
    this.initToolbar();
    this.initShortcuts();
    this.initSmartLists();
  }

  initAutoExpand() {
    const expand = () => {
      this.textarea.style.height = "auto";
      this.textarea.style.height = this.textarea.scrollHeight + "px";
    };
    this.textarea.addEventListener("input", expand);
    // Initial expand
    setTimeout(expand, 0);
  }

  insertMarkdown(before, after = "") {
    const start = this.textarea.selectionStart;
    const end = this.textarea.selectionEnd;
    const selectedText = this.textarea.value.substring(start, end);
    const beforeCursor = this.textarea.value.substring(0, start);
    const afterCursor = this.textarea.value.substring(end);

    if (selectedText) {
      this.textarea.value =
        beforeCursor + before + selectedText + after + afterCursor;
      this.textarea.selectionStart = start + before.length;
      this.textarea.selectionEnd = start + before.length + selectedText.length;
    } else {
      this.textarea.value = beforeCursor + before + after + afterCursor;
      this.textarea.selectionStart = start + before.length;
      this.textarea.selectionEnd = start + before.length;
    }

    this.textarea.focus();
    this.triggerInput();
  }

  triggerInput() {
    const event = new Event("input", { bubbles: true });
    this.textarea.dispatchEvent(event);
  }

  initToolbar() {
    const mappings = {
      ".js-bold-btn": { pre: "**", post: "**" },
      ".js-italic-btn": { pre: "*", post: "*" },
      ".js-strikethrough-btn": { pre: "~~", post: "~~" },
      ".js-code-btn": { pre: "`", post: "`" },
      ".js-quote-btn": { action: "quote" },
      ".js-ul-btn": { action: "ul" },
      ".js-ol-btn": { action: "ol" },
      ".js-codeblock-btn": { action: "codeblock" },
      ".js-hr-btn": { action: "hr" },
      ".js-heading-btn": { dropdown: ".js-heading-dropdown" },
      ".js-image-btn": { dropdown: ".js-image-dropdown", load: "media" },
      ".js-link-btn": { dropdown: ".js-link-dropdown", load: "articles" },
      ".js-table-btn": { action: "table" },
      ".js-shortcuts-btn": { action: "shortcuts" },
    };

    for (const [selector, config] of Object.entries(mappings)) {
      const btn = this.container.querySelector(selector);
      if (!btn) continue;

      btn.addEventListener("click", (e) => {
        e.preventDefault();

        if (config.pre) {
          this.insertMarkdown(config.pre, config.post);
        } else if (config.dropdown) {
          this.toggleDropdown(config.dropdown, config.load);
        } else if (config.action) {
          this[config.action + "Action"]();
        }
      });
    }

    // Setup dropdown item clicks
    const headingDropdown = this.container.querySelector(
      ".js-heading-dropdown",
    );
    if (headingDropdown) {
      headingDropdown.querySelectorAll("button").forEach((item) => {
        item.addEventListener("click", () => {
          const level = parseInt(item.dataset.level);
          this.insertHeader(level);
          this.closeAllDropdowns();
        });
      });

      // Add keydown listener to the dropdown for 1-6 keys
      headingDropdown.addEventListener("keydown", (e) => {
        if (e.key >= "1" && e.key <= "6") {
          e.preventDefault();
          e.stopPropagation();
          this.insertHeader(parseInt(e.key));
          this.closeAllDropdowns();
        }
      });
    }

    // Search inputs in dropdowns
    this.container.querySelectorAll(".js-dropdown-search").forEach((input) => {
      input.addEventListener("input", (e) => {
        const type = input.dataset.searchType; // 'media' or 'articles'
        this.filterDropdown(type, e.target.value);
      });

      // Prevent clicking search from closing dropdown
      input.addEventListener("click", (e) => e.stopPropagation());
    });

    // Close dropdowns on outside click
    document.addEventListener("click", (e) => {
      if (!this.container.contains(e.target)) {
        this.closeAllDropdowns();
      }
    });
  }

  closeAllDropdowns() {
    this.container
      .querySelectorAll(
        ".toolbar-dropdown, .article-link-dropdown, .image-dropdown",
      )
      .forEach((el) => {
        el.classList.add("hidden");
      });
  }

  toggleDropdown(selector, loadType) {
    const dropdown = this.container.querySelector(selector);
    const wasHidden = dropdown.classList.contains("hidden");

    this.closeAllDropdowns();

    if (wasHidden) {
      dropdown.classList.remove("hidden");
      const searchInput = dropdown.querySelector("input");
      if (searchInput) {
        searchInput.focus();
      } else {
        // If no search input (like headers), focus the first button or the dropdown itself
        const firstBtn = dropdown.querySelector("button");
        if (firstBtn) firstBtn.focus();
      }

      if (loadType === "media" && !this.cachedMedia) {
        this.loadMedia();
      } else if (loadType === "articles" && !this.cachedArticles) {
        this.loadArticles();
      }
    }
  }

  // --- Complex Actions ---

  ulAction() {
    this.handleList("- ", false);
  }

  olAction() {
    this.handleList("1. ", true);
  }

  handleList(marker, isOrdered = false) {
    const start = this.textarea.selectionStart;
    const end = this.textarea.selectionEnd;
    const selectedText = this.textarea.value.substring(start, end);
    const beforeCursor = this.textarea.value.substring(0, start);
    const afterCursor = this.textarea.value.substring(end);

    if (selectedText) {
      const lines = selectedText.split("\n");
      const mapped = lines
        .map((line, i) => {
          // Basic logic to replace existing list markers if present
          // Matches "- ", "* ", "1. ", "01. " at start of line
          const cleaned = line.replace(/^\s*([-*+]|\d+\.)\s+/, "");
          return isOrdered ? `${i + 1}. ${cleaned}` : `${marker}${cleaned}`;
        })
        .join("\n");
      this.textarea.value = beforeCursor + mapped + afterCursor;
      this.textarea.selectionStart = start;
      this.textarea.selectionEnd = start + mapped.length;
    } else {
      // Logic for empty selection: detect if we are on a line that needs conversion?
      // For now, simple insert
      this.textarea.value = beforeCursor + marker + afterCursor;
      this.textarea.selectionStart = start + marker.length;
      this.textarea.selectionEnd = start + marker.length;
    }
    this.textarea.focus();
    this.triggerInput();
  }

  codeblockAction() {
    this.insertMarkdown("```\n", "\n```");
    // If caching selection, adjust cursor inside
  }

  hrAction() {
    this.insertMarkdown("\n---\n");
  }

  quoteAction() {
    this.handleList("> ");
  }

  insertHeader(level) {
    const prefix = "#".repeat(level) + " ";
    this.insertMarkdown(prefix);
  }

  // --- External Integrations ---

  tableAction() {
    window.currentMarkdownEditor = this;
    const modal = document.getElementById("tableBuilderModal");
    if (modal) {
      modal.classList.remove("hidden");
      // optionally reset inputs
    } else {
      console.warn("Table Builder Modal not found");
    }
  }

  shortcutsAction() {
    const modal = document.getElementById("keyboardShortcutsModal");
    if (modal) modal.showModal();
  }

  // --- Data Loading ---

  async loadMedia() {
    if (!this.projectSlug) return;
    try {
      const res = await fetch(`/projects/${this.projectSlug}/api/media`);
      if (res.ok) {
        this.cachedMedia = await res.json();
        this.renderMediaList(this.cachedMedia);
      }
    } catch (e) {
      console.error("Failed to load media", e);
    }
  }

  renderMediaList(files) {
    const list = this.container.querySelector(".js-image-list");
    if (!list) return;

    if (files.length === 0) {
      list.innerHTML =
        '<div class="image-dropdown-empty">No images found</div>';
      return;
    }

    list.innerHTML = files
      .map(
        (file) => `
            <div class="image-dropdown-item" data-filename="${file.filename}">
              <img src="${file.url}" alt="${file.filename}" class="image-dropdown-thumb">
              <div class="image-dropdown-name">${file.filename}</div>
            </div>
        `,
      )
      .join("");

    list.querySelectorAll(".image-dropdown-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const filename = item.dataset.filename;
        this.insertMarkdown(`![image](media/${filename})`);
        this.closeAllDropdowns();
      });
    });
  }

  async loadArticles() {
    if (!this.projectSlug) return;
    try {
      // Exclude logic could be passed in options if needed
      const res = await fetch(`/projects/${this.projectSlug}/api/articles`);
      if (res.ok) {
        this.cachedArticles = await res.json();
        this.renderArticleList(this.cachedArticles);
      }
    } catch (e) {
      console.error("Failed to load articles", e);
    }
  }

  renderArticleList(articles) {
    const list = this.container.querySelector(".js-article-list");
    if (!list) return;

    if (articles.length === 0) {
      list.innerHTML =
        '<div class="article-dropdown-empty">No articles found</div>';
      return;
    }

    list.innerHTML = articles
      .map(
        (article) => `
            <div class="article-dropdown-item" data-slug="${article.slug}" data-title="${article.title}">
              <div class="article-dropdown-title">${article.title}</div>
              <div class="article-dropdown-type">${article.type_name}</div>
            </div>
        `,
      )
      .join("");

    list.querySelectorAll(".article-dropdown-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const { slug, title } = item.dataset;
        this.insertMarkdown(`[${title}](article:${slug})`);
        this.closeAllDropdowns();
      });
    });
  }

  filterDropdown(type, term) {
    term = term.toLowerCase();
    if (type === "media" && this.cachedMedia) {
      const filtered = this.cachedMedia.filter((f) =>
        f.filename.toLowerCase().includes(term),
      );
      this.renderMediaList(filtered);
    } else if (type === "articles" && this.cachedArticles) {
      const filtered = this.cachedArticles.filter((a) =>
        a.title.toLowerCase().includes(term),
      );
      this.renderArticleList(filtered);
    }
  }

  // --- Shortcuts & Smart Lists ---

  initShortcuts() {
    this.textarea.addEventListener("keydown", (e) => {
      if (!e.altKey) return;

      const key = e.key.toLowerCase();
      const mappings = {
        b: () => this.insertMarkdown("**", "**"),
        i: () => this.insertMarkdown("*", "*"),
        s: () => this.insertMarkdown("~~", "~~"),
        "`": () => this.insertMarkdown("`", "`"),
        q: () => this.quoteAction(),
        u: () => this.ulAction(),
        o: () => this.olAction(),
        "-": () => this.hrAction(),
        l: () => this.container.querySelector(".js-link-btn")?.click(),
        h: () => this.container.querySelector(".js-heading-btn")?.click(),
      };

      if (mappings[key]) {
        e.preventDefault();
        mappings[key]();
      }
    });
  }

  initSmartLists() {
    this.textarea.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;

      const cursorPos = this.textarea.selectionStart;
      const textBefore = this.textarea.value.substring(0, cursorPos);
      const lines = textBefore.split("\n");
      const currentLine = lines[lines.length - 1];

      // Unordered list
      const unorderedMatch = currentLine.match(/^(\s*)-\s(.*)/);
      if (unorderedMatch) {
        e.preventDefault();
        const indent = unorderedMatch[1];
        const content = unorderedMatch[2];

        if (!content.trim()) {
          // Empty item, exit list (remove line)
          const beforeLine = lines.slice(0, -1).join("\n");
          const afterCursor = this.textarea.value.substring(cursorPos);
          this.textarea.value = beforeLine + "\n" + afterCursor;
          this.textarea.selectionStart = beforeLine.length + 1;
          this.textarea.selectionEnd = beforeLine.length + 1;
        } else {
          this.insertMarkdown("\n" + indent + "- ");
        }
        return;
      }

      // Ordered list
      const orderedMatch = currentLine.match(/^(\s*)(\d+)\.\s(.*)/);
      if (orderedMatch) {
        e.preventDefault();
        const indent = orderedMatch[1];
        const number = parseInt(orderedMatch[2], 10);
        const content = orderedMatch[3];

        if (!content.trim()) {
          const beforeLine = lines.slice(0, -1).join("\n");
          const afterCursor = this.textarea.value.substring(cursorPos);
          this.textarea.value = beforeLine + "\n" + afterCursor;
          this.textarea.selectionStart = beforeLine.length + 1;
          this.textarea.selectionEnd = beforeLine.length + 1;
        } else {
          this.insertMarkdown("\n" + indent + (number + 1) + ". ");
        }
      }
    });
  }
}

// Global Table Builder Integration
document.addEventListener("DOMContentLoaded", () => {
  const insertTableBtn = document.getElementById("insertTableBtn");
  if (insertTableBtn) {
    insertTableBtn.addEventListener("click", () => {
      const editor = window.currentMarkdownEditor;
      if (!editor) return;

      // ... Table Logic from original article.js ...
      // We need to re-implement the tableToMarkdown logic or expose it
      // For now, I'll implement a simple one here to keep it self-contained

      const tableRowsInput = document.getElementById("tableRows");
      const tableColumnsInput = document.getElementById("tableColumns");

      // We need 'currentTableData' which was in article.js scope
      // This suggests we should probably move the Table Logic to this file as well
      // Or make a TableBuilder class.
      // For now, I'll rely on the existing logic in article.js IF it was global,
      // but it wasn't. It was local to article.js.
      // So we MUST implement the table builder logic here or in another shared file.
    });
  }
});

// Since I cannot easily access the `currentTableData` from the original file unless I refactor it too,
// I will include the TableBuilder logic in this file as a separate class or simple functions at the bottom.

const TableBuilder = {
  currentTableData: [],

  init() {
    const btn = document.getElementById("tableBuilderBtn"); // Wait, this button is in the editor toolbar, handled by class
    const modal = document.getElementById("tableBuilderModal");
    if (!modal) return;

    // Modal helpers
    const closeModal = () => {
      modal.classList.add("hidden");
      this.currentTableData = [];
    };

    document
      .getElementById("closeTableModal")
      ?.addEventListener("click", closeModal);
    document
      .getElementById("cancelTableBtn")
      ?.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    const rowsInput = document.getElementById("tableRows");
    const colsInput = document.getElementById("tableColumns");

    const updatePreview = () => {
      this.generatePreview(rowsInput.value, colsInput.value);
    };

    rowsInput?.addEventListener("change", updatePreview);
    colsInput?.addEventListener("change", updatePreview);

    // Hook into open event (dispatched by editor)
    // Actually, the editor code above just removes 'hidden' class.
    // We can listen for that or just rely on the inputs being there.
    // But we need to reset data when opened.
    // We can use a MutationObserver on value of modal class? No.
    // Let's just make `start()` public method called by editor.
  },

  start() {
    const modal = document.getElementById("tableBuilderModal");
    const rowsInput = document.getElementById("tableRows");
    if (rowsInput) {
      rowsInput.focus();
      this.generatePreview(
        rowsInput.value,
        document.getElementById("tableColumns").value,
      );
    }
  },

  generatePreview(rows, cols) {
    rows = parseInt(rows) || 1;
    cols = parseInt(cols) || 1;

    // Resize data
    if (this.currentTableData.length === 0) {
      this.currentTableData = Array(rows)
        .fill(null)
        .map(() => Array(cols).fill(""));
    }
    // ... (Simplified resize logic for brevity, matches original) ...
    // Re-creating data from scratch for simplicity if dimensions change drastically vs
    // preserving data is complex. I'll just clear it or simple resize.
    // Actually, simplest is to just rebuild array and try to keep values.

    const newData = Array(rows)
      .fill(null)
      .map((_, r) =>
        Array(cols)
          .fill(null)
          .map(
            (_, c) =>
              (this.currentTableData[r] && this.currentTableData[r][c]) || "",
          ),
      );
    this.currentTableData = newData;

    const container = document.getElementById("tablePreviewContainer");
    if (!container) return;

    container.innerHTML = "";
    const table = document.createElement("table");
    table.className = "table-builder-preview";

    this.currentTableData.forEach((row, r) => {
      const tr = document.createElement("tr");
      row.forEach((cell, c) => {
        const td = document.createElement("td");
        const input = document.createElement("input");
        input.className = "table-cell-input";
        input.value = cell;
        input.placeholder = `R${r + 1} C${c + 1}`;
        input.addEventListener("input", (e) => {
          this.currentTableData[r][c] = e.target.value;
        });
        td.appendChild(input);
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
    container.appendChild(table);
  },

  insert() {
    const editor = window.currentMarkdownEditor;
    if (!editor || this.currentTableData.length === 0) return;

    const markdown = this.tableToMarkdown(this.currentTableData);
    editor.insertMarkdown("\n\n" + markdown + "\n\n");

    document.getElementById("tableBuilderModal").classList.add("hidden");
  },

  tableToMarkdown(data) {
    const cols = data[0].length;
    let md = "";
    data.forEach((row, i) => {
      md += "| " + row.join(" | ") + " |\n";
      if (i === 0) {
        md += "| " + Array(cols).fill("---").join(" | ") + " |\n";
      }
    });
    return md;
  },
};

// Initialize table builder listeners
document.addEventListener("DOMContentLoaded", () => {
  TableBuilder.init();
  document
    .getElementById("insertTableBtn")
    ?.addEventListener("click", () => TableBuilder.insert());
});

// Monkey-patch the tableAction to initialize
MarkdownEditor.prototype.tableAction = function () {
  window.currentMarkdownEditor = this;
  const modal = document.getElementById("tableBuilderModal");
  if (modal) {
    modal.classList.remove("hidden");
    TableBuilder.start();
  }
};
