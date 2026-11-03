/* ═══════════════════════════════════════════════════════════════════════
   ANTZ WIDGET STATES (widgets.html)
   Draws each widget with the shared renderers in widget-kit.js, once per state and size.
   A state is data plus flags handed to the renderer (and to the cell frame), never hand-made markup.
   To add a widget: add an entry to WIDGETS below with its sizes and states (see README.md).
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var KIT = window.ANTZ_KIT, CFG = window.ANTZ_CONFIG, DATA = window.ANTZ_DATA, esc = KIT.esc;
  var Q = new URLSearchParams(location.search);
  var EMBED = Q.get('embed') === '1';
  var SITE_KEY = 'antz-cat-site', THEME_KEY = 'antz-cat-theme';
  var site = Q.get('site') || (function () { try { return localStorage.getItem(SITE_KEY); } catch (e) { return null; } })() || 'all';
  var isPhone = function () { return window.matchMedia('(max-width: 640px)').matches; };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* ---------------- sample data for Notes (from config.js, scoped to the picked site) ---------------- */
  var ANIMALS = CFG.data.animals;
  function siteName(id) { if (id === 'all' || !DATA) return 'All sites'; var s = DATA.sites.filter(function (x) { return x.id === id; })[0]; return s ? s.name : 'All sites'; }
  function animalsHere() { var n = siteName(site), list = ANIMALS.filter(function (a) { return site === 'all' || a.site === n; }); return list.length ? list : ANIMALS; }
  function now(minsAgo) { var d = new Date(Date.now() - minsAgo * 60000); return 'Today ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function sampleNotes() {
    var an = animalsHere(), a0 = an[0], a1 = an[1] || an[0];
    var today = [
      { t: a0.n + ' ate well, about 2 kg', type: 'Feeding', animal: a0.n + ' · ' + a0.id, by: CFG.user.full, when: now(12) },
      { t: 'Slight limp on the left forelimb', type: 'Medical', animal: a1.n + ' · ' + a1.id, by: 'Emerson Vance', when: now(95) }
    ];
    return today.concat(CFG.data.notes.map(function (n) { return { t: n.t, type: n.type, animal: '', by: n.by, when: n.d }; }));
  }
  function base() {
    return { id: 'cat', interactive: true, notes: sampleNotes(), today: 2, draft: { text: '', type: 'Observation', animal: '' }, status: 'idle', pinned: false,
      animals: animalsHere().map(function (a) { return [a.id, a.n + ' · ' + a.id]; }) };
  }
  var LONG = 'Keeper report for the Big Cat House east enclosure: both cubs seen pacing along the moat edge after the 16:00 feed, appetite normal, no visible injuries, will recheck tomorrow morning';
  function many() { var out = [], types = KIT.notes.TYPES, an = animalsHere(); for (var i = 0; i < 42; i++) { var a = an[i % an.length]; out.push({ t: ['Weight recorded', 'Enclosure check', 'Behaviour change', 'Diet adjusted', 'Wound dressing changed'][i % 5] + ' ' + (i + 1), type: types[i % types.length], animal: a.n + ' · ' + a.id, by: i % 3 ? 'Kai Vance' : CFG.user.full, when: i < 6 ? now(10 + i * 37) : (30 - (i % 28)) + ' Oct' }); } return out; }
  var photo = (CFG.images || {})['PL-014'] || '';

  /* ---------------- the widgets and their states ----------------
     each state: key, name, note (when it happens), sizes, model(m) to change the data, and optional
     flags: editing (edit mode chrome), rm (force reduced motion), iframe (render in another theme) */
  var WIDGETS = [
    { key: 'notes', name: 'Notes', icon: 'edit_note', module: 'notes', sizes: ['S', 'M', 'L', 'XL'],
      intro: 'A shortcut for writing notes. Small is one big New note button. Medium adds a quick-capture field with note types and an animal link. Large adds the latest notes. Extra large (desktop) adds templates and photo or voice notes. The full composer opens as a sheet from every size.',
      states: [
        { key: 'default', name: 'Default', note: 'Notes exist and nothing is typed yet.', sizes: ['S', 'M', 'L', 'XL'] },
        { key: 'empty', name: 'Empty', note: 'No notes saved yet: a new user or a new site.', sizes: ['S', 'M', 'L'], model: function (m) { m.notes = []; m.today = 0; } },
        { key: 'focus', name: 'Typing', note: 'The field has focus and text; Enter or Save stores it.', sizes: ['M', 'L'], model: function (m) { m.status = 'focus'; m.draft.text = 'Zara ate well, about 2 kg'; m.draft.type = 'Feeding'; } },
        { key: 'error', name: 'Validation error', note: 'Save pressed with an empty field. The message is announced.', sizes: ['M', 'L'], model: function (m) { m.status = 'error'; } },
        { key: 'saving', name: 'Saving', note: 'Between Save and the reply, about a third of a second. Save is disabled.', sizes: ['M', 'L'], model: function (m) { m.status = 'saving'; m.draft.text = 'Moat water level low again'; } },
        { key: 'saved', name: 'Saved', note: 'Right after a save. Undo stays for 5 seconds, and a toast offers it too.', sizes: ['S', 'M', 'L'], model: function (m) { m.status = 'saved'; m.today = 3; } },
        { key: 'failed', name: 'Offline, save failed', note: 'No connection. The text stays in the field and Retry is offered.', sizes: ['S', 'M', 'L'], model: function (m) { m.status = 'failed'; m.draft.text = 'Gate panel north side loose'; } },
        { key: 'loading', name: 'Loading', note: 'First load, while notes are fetched. The shimmer stops with reduced motion.', sizes: ['S', 'M', 'L'], model: function (m) { m.status = 'loading'; } },
        { key: 'long', name: 'Long content', note: 'Long titles and drafts are cut with an ellipsis; nothing spills out.', sizes: ['M', 'L'], model: function (m) { m.draft.text = LONG; m.notes[0] = Object.assign({}, m.notes[0], { t: LONG }); m.notes[1] = Object.assign({}, m.notes[1], { t: LONG, animal: 'Roshan · PL-003, Big Cat House east' }); } },
        { key: 'many', name: 'Many notes', note: 'Only the newest fit; View all shows the total.', sizes: ['L', 'XL'], model: function (m) { m.notes = many(); m.today = 6; } },
        { key: 'photo', name: 'With a photo', note: 'A photo is attached to the draft, and saved notes show a thumbnail.', sizes: ['M', 'L'], model: function (m) { m.attached = 'zara-weigh-in.jpg'; m.notes[0] = Object.assign({}, m.notes[0], { photo: photo || true }); } },
        { key: 'edit', name: 'Edit mode', note: 'Edit on the dashboard: the card jiggles; remove (−), resize corner. ⋯ hides.', sizes: ['S', 'M'], editing: true },
        { key: 'pinned', name: 'Pinned', note: 'Notes is pinned to the sidebar; the pin shows beside the title.', sizes: ['S', 'M'], model: function (m) { m.pinned = true; } },
        { key: 'dark', name: 'Dark mode', note: 'The same widget in the dark theme (drawn in a frame so it sits beside the light ones).', sizes: ['M', 'L'], iframe: 'dark' },
        { key: 'reduced', name: 'Reduced motion', note: 'With reduced motion on: no jiggle in edit mode and no shimmer while loading.', sizes: ['S', 'M'], rm: true, editing: true, model: function (m, size) { if (size === 'S') m.status = 'loading'; } },
        { key: 'kbd', name: 'Keyboard focus', note: 'The focus ring a keyboard user sees on New note and Save.', sizes: ['S', 'M'], model: function (m, size) { m.focusDemo = size === 'S' ? 'new' : 'save'; m.draft.text = 'Fresh browse delivered'; } }
      ] },
    { key: 'today', name: 'Today', soon: true }, { key: 'actions', name: 'Quick actions', soon: true }, { key: 'kpi', name: 'KPI cards', soon: true },
    { key: 'hero', name: 'Animals overview', soon: true }, { key: 'activity', name: 'Recent activity', soon: true }, { key: 'trend', name: 'Trend chart', soon: true },
    { key: 'stats', name: 'Module stats (Diet, Tags…)', soon: true }, { key: 'item', name: 'Focus Hub items and stacks', soon: true }, { key: 'collections', name: 'Collections', soon: true },
    { key: 'announcements', name: 'Announcements', soon: true }, { key: 'communication', name: 'Communication', soon: true }, { key: 'focus', name: 'Focus Hub', soon: true },
    { key: 'help', name: 'Help Desk and Need help?', soon: true }, { key: 'team', name: 'On duty', soon: true }, { key: 'planning', name: 'Planning', soon: true }, { key: 'sites', name: 'Sites', soon: true }
  ];

  /* ---------------- drawing ---------------- */
  var COL = function () { return isPhone() ? Math.floor((Math.min(window.innerWidth, 640) - 32 - 12) / 2) : 184; };
  var GAP = function () { return isPhone() ? 12 : 16; };
  var ROW = function () { return isPhone() ? 80 : 78; };
  function specimen(w, st, size, idx) {
    var phone = isPhone(), sp = KIT.spans('main', phone)[size];
    if (!sp) return '<figure class="cat-spec cat-spec--na"><figcaption><b>' + KIT.SZ_NAME[size] + '</b><span>Desktop only. Phones show Large.</span></figcaption></figure>';
    var m = base(); m.id = w.key + '-' + st.key + '-' + size; if (st.model) st.model(m, size);
    var dims = sp[0] + '×' + sp[1];
    var cell = KIT.frame({ id: m.id, size: size, label: w.name + ' widget, ' + st.name, cls: ' wg--' + w.key, body: '<div class="wg__btn wg__body">' + KIT.notes.render(size, m) + '</div>' });
    var width = sp[0] * COL() + (sp[0] - 1) * GAP(), height = sp[1] * ROW() + (sp[1] - 1) * GAP();
    var stage = st.iframe
      ? '<iframe class="cat-frame" title="' + esc(w.name + ', ' + KIT.SZ_NAME[size] + ', ' + st.iframe + ' theme') + '" loading="lazy" style="width:' + (width + 24) + 'px;height:' + (height + 24) + 'px" src="widgets.html?embed=1&amp;w=' + w.key + '&amp;state=default&amp;size=' + size + '&amp;theme=' + st.iframe + '&amp;site=' + encodeURIComponent(site) + '&amp;col=' + COL() + '"></iframe>'
      : '<div class="cat-stage' + (st.editing ? ' editing' : '') + (st.rm ? ' rm-force' : '') + '"><div class="dz dz--main cat-grid" style="grid-template-columns:repeat(' + sp[0] + ', ' + COL() + 'px);grid-auto-rows:' + ROW() + 'px;gap:' + GAP() + 'px">' + cell + '</div></div>';
    return '<figure class="cat-spec"><figcaption><b>' + KIT.SZ_NAME[size] + '</b><span class="cat-dim">' + dims + '</span></figcaption>' + stage + '</figure>';
  }
  function section(w) {
    return '<section class="cat-sec" id="w-' + w.key + '" aria-labelledby="h-' + w.key + '"><div class="cat-sec__hd"><span class="cat-sec__ic">' + KIT.sym(w.icon) + '</span><div><h2 id="h-' + w.key + '">' + esc(w.name) + '</h2><p>' + esc(w.intro) + '</p></div></div>' +
      '<p class="cat-sizes">Sizes: ' + w.sizes.map(function (s) { var sp = KIT.spans('main', false)[s]; return KIT.SZ_NAME[s] + ' ' + sp[0] + '×' + sp[1]; }).join(', ') + ' (columns × rows of the dashboard main area).</p>' +
      w.states.map(function (st, i) {
        return '<article class="cat-state" id="w-' + w.key + '-' + st.key + '"><header><h3><span class="cat-n">' + (i + 1) + '</span>' + esc(st.name) + '</h3><p>' + esc(st.note) + '</p></header>' +
          '<div class="cat-specs">' + st.sizes.map(function (s) { return specimen(w, st, s, i); }).join('') + '</div></article>';
      }).join('') + '</section>';
  }
  function render() {
    var keep = window.scrollY;
    $('#catToc').innerHTML = WIDGETS.map(function (w) {
      return w.soon ? '<li><span class="cat-soon">' + esc(w.name) + '<small>Coming next</small></span></li>'
        : '<li><a href="#w-' + w.key + '">' + esc(w.name) + '</a><ol>' + w.states.map(function (st) { return '<li><a href="#w-' + w.key + '-' + st.key + '">' + esc(st.name) + '</a></li>'; }).join('') + '</ol></li>';
    }).join('');
    $('#catMain').innerHTML = WIDGETS.filter(function (w) { return !w.soon; }).map(section).join('') +
      '<section class="cat-sec cat-next"><h2>Coming next</h2><p>' + esc(WIDGETS.filter(function (w) { return w.soon; }).map(function (w) { return w.name; }).join(', ')) + '.</p></section>';
    KIT.notes.reveal($('#catMain'));
    window.scrollTo(0, keep);
  }
  function $(s) { return document.querySelector(s); }

  /* embed mode: one specimen only (used for the dark-theme frames) */
  if (EMBED) {
    document.body.className = 'cat cat--embed';
    document.body.innerHTML = '<main class="cat-embed"></main>';
    var w = WIDGETS.filter(function (x) { return x.key === Q.get('w'); })[0], st = w && w.states.filter(function (x) { return x.key === (Q.get('state') || 'default'); })[0];
    var size = Q.get('size') || 'M', col = +Q.get('col') || 184, sp = w && KIT.spans('main', false)[size];
    if (w && st && sp) {
      var m = base(); m.id = 'embed'; if (st.model) st.model(m, size);
      var gap = col < 184 ? 12 : 16, row = col < 184 ? 80 : 78;
      document.querySelector('.cat-embed').innerHTML = '<div class="dz dz--main cat-grid" style="grid-template-columns:repeat(' + sp[0] + ', ' + col + 'px);grid-auto-rows:' + row + 'px;gap:' + gap + 'px">' +
        KIT.frame({ id: m.id, size: size, label: w.name + ' widget', cls: ' wg--' + w.key, body: '<div class="wg__btn wg__body">' + KIT.notes.render(size, m) + '</div>' }) + '</div>';
      KIT.notes.reveal(document);
    }
    return;
  }

  /* controls: theme and site re-render everything */
  var theme = document.documentElement.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.querySelectorAll('#catTheme input').forEach(function (r) {
    r.checked = r.value === theme;
    r.addEventListener('change', function () { document.documentElement.setAttribute('data-theme', r.value); try { localStorage.setItem(THEME_KEY, r.value); } catch (e) { /* storage blocked */ } render(); });
  });
  var sel = $('#catSite');
  sel.innerHTML = '<option value="all">All sites</option>' + (DATA ? DATA.sites.map(function (s) { return '<option value="' + s.id + '">' + esc(s.name) + '</option>'; }).join('') : '');
  sel.value = site;
  sel.addEventListener('change', function () { site = sel.value; try { localStorage.setItem(SITE_KEY, site); } catch (e) { /* storage blocked */ } render(); });
  /* specimens are demos: their buttons and links do nothing here */
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.cat-stage') && e.target.closest('button, a')) e.preventDefault(); });
  var lastPhone = isPhone();
  window.addEventListener('resize', function () { if (isPhone() !== lastPhone) { lastPhone = isPhone(); render(); } });
  render();
})();
