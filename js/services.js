/* =====================================================================
   SPACE DESIGN — Services
   • Public services page: related projects per service + optional copy
     overrides from the Supabase `services` table.
   • Admin services page: edit services (title, summary, description,
     process steps, category link, order, visibility).
   ===================================================================== */
(function () {
  'use strict';
  var SD = window.SD || {};
  var U = SD.utils;
  var esc = U.esc;

  /* ================= Public page ================= */
  async function publicPage() {
    var blocks = document.querySelectorAll('[data-service]');
    if (!blocks.length) return;

    // Copy overrides (only when the admin has filled them in).
    if (SD.supabaseConfigured) {
      var s = await SD.db.from('services').select('slug,title,summary,description,process').eq('published', true);
      (s.data || []).forEach(function (row) {
        var block = document.querySelector('[data-service="' + CSS.escape(row.slug) + '"]');
        if (!block) return;
        if (row.summary) block.querySelector('[data-service-summary]').textContent = row.summary;
        if (row.description) block.querySelector('[data-service-desc]').innerHTML = U.paragraphs(row.description);
        if (Array.isArray(row.process) && row.process.length) {
          block.querySelector('[data-service-process]').innerHTML = row.process.filter(function (p) { return p && p.title; }).slice(0, 8).map(function (p) {
            return '<li><h3>' + esc(p.title) + '</h3><p>' + esc(p.text || '') + '</p></li>';
          }).join('');
        }
      });
    }

    // Related projects
    var res = await SD.api.listProjects({});
    var all = res.data || [];
    document.querySelectorAll('[data-related]').forEach(function (wrap) {
      var cat = wrap.getAttribute('data-related');
      var list = all.filter(function (p) {
        var sv = p.services || [];
        return p.category === cat || sv.indexOf(cat) > -1 || sv.indexOf(cat + ' Consultancy') > -1;
      }).slice(0, 4);
      var body = wrap.querySelector('.related-body');
      if (!list.length) {
        body.innerHTML = '<p class="related-empty">Projects for this service will be published here.</p>';
        return;
      }
      body.innerHTML = '<div class="pf-grid">' + list.map(SD.ui.portfolioCard).join('') + '</div>';
      SD.motion.reveal(body);
    });
  }

  /* ================= Admin page ================= */
  async function adminPage() {
    var A = SD.admin;
    var holder = document.querySelector('[data-services-list]');

    async function load() {
      var r = await SD.db.from('services').select('*').order('sort_order');
      if (r.error) { A.toast(A.errorMessage(r.error), 'error'); return; }
      holder.innerHTML = (r.data || []).map(record).join('') || '<p class="table-empty">No services yet.</p>';
    }

    function stepRow(p, i) {
      return '<div class="repeater-row"><span class="n">' + U.pad(i + 1) + '</span>' +
        '<div class="field"><label>Step title<input name="step_title" maxlength="60" value="' + esc(p.title || '') + '"></label></div>' +
        '<div class="field"><label>Step text<input name="step_text" maxlength="200" value="' + esc(p.text || '') + '"></label></div>' +
        '<button type="button" class="btn-xs btn-xs--danger" data-remove-step aria-label="Remove step ' + (i + 1) + '">✕</button></div>';
    }

    function record(s) {
      var process = Array.isArray(s.process) ? s.process : [];
      return '<details class="record" data-id="' + esc(s.id) + '"><summary><h2>' + esc((s.number ? s.number + ' · ' : '') + s.title) + '</h2>' +
        (s.published ? '<span class="badge badge--live">Visible</span>' : '<span class="badge">Hidden</span>') + '</summary>' +
        '<form class="record-body form" data-service-form>' +
          '<div class="form-grid">' +
            '<div class="field"><label for="t-' + s.id + '">Title</label><input id="t-' + s.id + '" name="title" required maxlength="120" value="' + esc(s.title) + '"></div>' +
            '<div class="field"><label for="n-' + s.id + '">Number</label><input id="n-' + s.id + '" name="number" maxlength="4" value="' + esc(s.number || '') + '"></div>' +
            '<div class="field"><label for="sl-' + s.id + '">Slug (matches the section on the services page)</label><input id="sl-' + s.id + '" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" value="' + esc(s.slug) + '"></div>' +
            '<div class="field"><label for="c-' + s.id + '">Related project category</label><input id="c-' + s.id + '" name="category_key" maxlength="80" value="' + esc(s.category_key || '') + '"></div>' +
            '<div class="field span-2"><label for="su-' + s.id + '">Summary</label><textarea id="su-' + s.id + '" name="summary" maxlength="600" rows="2">' + esc(s.summary || '') + '</textarea></div>' +
            '<div class="field span-2"><label for="d-' + s.id + '">Description (blank line = new paragraph)</label><textarea id="d-' + s.id + '" name="description" maxlength="6000" rows="5">' + esc(s.description || '') + '</textarea></div>' +
            '<div class="field"><label for="o-' + s.id + '">Sort order</label><input id="o-' + s.id + '" name="sort_order" type="number" value="' + (s.sort_order || 0) + '"></div>' +
            '<div class="field"><div class="check"><input id="p-' + s.id + '" name="published" type="checkbox"' + (s.published ? ' checked' : '') + '><label for="p-' + s.id + '">Visible on website</label></div></div>' +
          '</div>' +
          '<fieldset class="mt-6"><legend class="label label--blue mb-4">Process steps</legend><div class="repeater" data-steps>' +
            process.map(stepRow).join('') + '</div><button type="button" class="btn-xs mt-4" data-add-step>+ Add step</button></fieldset>' +
          '<div class="admin-actions mt-6"><button type="submit" class="btn btn--sm">Save service</button>' +
          '<button type="button" class="btn btn--sm btn--ghost" data-delete-service>Delete</button></div>' +
        '</form></details>';
    }

    holder.addEventListener('click', async function (e) {
      if (e.target.closest('[data-add-step]')) {
        var steps = e.target.closest('form').querySelector('[data-steps]');
        steps.insertAdjacentHTML('beforeend', stepRow({}, steps.children.length));
        steps.lastElementChild.querySelector('input').focus();
      }
      if (e.target.closest('[data-remove-step]')) {
        var row = e.target.closest('.repeater-row');
        var list = row.parentNode;
        row.remove();
        Array.prototype.forEach.call(list.children, function (r, i) { r.querySelector('.n').textContent = U.pad(i + 1); });
      }
      if (e.target.closest('[data-delete-service]')) {
        var rec = e.target.closest('[data-id]');
        if (!(await A.confirm('Delete service?', 'The service record is removed from the database. The static page content remains until you edit services.html.', 'Delete'))) return;
        var d = await SD.db.from('services').delete().eq('id', rec.dataset.id);
        if (d.error) { A.toast(A.errorMessage(d.error), 'error'); return; }
        A.toast('Service deleted');
        load();
      }
    });

    holder.addEventListener('submit', async function (e) {
      e.preventDefault();
      var f = e.target;
      var id = f.closest('[data-id]').dataset.id;
      var titles = f.querySelectorAll('[name="step_title"]'), texts = f.querySelectorAll('[name="step_text"]');
      var process = [];
      titles.forEach(function (t, i) { if (t.value.trim()) process.push({ title: t.value.trim(), text: texts[i].value.trim() }); });
      var patch = {
        title: f.elements.title.value.trim(),
        number: f.elements.number.value.trim() || null,
        slug: f.elements.slug.value.trim().toLowerCase(),
        category_key: f.elements.category_key.value.trim() || null,
        summary: f.elements.summary.value.trim() || null,
        description: f.elements.description.value.trim() || null,
        sort_order: parseInt(f.elements.sort_order.value, 10) || 0,
        published: f.elements.published.checked,
        process: process
      };
      if (!patch.title || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(patch.slug)) { A.toast('Title and a valid slug are required.', 'error'); return; }
      var btn = f.querySelector('[type="submit"]');
      A.setBusy(btn, true);
      var r = await SD.db.from('services').update(patch).eq('id', id);
      A.setBusy(btn, false);
      if (r.error) { A.toast(A.errorMessage(r.error), 'error'); return; }
      A.toast('Service saved');
    });

    document.querySelector('[data-new-service]').addEventListener('click', async function () {
      var slug = 'new-service-' + Date.now().toString(36);
      var r = await SD.db.from('services').insert({ slug: slug, title: 'New service', published: false, sort_order: 99 });
      if (r.error) { A.toast(A.errorMessage(r.error), 'error'); return; }
      await load();
      var last = holder.lastElementChild;
      if (last) { last.open = true; last.querySelector('input').focus(); }
    });

    load();
  }

  if (SD.admin && SD.admin.pages) SD.admin.pages.services = adminPage;
  else if (document.body && document.body.dataset.page === 'services') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', publicPage);
    else publicPage();
  }
})();
