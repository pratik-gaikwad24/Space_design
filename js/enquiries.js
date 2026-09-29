/* =====================================================================
   SPACE DESIGN — Admin enquiries
   Read, mark status, reply by email, export CSV, delete, and apply the
   retention period (data minimisation / DPDP storage limitation).
   ===================================================================== */
(function () {
  'use strict';
  var SD = window.SD;
  var U = SD.utils;
  var esc = U.esc;

  async function init() {
    var A = SD.admin;
    var tbody = document.querySelector('[data-enq-body]');
    var seg = document.querySelector('[data-enq-filter]');
    var search = document.querySelector('[data-enq-search]');
    var retentionNote = document.querySelector('[data-retention-note]');
    var purgeBtn = document.querySelector('[data-purge]');
    var rows = [], filter = 'active', retentionDays = 365;

    var s = await SD.db.from('site_settings').select('value').eq('key', 'enquiry_retention_days').maybeSingle();
    if (s.data && parseInt(s.data.value, 10)) retentionDays = parseInt(s.data.value, 10);

    async function load() {
      var r = await SD.db.from('contact_submissions').select('*').order('created_at', { ascending: false }).limit(1000);
      if (r.error) { A.toast(A.errorMessage(r.error), 'error'); return; }
      rows = r.data || [];
      var cutoff = Date.now() - retentionDays * 864e5;
      var old = rows.filter(function (x) { return new Date(x.created_at).getTime() < cutoff; });
      retentionNote.textContent = 'Retention period: ' + retentionDays + ' days. ' + (old.length ? old.length + ' enquiries are older than this and should be deleted.' : 'No enquiries are past the retention period.');
      purgeBtn.hidden = !old.length;
      render();
    }

    function render() {
      var q = (search.value || '').toLowerCase().trim();
      var list = rows.filter(function (r) {
        if (filter === 'active' && r.status === 'archived') return false;
        if (filter !== 'active' && filter !== 'all' && r.status !== filter) return false;
        return !q || [r.name, r.email, r.phone, r.location, r.project_type, r.message].join(' ').toLowerCase().indexOf(q) > -1;
      });
      if (!list.length) { tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No enquiries in this view.</td></tr>'; return; }
      tbody.innerHTML = list.map(function (r) {
        var subject = encodeURIComponent('Re: your enquiry to Space Design');
        return '<tr class="enq-row" id="' + esc(r.id) + '" data-id="' + esc(r.id) + '" data-status="' + esc(r.status) + '">' +
          '<td class="title-cell"><strong>' + esc(r.name) + '</strong>' +
            '<span class="sub"><a class="text-link" href="mailto:' + esc(r.email) + '?subject=' + subject + '">' + esc(r.email) + '</a> · <a class="text-link" href="tel:' + esc(r.phone.replace(/[^\d+]/g, '')) + '">' + esc(r.phone) + '</a></span>' +
            '<details class="enq-details"><summary>Message</summary><p class="enq-msg">' + esc(r.message) + '</p>' +
            '<p class="sub">Consent: ' + (r.consent ? 'given' : 'not recorded') + (r.consent_text ? ' (“' + esc(r.consent_text) + '”)' : '') + '</p></details></td>' +
          '<td>' + esc(r.project_type || '—') + '<span class="sub">' + esc(r.location || '') + '</span></td>' +
          '<td>' + esc(U.formatDateTime(r.created_at)) + '</td>' +
          '<td>' + A.statusBadge(r.status) + '</td>' +
          '<td><div class="row-actions">' +
            '<label class="visually-hidden" for="st-' + esc(r.id) + '">Status for ' + esc(r.name) + '</label>' +
            '<select class="btn-xs" id="st-' + esc(r.id) + '" data-status-select>' + ['new', 'read', 'replied', 'archived'].map(function (s2) {
              return '<option value="' + s2 + '"' + (s2 === r.status ? ' selected' : '') + '>' + s2 + '</option>';
            }).join('') + '</select>' +
            '<a class="btn-xs btn-xs--blue" href="mailto:' + esc(r.email) + '?subject=' + subject + '">Reply</a>' +
            '<button type="button" class="btn-xs btn-xs--danger" data-del>Delete</button>' +
          '</div></td></tr>';
      }).join('');
    }

    tbody.addEventListener('toggle', async function (e) {
      // Opening a new enquiry's message marks it as read.
      var d = e.target;
      if (!d.open || !d.classList || !d.classList.contains('enq-details')) return;
      var tr = d.closest('tr');
      var r = rows.filter(function (x) { return x.id === tr.dataset.id; })[0];
      if (r && r.status === 'new') {
        var u = await SD.db.from('contact_submissions').update({ status: 'read' }).eq('id', r.id);
        if (!u.error) { r.status = 'read'; tr.dataset.status = 'read'; tr.querySelector('[data-status-select]').value = 'read'; tr.children[3].innerHTML = A.statusBadge('read'); }
      }
    }, true);

    tbody.addEventListener('change', async function (e) {
      var sel = e.target.closest('[data-status-select]');
      if (!sel) return;
      var id = sel.closest('tr').dataset.id;
      var u = await SD.db.from('contact_submissions').update({ status: sel.value }).eq('id', id);
      if (u.error) { A.toast(A.errorMessage(u.error), 'error'); return; }
      rows.forEach(function (r) { if (r.id === id) r.status = sel.value; });
      A.toast('Status updated');
      render();
    });

    tbody.addEventListener('click', async function (e) {
      var b = e.target.closest('[data-del]');
      if (!b) return;
      var id = b.closest('tr').dataset.id;
      if (!(await A.confirm('Delete enquiry?', 'This permanently deletes the enquiry and its personal data.', 'Delete'))) return;
      var d = await SD.db.from('contact_submissions').delete().eq('id', id);
      if (d.error) { A.toast(A.errorMessage(d.error), 'error'); return; }
      rows = rows.filter(function (r) { return r.id !== id; });
      A.toast('Enquiry deleted');
      render();
    });

    purgeBtn.addEventListener('click', async function () {
      var cutoff = new Date(Date.now() - retentionDays * 864e5).toISOString();
      if (!(await A.confirm('Delete old enquiries?', 'All enquiries received before ' + U.formatDateTime(cutoff) + ' will be permanently deleted.', 'Delete old enquiries'))) return;
      var d = await SD.db.from('contact_submissions').delete().lt('created_at', cutoff);
      if (d.error) { A.toast(A.errorMessage(d.error), 'error'); return; }
      A.toast('Old enquiries deleted');
      load();
    });

    document.querySelector('[data-export]').addEventListener('click', function () {
      var cols = ['created_at', 'status', 'name', 'email', 'phone', 'project_type', 'location', 'message', 'consent'];
      var csvCell = function (v) {
        var s2 = v == null ? '' : String(v);
        if (/^[=+\-@\t\r]/.test(s2)) s2 = "'" + s2; // neutralise spreadsheet formula injection
        return '"' + s2.replace(/"/g, '""') + '"';
      };
      var csv = [cols.join(',')].concat(rows.map(function (r) { return cols.map(function (c) { return csvCell(r[c]); }).join(','); })).join('\r\n');
      var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'space-design-enquiries-' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      A.toast('CSV exported. Store it securely and delete it when no longer needed.');
    });

    seg.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      filter = b.dataset.filter;
      seg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      render();
    });
    search.addEventListener('input', U.debounce(render, 150));
    await load();
    if (window.location.hash) {
      var row = document.getElementById(window.location.hash.slice(1));
      if (row) { var det = row.querySelector('details'); if (det) det.open = true; row.scrollIntoView(); }
    }
  }

  SD.admin.pages.enquiries = init;
})();
