/* =====================================================================
   SPACE DESIGN — Project page (portfolio-detail.html?slug=...)
   Shows the project itself: its name and its images, nothing else.
   Images open in an accessible lightbox. Per-project SEO / JSON-LD is kept.
   ===================================================================== */
(function () {
  'use strict';
  var SD = window.SD || {};
  var U = SD.utils;
  var esc = U.esc;

  function $(s) { return document.querySelector(s); }

  function isPdf(m) { return /pdf/i.test(m.mime_type || '') || /\.pdf(\?|$)/i.test(m.media_url || ''); }

  /* ---------- Showcase: main image large, any others in a grid ---------- */
  function figure(m, i, total, main) {
    return '<figure class="pv-item' + (main ? ' pv-item--main' : '') + '">' +
      '<button type="button" class="pv-btn" data-lb-group="gallery" data-lb-index="' + i + '" aria-label="Open image ' + (i + 1) + ' of ' + total + (m.alt_text ? ': ' + esc(m.alt_text) : '') + '">' +
        '<span class="pv-frame ' + U.fitClass(m) + '">' +
          '<img src="' + esc(U.mediaUrl(m.media_url, main ? 1920 : 1280)) + '" alt="' + esc(m.alt_text || '') + '"' +
          (main ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async"' +
          (m.width && m.height ? ' width="' + Number(m.width) + '" height="' + Number(m.height) + '"' : '') + '>' +
        '</span>' +
      '</button>' +
    '</figure>';
  }

  function videoItem(m, title) {
    var src = U.safeUrl(m.media_url);
    var poster = U.safeUrl(m.poster_url);
    var captions = U.safeUrl(m.captions_url);
    var type = m.mime_type || (/\.webm(\?|$)/i.test(src) ? 'video/webm' : 'video/mp4');
    return '<figure class="pv-item pv-item--video"><div class="video-frame">' +
      '<video controls playsinline preload="none"' + (captions ? ' crossorigin="anonymous"' : '') +
        (poster ? ' poster="' + esc(poster) + '"' : '') + ' aria-label="' + esc(m.alt_text || m.caption || title + ' video') + '">' +
        '<source src="' + esc(src) + '" type="' + esc(type) + '">' +
        (captions ? '<track kind="captions" src="' + esc(captions) + '" srclang="en" label="English" default>' : '') +
        'Your browser cannot play this video. <a href="' + esc(src) + '">Download the video</a>.' +
      '</video></div></figure>';
  }

  function pdfItem(m) {
    return '<a class="pv-pdf" href="' + esc(U.safeUrl(m.media_url)) + '" target="_blank" rel="noopener noreferrer">' +
      esc(m.caption || m.alt_text || 'Drawing') + ' (PDF)<span class="visually-hidden"> opens in a new tab</span></a>';
  }

  function showcase(p) {
    var media = p.media || [];
    var fm = p.featured_media;
    // Images, renders and image plans/drawings, featured image first.
    var pics = media.filter(function (m) { return m.media_type !== 'video' && !isPdf(m) && m.media_url; });
    if (fm && fm.media_type !== 'video') {
      pics = [fm].concat(pics.filter(function (m) { return m.media_url !== fm.media_url; }));
    }
    var vids = media.filter(function (m) { return m.media_type === 'video'; });
    var pdfs = media.filter(isPdf);
    groups.gallery = pics;

    if (!pics.length && !vids.length) {
      return '<p class="pv-empty">Images of this project will be published soon.</p>';
    }
    var html = pics.length ? figure(pics[0], 0, pics.length, true) : '';
    var rest = pics.slice(1).map(function (m, i) { return figure(m, i + 1, pics.length, false); }).join('') +
      vids.map(function (m) { return videoItem(m, p.title); }).join('');
    if (rest) html += '<div class="pv-grid">' + rest + '</div>';
    if (pdfs.length) html += '<div class="pv-pdfs">' + pdfs.map(pdfItem).join('') + '</div>';
    return html;
  }

  /* ---------- Lightbox ---------- */
  var groups = {};
  function lightbox() {
    var dlg = $('[data-lightbox]');
    if (!dlg) return;
    var img = dlg.querySelector('[data-lb-img]');
    var cap = dlg.querySelector('[data-lb-caption]');
    var count = dlg.querySelector('[data-lb-count]');
    var current = { group: null, index: 0 }, trigger = null;

    function show() {
      var list = groups[current.group] || [];
      var m = list[current.index];
      if (!m) return;
      img.src = U.safeUrl(m.media_url);
      img.alt = m.alt_text || '';
      cap.textContent = m.caption || m.alt_text || '';
      count.textContent = 'Image ' + (current.index + 1) + ' of ' + list.length;
      var single = list.length < 2;
      dlg.querySelector('[data-lb-prev]').hidden = single;
      dlg.querySelector('[data-lb-next]').hidden = single;
    }
    function step(d) {
      var n = (groups[current.group] || []).length;
      current.index = (current.index + d + n) % n;
      show();
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lb-group]');
      if (!b) return;
      trigger = b;
      current.group = b.getAttribute('data-lb-group');
      current.index = parseInt(b.getAttribute('data-lb-index'), 10) || 0;
      show();
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      dlg.querySelector('[data-lb-close]').focus();
    });
    dlg.querySelector('[data-lb-close]').addEventListener('click', function () { dlg.close(); });
    dlg.querySelector('[data-lb-prev]').addEventListener('click', function () { step(-1); });
    dlg.querySelector('[data-lb-next]').addEventListener('click', function () { step(1); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { img.src = 'data:,'; if (trigger) trigger.focus(); });
  }

  /* ---------- Not found ---------- */
  function notFound() {
    SD.seo.setMeta({ title: 'Project not found | Space Design', noindex: true });
    $('[data-p-title]').textContent = 'Project not found.';
    $('[data-p-crumb]').textContent = 'Not found';
    $('[data-p-hero]').innerHTML = '<p class="pv-empty">This project may have been moved or not yet published. <a class="text-link" href="portfolio.html">View all projects</a>.</p>';
  }

  /* ---------- Main ---------- */
  async function init() {
    lightbox();
    var slug = (U.param('slug') || '').toLowerCase();
    var res = await SD.api.getProject(slug);
    if (res.error) {
      $('[data-p-title]').textContent = 'Project could not be loaded.';
      $('[data-p-hero]').innerHTML = '<p class="pv-empty">Please refresh the page in a moment, or <a class="text-link" href="portfolio.html">return to the projects</a>.</p>';
      return;
    }
    var p = res.data;
    if (!p) { notFound(); return; }

    $('[data-p-title]').textContent = p.title;
    $('[data-p-crumb]').textContent = p.title;
    $('[data-p-hero]').innerHTML = (p.is_demo ? SD.ui.demoBanner() : '') + showcase(p);

    /* SEO */
    var url = SD.seo.SITE + '/portfolio-detail.html?slug=' + encodeURIComponent(p.slug);
    var desc = p.seo_description || p.short_description || ('Project by Space Design' + (p.location ? ' in ' + p.location : '') + '.');
    var ogImg = p.og_image || (p.featured_media && (p.featured_media.media_type === 'video' ? p.featured_media.poster_url : p.featured_media.media_url)) || 'assets/img/og-default.jpg';
    SD.seo.setMeta({
      title: p.seo_title || (p.title + (p.location ? ' · ' + p.location : '') + ' | Space Design'),
      description: String(desc).slice(0, 170),
      canonical: url,
      image: ogImg,
      imageAlt: p.featured_media && p.featured_media.alt_text,
      type: 'article',
      noindex: !!p.is_demo
    });
    SD.seo.jsonLd([
      SD.seo.webPage({ url: url, name: p.title, description: desc, type: 'WebPage' }),
      SD.seo.project(p, url),
      SD.seo.breadcrumb([{ name: 'Home', url: 'index.html' }, { name: 'Portfolio', url: 'portfolio.html' }, { name: p.title, url: url }]),
      SD.seo.organization()
    ], 'sd-project-jsonld');

  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
