/* Runs synchronously in <head>: enables JS-only motion styles and provides a
   safety net so content is never left hidden if a later script fails. */
(function () {
  var root = document.documentElement;
  root.classList.remove('no-js');
  root.classList.add('js');
  window.setTimeout(function () {
    if (!window.SD_READY) { root.classList.remove('js'); root.classList.add('no-js'); }
  }, 4000);
})();
