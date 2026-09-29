/* =====================================================================
   SPACE DESIGN — Admin locations (offices)
   Stores the office records in Supabase. The public pages keep the office
   details as static HTML (best for search engines and no-JS visitors);
   when an office changes, update the record here AND partials/footer.html,
   index.html and contact.html (see README §Locations).
   ===================================================================== */
(function () {
  'use strict';
  var SD = window.SD;
  var U = SD.utils;
  var esc = U.esc;

  function lines(v) { return (v || '').split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean); }

  async function init() {
    var A = SD.admin;
    var holder = document.querySelector('[data-locations-list]');

    function record(l) {
      var id = esc(l.id);
      return '<details class="record" data-id="' + id + '"' + (l._open ? ' open' : '') + '><summary><h2>' + esc(l.label + ' · ' + l.city) + '</h2>' +
        (l.published ? '<span class="badge badge--live">Visible</span>' : '<span class="badge">Hidden</span>') + '</summary>' +
        '<form class="record-body form" data-location-form><div class="form-grid">' +
          '<div class="field"><label for="lb-' + id + '">Label</label><input id="lb-' + id + '" name="label" required maxlength="80" value="' + esc(l.label) + '"></div>' +
          '<div class="field"><label for="ct-' + id + '">City</label><input id="ct-' + id + '" name="city" required maxlength="80" value="' + esc(l.city) + '"></div>' +
          '<div class="field span-2"><label for="ad-' + id + '">Address</label><textarea id="ad-' + id + '" name="address" required rows="4">' + esc(l.address) + '</textarea></div>' +
          '<div class="field"><label for="ph-' + id + '">Phones (one per line)</label><textarea id="ph-' + id + '" name="phones" rows="3">' + esc((l.phones || []).join('\n')) + '</textarea></div>' +
          '<div class="field"><label for="mo-' + id + '">Mobiles (one per line)</label><textarea id="mo-' + id + '" name="mobiles" rows="3">' + esc((l.mobiles || []).join('\n')) + '</textarea></div>' +
          '<div class="field"><label for="em-' + id + '">Emails (one per line)</label><textarea id="em-' + id + '" name="emails" rows="3">' + esc((l.emails || []).join('\n')) + '</textarea></div>' +
          '<div class="field"><label for="mp-' + id + '">Map link (https)</label><input id="mp-' + id + '" name="map_url" type="url" value="' + esc(l.map_url || '') + '"></div>' +
          '<div class="field"><label for="sl-' + id + '">Slug</label><input id="sl-' + id + '" name="slug" required value="' + esc(l.slug) + '"></div>' +
          '<div class="field"><label for="so-' + id + '">Sort order</label><input id="so-' + id + '" name="sort_order" type="number" value="' + (l.sort_order || 0) + '"></div>' +
          '<div class="field span-2"><div class="check"><input id="pu-' + id + '" name="published" type="checkbox"' + (l.published ? ' checked' : '') + '><label for="pu-' + id + '">Visible</label></div></div>' +
        '</div><div class="admin-actions mt-6"><button type="submit" class="btn btn--sm">Save office</button><button type="button" class="btn btn--sm btn--ghost" data-delete>Delete</button></div></form></details>';
    }

    async function load(openId) {
      var r = await SD.db.from('locations').select('*').order('sort_order');
      if (r.error) { A.toast(A.errorMessage(r.error), 'error'); return; }
      holder.innerHTML = (r.data || []).map(function (l) { l._open = l.id === openId; return record(l); }).join('') || '<p class="table-empty">No offices yet.</p>';
    }

    holder.addEventListener('submit', async function (e) {
      e.preventDefault();
      var f = e.target;
      var id = f.closest('[data-id]').dataset.id;
      var emails = lines(f.elements.emails.value);
      var bad = emails.filter(function (m) { return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m); });
      if (bad.length) { A.toast('Invalid email: ' + bad[0], 'error'); return; }
      var map = f.elements.map_url.value.trim();
      if (map && !/^https:\/\//.test(map)) { A.toast('Map link must start with https://', 'error'); return; }
      var patch = {
        label: f.elements.label.value.trim(), city: f.elements.city.value.trim(), address: f.elements.address.value.trim(),
        phones: lines(f.elements.phones.value), mobiles: lines(f.elements.mobiles.value), emails: emails,
        map_url: map || null, slug: U.slugify(f.elements.slug.value), sort_order: parseInt(f.elements.sort_order.value, 10) || 0,
        published: f.elements.published.checked
      };
      var btn = f.querySelector('[type="submit"]');
      A.setBusy(btn, true);
      var r = await SD.db.from('locations').update(patch).eq('id', id);
      A.setBusy(btn, false);
      if (r.error) { A.toast(A.errorMessage(r.error), 'error'); return; }
      A.toast('Office saved. Also update the static HTML if details changed (see README).');
    });

    holder.addEventListener('click', async function (e) {
      if (!e.target.closest('[data-delete]')) return;
      var id = e.target.closest('[data-id]').dataset.id;
      if (!(await A.confirm('Delete office?', 'This removes the office record from the database.', 'Delete'))) return;
      var d = await SD.db.from('locations').delete().eq('id', id);
      if (d.error) { A.toast(A.errorMessage(d.error), 'error'); return; }
      A.toast('Office deleted');
      load();
    });

    document.querySelector('[data-new-location]').addEventListener('click', async function () {
      var r = await SD.db.from('locations').insert({ slug: 'office-' + Date.now().toString(36), label: 'Office', city: 'City', address: '[CLIENT TO PROVIDE]', published: false, sort_order: 99 }).select().single();
      if (r.error) { A.toast(A.errorMessage(r.error), 'error'); return; }
      load(r.data.id);
    });

    load();
  }

  SD.admin.pages.locations = init;
})();
