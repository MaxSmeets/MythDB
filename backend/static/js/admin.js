// Admin page functionality

const quickGuideToggle = document.getElementById('quickGuideToggle');

function initQuickGuideToggle() {
  const isHidden = localStorage.getItem('quickGuideHidden') === 'true';
  quickGuideToggle.checked = !isHidden;
}

if (quickGuideToggle) {
  quickGuideToggle.addEventListener('change', () => {
    const shouldHide = !quickGuideToggle.checked;
    localStorage.setItem('quickGuideHidden', shouldHide ? 'true' : 'false');
  });
  
  initQuickGuideToggle();
}
