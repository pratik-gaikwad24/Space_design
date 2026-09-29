/* =====================================================================
   SPACE DESIGN — Admin project editor + media manager
   Create / edit / delete / publish / feature projects; upload, replace,
   reorder and delete images, videos, drawings and plans; edit alt text,
   captions, posters and WebVTT captions; set cover image & featured video;
   edit SEO fields with a live search preview.
   ===================================================================== */
(function () {
  'use strict';
  var SD = window.SD;
  var U = SD.utils;
  var esc = U.esc;

  var LIMITS = { image: 15, video: 50, drawing: 25, plan: 25 }; // MB, must match bucket limits
  var ACCEPT = {
    image: 'image/jpeg,image/png,image/webp,image/avif',
    video: 'video/mp4,video/webm',
    drawing: 'image/jpeg,image/png,image/webp,application/pdf',
    plan: 'image/jpeg,image/png,image/webp,application/pdf'
  };
  var TEXT_FIELDS = ['title', 'slug', 'subtitle', 'category', 'project_type', 'location', 'year', 'area', 'status', 'client',
    'short_description', 'description', 'concept', 'design_approach', 'details', 'seo_title', 'seo_description', 'og_image'];

  var state = { id: null, project: null, media: [], dirty: false, slugTouched: false };
  var A, form, els = {};

  function isPdf(m) { return /pdf/i.test(m.mime_type || '') || /\.pdf(\?|$)/i.test(m.media_url || ''); }

  /* ---------------- Form <-> data ---------------- */
  function fill(p) {
    TEXT_FIELDS.forEach(function (k) { if (form.elements[k]) form.elements[k].value = p[k] == null ? '' : p[k]; });
    form.elements.sort_order.value = p.sort_order || 0;
    form.elements.published.checked = !!p.published;
    form.elements.featured.checked = !!p.featured;
    form.querySelectorAll('input[name="services"]').forEach(function (c) { c.checked = (p.services || []).indexOf(c.value) > -1; });
    state.slugTouched = true;
    form.querySelectorAll('textarea, input[type="text"]').forEach(function (i) { i.dispatchEvent(new Event('input')); });
    state.dirty = false;
  }

  function collect() {
    var v = {};
    TEXT_FIELDS.forEach(function (k) {
      var val = (form.elements[k].value || '').trim();
      v[k] = val === '' ? null : val;
    });
    v.slug = (v.slug || '').toLowerCase();
    v.sort_order = parseInt(form.elements.sort_order.value, 10) || 0;
    v.published = form.elements.published.checked;
    v.featured = form.elements.featured.checked;
    v.services = Array.prototype.map.call(form.querySelectorAll('input[name="services"]:checked'), function (c) { return c.value; });
    return v;
  }

  function validate(v) {
    var problems = [];
    if (!v.title) problems.push(['title', 'Title is required.']);
    if (!v.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.slug)) problems.push(['slug', 'Slug may only contain lowercase letters, numbers and single hyphens.']);
    if (v.seo_title && v.seo_title.length > 70) problems.push(['seo_title', 'SEO title must be 70 characters or fewer.']);
    if (v.seo_description && v.seo_description.length > 170) problems.push(['seo_description', 'SEO description must be 170 characters or fewer.']);
    if (v.og_image && !U.safeUrl(v.og_image)) problems.push(['og_image', 'OG image must be a valid https URL.']);
    return problems;
  }

  function publishWarnings(v) {
    var w = [];
    if (!state.project || !state.project.featured_media_id) w.push('no cover image is set');
    var missingAlt = state.media.filter(function (m) { return m.media_type !== 'video' && !m.alt_text; }).length;
    if (missingAlt) w.push(missingAlt + ' media item(s) have no alt text');
    if (!v.short_description) w.push('the short description is empty');
    return w;
  }

  /* ---------------- SERP preview ---------------- */
  function preview() {
    var v = collect();
    var site = SD.seo ? SD.seo.SITE : '';
    els.serpUrl.textContent = site.replace(/^https?:\/\//, '') + ' › portfolio › ' + (v.slug || 'project-slug');
    els.serpTitle.textContent = v.seo_title || ((v.title || 'Project title') + (v.location ? ' · ' + v.location : '') + ' | Space Design');
    els.serpDesc.textContent = v.seo_description || v.short_description || 'Add a short description or SEO description.';
  }

  /* ---------------- Save / delete ---------------- */
  async function save(e) {
    if (e) e.preventDefault();
    var v = collect();
    form.querySelectorAll('[aria-invalid]').forEach(function (i) { i.removeAttribute('aria-invalid'); });
    var problems = validate(v);
    if (problems.length) {
      problems.forEach(function (p) { form.elements[p[0]].setAttribute('aria-invalid', 'true'); });
      form.elements[problems[0][0]].focus();
      A.toast(problems.map(function (p) { return p[1]; }).join(' '), 'error');
      return;
    }
    if (v.published && state.id) {
      var w = publishWarnings(v);
      if (w.length && !(await A.confirm('Publish with warnings?', 'Before publishing: ' + w.join('; ') + '. Publish anyway?', 'Publish anyway'))) return;
    }
    var btn = els.saveBtn;
    A.setBusy(btn, true);
    var res;
    if (state.id) res = await SD.db.from('projects').update(v).eq('id', state.id).select().single();
    else res = await SD.db.from('projects').insert(v).select().single();
    A.setBusy(btn, false);
    if (res.error) { A.toast(A.errorMessage(res.error, 'Project could not be saved.'), 'error'); return; }
    var created = !state.id;
    state.project = res.data;
    state.id = res.data.id;
    state.dirty = false;
    if (created) {
      history.replaceState(null, '', 'project-editor.html?id=' + state.id);
      els.mediaPanel.hidden = false;
      els.deleteBtn.hidden = false;
      els.mediaPanel.scrollIntoView({ behavior: U.prefersReducedMotion() ? 'auto' : 'smooth' });
      A.toast('Project created. Now add images, videos and drawings.');
    } else {
      A.toast('Project saved');
    }
    updateHead();
  }

  async function removeProject() {
    if (!state.id) return;
    var ok = await A.confirm('Delete project?', 'This permanently deletes “' + (state.project.title || '') + '” and all of its media files.', 'Delete project');
    if (!ok) return;
    state.dirty = false;
    if (await A.deleteProject(state.id)) window.location.href = 'projects.html';
  }

  function updateHead() {
    var p = state.project;
    els.heading.textContent = p ? p.title : 'New project';
    els.badges.innerHTML = p ? A.projectBadges(p) : '<span class="badge">Unsaved</span>';
    els.viewLink.hidden = !(p && p.published);
    if (p) els.viewLink.href = '../portfolio-detail.html?slug=' + encodeURIComponent(p.slug);
  }

  /* ---------------- Media: load & render ---------------- */
  async function loadMedia() {
    var r = await SD.db.from('project_media').select('*').eq('project_id', state.id).order('sort_order').order('created_at');
    if (r.error) { A.toast(A.errorMessage(r.error), 'error'); return; }
    state.media = r.data || [];
    renderMedia();
  }

  function renderMedia() {
    var p = state.project || {};
    els.mediaCount.textContent = state.media.length + (state.media.length === 1 ? ' item' : ' items');
    if (!state.media.length) { els.mediaList.innerHTML = '<li class="table-empty">No media yet. Upload images, videos or drawings above.</li>'; return; }
    els.mediaList.innerHTML = state.media.map(function (m, i) {
      var isCover = p.featured_media_id === m.id;
      var isFeatVideo = p.featured_video_id === m.id;
      var previewSrc = m.media_type === 'video' ? m.poster_url : (isPdf(m) ? '' : m.media_url);
      var needsAlt = m.media_type !== 'video' && !m.alt_text;
      return '<li class="media-item' + (isCover || isFeatVideo ? ' is-featured' : '') + '" data-mid="' + esc(m.id) + '">' +
        '<div class="media-preview">' +
          (previewSrc ? '<img src="' + esc(U.safeUrl(previewSrc)) + '" alt="" loading="lazy">' : '<span class="pdf">' + (m.media_type === 'video' ? 'VIDEO · no poster' : 'PDF') + '</span>') +
        '</div>' +
        '<div class="media-fields">' +
          '<div class="media-meta"><span class="badge">' + esc(m.media_type) + '</span>' +
            (isCover ? '<span class="badge badge--featured">Cover</span>' : '') +
            (isFeatVideo ? '<span class="badge badge--featured">Featured video</span>' : '') +
            (needsAlt ? '<span class="badge badge--warn">Alt text needed</span>' : '') +
            (m.media_type === 'video' ? (m.captions_url ? '<span class="badge">Captions ✓</span>' : '<span class="badge badge--warn">No captions</span>') : '') +
            '<span>' + U.pad(i + 1) + '</span>' +
            '<a class="text-link" href="' + esc(U.safeUrl(m.media_url)) + '" target="_blank" rel="noopener">Open file ↗</a>' +
          '</div>' +
          '<div class="field"><label for="alt-' + esc(m.id) + '">Alt text' + (m.media_type === 'video' ? ' / accessible label' : '') + '</label>' +
            '<input id="alt-' + esc(m.id) + '" name="alt_text" maxlength="300" value="' + esc(m.alt_text || '') + '" placeholder="Describe what is shown, factually, e.g. “Residential building exterior in Pune”"></div>' +
          '<div class="field"><label for="cap-' + esc(m.id) + '">Caption</label>' +
            '<input id="cap-' + esc(m.id) + '" name="caption" maxlength="500" value="' + esc(m.caption || '') + '"></div>' +
          '<div><button type="button" class="btn-xs btn-xs--blue" data-m="save">Save text</button></div>' +
        '</div>' +
        '<div class="media-controls">' +
          '<div class="order"><button type="button" class="btn-xs" data-m="up"' + (i === 0 ? ' disabled' : '') + ' aria-label="Move up">↑</button>' +
          '<button type="button" class="btn-xs" data-m="down"' + (i === state.media.length - 1 ? ' disabled' : '') + ' aria-label="Move down">↓</button></div>' +
          (m.media_type === 'image' && !isCover ? '<button type="button" class="btn-xs" data-m="cover">Set as cover</button>' : '') +
          (m.media_type === 'video' ? '<button type="button" class="btn-xs" data-m="featvideo">' + (isFeatVideo ? 'Unset featured video' : 'Set featured video') + '</button>' : '') +
          (m.media_type === 'video' && m.poster_url && !isCover ? '<button type="button" class="btn-xs" data-m="cover">Use poster as cover</button>' : '') +
          '<label class="btn-xs">Replace file<input class="hidden-file" type="file" data-m="replace" accept="' + esc(ACCEPT[m.media_type]) + '"></label>' +
          (m.media_type === 'video' ? '<label class="btn-xs">' + (m.poster_url ? 'Replace poster' : 'Add poster') + '<input class="hidden-file" type="file" data-m="poster" accept="image/jpeg,image/png,image/webp"></label>' : '') +
          (m.media_type === 'video' ? '<label class="btn-xs">' + (m.captions_url ? 'Replace captions' : 'Add captions (.vtt)') + '<input class="hidden-file" type="file" data-m="captions" accept=".vtt,text/vtt"></label>' : '') +
          '<button type="button" class="btn-xs btn-xs--danger" data-m="delete">Delete</button>' +
        '</div>' +
      '</li>';
    }).join('');
  }

  function findMedia(id) { return state.media.filter(function (m) { return m.id === id; })[0]; }

  async function updateMedia(id, patch) {
    var r = await SD.db.from('project_media').update(patch).eq('id', id).select().single();
    if (r.error) { A.toast(A.errorMessage(r.error), 'error'); return null; }
    var idx = state.media.findIndex(function (m) { return m.id === id; });
    state.media[idx] = r.data;
    return r.data;
  }
  async function updateProject(patch) {
    var r = await SD.db.from('projects').update(patch).eq('id', state.id).select().single();
    if (r.error) { A.toast(A.errorMessage(r.error), 'error'); return false; }
    state.project = r.data;
    updateHead();
    return true;
  }

  /* ---------------- Media: upload ---------------- */
  function checkFile(file, type) {
    var okTypes = ACCEPT[type].split(',');
    if (okTypes.indexOf(file.type) === -1) return 'Unsupported file type for ' + type + ': ' + (file.type || 'unknown');
    if (file.size > LIMITS[type] * 1024 * 1024) return 'File is larger than ' + LIMITS[type] + ' MB';
    return '';
  }

  async function uploadFiles(files, type) {
    var optimise = els.optimise.checked;
    var autoPoster = els.autoPoster.checked;
    var bucket = A.BUCKETS[type];
    var maxOrder = state.media.reduce(function (m, x) { return Math.max(m, x.sort_order || 0); }, 0);

    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var li = document.createElement('li');
      li.innerHTML = '<span>' + esc(file.name) + '</span><span data-s>Preparing…</span><progress></progress>';
      els.queue.appendChild(li);
      var status = li.querySelector('[data-s]');
      var err = checkFile(file, type);
      if (err) { status.textContent = err; li.querySelector('progress').remove(); continue; }
      try {
        var f = file, width = null, height = null;
        if (type === 'image' || (type !== 'video' && /^image\//.test(file.type))) {
          if (optimise) { var o = await A.optimiseImage(file, 2400, 0.82); f = o.file; width = o.width; height = o.height; }
          else { var s = await A.imageSize(file); width = s.width || null; height = s.height || null; }
        }
        status.textContent = 'Uploading…';
        var up = await A.upload(bucket, A.storagePath(state.id, f), f);
        var row = {
          project_id: state.id, media_type: type, media_url: up.url, bucket: bucket, storage_path: up.path,
          mime_type: f.type || null, width: width, height: height, sort_order: maxOrder + (i + 1) * 10, alt_text: null, caption: null
        };
        if (type === 'video' && autoPoster) {
          status.textContent = 'Creating poster…';
          var poster = await A.videoPoster(file);
          if (poster) {
            var pf = new File([poster.blob], 'poster.webp', { type: 'image/webp' });
            var pu = await A.upload('portfolio-images', A.storagePath(state.id + '/posters', pf, 'webp'), pf);
            row.poster_url = pu.url; row.poster_path = pu.path; row.width = poster.width; row.height = poster.height;
          }
        }
        var ins = await SD.db.from('project_media').insert(row).select().single();
        if (ins.error) { await A.removeObjects(bucket, [up.path]); throw ins.error; }
        state.media.push(ins.data);
        if (type === 'image' && !state.project.featured_media_id) await updateProject({ featured_media_id: ins.data.id });
        status.textContent = 'Done: add alt text below';
      } catch (e2) {
        status.textContent = A.errorMessage(e2, 'Upload failed');
      }
      var pg = li.querySelector('progress'); if (pg) pg.remove();
    }
    renderMedia();
  }

  /* ---------------- Media: actions ---------------- */
  async function onMediaClick(e) {
    var b = e.target.closest('button[data-m]');
    if (!b) return;
    var li = b.closest('[data-mid]');
    var id = li.dataset.mid;
    var m = findMedia(id);
    var act = b.dataset.m;

    if (act === 'save') {
      A.setBusy(b, true);
      var ok = await updateMedia(id, {
        alt_text: li.querySelector('[name="alt_text"]').value.trim() || null,
        caption: li.querySelector('[name="caption"]').value.trim() || null
      });
      A.setBusy(b, false);
      if (ok) { A.toast('Media text saved'); renderMedia(); }
    }
    if (act === 'up' || act === 'down') {
      var idx = state.media.indexOf(m);
      var j = act === 'up' ? idx - 1 : idx + 1;
      if (j < 0 || j >= state.media.length) return;
      state.media.splice(idx, 1);
      state.media.splice(j, 0, m);
      await persistOrder();
      renderMedia();
      var again = els.mediaList.querySelector('[data-mid="' + id + '"] [data-m="' + act + '"]');
      (again && !again.disabled ? again : els.mediaList.querySelector('[data-mid="' + id + '"] [data-m="save"]')).focus();
      U.announce('Moved to position ' + (j + 1));
    }
    if (act === 'cover') {
      if (await updateProject({ featured_media_id: id })) { A.toast('Cover image set'); renderMedia(); }
    }
    if (act === 'featvideo') {
      var next = state.project.featured_video_id === id ? null : id;
      if (await updateProject({ featured_video_id: next })) { A.toast(next ? 'Featured video set' : 'Featured video removed'); renderMedia(); }
    }
    if (act === 'delete') {
      if (!(await A.confirm('Delete this ' + m.media_type + '?', 'The file will be removed from storage permanently.', 'Delete'))) return;
      try {
        await A.removeMediaFiles([m]);
        var r = await SD.db.from('project_media').delete().eq('id', id);
        if (r.error) throw r.error;
        state.media = state.media.filter(function (x) { return x.id !== id; });
        var patch = {};
        if (state.project.featured_media_id === id) {
          var nextImg = state.media.filter(function (x) { return x.media_type === 'image'; })[0];
          patch.featured_media_id = nextImg ? nextImg.id : null;
        }
        if (state.project.featured_video_id === id) patch.featured_video_id = null;
        if (Object.keys(patch).length) await updateProject(patch);
        A.toast('Media deleted');
        renderMedia();
      } catch (err) { A.toast(A.errorMessage(err, 'Media could not be deleted.'), 'error'); }
    }
  }

  async function persistOrder() {
    var updates = [];
    state.media.forEach(function (m, i) {
      var order = (i + 1) * 10;
      if (m.sort_order !== order) {
        m.sort_order = order;
        updates.push(SD.db.from('project_media').update({ sort_order: order }).eq('id', m.id));
      }
    });
    var results = await Promise.all(updates);
    if (results.some(function (r) { return r.error; })) A.toast('Order could not be fully saved. Reload and try again.', 'error');
  }

  async function onMediaFile(e) {
    var input = e.target.closest('input[type="file"][data-m]');
    if (!input || !input.files[0]) return;
    var file = input.files[0];
    var li = input.closest('[data-mid]');
    var m = findMedia(li.dataset.mid);
    var act = input.dataset.m;
    input.value = '';
    try {
      if (act === 'replace') {
        var err = checkFile(file, m.media_type);
        if (err) { A.toast(err, 'error'); return; }
        A.toast('Replacing…');
        var f = file, w = m.width, h = m.height;
        if (/^image\/(jpeg|png)$/.test(file.type) && els.optimise.checked) { var o = await A.optimiseImage(file, 2400, 0.82); f = o.file; w = o.width; h = o.height; }
        else if (/^image\//.test(file.type)) { var s = await A.imageSize(file); w = s.width || null; h = s.height || null; }
        var bucket = m.bucket || A.BUCKETS[m.media_type];
        var up = await A.upload(bucket, A.storagePath(state.id, f), f);
        var oldPath = m.storage_path;
        var ok = await updateMedia(m.id, { media_url: up.url, storage_path: up.path, mime_type: f.type, width: w, height: h });
        if (ok && oldPath) await A.removeObjects(bucket, [oldPath]);
        A.toast('File replaced. Check the alt text still matches.');
      }
      if (act === 'poster') {
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { A.toast('Poster must be JPEG, PNG or WebP.', 'error'); return; }
        var pf = (await A.optimiseImage(file, 1920, 0.82)).file;
        var pu = await A.upload('portfolio-images', A.storagePath(state.id + '/posters', pf), pf);
        var oldPoster = m.poster_path;
        if (await updateMedia(m.id, { poster_url: pu.url, poster_path: pu.path }) && oldPoster) await A.removeObjects('portfolio-images', [oldPoster]);
        A.toast('Poster updated');
      }
      if (act === 'captions') {
        if (!/\.vtt$/i.test(file.name)) { A.toast('Captions must be a WebVTT (.vtt) file.', 'error'); return; }
        var text = await file.text();
        if (!/^﻿?WEBVTT/.test(text)) { A.toast('This file does not look like WebVTT (it should start with “WEBVTT”).', 'error'); return; }
        var vf = new File([file], file.name, { type: 'text/vtt' });
        var cu = await A.upload('portfolio-videos', A.storagePath(state.id + '/captions', vf, 'vtt'), vf, 'text/vtt');
        var oldCap = m.captions_path;
        if (await updateMedia(m.id, { captions_url: cu.url, captions_path: cu.path }) && oldCap) await A.removeObjects('portfolio-videos', [oldCap]);
        A.toast('Captions added');
      }
      renderMedia();
    } catch (err2) {
      A.toast(A.errorMessage(err2, 'Upload failed.'), 'error');
    }
  }

  /* ---------------- Init ---------------- */
  async function init() {
    A = SD.admin;
    form = document.querySelector('[data-project-form]');
    els.saveBtn = document.querySelector('[data-save]');
    els.deleteBtn = document.querySelector('[data-delete]');
    els.heading = document.querySelector('[data-editor-title]');
    els.badges = document.querySelector('[data-editor-badges]');
    els.viewLink = document.querySelector('[data-view-link]');
    els.mediaPanel = document.getElementById('media');
    els.mediaList = document.querySelector('[data-media-list]');
    els.mediaCount = document.querySelector('[data-media-count]');
    els.queue = document.querySelector('[data-upload-queue]');
    els.optimise = document.querySelector('[data-optimise]');
    els.autoPoster = document.querySelector('[data-auto-poster]');
    els.serpUrl = document.querySelector('[data-serp-url]');
    els.serpTitle = document.querySelector('[data-serp-title]');
    els.serpDesc = document.querySelector('[data-serp-desc]');

    // Counters
    [['short_description', 600], ['seo_title', 60], ['seo_description', 160], ['subtitle', 300]].forEach(function (x) { A.counter(form.elements[x[0]], x[1]); });

    // Slug auto-generation until edited manually
    form.elements.title.addEventListener('input', function () { if (!state.slugTouched) form.elements.slug.value = U.slugify(form.elements.title.value); });
    form.elements.slug.addEventListener('input', function () { state.slugTouched = true; });
    form.addEventListener('input', function () { state.dirty = true; preview(); });
    form.addEventListener('change', function () { state.dirty = true; });
    form.addEventListener('submit', save);
    els.deleteBtn.addEventListener('click', removeProject);
    document.querySelector('[data-og-from-cover]').addEventListener('click', function () {
      var c = state.media.filter(function (m) { return state.project && m.id === state.project.featured_media_id; })[0];
      if (!c) { A.toast('Set a cover image first.', 'error'); return; }
      form.elements.og_image.value = c.media_type === 'video' ? c.poster_url : c.media_url;
      state.dirty = true;
    });
    window.addEventListener('beforeunload', function (e) { if (state.dirty) { e.preventDefault(); e.returnValue = ''; } });

    // Upload form
    var typeSel = document.querySelector('[data-upload-type]');
    var fileInput = document.querySelector('[data-upload-files]');
    var drop = document.querySelector('[data-dropzone]');
    function syncAccept() { fileInput.accept = ACCEPT[typeSel.value]; document.querySelector('[data-video-opts]').hidden = typeSel.value !== 'video'; }
    typeSel.addEventListener('change', syncAccept);
    syncAccept();
    document.querySelector('[data-upload-btn]').addEventListener('click', async function () {
      if (!fileInput.files.length) { A.toast('Choose one or more files first.', 'error'); fileInput.focus(); return; }
      var btn = this;
      A.setBusy(btn, true, 'Uploading…');
      await uploadFiles(Array.prototype.slice.call(fileInput.files), typeSel.value);
      A.setBusy(btn, false);
      fileInput.value = '';
    });
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.remove('is-over'); }); });
    drop.addEventListener('drop', function (e) {
      e.preventDefault();
      if (e.dataTransfer.files.length) uploadFiles(Array.prototype.slice.call(e.dataTransfer.files), typeSel.value);
    });
    els.mediaList.addEventListener('click', onMediaClick);
    els.mediaList.addEventListener('change', onMediaFile);

    // Load existing project
    var id = U.param('id');
    if (id) {
      var r = await SD.db.from('projects').select('*').eq('id', id).maybeSingle();
      if (r.error || !r.data) { A.toast('Project not found.', 'error'); window.location.href = 'projects.html'; return; }
      state.id = r.data.id;
      state.project = r.data;
      fill(r.data);
      els.mediaPanel.hidden = false;
      els.deleteBtn.hidden = false;
      await loadMedia();
      if (window.location.hash === '#media') els.mediaPanel.scrollIntoView();
    }
    updateHead();
    preview();
  }

  SD.admin.pages['project-editor'] = init;
})();
