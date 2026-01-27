// Base template functionality

document.addEventListener('DOMContentLoaded', function() {
  // Setup folder menu button listeners
  document.querySelectorAll('.tree-menu-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Find the associated dropdown - it's within the parent
      var dropdown = btn.parentElement.querySelector('.tree-dropdown');
      
      if (dropdown) {
        // Close other dropdowns
        document.querySelectorAll('.tree-dropdown.active').forEach(function(d) {
          if (d !== dropdown) d.classList.remove('active');
        });
        dropdown.classList.toggle('active');
      }
    });
  });
  
  // Close dropdowns on outside click
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.tree-folder-menu')) {
      document.querySelectorAll('.tree-dropdown.active').forEach(function(d) {
        d.classList.remove('active');
      });
    }
  });
  
  // Folder toggle
  document.querySelectorAll('.tree-toggle').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var folder = btn.closest('.tree-folder');
      if (folder) {
        var folderId = folder.getAttribute('data-folder-id');
        var isExpanded = folder.getAttribute('data-expanded') === 'true';
        var newExpanded = !isExpanded;
        folder.setAttribute('data-expanded', newExpanded);
        localStorage.setItem('folder-' + folderId, newExpanded);
      }
    });
  });
});
