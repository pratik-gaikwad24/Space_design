/* =====================================================================
   SPACE DESIGN — Portfolio listing
   Discipline tabs, search, compact project
   cards in a four-column grid (SD.ui.portfolioCard), incremental loading.
   ===================================================================== */
(function () {
  'use strict';
  var SD = window.SD || {};
  var U = SD.utils;

  var PAGE_SIZE = 12; // three full rows of four cards
  var DISCIPLINES = ['Redevelopment', 'Architecture', 'Layout Planning', 'Planning', 'Interior Design', 'Project Management'];

  var state = { all: [], filtered: [], cat: 'all', query: '', shown: 0, demo: false };
  var els = {};

  function ordered(values, preferred) {
    return values.sort(function (a, b) {
      var ia = preferred.indexOf(a), ib = preferred.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
    });
  }

  function filterBtn(group, value, label, count, pressed) {
    return '<button type="button" class="filter-btn filter-btn--' + group + '" aria-pressed="' + (pressed ? 'true' : 'false') + '"' +
      ' data-group="' + group + '" data-filter="' + U.esc(value) + '">' +
      U.esc(label) + '<sup aria-hidden="true">' + count + '</sup><span class="visually-hidden">, ' + count + ' projects</span></button>';
  }

  /* Discipline tabs, built only from values actually used. */
  function buildFilters() {
    var cat = {};
    state.all.forEach(function (p) { if (p.category) cat[p.category] = (cat[p.category] || 0) + 1; });
    els.filters.innerHTML = filterBtn('cat', 'all', 'All projects', state.all.length, true) +
      ordered(Object.keys(cat), DISCIPLINES).map(function (v) { return filterBtn('cat', U.slugify(v), v, cat[v], false); }).join('');
  }

  function matches(p) {
    if (state.cat !== 'all' && U.slugify(p.category || '') !== state.cat) return false;
    if (state.query) {
      var hay = [p.title, p.subtitle, p.location, p.category, p.project_type, p.status, p.client].filter(Boolean).join(' ').toLowerCase();
      return state.query.split(/\s+/).every(function (term) { return hay.indexOf(term) !== -1; });
    }
    return true;
  }

  /**
   * Show the next page. The whole visible list is re-laid-out so the grid
   * stays structured (a partial block is completed rather than left ragged);
   * cards that were already visible do not animate again.
   */
  function renderMore() {
    var before = state.shown;
    state.shown = Math.min(state.filtered.length, state.shown + PAGE_SIZE);
    els.grid.innerHTML = state.filtered.slice(0, state.shown).map(SD.ui.portfolioCard).join('');
    var cards = els.grid.querySelectorAll('.pf-card');
    for (var i = 0; i < before && i < cards.length; i++) cards[i].classList.add('is-in');
    els.more.hidden = state.shown >= state.filtered.length;
    SD.motion.reveal(els.grid);
    return cards[before] || null;
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
      els.count.textContent = 'Showing ' + n + ' of ' + state.all.length;
      els.status.textContent = n + (n === 1 ? ' project' : ' projects') + ' shown';
    };
    if (animate && !U.prefersReducedMotion()) {
      els.grid.classList.add('is-filtering');
      setTimeout(doRender, 260);
    } else doRender();
  }

  function syncUrl() {
    var params = new URLSearchParams(window.location.search);
    if (state.cat !== 'all') params.set('filter', state.cat); else params.delete('filter');
    params.delete('status');
    if (state.query) params.set('q', state.query); else params.delete('q');
    var qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''));
  }

  function setFilter(key, animate) {
    var exists = els.filters.querySelector('[data-filter="' + CSS.escape(key) + '"]');
    state.cat = exists ? key : 'all';
    els.filters.querySelectorAll('.filter-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-filter') === state.cat ? 'true' : 'false');
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
