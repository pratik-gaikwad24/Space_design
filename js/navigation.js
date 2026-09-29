/* =====================================================================
   SPACE DESIGN — Header state, scroll progress, accessible mobile menu
   ===================================================================== */
(function () {
  'use strict';

  function init() {
    var header = document.querySelector('[data-header]');
    var progress = document.querySelector('.scroll-progress');
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-mobile-menu]');
    var label = document.querySelector('[data-menu-label]');
    var srLabel = document.querySelector('[data-menu-sr]');
    var main = document.getElementById('main');
    var footer = document.querySelector('.site-footer');

    /* ---------- Header + scroll progress ---------- */
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var y = window.scrollY || window.pageYOffset;
        if (header) header.classList.toggle('is-solid', y > 24 || (menu && !menu.hidden));
        if (progress) {
          var max = document.documentElement.scrollHeight - window.innerHeight;
          progress.style.setProperty('--progress', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
        }
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();

    if (!toggle || !menu) return;

    /* ---------- Mobile menu (disclosure + inert background + focus loop) ---------- */
    var isOpen = false;
    var closeTimer;

    function focusables() {
      return [toggle].concat(Array.prototype.slice.call(menu.querySelectorAll('a[href], button:not([disabled])')));
    }
    function setInert(on) {
      [main, footer].forEach(function (el) {
        if (!el) return;
        if (on) { el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true'); }
        else { el.removeAttribute('inert'); el.removeAttribute('aria-hidden'); }
      });
    }
    function open() {
      clearTimeout(closeTimer);
      isOpen = true;
      menu.hidden = false;
      void menu.offsetWidth; // reflow so the clip-path transition runs
      menu.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      if (label) label.textContent = 'Close';
      if (srLabel) srLabel.textContent = 'Close navigation menu';
      document.body.classList.add('menu-open');
      if (header) header.classList.add('is-solid');
      setInert(true);
      var first = menu.querySelector('a[href]');
      if (first) first.focus({ preventScroll: true });
    }
    function close(returnFocus) {
      if (!isOpen) return;
      isOpen = false;
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      if (label) label.textContent = 'Menu';
      if (srLabel) srLabel.textContent = 'Open navigation menu';
      document.body.classList.remove('menu-open');
      setInert(false);
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      closeTimer = setTimeout(function () { menu.hidden = true; onScroll(); }, reduce ? 0 : 700);
      if (returnFocus) toggle.focus();
    }

    toggle.addEventListener('click', function () { isOpen ? close(true) : open(); });

    document.addEventListener('keydown', function (e) {
      if (!isOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); close(true); return; }
      if (e.key === 'Tab') {
        var items = focusables();
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    menu.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (a) close(false);
    });

    window.matchMedia('(min-width: 1025px)').addEventListener('change', function (m) { if (m.matches) close(false); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
