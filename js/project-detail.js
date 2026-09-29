/* =====================================================================
   SPACE DESIGN — Project detail (portfolio-detail.html?slug=...)
   Fetches a published project + media from Supabase, renders the editorial
   layout, accessible gallery lightbox, videos with captions, drawings,
   related projects, and per-project SEO / JSON-LD.
   ===================================================================== */
(function () {
  'use strict';
  var SD = window.SD || {};
  var U = SD.utils;
  var esc = U.esc;

  function $(s) { return document.querySelector(s); }

  function isPdf(m) { return /pdf/i.test(m.mime_type || '') || /\.pdf(\?|$)/i.test(m.media_url || ''); }

  /* ---------- Hero ---------- */
  function renderHero(p) {
    var hero = $('[data-p-hero]');
    var fm = p.featured_media || (p.media || []).filter(function (m) { return m.media_type === 'image'; })[0];
    var fv = p.featured_video;
    var canAutoplay = fv && !U.prefersReducedMotion() && !U.saveData() && !U.isSmallScreen();
    var html = '<div class="media ar-21x9" data-reveal="image">';
    if (canAutoplay) {
      html += '<video muted loop playsinline autoplay preload="metadata" aria-hidden="true"' +
        (fv.poster_url ? ' poster="' + esc(U.safeUrl(fv.poster_url)) + '"' : '') + '>' +
        '<source src="' + esc(U.safeUrl(fv.media_url)) + '" type="' + esc(fv.mime_type || 'video/mp4') + '"></video>';
    } else if (fm) {
      var src = fm.media_type === 'video' ? fm.poster_url : fm.media_url;
      var ss = U.srcset(src);
      html += '<img src="' + esc(U.mediaUrl(src, 1920)) + '"' + (ss ? ' srcset="' + esc(ss) + '" sizes="100vw"' : '') +
        ' alt="' + esc(fm.alt_text || '') + '" fetchpriority="high" decoding="async">';
    } else if (fv && fv.poster_url) {
      html += '<img src="' + esc(U.safeUrl(fv.poster_url)) + '" alt="' + esc(fv.alt_text || '') + '" decoding="async">';
    }
    if (p.is_demo) html += '<span class="demo-tag">Demo · replace before launch</span>';
    html += '</div>';
    if (canAutoplay) html += '<button type="button" class="icon-btn hero-video-toggle" aria-pressed="false" data-hero-toggle>Pause video</button>';
    hero.innerHTML = html;

    var toggle = hero.querySelector('[data-hero-toggle]');
    if (toggle) {
      var v = hero.querySelector('video');
      toggle.addEventListener('click', function () {
        if (v.paused) { v.play(); toggle.textContent = 'Pause video'; toggle.setAttribute('aria-pressed', 'false'); }
        else { v.pause(); toggle.textContent = 'Play video'; toggle.setAttribute('aria-pressed', 'true'); }
      });
    }
  }

  /* ---------- Body sections ---------- */
  function infoList(p) {
    var rows = [
      ['Location', p.location], ['Category', p.category], ['Project type', p.project_type], ['Year', p.year],
      ['Area', p.area], ['Status', p.status], ['Client', p.client],
      ['Services', (p.services || []).filter(Boolean).join(', ')]
    ].filter(function (r) { return r[1] && String(r[1]).trim(); });
    if (!rows.length) return '';
    return '<dl class="project-info" data-reveal>' + rows.map(function (r) {
      return '<div><dt class="label label--muted">' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>';
    }).join('') + '</dl>';
  }

  function textSection(num, label, text) {
    if (!text || !String(text).trim()) return '';
    return '<div class="grid-12 project-section">' +
      '<p class="label" aria-hidden="true"><span class="index">' + num + '</span></p>' +
      '<div class="project-section-body"><h2 class="h-md mb-5">' + esc(label) + '</h2><div class="prose">' + U.paragraphs(text) + '</div></div>' +
    '</div>';
  }

  function gallery(images) {
    if (!images.length) return '';
    return '<section class="section section--alt" aria-labelledby="gallery-title"><div class="container">' +
      '<div class="flex-between mb-7"><h2 class="h-xl" id="gallery-title">Gallery</h2><p class="coords mb-0">' + U.pad(images.length) + ' images</p></div>' +
      '<ul class="gallery unstyled-list">' + images.map(function (m, i) {
        return '<li><figure>' +
          '<button type="button" class="gallery-btn" data-lb-group="gallery" data-lb-index="' + i + '" aria-label="Open image ' + (i + 1) + ' of ' + images.length + (m.alt_text ? ': ' + esc(m.alt_text) : '') + '">' +
            '<span class="media zoom-on-hover">' + '<img src="' + esc(U.mediaUrl(m.media_url, 1280)) + '" alt="' + esc(m.alt_text || '') + '" loading="lazy" decoding="async"' +
            (m.width && m.height ? ' width="' + Number(m.width) + '" height="' + Number(m.height) + '"' : '') + '></span>' +
          '</button>' +
          (m.caption ? '<figcaption><span>' + esc(m.caption) + '</span><span class="coords">' + U.pad(i + 1) + '</span></figcaption>' : '') +
        '</figure></li>';
      }).join('') + '</ul></div></section>';
  }

  function videos(list, title) {
    if (!list.length) return '';
    return '<section class="section" aria-labelledby="video-title"><div class="container">' +
      '<div class="flex-between mb-7"><h2 class="h-xl" id="video-title">Video</h2><p class="coords mb-0">' + U.pad(list.length) + (list.length === 1 ? ' film' : ' films') + '</p></div>' +
      '<ul class="video-list unstyled-list">' + list.map(function (m, i) {
        var src = U.safeUrl(m.media_url);
        var poster = U.safeUrl(m.poster_url);
        var captions = U.safeUrl(m.captions_url);
        var type = m.mime_type || (/\.webm(\?|$)/i.test(src) ? 'video/webm' : 'video/mp4');
        var label = m.alt_text || m.caption || (title + ' video ' + (i + 1));
        return '<li class="video-item"><figure>' +
          '<div class="video-frame">' +
            '<video controls playsinline preload="none"' + (captions ? ' crossorigin="anonymous"' : '') +
              (poster ? ' poster="' + esc(poster) + '"' : '') + ' aria-label="' + esc(label) + '">' +
              '<source src="' + esc(src) + '" type="' + esc(type) + '">' +
              (captions ? '<track kind="captions" src="' + esc(captions) + '" srclang="en" label="English" default>' : '') +
              'Your browser cannot play this video. <a href="' + esc(src) + '">Download the video</a>.' +
            '</video>' +
          '</div>' +
          (m.caption ? '<figcaption><span>' + esc(m.caption) + '</span>' + (captions ? '<span class="coords">CC</span>' : '') + '</figcaption>' : '') +
        '</figure></li>';
      }).join('') + '</ul></div></section>';
  }

  function drawings(list) {
    if (!list.length) return '';
    var imgIndex = 0;
    return '<section class="section section--alt" aria-labelledby="drawings-title"><div class="container">' +
      '<div class="flex-between mb-7"><h2 class="h-xl" id="drawings-title">Drawings &amp; plans</h2><p class="coords mb-0">' + U.pad(list.length) + ' sheets</p></div>' +
      '<ul class="drawings unstyled-list">' + list.map(function (m) {
        var inner;
        if (isPdf(m)) {
          inner = '<a class="drawing-pdf" href="' + esc(U.safeUrl(m.media_url)) + '" target="_blank" rel="noopener noreferrer">' +
            '<span class="label label--blue">' + esc(m.media_type === 'plan' ? 'Plan' : 'Drawing') + ' · PDF</span>' +
            '<span class="h-md">' + esc(m.caption || m.alt_text || 'Open drawing') + '</span>' +
            '<span class="link-arrow">Open PDF <span class="btn-arrow" aria-hidden="true">↗</span><span class="visually-hidden"> (opens in a new tab)</span></span></a>';
        } else {
          inner = '<button type="button" class="gallery-btn" data-lb-group="drawings" data-lb-index="' + (imgIndex++) + '" aria-label="Enlarge ' + esc(m.alt_text || 'drawing') + '">' +
            '<span class="media"><img src="' + esc(U.safeUrl(m.media_url)) + '" alt="' + esc(m.alt_text || '') + '" loading="lazy" decoding="async"></span></button>';
        }
        return '<li class="drawing-item"><figure>' + inner +
          (m.caption && !isPdf(m) ? '<figcaption><span>' + esc(m.caption) + '</span><span class="coords">' + esc(m.media_type) + '</span></figcaption>' : '') +
          '</figure></li>';
      }).join('') + '</ul></div></section>';
  }

  function cta() {
    return '<section class="cta-blue" aria-labelledby="cta-title"><div class="container cta-blue-inner">' +
      '<p class="label mb-0">Start a conversation</p>' +
      '<h2 class="cta-blue-title" id="cta-title" data-reveal="mask"><span class="line-mask"><span>Have a project</span></span><span class="line-mask"><span class="outline">in mind?</span></span></h2>' +
      '<div class="cta-blue-foot"><p>Share a few details about your project with our Navi Mumbai or Pune office.</p>' +
      '<a class="btn btn--light" href="contact.html">Start a conversation <span class="btn-arrow" aria-hidden="true">→</span></a></div></div></section>';
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
      count.textContent = (current.group === 'drawings' ? 'Drawing ' : 'Image ') + (current.index + 1) + ' of ' + list.length;
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
    $('[data-p-hero]').innerHTML = '';
    $('[data-p-body]').innerHTML = '<section class="section"><div class="container"><div class="empty-state">' +
      '<h2 class="h-md">This project is not available.</h2>' +
      '<p>It may have been moved, renamed or not yet published.</p>' +
      '<a class="btn" href="portfolio.html">View projects <span class="btn-arrow" aria-hidden="true">→</span></a></div></div></section>';
  }

  /* ---------- Main ---------- */
  async function init() {
    lightbox();
    var slug = (U.param('slug') || '').toLowerCase();
    var res = await SD.api.getProject(slug);
    if (res.error) {
      $('[data-p-title]').textContent = 'Project could not be loaded.';
      $('[data-p-hero]').innerHTML = '';
      $('[data-p-body]').innerHTML = '<section class="section"><div class="container"><div class="empty-state"><p>Please refresh the page in a moment, or <a class="text-link" href="portfolio.html">return to the portfolio</a>.</p></div></div></section>';
      return;
    }
    var p = res.data;
    if (!p) { notFound(); return; }

    var media = p.media || [];
    var images = media.filter(function (m) { return m.media_type === 'image'; });
    var vids = media.filter(function (m) { return m.media_type === 'video'; });
    if (p.featured_video) vids.sort(function (a) { return a.id === p.featured_video.id ? -1 : 0; });
    var draws = media.filter(function (m) { return m.media_type === 'drawing' || m.media_type === 'plan'; });
    groups.gallery = images;
    groups.drawings = draws.filter(function (m) { return !isPdf(m); });

    /* Header */
    document.querySelector('[data-p-title]').textContent = p.title;
    $('[data-p-crumb]').textContent = p.title;
    $('[data-p-category]').textContent = [p.category, p.project_type].filter(Boolean).join(' · ') + (p.is_demo ? '  ·  DEMO' : '');
    if (p.subtitle) { var st = $('[data-p-subtitle]'); st.textContent = p.subtitle; st.hidden = false; }
    $('[data-p-meta]').innerHTML = [p.location, p.category, p.year].filter(Boolean).map(function (v) { return '<span>' + esc(v) + '</span>'; }).join('');
    renderHero(p);

    /* Body */
    var n = 0;
    function num() { n += 1; return U.pad(n); }
    var sections = '';
    sections += textSection(num(), 'Project overview', p.description || p.short_description);
    sections += textSection(num(), 'Concept', p.concept);
    sections += textSection(num(), 'Design approach', p.design_approach);
    sections += textSection(num(), 'Project details', p.details);

    var body = '<section class="section" aria-label="Project information"><div class="container">' +
      (p.is_demo ? SD.ui.demoBanner() : '') + infoList(p) +
      (sections ? '<div class="mt-8">' + sections + '</div>' : '') +
      '</div></section>' +
      gallery(images) + videos(vids, p.title) + drawings(draws) +
      '<section class="section" aria-labelledby="related-title"><div class="container">' +
        '<div class="flex-between mb-7"><h2 class="h-xl" id="related-title">Related projects</h2><a class="link-arrow" href="portfolio.html">All projects <span class="btn-arrow" aria-hidden="true">→</span></a></div>' +
        '<div data-related-list></div></div></section>' +
      cta();
    $('[data-p-body]').innerHTML = body;
    SD.motion.reveal(document);
    SD.motion.lazyVideos(document);

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

    /* Related */
    var rel = await SD.api.relatedProjects(p.category, p.id, 3);
    var holder = $('[data-related-list]');
    if (!rel.data || !rel.data.length) {
      holder.innerHTML = '<p class="related-empty">More projects will be published soon.</p>';
    } else {
      holder.innerHTML = '<div class="related-list">' + rel.data.map(function (r, i) { return SD.ui.projectCard(r, i, 's', ''); }).join('') + '</div>';
      SD.motion.reveal(holder);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
