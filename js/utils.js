/* =====================================================================
   SPACE DESIGN — Shared utilities
   ===================================================================== */
(function () {
  'use strict';
  var SD = (window.SD = window.SD || {});

  /** Escape text for safe interpolation into HTML (text and attribute contexts). */
  function esc(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Allow only http(s), relative and same-origin URLs. Blocks javascript:, data:, etc. */
  function safeUrl(url) {
    if (!url) return '';
    var s = String(url).trim();
    // Plain relative paths pass as-is; anything browsers might read as "//host" (e.g. "/\host") is normalised by URL below.
    if (/^(\/|\.\/|\.\.\/|[a-z0-9_\-]+\.html)/i.test(s) && !/^\/[\/\\]/.test(s) && !/[\\\u0000-\u001F]/.test(s)) return s;
    try {
      var u = new URL(s, window.location.href);
      if (u.protocol === 'https:' || u.protocol === 'http:') return u.href;
    } catch (e) { /* ignore */ }
    return '';
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  function slugify(str) {
    return String(str || '')
      .toLowerCase()
      .normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120);
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function param(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function prefersReducedMotion() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }

  /** Polite screen-reader announcement. */
  var liveRegion;
  function announce(message) {
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.className = 'visually-hidden';
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      document.body.appendChild(liveRegion);
    }
    liveRegion.textContent = '';
    window.setTimeout(function () { liveRegion.textContent = message; }, 60);
  }

  /* ---------------- Shared renderers ---------------- */

  /**
   * How an image should sit in its frame:
   *  - plans / drawings → whole sheet on white ("fit-white")
   *  - tall renders (towers) → whole building on a sky gradient ("fit-sky")
   *  - everything else (photographs) → cover the frame
   */
  function fitClass(m) {
    if (!m) return '';
    if (m.media_type === 'plan' || m.media_type === 'drawing') return 'fit-white';
    if (m.width && m.height && m.height > m.width * 1.15) return 'fit-sky';
    return '';
  }

  function mediaThumb(m) {
    if (!m) return '<div class="project-card-placeholder" aria-hidden="true"></div>';
    var isVideo = m.media_type === 'video';
    var src = isVideo ? m.poster_url : m.media_url;
    var html = '';
    if (src) {
      html += '<img src="' + esc(safeUrl(src)) + '"' +
        ' alt="' + esc(m.alt_text || '') + '" loading="lazy" decoding="async"' +
        (m.width && m.height ? ' width="' + Number(m.width) + '" height="' + Number(m.height) + '"' : '') + '>';
    }
    if (isVideo) html += '<span class="play-badge">Video</span>';
    return html;
  }

  /** Compact project card used site-wide (home, projects): image above, details below. */
  function portfolioCard(p) {
    var m = p.featured_media;
    var href = 'portfolio-detail.html?slug=' + encodeURIComponent(p.slug);
    return '' +
      '<article class="pf-card" data-reveal>' +
        '<a class="pf-card-link" href="' + esc(href) + '">' +
          '<div class="pf-card-media ' + fitClass(m) + '">' + mediaThumb(m) + '</div>' +
          '<div class="pf-card-body">' +
            (p.category ? '<p class="pf-card-cat mb-0">' + esc(p.category) + '</p>' : '') +
            '<h3 class="pf-card-title">' + esc(p.title) + '</h3>' +
            (p.location ? '<p class="pf-card-loc mb-0">' + esc(p.location) + '</p>' : '') +
            '<span class="pf-card-more" aria-hidden="true">View project</span>' +
          '</div>' +
        '</a>' +
      '</article>';
  }

  SD.utils = {
    esc: esc, safeUrl: safeUrl, debounce: debounce, slugify: slugify, pad: pad, param: param,
    prefersReducedMotion: prefersReducedMotion, announce: announce, fitClass: fitClass
  };
  SD.ui = { portfolioCard: portfolioCard };
})();
