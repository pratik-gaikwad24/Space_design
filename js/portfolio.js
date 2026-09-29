/* =====================================================================
   SPACE DESIGN — Portfolio listing
   Dynamic filters (only categories/types actually used), search,
   asymmetric editorial grid, incremental rendering.
   ===================================================================== */
(function () {
  'use strict';
  var SD = window.SD || {};
  var U = SD.utils;

  var PAGE_SIZE = 10;
  // 60/40 · 40/60 · full → 6+4, 4+6, 10 in a 10-col grid
  var PATTERN = ['l', 's', 's', 'l', 'full'];
  var PREFERRED_ORDER = ['Architecture', 'Interior Design', 'Planning', 'Project Management', 'Residential', 'Commercial', 'Institutional', 'Hospitality'];

  var state = { all: [], filtered: [], filter: 'all', query: '', shown: 0, demo: false };
  var els = {};

  function valuesOf(p) { return [p.category, p.project_type].filter(Boolean); }

  function buildFilters() {
    var counts = {};
    state.all.forEach(function (p) {
      valuesOf(p).forEach(function (v) { counts[v] = (counts[v] || 0) + 1; });
    });
    var used = Object.keys(counts).sort(function (a, b) {
      var ia = PREFERRED_ORDER.indexOf(a), ib = PREFERRED_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
    });
    var html = '<button type="button" class="filter-btn" aria-pressed="true" data-filter="all">All<sup aria-hidden="true">' + state.all.length + '</sup></button>';
    used.forEach(function (v) {
      html += '<button type="button" class="filter-btn" aria-pressed="false" data-filter="' + U.esc(U.slugify(v)) + '" data-value="' + U.esc(v) + '">' +
        U.esc(v) + '<sup aria-hidden="true">' + counts[v] + '</sup><span class="visually-hidden">, ' + counts[v] + ' projects</span></button>';
    });
    els.filters.innerHTML = html;
  }

  function matches(p) {
    if (state.filter !== 'all') {
      var ok = valuesOf(p).some(function (v) { return U.slugify(v) === state.filter; });
      if (!ok) return false;
    }
    if (state.query) {
      var hay = [p.title, p.subtitle, p.location, p.category, p.project_type].filter(Boolean).join(' ').toLowerCase();
      return state.query.split(/\s+/).every(function (term) { return hay.indexOf(term) !== -1; });
    }
    return true;
  }

  function cardHtml(p, i) {
    var v = PATTERN[i % PATTERN.length];
    var last = i === state.filtered.length - 1;
    // a lone card at the start of a pair spans the full row
    if (last && (i % PATTERN.length === 0 || i % PATTERN.length === 2)) v = 'full';
    return SD.ui.projectCard(p, i, v, '');
  }

  function renderMore() {
    var next = state.filtered.slice(state.shown, state.shown + PAGE_SIZE);
    var start = state.shown;
    var tmp = document.createElement('div');
    tmp.innerHTML = next.map(function (p, k) { return cardHtml(p, start + k); }).join('');
    var firstNew = tmp.firstElementChild;
    while (tmp.firstChild) els.grid.appendChild(tmp.firstChild);
    state.shown += next.length;
    els.more.hidden = state.shown >= state.filtered.length;
    SD.motion.reveal(els.grid);
    return firstNew;
  }

  function render(animate) {
    state.filtered = state.all.filter(matches);
    var doRender = function () {
      els.grid.innerHTML = '';
      state.shown = 0;
      if (!state.filtered.length) {
        els.grid.innerHTML = state.all.length
          ? '<div class="empty-state"><h2 class="h-md">No projects match.</h2><p>Try a different filter or search term.</p><button type="button" class="btn btn--ghost btn--sm" data-reset>Show all projects</button></div>'
          : '<div class="empty-state"><p class="label label--blue mb-0">Portfolio</p><h2 class="h-md">Selected projects are being curated.</h2><p>Project photography and details will be published here soon.</p><a class="link-arrow" href="contact.html">Start a conversation <span class="btn-arrow" aria-hidden="true">→</span></a></div>';
        els.more.hidden = true;
      } else {
        renderMore();
      }
      els.grid.classList.remove('is-filtering');
      var n = state.filtered.length;
      els.count.textContent = U.pad(n) + ' / ' + U.pad(state.all.length);
      els.status.textContent = n + (n === 1 ? ' project' : ' projects') + ' shown';
    };
    if (animate && !U.prefersReducedMotion()) {
      els.grid.classList.add('is-filtering');
      setTimeout(doRender, 260);
    } else doRender();
  }

  function syncUrl() {
    var params = new URLSearchParams(window.location.search);
    if (state.filter !== 'all') params.set('filter', state.filter); else params.delete('filter');
    if (state.query) params.set('q', state.query); else params.delete('q');
    var qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''));
  }

  function setFilter(key, animate) {
    var exists = els.filters.querySelector('[data-filter="' + CSS.escape(key) + '"]');
    state.filter = exists ? key : 'all';
    els.filters.querySelectorAll('.filter-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-filter') === state.filter ? 'true' : 'false');
    });
    render(animate);
    syncUrl();
  }

  async function init() {
    els.grid = document.querySelector('[data-portfolio-grid]');
    if (!els.grid) return;
    els.filters = document.querySelector('[data-filters]');
    els.search = document.querySelector('[data-search]');
    els.more = document.querySelector('[data-load-more]');
    els.count = document.querySelector('[data-count]');
    els.status = document.querySelector('[data-status]');

    var res = await SD.api.listProjects({});
    els.grid.setAttribute('aria-busy', 'false');
    if (res.error) {
      els.grid.innerHTML = '<div class="empty-state"><h2 class="h-md">Projects could not be loaded.</h2><p>Please refresh the page in a moment.</p></div>';
      return;
    }
    state.all = res.data || [];
    state.demo = !!res.demo;
    if (state.demo) {
      var b = document.querySelector('[data-demo-banner]');
      if (b) { b.innerHTML = SD.ui.demoBanner(); b.hidden = false; }
    }
    var total = document.querySelector('[data-project-total]');
    if (total && state.all.length) total.textContent = U.pad(state.all.length) + ' projects';

    buildFilters();

    state.query = (U.param('q') || '').toLowerCase().slice(0, 80).trim();
    if (state.query) els.search.value = state.query;
    setFilter(U.param('filter') || 'all', false);

    els.filters.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-btn');
      if (btn) setFilter(btn.getAttribute('data-filter'), true);
    });
    els.search.addEventListener('input', U.debounce(function () {
      state.query = els.search.value.toLowerCase().trim();
      render(true);
      syncUrl();
    }, 220));
    els.more.addEventListener('click', function () {
      var first = renderMore();
      // Move focus to the first newly loaded project for keyboard users.
      var link = first && first.querySelector('a');
      if (link) link.focus({ preventScroll: false });
    });
    els.grid.addEventListener('click', function (e) {
      if (e.target.closest('[data-reset]')) { els.search.value = ''; state.query = ''; setFilter('all', true); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
