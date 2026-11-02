/* =====================================================================
   SPACE DESIGN — Projects admin (admin/index.html)
   Sign in with Supabase Auth, then list / add / edit / delete projects
   and upload their images to the 'project-images' storage bucket.
   The browser only does what the database allows: every write is
   checked server-side by Row Level Security (supabase/schema.sql).
   ===================================================================== */
(function () {
  'use strict';
  var cfg = window.SD_CONFIG || {};
  var U = window.SD.utils;
  var esc = U.esc;
  var BUCKET = cfg.PROJECT_IMAGES_BUCKET || 'project-images';
  var MAX_EDGE = 2000; // longest side of uploaded images, in pixels

  var db = null;
  var state = { user: null, projects: [], editing: null, images: [], uploaded: [], removed: [], slugTouched: false, dirty: false };

  function $(s, ctx) { return (ctx || document).querySelector(s); }
  function $$(s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); }

  /* ---------------- Views & messages ---------------- */
  function show(view) {
    $$('[data-view]').forEach(function (v) { v.hidden = v.getAttribute('data-view') !== view; });
    window.scrollTo(0, 0);
  }

  var toastTimer;
  function toast(msg, isError) {
    var t = $('[data-toast]');
    t.textContent = msg;
    t.classList.toggle('is-error', !!isError);
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, isError ? 7000 : 3500);
  }

  function alertBox(sel, msg) {
    var a = $(sel);
    a.textContent = msg || '';
    a.hidden = !msg;
    if (msg) { a.setAttribute('tabindex', '-1'); a.focus(); }
  }

  /** Readable message for a Supabase error (raw details only in the console). */
  function message(err, fallback) {
    if (window.console && err) console.warn('[admin]', err);
    var m = (err && (err.message || err.error_description)) || '';
    if (err && err.code === '23505') return 'That web address (slug) is already used by another project. Choose another.';
    if (err && err.code === '23514') return 'One of the values is too long or in the wrong format.';
    if (/row-level security|permission denied|not authorized|42501/i.test(m + (err && err.code))) return 'Permission denied. This account may not have admin rights.';
    if (/payload too large|exceeded the maximum/i.test(m)) return 'The file is too large (limit 10 MB).';
    if (/mime type/i.test(m)) return 'Only JPEG, PNG or WebP images can be uploaded.';
    if (/invalid login credentials/i.test(m)) return 'Email or password is incorrect.';
    if (/failed to fetch|network/i.test(m)) return 'Could not reach the server. Check your internet connection.';
    return fallback || 'Something went wrong. Please try again.';
  }

  /** Image URLs in the database are either absolute (uploads) or site-relative (built-in images). */
  function previewUrl(u) { return /^https?:\/\//i.test(u || '') ? u : '../' + String(u || '').replace(/^\/+/, ''); }

  /** Storage path of an uploaded image, from its public URL (null for site images). */
  function storagePath(url) {
    var marker = '/storage/v1/object/public/' + BUCKET + '/';
    var i = String(url || '').indexOf(marker);
    return i === -1 ? null : decodeURIComponent(String(url).slice(i + marker.length).split('?')[0]);
  }

  /* ---------------- Auth ---------------- */
  async function start() {
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_KEY || !window.supabase) { show('config'); return; }
    db = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'sd-admin-auth' }
    });
    db.auth.onAuthStateChange(function (event) { if (event === 'SIGNED_OUT') { state.user = null; showLogin(); } });

    var s = await db.auth.getSession();
    if (s.data && s.data.session) await enter(s.data.session.user);
    else showLogin();
  }

  function showLogin() {
    $('[data-user]').hidden = true;
    show('login');
    var f = $('[data-login-form]');
    f.reset();
    f.elements.email.focus();
  }

  async function enter(user) {
    // Confirm with the server (not just the stored token), then check admin rights.
    var u = await db.auth.getUser();
    if (u.error || !u.data || !u.data.user) { await db.auth.signOut(); return; }
    state.user = u.data.user;
    $('[data-user-email]').textContent = state.user.email;
    $('[data-user]').hidden = false;
    var a = await db.from('admins').select('user_id').eq('user_id', state.user.id).maybeSingle();
    if (a.error || !a.data) {
      // A missing table means supabase/schema.sql has not been run yet.
      var missing = a.error && (a.error.code === 'PGRST205' || a.error.code === '42P01');
      $('[data-denied-text]').textContent = missing
        ? 'The projects database is not set up yet. In Supabase → SQL Editor, run supabase/schema.sql, then add this account as an admin (README §3).'
        : 'This account can sign in, but it has not been given admin rights. Add it with the SQL in README §3, step 6.';
      show('denied');
      return;
    }
    await loadList();
  }

  var failures = 0, lockedUntil = 0;
  async function onLogin(e) {
    e.preventDefault();
    alertBox('[data-login-alert]', '');
    if (Date.now() < lockedUntil) { alertBox('[data-login-alert]', 'Too many attempts. Please wait ' + Math.ceil((lockedUntil - Date.now()) / 1000) + ' seconds.'); return; }
    var f = e.target, btn = $('[data-login-submit]');
    var email = f.elements.email.value.trim(), password = f.elements.password.value;
    if (!email || !password) { alertBox('[data-login-alert]', 'Enter your email and password.'); return; }
    btn.disabled = true; btn.textContent = 'Signing in…';
    var res = await db.auth.signInWithPassword({ email: email, password: password });
    btn.disabled = false; btn.textContent = 'Sign in';
    if (res.error || !res.data.user) {
      if (++failures >= 5) { lockedUntil = Date.now() + 30000; failures = 0; }
      alertBox('[data-login-alert]', message(res.error, 'Sign-in failed.'));
      return;
    }
    f.elements.password.value = '';
    await enter(res.data.user);
  }

  async function logout() {
    if (state.dirty && !window.confirm('You have unsaved changes. Log out anyway?')) return;
    await discardUploads();
    state.dirty = false;
    await db.auth.signOut();
  }

  /* ---------------- Project list ---------------- */
  async function loadList() {
    var r = await db.from('projects').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false });
    if (r.error) { show('list'); toast(message(r.error, 'Projects could not be loaded.'), true); return; }
    state.projects = r.data || [];
    renderList();
    show('list');
  }

  function renderList() {
    var rows = state.projects;
    var live = rows.filter(function (p) { return p.published; }).length;
    $('[data-count]').textContent = rows.length + (rows.length === 1 ? ' project' : ' projects') + ' · ' + live + ' on the website';
    $('[data-rows]').innerHTML = rows.length ? rows.map(function (p) {
      var img = (p.images || [])[0];
      return '<tr data-id="' + esc(p.id) + '">' +
        '<td class="adm-col-img">' + (img ? '<img src="' + esc(U.safeUrl(previewUrl(img.url))) + '" alt="" loading="lazy">' : '<span class="adm-noimg"></span>') + '</td>' +
        '<td><button type="button" class="adm-title" data-edit>' + esc(p.title) + '</button><span class="adm-sub">' + esc(p.location || '') + '</span></td>' +
        '<td>' + esc(p.category || '—') + '</td>' +
        '<td>' + esc(p.status || '—') + '</td>' +
        '<td>' + esc(p.sort_order) + '</td>' +
        '<td><label class="adm-switch"><input type="checkbox" data-toggle' + (p.published ? ' checked' : '') + '><span class="visually-hidden">Show ' + esc(p.title) + ' on the website</span></label></td>' +
        '<td class="adm-row-actions"><button type="button" class="adm-btn adm-btn--small" data-edit>Edit</button></td>' +
      '</tr>';
    }).join('') : '<tr><td colspan="7" class="adm-empty">No projects yet. Click “Add project”.</td></tr>';
  }

  function projectById(id) { return state.projects.filter(function (p) { return p.id === id; })[0]; }

  async function onListClick(e) {
    var tr = e.target.closest('tr[data-id]');
    if (tr && e.target.closest('[data-edit]')) openEditor(projectById(tr.dataset.id));
  }

  async function onListChange(e) {
    var box = e.target.closest('[data-toggle]');
    if (!box) return;
    var p = projectById(box.closest('tr').dataset.id);
    box.disabled = true;
    var r = await db.from('projects').update({ published: box.checked }).eq('id', p.id);
    box.disabled = false;
    if (r.error) { box.checked = !box.checked; toast(message(r.error), true); return; }
    p.published = box.checked;
    renderList();
    toast(p.title + (p.published ? ' is now on the website.' : ' is now hidden.'));
  }

  /* ---------------- Editor ---------------- */
  var TEXT = ['title', 'slug', 'subtitle', 'category', 'status', 'project_type', 'area', 'location', 'client', 'short_description', 'description', 'details'];

  function openEditor(p) {
    var f = $('[data-edit-form]');
    f.reset();
    alertBox('[data-edit-alert]', '');
    state.editing = p || null;
    state.images = p ? (p.images || []).map(function (m) { return Object.assign({}, m); }) : [];
    state.uploaded = [];
    state.removed = [];
    state.slugTouched = !!p;
    TEXT.forEach(function (k) { f.elements[k].value = p && p[k] != null ? p[k] : ''; });
    f.elements.published.checked = p ? !!p.published : true;
    f.elements.featured.checked = p ? !!p.featured : false;
    f.elements.sort_order.value = p ? p.sort_order : 100;
    $('[data-edit-title]').textContent = p ? p.title : 'New project';
    $('[data-delete-box]').hidden = !p;
    var view = $('[data-view-link]');
    view.hidden = !(p && p.published);
    if (p) view.href = '../portfolio-detail.html?slug=' + encodeURIComponent(p.slug);
    $('[data-upload-status]').textContent = '';
    renderImages();
    state.dirty = false;
    show('edit');
    f.elements.title.focus();
  }

  function renderImages() {
    var list = $('[data-images]');
    if (!state.images.length) { list.innerHTML = '<li class="adm-empty">No images yet.</li>'; return; }
    list.innerHTML = state.images.map(function (m, i) {
      return '<li class="adm-image" data-i="' + i + '">' +
        '<img src="' + esc(U.safeUrl(previewUrl(m.url))) + '" alt="">' +
        '<div class="adm-image-fields">' +
          (i === 0 ? '<span class="adm-badge">Cover</span>' : '') +
          '<label class="adm-field"><span>Description (alt text)</span><input data-alt maxlength="300" value="' + esc(m.alt || '') + '" placeholder="What the image shows"></label>' +
          '<label class="adm-field adm-field--inline"><span>Type</span><select data-kind><option value="image"' + (m.kind !== 'plan' ? ' selected' : '') + '>Photo / render</option><option value="plan"' + (m.kind === 'plan' ? ' selected' : '') + '>Plan / drawing</option></select></label>' +
          '<div class="adm-image-actions">' +
            '<button type="button" class="adm-btn adm-btn--small adm-btn--ghost" data-up' + (i === 0 ? ' disabled' : '') + ' aria-label="Move image ' + (i + 1) + ' up">↑</button>' +
            '<button type="button" class="adm-btn adm-btn--small adm-btn--ghost" data-down' + (i === state.images.length - 1 ? ' disabled' : '') + ' aria-label="Move image ' + (i + 1) + ' down">↓</button>' +
            '<button type="button" class="adm-btn adm-btn--small adm-btn--danger" data-remove>Remove</button>' +
          '</div>' +
        '</div></li>';
    }).join('');
  }

  function onImagesInput(e) {
    var li = e.target.closest('[data-i]');
    if (!li) return;
    var m = state.images[+li.dataset.i];
    if (e.target.matches('[data-alt]')) m.alt = e.target.value;
    if (e.target.matches('[data-kind]')) m.kind = e.target.value;
    state.dirty = true;
  }

  function onImagesClick(e) {
    var li = e.target.closest('[data-i]');
    if (!li) return;
    var i = +li.dataset.i, imgs = state.images;
    if (e.target.closest('[data-up]') && i > 0) { imgs.splice(i - 1, 0, imgs.splice(i, 1)[0]); }
    else if (e.target.closest('[data-down]') && i < imgs.length - 1) { imgs.splice(i + 1, 0, imgs.splice(i, 1)[0]); }
    else if (e.target.closest('[data-remove]')) {
      var gone = imgs.splice(i, 1)[0];
      var path = storagePath(gone.url);
      // Delete the file only after the project is saved without it.
      if (path) state.removed.push(path);
    } else return;
    state.dirty = true;
    renderImages();
  }

  /** Resize to MAX_EDGE and convert JPEG/PNG to WebP; returns { blob, width, height }. */
  async function prepareImage(file) {
    var bmp = await createImageBitmap(file);
    var scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
    var w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    if (scale === 1 && file.type === 'image/webp') return { blob: file, width: w, height: h, type: 'image/webp' };
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(bmp, 0, 0, w, h);
    var blob = await new Promise(function (res) { c.toBlob(res, 'image/webp', 0.84); });
    if (!blob || blob.type !== 'image/webp') return { blob: file, width: bmp.width, height: bmp.height, type: file.type };
    return { blob: blob, width: w, height: h, type: 'image/webp' };
  }

  async function onUpload(e) {
    var files = Array.prototype.slice.call(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    var status = $('[data-upload-status]');
    var f = $('[data-edit-form]');
    var folder = U.slugify(f.elements.slug.value || f.elements.title.value) || 'project';
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      status.textContent = 'Uploading ' + (i + 1) + ' of ' + files.length + ': ' + file.name + '…';
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { toast(file.name + ': only JPEG, PNG or WebP images.', true); continue; }
      try {
        var img = await prepareImage(file);
        var ext = img.type === 'image/webp' ? 'webp' : (img.type === 'image/png' ? 'png' : 'jpg');
        var path = folder + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
        var up = await db.storage.from(BUCKET).upload(path, img.blob, { contentType: img.type, cacheControl: '31536000', upsert: false });
        if (up.error) throw up.error;
        var url = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        state.uploaded.push(path);
        state.images.push({ url: url, kind: 'image', alt: f.elements.title.value.trim(), width: img.width, height: img.height });
        state.dirty = true;
      } catch (err) {
        toast(file.name + ': ' + message(err, 'upload failed.'), true);
      }
    }
    status.textContent = 'Done. Add a short description to each image, then save.';
    renderImages();
  }

  function collect() {
    var f = $('[data-edit-form]');
    var v = {};
    TEXT.forEach(function (k) { var x = f.elements[k].value.trim(); v[k] = x === '' ? null : x; });
    v.slug = (v.slug || '').toLowerCase();
    v.published = f.elements.published.checked;
    v.featured = f.elements.featured.checked;
    v.sort_order = parseInt(f.elements.sort_order.value, 10);
    if (isNaN(v.sort_order)) v.sort_order = 100;
    v.images = state.images.map(function (m) {
      return { url: m.url, kind: m.kind === 'plan' ? 'plan' : 'image', alt: (m.alt || '').trim() || v.title, width: m.width || null, height: m.height || null };
    });
    return v;
  }

  async function onSave(e) {
    e.preventDefault();
    var v = collect();
    var problems = [];
    if (!v.title || v.title.length < 2) problems.push('Enter a title.');
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v.slug)) problems.push('The web address (slug) may only use lowercase letters, numbers and single hyphens.');
    if (v.published && !v.images.length && !window.confirm('This project has no images. Show it on the website anyway?')) return;
    if (problems.length) { alertBox('[data-edit-alert]', problems.join(' ')); return; }
    alertBox('[data-edit-alert]', '');

    var btn = $('[data-save]');
    btn.disabled = true; btn.textContent = 'Saving…';
    var r = state.editing
      ? await db.from('projects').update(v).eq('id', state.editing.id).select().single()
      : await db.from('projects').insert(v).select().single();
    btn.disabled = false; btn.textContent = 'Save project';
    if (r.error) { alertBox('[data-edit-alert]', message(r.error, 'The project could not be saved.')); return; }

    // Saved: uploads now belong to the project; files removed from it can go.
    state.uploaded = [];
    if (state.removed.length) {
      var d = await db.storage.from(BUCKET).remove(state.removed);
      if (d.error && window.console) console.warn('[admin] could not delete removed images', d.error);
      state.removed = [];
    }
    state.dirty = false;
    toast('Saved: ' + r.data.title + (r.data.published ? ' (on the website)' : ' (hidden)'));
    await loadList();
  }

  /** Uploads made in this editing session that were never saved. */
  async function discardUploads() {
    if (!state.uploaded.length || !db) return;
    await db.storage.from(BUCKET).remove(state.uploaded);
    state.uploaded = [];
  }

  async function onCancel() {
    if (state.dirty && !window.confirm('Discard your unsaved changes?')) return;
    await discardUploads();
    state.dirty = false;
    show('list');
  }

  async function onDelete() {
    var p = state.editing;
    if (!p || !window.confirm('Delete “' + p.title + '” permanently? Its uploaded images are deleted too.')) return;
    var r = await db.from('projects').delete().eq('id', p.id);
    if (r.error) { toast(message(r.error, 'The project could not be deleted.'), true); return; }
    var files = (p.images || []).map(function (m) { return storagePath(m.url); }).filter(Boolean).concat(state.uploaded);
    if (files.length) await db.storage.from(BUCKET).remove(files);
    state.uploaded = [];
    state.dirty = false;
    toast('Deleted: ' + p.title);
    await loadList();
  }

  /* ---------------- Wire up ---------------- */
  function init() {
    $('[data-login-form]').addEventListener('submit', onLogin);
    $$('[data-logout]').forEach(function (b) { b.addEventListener('click', logout); });
    $('[data-new]').addEventListener('click', function () { openEditor(null); });
    $('[data-rows]').addEventListener('click', onListClick);
    $('[data-rows]').addEventListener('change', onListChange);

    var f = $('[data-edit-form]');
    f.addEventListener('submit', onSave);
    f.addEventListener('input', function (e) {
      state.dirty = true;
      if (e.target.name === 'slug') state.slugTouched = true;
      if (e.target.name === 'title' && !state.slugTouched) f.elements.slug.value = U.slugify(f.elements.title.value);
    });
    $('[data-cancel]').addEventListener('click', onCancel);
    $('[data-delete]').addEventListener('click', onDelete);
    $('[data-images]').addEventListener('input', onImagesInput);
    $('[data-images]').addEventListener('change', onImagesInput);
    $('[data-images]').addEventListener('click', onImagesClick);
    $('[data-upload]').addEventListener('change', onUpload);
    window.addEventListener('beforeunload', function (e) { if (state.dirty) { e.preventDefault(); e.returnValue = ''; } });

    start().catch(function (err) { show('login'); toast(message(err, 'The admin could not start.'), true); });
  }

  init();
})();
