/* ═══════════════════════════════════════════════════════════════════════
   ANTZ HOME · APP
   Everything that moves: sidebar + pins, the Command Centre dashboard (the only home page), edit mode
   with drag-to-resize, widget stacks, widget gallery, App Library sheet, search,
   Notification Center, launching apps, and the six built app screens.
   All content comes from window.ANTZ_CONFIG (config.js).
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var CFG = window.ANTZ_CONFIG;

  /* ================= HELPERS ================= */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var ui = $('#ui');
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  /* short UI icon names → Material Symbols; any other name is used as-is */
  var SYM = { note: 'sticky_note_2', paw: 'pets', mega: 'campaign', star: 'bookmarks', help: 'support_agent', pin: 'push_pin', heart: 'favorite', bell: 'notifications', plus: 'add', back: 'chevron_left', right: 'chevron_right', left: 'chevron_left', x: 'close', more: 'more_horiz', clip: 'attach_file', down: 'expand_more', warn: 'warning', scan: 'qr_code_scanner', grid: 'widgets' };
  var icon = function (n, cls) { return '<span class="material-symbols-outlined ico ' + (cls == null ? 'ico--sm' : cls) + '" aria-hidden="true">' + (SYM[n] || n) + '</span>'; };
  var initials = function (n) { return n.split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); };
  var isMobile = function () { return window.innerWidth <= 640; };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function store(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked: keep working in memory */ } }
  function recall(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }

  /* ================= DATA (from config.js) ================= */
  var APPS = CFG.modules.map(function (m) { return Object.assign({ bw: m.badgeLabel || '', core: !!m.widget }, m); });
  var app = function (id) { return APPS.filter(function (a) { return a.id === id; })[0]; };
  var D = CFG.data;
  var NOTES = D.notes, NOTE_COLLS = D.noteCollections, NOTE_TYPES = D.noteTypes;
  var SPECIES = D.species.map(function (a, i) { return { i: i, n: a[0], s: a[1], c: a[2], a: a[3], sites: a[4], iucn: a[5] }; });
  var CLASSES = D.speciesClasses, ANIMALS = D.animals, ANN = D.announcements, CHATS = D.chats, TICKETS = D.tickets, FOLDERS = D.folders;
  var NOTIFS = CFG.notifications.map(function (g) { return { app: g.module, items: g.items.slice() }; });
  var DATA = window.ANTZ_DATA || null;   /* data.js: seeded sample data per site */
  function animalsFor(sp) {
    if (sp.i === 0) return ANIMALS;
    if (DATA && DATA.animalsBySpecies[sp.i]) return DATA.animalsBySpecies[sp.i];
    var code = initials(sp.n);
    return ANIMALS.map(function (a, k) { return Object.assign({}, a, { n: sp.n.split(' ').pop() + ' ' + String(k + 1).padStart(2, '0'), id: code + '-' + String(k * 7 + 3).padStart(3, '0') }); });
  }

  /* likes & bookmarks: one shared store that feeds Focus Hub */
  var SAVE = {};
  function reg(k, meta) { if (!SAVE[k]) SAVE[k] = Object.assign({ liked: false, bm: false, folder: '' }, meta); return SAVE[k]; }
  function regAnimal(si, ai) { var sp = SPECIES[si], a = animalsFor(sp)[ai]; return reg('an:' + si + ':' + ai, { type: 'Animal', t: a.n + ' · ' + a.id, sub: sp.n, go: { app: 'collections', level: 'animal', species: si, animal: ai } }); }
  SPECIES.forEach(function (s) { reg('sp:' + s.i, { type: 'Species', t: s.n, sub: s.s, go: { app: 'collections', level: 'species', species: s.i } }); });
  NOTES.forEach(function (n, i) { reg('nt:' + i, { type: 'Note', t: n.t, sub: n.coll + ' · ' + n.d, go: { app: 'notes' } }); });
  ANN.forEach(function (a, i) { reg('ac:' + i, { type: 'Announcement', t: a.t, sub: a.by + ' · ' + a.d, go: { app: 'announcements', ann: i } }); });
  D.saved.forEach(function (x) {
    var p = x.key.split(':');
    var item = p[0] === 'an' ? regAnimal(+p[1], +p[2]) : SAVE[x.key];
    if (item) Object.assign(item, { liked: !!x.liked, bm: !!x.bm, folder: x.folder || '' });
  });
  function counts() { var l = 0, b = 0, a = 0; Object.keys(SAVE).forEach(function (k) { var s = SAVE[k]; if (s.liked) l++; if (s.bm) b++; if (s.liked || s.bm) a++; }); return { liked: l, bm: b, all: a }; }

  /* ================= HOME STATE ================= */
  /* layout v4: one home page, the Command Centre dashboard (main area + right column).
     A v3 layout (several pages) is migrated once: its page 1 is kept, pages 2+ are dropped. */
  var PIN_KEY = 'antz-pins', LAYOUT_KEY = 'antz-layout-v4', OLD_LAYOUT_KEY = 'antz-layout-v3', SITE_KEY = 'antz-site', HINT_KEY = 'antz-site-hint', SIDE_KEY = 'antz-side';
  var MAX_PINS = CFG.home.maxPins || 10;
  /* pins live in the sidebar; config.home.pins (older configs: home.dock); a saved antz-pins list wins */
  var pinned = (recall(PIN_KEY) || CFG.home.pins || CFG.home.dock || []).filter(app).slice(0, MAX_PINS);
  function savePins() { store(PIN_KEY, pinned); }
  /* ---- saved items as widgets: a ref in config ({ type: 'animal', id: 'PL-014' }) → a Focus Hub key ('an:0:0') ---- */
  function refKey(ref) {
    if (!ref) return null;
    if (typeof ref === 'string') return ref;
    var byName = function (list, field) { return typeof ref.id === 'number' ? ref.id : list.map(function (x) { return x[field]; }).indexOf(ref.id); };
    if (ref.type === 'species') return 'sp:' + byName(SPECIES, 'n');
    if (ref.type === 'note') return 'nt:' + byName(NOTES, 't');
    if (ref.type === 'announcement') return 'ac:' + byName(ANN, 't');
    if (ref.type === 'animal') {
      for (var si = 0; si < SPECIES.length; si++) {
        var ai = animalsFor(SPECIES[si]).map(function (a) { return a.id; }).indexOf(ref.id);
        if (ai > -1) return 'an:' + si + ':' + ai;
      }
    }
    return null;
  }
  /* the Focus Hub record for a key (animals are registered on first use) */
  function itemMeta(key) {
    if (!key) return null;
    var p = key.split(':');
    if (p[0] === 'an' && SPECIES[+p[1]] && animalsFor(SPECIES[+p[1]])[+p[2]]) regAnimal(+p[1], +p[2]);
    return SAVE[key] || null;
  }
  /* stack entries are a module id ('medical') or a saved item ({ type: 'item', ref: 'an:0:0' }) */
  function entryType(e) { return typeof e === 'string' ? e : 'item'; }
  function entryName(e) { if (typeof e === 'string') return app(e).name; var m = itemMeta(e.ref); return m ? m.t : 'Saved item'; }
  function normaliseEntry(e) { return typeof e === 'string' ? e : { type: 'item', ref: refKey(e.ref) }; }

  /* ---- Command Centre widget types. Each one is a normal widget: edit mode, drag, resize,
     remove / add back from the gallery, ⋯ menu, keyboard moves, Undo, saved layout. def = default size;
     open = the module its title or "View all" opens. Renderers live in WIDGETS (search "COMMAND CENTRE WIDGETS"). ---- */
  var DASHW = {
    hero: { name: 'Animals overview', def: 'W', open: 'animals', desc: 'Total animals for the site, the change on last week and quick actions.' },
    kpi: { name: 'KPI card', def: 'S', desc: 'One key number with its change on last week.' },
    trend: { name: 'Trend chart', def: 'XL', desc: '12-week trend with metric and period filters.' },
    action: { name: 'Quick action', def: 'S', desc: 'A module shortcut with its pending count.' },
    activity: { name: 'Recent activity', def: 'XL', open: 'reports', desc: 'The latest records across modules, with status.' },
    planning: { name: 'Planning', def: 'L', open: 'administer', desc: 'Progress towards this week’s targets.' },
    attention: { name: 'Needs attention', def: 'L', open: 'administer', desc: 'Overdue and pending work, by module.' },
    sites: { name: 'Sites', def: 'L', desc: 'Every site with its animals and audit score. Pick one to re-scope the dashboard.' },
    team: { name: 'On duty', def: 'M', open: 'users', desc: 'Who is working today.' },
    helpcard: { name: 'Need help?', def: 'S', open: 'help', desc: 'A shortcut to the Help Desk.' }
  };
  /* quick-action cards: module, pale tint from the module colour, count from data.js for the active site */
  var ACTIONS = {
    vacc: { module: 'administer', title: 'Pending vaccinations', icon: 'vaccines', n: function (m) { return m.vacc.pending; }, d: function (m) { return fmt(m.vacc.overdue) + ' overdue, the rest due this week'; } },
    deworm: { module: 'administer', title: 'Pending deworming', icon: 'medication', n: function (m) { return m.deworm.pending; }, d: function (m) { return fmt(m.deworm.overdue) + ' overdue, the rest due this week'; } },
    approvals: { module: 'approvals', title: 'Approvals', icon: 'task_alt', n: function (m) { return m.pending.approvals; }, d: function () { return 'transfer requests waiting'; } },
    help: { module: 'help', title: 'Help Desk', icon: 'support_agent', n: function () { return TICKETS.filter(function (t) { return t[4] === 'Open'; }).length; }, d: function () { return 'open tickets. Raise a new one.'; } },
    lab: { module: 'lab', title: 'Lab results', icon: 'biotech', n: function (m) { return m.pending.lab; }, d: function (m) { return fmt(m.lab.flagged) + ' flagged for review'; } },
    necropsy: { module: 'necropsy', title: 'Necropsy reports', icon: 'labs', n: function (m) { return m.pending.necropsy; }, d: function (m) { return fmt(m.necropsy.drafts) + ' in draft'; } }
  };
  /* trend chart metrics (12 weekly points from data.js) */
  var TRENDS = {
    health: { label: 'Health cases', key: 'treatment', unit: 'animals in treatment', module: 'medical' },
    mortality: { label: 'Mortality', key: 'mortality', unit: 'deaths', module: 'mortality' },
    births: { label: 'New animals', key: 'newAnimals', unit: 'new animals', module: 'animals' },
    overdue: { label: 'Overdue tasks', key: 'overdue', unit: 'overdue tasks', module: 'administer' },
    audit: { label: 'Audit score', key: 'audit', unit: '% audit score', module: 'audit' }
  };
  function dashName(it) {
    if (it.type === 'kpi') { var kk = DATA && DATA.kpi(it.metric, S.site); return kk ? kk.label : 'KPI'; }
    if (it.type === 'action') return ACTIONS[it.preset] ? ACTIONS[it.preset].title : 'Quick action';
    if (it.type === 'trend') return (TRENDS[it.metric] || TRENDS.health).label + ' trend';
    return DASHW[it.type].name;
  }
  function dashOpen(it) {
    if (it.type === 'kpi') { var kk = DATA && DATA.kpi(it.metric, S.site); return kk ? kk.module : 'focus'; }
    if (it.type === 'action') return ACTIONS[it.preset] ? ACTIONS[it.preset].module : 'focus';
    if (it.type === 'trend') return (TRENDS[it.metric] || TRENDS.health).module;
    return DASHW[it.type].open || 'collections';
  }

  /* config.home.layout → internal widgets { id, type, size, zone? }. Older configs: home.pages
     (a list of pages) uses its first page; { app: 'id' } icons are skipped (there is no springboard). */
  function configLayout() {
    var l = CFG.home.layout || CFG.home.pages || [];
    return Array.isArray(l[0]) ? l[0] : l;
  }
  function layoutFromConfig() {
    return configLayout().filter(function (x) { return x && !x.app; }).map(function (x, i) {
      var id = x.id || 'c' + i, w;
      if (x.stack) w = { id: id, type: 'stack', name: x.stack, size: x.size || 'M', items: x.items.map(normaliseEntry), idx: 0 };
      else if (x.widget === 'item') w = { id: id, type: 'item', ref: refKey(x.ref), size: x.size || 'M' };
      else {
        w = { id: id, type: x.widget, size: x.size || (DASHW[x.widget] ? DASHW[x.widget].def : 'M') };
        if (x.metric) w.metric = x.metric;
        if (x.period) w.period = x.period;
        if (x.preset) w.preset = x.preset;
      }
      if (x.zone === 'side') w.zone = 'side';
      return w;
    }).filter(validItem);
  }
  /* a saved layout (order, sizes, added widgets) wins over config */
  function validItem(x) {
    if (!x || !x.id || !x.type || x.k === 'a') return false;
    if (x.type === 'stack') return Array.isArray(x.items) && x.items.length > 0;
    if (x.type === 'item') return !!itemMeta(x.ref);
    if (x.type === 'kpi') return !!(DATA && DATA.kpi(x.metric, 'all'));
    if (x.type === 'action') return !!ACTIONS[x.preset];
    if (DASHW[x.type]) return !!DATA;
    return !!app(x.type);
  }
  function loadLayout() {
    var saved = recall(LAYOUT_KEY), items = saved && Array.isArray(saved.items) ? saved.items : null;
    if (!items) { var old = recall(OLD_LAYOUT_KEY); if (old && Array.isArray(old.pages) && Array.isArray(old.pages[0])) items = old.pages[0]; }
    items = (items || []).filter(validItem).map(function (x) { delete x.k; if (x.zone !== 'side') delete x.zone; return x; });
    return items.length ? items : layoutFromConfig();
  }
  var LAYOUT = loadLayout();
  function saveLayout() { store(LAYOUT_KEY, { v: 4, items: LAYOUT }); try { localStorage.removeItem(OLD_LAYOUT_KEY); } catch (e) { /* storage blocked */ } savePins(); }
  function snapshot() { return JSON.stringify({ items: LAYOUT, pinned: pinned }); }
  function restore(snap) { var o = JSON.parse(snap); LAYOUT = o.items; pinned = o.pinned; saveLayout(); renderHome(); }
  var uidN = 0;
  function newId() { return 'w' + Date.now().toString(36) + (uidN++); }
  var S = { pendingStack: '', stackW: '', editing: false, app: null, level: 'module', species: 0, animal: 0, ann: 0, chat: 0,
    noteColl: NOTE_COLLS[0], noteTypes: [], noteQ: '', noteSort: 'Newest first', spClass: 'All', spQ: '', spSort: 'count', anSex: 'All', anQ: '',
    focusTab: 'all', focusType: 'All', folder: FOLDERS[0], annFilter: 'All', chatFilter: 'all', status: '',
    overlay: null, drawer: false, smartRotate: true, suggestions: true, nExpanded: {}, site: 'all' };

  /* keeps the browser tab title in step with what is on screen */
  function updateTitle() { document.title = (S.app ? app(S.app).name + ' · ' : '') + 'ANTZ'; }

  /* ================= THEME (light / dark / system) =================
     The <head> script applies the saved theme before paint; this keeps the toggle, menu and meta in sync. */
  var THEME_KEY = 'antz-theme';
  var darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function themeChoice() { var t = recallRaw(THEME_KEY); return (t === 'light' || t === 'dark' || t === 'system') ? t : (CFG.theme || 'system'); }
  function recallRaw(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function isDark() { var t = themeChoice(); return t === 'dark' || (t === 'system' && !!(darkQuery && darkQuery.matches)); }
  function applyTheme(t, announceIt) {
    try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* storage blocked: still switch for this visit */ }
    if (t === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
    syncThemeUI();
    if (announceIt) toast(t === 'system' ? 'Appearance follows your device (' + (isDark() ? 'dark' : 'light') + ' now)' : (t === 'dark' ? 'Dark mode on' : 'Light mode on'));
  }
  function syncThemeUI() {
    var dark = isDark(), btn = $('#themeBtn');
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    btn.querySelector('.material-symbols-outlined').textContent = dark ? 'light_mode' : 'dark_mode';
    var meta = $('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', dark ? '#0D1A20' : '#F2FBF8');
  }
  if (darkQuery) {
    var onOsTheme = function () { if (themeChoice() === 'system') syncThemeUI(); };
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', onOsTheme); else darkQuery.addListener(onOsTheme);
  }

  /* fixed header: greeting + avatar from config */
  function renderHeader() {
    var u = CFG.user;
    $('#avatarBtn').innerHTML = imgSrc('avatar:' + u.initials) ? '<img src="' + esc(imgSrc('avatar:' + u.initials)) + '" alt="" width="44" height="44" onerror="this.remove()">' + esc(u.initials) : esc(u.initials);
    $('#avatarBtn').setAttribute('aria-label', 'Profile: ' + u.full);
    $('#helloName').textContent = 'Hello ' + u.first;
    $('#helloDate').textContent = u.date;
    renderSitePill();
  }
  function renderSitePill() {
    $('#siteLabel').textContent = siteName(S.site);
    $('#sitePill').setAttribute('aria-label', 'Site: ' + siteName(S.site) + '. Change site');
  }
  function openSiteMenu() {
    if (!DATA) return;
    closeOverlay(true); opener = $('#sitePill'); S.overlay = 'site';
    dismissSiteHint();
    $('#sitePill').setAttribute('aria-expanded', 'true');
    root.innerHTML = '<div class="scrim" data-act="closeOverlay"></div><div class="site-menu" role="dialog" aria-modal="true" aria-labelledby="siteMenuH">' +
      '<div class="site-menu__hd"><h2 id="siteMenuH">Choose a site</h2><button type="button" class="icon-btn" data-act="closeOverlay" aria-label="Close">' + icon('close', '') + '</button></div>' +
      '<label class="search"><span class="material-symbols-outlined ico ico--sm" aria-hidden="true">search</span><span class="vh">Search sites</span><input type="search" id="siteQ" placeholder="Search ' + DATA.sites.length + ' sites" autocomplete="off"></label>' +
      '<div class="site-list" id="siteList" role="radiogroup" aria-labelledby="siteMenuH"></div><p class="site-menu__note">Sample data. All sites is the total of the ' + DATA.sites.length + ' sites.</p></div>';
    renderSiteList('');
    var m = $('.site-menu', root), r = $('#sitePill').getBoundingClientRect();
    if (!isMobile()) { m.style.left = Math.min(Math.max(8, r.left), window.innerWidth - m.offsetWidth - 8) + 'px'; m.style.top = (r.bottom + 8) + 'px'; }
    $('#siteQ').addEventListener('input', function (e) { renderSiteList(e.target.value); });
    var cur = $('#siteList [aria-checked="true"]') || $('#siteList [role="radio"]'); if (cur) cur.focus();
    syncInert();
  }
  function renderSiteList(q) {
    q = (q || '').toLowerCase();
    var opts = [{ id: 'all', name: 'All sites', animals: DATA.all.animals, sub: DATA.sites.length + ' sites' }].concat(DATA.sites.map(function (x) { return { id: x.id, name: x.name, animals: x.animals, sub: fmt(x.species) + ' species' }; }));
    var list = opts.filter(function (o) { return !q || o.name.toLowerCase().indexOf(q) > -1; });
    $('#siteList').innerHTML = list.length ? list.map(function (o) {
      var on = o.id === S.site;
      return '<button type="button" role="radio" class="site-opt" aria-checked="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-site="' + o.id + '">' +
        '<span class="material-symbols-outlined site-opt__ic" aria-hidden="true">' + (o.id === 'all' ? 'apartment' : 'location_on') + '</span><span class="site-opt__txt"><b>' + esc(o.name) + '</b><small>' + esc(o.sub) + '</small></span>' +
        '<span class="site-opt__n">' + fmt(o.animals) + '<small> animals</small></span><span class="material-symbols-outlined site-opt__ck" aria-hidden="true">' + (on ? 'check' : '') + '</span></button>';
    }).join('') : '<p class="muted site-menu__empty">No site matches “' + esc(q) + '”.</p>';
    if (list.length && !$('#siteList [tabindex="0"]')) $('#siteList [role="radio"]').tabIndex = 0;
  }
  function setSite(id) {
    if (!DATA) return;
    S.site = id; try { localStorage.setItem(SITE_KEY, id); } catch (e) { /* storage blocked */ }
    closeOverlay();
    renderSitePill(); renderHome();
    if (S.app && !SCREENS[S.app]) openApp(S.app);
    toast('Showing ' + siteName(id));
  }
  function showSiteHint() {
    if (recallRaw(HINT_KEY) || $('#siteCoach')) return;
    $('#sitePill').classList.add('is-hint');
    $('#sitePill').insertAdjacentHTML('afterend', '<div class="coach" id="siteCoach" role="note"><span>Switch site here to re-scope every number.</span><button type="button" class="coach__x" data-act="hintDismiss" aria-label="Dismiss tip">' + icon('close', '') + '</button></div>');
    var pill = $('#sitePill'), c = $('#siteCoach');
    c.style.left = Math.min(pill.offsetLeft, window.innerWidth - c.offsetWidth - 8) + 'px'; c.style.top = (pill.offsetTop + pill.offsetHeight + 10) + 'px';
  }
  function dismissSiteHint() {
    try { localStorage.setItem(HINT_KEY, '1'); } catch (e) { /* ignore */ }
    $('#sitePill').classList.remove('is-hint');
    var c = $('#siteCoach'); if (c) c.remove();
  }

  function isPinned(id) { return pinned.indexOf(id) > -1; }
  function findItem(wid) { for (var i = 0; i < LAYOUT.length; i++) if (LAYOUT[i].id === wid) return { i: i, it: LAYOUT[i] }; return null; }
  function stacks() { return LAYOUT.filter(function (x) { return x.type === 'stack'; }); }

  /* ================= RENDER: icons, widgets ================= */
  function glyph(a) { return '<span class="material-symbols-outlined" aria-hidden="true">' + a.icon + '</span>'; }
  /* tile colour comes from the module's config entry; 'dark' glyph = navy icon for pale colours */
  function tileStyle(a, extra) { return 'style="--f:' + a.colour + (a.glyph === 'dark' ? ';--glyph:var(--s1-navy)' : '') + (extra ? ';' + extra : '') + '"'; }
  function appIc(a, withBadge) {
    return '<span class="app__ic" ' + tileStyle(a) + '>' + glyph(a) + (withBadge && a.badge ? '<span class="badge" aria-hidden="true">' + a.badge + '</span>' : '') + '</span>';
  }
  function hd(type) { var a = app(type); return '<span class="wg__hd"><span class="gl" ' + tileStyle(a) + '>' + glyph(a) + '</span><span class="ell">' + esc(a.name) + '</span></span>'; }
  /* ================= IMAGES =================
     config.images maps a key (species name, animal ID, 'collectionsHero', 'announcement:<i>', 'avatar:<initials>')
     to a file in assets/img/. No entry = grey placeholder, so a missing file is never requested. */
  function imgSrc(key) { return (CFG.images || {})[key] || ''; }
  function media(key, alt, cls, extra) {
    var src = imgSrc(key);
    return '<span class="ph media' + (cls ? ' ' + cls : '') + '"' + (extra ? ' style="' + extra + '"' : '') + (src ? '' : ' aria-hidden="true"') + '>' +
      (src ? '<img src="' + esc(src) + '" alt="' + esc(alt || '') + '" loading="lazy" decoding="async" width="800" height="600" onerror="this.remove()">' : '') + '</span>';
  }

  /* ================= SITE SCOPE ================= */
  function siteName(id) { return !DATA || id === 'all' ? 'All sites' : DATA.site(id).name; }
  function siteMetrics() { return DATA ? DATA.site(S.site) : null; }
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }

  /* ================= CHARTS =================
     Hand-rolled SVG/HTML, one renderer per type (pick with module.chart in config).
     Colours are the --viz-* tokens in styles.css (validated with the dataviz palette checker
     for light and dark). Every chart has an aria-label summary; marks carry data-tip for the
     hover tooltip, and focusing a widget shows its summary. */
  function niceMax(v) { if (v <= 0) return 1; var p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p; var steps = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]; for (var i = 0; i < steps.length; i++) if (n <= steps[i]) return steps[i] * p; return 10 * p; }
  function chartWrap(kind, summary, inner) { return '<span class="cx cx--' + kind + '" role="img" aria-label="' + esc(summary) + '">' + inner + '</span>'; }
  function tip(t) { return ' data-tip="' + esc(t) + '"'; }
  var CHARTS = {
    line: function (c) { return lineArea(c, false); },
    area: function (c) { return lineArea(c, true); },
    columns: function (c) {
      var bars = c.bars || [], mx = niceMax(Math.max.apply(null, bars.map(function (b) { return b[1]; }).concat([1])));
      var hi = Math.max.apply(null, bars.map(function (b) { return b[1]; }));
      var cols = bars.map(function (b) { return '<span class="cx__col' + (b[1] === hi ? ' is-hi' : '') + '" style="height:' + Math.max(2, b[1] / mx * 100).toFixed(1) + '%"' + tip(b[0] + ': ' + fmt(b[1]) + (c.unit ? ' ' + c.unit : '')) + '></span>'; }).join('');
      var summary = c.cap + '. ' + bars.map(function (b) { return b[0] + ' ' + fmt(b[1]); }).join(', ');
      return chartWrap('columns', summary, axisY(mx, 0) + '<span class="cx__plot"><span class="cx__grid"></span><span class="cx__bars">' + cols + '</span></span>' + axisX(bars[0] && bars[0][0], bars.length && bars[bars.length - 1][0]));
    },
    stackedBar: function (c) {
      var totals = c.rows.map(function (r) { return r[0] + r[1] + r[2]; }), mx = niceMax(Math.max.apply(null, totals));
      var cols = c.rows.map(function (r, i) {
        return '<span class="cx__stack" style="height:' + (totals[i] / mx * 100).toFixed(1) + '%">' + r.map(function (v, k) {
          return v ? '<span class="cx__seg s' + (k + 1) + '" style="flex:' + v + '"' + tip(c.cats[i] + ', ' + c.keys[k] + ': ' + fmt(v)) + '></span>' : '';
        }).join('') + '</span>';
      }).join('');
      var leg = '<span class="cx__leg">' + c.keys.map(function (k, i) { return '<span><i class="sw s' + (i + 1) + '"></i>' + esc(k) + '</span>'; }).join('') + '</span>';
      var labels = '<span class="cx__cats">' + c.cats.map(function (k) { return '<span title="' + esc(k) + '">' + esc(k.length > 6 ? k.slice(0, 3) : k) + '</span>'; }).join('') + '</span>';
      var summary = c.cap + '. ' + c.cats.map(function (k, i) { return k + ': ' + c.keys.map(function (n, j) { return n + ' ' + fmt(c.rows[i][j]); }).join(', '); }).join('; ');
      return chartWrap('stacked', summary, leg + axisY(mx, 0) + '<span class="cx__plot"><span class="cx__grid"></span><span class="cx__bars">' + cols + '</span></span>' + labels);
    },
    donut: function (c, size) {
      var total = c.slices.reduce(function (a, x) { return a + x[1]; }, 0) || 1, r = 15.9155, C = 100, off = 0, gap = c.slices.length > 1 ? 1.2 : 0;
      var arcs = c.slices.map(function (x, i) {
        var len = Math.max(0, x[1] / total * C - gap);
        var el = '<circle class="cx__arc s' + (i + 1) + '" cx="21" cy="21" r="' + r + '" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (25 - off).toFixed(2) + '"' + tip(x[0] + ': ' + fmt(x[1]) + ' (' + Math.round(x[1] / total * 100) + '%)') + '/>';
        off += x[1] / total * C; return el;
      }).join('');
      var leg = size === 'S' ? '' : '<span class="cx__dleg">' + c.slices.map(function (x, i) { return '<span><i class="sw s' + (i + 1) + '"></i><span class="ell">' + esc(x[0]) + '</span><b>' + fmt(x[1]) + '</b></span>'; }).join('') + '</span>';
      var summary = c.cap + '. ' + c.slices.map(function (x) { return x[0] + ' ' + fmt(x[1]); }).join(', ');
      return chartWrap('donut', summary, '<span class="cx__ring"><svg viewBox="0 0 42 42" aria-hidden="true"><circle class="cx__track" cx="21" cy="21" r="' + r + '"/>' + arcs + '</svg><span class="cx__center"><b>' + esc(c.center) + '</b></span></span>' + leg);
    },
    hbar: function (c, size) {
      var rows = size === 'L' ? c.bars : c.bars.slice(0, size === 'S' ? 3 : 5);
      var mx = c.max || niceMax(Math.max.apply(null, c.bars.map(function (b) { return b[1]; })));
      var html = rows.map(function (b) {
        var warn = c.warnBelow != null && b[1] < c.warnBelow;
        return '<span class="cx__hrow"' + tip(b[0] + ': ' + fmt(b[1]) + (c.unit || '')) + '><span class="cx__hlbl ell">' + esc(b[0]) + '</span><span class="cx__hbar"><i style="width:' + Math.max(1, b[1] / mx * 100).toFixed(1) + '%"></i></span><span class="cx__hval">' + (warn ? '<span class="material-symbols-outlined cx__warn" aria-hidden="true">warning</span>' : '') + fmt(b[1]) + (c.unit === '%' ? '%' : '') + '</span></span>';
      }).join('');
      var summary = c.cap + '. ' + c.bars.map(function (b) { return b[0] + ' ' + fmt(b[1]) + (c.unit || ''); }).join(', ') + (c.warnBelow != null ? '. Below ' + c.warnBelow + ' is flagged.' : '');
      return chartWrap('hbar', summary, html);
    },
    gauge: function (c) {
      var v = Math.max(0, Math.min(100, c.value)), L = 125.66, len = v / 100 * L / 2 * 2;
      var arc = 'M6,42 A36,36 0 0 1 78,42';
      return chartWrap('gauge', c.cap + ': ' + v + (c.unit || '') + ' of ' + (c.target || 100),
        '<span class="cx__gauge"><svg viewBox="0 0 84 46" aria-hidden="true"><path class="cx__track" d="' + arc + '" pathLength="100"/><path class="cx__gval" d="' + arc + '" pathLength="100" stroke-dasharray="' + v + ' 100"' + tip(c.cap + ': ' + v + (c.unit || '')) + '/></svg>' +
        '<span class="cx__gnum"><b>' + v + (c.unit || '') + '</b></span></span><span class="cx__gcap">' + esc(c.cap) + '</span>');
    },
    heatmap: function (c) {
      var vals = c.cells.slice(-c.weeks.length * 7), sorted = vals.slice().sort(function (a, b) { return a - b; });
      var q = function (v) { var r = sorted.indexOf(v) / (sorted.length - 1); return r < 0.25 ? 1 : r < 0.5 ? 2 : r < 0.75 ? 3 : 4; };
      var cells = '';
      for (var d = 0; d < 7; d++) for (var w = 0; w < c.weeks.length; w++) { var v = vals[w * 7 + d]; cells += '<span class="cx__cell q' + q(v) + '"' + tip(c.days[d] + ', week of ' + c.weeks[w] + ': ' + fmt(v) + ' ' + (c.unit || '')) + '></span>'; }
      var days = '<span class="cx__days"><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span><span>Sun</span></span>';
      var leg = '<span class="cx__hleg"><span>Fewer</span><i class="q1"></i><i class="q2"></i><i class="q3"></i><i class="q4"></i><span>More</span></span>';
      var mn = sorted[0], mx = sorted[sorted.length - 1];
      return chartWrap('heat', c.cap + '. Between ' + fmt(mn) + ' and ' + fmt(mx) + ' ' + (c.unit || '') + ' a day; weekends are lower.', days + '<span class="cx__heat" style="grid-template-columns:repeat(' + c.weeks.length + ',1fr)">' + cells + '</span>' + leg);
    },
    spark: function (c) {
      var d = c.series, n = d.length, mx = Math.max.apply(null, d), mn = Math.min.apply(null, d), span = (mx - mn) || 1;
      var pts = d.map(function (v, i) { return (i / (n - 1) * 100).toFixed(2) + ',' + (92 - (v - mn) / span * 84).toFixed(2); }).join(' ');
      var lastY = 92 - (d[n - 1] - mn) / span * 84;
      return '<span class="cx cx--spark" aria-hidden="true"' + tip('12 weeks: ' + fmt(d[0]) + ' to ' + fmt(d[n - 1])) + '><svg viewBox="0 0 100 100" preserveAspectRatio="none"><polygon class="cx__fill" points="0,100 ' + pts + ' 100,100"/><polyline class="cx__line" points="' + pts + '" vector-effect="non-scaling-stroke"/></svg><i class="cx__dot" style="left:100%;top:' + lastY.toFixed(1) + '%"></i></span>';
    }
  };
  function axisY(top, bottom) { return '<span class="cx__yax" aria-hidden="true"><span>' + fmt(top) + '</span><span>' + fmt(bottom) + '</span></span>'; }
  function axisX(a, b) { return '<span class="cx__xax" aria-hidden="true"><span>' + esc(a || '') + '</span><span>' + esc(b || '') + '</span></span>'; }
  function lineArea(c, fill) {
    var d = c.series, n = d.length, mx = niceMax(Math.max.apply(null, d)), mn = 0;
    var X = function (i) { return i / (n - 1) * 100; }, Y = function (v) { return 100 - (v - mn) / (mx - mn) * 100; };
    var pts = d.map(function (v, i) { return X(i).toFixed(2) + ',' + Y(v).toFixed(2); }).join(' ');
    var hits = d.map(function (v, i) { var w = 100 / (n - 1); return '<rect x="' + Math.max(0, X(i) - w / 2).toFixed(2) + '" y="0" width="' + w.toFixed(2) + '" height="100" fill="transparent"' + tip(c.labels[i] + ': ' + fmt(v) + ' ' + (c.unit || '')) + '/>'; }).join('');
    var svg = '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' + (fill ? '<polygon class="cx__fill" points="0,100 ' + pts + ' 100,100"/>' : '') +
      '<polyline class="cx__line" points="' + pts + '" vector-effect="non-scaling-stroke"/>' + hits + '</svg>';
    var dot = '<i class="cx__dot" style="left:100%;top:' + Y(d[n - 1]).toFixed(1) + '%"></i>';
    var dl = d[n - 1] - d[n - 2];
    var summary = c.cap + '. ' + c.labels[0] + ' ' + fmt(d[0]) + ', latest ' + c.labels[n - 1] + ' ' + fmt(d[n - 1]) + ' (' + (dl >= 0 ? 'up ' : 'down ') + fmt(Math.abs(dl)) + ' on the week).';
    return chartWrap(fill ? 'area' : 'line', summary, axisY(mx, 0) + '<span class="cx__plot"><span class="cx__grid"></span>' + svg + dot + '</span>' + axisX(c.labels[0], c.labels[n - 1]));
  }
  /* old-style config stats ({ type, d, cap }) → chart spec */
  function legacyChart(c, type) {
    if (!c || !c.d) return c;
    if (type === 'donut') return { cap: c.cap, slices: [['Done', c.d[0]], ['Remaining', 100 - c.d[0]]], center: c.d[0] + '%' };
    if (type === 'gauge') return { cap: c.cap, value: c.d[0], unit: '%' };
    if (type === 'line' || type === 'area') return { cap: c.cap, series: c.d, labels: c.d.map(function (_, i) { return 'Point ' + (i + 1); }) };
    return { cap: c.cap, bars: c.d.map(function (v, i) { return ['Item ' + (i + 1), v]; }) };
  }
  function chartFor(a, c, size) {
    var type = a.chart || (c && c.type === 'donut' ? 'donut' : c && c.type === 'line' ? 'line' : 'columns');
    var spec = legacyChart(c, type);
    return spec ? (CHARTS[type] || CHARTS.columns)(spec, size) : '';
  }

  function kgrid(list) { return '<span class="kgrid">' + list.map(function (x) { return '<span><b>' + esc(x[0]) + '</b><small>' + esc(x[1]) + '</small></span>'; }).join('') + '</span>'; }
  /* stats widget: numbers for the selected site from data.js, falling back to module.stats in config */
  function statsBody(id, size) {
    var a = app(id), s = (DATA && DATA.moduleStats(id, S.site)) || a.stats;
    if (!s) return hd(id) + '<small>No stats configured</small>';
    var type = a.chart;
    if (size === 'S') {
      if (type === 'donut' || type === 'gauge') return hd(id) + chartFor(a, s.c, 'S') + (s.t ? '<span class="wg__lbl">' + esc(s.t) + '</span>' : '');
      var spark = s.c && s.c.series ? CHARTS.spark({ series: s.c.series }) : '';
      return hd(id) + '<span class="wg__big">' + esc(s.k[0]) + '</span><span class="wg__lbl">' + esc(s.k[1]) + '</span>' + (spark || (s.t ? '<span class="trend">' + esc(s.t) + '</span>' : ''));
    }
    if (size === 'M') return hd(id) + kgrid(s.m.slice(0, 3)) + chartFor(a, s.c, 'M');
    return hd(id) + kgrid(s.m.slice(0, 3)) + '<span class="chart-cap">' + esc(s.c.cap) + '</span>' + chartFor(a, s.c, 'L') +
      '<span class="wlist">' + s.l.slice(0, 3).map(function (x) { return '<span><span>' + esc(x[0]) + '</span><b>' + esc(x[1]) + '</b></span>'; }).join('') + '</span>';
  }
  /* ---- widget renderers: one per widget type, each returns the inner HTML for a size (S / M / L).
     A module uses WIDGETS[module.widget], or WIDGETS.stats (driven by module.stats) by default. ---- */
  var WIDGETS = {
    announcements: function (type, size) {
      var a0 = ANN[0];
      if (size === 'S') return hd(type) + '<span><span class="tag">Announcement</span></span><b class="wg__t">' + esc(a0.t) + '</b><small>' + esc(a0.by) + '</small>';
      if (size === 'M') return hd(type) + '<span class="wg__row">' + media('announcement:0', a0.t, '', 'width:40%') + '<span class="wg__col"><span><span class="tag">Announcement</span></span><b class="wg__t">' + esc(a0.t) + '</b><small>' + esc(a0.by + ' · ' + a0.d) + '</small></span></span>';
      return hd(type) + media('announcement:0', a0.t, '', 'height:42%;flex:none') + '<span><span class="tag">Announcement</span></span><b class="wg__t">' + esc(a0.t) + '</b><span><span class="bar b100"></span><span class="bar b80"></span></span><small>' + esc(a0.by + ' · ' + a0.d) + ' · 2 unread</small>';
    },
    focus: function (type, size) {
      var c = counts();
      var duo = '<span class="wg__duo"><span><span class="wg__big">' + c.liked + '</span><small>Liked</small></span><span><span class="wg__big">' + c.bm + '</span><small>Bookmarked</small></span></span>';
      if (size === 'S') return hd(type) + '<span class="wg__big">' + c.liked + '</span><span class="wg__lbl">liked</span><span class="trend">' + c.bm + ' bookmarked</span>';
      var saved = Object.keys(SAVE).filter(function (k) { return SAVE[k].liked || SAVE[k].bm; }).slice(0, 4);
      if (size === 'M') return hd(type) + duo + '<span class="wg__thumbs"><span class="ph"></span><span class="ph"></span><span class="ph"></span><span class="ph"></span><small style="align-self:center">Recently saved</small></span>';
      return hd(type) + duo + '<small>Recently saved</small><span class="wg__list">' + saved.map(function (k) { return '<span><span class="ph" style="width:28px;height:28px"></span><span class="ell">' + esc(SAVE[k].t) + '</span></span>'; }).join('') + '</span>';
    },
    notes: function (type, size) {
      var n = function (k) { return NOTES.slice(0, k).map(function (x) { return '<span class="mini-note" data-tone="' + x.type + '"><b>' + esc(x.t) + '</b><small>' + esc(x.type + ' · ' + x.d) + '</small></span>'; }).join(''); };
      if (size === 'S') return hd(type) + '<span class="wg__big">7</span><small>notes · 3 new this week</small><b class="wg__t">' + esc(NOTES[0].t) + '</b>';
      if (size === 'M') return hd(type) + '<span class="wg__row"><span class="wg__col" style="flex:0 0 32%"><span class="wg__big">7</span><small>notes in 4 collections</small></span><span class="wg__col">' + n(2) + '</span></span>';
      return hd(type) + '<small>4 collections · 7 notes</small><span class="wg__col">' + n(4) + '</span>';
    },
    collections: function (type, size) {
      var m = siteMetrics(), sp = m ? fmt(m.species) : '2,411', an = m ? fmt(m.animals) : '110,020';
      var nw = DATA ? DATA.moduleStats('animals', S.site).k[0] : '643';
      if (size === 'S') return hd(type) + '<span class="wg__big">' + sp + '</span><small>species</small><span class="wg__big wg__big--sm">' + an + '</span><small>animals</small>';
      var stats = kgrid([[sp, 'Species'], [an, 'Animals'], [nw, 'New, 4 weeks']]);
      if (size === 'M') return hd(type) + '<span class="wg__row">' + media('collectionsHero', 'Animals in the collection', 'wg__hero', 'width:38%') + '<span class="wg__col">' + stats + '<small>' + esc(siteName(S.site)) + '</small></span></span>';
      return hd(type) + media('collectionsHero', 'Animals in the collection', 'wg__hero', 'height:42%;flex:none') + stats + '<small>Recently viewed</small><span class="wg__list"><span>Persian Leopard</span><span>African Wild Dog</span><span>Asiatic Lion</span></span>';
    },
    communication: function (type, size) {
      var rows = function (k) { return '<span class="wg__list">' + CHATS.slice(0, k).map(function (ch) { return '<span><span class="av" style="width:24px;height:24px;font-size:9px">' + initials(ch.n) + '</span><span class="ell"><b>' + esc(ch.n.split(' ')[0]) + ':</b> ' + esc(ch.last) + '</span></span>'; }).join('') + '</span>'; };
      if (size === 'S') return hd(type) + '<span class="wg__big">3</span><small>unread</small><span class="ell" style="font-size:13px"><b>Kai:</b> ' + esc(CHATS[0].last) + '</span>';
      if (size === 'M') return hd(type) + '<small>3 unread</small>' + rows(2);
      return hd(type) + '<small>3 unread</small>' + rows(5);
    },
    help: function (type, size) {
      var tk = function (k) { return '<span class="wg__list">' + TICKETS.slice(0, k).map(function (t) { return '<span><span class="tag' + (t[4] === 'Open' ? ' tag--warn' : t[4] === 'Resolved' ? ' tag--ok' : ' tag--alert') + '">' + t[4] + '</span><span class="ell">' + esc(t[1]) + '</span></span>'; }).join('') + '</span>'; };
      if (size === 'S') return hd(type) + '<span class="wg__big">2</span><small>open tickets</small><span class="ell" style="font-size:13px">' + esc(TICKETS[0][1]) + '</span>';
      if (size === 'M') return hd(type) + '<small>2 open · 1 in progress</small>' + tk(2);
      return hd(type) + '<small>2 open · 1 in progress</small>' + tk(5) + '<span class="tag">+ Raise a ticket</span>';
    },
    stats: statsBody,
    /* Needs attention: overdue then pending work; each row opens its module */
    attention: function (type, size) {
      if (!DATA) return '';
      size = size === 'XL' ? 'L' : size === 'W' ? 'M' : size;
      var at = DATA.attention(S.site);
      var row = function (r, kind) { var a = app(r[2]); return '<button type="button" class="att__row" data-open="' + r[2] + '"><span class="gl" ' + tileStyle(a) + '>' + glyph(a) + '</span><span class="att__lbl"><b class="ell">' + esc(r[0]) + '</b><small>' + esc(a.name) + '</small></span><span class="att__n att__n--' + kind + '">' + fmt(r[1]) + '</span></button>'; };
      var head = '<span class="wg__hd"><span class="gl" style="--f:var(--md-sys-color-tertiary)"><span class="material-symbols-outlined" aria-hidden="true">priority_high</span></span><span class="ell">Needs attention</span></span>';
      if (size === 'S') return head + '<span class="wg__big">' + fmt(at.total) + '</span><span class="wg__lbl">overdue tasks</span>' + row(at.overdue[0], 'over');
      var list = '<span class="att__grp">Overdue <b>' + fmt(at.total) + '</b></span>' + at.overdue.slice(0, size === 'M' ? 3 : 5).map(function (r) { return row(r, 'over'); }).join('');
      if (size !== 'M') list += '<span class="att__grp">Pending</span>' + at.pending.slice(0, 4).map(function (r) { return row(r, 'pend'); }).join('');
      return head + '<span class="att">' + list + '</span>';
    }
  };
  /* ================= COMMAND CENTRE WIDGETS =================
     Every renderer takes (type, size, it) and draws from data.js for the active site (S.site).
     size is the size shown here: S, M, L, W (wide) or XL. */
  function panelHd(title, open, openLabel, act) {
    return '<span class="wg__hd ph-hd"><span class="ph-hd__t">' + esc(title) + '</span>' + (open || act
      ? '<button type="button" class="ph-hd__all" ' + (act ? 'data-act="' + act + '"' : 'data-open="' + open + '"') + '>View all<span class="vh"> ' + esc(openLabel || '') + '</span><span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span></button>' : '') + '</span>';
  }
  function deltaChip(value, text, good, srExtra) {
    var dir = value > 0 ? 'arrow_upward' : value < 0 ? 'arrow_downward' : 'remove', tone = good === null ? 'flat' : good ? 'good' : 'bad';
    return '<span class="kpi__d kpi__d--' + tone + '"><span class="material-symbols-outlined" aria-hidden="true">' + dir + '</span>' + esc(text) +
      '<span class="vh"> ' + (srExtra || 'vs last week') + ', ' + (tone === 'good' ? 'better' : tone === 'bad' ? 'worse' : 'no change') + '</span></span>';
  }
  WIDGETS.hero = function (type, size) {
    var m = siteMetrics(); if (!m) return '';
    var k = DATA.kpi('animals', S.site);
    var bg = imgSrc('dashHero') ? '<span class="hero__bg" aria-hidden="true"><img src="' + esc(imgSrc('dashHero')) + '" alt="" loading="lazy" decoding="async" onerror="this.remove()"></span>' : '';
    var main = '<button type="button" class="hero__main" data-open="animals"><span class="hero__lbl">Total animals · ' + esc(siteName(S.site)) + '</span>' +
      '<span class="hero__v">' + fmt(m.animals) + '</span>' + deltaChip(k.delta.value, k.deltaText + ' vs last week', k.good, '') +
      (size === 'S' ? '' : '<span class="hero__sub">' + fmt(m.species) + ' species · ' + fmt(m.enclosures) + ' enclosures</span>') + '<span class="vh">, open Animals</span></button>';
    var acts = [['Add animal', 'add', 'animals'], ['Record treatment', 'medical_services', 'medical'], ['Log feed', 'restaurant', 'diet'], ['Scan tag', 'qr_code_scanner', '']];
    var qa = size === 'S' ? '' : '<span class="hero__acts" role="group" aria-label="Quick actions">' + acts.map(function (x) {
      return '<button type="button" class="hero__act" ' + (x[2] ? 'data-open="' + x[2] + '"' : 'data-act="heroScan"') + '><span class="hero__ai"><span class="material-symbols-outlined" aria-hidden="true">' + x[1] + '</span></span><span class="hero__al">' + x[0] + '</span></button>';
    }).join('') + '</span>';
    return bg + main + qa;
  };
  /* KPI card: icon chip, label, value, change chip (arrow + text, never colour alone); sparkline from Medium up */
  WIDGETS.kpi = function (type, size, it) {
    var k = DATA && DATA.kpi(it.metric, S.site); if (!k) return '';
    var a = app(k.module);
    return '<span class="kpi__top"><span class="kpi__ic" ' + tileStyle(a) + '>' + glyph(a) + '</span></span><span class="kpi__l">' + esc(k.label) + '</span>' +
      '<span class="kpi__row"><span class="kpi__v">' + esc(k.value) + '</span>' + deltaChip(k.delta.value, k.deltaText, k.good) + '</span>' +
      (size === 'S' ? '' : CHARTS.spark({ series: k.series }));
  };
  function smoothPath(p) {
    if (p.length < 2) return '';
    var d = 'M' + p[0][0].toFixed(1) + ',' + p[0][1].toFixed(1);
    for (var i = 0; i < p.length - 1; i++) {
      var p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      var c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6, c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ' C' + c1x.toFixed(1) + ',' + c1y.toFixed(1) + ' ' + c2x.toFixed(1) + ',' + c2y.toFixed(1) + ' ' + p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
    }
    return d;
  }
  /* main trend: smooth area line with metric + period filters; hover, or focus and use ← →, to read any week */
  WIDGETS.trend = function (type, size, it) {
    var tm = TRENDS[it.metric] || TRENDS.health, per = +it.period || 12, m = siteMetrics(); if (!m) return '';
    var ser = m.series[tm.key].slice(-per), labels = DATA.weeks.slice(-per), id = it.id || 'prev';
    var max = niceMax(Math.max.apply(null, ser)), W = 600, H = 200;
    var pts = ser.map(function (v, i) { return [i * W / (ser.length - 1), H - v / max * H]; });
    var line = smoothPath(pts), area = line + ' L' + W + ',' + H + ' L0,' + H + ' Z';
    var peak = ser.indexOf(Math.max.apply(null, ser)), first = ser[0], last = ser[ser.length - 1];
    var summary = tm.label + ', last ' + per + ' weeks: from ' + fmt(first) + ' to ' + fmt(last) + ', peak ' + fmt(ser[peak]) + ' in the week of ' + labels[peak] + '.';
    var sel = size === 'S' ? '' : '<span class="tr__f"><label class="vh" for="trM-' + id + '">Metric</label><select id="trM-' + id + '" class="tr__sel" data-trend="' + id + '" data-k="metric">' +
      Object.keys(TRENDS).map(function (k) { return '<option value="' + k + '"' + (k === (it.metric || 'health') ? ' selected' : '') + '>' + TRENDS[k].label + '</option>'; }).join('') + '</select>' +
      '<label class="vh" for="trP-' + id + '">Period</label><select id="trP-' + id + '" class="tr__sel" data-trend="' + id + '" data-k="period">' +
      [12, 8, 4].map(function (n) { return '<option value="' + n + '"' + (n === per ? ' selected' : '') + '>' + n + ' weeks</option>'; }).join('') + '</select></span>';
    var head = '<span class="wg__hd tr__hd"><button type="button" class="tr__title" data-open="' + tm.module + '">' + esc(tm.label) + '<span class="vh">, open ' + esc(app(tm.module).name) + '</span></button>' + sel + '</span>';
    var x = function (i) { return (i / (ser.length - 1) * 100).toFixed(2) + '%'; }, y = function (i) { return (100 - ser[i] / max * 100).toFixed(2) + '%'; };
    var tipTxt = function (i) { return labels[i] + ': ' + fmt(ser[i]) + ' ' + tm.unit; };
    var xl = labels.map(function (l, i) { return (ser.length <= 8 || (i % 2 === 0 && i !== ser.length - 2) || i === ser.length - 1) ? '<span' + (i % 4 === 0 || i === ser.length - 1 ? ' class="k"' : '') + ' style="left:' + x(i) + '">' + esc(l) + '</span>' : ''; }).join('');
    return head + '<span class="tr__chart"><span class="tr__y" aria-hidden="true"><span>' + fmt(max) + '</span><span>' + fmt(max / 2) + '</span><span>0</span></span>' +
      '<span class="tr__plot" tabindex="0" role="slider" aria-label="' + esc(tm.label) + ' by week. Use left and right arrow keys" aria-valuemin="1" aria-valuemax="' + ser.length + '" aria-valuenow="' + (peak + 1) + '" aria-valuetext="' + esc(tipTxt(peak)) + '"' +
        ' data-vals="' + ser.join(',') + '" data-labels="' + esc(labels.join('|')) + '" data-unit="' + esc(tm.unit) + '" data-max="' + max + '">' +
        '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="trG-' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--viz-1);stop-opacity:.3"/><stop offset="1" style="stop-color:var(--viz-1);stop-opacity:0"/></linearGradient></defs>' +
        '<path class="tr__grid" d="M0,0 H' + W + ' M0,' + H / 2 + ' H' + W + '"/><path d="' + area + '" fill="url(#trG-' + id + ')"/><path class="tr__line" d="' + line + '"/></svg>' +
        '<span class="tr__guide" aria-hidden="true" style="left:' + x(peak) + '"></span><span class="tr__dot" aria-hidden="true" style="left:' + x(peak) + ';top:' + y(peak) + '"></span>' +
        '<span class="tr__tip" aria-hidden="true" style="left:' + x(peak) + ';top:' + y(peak) + '">' + esc(tipTxt(peak)) + '</span></span>' +
      '<span class="tr__x" aria-hidden="true">' + xl + '</span></span><span class="vh">' + esc(summary) + '</span>';
  };
  function setTrendIdx(plot, i) {
    var vals = plot.dataset.vals.split(',').map(Number), labels = plot.dataset.labels.split('|'), max = +plot.dataset.max;
    i = Math.max(0, Math.min(vals.length - 1, i));
    var x = (i / (vals.length - 1) * 100) + '%', y = (100 - vals[i] / max * 100) + '%', txt = labels[i] + ': ' + fmt(vals[i]) + ' ' + plot.dataset.unit;
    $('.tr__dot', plot).style.left = x; $('.tr__dot', plot).style.top = y; $('.tr__guide', plot).style.left = x;
    var tip = $('.tr__tip', plot); tip.style.left = x; tip.style.top = y; tip.textContent = txt;
    tip.classList.toggle('is-left', i > vals.length * 0.75); tip.classList.toggle('is-right', i < vals.length * 0.2);
    plot.setAttribute('aria-valuenow', i + 1); plot.setAttribute('aria-valuetext', txt);
  }
  WIDGETS.action = function (type, size, it) {
    var ac = ACTIONS[it.preset], m = siteMetrics(); if (!ac || !m) return '';
    var a = app(ac.module);
    return '<span class="qa__ic" ' + tileStyle(a) + '><span class="material-symbols-outlined" aria-hidden="true">' + ac.icon + '</span></span>' +
      '<span class="qa__t">' + esc(ac.title) + '</span><span class="qa__n">' + fmt(ac.n(m)) + '</span><span class="qa__d">' + esc(ac.d(m)) + '</span>' +
      '<span class="qa__go material-symbols-outlined" aria-hidden="true">arrow_forward</span>';
  };
  /* status pills use the ANTZ status fills with black text, plus the word itself */
  function statusPill(st) { return '<span class="st st--' + st.toLowerCase() + '">' + esc(st) + '</span>'; }
  WIDGETS.activity = function (type, size) {
    if (!DATA) return '';
    var rows = DATA.activity(S.site), n = size === 'S' ? 1 : size === 'M' ? 1 : size === 'W' ? 2 : size === 'L' ? 4 : 5;
    var head = panelHd('Recent activity', 'reports', 'activity in Reports');
    var thumb = function (r) { var a = app(r.module); return imgSrc(r.img) ? media(r.img, '', 'ac__th') : '<span class="ac__th ac__th--ic" ' + tileStyle(a) + '>' + glyph(a) + '</span>'; };
    if (size === 'S') {
      var r0 = rows[0], open = rows.filter(function (r) { return r.status !== 'Completed'; }).length;
      return head + '<span class="wg__big">' + open + '</span><span class="wg__lbl">open of the last ' + rows.length + ' records</span><b class="ell" style="font-size:13px">' + esc(r0.title) + '</b>';
    }
    return head + '<table class="ac" role="table"><caption class="vh">Recent activity, ' + esc(siteName(S.site)) + '</caption>' +
      '<thead class="ac__hd" role="rowgroup"><tr role="row"><th scope="col" role="columnheader">Type</th><th scope="col" role="columnheader">Details</th><th scope="col" role="columnheader">Site</th><th scope="col" role="columnheader">Status</th><th scope="col" role="columnheader">Date</th></tr></thead><tbody role="rowgroup">' +
      rows.slice(0, n).map(function (r) {
        var a = app(r.module);
        return '<tr role="row"><td class="ac__type" role="cell"><span class="ac__ic" ' + tileStyle(a) + '>' + glyph(a) + '</span><span>' + esc(r.type) + '</span></td>' +
          '<td class="ac__det" role="cell"><button type="button" class="ac__open" data-open="' + r.module + '">' + thumb(r) + '<span class="ac__txt"><b>' + esc(r.title) + '</b><small>' + esc(r.who) + '</small></span></button></td>' +
          '<td class="ac__site" role="cell">' + esc(r.site) + '</td><td class="ac__st" role="cell">' + statusPill(r.status) + '</td><td class="ac__date" role="cell">' + esc(r.when) + '</td></tr>';
      }).join('') + '</tbody></table>';
  };
  WIDGETS.planning = function (type, size) {
    if (!DATA) return '';
    var rows = DATA.planning(S.site), n = size === 'S' ? 1 : size === 'M' || size === 'W' ? 2 : 4;
    return panelHd('Planning', 'administer', 'plans in Administer') + '<span class="pl-list">' + rows.slice(0, n).map(function (r) {
      var pc = Math.min(100, Math.round(r.done / r.total * 100));
      var txt = r.unit === '%' ? r.done + '% of a ' + r.total + '% target' : fmt(r.done) + ' of ' + fmt(r.total) + ' ' + r.unit;
      return '<button type="button" class="pl" data-open="' + r.module + '"><span class="pl__t"><b>' + esc(r.label) + '</b><span class="pl__p">' + pc + '%</span></span>' +
        '<span class="pl__bar" aria-hidden="true"><i style="width:' + pc + '%"></i></span><small>' + esc(txt) + '</small></button>';
    }).join('') + '</span>';
  };
  /* Sites: like an exchange-rate list; picking a row re-scopes the whole dashboard */
  WIDGETS.sites = function (type, size) {
    if (!DATA) return '';
    var n = size === 'S' ? 2 : size === 'M' ? 4 : 6;
    var list = [{ id: 'all', name: 'All sites', animals: DATA.all.animals, audit: DATA.all.audit, series: DATA.all.series }].concat(DATA.sites.slice().sort(function (a, b) { return b.animals - a.animals; }));
    return panelHd('Sites', '', 'sites', 'site') + '<span class="sl">' + list.slice(0, n).map(function (x) {
      var au = x.series.audit, d = au[au.length - 1] - au[au.length - 2], on = x.id === S.site;
      return '<button type="button" class="sl__row" data-site="' + x.id + '"' + (on ? ' aria-current="true"' : '') + '><span class="sl__ic material-symbols-outlined" aria-hidden="true">' + (x.id === 'all' ? 'apartment' : 'location_on') + '</span>' +
        '<span class="sl__n"><b>' + esc(x.name) + '</b><small>' + fmt(x.animals) + ' animals</small></span><span class="sl__a">' + x.audit + '%<span class="vh"> audit score</span></span>' +
        deltaChip(d, (d > 0 ? '+' : d < 0 ? '−' : '±') + Math.abs(d), d === 0 ? null : d > 0, 'points vs last week') + (on ? '<span class="vh">, showing now</span>' : '') + '</button>';
    }).join('') + '</span>';
  };
  WIDGETS.team = function (type, size) {
    if (!DATA) return '';
    var t = DATA.team(S.site), n = size === 'S' ? 2 : size === 'M' ? 3 : 6;
    return panelHd('On duty today', 'users', 'staff in Users') + '<small class="tm__sub">' + fmt(t.onDuty) + ' of ' + fmt(t.staff) + ' staff active</small><span class="tm-list">' + t.people.slice(0, n).map(function (p) {
      return '<span class="tm"><span class="av" aria-hidden="true">' + initials(p.name) + '</span><span class="tm__n"><b>' + esc(p.name) + '</b><small>' + esc(p.shift + ' · ' + p.site) + '</small></span><span class="tag tm__role">' + esc(p.role) + '</span></span>';
    }).join('') + '</span>';
  };
  WIDGETS.helpcard = function (type, size) {
    return '<span class="hc"><span class="hc__ic" aria-hidden="true"><span class="material-symbols-outlined">support_agent</span></span><span class="hc__t"><b>Need help?</b><small>Our Help Desk replies within one working day.</small></span></span>' +
      '<button type="button" class="btn btn--primary btn--sm hc__btn" data-open="help">Contact Help Desk<span class="material-symbols-outlined ico ico--sm" aria-hidden="true">arrow_forward</span></button>';
  };
  /* ---- 'item': any Focus Hub item (species, animal, note, announcement) as its own widget.
     One renderer per item kind in ITEM_RENDERERS, keyed by the Focus Hub key prefix. ---- */
  var ITEM_KIND = { Species: { app: 'collections', icon: 'pets' }, Animal: { app: 'collections', icon: 'cruelty_free' }, Note: { app: 'notes', icon: 'sticky_note_2' }, Announcement: { app: 'announcements', icon: 'campaign' } };
  function itemApp(m) { return app((ITEM_KIND[m.type] || {}).app || 'focus'); }
  function itemHd(m) {
    return '<span class="wg__hd"><span class="gl" ' + tileStyle(itemApp(m)) + '><span class="material-symbols-outlined" aria-hidden="true">' + ((ITEM_KIND[m.type] || {}).icon || 'bookmark') + '</span></span><span class="ell">' + esc(m.type) + '</span></span>';
  }
  function wlist(rows) { return '<span class="wlist">' + rows.map(function (x) { return '<span><span>' + esc(x[0]) + '</span><b>' + esc(x[1]) + '</b></span>'; }).join('') + '</span>'; }
  var ITEM_RENDERERS = {
    an: function (p, size, m) {
      var sp = SPECIES[+p[1]], a = animalsFor(sp)[+p[2]];
      var chip = '<span><span class="tag' + (a.st === 'Under treatment' ? ' tag--alert' : '') + '">' + esc(a.st) + '</span></span>';
      if (size === 'S') return itemHd(m) + media(p[0] === 'an' ? animalsFor(SPECIES[+p[1]])[+p[2]].id : SPECIES[+p[1]].n, m.t, '', 'flex:1 1 auto;min-height:36px') + '<b class="ell">' + esc(a.n) + '</b>';
      var top = '<span class="wg__row" style="flex:0 0 auto">' + media(p[0] === 'an' ? animalsFor(SPECIES[+p[1]])[+p[2]].id : SPECIES[+p[1]].n, m.t, '', 'width:64px;height:64px;flex:none') + '<span class="wg__col"><b class="wg__t">' + esc(a.n) + '</b><small>' + esc(sp.n) + '</small>' + chip + '</span></span>';
      var facts = kgrid([[a.id, 'ID'], [a.sex.charAt(0) + ' · ' + a.age, 'Sex · age'], [a.enc.split(' · ').pop(), a.enc.split(' · ')[0]]]);
      if (size === 'M') return itemHd(m) + top + facts;
      return itemHd(m) + top + facts + '<small>Recent activity</small>' + wlist([['Weight recorded: 18.4 kg', '21 Oct'], ['Moved to ' + a.enc, '19 Oct'], ['Health check passed', '16 Oct']]) + '<span class="trend">Next: deworming · due 20 Oct</span>';
    },
    sp: function (p, size, m) {
      var sp = SPECIES[+p[1]];
      if (size === 'S') return itemHd(m) + media(p[0] === 'an' ? animalsFor(SPECIES[+p[1]])[+p[2]].id : SPECIES[+p[1]].n, m.t, '', 'flex:1 1 auto;min-height:36px') + '<b class="ell">' + esc(sp.n) + '</b>';
      var top = '<span class="wg__row" style="flex:0 0 auto">' + media(p[0] === 'an' ? animalsFor(SPECIES[+p[1]])[+p[2]].id : SPECIES[+p[1]].n, m.t, '', 'width:64px;height:64px;flex:none') + '<span class="wg__col"><b class="wg__t">' + esc(sp.n) + '</b><small><i>' + esc(sp.s) + '</i></small><span><span class="tag">' + esc(sp.iucn) + '</span></span></span></span>';
      var facts = kgrid([[String(sp.a), 'Animals'], [String(sp.sites), 'Sites'], [sp.c, 'Class']]);
      if (size === 'M') return itemHd(m) + top + facts;
      return itemHd(m) + top + facts + '<small>Animals</small>' + wlist(animalsFor(sp).slice(0, 3).map(function (a) { return [a.n + ' · ' + a.id, a.st]; })) + '<span class="trend">Next: quarterly health check · 7 Sep</span>';
    },
    nt: function (p, size, m) {
      var n = NOTES[+p[1]], text = n.text || ('Observed in ' + n.coll + ': ' + n.tags.join(', ').toLowerCase() + '. Follow up at the next round.');
      if (size === 'S') return itemHd(m) + '<b class="wg__t">' + esc(n.t) + '</b><small>' + esc(n.type + ' · ' + n.d) + '</small>';
      var tags = '<span class="chips">' + n.tags.map(function (t) { return '<span class="tag tag--dash">' + esc(t) + '</span>'; }).join('') + '</span>';
      if (size === 'M') return itemHd(m) + '<b class="wg__t">' + esc(n.t) + '</b>' + tags + '<small class="wg__lbl">' + esc(text) + '</small>';
      return itemHd(m) + '<b class="wg__t">' + esc(n.t) + '</b>' + tags + '<span style="font-size:13px">' + esc(text) + '</span><small>' + esc(n.by + ' · ' + n.d + ' · ' + n.coll) + '</small>';
    },
    ac: function (p, size, m) {
      var a = ANN[+p[1]], chip = a.important ? '<span><span class="tag tag--warn">Important</span></span>' : '';
      if (size === 'S') return itemHd(m) + chip + '<b class="wg__t">' + esc(a.t) + '</b><small>' + esc(a.d) + '</small>';
      if (size === 'M') return itemHd(m) + chip + '<b class="wg__t">' + esc(a.t) + '</b><small>' + esc(a.by + ' · ' + a.d) + '</small>';
      return itemHd(m) + chip + '<span class="ph" style="height:30%;flex:none"></span><b class="wg__t">' + esc(a.t) + '</b><span style="font-size:13px">' + esc(a.b || 'Open the announcement for the full text.') + '</span><small>' + esc(a.by + ' · ' + a.d) + (a.important ? ' · please acknowledge' : '') + '</small>';
    }
  };
  WIDGETS.item = function (type, size, it) {
    var key = it && it.ref, m = itemMeta(key);
    if (!m) return '<span class="wg__hd">Saved item</span><small>This item is no longer available.</small>';
    var r = ITEM_RENDERERS[key.split(':')[0]];
    return r ? r(key.split(':'), size, m) : itemHd(m) + '<b class="wg__t">' + esc(m.t) + '</b><small>' + esc(m.sub) + '</small>';
  };
  function widgetBody(type, size, it) {
    if (type === 'item' || DASHW[type]) return WIDGETS[type](type, size, it || {});
    var a = app(type), render = WIDGETS[(a && a.widget) || 'stats'] || WIDGETS.stats;
    return render(type, size, it);
  }
  function widgetLabel(it) {
    if (it.type === 'stack') return it.name + ' stack';
    if (it.type === 'item') { var m = itemMeta(it.ref); return (m ? m.t : 'Saved item') + ' widget'; }
    if (DASHW[it.type]) return dashName(it) + ' widget';
    return app(it.type).name + ' widget';
  }
  /* ---- widget sizes depend on where the widget sits ----
     'main' dashboard main area (4 columns; 2 on phones): S 1×2, M 2×2, L 2×4, W 4×2, XL 4×4
     'side' dashboard right column (1 column; 2 side by side on tablets): S 1×2, M 1×3, L 1×4
     The saved size is kept as chosen; eff() shows the nearest size the current place and screen allow. */
  var SZ = ['S', 'M', 'L', 'W', 'XL'], SZ_NAME = { S: 'Small', M: 'Medium', L: 'Large', W: 'Wide', XL: 'Extra large' };
  var SZ_FALLBACK = { XL: ['L', 'W', 'M', 'S'], W: ['M', 'L', 'S'], L: ['M', 'S'], M: ['S', 'L'], S: ['M'] };
  function bp() { var w = window.innerWidth; return w <= 640 ? 'phone' : w < 1240 ? 'tab' : 'desk'; }
  function spansFor(ctx) {
    if (ctx === 'side') return { S: [1, 2], M: [1, 3], L: [1, 4] };
    return bp() === 'phone' ? { S: [1, 2], M: [2, 2], W: [2, 3], L: [2, 4] } : { S: [1, 2], M: [2, 2], L: [2, 4], W: [4, 2], XL: [4, 4] };
  }
  function sizesFor(ctx) { var sp = spansFor(ctx); return SZ.filter(function (s) { return sp[s]; }); }
  function eff(size, ctx) {
    var ok = sizesFor(ctx || 'main'); if (ok.indexOf(size) > -1) return size;
    var fb = SZ_FALLBACK[size] || []; for (var i = 0; i < fb.length; i++) if (ok.indexOf(fb[i]) > -1) return fb[i];
    return ok[0];
  }
  function ctxOf(it) { return it.zone === 'side' ? 'side' : 'main'; }
  function setSize(wid, size, silent) {
    var f = findItem(wid); if (!f) return;
    var old = f.it.size; if (old === size) return;
    f.it.size = size; saveLayout(); renderHome();
    var h = $('[data-resize="' + wid + '"]'); if (h) h.focus({ preventScroll: true });
    if (!silent) toast(widgetLabel(f.it) + ' is now ' + SZ_NAME[size] + '.', 'Undo', function () { setSize(wid, old, true); });
    updateTitle();
  }
  function widgetCell(it, ctx) {
    var stack = it.type === 'stack';
    if (stack && it.idx >= it.items.length) it.idx = 0;
    var cur = stack ? it.items[it.idx] : null;
    var type = stack ? entryType(cur) : it.type;
    var ref = stack ? (cur && cur.ref) : it.ref;
    var dash = !!DASHW[type];
    var name = type === 'item' ? entryName({ ref: ref }) : dash ? dashName(it) : app(type).name;
    var label = widgetLabel(it);
    var sz = eff(it.size, ctx);
    var dots = stack ? '<div class="stack-dots" role="group" aria-label="' + esc(it.name) + ' stack">' + it.items.map(function (t, i) {
      return '<button type="button" data-act="stackTo" data-w="' + it.id + '" data-i="' + i + '" aria-label="Show ' + esc(entryName(t)) + '"' + (i === it.idx ? ' aria-current="true"' : '') + '></button>';
    }).join('') + '</div>' : '';
    var target = type === 'item' ? 'data-item="' + ref + '"' : 'data-open="' + (dash ? dashOpen(it) : type) + '"';
    var statsCls = dash ? ' wg--' + type : app(type) && !app(type).widget ? ' wg--stats wg--' + (app(type).chart || 'columns') : '';
    var bodySize = dash ? sz : sz === 'XL' ? 'L' : sz === 'W' ? 'M' : sz;
    var opts = { ref: ref, metric: it.metric, preset: it.preset, period: it.period, id: it.id, ctx: ctx };
    /* panels with their own buttons, links or filters are a plain container; the rest are one big button */
    var body = dash && type !== 'kpi' && type !== 'action'
      ? '<div class="wg__btn wg__body">' + widgetBody(type, bodySize, opts) + '</div>'
      : '<button type="button" class="wg__btn" ' + target + '>' + widgetBody(type, bodySize, opts) + '<span class="vh">, open ' + esc(dash ? app(dashOpen(it)).name : name) + (stack ? '. ' + esc(it.name) + ' stack, ' + (it.idx + 1) + ' of ' + it.items.length : '') + '</span></button>';
    var tint = type === 'action' && ACTIONS[it.preset] ? ' style="--f:' + app(ACTIONS[it.preset].module).colour + '"' : '';
    return '<div class="wg wg--' + sz + (stack ? ' wg--stack' : '') + (type === 'item' ? ' wg--item' : '') + statsCls + '" data-cell="w:' + it.id + '"' + tint + '>' +
      body + dots +
      '<button type="button" class="more" data-more="w:' + it.id + '" aria-haspopup="menu" aria-label="More options for ' + esc(label) + '">' + icon('more') + '</button>' +
      '<button type="button" class="rm" data-remove="w:' + it.id + '" aria-label="Remove ' + esc(label) + '">−</button>' +
      '<button type="button" class="rs" data-resize="' + it.id + '" aria-label="Resize ' + esc(label) + ', now ' + SZ_NAME[sz] + '. Drag the corner, or use the arrow keys"></button></div>';
  }
  function greeting() { var h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
  /* dashboard heading: greeting, active site + date, sync status; on phones a row of pinned-module chips */
  function dashHeader() {
    var m = siteMetrics(), n = DATA ? DATA.sites.length : 9;
    var chips = bp() === 'phone' && pinned.length ? '<nav class="pin-chips" aria-label="Pinned modules">' + pinned.map(function (id) {
      var a = app(id); return '<button type="button" class="pin-chip" data-open="' + id + '" ' + tileStyle(a) + '><span class="material-symbols-outlined" aria-hidden="true">' + a.icon + '</span>' + esc(a.name) + '</button>';
    }).join('') + '</nav>' : '';
    return '<header class="dash-hd"><div class="dash-hd__txt"><h1 id="dashH" class="dash-hd__t">' + greeting() + ', ' + esc(CFG.user.first) + ' <span aria-hidden="true">👋</span></h1>' +
      '<p class="dash-hd__s">Here’s ' + esc(siteName(S.site)) + ' today · ' + esc(CFG.user.date) + ' · sample data</p></div>' +
      '<p class="dash-ok"><span class="material-symbols-outlined" aria-hidden="true">verified</span><span><b>' + (S.site === 'all' ? 'All ' + n + ' sites synced' : esc(siteName(S.site)) + ' synced') + '</b><small>Audit score ' + (m ? m.audit : '–') + '% · updated 09:00</small></span></p></header>' + chips;
  }
  /* the home screen is one page: the Command Centre dashboard (main area + right column), scrolling vertically */
  function renderHome() {
    var keep = document.activeElement && document.activeElement.closest && document.activeElement.closest('#homePages [data-cell]');
    var keepSel = keep ? keep.getAttribute('data-cell') : null;
    var keepCls = keep ? document.activeElement.className : '';
    var board = $('#homePages'), keepScroll = board.scrollTop;
    var main = '', side = '';
    LAYOUT.forEach(function (it) { if (it.zone === 'side') side += widgetCell(it, 'side'); else main += widgetCell(it, 'main'); });
    board.innerHTML = dashHeader() +
      '<div class="dash"><div class="dz dz--main" data-zone="main" role="group" aria-label="Main panels">' + main + '</div>' +
      '<div class="dz dz--side" data-zone="side" role="group" aria-label="Right column">' + side + '</div></div>';
    board.scrollTop = keepScroll;
    renderSide();
    if (keepSel) {
      var cell = $('#homePages [data-cell="' + keepSel + '"]');
      var target = cell && (keepCls ? cell.querySelector('.' + keepCls.split(' ')[0]) : null);
      if (target) target.focus({ preventScroll: true });
    }
  }

  /* App Library: a dialog sheet from "All modules" in the sidebar. Searchable A–Z list; each row opens
     the module, pins it (or drag the row onto the sidebar) and adds its widget to the dashboard. */
  function openLibrary(trigger) {
    var fromDrawer = S.drawer;
    if (S.drawer) closeDrawer(true);
    if (S.app) closeApp(true);
    closeOverlay(true);
    opener = fromDrawer ? $('#menuBtn') : (trigger || document.activeElement); S.overlay = 'library'; root._libQ = '';
    root.innerHTML = '<div class="sheet-wrap" data-act="closeOverlayBg"><div class="sheet sheet--lib" role="dialog" aria-modal="true" aria-labelledby="libH"><div class="sheet__grip" aria-hidden="true"></div>' +
      '<div class="sheet__hd"><h2 id="libH">All modules</h2><button type="button" class="pill-btn pill-btn--dark" data-act="closeOverlay">Done</button></div>' +
      '<label class="search search--pill"><span class="material-symbols-outlined ico ico--sm" aria-hidden="true">search</span><span class="vh">Search modules</span><input type="search" id="libQ" placeholder="Search ' + APPS.length + ' modules" autocomplete="off"></label>' +
      '<p class="muted lib__note" id="libN" aria-live="polite"></p>' +
      '<div class="lib" id="libScroll"><div class="lib__list" id="libList"></div><nav class="az" id="azIndex" aria-label="Jump to letter"></nav></div></div></div>';
    $('#libQ').addEventListener('input', function (e) { root._libQ = e.target.value; renderLibrary(); });
    renderLibrary(); $('#libQ').focus(); syncInert(); updateTitle();
  }
  function renderLibrary() {
    if (S.overlay !== 'library' || !$('#libList')) return;
    var q = (root._libQ || '').toLowerCase();
    var list = APPS.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).filter(function (a) { return !q || (a.name + ' ' + a.sub).toLowerCase().indexOf(q) > -1; });
    var letters = {};
    var html = '';
    list.forEach(function (a) {
      var L = a.name[0].toUpperCase();
      if (!letters[L]) { letters[L] = 1; html += '<h3 class="lib__letter" id="lib-' + L + '">' + L + '</h3>'; }
      html += '<div class="lib-row' + (a.core ? ' is-core' : '') + '" data-lib="' + a.id + '"><span class="lib-grip" aria-hidden="true" title="Drag onto the sidebar to pin"><span class="material-symbols-outlined">drag_indicator</span></span>' +
        '<button type="button" class="lib-open" data-open="' + a.id + '">' + appIc(a, true) +
        '<span class="name">' + esc(a.name) + '<small>' + esc(a.sub) + (isPinned(a.id) ? ' · Pinned' : '') + '</small></span></button>' +
        '<button type="button" class="lib-more" data-pin="' + a.id + '" aria-pressed="' + isPinned(a.id) + '" aria-label="Pin ' + esc(a.name) + ' to the sidebar">' + icon('pin') + '</button>' +
        '<button type="button" class="lib-more" data-act="libAdd" data-id="' + a.id + '" aria-label="Add ' + esc(a.name) + ' widget to the dashboard">' + icon('plus') + '</button></div>';
    });
    $('#libN').textContent = list.length + ' of ' + APPS.length + ' modules. ' + pinned.length + ' of ' + MAX_PINS + ' pinned.';
    $('#libList').innerHTML = html || '<p class="muted" style="padding:16px">No module matches “' + esc(root._libQ) + '”.</p>';
    $('#azIndex').innerHTML = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(function (L) {
      return '<button type="button" data-act="az" data-l="' + L + '"' + (letters[L] ? '' : ' disabled') + ' aria-label="Jump to ' + L + '">' + L + '</button>';
    }).join('');
  }

  /* ================= PINNING + SIDEBAR =================
     One pin list (antz-pins, up to MAX_PINS) shown in the sidebar on every screen size: a fixed
     240px panel on desktop, a 72px icon rail on tablets (expand toggle, remembered), and a drawer
     from the header menu button on phones. Desktop and tablet can collapse it to the rail (antz-side).
     Pin from: a widget's ⋯ / long-press menu, the App Library, the app header ("Pin to sidebar"),
     the "Pin a module" picker, or drag a dashboard widget or App Library row onto the sidebar.
     Unpin from: the same places, a pin's ⋯ menu, or drag a pin out of the sidebar. */
  function togglePin(id, trigger) {
    var a = app(id); if (!a) return;
    var snap = pinned.slice();
    if (isPinned(id)) {
      pinned.splice(pinned.indexOf(id), 1);
      toast(a.name + ' unpinned from the sidebar.', 'Undo', function () { pinned = snap; savePins(); refreshAll(); });
    } else {
      if (pinned.length >= MAX_PINS) { toast('Up to ' + MAX_PINS + ' pins. Unpin a module first.'); return; }
      pinned.push(id);
      toast(a.name + ' pinned to the sidebar.', 'Undo', function () { pinned = snap; savePins(); refreshAll(); });
    }
    savePins(); refreshAll();
    /* the picker and App Library redraw their rows: keep focus on the same row's pin button */
    if (trigger && !document.contains(trigger)) trigger = $('#overlayRoot [data-pin="' + id + '"]');
    if (trigger) trigger.focus({ preventScroll: true });
  }
  function movePin(id, dir) {
    var i = pinned.indexOf(id), j = i + dir; if (i < 0) return;
    if (j < 0 || j >= pinned.length) { toast(dir < 0 ? 'Already first' : 'Already last'); return; }
    var snap = pinned.slice();
    pinned.splice(i, 1); pinned.splice(j, 0, id); savePins(); refreshAll();
    var b = $('#snPins [data-pin-item="' + id + '"]'); if (b) b.focus({ preventScroll: true });
    toast(app(id).name + ' moved ' + (dir < 0 ? 'up' : 'down'), 'Undo', function () { pinned = snap; savePins(); refreshAll(); });
  }
  function refreshAll() {
    renderHome();
    $$('[data-pin]').forEach(function (b) { if (b.dataset.pin) b.setAttribute('aria-pressed', String(isPinned(b.dataset.pin))); });
    if (S.overlay === 'picker') renderPicker();
    if (S.overlay === 'library') renderLibrary();
    updateTitle();
  }
  function snItem(o) {
    return '<li><button type="button" class="sn' + (o.cls || '') + '"' + o.attr + ' data-label="' + esc(o.label) + '"' + (o.cur ? ' aria-current="page"' : '') + '>' +
      '<span class="sn__ic"' + (o.style || '') + '><span class="material-symbols-outlined" aria-hidden="true">' + o.icon + '</span></span><span class="sn__lbl">' + esc(o.label) + '</span>' +
      (o.badge ? '<span class="sn__badge" aria-hidden="true">' + o.badge + '</span>' : '') + (o.sr ? '<span class="vh">' + esc(o.sr) + '</span>' : '') + '</button>' + (o.more || '') + '</li>';
  }
  function renderSide() {
    if (!$('#snHome')) return;
    var h = snItem({ label: 'Command Centre', icon: 'space_dashboard', attr: ' data-act="home"', cur: !S.app });
    h += snItem({ label: 'All modules', icon: 'grid_view', attr: ' data-act="library" aria-haspopup="dialog"' });
    $('#snHome').innerHTML = h;
    $('#snPinsN').textContent = pinned.length + ' of ' + MAX_PINS;
    if (pd && pd.on) return;   /* a pin is being dragged: keep its list (a timed re-render would duplicate it) */
    $('#snPins').innerHTML = pinned.length ? pinned.map(function (id) {
      var a = app(id);
      return snItem({ label: a.name, icon: a.icon, attr: ' data-open="' + id + '" data-pin-item="' + id + '"', cur: S.app === id, badge: a.badge, sr: a.badge ? ', ' + a.badge + ' ' + a.bw : '',
        style: ' ' + tileStyle(a), cls: ' sn--pin',
        more: '<button type="button" class="sn__more" data-more="pin:' + id + '" aria-haspopup="menu" aria-label="More options for ' + esc(a.name) + ' pin">' + icon('more') + '</button>' });
    }).join('') : '<li class="side__empty"><b>Pin modules here</b><span>Use “Pin a module”, All modules, or drag a widget here.</span></li>';
  }
  /* desktop and tablet: full 240px sidebar or the 72px icon rail (labels become tooltips).
     Saved as antz-side ('open' | 'rail'); with nothing saved, desktop opens expanded and tablet as the rail. */
  function sideExpanded() { var v = recallRaw(SIDE_KEY); return v === 'open' ? true : v === 'rail' ? false : bp() === 'desk'; }
  function applySideMode() {
    var phone = bp() === 'phone', open = phone || sideExpanded();
    document.body.classList.toggle('side-rail', !open);
    var t = $('#sideToggle');
    t.setAttribute('aria-expanded', String(open));
    t.setAttribute('aria-label', open ? 'Collapse sidebar' : 'Expand sidebar');
    t.dataset.label = open ? 'Collapse sidebar' : 'Expand sidebar';
    t.querySelector('.material-symbols-outlined').textContent = open ? 'left_panel_close' : 'left_panel_open';
    if (!phone && S.drawer) closeDrawer(true);
  }
  function toggleSide() {
    if (bp() === 'phone') return;
    try { localStorage.setItem(SIDE_KEY, sideExpanded() ? 'rail' : 'open'); } catch (e) { /* storage blocked: still toggles for this visit */ }
    applySideMode(); $('#sideToggle').focus({ preventScroll: true });
  }
  /* phone drawer: traps focus, Escape or the scrim closes it */
  function openDrawer() {
    closeOverlay(true); S.drawer = true;
    document.body.classList.add('drawer-open'); $('#sideScrim').hidden = false;
    $('#menuBtn').setAttribute('aria-expanded', 'true');
    $('#side').setAttribute('role', 'dialog'); $('#side').setAttribute('aria-modal', 'true');
    ui.setAttribute('inert', '');
    var f = $('#side [aria-current="page"]') || $('#side .sn'); if (f) f.focus();
  }
  function closeDrawer(silent) {
    if (!S.drawer) return; S.drawer = false;
    document.body.classList.remove('drawer-open'); $('#sideScrim').hidden = true;
    $('#menuBtn').setAttribute('aria-expanded', 'false');
    $('#side').removeAttribute('role'); $('#side').removeAttribute('aria-modal');
    ui.removeAttribute('inert');
    if (!silent) $('#menuBtn').focus({ preventScroll: true });
  }
  /* "Command Centre" in the sidebar (and the app window's Dashboard button): back to the dashboard heading */
  function goHome() {
    if (S.drawer) closeDrawer(true);
    if (S.app) closeApp(true);
    var f = $('#dashH'); if (f) { f.setAttribute('tabindex', '-1'); f.focus({ preventScroll: true }); }
  }
  /* "Pin a module" picker: searchable list with pin toggles */
  function openPicker() {
    if (S.drawer) closeDrawer(true);
    closeOverlay(true); opener = $('[data-act="pinPicker"]'); S.overlay = 'picker'; root._pkQ = '';
    root.innerHTML = '<div class="sheet-wrap" data-act="closeOverlayBg"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="pkH"><div class="sheet__grip" aria-hidden="true"></div>' +
      '<div class="sheet__hd"><h2 id="pkH">Pin modules to the sidebar</h2><button type="button" class="pill-btn pill-btn--dark" data-act="closeOverlay">Done</button></div>' +
      '<label class="search search--pill"><span class="material-symbols-outlined ico ico--sm" aria-hidden="true">search</span><span class="vh">Search modules</span><input type="search" id="pkQ" placeholder="Search ' + APPS.length + ' modules" autocomplete="off"></label>' +
      '<p class="muted pk__note" id="pkN"></p><ul class="pk-list" id="pkList"></ul></div></div>';
    $('#pkQ').addEventListener('input', function (e) { root._pkQ = e.target.value; renderPicker(); });
    renderPicker(); $('#pkQ').focus(); syncInert(); updateTitle();
  }
  function renderPicker() {
    var q = (root._pkQ || '').toLowerCase();
    var list = APPS.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).filter(function (a) { return !q || (a.name + ' ' + a.sub).toLowerCase().indexOf(q) > -1; });
    $('#pkN').textContent = pinned.length + ' of ' + MAX_PINS + ' pinned. ' + list.length + ' modules shown.';
    $('#pkList').innerHTML = list.map(function (a) {
      var on = isPinned(a.id);
      return '<li><span class="app__ic" ' + tileStyle(a, '--ic:34px') + ' aria-hidden="true">' + glyph(a) + '</span><span class="pk__t"><b>' + esc(a.name) + '</b><small>' + esc(a.sub) + '</small></span>' +
        '<button type="button" class="btn btn--sm ' + (on ? 'btn--primary' : 'btn--ghost') + '" data-pin="' + a.id + '" aria-pressed="' + on + '" aria-label="Pin ' + esc(a.name) + ' to the sidebar">' + icon('pin') + (on ? 'Pinned' : 'Pin') + '</button></li>';
    }).join('') || '<li class="muted">No module matches.</li>';
  }

  /* drag pins: reorder inside the sidebar, or drop outside it to unpin (keyboard: Alt+↑/↓, ⋯ menu) */
  var pd = null;
  document.addEventListener('pointerdown', function (e) {
    var b = e.button === 0 && e.target.closest && e.target.closest('#snPins .sn--pin');
    if (!b || e.target.closest('.sn__more')) return;
    pd = { id: b.dataset.pinItem, el: b.parentElement, x: e.clientX, y: e.clientY, on: false };
  }, true);
  document.addEventListener('pointermove', function (e) {
    if (!pd) return;
    if (!pd.on) {
      if (Math.abs(e.clientX - pd.x) < 6 && Math.abs(e.clientY - pd.y) < 6) return;
      pd.on = true; pd.el.classList.add('is-drag-src'); document.body.classList.add('is-pin-drag');
      var r = pd.el.getBoundingClientRect(); pd.dx = e.clientX - r.left; pd.dy = e.clientY - r.top;
      pd.ghost = pd.el.cloneNode(true); pd.ghost.className = 'pin-ghost'; pd.ghost.setAttribute('aria-hidden', 'true'); pd.ghost.style.width = r.width + 'px';
      document.body.appendChild(pd.ghost);
    }
    e.preventDefault();
    pd.ghost.style.transform = 'translate(' + (e.clientX - pd.dx) + 'px,' + (e.clientY - pd.dy) + 'px)';
    var side = $('#side').getBoundingClientRect(), out = e.clientX > side.right + 8;
    pd.out = out; pd.ghost.classList.toggle('is-out', out);
    if (out) return;
    var list = $('#snPins'), sibs = $$('li', list).filter(function (li) { return li !== pd.el && li.querySelector('.sn--pin'); });
    var after = null;
    sibs.forEach(function (li) { var rr = li.getBoundingClientRect(); if (e.clientY > rr.top + rr.height / 2) after = li; });
    if (after) after.after(pd.el); else list.insertBefore(pd.el, list.firstChild);
  }, true);
  document.addEventListener('pointerup', function () {
    if (!pd) return;
    var d = pd; pd = null;
    if (!d.on) return;
    d.ghost.remove(); document.body.classList.remove('is-pin-drag');
    suppress = true; setTimeout(function () { suppress = false; }, 50);
    if (d.out) { togglePin(d.id); return; }
    var order = $$('#snPins .sn--pin').map(function (b) { return b.dataset.pinItem; });
    var snap = pinned.slice();
    if (order.join() === snap.join()) { renderSide(); return; }
    pinned = order; savePins(); refreshAll();
    toast('Pins reordered', 'Undo', function () { pinned = snap; savePins(); refreshAll(); });
  }, true);
  document.addEventListener('pointercancel', function () { if (pd && pd.ghost) pd.ghost.remove(); pd = null; document.body.classList.remove('is-pin-drag'); renderSide(); }, true);

  /* drag an App Library row onto the sidebar (full or rail) to pin that module.
     Mouse and pen: drag the row; touch: drag its grip (the list itself scrolls). Keyboard: the row's Pin button. */
  var ld = null;
  function endLibDrag() {
    if (!ld) return null;
    var d = ld; ld = null;
    if (d.on) { d.ghost.remove(); d.row.classList.remove('is-drag-src'); document.body.classList.remove('is-lib-drag'); $('#snPins').classList.remove('is-drop'); }
    return d;
  }
  document.addEventListener('pointerdown', function (e) {
    var row = e.button === 0 && S.overlay === 'library' && e.target.closest && e.target.closest('.lib-row');
    if (!row || e.target.closest('.lib-more') || bp() === 'phone' || (e.pointerType === 'touch' && !e.target.closest('.lib-grip'))) return;
    ld = { id: row.dataset.lib, row: row, x: e.clientX, y: e.clientY, on: false };
  }, true);
  document.addEventListener('pointermove', function (e) {
    if (!ld) return;
    if (!ld.on) {
      if (Math.abs(e.clientX - ld.x) < 6 && Math.abs(e.clientY - ld.y) < 6) return;
      ld.on = true;
      var r = ld.row.getBoundingClientRect(); ld.dx = e.clientX - r.left; ld.dy = e.clientY - r.top;
      ld.ghost = ld.row.cloneNode(true); ld.ghost.className = 'lib-row lib-ghost'; ld.ghost.setAttribute('aria-hidden', 'true'); ld.ghost.style.width = r.width + 'px';
      document.body.appendChild(ld.ghost); ld.row.classList.add('is-drag-src'); document.body.classList.add('is-lib-drag');
    }
    e.preventDefault();
    ld.ghost.style.transform = 'translate(' + (e.clientX - ld.dx) + 'px,' + (e.clientY - ld.dy) + 'px)';
    var sr = $('#side').getBoundingClientRect();
    ld.over = e.clientX >= sr.left && e.clientX <= sr.right && e.clientY >= sr.top && e.clientY <= sr.bottom;
    ld.ghost.classList.toggle('is-over', ld.over);
    $('#snPins').classList.toggle('is-drop', ld.over);
  }, true);
  document.addEventListener('pointerup', function () {
    var d = endLibDrag(); if (!d || !d.on) return;
    suppress = true; setTimeout(function () { suppress = false; }, 50);
    if (!d.over) return;
    if (isPinned(d.id)) toast(app(d.id).name + ' is already pinned.'); else togglePin(d.id, $('#overlayRoot [data-pin="' + d.id + '"]'));
  }, true);
  document.addEventListener('pointercancel', function () { endLibDrag(); }, true);

  /* ================= TOAST ================= */
  var toastTimer, toastFn;
  function toast(msg, act, fn) {
    $('#toastMsg').textContent = msg; toastFn = fn || null;
    $('#toastAct').hidden = !fn; $('#toastAct').textContent = act || '';
    $('#toast').hidden = false; clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $('#toast').hidden = true; }, fn ? 5000 : 2400);
  }
  $('#toastAct').addEventListener('click', function () { if (toastFn) toastFn(); $('#toast').hidden = true; });

  /* ================= OVERLAYS ================= */
  var root = $('#overlayRoot');
  var opener = null;
  function setInert(sel, on) { var el = $(sel); if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); }
  function syncInert() {
    var ov = !!S.overlay && S.overlay !== 'ctx';
    setInert('#home', !!S.app || ov);
    setInert('#statusBar', ov); setInert('#editBar', ov); setInert('#appwin', ov); setInert('#side', ov);
  }
  /* an overlay opened from inside another overlay (App Library → widget gallery) keeps the first trigger,
     so closing it returns focus to the button that started the chain */
  function setOpener(fallback) { var ae = document.activeElement; opener = ae && root.contains(ae) && opener && document.contains(opener) ? opener : (fallback || ae); }
  function closeOverlay(silent) {
    if (!S.overlay) return;
    if (S.overlay === 'site') $('#sitePill').setAttribute('aria-expanded', 'false');
    root.innerHTML = ''; S.overlay = null; syncInert();
    if (!silent && opener && document.contains(opener)) opener.focus({ preventScroll: true });
    updateTitle();
  }

  /* context menu (long-press / right-click / ⋯ / ContextMenu key) */
  /* long-press shortcuts come from module.shortcuts in config.js */
  function quickActions(id) {
    var a = app(id);
    if (!a.shortcuts) return [['Open ' + a.name, function () { openApp(id); }]];
    return a.shortcuts.map(function (sc) {
      return [sc.label, function () {
        openApp(id, sc.open || {});
        if (sc.toast) toast(sc.toast);
        if (sc.focus) { var el = $(sc.focus); if (el) el.focus(); }
      }];
    });
  }
  function openCtx(kind, id, anchor, point) {
    closeOverlay(true);
    opener = anchor || document.activeElement;
    var items = [], title = '';
    if (kind === 'app') {
      var a = app(id); title = a.name;
      items = quickActions(id).map(function (q) { return [q[0], q[1], 'plus']; });
      items.push(['Show stats', function () { openPeek(id, anchor); }, 'grid']);
      items.push(['Add Widget', function () { openGallery({ type: id, size: 'M', mode: 'add' }); }, 'plus']);
      items.push('-');
      items.push([isPinned(id) ? 'Unpin from sidebar' : 'Pin to sidebar', function () { togglePin(id); }, 'pin']);
    } else if (kind === 'w') {
      var f = findItem(id); if (!f) return;
      var it = f.it, stack = it.type === 'stack', type = stack ? entryType(it.items[it.idx]) : it.type;
      title = widgetLabel(it);
      if (it.type === 'item') items.push(['Open', function () { var mm = itemMeta(it.ref); if (mm) openApp(mm.go.app, mm.go); }, 'open_in_new']);
      if (stack) items.push(['Edit Stack', function () { openStackSheet(it.id); }, 'grid']);
      else items.push(['Edit Widget', function () { openGallery({ type: it.type, ref: it.ref, metric: it.metric, preset: it.preset, size: it.size, mode: 'edit', wid: it.id }); }, 'grid']);
      if (!stack && DASHW[it.type]) items.push(['Open ' + app(dashOpen(it)).name, function () { openApp(dashOpen(it)); }, 'open_in_new']);
      var pm = DASHW[type] ? (type === 'kpi' || type === 'action' || type === 'trend' ? dashOpen(it) : DASHW[type].open) : app(type) ? type : null;
      if (pm && app(pm)) items.push([isPinned(pm) ? 'Unpin ' + app(pm).name + ' from sidebar' : 'Pin ' + app(pm).name + ' to sidebar', function () { togglePin(pm); }, 'pin']);
      items.push(['Move earlier', function () { moveItem('w:' + it.id, -1); }, 'chevron_left']);
      items.push(['Move later', function () { moveItem('w:' + it.id, 1); }, 'chevron_right']);
      items.push([it.zone === 'side' ? 'Move to main area' : 'Move to right column', function () { moveZone(it.id); }, it.zone === 'side' ? 'west' : 'east']);
      if (it.type === 'item') items.push(['Remove from Focus Hub', function () { unsaveItem(it.ref); }, 'bookmark_remove']);
      items.push(['Edit Home Screen', function () { setEditing(true); }, 'grid']);
      items.push(['-']);
      items.push([stack ? 'Remove Stack' : 'Remove Widget', function () { removeCell('w:' + id); }, 'x', 1]);
    } else if (kind === 'pin') {
      var pa = app(id); title = pa.name + ' (pinned)';
      items = [['Open ' + pa.name, function () { openApp(id); }, 'open_in_new'],
               ['Move up', function () { movePin(id, -1); }, 'arrow_upward'],
               ['Move down', function () { movePin(id, 1); }, 'arrow_downward'],
               '-',
               ['Unpin from sidebar', function () { togglePin(id); var n = $('#snPins .sn') || $('[data-act="pinPicker"]'); if (n) n.focus(); }, 'keep_off', 1]];
    } else if (kind === 'item') {
      var im = itemMeta(id); if (!im) return;
      title = im.t;
      items = [['Open', function () { openApp(im.go.app, im.go); }, 'open_in_new'],
               ['Add to Home Screen as widget', function () { openGallery({ type: 'item', ref: id, size: 'M', mode: 'add' }); }, 'widgets'],
               '-',
               ['Remove from Focus Hub', function () { unsaveItem(id); }, 'bookmark_remove', 1]];
    } else if (kind === 'profile') {
      var u = CFG.user, cur = themeChoice();
      title = u.full + ', ' + u.role + ' (sample data)';
      items = [['Light', function () { applyTheme('light', true); }, 'light_mode', 0, cur === 'light'],
               ['Dark', function () { applyTheme('dark', true); }, 'dark_mode', 0, cur === 'dark'],
               ['System', function () { applyTheme('system', true); }, 'contrast', 0, cur === 'system'],
               '-',
               ['My profile', function () { toast('Profile · ' + u.full); }, 'person'],
               ['Photo credits', function () { openCredits(); }, 'photo_library']];
    } else {
      title = 'Home Screen';
      items = [['Add Widget', function () { setEditing(true); openGallery(); }, 'plus'], ['All modules', function () { openLibrary(); }, 'grid_view'], ['Edit Home Screen', function () { setEditing(true); }, 'grid']];
    }
    S.overlay = 'ctx';
    var fns = [];
    root.innerHTML = '<div class="scrim" data-act="closeOverlay"></div><div class="ctx" role="menu" aria-label="' + esc(title) + '"><p class="ctx__title" aria-hidden="true">' + esc(title) + '</p>' +
      items.map(function (x) { if (x === '-' || x[0] === '-') return '<div role="separator"></div>'; fns.push(x[1]);
        var radio = x.length > 4 ? ' role="menuitemradio" aria-checked="' + !!x[4] + '"' : ' role="menuitem"';
        return '<button type="button"' + radio + ' class="' + (x[3] ? 'danger' : '') + '" data-ctx="' + (fns.length - 1) + '" tabindex="-1"><span>' + esc(x[0]) + '</span>' + icon(x.length > 4 && x[4] ? 'check' : (x[2] || 'right')) + '</button>'; }).join('') + '</div>';
    if (kind === 'profile') $('.ctx', root).insertAdjacentHTML('afterbegin', '<p class="ctx__title" aria-hidden="true" style="padding-bottom:0">Appearance</p>');
    root._fns = fns;
    var m = $('.ctx', root), r = anchor ? anchor.getBoundingClientRect() : { left: point.x, right: point.x, top: point.y, bottom: point.y };
    var W = window.innerWidth, H = window.innerHeight, mw = m.offsetWidth, mh = m.offsetHeight;
    var x = Math.min(Math.max(8, r.left), W - mw - 8), y = r.bottom + 8;
    if (y + mh > H - 8) y = Math.max(8, r.top - mh - 8);
    m.style.left = x + 'px'; m.style.top = y + 'px';
    var first = $('[role="menuitem"], [role="menuitemradio"]', m); if (first) first.focus();
    syncInert();
  }
  /* "Show stats": widget preview from a module's menu */
  function openPeek(id, anchor) {
    closeOverlay(true);
    opener = anchor && document.contains(anchor) ? anchor : document.activeElement;
    var a = app(id); S.overlay = 'peek';
    root.innerHTML = '<div class="scrim" data-act="closeOverlay"></div><div class="peek" role="dialog" aria-modal="true" aria-labelledby="peekH"><h2 id="peekH" class="vh">' + esc(a.name) + ' stats</h2>' +
      '<div class="wg wg--M"><div class="wg__btn">' + widgetBody(id, 'M') + '</div></div>' +
      '<div class="peek__acts"><button type="button" class="btn btn--primary btn--sm" data-act="peekOpen" data-id="' + id + '">Open ' + esc(a.name) + '</button><button type="button" class="btn btn--ghost btn--sm" data-act="peekAdd" data-id="' + id + '">' + icon('plus') + 'Add Widget</button><button type="button" class="btn btn--ghost btn--sm" data-act="closeOverlay">Close</button></div></div>';
    var m = $('.peek', root), r = anchor && document.contains(anchor) ? anchor.getBoundingClientRect() : { left: window.innerWidth / 2 - 200, right: 0, top: 120, bottom: 120 };
    var W = window.innerWidth, H = window.innerHeight, mw = m.offsetWidth, mh = m.offsetHeight;
    var x = Math.min(Math.max(8, r.left), W - mw - 8), y = r.bottom + 8;
    if (y + mh > H - 8) y = Math.max(8, r.top - mh - 8);
    m.style.left = x + 'px'; m.style.top = y + 'px';
    $('[data-act="peekOpen"]', root).focus();
    syncInert(); updateTitle();
  }
  function openCtxFor(cell, point) { openCtx('w', cell.getAttribute('data-cell').slice(2), cell, point); }
  function removeCell(key) {
    var f = findItem(key.slice(2)); if (!f) return;
    var snap = snapshot();
    LAYOUT.splice(f.i, 1); saveLayout(); refreshAll();
    toast('Widget removed.', 'Undo', function () { restore(snap); });
  }

  /* edit (jiggle) mode */
  function setEditing(on) {
    closeOverlay(true);
    S.editing = on; ui.classList.toggle('editing', on);
    renderHome();
    if (on) { $('#addWidgetBtn').focus(); } else { toast('Home Screen saved'); $('#editBtn').focus(); }
    updateTitle();
  }

  /* widget gallery + size picker + stack */
  var WTYPES = APPS.map(function (a) { return a.id; });
  var gal = null;
  function openGallery(o) {
    setOpener();
    closeOverlay(true);
    S.pendingStack = '';
    gal = o ? Object.assign({ toStack: '' }, o) : null;
    S.overlay = 'gallery';
    renderGallery();
    syncInert(); updateTitle();
  }
  function renderGallery() {
    var html;
    if (!gal) {
      var q = (root._galQ || '').toLowerCase();
      var list = WTYPES.filter(function (t) { return !q || (app(t).name + ' ' + app(t).sub).toLowerCase().indexOf(q) > -1; });
      var savedKeys = Object.keys(SAVE).filter(function (k) { var m = SAVE[k]; return (m.liked || m.bm) && (!q || (m.t + ' ' + m.type).toLowerCase().indexOf(q) > -1); });
      var dashList = galDashEntries().filter(function (d) { return !q || (dashName(d) + ' ' + DASHW[d.type].desc).toLowerCase().indexOf(q) > -1; });
      var dashHtml = dashList.length ? '<li class="gal-sec">Command Centre</li>' + dashList.map(function (d) {
        return '<li class="gcell"><button type="button" class="gtile" data-act="galPick" data-t="' + d.type + '"' + (d.metric ? ' data-metric="' + d.metric + '"' : '') + (d.preset ? ' data-preset="' + d.preset + '"' : '') + '><span class="gprev" aria-hidden="true">' + dashPreview(d) + '</span><b>' + esc(dashName(d)) + '</b><small>' + esc(DASHW[d.type].name) + '</small></button></li>';
      }).join('') : '';
      html = '<div class="sheet__grip" aria-hidden="true"></div><div class="sheet__hd"><h2 id="galH">Add widgets</h2><button type="button" class="icon-btn" data-act="closeOverlay" aria-label="Close"><span class="material-symbols-outlined ico" aria-hidden="true">close</span></button></div>' +
        '<label class="search search--pill"><span class="material-symbols-outlined ico ico--sm" aria-hidden="true">search</span><span class="vh">Search widgets</span><input type="search" id="galQ" placeholder="Search Widgets" value="' + esc(root._galQ || '') + '"></label>' +
        '<p class="muted" style="margin-top:10px;font-size:13px">New widgets go at the end of the dashboard. Every module has a stats widget. ' + list.length + ' of ' + WTYPES.length + ' modules shown.</p>' +
        '<ul class="gal-grid" id="galGrid">' + dashHtml +
        (savedKeys.length ? '<li class="gal-sec" id="galFocus">From Focus Hub</li>' + savedKeys.map(function (k) {
          return '<li class="gcell"><button type="button" class="gtile" data-act="galPick" data-t="item" data-ref="' + k + '"><span class="gprev" aria-hidden="true">' + widgetBody('item', 'S', { ref: k }) + '</span><b>' + esc(SAVE[k].t) + '</b><small>' + esc(SAVE[k].type) + ' · saved</small></button></li>';
        }).join('') : '') + '<li class="gal-sec">Modules</li>' + list.map(function (t) {
          return '<li class="gcell"><button type="button" class="gtile" data-act="galPick" data-t="' + t + '"><span class="gprev" aria-hidden="true">' + widgetBody(t, 'S') + '</span><b>' + esc(app(t).name) + '</b><small>' + esc(app(t).sub) + '</small></button></li>';
        }).join('') + '</ul>' + (list.length ? '' : '<p class="muted" style="margin-top:14px">No widgets match.</p>');
    } else {
      var isItem = gal.type === 'item', im = isItem ? itemMeta(gal.ref) : null, isDash = !!DASHW[gal.type];
      var a = isItem ? itemApp(im) : isDash ? app(dashOpen(gal)) : app(gal.type), sizes = sizesFor(galCtx());
      if (sizes.indexOf(gal.size) < 0) gal.size = eff(gal.size, galCtx());
      var gTitle = isItem ? im.t : isDash ? dashName(gal) : a.name, gDesc = isItem ? 'Your saved ' + im.type.toLowerCase() + ' from Focus Hub, kept on the Home Screen. Tap it to open it.' : isDash ? DASHW[gal.type].desc : (a.description || a.sub + ': key stats at a glance.');
      var avail = isDash ? [] : stacks().filter(function (x) { return !x.items.some(function (e) { return isItem ? (e && e.ref === gal.ref) : e === gal.type; }); });
      var canStack = gal.mode === 'add' && avail.length;
      html = '<div class="sheet__grip" aria-hidden="true"></div><div class="sheet__hd">' +
        (gal.mode === 'add' ? '<button type="button" class="icon-btn" data-act="galBack" aria-label="Back to all widgets"><span class="material-symbols-outlined ico" aria-hidden="true">chevron_left</span></button>' : '') +
        '<span class="app__ic" ' + tileStyle(a, '--ic:30px') + ' aria-hidden="true">' + glyph(a) + '</span><h2 id="galH">' + esc(gTitle) + '</h2><button type="button" class="icon-btn" data-act="closeOverlay" aria-label="Close"><span class="material-symbols-outlined ico" aria-hidden="true">close</span></button></div>' +
        '<div class="gdet"><h3>' + esc(gTitle) + '</h3><p>' + esc(gDesc) + '</p>' +
        '<div class="gstage"><button type="button" class="icon-btn" data-act="galSize" data-d="-1" aria-label="Smaller size"' + (gal.size === sizes[0] ? ' disabled' : '') + '><span class="material-symbols-outlined ico" aria-hidden="true">chevron_left</span></button>' +
        '<div class="wg wg--' + gal.size + (isDash ? ' wg--' + gal.type : '') + '" aria-hidden="true" inert><span class="wg__btn' + (isDash ? ' wg__body' : '') + '">' + widgetBody(gal.type, isDash ? gal.size : gal.size === 'XL' ? 'L' : gal.size === 'W' ? 'M' : gal.size, { ref: gal.ref, metric: gal.metric, preset: gal.preset, period: 12 }) + '</span></div>' +
        '<button type="button" class="icon-btn" data-act="galSize" data-d="1" aria-label="Larger size"' + (gal.size === sizes[sizes.length - 1] ? ' disabled' : '') + '><span class="material-symbols-outlined ico" aria-hidden="true">chevron_right</span></button></div>' +
        '<div class="gdots" aria-hidden="true">' + sizes.map(function (s) { return '<span class="' + (s === gal.size ? 'on' : '') + '"></span>'; }).join('') + '</div>' +
        '<div class="gsizes" role="group" aria-label="Widget size" id="galSizes">' + sizes.map(function (s) { return '<button type="button" data-act="galSet" data-s="' + s + '" aria-pressed="' + (s === gal.size) + '">' + SZ_NAME[s] + '</button>'; }).join('') + '</div>' +
        (canStack ? '<div class="gstack" id="galStack" role="group" aria-label="Where to add it"><button type="button" class="chip" data-act="galStack" data-w="" aria-pressed="' + !gal.toStack + '">On its own</button>' +
          avail.map(function (x) { return '<button type="button" class="chip" data-act="galStack" data-w="' + x.id + '" aria-pressed="' + (gal.toStack === x.id) + '">Add to ' + esc(x.name) + ' stack</button>'; }).join('') + '</div>' : '') +
        '<button type="button" class="btn btn--primary btn--block" id="galAdd" data-act="galAdd">' + icon('plus') + (gal.mode === 'add' ? 'Add Widget' : 'Done') + '</button></div>';
    }
    root.innerHTML = '<div class="sheet-wrap" data-act="closeOverlayBg"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="galH">' + html + '</div></div>';
    var qi = $('#galQ');
    if (qi) qi.addEventListener('input', function (e) { root._galQ = e.target.value; var pos = e.target.selectionStart; renderGallery(); var n = $('#galQ'); n.focus(); n.setSelectionRange(pos, pos); });
    if (!root.contains(document.activeElement)) { var f = $('.sheet button, .sheet input', root); if (f) f.focus(); }
  }
  /* where a widget being added or edited will sit, so the size picker offers that place's sizes */
  function galCtx() {
    if (gal && gal.mode === 'edit') { var f = findItem(gal.wid); if (f) return ctxOf(f.it); }
    return 'main';
  }
  /* small gallery tile previews: KPI and quick-action cards draw themselves; larger panels show an icon */
  var DASH_ICON = { hero: 'pets', trend: 'show_chart', activity: 'history', planning: 'checklist', attention: 'priority_high', sites: 'location_on', team: 'groups', helpcard: 'support_agent' };
  function dashPreview(d) {
    if (d.type === 'kpi' || d.type === 'action') return widgetBody(d.type, 'S', d);
    return '<span class="gprev__dash gprev__dash--' + d.type + '"><span class="material-symbols-outlined">' + DASH_ICON[d.type] + '</span></span>';
  }
  function galDashEntries() {
    var out = [{ type: 'hero' }, { type: 'trend', metric: 'health' }];
    (DATA ? DATA.kpis : []).forEach(function (k) { out.push({ type: 'kpi', metric: k }); });
    Object.keys(ACTIONS).forEach(function (k) { out.push({ type: 'action', preset: k }); });
    ['activity', 'planning', 'attention', 'sites', 'team', 'helpcard'].forEach(function (t) { out.push({ type: t }); });
    return out;
  }
  function openStackSheet(wid) {
    setOpener(); closeOverlay(true); S.overlay = 'stack';
    S.stackW = wid || S.stackW || 'w1';
    var f = findItem(S.stackW); if (!f) return; var st = f.it;
    root.innerHTML = '<div class="sheet-wrap" data-act="closeOverlayBg"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="stkH"><div class="sheet__grip" aria-hidden="true"></div>' +
      '<div class="sheet__hd"><h2 id="stkH">Edit ' + esc(st.name) + ' stack</h2><button type="button" class="pill-btn pill-btn--dark" data-act="closeOverlay">Done</button></div>' +
      '<ul class="stack-list">' + st.items.map(function (t, i) {
        return '<li><button type="button" class="rm" style="display:grid;position:static" data-act="stackRm" data-i="' + i + '" aria-label="Remove ' + esc(entryName(t)) + ' from stack"' + (st.items.length < 2 ? ' disabled' : '') + '>−</button><span class="name">' + esc(entryName(t)) + '</span>' +
          (i ? '<button type="button" class="btn btn--ghost btn--sm" data-act="stackUp" data-i="' + i + '">Move up</button>' : '') + '</li>';
      }).join('') + '</ul>' +
      '<div class="stack-opts"><button type="button" class="switch" data-act="smart" aria-pressed="' + S.smartRotate + '"><span class="sw" aria-hidden="true"></span>Smart Rotate</button><button type="button" class="switch" data-act="sugg" aria-pressed="' + S.suggestions + '"><span class="sw" aria-hidden="true"></span>Widget Suggestions</button></div>' +
      '<button type="button" class="btn btn--ghost btn--block" data-act="stackAdd">' + icon('plus') + 'Add a widget to this stack</button></div></div>';
    $('.sheet button', root).focus(); syncInert(); updateTitle();
  }

  /* Photo credits: attribution required by CC BY / CC BY-SA photos (config.credits) */
  function openCredits() {
    closeOverlay(true); opener = document.querySelector('[data-act="profile"]') || document.activeElement; S.overlay = 'credits';
    var cr = CFG.credits || [];
    root.innerHTML = '<div class="sheet-wrap" data-act="closeOverlayBg"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="crH"><div class="sheet__grip" aria-hidden="true"></div>' +
      '<div class="sheet__hd"><h2 id="crH">Photo credits</h2><button type="button" class="pill-btn pill-btn--dark" data-act="closeOverlay">Done</button></div>' +
      '<p class="credits__note">Photos from Wikimedia Commons, used under the licences below. Some were cropped and resized.</p>' +
      '<ul class="credits">' + cr.map(function (c) {
        return '<li><span class="ph media credits__th"><img src="assets/img/' + esc(c.file) + '" alt="" loading="lazy" onerror="this.remove()"></span><div><b>' + esc(c.subject) + '</b>' +
          '<small><a href="' + esc(c.source) + '" target="_blank" rel="noopener noreferrer">Photo: ' + esc(c.author) + '</a>, <a href="' + esc(c.licenceUrl) + '" target="_blank" rel="noopener noreferrer license">' + esc(c.licence) + '</a></small></div></li>';
      }).join('') + '</ul></div></div>';
    $('.sheet button', root).focus(); syncInert(); updateTitle();
  }

  /* Notification Center */
  function openNC() {
    closeOverlay(true); opener = document.activeElement; S.overlay = 'nc';
    renderNC(); syncInert(); updateTitle();
  }
  function renderNC() {
    var groups = NOTIFS.map(function (g, gi) {
      var a = app(g.app), ex = S.nExpanded[gi], show = ex ? g.items : g.items.slice(0, 1);
      return '<li class="ngroup' + (a.core ? ' is-core' : '') + '"><div class="nstack' + (!ex && g.items.length > 1 ? ' is-stacked' : '') + '">' + show.map(function (n, k) {
        return '<button type="button" class="ncard" data-act="nOpen" data-g="' + gi + '" data-k="' + k + '">' + appIc(a, false) + '<b>' + esc(n[0]) + '</b><small>' + n[2] + ' ago</small><p>' + esc(n[1]) + '</p><span class="vh">, ' + esc(a.name) + '</span></button>';
      }).join('') + '</div>' + (g.items.length > 1 ? '<button type="button" class="nmore" data-act="nToggle" data-g="' + gi + '" aria-expanded="' + !!ex + '">' + (ex ? 'Show less' : '+' + (g.items.length - 1) + ' more from ' + esc(a.name)) + '</button>' : '') + '</li>';
    }).join('');
    var keepFocus = document.activeElement && root.contains(document.activeElement) ? document.activeElement.dataset : null;
    root.innerHTML = '<div class="nc"><div class="nc__scrim" data-act="closeOverlay"></div><section class="nc__panel" role="dialog" aria-modal="true" aria-labelledby="ncH">' +
      '<div class="nc__scroll"><div class="nc__date"><b>3:50</b><span>Thursday 29 October</span></div>' +
      '<div class="nc__hd"><h2 id="ncH">Notification Center</h2>' + (NOTIFS.length ? '<button type="button" class="pill-btn" id="ncClear" data-act="nClear">Clear</button>' : '') + '<button type="button" class="round-btn" data-act="closeOverlay" aria-label="Close Notification Center">' + icon('x', '') + '</button></div>' +
      (NOTIFS.length ? '<ul>' + groups + '</ul>' : '<p class="muted" style="text-align:center;padding:30px 0">No older notifications</p>') + '</div>' +
      '<div class="nc__foot"><button type="button" id="ncScan" data-act="scan"><span class="circle">' + icon('scan', '') + '</span>Scan</button><button type="button" id="ncQA" data-act="quick"><span class="circle">' + icon('bolt', '') + '</span>Quick action</button></div></section></div>';
    if (keepFocus && keepFocus.act === 'nToggle') { var b = $('[data-act="nToggle"][data-g="' + keepFocus.g + '"]', root); if (b) { b.focus(); return; } }
    ($('.ncard', root) || $('[data-act="closeOverlay"].round-btn', root)).focus();
  }

  /* Spotlight search */
  var spotRes = [];
  function openSpot(q) {
    closeOverlay(true); opener = document.activeElement; S.overlay = 'search';
    root.innerHTML = '<div class="spot" role="dialog" aria-modal="true" aria-labelledby="spotH"><div class="spot__in"><h2 id="spotH" class="vh">Search</h2>' +
      '<div class="spot__bar"><label class="search search--pill" id="spotQBox"><span class="material-symbols-outlined ico ico--sm" aria-hidden="true">search</span><span class="vh">Search ANTZ</span><input type="search" id="spotQ" placeholder="Search modules, species, animals, notes" autocomplete="off"></label><button type="button" class="link" id="spotCancel" data-act="closeOverlay">Cancel</button></div>' +
      '<div id="spotOut" aria-live="polite"></div></div></div>';
    var inp = $('#spotQ'); inp.value = q || ''; inp.focus();
    inp.addEventListener('input', renderSpot);
    renderSpot(); syncInert(); updateTitle();
  }
  function hl(t, q) { if (!q) return esc(t); var i = t.toLowerCase().indexOf(q); if (i < 0) return esc(t); return esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + q.length)) + '</mark>' + esc(t.slice(i + q.length)); }
  var QACTS = CFG.quickActions.map(function (q) { return [q.label, q.module, q.open]; });
  function renderSpot() {
    var q = ($('#spotQ').value || '').trim().toLowerCase();
    spotRes = [];
    var add = function (fn) { spotRes.push(fn); return spotRes.length - 1; };
    var out = '';
    if (!q) {
      out += '<h2>Suggested modules</h2><div class="spot__apps" id="spotSuggest">' + CFG.searchSuggestions.map(function (id) {
        var a = app(id), i = add(function () { openApp(id); });
        return '<div class="app-cell' + (a.core ? ' is-core' : '') + '"><button type="button" class="app" data-spot="' + i + '">' + appIc(a, true) + '<span class="app__lbl">' + esc(a.name) + '</span></button></div>';
      }).join('') + '</div>';
      out += '<h2>Quick actions</h2><ul class="spot__list" id="spotQA">' + QACTS.map(function (x) {
        var i = add(function () { openApp(x[1], x[2]); if (!x[2]) toast(x[0]); });
        return '<li><button type="button" data-spot="' + i + '"><span class="app__ic" style="--ic:34px">' + icon('plus', '') + '</span><span class="t">' + esc(x[0]) + '<small>' + esc(app(x[1]).name) + '</small></span></button></li>';
      }).join('') + '</ul>';
    } else {
      var sec = function (title, rows) { return rows.length ? '<h2>' + title + '</h2><ul class="spot__list">' + rows.join('') + '</ul>' : ''; };
      var apps = APPS.filter(function (a) { return (a.name + ' ' + a.sub).toLowerCase().indexOf(q) > -1; }).map(function (a) {
        var i = add(function () { openApp(a.id); });
        return '<li><button type="button" data-spot="' + i + '">' + appIc(a, false) + '<span class="t">' + hl(a.name, q) + '<small>' + esc(a.sub) + '</small></span></button></li>';
      });
      var sps = SPECIES.filter(function (s) { return (s.n + ' ' + s.s).toLowerCase().indexOf(q) > -1; }).map(function (s) {
        var i = add(function () { openApp('collections', { level: 'species', species: s.i }); });
        return '<li><button type="button" data-spot="' + i + '"><span class="ph"></span><span class="t">' + hl(s.n, q) + '<small><i>' + esc(s.s) + '</i> · Species</small></span></button></li>';
      });
      var ans = ANIMALS.map(function (a, k) { return Object.assign({ k: k }, a); }).filter(function (a) { return (a.n + ' ' + a.id).toLowerCase().indexOf(q) > -1; }).map(function (a) {
        var i = add(function () { openApp('collections', { level: 'animal', species: 0, animal: a.k }); });
        return '<li><button type="button" data-spot="' + i + '"><span class="ph"></span><span class="t">' + hl(a.n + ' · ' + a.id, q) + '<small>Persian Leopard · Animal</small></span></button></li>';
      });
      var nts = NOTES.filter(function (n) { return n.t.toLowerCase().indexOf(q) > -1; }).map(function (n) {
        var i = add(function () { S.noteQ = n.t; openApp('notes'); $('#noteQ').value = n.t; renderNotesScreen(); });
        return '<li><button type="button" data-spot="' + i + '"><span class="ph ph--warn"></span><span class="t">' + hl(n.t, q) + '<small>Note · ' + esc(n.coll) + '</small></span></button></li>';
      });
      out = sec('Modules', apps) + sec('Species', sps) + sec('Animals', ans) + sec('Notes', nts);
      if (!out) out = '<p class="muted" style="text-align:center;padding:24px">No results for “' + esc(q) + '”.</p>';
    }
    $('#spotOut').innerHTML = out;
  }

  /* ================= APP LAUNCH ================= */
  /* ---- app screens: one entry per <section data-screen="id"> in index.html.
     open(options) runs every time that app is launched. A module without an entry opens its Large stats view. ---- */
  var SCREENS = {
    notes: { open: function () { /* list keeps its filters */ } },
    collections: { open: function (o) { setLevel(o.level || 'module', o); } },
    announcements: { open: function (o) { if (o.ann != null) openAnn(+o.ann); else closeAnn(); } },
    communication: { open: function (o) { if (o.chat != null) openChat(+o.chat); else closeChat(); } },
    focus: { open: function (o) { var t = $('#focusTabs [data-value="' + (o.tab || 'all') + '"]'); if (t) selectTab(t); } },
    help: { open: function (o) { if (o.form) openTicket(); else closeTicket(); } }
  };
  var appOpener = null;
  function openApp(id, o, originEl) {
    o = o || {};
    var a = app(id); if (!a) return;
    closeOverlay(true); if (S.drawer) closeDrawer(true);
    if (S.editing) { S.editing = false; ui.classList.remove('editing'); renderHome(); }
    var wasOpen = !!S.app;
    S.app = id;
    appOpener = originEl || appOpener;
    var scr = SCREENS[id] ? id : 'generic';
    $$('#appBody .screen').forEach(function (el) { el.hidden = el.dataset.screen !== scr; });
    if (scr === 'generic') {
      $('#genSub').textContent = a.sub + '.';
      $('#genStats').innerHTML = '<div class="wg statpanel"><div class="wg__btn">' + widgetBody(id, 'L') + '</div></div>';
      $('#genActs').innerHTML = quickActions(id).slice(0, 1).map(function (q) { return '<button type="button" class="btn btn--primary" data-act="toast" data-msg="' + esc(q[0]) + '">' + icon('plus') + esc(q[0].replace(/^Open /, 'Open ')) + '</button>'; }).join('');
    }
    $('#appTitle').textContent = a.name;
    $('#appIc').innerHTML = glyph(a);
    $('#appIc').setAttribute('style', tileStyle(a).slice(7, -1));
    $('#appPin').dataset.pin = id; $('#appPin').setAttribute('aria-pressed', String(isPinned(id)));
    $('#appPin').setAttribute('aria-label', 'Pin ' + a.name + ' to the sidebar');
    $('#appMore').dataset.more = 'app:' + id; $('#appMore').setAttribute('aria-label', 'More options for ' + a.name);
    var aw = $('#appwin');
    aw.hidden = false; ui.classList.add('app-open');
    if (!wasOpen && originEl && !reduceMotion) {
      var r = originEl.getBoundingClientRect(), wr = aw.getBoundingClientRect();
      aw.style.transformOrigin = (r.left + r.width / 2 - wr.left) + 'px ' + (r.top + r.height / 2 - wr.top) + 'px';
      aw.classList.remove('is-opening'); void aw.offsetWidth; aw.classList.add('is-opening');
    }
    if (SCREENS[id]) SCREENS[id].open(o);
    $('#appBody').scrollTop = 0;
    updateAppHeader(); syncInert(); renderSide();
    $('#appTitle').focus({ preventScroll: true });
    updateTitle();
  }
  function closeApp(silent) {
    if (!S.app) return;
    var id = S.app; S.app = null;
    $('#appwin').hidden = true; ui.classList.remove('app-open'); $('#appwin').classList.remove('is-thread');
    syncInert(); renderSide();
    if (silent) { updateTitle(); return; }
    var cand = $$('[data-open="' + id + '"]').filter(function (b) { return !b.closest('[inert]') && b.getClientRects().length; })[0];
    (cand || $('#hSearch')).focus({ preventScroll: true });
    updateTitle();
  }
  var backFn = null;
  function updateAppHeader() {
    var w = window.innerWidth, cfg = null;
    if (S.app === 'collections' && S.level === 'species') cfg = ['Collections', function () { setLevel('module', {}); focusLevel(); }];
    if (S.app === 'collections' && S.level === 'animal') cfg = [SPECIES[S.species].n, function () { setLevel('species', {}); focusLevel(); }];
    if (S.app === 'announcements' && w < 1240 && $('#annSplit').classList.contains('is-open')) cfg = ['Announcements', function () { var i = S.ann; closeAnn(); refocus('[data-act="annOpen"][data-i="' + i + '"]'); }];
    if (S.app === 'communication' && w <= 640 && $('#chat').classList.contains('is-open')) cfg = ['Chats', function () { var i = S.chat; closeChat(); refocus('[data-act="chatOpen"][data-i="' + i + '"]'); }];
    var title = app(S.app).name;
    if (S.app === 'collections' && S.level === 'species') title = SPECIES[S.species].n;
    if (S.app === 'collections' && S.level === 'animal') { var al = animalsFor(SPECIES[S.species]); title = (al[S.animal] || al[0]).n; }
    $('#appTitle').textContent = title;
    var b = $('#appBack'); b.hidden = !cfg; backFn = cfg ? cfg[1] : null;
    if (cfg) b.lastChild.textContent = cfg[0];
    b.setAttribute('aria-label', cfg ? 'Back to ' + cfg[0] : 'Back');
  }
  function focusLevel() { var h = S.level === 'species' ? $('#h-sp') : S.level === 'animal' ? $('#h-an') : $('#appTitle'); if (h) h.focus({ preventScroll: true }); }

  /* ================= APP CONTENT (kept from v0.1) ================= */
  function saveBtns(k, label) {
    var s = SAVE[k] || {};
    return '<button type="button" class="mini" data-save="liked" data-key="' + k + '" aria-pressed="' + !!s.liked + '" aria-label="Like ' + esc(label) + '">' + icon('heart') + '</button>' +
      '<button type="button" class="mini" data-save="bm" data-key="' + k + '" aria-pressed="' + !!s.bm + '" aria-label="Bookmark ' + esc(label) + '">' + icon('bookmark') + '</button>' +
      '<button type="button" class="mini" data-act="itemWidget" data-key="' + k + '" aria-label="Add ' + esc(label) + ' to Home Screen as widget">' + icon('widgets') + '</button>';
  }
  /* item widgets on the home screen that point at a Focus Hub key */
  function itemWidgetsFor(k) {
    var n = 0;
    LAYOUT.forEach(function (x) { if (x.ref === k) n++; if (x.type === 'stack') x.items.forEach(function (e) { if (e && e.ref === k) n++; }); });
    return n;
  }
  function removeItemWidgets(k) {
    LAYOUT = LAYOUT.filter(function (x) {
      if (x.ref === k) return false;
      if (x.type === 'stack') { x.items = x.items.filter(function (e) { return !(e && e.ref === k); }); x.idx = 0; return x.items.length > 0; }
      return true;
    });
    saveLayout(); renderHome();
  }
  /* un-saving keeps any widgets, but offers to remove them too */
  function offerWidgetRemoval(k) {
    if (!itemWidgetsFor(k)) return false;
    toast('Removed from Focus Hub. The widget is still on your Home Screen.', 'Remove widget too', function () { removeItemWidgets(k); toast('Widget removed'); });
    return true;
  }
  function unsaveItem(k) {
    var s = SAVE[k]; if (!s) return;
    s.liked = false; s.bm = false;
    $$('[data-key="' + k + '"][data-save]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    renderFocusCounts(); renderHome(); if (S.app === 'focus') renderFocus();
    if (!offerWidgetRemoval(k)) toast('Removed from Focus Hub');
  }
  function toggleSave(k, field, btn, silent) {
    var s = SAVE[k]; if (!s) return;
    s[field] = !s[field];
    $$('[data-key="' + k + '"][data-save="' + field + '"]').forEach(function (b) { b.setAttribute('aria-pressed', String(s[field])); });
    renderFocusCounts(); renderHome();
    if (S.app === 'focus') renderFocus();
    if (silent) return;
    if (!s.liked && !s.bm && offerWidgetRemoval(k)) return;
    var what = field === 'liked' ? 'Liked' : 'Bookmarks';
    if (S.app === 'focus') {
      if (btn && !document.contains(btn)) $('#focusTabs [aria-selected="true"]').focus();
      toast(s[field] ? 'Added to ' + what : 'Removed from ' + what, s[field] ? null : 'Undo', s[field] ? null : function () { toggleSave(k, field, null, true); });
    } else toast(s[field] ? 'Added to ' + what + ' in Focus Hub' : 'Removed from ' + what);
  }
  function renderFocusCounts() { var c = counts(); $('#cAll').textContent = '(' + c.all + ')'; $('#cLiked').textContent = '(' + c.liked + ')'; $('#cBm').textContent = '(' + c.bm + ')'; }

  function renderNotesScreen() {
    $('#noteColls').innerHTML = NOTE_COLLS.map(function (c) {
      var n = c === 'All notes' ? NOTES.length : c === 'Shared with me' ? 2 : NOTES.filter(function (x) { return x.coll === c; }).length;
      return '<li><button type="button" class="side-item" data-act="noteColl" data-coll="' + esc(c) + '" aria-pressed="' + (S.noteColl === c) + '"><span>' + esc(c) + '</span><span class="count">' + n + '</span></button></li>';
    }).join('');
    $('#noteTypes').innerHTML = NOTE_TYPES.map(function (t) { return '<button type="button" class="chip" data-act="noteType" data-type="' + t + '" aria-pressed="' + (S.noteTypes.indexOf(t) > -1) + '">' + t + '</button>'; }).join('');
    var q = S.noteQ.toLowerCase();
    var list = NOTES.map(function (n, i) { return Object.assign({ i: i }, n); }).filter(function (n) {
      if (S.noteColl === 'Shared with me') return n.i === 1 || n.i === 5;
      if (S.noteColl !== 'All notes' && n.coll !== S.noteColl) return false;
      if (S.noteTypes.length && S.noteTypes.indexOf(n.type) < 0) return false;
      if (q && (n.t + ' ' + n.tags.join(' ') + ' ' + n.by).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    if (S.noteSort === 'Oldest first') list.sort(function (a, b) { return a.n - b.n; });
    else if (S.noteSort === 'A-Z') list.sort(function (a, b) { return a.t.localeCompare(b.t); });
    else list.sort(function (a, b) { return b.n - a.n; });
    $('#noteCount').textContent = list.length + (list.length === 1 ? ' note' : ' notes');
    $('#noteGrid').innerHTML = list.length ? list.map(function (n) {
      return '<li class="note" data-tone="' + n.type + '"><div class="note__top"><span class="tag">' + n.type + '</span><span class="ell">' + icon('folder') + ' ' + esc(n.coll) + '</span></div><h3>' + esc(n.t) + '</h3>' +
        '<div class="note__tags">' + n.tags.map(function (t) { return '<span class="tag tag--dash">' + esc(t) + '</span>'; }).join('') + '</div><div><span class="bar b100"></span><span class="bar b70"></span></div>' +
        '<div class="note__ft"><span class="av" aria-hidden="true">' + initials(n.by) + '</span><span class="meta ell">' + esc(n.by) + ' · ' + n.d + '</span><span class="acts">' + saveBtns('nt:' + n.i, n.t) + '</span></div></li>';
    }).join('') : '<li class="empty-sm">No notes match. Clear a filter or pick another collection.</li>';
  }
  function renderSpeciesGrid() {
    $('#spClasses').innerHTML = CLASSES.map(function (c) { return '<button type="button" class="chip" data-act="spClass" data-c="' + c + '" aria-pressed="' + (S.spClass === c) + '">' + c + '</button>'; }).join('');
    var q = S.spQ.toLowerCase();
    var list = SPECIES.filter(function (s) { return (S.spClass === 'All' || s.c === S.spClass) && (!q || (s.n + ' ' + s.s).toLowerCase().indexOf(q) > -1); })
      .slice().sort(S.spSort === 'az' ? function (a, b) { return a.n.localeCompare(b.n); } : function (a, b) { return b.a - a.a; });
    $('#spCount').textContent = list.length + ' of 2,411 species (sample)';
    $('#spGrid').innerHTML = list.length ? list.map(function (s) {
      return '<li class="sp-card"><button type="button" class="sp-card__open" data-act="lvl" data-level="species" data-species="' + s.i + '">' + media(s.n, s.n) + '<span class="sp-card__n">' + esc(s.n) + '</span><span class="sp-card__s">' + esc(s.s) + '</span>' +
        '<span class="sp-card__m"><span>' + s.a + ' animals · ' + s.sites + (s.sites === 1 ? ' site' : ' sites') + '</span><span class="tag">' + s.c + '</span></span></button><span class="acts">' + saveBtns('sp:' + s.i, s.n) + '</span></li>';
    }).join('') : '<li class="empty-sm">No species match “' + esc(S.spQ) + '”.</li>';
  }
  function renderSpecies() {
    var sp = SPECIES[S.species] || SPECIES[0];
    $$('.spName').forEach(function (el) { el.textContent = sp.n; });
    $('#spSci').textContent = sp.s;
    $('#spProfile > .ph').outerHTML = media(sp.n, sp.n + ' (' + sp.s + ')');
    $$('.spActs').forEach(function (el) { el.innerHTML = saveBtns('sp:' + sp.i, sp.n); });
    $('#spFacts').innerHTML = [['Class', sp.c], ['IUCN status', sp.iucn], ['Animals', sp.a], ['Sites', sp.sites], ['Enclosures', sp.sites + 2]].map(function (f) { return '<dt>' + f[0] + '</dt><dd>' + f[1] + '</dd>'; }).join('');
    $('#anSex').innerHTML = ['All', 'Male', 'Female'].map(function (x) { return '<button type="button" class="chip" data-act="anSex" data-sex="' + x + '" aria-pressed="' + (S.anSex === x) + '">' + x + '</button>'; }).join('');
    var q = S.anQ.toLowerCase();
    var list = animalsFor(sp).map(function (a, i) { return Object.assign({ i: i }, a); }).filter(function (a) { return (S.anSex === 'All' || a.sex === S.anSex) && (!q || (a.n + ' ' + a.id).toLowerCase().indexOf(q) > -1); });
    $('#anCount').textContent = list.length + ' animals';
    $('#anGrid').innerHTML = list.length ? list.map(function (a) {
      return '<li><button type="button" class="an-card" data-act="lvl" data-level="animal" data-species="' + sp.i + '" data-animal="' + a.i + '">' + media(a.id, a.n + ', ' + sp.n) + '<span class="ell"><b class="ell">' + esc(a.n) + '</b><small>' + a.id + ' · ' + a.sex + ' · ' + a.age + '</small><small class="ell">' + esc(a.enc) + '</small></span>' +
        '<span class="tag' + (a.st === 'Under treatment' ? ' tag--alert' : '') + '">' + a.st + '</span></button></li>';
    }).join('') : '<li class="empty-sm">No animals match.</li>';
  }
  function renderAnimal() {
    var sp = SPECIES[S.species] || SPECIES[0], all = animalsFor(sp), a = all[S.animal] || all[0];
    regAnimal(sp.i, S.animal);
    var k = 'an:' + sp.i + ':' + S.animal;
    $('#anProfile > .ph').outerHTML = media(a.id, a.n + ', ' + sp.n);
    $$('.spName').forEach(function (el) { el.textContent = sp.n; });
    $$('.anName').forEach(function (el) { el.textContent = a.n; });
    $('#anIdH').textContent = a.id; $('#anStatusH').textContent = a.st;
    $$('.anActs').forEach(function (el) { el.innerHTML = saveBtns(k, a.n); });
    $('#anFacts').innerHTML = [['ID', a.id], ['Sex', a.sex], ['Age', a.age], ['Enclosure', a.enc], ['Site', a.site], ['Microchip', '•••• 4471']].map(function (f) { return '<dt>' + f[0] + '</dt><dd>' + esc(f[1]) + '</dd>'; }).join('');
    var rel = all.map(function (x, i) { return Object.assign({ i: i }, x); }).filter(function (x) { return x.i !== S.animal; }).slice(0, 3), roles = ['Sibling', 'Mother', 'Same enclosure'];
    $('#anRel').innerHTML = rel.map(function (x, j) { return '<li><button type="button" data-act="lvl" data-level="animal" data-species="' + sp.i + '" data-animal="' + x.i + '"><span class="ph" aria-hidden="true"></span><span class="ell" style="flex:1"><b>' + esc(x.n) + '</b> <span class="muted">· ' + roles[j] + '</span></span>' + icon('right') + '</button></li>'; }).join('');
  }
  function setLevel(level, o) {
    o = o || {};
    if (o.species != null && +o.species !== S.species) { S.anSex = 'All'; S.anQ = ''; $('#anQ').value = ''; }
    S.level = level;
    if (o.species != null) S.species = +o.species;
    if (o.animal != null) S.animal = +o.animal;
    $$('[data-screen="collections"] .level').forEach(function (el) { el.hidden = el.dataset.level !== level; });
    if (level === 'species') renderSpecies();
    if (level === 'animal') renderAnimal();
    $('#appBody').scrollTop = 0;
    updateAppHeader(); updateTitle();
  }

  var ANN_FILTERS = ['All', 'Important', 'My teams', 'Unread'];
  function renderAnnList() {
    $('#annFilters').innerHTML = ANN_FILTERS.map(function (f) { return '<button type="button" class="chip" data-act="annFilter" data-f="' + f + '" aria-pressed="' + (S.annFilter === f) + '">' + f + '</button>'; }).join('');
    var list = ANN.map(function (a, i) { return Object.assign({ i: i }, a); }).filter(function (a) { return S.annFilter === 'All' || (S.annFilter === 'Important' && a.important) || (S.annFilter === 'My teams' && a.team) || (S.annFilter === 'Unread' && a.unread); });
    $('#annList').innerHTML = list.map(function (a) {
      return '<li><button type="button" class="ann-item' + (a.important ? ' is-important' : '') + '" data-act="annOpen" data-i="' + a.i + '"' + (a.i === S.ann ? ' aria-current="true"' : '') + '><span class="ph' + (a.important ? ' ph--warn' : '') + '" aria-hidden="true"></span>' +
        '<span><span class="tag' + (a.important ? ' tag--warn' : '') + '">' + (a.important ? 'Important' : 'Announcement') + '</span><b style="margin-top:4px">' + esc(a.t) + '</b><small>' + esc(a.by) + ' · ' + a.d + '</small></span>' +
        (a.unread ? '<span class="unread" aria-hidden="true"></span><span class="vh">, unread</span>' : '') + '</button></li>';
    }).join('') || '<li class="empty-sm">Nothing here.</li>';
  }
  function renderAnnRead() {
    var a = ANN[S.ann];
    $('#annRead').classList.toggle('is-important', !!a.important);
    $('#annReadBody').innerHTML = (a.important ? '<span class="ph ph--warn" aria-hidden="true">' + icon('warn', '') + '</span>' : media('announcement:' + S.ann, a.t)) + '<span class="tag' + (a.important ? ' tag--warn' : '') + '">' + (a.important ? 'Important' : 'Announcement') + '</span>' +
      '<h2 id="annReadT" tabindex="-1">' + esc(a.t) + '</h2><p class="ann__by"><span class="av">' + initials(a.by) + '</span>' + esc(a.by) + ' · ' + a.d + '</p>' +
      '<div class="body"><span class="bar b100"></span><span class="bar b90"></span><span class="bar b100"></span><span class="bar b60"></span></div>' +
      '<div class="read-acts" id="annActs"><span class="acts">' + saveBtns('ac:' + S.ann, a.t) + '</span>' + (a.important ? '<button type="button" class="btn btn--primary btn--sm" data-act="toast" data-msg="Acknowledged · the admin can see who has read this">Acknowledge</button>' : '') +
      '<button type="button" class="btn btn--ghost btn--sm" data-act="toast" data-msg="Share to a chat">Share</button></div>';
  }
  function openAnn(i) {
    S.ann = i; if (ANN[i].unread) { ANN[i].unread = false; var aa = app('announcements'); aa.badge = ANN.filter(function (x) { return x.unread; }).length || 0; renderHome(); }
    renderAnnList(); renderAnnRead(); $('#annSplit').classList.add('is-open'); updateAppHeader();
    if (window.innerWidth < 1240) { var h = $('#annReadT'); if (h) h.focus(); }
    updateTitle();
  }
  function closeAnn() { $('#annSplit').classList.remove('is-open'); renderAnnList(); renderAnnRead(); updateAppHeader(); updateTitle(); }

  function renderConvos() {
    var list = CHATS.map(function (c, i) { return Object.assign({ i: i }, c); }).filter(function (c) { return S.chatFilter === 'all' || c.group; });
    $('#convoList').innerHTML = list.map(function (c) {
      return '<li><button type="button" class="convo" data-act="chatOpen" data-i="' + c.i + '"' + (c.i === S.chat ? ' aria-current="true"' : '') + '><span class="av" aria-hidden="true">' + initials(c.n) + '</span><span style="min-width:0"><b>' + esc(c.n) + '</b><small>' + esc(c.last) + '</small></span>' +
        '<span class="side">' + c.time + (c.unread ? '<span class="badge" aria-label="' + c.unread + ' unread">' + c.unread + '</span>' : '') + '</span></button></li>';
    }).join('');
  }
  function renderThread() {
    var c = CHATS[S.chat];
    $('#thName').textContent = c.n; $('#thSub').textContent = c.sub; $('#thAv').textContent = initials(c.n);
    var msgs = c.msgs || [[c.n.split(' ')[0], c.last, '08:30'], ['me', '', '08:34'], [c.n.split(' ')[0], '', '08:41']];
    $('#msgs').innerHTML = '<span class="day">Today</span>' + msgs.map(function (m) {
      var me = m[0] === 'me';
      var body = m[1] ? esc(m[1]) : '<span class="bar" style="width:160px;background:' + (me ? 'color-mix(in srgb, var(--md-sys-color-on-primary) 45%, transparent)' : '') + '"></span><span class="bar" style="width:110px;background:' + (me ? 'color-mix(in srgb, var(--md-sys-color-on-primary) 45%, transparent)' : '') + '"></span>';
      return '<div class="msg' + (me ? ' msg--me' : '') + '">' + (me || !c.group ? '' : '<b style="font-size:12px;display:block">' + esc(m[0]) + '</b>') + body + (m[3] ? '<span class="ph" aria-hidden="true"></span>' : '') + '<small>' + (me ? 'You · ' : '') + m[2] + '</small></div>';
    }).join('');
    var mem = c.group ? ['Roshni Shenoy', 'Kai Vance', 'Kunal Singh', 'Jordan Brenner', '+ 8 more'] : ['Roshni Shenoy', c.n];
    $('#chatMembers').innerHTML = mem.map(function (m) { return '<li><span class="av" aria-hidden="true">' + (m[0] === '+' ? '+' : initials(m)) + '</span>' + esc(m) + '</li>'; }).join('');
  }
  function openChat(i) {
    S.chat = i; CHATS[i].unread = 0;
    var cm = app('communication'); cm.badge = CHATS.reduce(function (s, c) { return s + c.unread; }, 0); renderHome();
    renderConvos(); renderThread(); $('#chat').classList.add('is-open');
    $('#appwin').classList.toggle('is-thread', isMobile());
    updateAppHeader();
    $('#composeIn').focus({ preventScroll: true });
    updateTitle();
  }
  function closeChat() { $('#chat').classList.remove('is-open', 'is-info'); $('#appwin').classList.remove('is-thread'); renderConvos(); renderThread(); updateAppHeader(); updateTitle(); }

  var FOCUS_TYPES = ['All', 'Species', 'Animal', 'Note', 'Announcement'];
  function renderFocus() {
    $('#folderList').innerHTML = FOLDERS.map(function (f) {
      var n = f === 'All folders' ? '' : Object.keys(SAVE).filter(function (k) { return SAVE[k].folder === f && (SAVE[k].liked || SAVE[k].bm); }).length;
      return '<li><button type="button" class="side-item" data-act="folder" data-f="' + esc(f) + '" aria-pressed="' + (S.folder === f) + '"><span>' + icon('folder') + ' ' + esc(f) + '</span><span class="count">' + n + '</span></button></li>';
    }).join('');
    $('#focusTypes').innerHTML = FOCUS_TYPES.map(function (t) { return '<button type="button" class="chip" data-act="focusType" data-t="' + t + '" aria-pressed="' + (S.focusType === t) + '">' + (t === 'All' ? 'All types' : t === 'Species' ? 'Species' : t + 's') + '</button>'; }).join('');
    var items = Object.keys(SAVE).map(function (k) { return Object.assign({ k: k }, SAVE[k]); }).filter(function (x) {
      if (S.focusTab === 'liked' && !x.liked) return false;
      if (S.focusTab === 'bm' && !x.bm) return false;
      if (S.focusTab === 'all' && !x.liked && !x.bm) return false;
      if (S.focusType !== 'All' && x.type !== S.focusType) return false;
      if (S.folder !== 'All folders' && x.folder !== S.folder) return false;
      return true;
    });
    $('#focusCount').textContent = items.length + (items.length === 1 ? ' item' : ' items');
    $('#savedGrid').innerHTML = items.length ? items.map(function (x) {
      var pk = x.k.split(':'), mk = pk[0] === 'sp' ? SPECIES[+pk[1]].n : pk[0] === 'an' ? animalsFor(SPECIES[+pk[1]])[+pk[2]].id : pk[0] === 'ac' ? 'announcement:' + pk[1] : '';
      return '<li class="saved">' + (mk ? media(mk, x.t) : '<span class="ph ph--warn" aria-hidden="true"></span>') + '<span><span class="tag">' + x.type + '</span></span><h3>' + esc(x.t) + '</h3><p class="ell">' + esc(x.sub) + '</p>' +
        '<div class="saved__acts">' + saveBtns(x.k, x.t) + '<button type="button" class="mini" data-more="item:' + x.k + '" aria-haspopup="menu" aria-label="More options for ' + esc(x.t) + '">' + icon('more') + '</button><button type="button" class="btn btn--ghost btn--sm" data-act="openSaved" data-k="' + x.k + '">Open</button></div></li>';
    }).join('') : '<li class="empty-sm">Nothing saved here yet. Use ♥ or the bookmark on any species, animal, note or announcement.</li>';
  }
  function renderTickets() {
    $$('#statusRow .status-btn').forEach(function (b) { b.setAttribute('aria-pressed', String(S.status === b.dataset.status)); });
    $('#ticketRows').innerHTML = TICKETS.filter(function (t) { return !S.status || t[4] === S.status; }).map(function (t) {
      var cls = t[4] === 'Open' ? 'tag tag--warn' : t[4] === 'In progress' ? 'tag tag--alert' : 'tag tag--ok';
      return '<tr><td data-label="Ticket">' + t[0] + '</td><td data-label="Subject">' + esc(t[1]) + '</td><td data-label="Module">' + t[2] + '</td><td data-label="Priority">' + t[3] + '</td><td data-label="Status"><span class="' + cls + '">' + t[4] + '</span></td><td data-label="Updated">' + t[5] + '</td></tr>';
    }).join('');
  }
  function openTicket() { var f = $('#ticketForm'); if (isMobile()) f.classList.add('is-open'); else f.scrollIntoView({ block: 'nearest' }); $('#tkSub').focus({ preventScroll: isMobile() }); }
  function closeTicket() { $('#ticketForm').classList.remove('is-open'); }

  /* tabs (generic) */
  var TAB_HOOKS = { focusTabs: function (v) { S.focusTab = v; renderFocus(); }, chatTabs: function (v) { S.chatFilter = v; renderConvos(); } };
  function selectTab(t) {
    var list = t.closest('[role="tablist"]'), tabs = $$('[role="tab"]', list);
    tabs.forEach(function (x) { x.setAttribute('aria-selected', String(x === t)); x.tabIndex = x === t ? 0 : -1; var p = document.getElementById(x.getAttribute('aria-controls')); if (p && x !== t) p.hidden = true; });
    var p = document.getElementById(t.getAttribute('aria-controls')); if (p) p.hidden = false;
    if (list.id && TAB_HOOKS[list.id]) TAB_HOOKS[list.id](t.dataset.value);
  }
  function refocus(sel) { var el = $(sel); if (el) el.focus(); }

  /* stack rotation */
  var rotTimer;
  function rotateStack(wid, d) { var f = findItem(wid); if (!f || f.it.type !== 'stack') return; var st = f.it; st.idx = (st.idx + d + st.items.length) % st.items.length; renderHome(); }
  function smartRotate() {
    clearInterval(rotTimer);
    if (S.smartRotate && !reduceMotion) rotTimer = setInterval(function () {
      var ae = document.activeElement;
      if (S.app || S.overlay || S.editing || S.drawer || pd || dg || (ae && ae.closest && ae.closest('.wg--stack'))) return;
      stacks().forEach(function (st) { st.idx = (st.idx + 1) % st.items.length; });
      renderHome();
    }, 9000);
  }

  /* ================= EVENTS ================= */
  var ACTS = {
    toast: function (el) { toast(el.dataset.msg); },
    theme: function () { applyTheme(isDark() ? 'light' : 'dark', true); },
    profile: function (el) { openCtx('profile', null, el); },
    site: function () { openSiteMenu(); },
    hintDismiss: function () { dismissSiteHint(); $('#sitePill').focus(); },
    scan: function () { toast('Scan · point the camera at a tag, enclosure QR or microchip reader.'); },
    quick: function () { openSpot(); },
    nc: function () { openNC(); },
    search: function () { openSpot(); },
    library: function (el) { openLibrary(el); },
    az: function (el) { var t = $('#lib-' + el.dataset.l); if (t) t.scrollIntoView({ block: 'start' }); },
    edit: function () { setEditing(true); },
    done: function () { setEditing(false); },
    gallery: function () { openGallery(); },
    stackTo: function (el) { var f = findItem(el.dataset.w); if (!f) return; f.it.idx = +el.dataset.i; renderHome(); var b = $('[data-act="stackTo"][data-w="' + el.dataset.w + '"][data-i="' + el.dataset.i + '"]'); if (b) b.focus(); },
    libAdd: function (el) { openGallery({ type: el.dataset.id, size: 'M', mode: 'add' }); },
    peekOpen: function (el) { openApp(el.dataset.id); },
    peekAdd: function (el) { openGallery({ type: el.dataset.id, size: 'M', mode: 'add' }); },
    closeOverlay: function () { closeOverlay(); },
    closeOverlayBg: function (el, e) { if (e.target === el) closeOverlay(); },
    galPick: function (el) { var t = el.dataset.t; gal = { type: t, ref: el.dataset.ref, metric: el.dataset.metric, preset: el.dataset.preset, size: DASHW[t] ? DASHW[t].def : 'M', mode: 'add', toStack: DASHW[t] ? '' : S.pendingStack || '' }; renderGallery(); updateTitle(); },
    galBack: function () { gal = null; renderGallery(); },
    galSize: function (el) { var s = sizesFor(galCtx()), i = s.indexOf(gal.size) + +el.dataset.d; gal.size = s[Math.max(0, Math.min(s.length - 1, i))]; renderGallery(); var b = $('[data-act="galSize"][data-d="' + el.dataset.d + '"]'); if (b && !b.disabled) b.focus(); else $('#galSizes [aria-pressed="true"]').focus(); },
    galSet: function (el) { gal.size = el.dataset.s; renderGallery(); $('#galSizes [data-s="' + el.dataset.s + '"]').focus(); },
    galStack: function (el) { gal.toStack = el.dataset.w; renderGallery(); var b = $('[data-act="galStack"][data-w="' + el.dataset.w + '"]'); if (b) b.focus(); },
    galAdd: function () {
      if (gal.mode === 'edit') { closeOverlay(true); setSize(gal.wid, gal.size); return; }
      var isItem = gal.type === 'item', name = isItem ? entryName({ ref: gal.ref }) : DASHW[gal.type] ? dashName(gal) : app(gal.type).name, sf = gal.toStack ? findItem(gal.toStack) : null;
      var snap = snapshot();
      S.pendingStack = '';
      if (sf) { var st = sf.it; st.items.push(isItem ? { type: 'item', ref: gal.ref } : gal.type); st.idx = st.items.length - 1; toast(name + ' added to the ' + st.name + ' stack', 'Undo', function () { restore(snap); }); }
      else {
        var nw = isItem ? { id: newId(), type: 'item', ref: gal.ref, size: gal.size } : { id: newId(), type: gal.type, size: gal.size };
        if (gal.metric) nw.metric = gal.metric;
        if (gal.preset) nw.preset = gal.preset;
        if (gal.type === 'trend') nw.period = 12;
        LAYOUT.push(nw);   /* new widgets go at the end of the main area; drag or ⋯ moves them to the right column */
        toast(name + ' widget added to the Command Centre', 'Undo', function () { restore(snap); });
      }
      saveLayout();
      closeOverlay(true); renderHome(); updateTitle();
      /* show where it landed: scroll the new widget (or the stack) into view and focus it */
      var landed = $('#homePages [data-cell="w:' + (sf ? sf.it.id : nw.id) + '"]');
      if (landed) { landed.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' }); var lb = $('button', landed); if (lb) lb.focus({ preventScroll: true }); }
    },
    stackRm: function (el) { var st = findItem(S.stackW).it; if (st.items.length < 2) return; st.items.splice(+el.dataset.i, 1); st.idx = 0; saveLayout(); renderHome(); openStackSheet(S.stackW); },
    stackUp: function (el) { var st = findItem(S.stackW).it, i = +el.dataset.i, t = st.items.splice(i, 1)[0]; st.items.splice(i - 1, 0, t); saveLayout(); renderHome(); openStackSheet(S.stackW); },
    itemWidget: function (el) { openGallery({ type: 'item', ref: el.dataset.key, size: 'M', mode: 'add' }); },
    stackAdd: function () { var w = S.stackW; openGallery(); S.pendingStack = w; },
    smart: function (el) { S.smartRotate = !S.smartRotate; el.setAttribute('aria-pressed', String(S.smartRotate)); smartRotate(); },
    sugg: function (el) { S.suggestions = !S.suggestions; el.setAttribute('aria-pressed', String(S.suggestions)); },
    nToggle: function (el) { var g = +el.dataset.g; S.nExpanded[g] = !S.nExpanded[g]; renderNC(); },
    nOpen: function (el) {
      var g = NOTIFS[+el.dataset.g], o = {};
      if (g.app === 'communication') o.chat = +el.dataset.k === 1 ? 1 : +el.dataset.k === 2 ? 3 : 0;
      if (g.app === 'announcements') o.ann = 2;
      openApp(g.app, o);
    },
    nClear: function () { NOTIFS.length = 0; $('#bellBtn .badge').hidden = true; $('#bellBtn').setAttribute('aria-label', 'Notification Center'); renderNC(); },
    home: function () { goHome(); },
    drawer: function () { if (S.drawer) closeDrawer(); else openDrawer(); },
    drawerClose: function () { closeDrawer(); },
    sideToggle: function () { toggleSide(); },
    pinPicker: function () { openPicker(); },
    reportBug: function () { openApp('help', { form: 1 }); },
    heroScan: function () { toast('Scan · point the camera at a tag, enclosure QR or microchip reader.'); },
    appBack: function () { if (backFn) backFn(); },
    lvl: function (el) { var o = {}; if (el.dataset.species != null) o.species = +el.dataset.species; if (el.dataset.animal != null) o.animal = +el.dataset.animal; setLevel(el.dataset.level, o); focusLevel(); },
    noteColl: function (el) { S.noteColl = el.dataset.coll; renderNotesScreen(); refocus('[data-act="noteColl"][data-coll="' + el.dataset.coll + '"]'); },
    noteType: function (el) { var t = el.dataset.type, i = S.noteTypes.indexOf(t); if (i > -1) S.noteTypes.splice(i, 1); else S.noteTypes.push(t); renderNotesScreen(); refocus('[data-act="noteType"][data-type="' + t + '"]'); },
    spClass: function (el) { S.spClass = el.dataset.c; renderSpeciesGrid(); refocus('[data-act="spClass"][data-c="' + el.dataset.c + '"]'); },
    anSex: function (el) { S.anSex = el.dataset.sex; renderSpecies(); refocus('[data-act="anSex"][data-sex="' + el.dataset.sex + '"]'); },
    annFilter: function (el) { S.annFilter = el.dataset.f; renderAnnList(); refocus('[data-act="annFilter"][data-f="' + el.dataset.f + '"]'); },
    annOpen: function (el) { openAnn(+el.dataset.i); if (window.innerWidth >= 1240) refocus('[data-act="annOpen"][data-i="' + el.dataset.i + '"]'); },
    chatOpen: function (el) { openChat(+el.dataset.i); },
    chatInfo: function (el) { var on = $('#chat').classList.toggle('is-info'); el.setAttribute('aria-pressed', String(on)); },
    focusType: function (el) { S.focusType = el.dataset.t; renderFocus(); refocus('[data-act="focusType"][data-t="' + el.dataset.t + '"]'); },
    folder: function (el) { S.folder = el.dataset.f; renderFocus(); refocus('[data-act="folder"][data-f="' + el.dataset.f + '"]'); },
    openSaved: function (el) { var g = SAVE[el.dataset.k].go; openApp(g.app, g); },
    ticketOpen: openTicket,
    ticketClose: function () { closeTicket(); $('[data-act="ticketOpen"]').focus(); }
  };

  /* drag-to-resize: pointer events on the corner handle (mouse + touch), snapping S / M / L / XL with a live outline */
  var rz = null;
  ui.addEventListener('pointerdown', function (e) {
    var h = e.target.closest && e.target.closest('.rs');
    if (!h || !S.editing || e.button > 0) return;
    e.preventDefault(); e.stopPropagation(); clearTimeout(lpTimer); drag = null;
    var w = h.closest('.wg'), f = findItem(h.dataset.resize); if (!f) return;
    var g = w.parentElement, gs = getComputedStyle(g), cols = gs.gridTemplateColumns.split(' ').length, ctx = ctxOf(f.it);
    var gx = parseFloat(gs.columnGap) || 0, gy = parseFloat(gs.rowGap) || 0;
    var cw = (g.clientWidth - (cols - 1) * gx) / cols, rh = parseFloat(gs.gridAutoRows) || 90;
    var r = w.getBoundingClientRect(), ur = ui.getBoundingClientRect();
    rz = { id: f.it.id, ctx: ctx, from: eff(f.it.size, ctx), size: eff(f.it.size, ctx), x: r.left, y: r.top, ox: ur.left, oy: ur.top, cw: cw, rh: rh, gx: gx, gy: gy, cols: cols, el: w };
    w.classList.add('is-resizing');
    var gh = document.createElement('div'); gh.className = 'rs-ghost'; gh.setAttribute('aria-hidden', 'true'); gh.innerHTML = '<span></span>'; ui.appendChild(gh); rz.gh = gh;
    try { h.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    drawGhost();
  }, true);
  function drawGhost() {
    var sp = spansFor(rz.ctx)[rz.size], c = Math.min(sp[0], rz.cols);
    rz.gh.style.left = (rz.x - rz.ox) + 'px'; rz.gh.style.top = (rz.y - rz.oy) + 'px';
    rz.gh.style.width = (c * rz.cw + (c - 1) * rz.gx) + 'px'; rz.gh.style.height = (sp[1] * rz.rh + (sp[1] - 1) * rz.gy) + 'px';
    rz.gh.firstChild.textContent = SZ_NAME[rz.size];
  }
  document.addEventListener('pointermove', function (e) {
    if (!rz) return;
    var fx = (e.clientX - rz.x + rz.gx) / (rz.cw + rz.gx), fy = (e.clientY - rz.y + rz.gy) / (rz.rh + rz.gy);
    /* snap to the allowed size whose span is nearest the pointer */
    var sp = spansFor(rz.ctx), s2 = rz.size, best = 1e9;
    sizesFor(rz.ctx).forEach(function (s) { var c = Math.min(sp[s][0], rz.cols), d = (fx - c) * (fx - c) + (fy - sp[s][1]) * (fy - sp[s][1]); if (d < best) { best = d; s2 = s; } });
    if (s2 !== rz.size) { rz.size = s2; drawGhost(); }
  }, true);
  function endResize(cancel) {
    if (!rz) return;
    var z = rz; rz = null;
    z.gh.remove(); z.el.classList.remove('is-resizing');
    suppress = true; setTimeout(function () { suppress = false; }, 50);
    if (!cancel && z.size !== z.from) setSize(z.id, z.size);
    else { var h = $('[data-resize="' + z.id + '"]'); if (h) h.focus({ preventScroll: true }); }
  }
  document.addEventListener('pointerup', function () { if (rz) endResize(false); }, true);
  document.addEventListener('pointercancel', function () { if (rz) endResize(true); }, true);

  /* ================= REORDER =================
     Edit mode: press and drag any widget. A lifted ghost follows the pointer, the grid shifts live to
     show the drop slot, holding near the top or bottom edge scrolls the dashboard, dropping on the
     sidebar pins the module, and dropping a widget on the middle of a stack adds it to the stack.
     Keyboard: Alt + arrow keys on a widget, or Move earlier / later in its ⋯ menu. */
  /* keyboard move: swap with the neighbour in the same dashboard area (main area or right column) */
  function moveItem(key, dir) {
    var wid = key.slice(2), f = findItem(wid); if (!f) return;
    var zone = f.it.zone || 'main';
    var same = LAYOUT.map(function (x, i) { return (x.zone || 'main') === zone ? i : -1; }).filter(function (i) { return i > -1; });
    var at = same.indexOf(f.i), to = at + dir;
    if (to < 0 || to >= same.length) { toast(dir < 0 ? 'Already first' : 'Already last'); return; }
    var snap = snapshot(), j = same[to];
    LAYOUT[f.i] = LAYOUT[j]; LAYOUT[j] = f.it;
    saveLayout(); renderHome();
    var cell = $('#homePages [data-cell="' + key + '"]');
    if (cell) { var fb = cell.querySelector('button'); if (fb) fb.focus({ preventScroll: false }); }
    toast('Moved ' + (dir < 0 ? 'earlier' : 'later'), 'Undo', function () { restore(snap); });
  }
  /* keyboard alternative to dragging between the dashboard's main area and right column */
  function moveZone(wid) {
    var f = findItem(wid); if (!f) return;
    var snap = snapshot(), to = f.it.zone === 'side' ? 'main' : 'side';
    if (to === 'side') f.it.zone = 'side'; else delete f.it.zone;
    saveLayout(); renderHome();
    var c = $('#homePages [data-cell="w:' + wid + '"] button'); if (c) c.focus();
    toast('Moved to the ' + (to === 'side' ? 'right column' : 'main area'), 'Undo', function () { restore(snap); });
  }

  var dg = null, pend = null, press = null;
  var DRAG_THRESHOLD = 6;
  function dragCandidate(t) {
    if (!t || !t.closest || t.closest('.rs, .rm, .more, .stack-dots, select')) return null;
    return t.closest('#homePages [data-cell]');
  }
  function beginDrag(cell, e) {
    var r = cell.getBoundingClientRect();
    var ghost = cell.cloneNode(true);
    ghost.classList.add('drag-ghost'); ghost.removeAttribute('data-cell'); ghost.setAttribute('aria-hidden', 'true');
    ghost.style.width = r.width + 'px'; ghost.style.height = r.height + 'px';
    document.body.appendChild(ghost);
    cell.classList.add('is-drag-src');
    ui.classList.add('is-dragging'); document.body.classList.add('is-dragging');
    dg = { key: cell.dataset.cell, el: cell, ghost: ghost, dx: e.clientX - r.left, dy: e.clientY - r.top, snap: snapshot(), merge: null, last: null, pin: null, scroll: 0, scrollTimer: null };
    clearTimeout(lpTimer); drag = null;
    moveDrag(e);
  }
  /* which module a dragged widget would pin: a module, quick-action, KPI or panel widget */
  function dragModule(key) {
    var f = findItem(key.slice(2)); if (!f) return null;
    var it = f.it, t = it.type === 'stack' ? entryType(it.items[it.idx]) : it.type;
    if (DASHW[t]) return t === 'kpi' || t === 'action' || t === 'trend' ? dashOpen(it) : DASHW[t].open || null;
    return app(t) ? t : null;
  }
  function moveDrag(e) {
    dg.ghost.style.transform = 'translate(' + (e.clientX - dg.dx) + 'px,' + (e.clientY - dg.dy) + 'px) scale(1.05)';
    edgeScroll(e);
    var under = document.elementFromPoint(e.clientX, e.clientY);
    var pins = $('#snPins');
    setMerge(null); pins.classList.remove('is-drop'); dg.pin = null;
    if (!under) return;
    /* onto the sidebar's Pinned section: pin that module (the icon or widget stays where it was) */
    if (under.closest('#side')) {
      var mod = dragModule(dg.key);
      if (mod) { pins.classList.add('is-drop'); dg.pin = mod; }
      return;
    }
    var board = under.closest('#homePages'); if (!board) return;
    var t = under.closest('[data-cell]');
    if (t && t !== dg.el && t.parentElement && t.parentElement.classList.contains('dz')) {
      if (t.classList.contains('wg--stack') && !dg.el.classList.contains('wg--stack') && !DASHW[(findItem(dg.key.slice(2)) || { it: {} }).it.type]) {
        var r = t.getBoundingClientRect();
        if (Math.abs(e.clientX - (r.left + r.width / 2)) < r.width * 0.25 && Math.abs(e.clientY - (r.top + r.height / 2)) < r.height * 0.25) { setMerge(t); return; }
      }
      insertBy(t, e);
    } else if (!t) {
      var grid = under.closest('.dz');
      if (grid && grid.lastElementChild !== dg.el) { grid.appendChild(dg.el); dg.last = null; }
    }
  }
  /* the dashboard scrolls: hold near its top or bottom edge while dragging to scroll it */
  function edgeScroll(e) {
    var pg = $('#homePages');
    var r = pg.getBoundingClientRect(), dir = e.clientY < r.top + 48 ? -1 : e.clientY > r.bottom - 48 ? 1 : 0;
    dg.scroll = dir;
    if (dir && !dg.scrollTimer) dg.scrollTimer = setInterval(function () { if (!dg || !dg.scroll) return; pg.scrollTop += dg.scroll * 14; }, 16);
  }
  function insertBy(t, e) {
    var r = t.getBoundingClientRect(), before = e.clientX < r.left + r.width / 2;
    if (r.width > t.parentElement.clientWidth * 0.75) before = e.clientY < r.top + r.height / 2;
    var sig = t.dataset.cell + (before ? '<' : '>');
    if (dg.last === sig) return;
    dg.last = sig;
    t.parentElement.insertBefore(dg.el, before ? t : t.nextSibling);
  }
  function setMerge(t) { if (dg.merge && dg.merge !== t) dg.merge.classList.remove('is-merge-target'); dg.merge = t; if (t) t.classList.add('is-merge-target'); }
  /* the DOM order after a drag becomes the layout; a cell's grid sets its dashboard area */
  function commitFromDom() {
    var byKey = {};
    LAYOUT.forEach(function (x) { byKey['w:' + x.id] = x; });
    var out = [];
    $$('#homePages .dz').forEach(function (g) {
      $$('[data-cell]', g).filter(function (c) { return c.parentElement === g; }).forEach(function (c) {
        var x = byKey[c.dataset.cell]; if (!x) return;
        if (g.dataset.zone === 'side') x.zone = 'side'; else delete x.zone;
        out.push(x);
      });
    });
    if (out.length !== LAYOUT.length) return false;
    LAYOUT = out;
    return true;
  }
  function endDrag(cancel) {
    if (!dg) return;
    var d = dg; dg = null;
    clearInterval(d.scrollTimer);
    d.ghost.remove(); d.el.classList.remove('is-drag-src'); ui.classList.remove('is-dragging'); document.body.classList.remove('is-dragging'); $('#snPins').classList.remove('is-drop');
    if (d.merge) d.merge.classList.remove('is-merge-target');
    suppress = true; setTimeout(function () { suppress = false; }, 50);
    if (cancel) { restore(d.snap); toast('Move cancelled'); return; }
    /* dropped on the sidebar: pin the module, leave the layout as it was */
    if (d.pin) { restore(d.snap); if (isPinned(d.pin)) toast(app(d.pin).name + ' is already pinned.'); else togglePin(d.pin); return; }
    dg = d;
    var merged = false;
    if (d.merge) {
      var sf = findItem(d.merge.dataset.cell.slice(2)), wf = findItem(d.key.slice(2));
      if (sf && wf) {
        sf.it.items.push(wf.it.type === 'item' ? { type: 'item', ref: wf.it.ref } : wf.it.type);
        sf.it.idx = sf.it.items.length - 1;
        LAYOUT.splice(wf.i, 1);
        merged = true;
      }
    }
    var ok = merged || commitFromDom();
    dg = null;
    if (!ok) { restore(d.snap); return; }
    saveLayout(); renderHome();
    $$('[data-pin]').forEach(function (b) { if (b.dataset.pin) b.setAttribute('aria-pressed', String(isPinned(b.dataset.pin))); });
    var label = merged ? 'Added to the stack' : 'Moved';
    toast(label, 'Undo', function () { restore(d.snap); });
  }
  document.addEventListener('pointerdown', function (e) {
    if (e.button > 0 || rz) return;
    var cell = dragCandidate(e.target);
    press = cell ? { x: e.clientX, y: e.clientY, key: cell.dataset.cell, lp: false } : null;
    pend = (cell && S.editing && !S.overlay && !S.app) ? { x: e.clientX, y: e.clientY, cell: cell, id: e.pointerId } : null;
  }, true);
  document.addEventListener('pointermove', function (e) {
    if (dg) { e.preventDefault(); moveDrag(e); return; }
    if (pend && (Math.abs(e.clientX - pend.x) > DRAG_THRESHOLD || Math.abs(e.clientY - pend.y) > DRAG_THRESHOLD)) {
      var c = pend.cell; pend = null;
      try { ui.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      beginDrag(c, e); return;
    }
    /* outside edit mode: long-press, then move → edit mode and drag (like iOS) */
    if (press && press.lp && (Math.abs(e.clientX - press.x) > 10 || Math.abs(e.clientY - press.y) > 10)) {
      var key = press.key; press = null;
      closeOverlay(true); setEditing(true);
      var nc = $('#homePages [data-cell="' + key + '"]');
      if (nc) { try { ui.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } beginDrag(nc, e); }
    }
  }, true);
  document.addEventListener('pointerup', function () { pend = null; press = null; if (dg) endDrag(false); }, true);
  document.addEventListener('pointercancel', function () { pend = null; press = null; if (dg) endDrag(true); }, true);

  /* gestures: swipe a stack, swipe down on the header for the Notification Center, long-press menu */
  var drag = null, lpTimer = null, suppress = false;
  ui.addEventListener('pointerdown', function (e) {
    if (e.button > 0) return;
    drag = { x: e.clientX, y: e.clientY, t: e.target, moved: false };
    var cell = e.target.closest('.wg');
    var inHome = e.target.closest('#homePages');
    clearTimeout(lpTimer);
    if (!S.editing && !S.app && !S.overlay && inHome && !e.target.closest('input, .az')) {
      lpTimer = setTimeout(function () {
        suppress = true; drag = null; if (press) press.lp = true;
        if (cell) openCtxFor(cell); else openCtx('empty', null, null, { x: e.clientX, y: e.clientY });
      }, 550);
    }
  });
  ui.addEventListener('pointermove', function (e) { if (drag && (Math.abs(e.clientX - drag.x) > 8 || Math.abs(e.clientY - drag.y) > 8)) { drag.moved = true; clearTimeout(lpTimer); } });
  ui.addEventListener('pointerup', function (e) {
    clearTimeout(lpTimer);
    if (!drag) return;
    var d = drag; drag = null;
    var dx = e.clientX - d.x, dy = e.clientY - d.y, ax = Math.abs(dx), ay = Math.abs(dy);
    if (!d.moved) return;
    suppress = true;
    if (S.app || S.overlay) return;
    if (d.t.closest('.status') && dy > 50) { openNC(); return; }
    if (!d.t.closest('#homePages')) return;
    if (S.editing && d.t.closest('#homePages [data-cell]')) return;
    var st = d.t.closest('.wg--stack');
    if (st && ay > 30 && ay > ax) rotateStack(st.dataset.cell.slice(2), dy < 0 ? 1 : -1);
  });
  ui.addEventListener('pointercancel', function () { clearTimeout(lpTimer); drag = null; });
  document.addEventListener('click', function (e) { if (suppress) { suppress = false; e.stopPropagation(); e.preventDefault(); } }, true);
  ui.addEventListener('wheel', function (e) {
    var st = e.target.closest('.wg--stack');
    if (st && Math.abs(e.deltaY) > 20 && !S.editing) { e.preventDefault(); if (!ui._wl) { ui._wl = 1; rotateStack(st.dataset.cell.slice(2), e.deltaY > 0 ? 1 : -1); setTimeout(function () { ui._wl = 0; }, 500); } }
  }, { passive: false });
  ui.addEventListener('contextmenu', function (e) {
    if (S.editing || S.app || S.overlay) return;
    if (!e.target.closest('#homePages')) return;
    e.preventDefault();
    var cell = e.target.closest('.wg');
    if (cell) openCtxFor(cell); else openCtx('empty', null, null, { x: e.clientX, y: e.clientY });
  });

  document.addEventListener('click', function (e) {
    var el;
    if ((el = e.target.closest('[data-site]'))) { setSite(el.dataset.site); return; }
    if ((el = e.target.closest('[data-ctx]'))) { var fn = root._fns[+el.dataset.ctx]; closeOverlay(true); fn(); return; }
    if ((el = e.target.closest('[data-spot]'))) { var f2 = spotRes[+el.dataset.spot]; f2(); return; }
    if ((el = e.target.closest('[data-pin]'))) { if (el.dataset.pin) togglePin(el.dataset.pin, el); return; }
    if ((el = e.target.closest('[data-remove]'))) { removeCell(el.dataset.remove); return; }
    if ((el = e.target.closest('[data-more]'))) { var dm = el.dataset.more, cut = dm.indexOf(':'); openCtx(dm.slice(0, cut), dm.slice(cut + 1), el); return; }
    if ((el = e.target.closest('[data-save]'))) { toggleSave(el.dataset.key, el.dataset.save, el); return; }
    if ((el = e.target.closest('[role="tab"]'))) { selectTab(el); return; }
    if ((el = e.target.closest('[data-status]'))) { S.status = S.status === el.dataset.status ? '' : el.dataset.status; renderTickets(); return; }
    if ((el = e.target.closest('[data-act]'))) { if (ACTS[el.dataset.act]) ACTS[el.dataset.act](el, e); return; }
    if ((el = e.target.closest('[data-item]'))) {
      if (S.editing) return;
      var im = itemMeta(el.dataset.item); if (im) openApp(im.go.app, im.go, el); return;
    }
    if ((el = e.target.closest('[data-open]'))) {
      if (S.editing) return;
      openApp(el.dataset.open, {}, el.querySelector('.app__ic') || el); return;
    }
  });
  document.addEventListener('keydown', function (e) {
    if (rz && e.key === 'Escape') { endResize(true); return; }
    if (dg && e.key === 'Escape') { endDrag(true); return; }
    if (ld && ld.on && e.key === 'Escape') { endLibDrag(); suppress = true; return; }
    var pinEl = e.altKey && e.target.closest && e.target.closest('#snPins [data-pin-item]');
    if (pinEl && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); movePin(pinEl.dataset.pinItem, e.key === 'ArrowUp' ? -1 : 1); return; }
    if (S.drawer && e.key === 'Escape' && !S.overlay) { closeDrawer(); return; }
    if (S.drawer && e.key === 'Tab' && !S.overlay) {
      var df = $$('#side button, #side a').filter(function (x) { return x.getClientRects().length && !x.disabled; });
      if (e.shiftKey && document.activeElement === df[0]) { e.preventDefault(); df[df.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === df[df.length - 1]) { e.preventDefault(); df[0].focus(); }
    }
    var mc = e.altKey && e.target.closest && e.target.closest('#homePages [data-cell]');
    if (mc && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) > -1) {
      e.preventDefault(); moveItem(mc.dataset.cell, (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 1); return;
    }
    var rh0 = e.target.closest && e.target.closest('.rs');
    if (rh0 && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) > -1) {
      e.preventDefault();
      var fi = findItem(rh0.dataset.resize); if (!fi) return;
      var kctx = ctxOf(fi.it), ok = sizesFor(kctx), cur = ok.indexOf(eff(fi.it.size, kctx)), nx = Math.max(0, Math.min(ok.length - 1, cur + ((e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1)));
      if (nx !== cur) setSize(fi.it.id, ok[nx]); else toast(nx === 0 ? 'Already the smallest size' : 'Largest size for this screen');
      return;
    }
    var t = e.target.closest && e.target.closest('[role="tab"]');
    if (t && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(e.key) > -1) {
      var tabs = $$('[role="tab"]', t.parentNode), i = tabs.indexOf(t);
      var n = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : e.key === 'Home' ? 0 : tabs.length - 1;
      e.preventDefault(); selectTab(tabs[n]); tabs[n].focus(); return;
    }
    if (S.overlay === 'site' && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && e.target.closest('#siteList, #siteQ')) {
      var opts = $$('#siteList [role="radio"]'), at = opts.indexOf(document.activeElement);
      if (opts.length) { e.preventDefault(); opts[(at + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length].focus(); }
      return;
    }
    if (S.overlay === 'ctx' && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      var items = $$('[role="menuitem"], [role="menuitemradio"]', root), j = items.indexOf(document.activeElement);
      e.preventDefault(); items[(j + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus(); return;
    }
    if ((e.key === 'ContextMenu' || (e.key === 'F10' && e.shiftKey)) && e.target.closest) {
      var cell = e.target.closest('#homePages .wg'); if (cell) { e.preventDefault(); openCtxFor(cell); return; }
    }
    if (e.key === 'Escape') {
      if (S.overlay) { closeOverlay(); return; }
      if (S.app) {
        if ($('#ticketForm').classList.contains('is-open')) { ACTS.ticketClose(); return; }
        if ($('#chat').classList.contains('is-info')) { $('#chat').classList.remove('is-info'); return; }
        closeApp(); return;
      }
      if (S.editing) { setEditing(false); return; }
    }
    if (e.key === 'Tab' && S.overlay && S.overlay !== 'ctx') {
      var f = $$('button:not([disabled]), input', root).filter(function (x) { return x.getClientRects().length; }), first = f[0], last = f[f.length - 1];
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    if (S.overlay === 'ctx' && e.key === 'Tab') { e.preventDefault(); }
    /* Ctrl+\ or [ collapses / expands the sidebar (desktop and tablet; never while typing) */
    var typing = e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]');
    if (!typing && !S.overlay && !S.drawer && !e.altKey && !e.metaKey && ((e.ctrlKey && e.key === '\\') || (!e.ctrlKey && e.key === '['))) { if (bp() !== 'phone') { e.preventDefault(); toggleSide(); } }
  });
  $('#noteQ').addEventListener('input', function (e) { S.noteQ = e.target.value; renderNotesScreen(); });
  $('#noteSort').addEventListener('change', function (e) { S.noteSort = e.target.value; renderNotesScreen(); });
  $('#spQ').addEventListener('input', function (e) { S.spQ = e.target.value; renderSpeciesGrid(); });
  $('#spSort').addEventListener('change', function (e) { S.spSort = e.target.value; renderSpeciesGrid(); });
  $('#spSite').addEventListener('change', function (e) { toast('Scoped to ' + e.target.value + ' (sample data unchanged)'); });
  $('#anQ').addEventListener('input', function (e) { S.anQ = e.target.value; renderSpecies(); });
  document.addEventListener('submit', function (e) {
    e.preventDefault();
    if (e.target.id === 'ticketForm') { toast('Ticket HD-1043 raised. We reply within one working day.'); e.target.reset(); closeTicket(); }
    if (e.target.id === 'composer') { var inp = $('#composeIn'); if (inp.value.trim()) { toast('Message sent'); inp.value = ''; } }
  });
  window.addEventListener('resize', function () {
    if (!isMobile()) { $('#ticketForm').classList.remove('is-open'); $('#appwin').classList.remove('is-thread'); }
    else if ($('#chat').classList.contains('is-open') && S.app === 'communication') $('#appwin').classList.add('is-thread');
    applySideMode(); clearTimeout(window._rh); window._rh = setTimeout(renderHome, 120);
    if (S.app) updateAppHeader();
  });

  /* ================= TREND CHART =================
     Hover or focus the plot and use ← → (Home / End) to read any week; the filters re-render it and are saved with the layout. */
  document.addEventListener('pointermove', function (e) {
    var p = e.target.closest && e.target.closest('.tr__plot'); if (!p || dg || rz) return;
    var r = p.getBoundingClientRect(), n = p.dataset.vals.split(',').length;
    setTrendIdx(p, Math.round((e.clientX - r.left) / r.width * (n - 1)));
  });
  document.addEventListener('keydown', function (e) {
    var p = e.target.closest && e.target.closest('.tr__plot'); if (!p || e.altKey) return;
    var i = +p.getAttribute('aria-valuenow') - 1, n = p.dataset.vals.split(',').length;
    var to = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? i + 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : null;
    if (to === null) return;
    e.preventDefault(); setTrendIdx(p, to);
  });
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t.matches || !t.matches('[data-trend]')) return;
    var f = findItem(t.dataset.trend); if (!f) return;
    f.it[t.dataset.k] = t.dataset.k === 'period' ? +t.value : t.value;
    saveLayout(); renderHome();
    var n = document.getElementById(t.id); if (n) n.focus();
  });

  /* ================= CHART TOOLTIP =================
     Hover any mark with data-tip; focusing a widget shows its chart summary. */
  var vizTip = document.createElement('div');
  vizTip.className = 'viz-tip'; vizTip.setAttribute('role', 'tooltip'); vizTip.hidden = true;
  document.body.appendChild(vizTip);
  function placeTip(x, y) {
    var w = vizTip.offsetWidth, h = vizTip.offsetHeight;
    vizTip.style.left = Math.min(Math.max(8, x - w / 2), window.innerWidth - w - 8) + 'px';
    vizTip.style.top = (y - h - 12 < 8 ? y + 18 : y - h - 12) + 'px';
  }
  document.addEventListener('pointermove', function (e) {
    if (dg || rz) { vizTip.hidden = true; return; }
    var t = e.target.closest && e.target.closest('[data-tip]');
    if (!t || e.pointerType === 'touch') { if (!vizTip.dataset.focus) vizTip.hidden = true; return; }
    vizTip.textContent = t.dataset.tip; vizTip.hidden = false; delete vizTip.dataset.focus; placeTip(e.clientX, e.clientY);
  });
  document.addEventListener('focusin', function (e) {
    var b = e.target.closest && e.target.closest('.wg__btn'), cx = b && b.querySelector('.cx[aria-label]');
    if (!cx) { if (vizTip.dataset.focus) { vizTip.hidden = true; delete vizTip.dataset.focus; } return; }
    var r = b.getBoundingClientRect();
    vizTip.textContent = cx.getAttribute('aria-label'); vizTip.hidden = false; vizTip.dataset.focus = '1'; placeTip(r.left + r.width / 2, r.top);
  });
  document.addEventListener('scroll', function () { vizTip.hidden = true; }, true);

  /* ================= INIT ================= */
  (function () { var sv = recallRaw(SITE_KEY); if (DATA && sv && (sv === 'all' || DATA.sites.some(function (x) { return x.id === sv; }))) S.site = sv; })();
  renderHeader();
  syncThemeUI();
  applySideMode();
  if (window.ResizeObserver) new ResizeObserver(function () { ui.style.setProperty('--hdr-h', $('#statusBar').offsetHeight + 'px'); }).observe($('#statusBar'));
  ui.style.setProperty('--hdr-h', $('#statusBar').offsetHeight + 'px');
  renderHome();
  renderFocusCounts();
  renderNotesScreen(); renderSpeciesGrid(); renderSpecies(); renderAnimal();
  renderAnnList(); renderAnnRead(); renderConvos(); renderThread(); renderFocus(); renderTickets();
  smartRotate();
  updateTitle();
  if (DATA) setTimeout(showSiteHint, 400);
})();
