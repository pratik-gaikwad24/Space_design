/* =====================================================================
   SPACE DESIGN — Home page
   Hero slider · optional first-slide image from site settings ·
   count-up figures · featured works (shared project cards) with "Load more" · testimonials.
   ===================================================================== */
(function () {
  'use strict';
  var SD = window.SD || {};
  var U = SD.utils;

  /*
   * Client testimonials. The section stays hidden while this list is empty.
   * Add real, approved quotes only, e.g.
   *   { quote: '…', author: 'Chairman', org: 'Gulmohar Co-op. Hsg. Soc. Ltd.' }
   */
  var TESTIMONIALS = [];

  var WORKS_FIRST = 8;   // two rows of four cards before "Load more"
  var WORKS_STEP = 4;    // one more row per click

  /* ---------- Hero slider ---------- */
  function slider() {
    var root = document.querySelector('[data-slider]');
    if (!root) return;
    var slides = root.querySelectorAll('.hero-slide');
    var current = root.querySelector('[data-slide-current]');
    var pauseBtn = root.querySelector('[data-slide-pause]');
    var pauseIcon = root.querySelector('[data-pause-icon]');
    var bar = root.querySelector('[data-slide-progress]');
    var idx = 0, timer = null, userPaused = U.prefersReducedMotion();
    var DELAY = 6500;

    function show(n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        var on = i === idx;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
        if (on) s.removeAttribute('inert'); else s.setAttribute('inert', '');
      });
      if (current) current.textContent = U.pad(idx + 1);
    }
    // Thin line under the counter that fills while a slide is on screen.
    function progress(run) {
      if (!bar) return;
      bar.classList.remove('is-running');
      if (run) { void bar.offsetWidth; bar.classList.add('is-running'); }
    }
    function stop() { clearInterval(timer); timer = null; progress(false); }
    function start() {
      stop();
      if (userPaused || slides.length < 2) return;
      progress(true);
      timer = setInterval(function () { show(idx + 1); progress(true); }, DELAY);
    }
    function setPaused(p) {
      userPaused = p;
      if (pauseBtn) {
        pauseBtn.setAttribute('aria-pressed', p ? 'true' : 'false');
        pauseBtn.setAttribute('aria-label', p ? 'Play slideshow' : 'Pause slideshow');
      }
      if (pauseIcon) pauseIcon.textContent = p ? '▶' : '❚❚';
      p ? stop() : start();
    }

    root.querySelector('[data-slide-prev]').addEventListener('click', function () { show(idx - 1); start(); });
    root.querySelector('[data-slide-next]').addEventListener('click', function () { show(idx + 1); start(); });
    if (pauseBtn) pauseBtn.addEventListener('click', function () { setPaused(!userPaused); });

    // Hold still while the visitor is reading or using the controls.
    root.addEventListener('pointerenter', stop);
    root.addEventListener('pointerleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) start(); });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });

    // Swipe on touch screens.
    var x0 = null;
    root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) { show(idx + (dx < 0 ? 1 : -1)); start(); }
      x0 = null;
    });

    show(0);
    setPaused(userPaused);
    requestAnimationFrame(function () { root.classList.add('is-ready'); });
  }

  /* ---------- Optional first-slide image from site_settings.home_hero ---------- */
  async function heroMedia() {
    if (!SD.supabaseConfigured) return;
    var res = await SD.api.getSettings(['home_hero']);
    var h = res.data && res.data.home_hero;
    var url = h && U.safeUrl(h.image_url);
    if (!url) return;
    // Set through the CSSOM (allowed by the CSP), not an inline style attribute.
    var bg = document.querySelector('.hero-slide .hero-slide-bg');
    if (bg) bg.style.backgroundImage = 'url("' + url.replace(/"/g, '%22') + '")';
  }

  /* ---------- Count-up figures ---------- */
  function counters() {
    var els = document.querySelectorAll('[data-count]');
    if (!els.length || U.prefersReducedMotion() || !('IntersectionObserver' in window)) return;
    function fmt(n, pad) { return pad ? String(n).padStart(pad, '0') : n.toLocaleString('en-IN'); }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target, end = parseInt(el.getAttribute('data-count'), 10);
        var pad = parseInt(el.getAttribute('data-pad') || '0', 10);
        var t0 = performance.now(), dur = 1600;
        (function tick(t) {
          var k = Math.min(1, (t - t0) / dur);
          el.textContent = fmt(Math.round(end * (1 - Math.pow(1 - k, 3))), pad);
          if (k < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Featured works: three-column grid with "Load more" ---------- */
  async function works() {
    var grid = document.querySelector('[data-works-grid]');
    if (!grid) return;
    var more = document.querySelector('[data-works-more]');
    var all = document.querySelector('[data-works-all]');
    var res = await SD.api.listProjects({});
    grid.setAttribute('aria-busy', 'false');

    if (res.error) {
      grid.innerHTML = '<div class="empty-state"><h3>Projects could not be loaded</h3><p>Please refresh the page or <a class="text-link" href="portfolio.html">visit the projects page</a>.</p></div>';
      return;
    }
    // Featured projects first, then the rest of the portfolio.
    var items = (res.data || []).slice().sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); });
    if (!items.length) {
      grid.innerHTML = '<div class="empty-state"><h3>Selected projects are being curated.</h3><p>Project photography and details will be published here soon.</p></div>';
      return;
    }

    var shown = 0;
    function render(n) {
      var next = items.slice(shown, shown + n);
      var tmp = document.createElement('div');
      tmp.innerHTML = next.map(SD.ui.portfolioCard).join('');
      var firstNew = tmp.firstElementChild;
      while (tmp.firstChild) grid.appendChild(tmp.firstChild);
      shown += next.length;
      SD.motion.reveal(grid);
      var done = shown >= items.length;
      if (more) more.hidden = done;
      if (all) all.hidden = !done;
      return firstNew;
    }

    grid.innerHTML = '';
    render(WORKS_FIRST);
    if (more) more.addEventListener('click', function () {
      var first = render(WORKS_STEP);
      var link = first && first.querySelector('a');
      if (link) link.focus({ preventScroll: false });
      U.announce(shown + ' of ' + items.length + ' projects shown');
    });
  }

  /* ---------- Testimonials ---------- */
  function testimonials() {
    var section = document.querySelector('[data-testimonials]');
    if (!section || !TESTIMONIALS.length) return;
    var track = section.querySelector('[data-testimonial-track]');
    var dots = section.querySelector('[data-testimonial-dots]');
    track.innerHTML = TESTIMONIALS.map(function (t, i) {
      return '<figure class="testimonial' + (i === 0 ? ' is-active' : '') + '">' +
        '<blockquote><p>' + U.esc(t.quote) + '</p></blockquote>' +
        '<figcaption><strong>' + U.esc(t.author) + '</strong>' + (t.org ? '<span>' + U.esc(t.org) + '</span>' : '') + '</figcaption>' +
      '</figure>';
    }).join('');
    if (TESTIMONIALS.length > 1) {
      dots.innerHTML = TESTIMONIALS.map(function (t, i) {
        return '<button type="button" aria-label="Show testimonial ' + (i + 1) + '"' + (i === 0 ? ' aria-current="true"' : '') + '></button>';
      }).join('');
      dots.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        var n = Array.prototype.indexOf.call(dots.children, b);
        track.querySelectorAll('.testimonial').forEach(function (f, i) { f.classList.toggle('is-active', i === n); });
        Array.prototype.forEach.call(dots.children, function (d, i) { if (i === n) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
      });
    }
    section.hidden = false;
  }

  function init() {
    slider();
    counters();
    works();
    testimonials();
    heroMedia();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
