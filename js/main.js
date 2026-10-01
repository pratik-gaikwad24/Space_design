/* =====================================================================
   SPACE DESIGN — Motion & shared behaviours
   IntersectionObserver reveals, lazy video, cursor label, footer year.
   No animation libraries. Respects prefers-reduced-motion.
   ===================================================================== */
(function () {
  'use strict';
  var SD = (window.SD = window.SD || {});
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Reveal on scroll ---------- */
  var io = null;
  if ('IntersectionObserver' in window && !reduce) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          (entry.target.__sdReveal || entry.target).classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  }

  /** Observe [data-reveal] elements inside root (call again after dynamic renders). */
  function reveal(root) {
    var els = (root || document).querySelectorAll('[data-reveal]:not(.is-in)');
    els.forEach(function (el, i) {
      var d = el.getAttribute('data-delay');
      if (d) el.style.setProperty('--delay', parseInt(d, 10) + 'ms');
      else if (el.closest('.project-grid, .work-grid')) el.style.setProperty('--delay', (i % 2) * 120 + 'ms');
      if (!io) { el.classList.add('is-in'); return; }
      // A fully clipped element never "intersects" in Chrome, so image reveals
      // are observed through their parent.
      if (el.getAttribute('data-reveal') === 'image' && el.parentElement) {
        el.parentElement.__sdReveal = el;
        io.observe(el.parentElement);
      } else io.observe(el);
    });
  }

  /* ---------- Lazy video: <video data-lazy-video> with <source data-src> ---------- */
  var vio = null;
  function lazyVideos(root) {
    var vids = (root || document).querySelectorAll('video[data-lazy-video]');
    if (!vids.length) return;
    function load(v) {
      v.querySelectorAll('source[data-src]').forEach(function (s) { s.src = s.getAttribute('data-src'); s.removeAttribute('data-src'); });
      v.removeAttribute('data-lazy-video');
      v.load();
    }
    if (!('IntersectionObserver' in window)) { vids.forEach(load); return; }
    vio = vio || new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { load(e.target); vio.unobserve(e.target); } });
    }, { rootMargin: '200px 0px' });
    vids.forEach(function (v) { vio.observe(v); });
  }

  /* ---------- Cursor label over project media (fine pointer only, decorative) ---------- */
  function cursor() {
    if (reduce || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var c = document.createElement('div');
    c.className = 'cursor-view';
    c.setAttribute('aria-hidden', 'true');
    c.textContent = 'View';
    document.body.appendChild(c);
    var raf;
    document.addEventListener('pointermove', function (e) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        c.style.setProperty('--x', e.clientX + 'px');
        c.style.setProperty('--y', e.clientY + 'px');
        var over = e.target.closest && e.target.closest('[data-cursor] .project-card-media');
        c.classList.toggle('is-visible', !!over);
      });
    }, { passive: true });
    document.addEventListener('pointerleave', function () { c.classList.remove('is-visible'); });
  }


  function init() {
    document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
    reveal(document);
    lazyVideos(document);
    cursor();

    // External links opened in a new tab always get rel protection.
    document.querySelectorAll('a[target="_blank"]').forEach(function (a) {
      var rel = (a.getAttribute('rel') || '').split(/\s+/);
      ['noopener', 'noreferrer'].forEach(function (r) { if (rel.indexOf(r) === -1) rel.push(r); });
      a.setAttribute('rel', rel.join(' ').trim());
    });

    window.SD_READY = true;
  }

  SD.motion = { reveal: reveal, lazyVideos: lazyVideos, reduce: reduce };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
