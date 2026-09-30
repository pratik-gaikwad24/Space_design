/* =====================================================================
   SPACE DESIGN — Shared utilities (public site + admin)
   ===================================================================== */
(function () {
  'use strict';
  var SD = (window.SD = window.SD || {});
  var cfg = window.SD_CONFIG || {};

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

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

  /** Allow only http(s), relative and same-origin URLs. Blocks javascript:, data: (except images), etc. */
  function safeUrl(url, opts) {
    if (!url) return '';
    var s = String(url).trim();
    if (/^(\/|\.\/|\.\.\/|[a-z0-9_\-]+\.html)/i.test(s) && !/^\/\//.test(s)) return s;
    if (opts && opts.allowBlob && /^blob:/i.test(s)) return s;
    try {
      var u = new URL(s, window.location.href);
      if (u.protocol === 'https:' || u.protocol === 'http:') return u.href;
    } catch (e) { /* ignore */ }
    return '';
  }

  /** Convert multi-paragraph plain text into escaped <p> blocks. */
  function paragraphs(text) {
    if (!text) return '';
    return String(text)
      .split(/\n\s*\n/)
      .map(function (p) { return '<p>' + esc(p.trim()).replace(/\n/g, '<br>') + '</p>'; })
      .join('');
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

  function formatDateTime(iso) {
    if (!iso) return '';
    try {
      return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
    } catch (e) { return iso; }
  }

  function param(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
  function prefersReducedMotion() { return mq('(prefers-reduced-motion: reduce)'); }
  function saveData() {
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return !!(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || '')));
  }
  function isSmallScreen() { return mq('(max-width: 1024px)'); }

  /** Supabase Storage image URL at a given width (only when transforms are enabled). */
  function mediaUrl(url, width) {
    var safe = safeUrl(url);
    if (!safe || !cfg.IMAGE_TRANSFORMS || !width) return safe;
    if (safe.indexOf('/storage/v1/object/public/') === -1) return safe;
    return safe.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') +
      (safe.indexOf('?') > -1 ? '&' : '?') + 'width=' + width + '&quality=78&resize=cover';
  }
  function srcset(url) {
    if (!cfg.IMAGE_TRANSFORMS) return '';
    return [640, 960, 1280, 1920].map(function (w) { return mediaUrl(url, w) + ' ' + w + 'w'; }).join(', ');
  }

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

  function mediaThumb(m, opts) {
    opts = opts || {};
    if (!m) return '<div class="project-card-placeholder" aria-hidden="true"></div>';
    var isVideo = m.media_type === 'video';
    var src = isVideo ? m.poster_url : m.media_url;
    var html = '';
    if (src) {
      var ss = srcset(src);
      html += '<img src="' + esc(mediaUrl(src, opts.width || 1280)) + '"' +
        (ss ? ' srcset="' + esc(ss) + '" sizes="' + esc(opts.sizes || '(max-width: 768px) 100vw, 60vw') + '"' : '') +
        ' alt="' + esc(m.alt_text || '') + '" loading="' + (opts.eager ? 'eager' : 'lazy') + '" decoding="async"' +
        (m.width && m.height ? ' width="' + Number(m.width) + '" height="' + Number(m.height) + '"' : '') + '>';
    }
    if (isVideo) html += '<span class="play-badge">Video</span>';
    return html;
  }

  /** Editorial project card. variant: 'l' | 's' | 'full' */
  function projectCard(p, index, variant, extraClass) {
    var num = pad(index + 1);
    var meta = [p.location, p.year].filter(Boolean).map(esc).join(' · ');
    var href = 'portfolio-detail.html?slug=' + encodeURIComponent(p.slug);
    return '' +
      '<article class="project-card project-card--' + esc(variant) + (extraClass ? ' ' + esc(extraClass) : '') + '" data-reveal>' +
        '<a class="project-card-link" href="' + esc(href) + '" data-cursor>' +
          '<div class="project-card-media">' +
            mediaThumb(p.featured_media, { sizes: variant === 'full' ? '100vw' : (variant === 'l' ? '(max-width: 768px) 100vw, 60vw' : '(max-width: 768px) 100vw, 40vw') }) +
            (p.is_demo ? '<span class="demo-tag">Demo · replace before launch</span>' : '') +
          '</div>' +
          '<div class="project-card-meta">' +
            '<span class="project-card-num" aria-hidden="true">' + num + '</span>' +
            '<h3 class="project-card-title">' + esc(p.title) + '</h3>' +
            (p.category ? '<span class="project-card-cat">' + esc(p.category) + '</span>' : '<span></span>') +
            '<p class="project-card-sub mb-0"><span>' + (meta || esc(p.project_type || '')) + '</span><span class="view" aria-hidden="true">View project →</span></p>' +
          '</div>' +
        '</a>' +
      '</article>';
  }

  /**
   * Structured project layout on a 12-column grid, in repeating blocks of six:
   *   lead (7 cols × 2 rows) + two stacked side cards (5 cols), then a row of thirds.
   * Every second block is mirrored (lead on the right). Short remainders
   * become halves or a full-width card, so no row is ever left ragged.
   * Returns one { slot, mirror } per project.
   */
  function workLayout(n) {
    var out = [];
    var block = 0;
    var i = 0;
    while (i < n) {
      var left = n - i;
      var mirror = block % 2 === 1;
      if (left === 1) { out.push({ slot: 'full' }); i += 1; }
      else if (left === 2) { out.push({ slot: 'half' }, { slot: 'half' }); i += 2; }
      else {
        out.push({ slot: 'lead', mirror: mirror }, { slot: 'side', mirror: mirror }, { slot: 'side', mirror: mirror });
        i += 3;
        left = n - i;
        if (left >= 3 && left !== 4) { out.push({ slot: 'third' }, { slot: 'third' }, { slot: 'third' }); i += 3; }
        else if (left === 4 || left === 2) { out.push({ slot: 'half' }, { slot: 'half' }); i += 2; }
        else if (left === 1) { out.push({ slot: 'full' }); i += 1; }
      }
      block += 1;
    }
    return out;
  }

  /** Render projects into a .work-grid using workLayout(). */
  function workGrid(projects) {
    var slots = workLayout(projects.length);
    return projects.map(function (p, i) {
      var s = slots[i];
      return projectCard(p, i, s.slot, 'work-' + s.slot + (s.mirror ? ' is-mirror' : ''));
    }).join('');
  }

  function demoBanner() {
    return '<div class="demo-banner" role="note"><strong>DEMO MODE</strong><span>Supabase is not configured yet, so the projects shown are clearly labelled demo placeholders, not Space Design projects. Add your Supabase keys in <code>js/config.js</code> and publish real projects from the admin to replace them.</span></div>';
  }

  SD.utils = {
    $: $, $$: $$, esc: esc, safeUrl: safeUrl, paragraphs: paragraphs, debounce: debounce,
    slugify: slugify, pad: pad, formatDateTime: formatDateTime, param: param,
    prefersReducedMotion: prefersReducedMotion, saveData: saveData, isSmallScreen: isSmallScreen,
    mediaUrl: mediaUrl, srcset: srcset, announce: announce
  };
  SD.ui = { projectCard: projectCard, mediaThumb: mediaThumb, demoBanner: demoBanner, workLayout: workLayout, workGrid: workGrid };
})();
