/* =====================================================================
   SPACE DESIGN — Admin shell + Dashboard, Projects list, Media library,
   Settings (home hero, SEO overrides, retention, password).
   Page modules register themselves in SD.admin.pages[name].
   ===================================================================== */
(function () {
  'use strict';
  var SD = (window.SD = window.SD || {});
  var U = SD.utils;
  var esc = U.esc;

  var BUCKETS = { image: 'portfolio-images', video: 'portfolio-videos', drawing: 'portfolio-drawings', plan: 'portfolio-drawings' };

  /* ---------------- UI helpers ---------------- */
  var toastRegion;
  function toast(message, type) {
    if (!toastRegion) {
      toastRegion = document.createElement('div');
      toastRegion.className = 'toast-region';
      toastRegion.setAttribute('role', 'status');
      toastRegion.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastRegion);
    }
    var t = document.createElement('div');
    t.className = 'toast' + (type === 'error' ? ' toast--error' : '');
    t.textContent = message;
    toastRegion.appendChild(t);
    setTimeout(function () { t.remove(); }, type === 'error' ? 7000 : 4000);
  }

  function confirmDialog(title, message, confirmLabel) {
    return new Promise(function (resolve) {
      var d = document.createElement('dialog');
      d.className = 'confirm-dialog';
      d.setAttribute('aria-labelledby', 'confirm-title');
      d.innerHTML = '<form method="dialog"><h2 id="confirm-title">' + esc(title) + '</h2><p>' + esc(message) + '</p>' +
        '<div class="admin-actions"><button class="btn btn--sm btn--ghost" value="cancel">Cancel</button>' +
        '<button class="btn btn--sm" value="ok">' + esc(confirmLabel || 'Confirm') + '</button></div></form>';
      var previous = document.activeElement;
      d.addEventListener('close', function () { resolve(d.returnValue === 'ok'); d.remove(); if (previous && previous.focus) previous.focus(); });
      document.body.appendChild(d);
      d.showModal();
      d.querySelector('button[value="cancel"]').focus();
    });
  }

  /** Map a Supabase error to a readable admin message (no raw SQL shown). */
  function errorMessage(err, fallback) {
    if (!err) return fallback || 'Something went wrong.';
    if (window.console) console.warn('[admin]', err);
    if (err.code === '23505') return 'That value is already in use (for example, the slug). Choose another.';
    if (err.code === '23514') return 'One of the values is not allowed (too long or wrong format).';
    if (err.code === '42501' || /row-level security/i.test(err.message || '')) return 'Permission denied. Your account may not have admin access.';
    if (/Payload too large|exceeded the maximum/i.test(err.message || '')) return 'File is larger than the bucket limit.';
    if (/mime type/i.test(err.message || '')) return 'This file type is not allowed for this media type.';
    return fallback || 'Something went wrong. Please try again.';
  }

  function setBusy(btn, on, label) {
    if (!btn) return;
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = label || 'Saving…'; btn.disabled = true; }
    else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
  }

  function counter(input, max) {
    var out = document.createElement('span');
    out.className = 'counter';
    out.setAttribute('aria-live', 'off');
    function upd() { out.textContent = input.value.length + ' / ' + max; out.classList.toggle('is-over', input.value.length > max); }
    input.addEventListener('input', upd);
    input.parentNode.appendChild(out);
    upd();
  }

  /* ---------------- Storage helpers ---------------- */
  function storagePath(prefix, file, ext) {
    var base = U.slugify((file.name || 'file').replace(/\.[^.]+$/, '')).slice(0, 60) || 'file';
    var e = ext || ((file.name || '').split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    var rand = Math.random().toString(36).slice(2, 8);
    return prefix + '/' + Date.now() + '-' + rand + '-' + base + '.' + e;
  }
  async function upload(bucket, path, file, contentType) {
    var res = await SD.db.storage.from(bucket).upload(path, file, { cacheControl: '31536000', upsert: false, contentType: contentType || file.type || undefined });
    if (res.error) throw res.error;
    var pub = SD.db.storage.from(bucket).getPublicUrl(path);
    return { path: path, url: pub.data.publicUrl };
  }
  async function removeObjects(bucket, paths) {
    paths = (paths || []).filter(Boolean);
    if (!paths.length) return;
    var res = await SD.db.storage.from(bucket).remove(paths);
    if (res.error) throw res.error;
  }
  /** Remove every storage object referenced by project_media rows. */
  async function removeMediaFiles(rows) {
    var byBucket = {};
    rows.forEach(function (m) {
      var b = m.bucket || BUCKETS[m.media_type];
      byBucket[b] = byBucket[b] || [];
      if (m.storage_path) byBucket[b].push(m.storage_path);
      if (m.captions_path) { byBucket['portfolio-videos'] = byBucket['portfolio-videos'] || []; byBucket['portfolio-videos'].push(m.captions_path); }
      if (m.poster_path) { byBucket['portfolio-images'] = byBucket['portfolio-images'] || []; byBucket['portfolio-images'].push(m.poster_path); }
    });
    for (var b in byBucket) { if (byBucket[b].length) await removeObjects(b, byBucket[b]); }
  }

  /** Optional client-side optimisation: resize and convert JPEG/PNG to WebP. */
  async function optimiseImage(file, maxEdge, quality) {
    if (!/^image\/(jpeg|png)$/.test(file.type) || !window.createImageBitmap) return { file: file, width: null, height: null };
    try {
      var bmp = await createImageBitmap(file);
      var scale = Math.min(1, (maxEdge || 2400) / Math.max(bmp.width, bmp.height));
      var w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(bmp, 0, 0, w, h);
      var blob = await new Promise(function (r) { c.toBlob(r, 'image/webp', quality || 0.82); });
      if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return { file: file, width: bmp.width, height: bmp.height };
      var out = new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
      return { file: out, width: w, height: h };
    } catch (e) { return { file: file, width: null, height: null }; }
  }
  async function imageSize(file) {
    try { var b = await createImageBitmap(file); return { width: b.width, height: b.height }; } catch (e) { return {}; }
  }
  /** Grab a poster frame (~1s in) from a local video file as a WebP blob. */
  function videoPoster(file) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file);
      var v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.preload = 'metadata'; v.src = url;
      var done = function (blob, w, h) { URL.revokeObjectURL(url); resolve(blob ? { blob: blob, width: w, height: h } : null); };
      v.addEventListener('error', function () { done(null); });
      v.addEventListener('loadedmetadata', function () { v.currentTime = Math.min(1, (v.duration || 2) / 2); });
      v.addEventListener('seeked', function () {
        var c = document.createElement('canvas');
        var scale = Math.min(1, 1920 / (v.videoWidth || 1920));
        c.width = Math.round(v.videoWidth * scale); c.height = Math.round(v.videoHeight * scale);
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
        c.toBlob(function (b) { done(b, c.width, c.height); }, 'image/webp', 0.82);
      });
      setTimeout(function () { done(null); }, 15000);
    });
  }

  /* ---------------- Shell ---------------- */
  var NAV = [
    ['dashboard', 'dashboard.html', 'Dashboard'],
    ['projects', 'projects.html', 'Projects'],
    ['media', 'media.html', 'Media'],
    ['services', 'services.html', 'Services'],
    ['locations', 'locations.html', 'Locations'],
    ['enquiries', 'enquiries.html', 'Enquiries'],
    ['seo', 'settings.html#seo', 'SEO'],
    ['settings', 'settings.html', 'Settings']
  ];

  function renderShell(ctx) {
    var page = document.body.dataset.adminPage;
    var current = page === 'project-editor' ? 'projects' : page;
    var aside = document.querySelector('[data-admin-sidebar]');
    aside.innerHTML =
      '<a class="brand" href="dashboard.html" aria-label="Space Design admin dashboard">' +
        '<svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="1.25" y="1.25" width="29.5" height="29.5" fill="none" stroke="currentColor" stroke-width="2.5"/><rect x="1.25" y="17" width="13.75" height="13.75" fill="#0066B1"/><path d="M15 1.25V11M21 17h9.75" stroke="currentColor" stroke-width="2.5"/></svg>' +
        '<span class="brand-text"><span class="brand-name">SPACE DESIGN</span><span class="brand-sub">Content admin</span></span></a>' +
      '<p class="admin-env">Supabase · RLS protected</p>' +
      '<nav class="admin-nav" aria-label="Admin"><ul>' + NAV.map(function (n, i) {
        return '<li><a href="' + n[1] + '"' + (n[0] === current ? ' aria-current="page"' : '') + '><span>' + U.pad(i + 1) + '</span>' + n[2] +
          (n[0] === 'enquiries' ? '<span class="count" data-new-count hidden></span>' : '') + '</a></li>';
      }).join('') + '</ul></nav>' +
      '<div class="admin-user"><p>Signed in as<br><strong>' + esc(ctx.user.email) + '</strong></p>' +
      '<a class="btn-xs" href="../index.html" target="_blank" rel="noopener">View website ↗</a>' +
      '<button type="button" class="btn btn--sm btn--ghost admin-logout" data-logout>Log out</button></div>';
    aside.querySelector('[data-logout]').addEventListener('click', SD.auth.logout);
    // light logout button on dark sidebar
    aside.querySelector('[data-logout]').classList.add('btn--light');

    // mobile toggle
    var bar = document.querySelector('[data-admin-bar]');
    if (bar) {
      var btn = bar.querySelector('button');
      btn.addEventListener('click', function () {
        var open = aside.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) { var a = aside.querySelector('a'); if (a) a.focus(); }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && aside.classList.contains('is-open')) { aside.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
      });
    }

    SD.db.from('contact_submissions').select('id', { count: 'exact', head: true }).eq('status', 'new').then(function (r) {
      var el = aside.querySelector('[data-new-count]');
      if (el && r.count) { el.textContent = r.count; el.hidden = false; el.setAttribute('aria-label', r.count + ' new'); }
    });
  }

  /* ---------------- Dashboard ---------------- */
  async function dashboard() {
    function count(table, filter) {
      var q = SD.db.from(table).select('id', { count: 'exact', head: true });
      if (filter) q = filter(q);
      return q.then(function (r) { return r.error ? '—' : r.count; });
    }
    var vals = await Promise.all([
      count('projects'),
      count('projects', function (q) { return q.eq('published', true); }),
      count('projects', function (q) { return q.eq('featured', true); }),
      count('contact_submissions', function (q) { return q.eq('status', 'new'); }),
      count('project_media')
    ]);
    document.querySelectorAll('[data-stat]').forEach(function (el, i) { el.textContent = vals[i]; });

    var recent = await SD.db.from('contact_submissions').select('id,name,project_type,location,status,created_at').order('created_at', { ascending: false }).limit(5);
    var el = document.querySelector('[data-recent-enquiries]');
    el.innerHTML = (recent.data && recent.data.length) ? '<table class="table"><thead><tr><th scope="col">Name</th><th scope="col">Type</th><th scope="col">Received</th><th scope="col">Status</th></tr></thead><tbody>' +
      recent.data.map(function (r) {
        return '<tr><td class="title-cell"><a href="enquiries.html#' + esc(r.id) + '">' + esc(r.name) + '</a><span class="sub">' + esc(r.location || '') + '</span></td><td>' + esc(r.project_type || '—') + '</td><td>' + esc(U.formatDateTime(r.created_at)) + '</td><td>' + statusBadge(r.status) + '</td></tr>';
      }).join('') + '</tbody></table>' : '<p class="table-empty">No enquiries yet.</p>';

    var projects = await SD.db.from('projects').select('id,title,published,featured,updated_at').order('updated_at', { ascending: false }).limit(5);
    var pl = document.querySelector('[data-recent-projects]');
    pl.innerHTML = (projects.data && projects.data.length) ? '<table class="table"><thead><tr><th scope="col">Project</th><th scope="col">Status</th><th scope="col">Updated</th></tr></thead><tbody>' +
      projects.data.map(function (p) {
        return '<tr><td class="title-cell"><a href="project-editor.html?id=' + esc(p.id) + '">' + esc(p.title) + '</a></td><td>' + projectBadges(p) + '</td><td>' + esc(U.formatDateTime(p.updated_at)) + '</td></tr>';
      }).join('') + '</tbody></table>' : '<p class="table-empty">No projects yet. <a class="text-link" href="project-editor.html">Create the first project</a>.</p>';
  }

  function statusBadge(s) {
    return s === 'new' ? '<span class="badge badge--new">New</span>' : '<span class="badge">' + esc(s) + '</span>';
  }
  function projectBadges(p) {
    return (p.published ? '<span class="badge badge--live">Published</span>' : '<span class="badge">Draft</span>') +
      (p.featured ? ' <span class="badge badge--featured">Featured</span>' : '');
  }

  /* ---------------- Projects list ---------------- */
  async function projects() {
    var tbody = document.querySelector('[data-projects-body]');
    var search = document.querySelector('[data-projects-search]');
    var seg = document.querySelector('[data-projects-filter]');
    var rows = [], filter = 'all';

    async function load() {
      var res = await SD.db.from('projects')
        .select('id,title,slug,category,project_type,location,year,published,featured,sort_order,updated_at,featured_media:project_media!projects_featured_media_fk(media_url,poster_url,media_type)')
        .order('sort_order', { ascending: true }).order('created_at', { ascending: false });
      if (res.error) { toast(errorMessage(res.error), 'error'); return; }
      rows = res.data || [];
      render();
    }

    function render() {
      var q = (search.value || '').toLowerCase().trim();
      var list = rows.filter(function (p) {
        if (filter === 'published' && !p.published) return false;
        if (filter === 'draft' && p.published) return false;
        if (filter === 'featured' && !p.featured) return false;
        return !q || [p.title, p.slug, p.category, p.project_type, p.location].join(' ').toLowerCase().indexOf(q) > -1;
      });
      if (!list.length) { tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No projects found.</td></tr>'; return; }
      tbody.innerHTML = list.map(function (p) {
        var fm = p.featured_media;
        var thumb = fm ? (fm.media_type === 'video' ? fm.poster_url : fm.media_url) : '';
        return '<tr data-id="' + esc(p.id) + '">' +
          '<td>' + (thumb ? '<img class="thumb" src="' + esc(U.safeUrl(thumb)) + '" alt="" loading="lazy">' : '<span class="thumb" aria-hidden="true"></span>') + '</td>' +
          '<td class="title-cell"><a href="project-editor.html?id=' + esc(p.id) + '">' + esc(p.title) + '</a><span class="sub">/' + esc(p.slug) + '</span></td>' +
          '<td>' + esc([p.category, p.project_type].filter(Boolean).join(' · ') || '—') + '<span class="sub">' + esc([p.location, p.year].filter(Boolean).join(' · ')) + '</span></td>' +
          '<td>' + projectBadges(p) + '</td>' +
          '<td>' + esc(U.formatDateTime(p.updated_at)) + '</td>' +
          '<td><div class="row-actions">' +
            '<button type="button" class="btn-xs btn-xs--blue" data-act="publish">' + (p.published ? 'Unpublish' : 'Publish') + '</button>' +
            '<button type="button" class="btn-xs" data-act="feature">' + (p.featured ? 'Unfeature' : 'Feature') + '</button>' +
            '<a class="btn-xs" href="project-editor.html?id=' + esc(p.id) + '">Edit</a>' +
            (p.published ? '<a class="btn-xs" href="../portfolio-detail.html?slug=' + encodeURIComponent(p.slug) + '" target="_blank" rel="noopener">View ↗</a>' : '') +
            '<button type="button" class="btn-xs btn-xs--danger" data-act="delete">Delete</button>' +
          '</div></td></tr>';
      }).join('');
    }

    tbody.addEventListener('click', async function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var id = btn.closest('tr').dataset.id;
      var p = rows.filter(function (r) { return r.id === id; })[0];
      var act = btn.dataset.act;
      if (act === 'publish' || act === 'feature') {
        var patch = act === 'publish' ? { published: !p.published } : { featured: !p.featured };
        btn.disabled = true;
        var r = await SD.db.from('projects').update(patch).eq('id', id);
        if (r.error) { toast(errorMessage(r.error), 'error'); btn.disabled = false; return; }
        Object.assign(p, patch);
        toast(p.title + ': ' + (act === 'publish' ? (p.published ? 'published' : 'unpublished') : (p.featured ? 'featured' : 'no longer featured')));
        render();
      }
      if (act === 'delete') {
        var ok = await confirmDialog('Delete project?', 'This permanently deletes “' + p.title + '” and all of its media files. This cannot be undone.', 'Delete project');
        if (!ok) return;
        await deleteProject(id);
        rows = rows.filter(function (r) { return r.id !== id; });
        render();
      }
    });
    search.addEventListener('input', U.debounce(render, 150));
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      filter = b.dataset.filter;
      seg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      render();
    });
    load();
  }

  async function deleteProject(id) {
    try {
      var m = await SD.db.from('project_media').select('*').eq('project_id', id);
      if (m.data && m.data.length) await removeMediaFiles(m.data);
      var r = await SD.db.from('projects').delete().eq('id', id);
      if (r.error) throw r.error;
      toast('Project deleted');
      return true;
    } catch (err) {
      toast(errorMessage(err, 'Project could not be deleted.'), 'error');
      return false;
    }
  }

  /* ---------------- Media library ---------------- */
  async function media() {
    var grid = document.querySelector('[data-media-grid]');
    var seg = document.querySelector('[data-media-filter]');
    var res = await SD.db.from('project_media').select('*, project:projects!project_media_project_id_fkey(id,title,published)').order('created_at', { ascending: false });
    if (res.error) { toast(errorMessage(res.error), 'error'); return; }
    var all = res.data || [];
    var filter = 'all';
    document.querySelector('[data-media-total]').textContent = all.length + ' files';

    function render() {
      var list = all.filter(function (m) {
        if (filter === 'missing-alt') return !m.alt_text && m.media_type !== 'video';
        return filter === 'all' || m.media_type === filter;
      });
      grid.innerHTML = list.length ? list.map(function (m) {
        var src = m.media_type === 'video' ? m.poster_url : m.media_url;
        var isPdf = /\.pdf(\?|$)/i.test(m.media_url || '');
        return '<li class="lib-card"><div class="media-preview">' +
          (isPdf ? '<span class="pdf">PDF</span>' : (src ? '<img src="' + esc(U.safeUrl(src)) + '" alt="" loading="lazy">' : '<span class="pdf">VIDEO</span>')) + '</div>' +
          '<div class="lib-card-body"><span class="badge">' + esc(m.media_type) + '</span>' +
          '<a href="project-editor.html?id=' + esc(m.project_id) + '#media">' + esc(m.project ? m.project.title : 'Project') + '</a>' +
          (m.alt_text ? '<span class="muted">' + esc(m.alt_text) + '</span>' : (m.media_type !== 'video' ? '<span class="badge badge--warn">Missing alt text</span>' : '')) +
          '</div></li>';
      }).join('') : '<li class="table-empty">No media in this view.</li>';
    }
    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      filter = b.dataset.filter;
      seg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      render();
    });
    render();
  }

  /* ---------------- Settings ---------------- */
  var SEO_PAGES = [['home', 'Home'], ['about', 'About'], ['services', 'Services'], ['portfolio', 'Portfolio'], ['contact', 'Contact']];

  async function settings(ctx) {
    var res = await SD.db.from('site_settings').select('key,value');
    var map = {};
    (res.data || []).forEach(function (r) { map[r.key] = r.value; });

    async function save(key, value, isPublic, btn) {
      setBusy(btn, true);
      var r = await SD.db.from('site_settings').upsert({ key: key, value: value, is_public: isPublic }, { onConflict: 'key' });
      setBusy(btn, false);
      if (r.error) { toast(errorMessage(r.error), 'error'); return false; }
      toast('Saved');
      return true;
    }

    /* Home hero */
    var hero = map.home_hero || {};
    var hf = document.querySelector('[data-hero-form]');
    ['image_url', 'image_alt', 'video_url', 'poster_url'].forEach(function (k) { hf.elements[k].value = hero[k] || ''; });
    hf.querySelectorAll('[data-hero-upload]').forEach(function (inp) {
      inp.addEventListener('change', async function () {
        var file = inp.files[0];
        if (!file) return;
        var target = inp.dataset.heroUpload;
        try {
          toast('Uploading…');
          var f = file;
          if (target !== 'video_url') f = (await optimiseImage(file, 2400, 0.82)).file;
          var up = await upload('site-media', storagePath('home', f), f);
          hf.elements[target].value = up.url;
          toast('Uploaded. Remember to save.');
        } catch (err) { toast(errorMessage(err, 'Upload failed.'), 'error'); }
        inp.value = '';
      });
    });
    hf.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = {};
      ['image_url', 'image_alt', 'video_url', 'poster_url'].forEach(function (k) { v[k] = hf.elements[k].value.trim(); });
      if (v.image_url && !v.image_alt) { toast('Add alt text for the hero image.', 'error'); hf.elements.image_alt.focus(); return; }
      save('home_hero', v, true, hf.querySelector('[type="submit"]'));
    });

    /* SEO overrides */
    var seo = map.seo_pages || {};
    var sf = document.querySelector('[data-seo-form]');
    sf.querySelector('[data-seo-fields]').innerHTML = SEO_PAGES.map(function (p) {
      var o = seo[p[0]] || {};
      return '<fieldset class="panel"><legend class="label label--blue">' + esc(p[1]) + '</legend><div class="form-grid mt-4">' +
        '<div class="field span-2"><label for="seo-' + p[0] + '-t">Title</label><input id="seo-' + p[0] + '-t" name="' + p[0] + '.title" maxlength="70" value="' + esc(o.title || '') + '" placeholder="Leave empty to keep the page default"></div>' +
        '<div class="field span-2"><label for="seo-' + p[0] + '-d">Meta description</label><textarea id="seo-' + p[0] + '-d" name="' + p[0] + '.description" maxlength="170" rows="2" placeholder="Leave empty to keep the page default">' + esc(o.description || '') + '</textarea></div>' +
        '</div></fieldset>';
    }).join('');
    sf.querySelectorAll('input, textarea').forEach(function (i) { counter(i, i.name.indexOf('.title') > -1 ? 60 : 160); });
    sf.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = {};
      SEO_PAGES.forEach(function (p) {
        var t = sf.elements[p[0] + '.title'].value.trim(), d = sf.elements[p[0] + '.description'].value.trim();
        if (t || d) v[p[0]] = { title: t, description: d };
      });
      save('seo_pages', v, true, sf.querySelector('[type="submit"]'));
    });

    /* Retention */
    var rf = document.querySelector('[data-retention-form]');
    rf.elements.days.value = map.enquiry_retention_days || 365;
    rf.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = parseInt(rf.elements.days.value, 10);
      if (!(d >= 30 && d <= 3650)) { toast('Enter a number of days between 30 and 3650.', 'error'); return; }
      save('enquiry_retention_days', d, false, rf.querySelector('[type="submit"]'));
    });

    /* Password */
    var pf = document.querySelector('[data-password-form]');
    pf.addEventListener('submit', async function (e) {
      e.preventDefault();
      var a = pf.elements.password.value, b = pf.elements.confirm.value;
      if (a.length < 12) { toast('Use at least 12 characters.', 'error'); return; }
      if (a !== b) { toast('The passwords do not match.', 'error'); return; }
      var btn = pf.querySelector('[type="submit"]');
      setBusy(btn, true);
      var r = await SD.db.auth.updateUser({ password: a });
      setBusy(btn, false);
      if (r.error) { toast(errorMessage(r.error, 'Password could not be changed. You may need to sign in again first.'), 'error'); return; }
      pf.reset();
      toast('Password updated');
    });

    var status = document.querySelector('[data-env-status]');
    if (status) status.textContent = (window.SD_CONFIG.SUPABASE_URL || '').replace(/^https:\/\//, '') + ' · signed in as ' + ctx.user.email;
    if (window.location.hash === '#seo') { var s = document.getElementById('seo'); if (s) s.scrollIntoView(); }
  }

  /* ---------------- Boot ---------------- */
  var pages = { dashboard: dashboard, projects: projects, media: media, settings: settings };

  async function boot() {
    var page = document.body.dataset.adminPage;
    if (!page || page === 'login') return;
    var loading = document.querySelector('[data-admin-loading]');
    var ctx = await SD.auth.requireAdmin();
    if (!ctx) return;
    if (ctx.notConfigured) {
      loading.innerHTML = '<div class="config-warning">Supabase is not configured. Add <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> to <code>js/config.js</code>, run <code>supabase/schema.sql</code>, then create an admin user (see README).</div>';
      return;
    }
    renderShell(ctx);
    loading.hidden = true;
    document.querySelector('[data-admin-shell]').hidden = false;
    var fn = SD.admin.pages[page];
    if (fn) {
      try { await fn(ctx); } catch (err) { toast(errorMessage(err), 'error'); }
    }
  }

  SD.admin = {
    pages: pages,
    BUCKETS: BUCKETS,
    toast: toast, confirm: confirmDialog, errorMessage: errorMessage, setBusy: setBusy, counter: counter,
    storagePath: storagePath, upload: upload, removeObjects: removeObjects, removeMediaFiles: removeMediaFiles,
    optimiseImage: optimiseImage, imageSize: imageSize, videoPoster: videoPoster,
    deleteProject: deleteProject, projectBadges: projectBadges, statusBadge: statusBadge
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
