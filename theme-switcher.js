(function () {
  var STORAGE_KEY = 'banxuexing_theme';
  var THEMES = ['classic', 'ocean', 'forest', 'sunset'];

  function applyTheme(theme) {
    var next = THEMES.indexOf(theme) >= 0 ? theme : 'classic';
    document.body.setAttribute('data-theme', next);
  }

  function initTheme() {
    var select = document.getElementById('themeSelect');
    if (!select) return;

    var stored = localStorage.getItem(STORAGE_KEY) || 'classic';
    applyTheme(stored);
    select.value = THEMES.indexOf(stored) >= 0 ? stored : 'classic';

    select.addEventListener('change', function () {
      var next = select.value;
      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();
