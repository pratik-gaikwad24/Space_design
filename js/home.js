/* =====================================================================
   SPACE DESIGN — Home page
   Hero reveal sequence · optional hero video · featured projects ·
   interactive design-approach section.
   ===================================================================== */
(function () {
  'use strict';
  var SD = window.SD || {};
  var U = SD.utils;

  /* ---------- Hero sequence ---------- */
  function heroSequence() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) return;
    var img = hero.querySelector('[data-hero-img]');
    var go = function () { requestAnimationFrame(function () { hero.classList.add('is-loaded'); }); };
    if (U.prefersReducedMotion() || !img || img.complete) go();
    else { img.addEventListener('load', go, { once: true }); img.addEventListener('error', go, { once: true }); setTimeout(go, 1200); }
  }

  /* ---------- Optional hero media from site_settings.home_hero ---------- */
  async function heroMedia() {
    if (!SD.supabaseConfigured) return;
    var res = await SD.api.getSettings(['home_hero']);
    var h = res.data && res.data.home_hero;
    if (!h) return;
    var wrap = document.querySelector('[data-hero-media]');
    var img = document.querySelector('[data-hero-img]');
    if (!wrap || !img) return;

    var imageUrl = U.safeUrl(h.image_url);
    if (imageUrl) {
      img.src = imageUrl;
      img.alt = h.image_alt || '';
      img.removeAttribute('width'); img.removeAttribute('height');
      var tag = wrap.querySelector('.demo-tag'); if (tag) tag.remove();
    }

    var videoUrl = U.safeUrl(h.video_url);
    // Background video only on larger screens, without reduced-motion or data-saver.
    if (!videoUrl || U.prefersReducedMotion() || U.saveData() || U.isSmallScreen()) return;
    var v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
    v.preload = 'metadata';
    var poster = U.safeUrl(h.poster_url) || imageUrl;
    if (poster) v.poster = poster;
    var src = document.createElement('source');
    src.src = videoUrl;
    src.type = /\.webm(\?|$)/i.test(videoUrl) ? 'video/webm' : 'video/mp4';
    v.appendChild(src);
    v.addEventListener('canplay', function () {
      img.hidden = true;
      var tag2 = wrap.querySelector('.demo-tag'); if (tag2) tag2.remove();
    }, { once: true });
    wrap.appendChild(v);

    // WCAG 2.2.2: moving content must be pausable.
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'icon-btn hero-video-toggle';
    btn.textContent = 'Pause video';
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', function () {
      if (v.paused) { v.play(); btn.textContent = 'Pause video'; btn.setAttribute('aria-pressed', 'false'); }
      else { v.pause(); btn.textContent = 'Play video'; btn.setAttribute('aria-pressed', 'true'); }
    });
    wrap.parentNode.appendChild(btn);
  }

  /* ---------- Featured projects (structured grid: SD.ui.workGrid) ---------- */
  async function featured() {
    var grid = document.querySelector('[data-featured-projects]');
    if (!grid) return;
    var res = await SD.api.listProjects({ featured: true, limit: 6 });
    grid.setAttribute('aria-busy', 'false');

    if (res.error) {
      grid.innerHTML = '<div class="empty-state"><h3>Projects could not be loaded</h3><p>Please refresh the page or <a class="text-link" href="portfolio.html">visit the portfolio</a>.</p></div>';
      return;
    }
    var items = res.data || [];
    if (!items.length) {
      grid.innerHTML = '<div class="empty-state"><p class="label label--blue mb-0">Portfolio</p><h3>Selected projects are being curated.</h3><p>Project photography and details will be published here soon. In the meantime, feel free to contact the Navi Mumbai or Pune office.</p><a class="link-arrow" href="contact.html">Start a conversation <span class="btn-arrow" aria-hidden="true">→</span></a></div>';
      return;
    }
    if (res.demo) {
      var banner = document.querySelector('[data-demo-banner]');
      if (banner) { banner.innerHTML = SD.ui.demoBanner(); banner.hidden = false; }
    }
    grid.innerHTML = SD.ui.workGrid(items);
    var count = document.querySelector('[data-work-count]');
    if (count) count.textContent = U.pad(items.length) + (items.length === 1 ? ' featured project' : ' featured projects');
    SD.motion.reveal(grid);
  }

  /* ---------- Design approach ---------- */
  function approach() {
    var root = document.querySelector('[data-approach]');
    if (!root) return;
    var items = root.querySelectorAll('[data-approach-item]');
    var stageImgs = root.querySelectorAll('.approach-stage img');
    var caption = root.querySelector('[data-approach-caption]');

    function activate(idx) {
      items.forEach(function (it, i) {
        var on = i === idx;
        it.classList.toggle('is-active', on);
        it.querySelector('[data-approach-trigger]').setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      stageImgs.forEach(function (im, i) { im.classList.toggle('is-active', i === idx); });
      if (caption) {
        var t = items[idx].querySelector('.t').textContent;
        caption.textContent = U.pad(idx + 1) + ' · ' + t;
      }
    }
    items.forEach(function (it, i) {
      var trig = it.querySelector('[data-approach-trigger]');
      trig.addEventListener('click', function () { activate(i); });
      trig.addEventListener('focus', function () { activate(i); });
      it.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') activate(i); });
    });
  }

  function init() {
    heroSequence();
    approach();
    featured();
    heroMedia();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
