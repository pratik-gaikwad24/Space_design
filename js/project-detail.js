/* =====================================================================
   SPACE DESIGN — Project page (portfolio-detail.html?slug=...)
   Shows the project: its name, images, description, key facts, units and related projects.
   Images open in an accessible lightbox. Per-project SEO / JSON-LD is kept.
   ===================================================================== */
(function () {
  'use strict';
  var SD = window.SD || {};
  var U = SD.utils;
  var esc = U.esc;

  function $(s) { return document.querySelector(s); }

  /* ---------- Showcase: main image large, any others in a grid ---------- */
  function figure(m, i, total, main) {
    return '<figure class="pv-item' + (main ? ' pv-item--main' : '') + '">' +
      '<button type="button" class="pv-btn" data-lb-group="gallery" data-lb-index="' + i + '" aria-label="Open image ' + (i + 1) + ' of ' + total + (m.alt_text ? ': ' + esc(m.alt_text) : '') + '">' +
        '<span class="pv-frame ' + U.fitClass(m) + '">' +
          '<img src="' + esc(U.safeUrl(m.media_url)) + '" alt="' + esc(m.alt_text || '') + '"' +
          (main ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async"' +
          (m.width && m.height ? ' width="' + Number(m.width) + '" height="' + Number(m.height) + '"' : '') + '>' +
        '</span>' +
      '</button>' +
    '</figure>';
  }

  function showcase(p) {
    // Photos, renders and plans; the cover (first image) leads.
    var pics = (p.media || []).filter(function (m) { return m.media_url; });
    groups.gallery = pics;
    if (!pics.length) return '<p class="pv-empty">Images of this project will be published soon.</p>';
    var html = figure(pics[0], 0, pics.length, true);
    var rest = pics.slice(1).map(function (m, i) { return figure(m, i + 1, pics.length, false); }).join('');
    if (rest) html += '<div class="pv-grid">' + rest + '</div>';
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

  /* ---------- Project details ---------- */
  // Project type pre-selected on the contact form, by project category.
  var CONTACT_TYPE = { 'Redevelopment': 'Society Redevelopment (PMC)' };

  /**
   * Split the free-text `details` (one fact per line) into:
   *   facts      "Label: value" lines → a key-facts list
   *   units      the "Units…:" line → one entry per flat type
   *   highlights lines without a label
   */
  function parseDetails(text) {
    var out = { facts: [], units: [], highlights: [] };
    String(text || '').split('\n').forEach(function (line) {
      line = line.trim();
      if (!line) return;
      var m = /^([^:]{2,40}):\s*(.+)$/.exec(line);
      if (!m) { out.highlights.push(line); return; }
      if (/^units?\b/i.test(m[1])) {
        out.unitsNote = /\(([^)]+)\)/.exec(m[1]) ? /\(([^)]+)\)/.exec(m[1])[1] : '';
        out.units = m[2].split(/\s*·\s*/).filter(Boolean);
      } else out.facts.push({ label: m[1].trim(), value: m[2].trim() });
    });
    return out;
  }

  function factRow(label, value) {
    return value ? '<div class="pv-fact"><dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd></div>' : '';
  }

  function unitTile(u) {
    // "2 BHK 584.00 sq ft" → type + size
    var m = /^(\d\s*BHK)\s+(.+)$/i.exec(u);
    return '<li class="pv-unit"><span class="pv-unit-type">' + esc(m ? m[1] : u) + '</span>' +
      (m ? '<span class="pv-unit-size">' + esc(m[2]) + '</span>' : '') + '</li>';
  }

  function renderInfo(p) {
    var d = parseDetails(p.details);
    var hasArea = d.facts.some(function (f) { return /area/i.test(f.label); });
    var facts =
      factRow('Location', p.location) +
      factRow('Status', p.status) +
      factRow('Category', p.category) +
      factRow('Project type', p.project_type) +
      factRow('Society', p.client) +
      (hasArea ? '' : factRow('Area', p.area)) +
      d.facts.map(function (f) { return factRow(f.label, f.value); }).join('');

    var about = [p.short_description, p.description].filter(Boolean)
      .filter(function (t, i, all) { return all.indexOf(t) === i; });
    var type = CONTACT_TYPE[p.category] || p.category || '';

    var html = '<div class="container pv-info-grid">' +
      '<div class="pv-about">' +
        '<p class="kicker">About the project</p>' +
        about.map(function (t, i) { return '<p class="' + (i === 0 ? 'pv-lead' : 'pv-text') + '">' + esc(t) + '</p>'; }).join('') +
        (d.highlights.length ? '<h2 class="pv-h">Highlights</h2><ul class="pv-highlights">' +
          d.highlights.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul>' : '') +
        (d.units.length ? '<h2 class="pv-h">Unit configuration' + (d.unitsNote ? ' <span class="pv-h-note">(' + esc(d.unitsNote) + ')</span>' : '') + '</h2>' +
          '<ul class="pv-units unstyled-list">' + d.units.map(unitTile).join('') + '</ul>' : '') +
        '<a class="btn-frame pv-cta" href="contact.html' + (type ? '?type=' + encodeURIComponent(type) : '') + '">Discuss a similar project</a>' +
      '</div>' +
      '<aside class="pv-facts" aria-labelledby="facts-title"><h2 class="pv-facts-title" id="facts-title">Key facts</h2><dl>' + facts + '</dl></aside>' +
    '</div>';

    var box = $('[data-p-info]');
    box.innerHTML = html;
    box.hidden = false;
  }

  function renderHead(p) {
    var sub = $('[data-p-sub]');
    if (p.subtitle) { sub.textContent = p.subtitle; sub.hidden = false; }
    var meta = [p.category, p.status, p.location].filter(Boolean);
    var list = $('[data-p-meta]');
    if (meta.length) {
      list.innerHTML = meta.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('');
      list.hidden = false;
    }
  }

  /* Up to three other projects, same category first. */
  async function renderRelated(p) {
    var res = await SD.api.listProjects();
    var others = (res.data || []).filter(function (x) { return x.slug !== p.slug; });
    var same = others.filter(function (x) { return x.category === p.category; });
    var picks = same.concat(others.filter(function (x) { return same.indexOf(x) === -1; })).slice(0, 3);
    if (!picks.length) return;
    var grid = $('[data-p-related-grid]');
    grid.innerHTML = picks.map(SD.ui.portfolioCard).join('');
    $('[data-p-related]').hidden = false;
    if (SD.motion) SD.motion.reveal(grid);
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
    $('[data-p-hero]').innerHTML = showcase(p);
    renderHead(p);
    renderInfo(p);
    renderRelated(p);

    /* SEO */
    var url = SD.seo.SITE + '/portfolio-detail.html?slug=' + encodeURIComponent(p.slug);
    var desc = p.short_description || ('Project by Space Design' + (p.location ? ' in ' + p.location : '') + '.');
    var ogImg = (p.featured_media && p.featured_media.media_url) || 'assets/img/og-default.jpg';
    SD.seo.setMeta({
      title: p.title + (p.location ? ' · ' + p.location : '') + ' | Space Design',
      description: String(desc).slice(0, 170),
      canonical: url,
      image: ogImg,
      imageAlt: p.featured_media && p.featured_media.alt_text,
      type: 'article'
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
