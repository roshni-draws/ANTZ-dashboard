/* ═══════════════════════════════════════════════════════════════════════
   ANTZ HOME · APP
   Everything that moves: springboard pages, dock + pins, edit mode with
   drag-to-resize, widget stacks, widget gallery, App Library, search,
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
  var PIN_KEY = 'antz-pins', LAYOUT_KEY = 'antz-layout-v2', SITE_KEY = 'antz-site', HINT_KEY = 'antz-site-hint';
  var MAX_PINS = CFG.home.maxPins || 8;
  var pinned = (recall(PIN_KEY) || CFG.home.dock).filter(app).slice(0, MAX_PINS);
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

  /* config layout → internal items: { k: 'a', id } for apps, { k: 'w', id, type, size } for widgets/stacks/items */
  function layoutFromConfig() {
    return CFG.home.pages.map(function (items, p) {
      return items.map(function (x, i) {
        if (x.app) return { k: 'a', id: x.app };
        var id = x.id || 'p' + p + '-' + i;
        if (x.stack) return { k: 'w', id: id, type: 'stack', name: x.stack, size: x.size || 'M', items: x.items.map(normaliseEntry), idx: 0 };
        if (x.widget === 'item') return { k: 'w', id: id, type: 'item', ref: refKey(x.ref), size: x.size || 'M' };
        if (x.widget === 'kpi') return { k: 'w', id: id, type: 'kpi', metric: x.metric, size: x.size || 'S' };
        if (x.widget === 'attention') return { k: 'w', id: id, type: 'attention', size: x.size || 'L' };
        return { k: 'w', id: id, type: x.widget, size: x.size || 'M' };
      });
    });
  }
  /* a saved layout (order, sizes, added widgets) wins over config; modules added to config later are appended */
  function validItem(x) {
    if (!x || (x.k !== 'a' && x.k !== 'w')) return false;
    if (x.k === 'a') return !!app(x.id);
    if (x.type === 'stack') return Array.isArray(x.items) && x.items.length > 0;
    if (x.type === 'item') return !!itemMeta(x.ref);
    if (x.type === 'kpi') return !!(DATA && DATA.kpi(x.metric, 'all'));
    if (x.type === 'attention') return !!DATA;
    return !!app(x.type);
  }
  function loadLayout() {
    var saved = recall(LAYOUT_KEY);
    if (!saved || !Array.isArray(saved.pages)) return layoutFromConfig();
    var pages = saved.pages.map(function (pg) { return (pg || []).filter(validItem); }).filter(function (pg) { return pg.length; });
    if (!pages.length) return layoutFromConfig();
    APPS.forEach(function (a) {
      var present = pages.some(function (pg) { return pg.some(function (x) { return x.k === 'a' && x.id === a.id; }); });
      if (!present) pages[pages.length - 1].push({ k: 'a', id: a.id });
    });
    return pages;
  }
  var PAGES = loadLayout();
  function saveLayout() { store(LAYOUT_KEY, { v: 1, pages: PAGES }); savePins(); }
  function snapshot() { return JSON.stringify({ pages: PAGES, pinned: pinned, removed: S.removed }); }
  function restore(snap) { var o = JSON.parse(snap); PAGES = o.pages; pinned = o.pinned; S.removed = o.removed; saveLayout(); renderHome(); }
  var uidN = 0;
  function newId() { return 'w' + Date.now().toString(36) + (uidN++); }
  var S = { page: 0, nPages: 2, lib: false, pendingStack: '', stackW: '', editing: false, app: null, level: 'module', species: 0, animal: 0, ann: 0, chat: 0,
    noteColl: NOTE_COLLS[0], noteTypes: [], noteQ: '', noteSort: 'Newest first', spClass: 'All', spQ: '', spSort: 'count', anSex: 'All', anQ: '',
    focusTab: 'all', focusType: 'All', folder: FOLDERS[0], annFilter: 'All', chatFilter: 'all', status: '',
    overlay: null, removed: {}, smartRotate: true, suggestions: true, nExpanded: {}, libQ: '', site: 'all' };

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

  function dockLimit() { return isMobile() ? 4 : 6; }
  function isPinned(id) { return pinned.indexOf(id) > -1; }
  function findItem(wid) { for (var p = 0; p < PAGES.length; p++) for (var i = 0; i < PAGES[p].length; i++) if (PAGES[p][i].id === wid) return { p: p, i: i, it: PAGES[p][i] }; return null; }
  function stacks() { var r = []; PAGES.forEach(function (p) { p.forEach(function (x) { if (x.type === 'stack') r.push(x); }); }); return r; }

  /* ================= RENDER: icons, widgets ================= */
  function glyph(a) { return '<span class="material-symbols-outlined" aria-hidden="true">' + a.icon + '</span>'; }
  /* tile colour comes from the module's config entry; 'dark' glyph = navy icon for pale colours */
  function tileStyle(a, extra) { return 'style="--f:' + a.colour + (a.glyph === 'dark' ? ';--glyph:var(--s1-navy)' : '') + (extra ? ';' + extra : '') + '"'; }
  function appLabel(a) { return a.name + (a.badge ? ', ' + a.badge + ' ' + a.bw : '') + (isPinned(a.id) ? ', pinned' : ''); }
  function appIc(a, withBadge, fixed) {
    return '<span class="app__ic" ' + tileStyle(a) + '>' + glyph(a) + (withBadge && a.badge ? '<span class="badge" aria-hidden="true">' + a.badge + '</span>' : '') + (fixed ? '<span class="fixpin">' + icon('pin', '') + '</span>' : '') + '</span>';
  }
  function appCell(id, where) {
    var a = app(id);
    return '<div class="app-cell' + (a.core ? ' is-core' : '') + '" data-cell="app:' + id + '"' + (where === 'fixed' ? ' data-fixed="1"' : '') + '>' +
      '<button type="button" class="app" data-open="' + id + '" aria-label="' + esc(appLabel(a)) + '">' + appIc(a, true, where === 'fixed') + '<span class="app__lbl" aria-hidden="true">' + esc(a.name) + '</span></button>' +
      '<button type="button" class="app__more" data-more="app:' + id + '" aria-haspopup="menu" aria-label="More options for ' + esc(a.name) + '">' + icon('more') + '</button>' +
      '<button type="button" class="rm" data-remove="app:' + id + '" aria-label="Remove ' + esc(a.name) + ' from Home Screen">−</button>' +
      '<button type="button" class="pin-b" data-pin="' + id + '" aria-pressed="' + isPinned(id) + '" aria-label="Pin ' + esc(a.name) + ' to Dock">' + icon('pin') + '</button></div>';
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
    /* Command Centre KPI card: value, change vs last week (icon + text, never colour alone), 12-week sparkline */
    kpi: function (type, size, it) {
      var k = DATA && DATA.kpi(it.metric, S.site); if (!k) return '';
      var a = app(k.module), dir = k.delta.value > 0 ? 'arrow_upward' : k.delta.value < 0 ? 'arrow_downward' : 'remove';
      var tone = k.good === null ? 'flat' : k.good ? 'good' : 'bad';
      return '<span class="wg__hd"><span class="gl" ' + tileStyle(a) + '>' + glyph(a) + '</span><span class="ell">' + esc(k.label) + '</span></span>' +
        '<span class="kpi__v">' + esc(k.value) + '</span>' +
        '<span class="kpi__d kpi__d--' + tone + '"><span class="material-symbols-outlined" aria-hidden="true">' + dir + '</span>' + esc(k.deltaText) + '<span class="kpi__vs">vs last week</span></span>' +
        CHARTS.spark({ series: k.series });
    },
    /* Needs attention: overdue then pending work; each row opens its module */
    attention: function (type, size) {
      if (!DATA) return '';
      var at = DATA.attention(S.site);
      var row = function (r, kind) { var a = app(r[2]); return '<button type="button" class="att__row" data-open="' + r[2] + '"><span class="gl" ' + tileStyle(a) + '>' + glyph(a) + '</span><span class="att__lbl"><b class="ell">' + esc(r[0]) + '</b><small>' + esc(a.name) + '</small></span><span class="att__n att__n--' + kind + '">' + fmt(r[1]) + '</span></button>'; };
      var head = '<span class="wg__hd"><span class="gl" style="--f:var(--md-sys-color-tertiary)"><span class="material-symbols-outlined" aria-hidden="true">priority_high</span></span><span class="ell">Needs attention</span></span>';
      if (size === 'S') return head + '<span class="wg__big">' + fmt(at.total) + '</span><span class="wg__lbl">overdue tasks</span>' + row(at.overdue[0], 'over');
      var list = '<span class="att__grp">Overdue <b>' + fmt(at.total) + '</b></span>' + at.overdue.slice(0, size === 'M' ? 3 : 5).map(function (r) { return row(r, 'over'); }).join('');
      if (size !== 'M') list += '<span class="att__grp">Pending</span>' + at.pending.slice(0, 4).map(function (r) { return row(r, 'pend'); }).join('');
      return head + '<span class="att">' + list + '</span>';
    }
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
    if (type === 'item' || type === 'kpi' || type === 'attention') return WIDGETS[type](type, size, it);
    var a = app(type), render = WIDGETS[(a && a.widget) || 'stats'] || WIDGETS.stats;
    return render(type, size, it);
  }
  function widgetLabel(it) {
    if (it.type === 'stack') return it.name + ' stack';
    if (it.type === 'item') { var m = itemMeta(it.ref); return (m ? m.t : 'Saved item') + ' widget'; }
    if (it.type === 'kpi') { var kk = DATA && DATA.kpi(it.metric, S.site); return (kk ? kk.label : 'KPI') + ' card'; }
    if (it.type === 'attention') return 'Needs attention widget';
    return app(it.type).name + ' widget';
  }
  /* widget sizes: S 2×2, M 4×2, L 4×4, XL 8×4 (XL only where the grid has 8+ columns) */
  var SZ = ['S', 'M', 'L', 'XL'], SZ_NAME = { S: 'Small', M: 'Medium', L: 'Large', XL: 'Extra large' }, SPAN = { S: [2, 2], M: [4, 2], L: [4, 4], XL: [8, 4] };
  function gridCols() { return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cols'), 10) || 4; }
  function maxSz() { return gridCols() >= 8 ? 3 : 2; }
  function eff(size) { return SZ.indexOf(size) > maxSz() ? SZ[maxSz()] : size; }
  function setSize(wid, size, silent) {
    var f = findItem(wid); if (!f) return;
    var old = f.it.size; if (old === size) return;
    f.it.size = size; saveLayout(); renderHome();
    var h = $('[data-resize="' + wid + '"]'); if (h) h.focus({ preventScroll: true });
    if (!silent) toast(widgetLabel(f.it) + ' is now ' + SZ_NAME[size] + '.', 'Undo', function () { setSize(wid, old, true); });
    updateTitle();
  }
  function widgetCell(it) {
    var stack = it.type === 'stack';
    if (stack && it.idx >= it.items.length) it.idx = 0;
    var cur = stack ? it.items[it.idx] : null;
    var type = stack ? entryType(cur) : it.type;
    var ref = stack ? (cur && cur.ref) : it.ref;
    var kp = type === 'kpi' && DATA ? DATA.kpi(it.metric, S.site) : null;
    var name = type === 'item' ? entryName({ ref: ref }) : type === 'kpi' ? (kp ? kp.label : 'KPI') : type === 'attention' ? 'Needs attention' : app(type).name;
    var label = widgetLabel(it);
    var sz = eff(it.size);
    var dots = stack ? '<div class="stack-dots" role="group" aria-label="' + esc(it.name) + ' stack">' + it.items.map(function (t, i) {
      return '<button type="button" data-act="stackTo" data-w="' + it.id + '" data-i="' + i + '" aria-label="Show ' + esc(entryName(t)) + '"' + (i === it.idx ? ' aria-current="true"' : '') + '></button>';
    }).join('') + '</div>' : '';
    var target = type === 'item' ? 'data-item="' + ref + '"' : type === 'kpi' ? 'data-open="' + (kp ? kp.module : 'focus') + '"' : 'data-open="' + type + '"';
    var statsCls = app(type) && !app(type).widget ? ' wg--stats wg--' + (app(type).chart || 'columns') : type === 'kpi' ? ' wg--kpi' : '';
    var bodySize = sz === 'XL' ? 'L' : sz;
    /* the attention list holds its own row buttons, so its body is not one big button */
    var body = type === 'attention'
      ? '<div class="wg__btn wg__body">' + widgetBody(type, bodySize, it) + '</div>'
      : '<button type="button" class="wg__btn" ' + target + '>' + widgetBody(type, bodySize, { ref: ref, metric: it.metric }) + '<span class="vh">, open ' + esc(name) + (stack ? '. ' + esc(it.name) + ' stack, ' + (it.idx + 1) + ' of ' + it.items.length : '') + '</span></button>';
    return '<div class="wg wg--' + sz + (stack ? ' wg--stack' : '') + (type === 'item' ? ' wg--item' : '') + (type === 'attention' ? ' wg--attention' : '') + statsCls + '" data-cell="w:' + it.id + '">' +
      body + dots +
      '<button type="button" class="more" data-more="w:' + it.id + '" aria-haspopup="menu" aria-label="More options for ' + esc(label) + '">' + icon('more') + '</button>' +
      '<button type="button" class="rm" data-remove="w:' + it.id + '" aria-label="Remove ' + esc(label) + '">−</button>' +
      '<button type="button" class="rs" data-resize="' + it.id + '" aria-label="Resize ' + esc(label) + ', now ' + SZ_NAME[sz] + '. Drag the corner, or use the arrow keys"></button></div>';
  }
  function renderHome() {
    var keep = document.activeElement && document.activeElement.closest && document.activeElement.closest('[data-cell]');
    var keepSel = keep ? keep.getAttribute('data-cell') : null;
    var keepCls = document.activeElement ? document.activeElement.className : '';
    var lim = dockLimit();
    var dockIds = pinned.slice(0, lim), fixedIds = pinned.slice(lim);
    var dock = dockIds.map(function (id) { return appCell(id, 'dock'); }).join('');
    for (var i = dockIds.length; i < lim; i++) dock += '<span class="dock-slot" aria-hidden="true"></span>';
    if (!dockIds.length) dock += '<span class="dock-empty">Pin a module to keep it here</span>';
    $('#dock').innerHTML = dock;
    /* reflow like iOS: page 1 holds its own items up to its cell capacity; the rest flows onto as many pages as needed */
    var cap = capacity(), COST = { S: 4, M: 8, L: 16, XL: 32 };
    var pages = [{ html: fixedIds.map(function (id) { return appCell(id, 'fixed'); }).join(''), used: fixedIds.length }];
    /* page 1 is the Command Centre: it never overflows onto page 2 (it scrolls on small screens) */
    var place = function (h, c, noCap) { var cur = pages[pages.length - 1]; if (!noCap && cur.used > 0 && cur.used + c > cap) { cur = { html: '', used: 0 }; pages.push(cur); } cur.html += h; cur.used += c; };
    PAGES.forEach(function (items, p) {
      if (p > 0 && pages[pages.length - 1].used > 0) pages.push({ html: '', used: 0 });
      items.forEach(function (it) {
        if (it.k === 'a' && (isPinned(it.id) || S.removed[it.id])) return;
        var c = it.k === 'a' ? 1 : COST[eff(it.size)];
        place(it.k === 'a' ? appCell(it.id, 'page') : widgetCell(it), c, p === 0);
      });
    });
    S.nPages = pages.length;
    $('#homePages').innerHTML = pages.map(function (pg, i) {
      if (i === 0) return '<section class="page page--dash" data-page="0" aria-labelledby="dashH"><header class="dash-hd"><div><h1 id="dashH" class="dash-hd__t">Command Centre</h1>' +
        '<p class="dash-hd__s"><span class="material-symbols-outlined" aria-hidden="true">location_on</span><b>' + esc(siteName(S.site)) + '</b><span>' + esc(CFG.user.date) + '</span></p></div><span class="tag dash-hd__tag">Sample data</span></header><div class="sb-grid">' + pg.html + '</div></section>';
      return '<section class="page" data-page="' + i + '" aria-label="Home page ' + (i + 1) + '"><div class="sb-grid">' + pg.html + '</div></section>';
    }).join('');
    spillOverflow();
    $('#libPage').dataset.page = S.nPages;
    if (S.lib) S.page = S.nPages; else if (S.page >= S.nPages) S.page = S.nPages - 1;
    renderLibrary();
    renderPageCtl();
    if (keepSel) {
      var cell = $('[data-cell="' + keepSel + '"]');
      var target = cell && (keepCls ? cell.querySelector('.' + keepCls.split(' ')[0]) : null);
      if (target) target.focus({ preventScroll: true });
    }
  }
  /* The cell-count estimate can still leave a page taller than the screen (a Large widget packed
     low, for example), which hides that widget's bottom and its resize handle. After rendering,
     move whatever sticks out below a page onto the start of the next page. */
  function spillOverflow() {
    var pages = $$('#homePages .page');
    for (var i = 1; i < pages.length; i++) {
      var pg = pages[i], grid = $('.sb-grid', pg), limit = pg.getBoundingClientRect().top + pg.clientHeight - 4;
      var moved = [];
      while (grid.children.length > 1) {
        var last = grid.lastElementChild, overflow = $$('[data-cell]', grid).some(function (c) { return c.parentElement === grid && c.getBoundingClientRect().bottom > limit; });
        if (!overflow) break;
        moved.unshift(last); grid.removeChild(last);
      }
      if (!moved.length) continue;
      if (!pages[i + 1]) {
        $('#homePages').insertAdjacentHTML('beforeend', '<section class="page" data-page="' + pages.length + '" aria-label="Home page ' + (pages.length + 1) + '"><div class="sb-grid"></div></section>');
        pages = $$('#homePages .page');
      }
      var next = $('.sb-grid', pages[i + 1]);
      moved.reverse().forEach(function (c) { next.insertBefore(c, next.firstChild); });
    }
    S.nPages = pages.length;
  }
  /* put a new widget in the first page that still has room (page 1 first), else a new page */
  function placeNew(item) {
    var cap = capacity(), COST = { S: 4, M: 8, L: 16, XL: 32 };
    var need = COST[eff(item.size)];
    for (var p = 0; p < PAGES.length; p++) {
      var used = PAGES[p].reduce(function (n, x) { return n + (x.k === 'a' ? (isPinned(x.id) || S.removed[x.id] ? 0 : 1) : COST[eff(x.size)]); }, p === 0 ? Math.max(0, pinned.length - dockLimit()) : 0);
      if (used + need <= cap) { PAGES[p].push(item); return p; }
    }
    PAGES.push([item]); return PAGES.length - 1;
  }
  function capacity() {
    var cs = getComputedStyle(document.documentElement);
    var cols = parseInt(cs.getPropertyValue('--cols'), 10) || 4, row = parseFloat(cs.getPropertyValue('--row')) || 90, gap = parseFloat(cs.getPropertyValue('--gapY')) || 10;
    var h = ($('.page') ? $('.page').clientHeight : 600) - 20;
    var rows = Math.max(3, Math.floor((h + gap) / (row + gap)));
    return cols * rows;
  }
  function renderPageCtl() {
    var n = S.nPages, dots = '';
    for (var i = 0; i <= n; i++) dots += '<button type="button" class="' + (i === n ? 'lib' : '') + '" data-act="page" data-p="' + i + '" aria-label="' + (i === n ? 'App Library' : 'Home page ' + (i + 1)) + '"' + (i === S.page ? ' aria-current="true"' : '') + '></button>';
    $('#pdots').innerHTML = dots;
    $('[data-act="prevPage"]').disabled = S.page === 0;
    $('[data-act="nextPage"]').disabled = S.page === n;
    $$('.page').forEach(function (pg, i) { pg.classList.toggle('is-current', i === S.page); if (i === S.page) pg.removeAttribute('inert'); else pg.setAttribute('inert', ''); });
    $('#pages').style.transform = 'translateX(' + (-100 * S.page) + '%)';
  }
  function setPage(p) { S.page = Math.max(0, Math.min(S.nPages, p)); S.lib = S.page === S.nPages; renderPageCtl(); updateTitle(); }

  /* App Library */
  function renderLibrary() {
    var q = S.libQ.toLowerCase();
    var list = APPS.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).filter(function (a) { return !q || (a.name + ' ' + a.sub).toLowerCase().indexOf(q) > -1; });
    var letters = {};
    var html = '';
    list.forEach(function (a) {
      var L = a.name[0].toUpperCase();
      if (!letters[L]) { letters[L] = 1; html += '<h3 class="lib__letter" id="lib-' + L + '">' + L + '</h3>'; }
      html += '<div class="lib-row' + (a.core ? ' is-core' : '') + '" data-cell="lib:' + a.id + '"><button type="button" class="lib-open" data-open="' + a.id + '">' + appIc(a, true) +
        '<span class="name">' + esc(a.name) + '<small>' + esc(a.sub) + (isPinned(a.id) ? ' · In Dock' : S.removed[a.id] ? ' · Library only' : '') + '</small></span></button>' +
        '<button type="button" class="lib-more" data-act="libAdd" data-id="' + a.id + '" aria-label="Add ' + esc(a.name) + ' widget">' + icon('plus') + '</button>' +
        '<button type="button" class="lib-more" data-more="app:' + a.id + '" aria-haspopup="menu" aria-label="More options for ' + esc(a.name) + '">' + icon('more') + '</button></div>';
    });
    $('#libList').innerHTML = html || '<p class="muted" style="padding:16px">No module matches “' + esc(S.libQ) + '”.</p>';
    $('#azIndex').innerHTML = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('').map(function (L) {
      return '<button type="button" data-act="az" data-l="' + L + '"' + (letters[L] ? '' : ' disabled') + ' aria-label="Jump to ' + (L === '#' ? 'numbers' : L) + '">' + L + '</button>';
    }).join('');
  }

  /* ================= PINNING ================= */
  function togglePin(id, trigger) {
    var a = app(id); if (!a) return;
    if (isPinned(id)) {
      pinned.splice(pinned.indexOf(id), 1);
      toast(a.name + ' unpinned. It is back on its home page.', 'Undo', function () { pinned.push(id); savePins(); refreshAll(); });
    } else {
      if (pinned.length >= MAX_PINS) { toast('Up to ' + MAX_PINS + ' pins. Unpin a module first.'); return; }
      pinned.push(id); delete S.removed[id];
      toast(pinned.length <= dockLimit() ? a.name + ' pinned to the Dock.' : 'The Dock is full (' + dockLimit() + '). ' + a.name + ' is pinned to the start of page 1.');
    }
    savePins(); refreshAll();
    if (trigger && document.contains(trigger)) trigger.focus({ preventScroll: true });
  }
  function refreshAll() {
    renderHome();
    $$('[data-pin]').forEach(function (b) { if (b.dataset.pin) b.setAttribute('aria-pressed', String(isPinned(b.dataset.pin))); });
    updateTitle();
  }

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
    setInert('#statusBar', ov); setInert('#editBar', ov); setInert('#appwin', ov);
  }
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
      items.push([isPinned(id) ? 'Unpin from Dock' : 'Pin to Dock', function () { togglePin(id); }, 'pin']);
      if (S.removed[id]) items.push(['Add to Home Screen', function () { delete S.removed[id]; refreshAll(); toast(a.name + ' is back on its home page.'); }, 'plus']);
      if (!isPinned(id) && !S.removed[id]) {
        items.push(['Move earlier', function () { moveItem('app:' + id, -1); }, 'chevron_left']);
        items.push(['Move later', function () { moveItem('app:' + id, 1); }, 'chevron_right']);
      }
      items.push(['Edit Home Screen', function () { setEditing(true); }, 'grid']);
      if (!isPinned(id) && !S.removed[id]) items.push(['Remove App', function () { removeCell('app:' + id); }, 'x', 1]);
    } else if (kind === 'w') {
      var f = findItem(id); if (!f) return;
      var it = f.it, stack = it.type === 'stack', type = stack ? entryType(it.items[it.idx]) : it.type;
      title = widgetLabel(it);
      if (it.type === 'item') items.push(['Open', function () { var mm = itemMeta(it.ref); if (mm) openApp(mm.go.app, mm.go); }, 'open_in_new']);
      if (stack) items.push(['Edit Stack', function () { openStackSheet(it.id); }, 'grid']);
      else if (it.type !== 'kpi' && it.type !== 'attention') items.push(['Edit Widget', function () { openGallery({ type: it.type, ref: it.ref, size: it.size, mode: 'edit', wid: it.id }); }, 'grid']);
      if (app(type)) items.push([isPinned(type) ? 'Unpin ' + app(type).name + ' from Dock' : 'Pin ' + app(type).name + ' to Dock', function () { togglePin(type); }, 'pin']);
      items.push(['Move earlier', function () { moveItem('w:' + it.id, -1); }, 'chevron_left']);
      items.push(['Move later', function () { moveItem('w:' + it.id, 1); }, 'chevron_right']);
      if (it.type === 'item') items.push(['Remove from Focus Hub', function () { unsaveItem(it.ref); }, 'bookmark_remove']);
      items.push(['Edit Home Screen', function () { setEditing(true); }, 'grid']);
      items.push(['-']);
      items.push([stack ? 'Remove Stack' : 'Remove Widget', function () { removeCell('w:' + id); }, 'x', 1]);
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
               ['My profile', function () { toast('Profile · ' + u.full); }, 'person']];
    } else {
      title = 'Home Screen';
      items = [['Add Widget', function () { setEditing(true); openGallery(); }, 'plus'], ['Customize', function () { toast('Customize · icon size and dark/tinted icons'); }, 'grid'], ['Edit Wallpaper', function () { toast('Edit Wallpaper'); }, 'grid'], ['Edit Pages', function () { setEditing(true); toast('Edit Pages · show, hide and reorder pages'); }, 'grid'], ['Edit Home Screen', function () { setEditing(true); }, 'grid']];
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
  /* "Show stats": iOS-style widget preview from an app icon */
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
  function openCtxFor(cell, point) {
    var dc = cell.getAttribute('data-cell'), parts = dc.split(':');
    if (parts[0] === 'app' || parts[0] === 'lib') openCtx('app', parts[1], cell.querySelector('.app__ic') || cell, point);
    else openCtx('w', dc.slice(2), cell, point);
  }
  function removeCell(key) {
    var parts = key.split(':');
    if (parts[0] === 'app') {
      var a = app(parts[1]);
      if (isPinned(a.id)) pinned.splice(pinned.indexOf(a.id), 1), savePins();
      S.removed[a.id] = 1; refreshAll();
      toast(a.name + ' moved to the App Library.', 'Undo', function () { delete S.removed[a.id]; refreshAll(); });
    } else {
      var f = findItem(parts[1]); if (!f) return;
      PAGES[f.p].splice(f.i, 1); saveLayout(); refreshAll();
      toast('Widget removed.', 'Undo', function () { PAGES[f.p].splice(f.i, 0, f.it); saveLayout(); refreshAll(); });
    }
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
    closeOverlay(true);
    opener = document.activeElement;
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
      html = '<div class="sheet__grip" aria-hidden="true"></div><div class="sheet__hd"><h2 id="galH">Add widgets</h2><button type="button" class="icon-btn" data-act="closeOverlay" aria-label="Close"><span class="material-symbols-outlined ico" aria-hidden="true">close</span></button></div>' +
        '<label class="search search--pill"><span class="material-symbols-outlined ico ico--sm" aria-hidden="true">search</span><span class="vh">Search widgets</span><input type="search" id="galQ" placeholder="Search Widgets" value="' + esc(root._galQ || '') + '"></label>' +
        '<p class="muted" style="margin-top:10px;font-size:13px">Every module has a stats widget in Small, Medium and Large. ' + list.length + ' of ' + WTYPES.length + ' shown.</p>' +
        '<ul class="gal-grid" id="galGrid">' +
        (savedKeys.length ? '<li class="gal-sec" id="galFocus">From Focus Hub</li>' + savedKeys.map(function (k) {
          return '<li class="gcell"><button type="button" class="gtile" data-act="galPick" data-t="item" data-ref="' + k + '"><span class="gprev" aria-hidden="true">' + widgetBody('item', 'S', { ref: k }) + '</span><b>' + esc(SAVE[k].t) + '</b><small>' + esc(SAVE[k].type) + ' · saved</small></button></li>';
        }).join('') + '<li class="gal-sec">Modules</li>' : '') + list.map(function (t) {
          return '<li class="gcell"><button type="button" class="gtile" data-act="galPick" data-t="' + t + '"><span class="gprev" aria-hidden="true">' + widgetBody(t, 'S') + '</span><b>' + esc(app(t).name) + '</b><small>' + esc(app(t).sub) + '</small></button></li>';
        }).join('') + '</ul>' + (list.length ? '' : '<p class="muted" style="margin-top:14px">No widgets match.</p>');
    } else {
      var isItem = gal.type === 'item', im = isItem ? itemMeta(gal.ref) : null;
      var a = isItem ? itemApp(im) : app(gal.type), sizes = SZ.slice(0, maxSz() + 1);
      var gTitle = isItem ? im.t : a.name, gDesc = isItem ? 'Your saved ' + im.type.toLowerCase() + ' from Focus Hub, kept on the Home Screen. Tap it to open it.' : (a.description || a.sub + ': key stats at a glance.');
      var avail = stacks().filter(function (x) { return !x.items.some(function (e) { return isItem ? (e && e.ref === gal.ref) : e === gal.type; }); });
      var canStack = gal.mode === 'add' && avail.length;
      html = '<div class="sheet__grip" aria-hidden="true"></div><div class="sheet__hd">' +
        (gal.mode === 'add' ? '<button type="button" class="icon-btn" data-act="galBack" aria-label="Back to all widgets"><span class="material-symbols-outlined ico" aria-hidden="true">chevron_left</span></button>' : '') +
        '<span class="app__ic" ' + tileStyle(a, '--ic:30px') + ' aria-hidden="true">' + glyph(a) + '</span><h2 id="galH">' + esc(gTitle) + '</h2><button type="button" class="icon-btn" data-act="closeOverlay" aria-label="Close"><span class="material-symbols-outlined ico" aria-hidden="true">close</span></button></div>' +
        '<div class="gdet"><h3>' + esc(gTitle) + '</h3><p>' + esc(gDesc) + '</p>' +
        '<div class="gstage"><button type="button" class="icon-btn" data-act="galSize" data-d="-1" aria-label="Smaller size"' + (gal.size === 'S' ? ' disabled' : '') + '><span class="material-symbols-outlined ico" aria-hidden="true">chevron_left</span></button>' +
        '<div class="wg wg--' + gal.size + '" aria-hidden="true"><span class="wg__btn">' + widgetBody(gal.type, gal.size === 'XL' ? 'L' : gal.size, { ref: gal.ref }) + '</span></div>' +
        '<button type="button" class="icon-btn" data-act="galSize" data-d="1" aria-label="Larger size"' + (gal.size === 'L' ? ' disabled' : '') + '><span class="material-symbols-outlined ico" aria-hidden="true">chevron_right</span></button></div>' +
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
  function openStackSheet(wid) {
    closeOverlay(true); opener = document.activeElement; S.overlay = 'stack';
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
    closeOverlay(true);
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
    $('#appPin').setAttribute('aria-label', 'Keep ' + a.name + ' in Dock');
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
    updateAppHeader(); syncInert();
    $('#appTitle').focus({ preventScroll: true });
    updateTitle();
  }
  function closeApp() {
    if (!S.app) return;
    var id = S.app; S.app = null;
    $('#appwin').hidden = true; ui.classList.remove('app-open'); $('#appwin').classList.remove('is-thread');
    syncInert();
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
    PAGES.forEach(function (pg) { pg.forEach(function (x) { if (x.ref === k) n++; if (x.type === 'stack') x.items.forEach(function (e) { if (e && e.ref === k) n++; }); }); });
    return n;
  }
  function removeItemWidgets(k) {
    PAGES = PAGES.map(function (pg) {
      return pg.filter(function (x) {
        if (x.ref === k) return false;
        if (x.type === 'stack') { x.items = x.items.filter(function (e) { return !(e && e.ref === k); }); x.idx = 0; return x.items.length > 0; }
        return true;
      });
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
      if (S.app || S.overlay || S.editing || (ae && ae.closest && ae.closest('.wg--stack'))) return;
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
    library: function () { setPage(S.nPages); $('#libQ').focus({ preventScroll: true }); },
    libCancel: function () { S.libQ = ''; $('#libQ').value = ''; renderLibrary(); setPage(0); },
    az: function (el) { var t = $('#lib-' + el.dataset.l); if (t) t.scrollIntoView({ block: 'start' }); },
    edit: function () { setEditing(true); },
    done: function () { setEditing(false); },
    gallery: function () { openGallery(); },
    page: function (el) { setPage(+el.dataset.p); },
    prevPage: function () { setPage(S.page - 1); },
    nextPage: function () { setPage(S.page + 1); },
    stackTo: function (el) { var f = findItem(el.dataset.w); if (!f) return; f.it.idx = +el.dataset.i; renderHome(); var b = $('[data-act="stackTo"][data-w="' + el.dataset.w + '"][data-i="' + el.dataset.i + '"]'); if (b) b.focus(); },
    libAdd: function (el) { openGallery({ type: el.dataset.id, size: 'M', mode: 'add' }); },
    peekOpen: function (el) { openApp(el.dataset.id); },
    peekAdd: function (el) { openGallery({ type: el.dataset.id, size: 'M', mode: 'add' }); },
    closeOverlay: function () { closeOverlay(); },
    closeOverlayBg: function (el, e) { if (e.target === el) closeOverlay(); },
    galPick: function (el) { gal = { type: el.dataset.t, ref: el.dataset.ref, size: 'M', mode: 'add', toStack: S.pendingStack || '' }; renderGallery(); updateTitle(); },
    galBack: function () { gal = null; renderGallery(); },
    galSize: function (el) { var s = SZ.slice(0, maxSz() + 1), i = s.indexOf(gal.size) + +el.dataset.d; gal.size = s[Math.max(0, Math.min(s.length - 1, i))]; renderGallery(); var b = $('[data-act="galSize"][data-d="' + el.dataset.d + '"]'); if (b && !b.disabled) b.focus(); else $('#galSizes [aria-pressed="true"]').focus(); },
    galSet: function (el) { gal.size = el.dataset.s; renderGallery(); $('#galSizes [data-s="' + el.dataset.s + '"]').focus(); },
    galStack: function (el) { gal.toStack = el.dataset.w; renderGallery(); var b = $('[data-act="galStack"][data-w="' + el.dataset.w + '"]'); if (b) b.focus(); },
    galAdd: function () {
      if (gal.mode === 'edit') { closeOverlay(true); setSize(gal.wid, gal.size); return; }
      var isItem = gal.type === 'item', name = isItem ? entryName({ ref: gal.ref }) : app(gal.type).name, sf = gal.toStack ? findItem(gal.toStack) : null;
      var snap = snapshot();
      S.pendingStack = '';
      if (sf) { var st = sf.it; st.items.push(isItem ? { type: 'item', ref: gal.ref } : gal.type); st.idx = st.items.length - 1; toast(name + ' added to the ' + st.name + ' stack', 'Undo', function () { restore(snap); }); }
      else {
        var pg = placeNew(isItem ? { k: 'w', id: newId(), type: 'item', ref: gal.ref, size: gal.size } : { k: 'w', id: newId(), type: gal.type, size: gal.size });
        toast(name + ' widget added to page ' + (pg + 1), 'Undo', function () { restore(snap); });
      }
      saveLayout();
      closeOverlay(true); renderHome(); updateTitle();
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
    home: function () { closeApp(); },
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
    var g = w.parentElement, gs = getComputedStyle(g), cols = gridCols();
    var gx = parseFloat(gs.columnGap) || 0, gy = parseFloat(gs.rowGap) || 0;
    var cw = (g.clientWidth - (cols - 1) * gx) / cols, rh = parseFloat(gs.gridAutoRows) || 90;
    var r = w.getBoundingClientRect(), ur = ui.getBoundingClientRect();
    rz = { id: f.it.id, from: eff(f.it.size), size: eff(f.it.size), x: r.left, y: r.top, ox: ur.left, oy: ur.top, cw: cw, rh: rh, gx: gx, gy: gy, cols: cols, el: w };
    w.classList.add('is-resizing');
    var gh = document.createElement('div'); gh.className = 'rs-ghost'; gh.setAttribute('aria-hidden', 'true'); gh.innerHTML = '<span></span>'; ui.appendChild(gh); rz.gh = gh;
    try { h.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    drawGhost();
  }, true);
  function drawGhost() {
    var sp = SPAN[rz.size], c = Math.min(sp[0], rz.cols);
    rz.gh.style.left = (rz.x - rz.ox) + 'px'; rz.gh.style.top = (rz.y - rz.oy) + 'px';
    rz.gh.style.width = (c * rz.cw + (c - 1) * rz.gx) + 'px'; rz.gh.style.height = (sp[1] * rz.rh + (sp[1] - 1) * rz.gy) + 'px';
    rz.gh.firstChild.textContent = SZ_NAME[rz.size];
  }
  document.addEventListener('pointermove', function (e) {
    if (!rz) return;
    var fx = (e.clientX - rz.x + rz.gx) / (rz.cw + rz.gx), fy = (e.clientY - rz.y + rz.gy) / (rz.rh + rz.gy);
    var s2 = (fx < 3 && fy < 3) ? 'S' : fy < 3 ? 'M' : (fx >= 6.5 && maxSz() >= 3) ? 'XL' : 'L';
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
     Edit mode: press and drag any icon or widget. A lifted ghost follows the pointer, the grid
     shifts live to show the drop slot, holding at a screen edge for ~0.5 s changes page, the dock
     pins/unpins apps, and dropping a widget on the middle of a stack adds it to the stack.
     Keyboard: Alt + arrow keys on an item, or Move earlier / later in its ⋯ menu. */
  function itemKey(x) { return (x.k === 'a' ? 'app:' : 'w:') + x.id; }
  function isHidden(x) { return x.k === 'a' && (isPinned(x.id) || S.removed[x.id]); }
  function moveItem(key, dir) {
    var flat = [];
    PAGES.forEach(function (pg, p) { pg.forEach(function (x, i) { if (!isHidden(x)) flat.push({ p: p, i: i, x: x }); }); });
    var at = flat.map(function (f) { return itemKey(f.x); }).indexOf(key);
    if (at < 0) { toast('Pinned apps are ordered in the Dock'); return; }
    var to = at + dir;
    if (to < 0 || to >= flat.length) { toast(dir < 0 ? 'Already first' : 'Already last'); return; }
    var snap = snapshot(), a = flat[at], b = flat[to];
    if (a.p === b.p) { PAGES[a.p][a.i] = b.x; PAGES[b.p][b.i] = a.x; }
    else { PAGES[a.p].splice(a.i, 1); if (dir > 0) PAGES[b.p].splice(0, 0, a.x); else PAGES[b.p].push(a.x); }
    PAGES = PAGES.filter(function (pg) { return pg.length; });
    saveLayout(); renderHome();
    var cell = $('[data-cell="' + key + '"]');
    if (cell) { var pgEl = cell.closest('.page'); if (pgEl) setPage(+pgEl.dataset.page); var fb = cell.querySelector('button'); if (fb) fb.focus({ preventScroll: true }); }
    toast('Moved ' + (dir < 0 ? 'earlier' : 'later'), 'Undo', function () { restore(snap); });
  }

  var dg = null, pend = null, press = null;
  var DRAG_THRESHOLD = 6;
  function dragCandidate(t) {
    if (!t || !t.closest || t.closest('.rs, .rm, .pin-b, .more, .app__more, .stack-dots')) return null;
    return t.closest('#homePages [data-cell], #dock [data-cell]');
  }
  function beginDrag(cell, e) {
    var r = cell.getBoundingClientRect();
    var ghost = cell.cloneNode(true);
    ghost.classList.add('drag-ghost'); ghost.removeAttribute('data-cell'); ghost.setAttribute('aria-hidden', 'true');
    ghost.style.width = r.width + 'px'; ghost.style.height = r.height + 'px';
    document.body.appendChild(ghost);
    cell.classList.add('is-drag-src');
    ui.classList.add('is-dragging');
    dg = { key: cell.dataset.cell, el: cell, ghost: ghost, dx: e.clientX - r.left, dy: e.clientY - r.top, snap: snapshot(), edgeDir: 0, edgeTimer: null, merge: null, last: null, dockFull: false,
      fromDock: !!cell.closest('#dock'), wasFixed: cell.hasAttribute('data-fixed') };
    clearTimeout(lpTimer); drag = null;
    moveDrag(e);
  }
  function moveDrag(e) {
    dg.ghost.style.transform = 'translate(' + (e.clientX - dg.dx) + 'px,' + (e.clientY - dg.dy) + 'px) scale(1.05)';
    edgePaging(e);
    var under = document.elementFromPoint(e.clientX, e.clientY);
    var isApp = dg.key.indexOf('app:') === 0, dock = $('#dock');
    setMerge(null); dock.classList.remove('is-drop'); dg.dockFull = false;
    if (!under) return;
    if (under.closest('#dock')) {
      if (!isApp) return;
      var inDock = $$('#dock [data-cell]').filter(function (c) { return c !== dg.el; }).length;
      if (dg.el.parentElement !== dock && inDock >= dockLimit()) { dg.dockFull = true; return; }
      dock.classList.add('is-drop');
      var dt = under.closest('#dock [data-cell]');
      if (dt && dt !== dg.el) insertBy(dt, e);
      else if (!dt && dg.el.parentElement !== dock) dock.insertBefore(dg.el, dock.querySelector('.dock-slot, .dock-empty'));
      return;
    }
    var page = under.closest('.page.is-current'); if (!page || page.id === 'libPage') return;
    var t = under.closest('[data-cell]');
    if (t && t !== dg.el && t.parentElement && t.parentElement.classList.contains('sb-grid')) {
      if (t.classList.contains('wg--stack') && !isApp && !dg.el.classList.contains('wg--stack')) {
        var r = t.getBoundingClientRect();
        if (Math.abs(e.clientX - (r.left + r.width / 2)) < r.width * 0.25 && Math.abs(e.clientY - (r.top + r.height / 2)) < r.height * 0.25) { setMerge(t); return; }
      }
      insertBy(t, e);
    } else if (!t) {
      var grid = $('.sb-grid', page);
      if (grid && grid.lastElementChild !== dg.el) { grid.appendChild(dg.el); dg.last = null; }
    }
  }
  function insertBy(t, e) {
    var r = t.getBoundingClientRect(), before = e.clientX < r.left + r.width / 2;
    var sig = t.dataset.cell + (before ? '<' : '>');
    if (dg.last === sig) return;
    dg.last = sig;
    t.parentElement.insertBefore(dg.el, before ? t : t.nextSibling);
  }
  function setMerge(t) { if (dg.merge && dg.merge !== t) dg.merge.classList.remove('is-merge-target'); dg.merge = t; if (t) t.classList.add('is-merge-target'); }
  function edgePaging(e) {
    var pw = $('#pagesWrap').getBoundingClientRect();
    var inY = e.clientY > pw.top && e.clientY < pw.bottom;
    var dir = !inY ? 0 : e.clientX < pw.left + 40 ? -1 : e.clientX > pw.right - 40 ? 1 : 0;
    if (dir === dg.edgeDir) return;
    clearTimeout(dg.edgeTimer); dg.edgeDir = dir;
    if (dir) dg.edgeTimer = setTimeout(function () { flipPage(dir); }, 500);
  }
  function flipPage(dir) {
    if (!dg) return;
    var target = S.page + dir;
    if (target < 0) return;
    if (target >= S.nPages) {
      $('#homePages').insertAdjacentHTML('beforeend', '<section class="page" data-page="' + S.nPages + '" aria-label="Home page ' + (S.nPages + 1) + '"><div class="sb-grid"></div></section>');
      S.nPages++; $('#libPage').dataset.page = S.nPages;
    }
    setPage(target);
    var grid = $('.page.is-current .sb-grid'); if (grid && dg.el.closest('#homePages')) { grid.appendChild(dg.el); dg.last = null; }
    dg.edgeDir = 0; dg.edgeTimer = setTimeout(function () { if (dg && dg.edgeDir === 0) dg.edgeDir = 0; }, 0);
  }
  function commitFromDom() {
    var byKey = {}, home = {};
    PAGES.forEach(function (pg, p) { pg.forEach(function (x) { byKey[itemKey(x)] = x; home[itemKey(x)] = p; }); });
    var draggedApp = dg.key.indexOf('app:') === 0 ? dg.key.slice(4) : null;
    var inDock = !!dg.el.closest('#dock');
    var dockIds = $$('#dock [data-cell]').map(function (c) { return c.dataset.cell.slice(4); });
    var fixedIds = $$('#homePages [data-fixed]').filter(function (c) { return c !== dg.el; }).map(function (c) { return c.dataset.cell.slice(4); });
    var newPinned = dockIds.concat(fixedIds.filter(function (id) { return dockIds.indexOf(id) < 0; }));
    if (draggedApp && !inDock) newPinned = newPinned.filter(function (id) { return id !== draggedApp; });
    if (newPinned.length > MAX_PINS) { toast('Up to ' + MAX_PINS + ' pins. Unpin a module first.'); return false; }
    var pages = $$('#homePages .sb-grid').map(function (g) {
      return $$('[data-cell]', g).filter(function (c) { return c.parentElement === g && !c.hasAttribute('data-fixed') || c === dg.el && !inDock; })
        .map(function (c) { return byKey[c.dataset.cell] || (c.dataset.cell.indexOf('app:') === 0 ? { k: 'a', id: c.dataset.cell.slice(4) } : null); })
        .filter(Boolean);
    });
    /* keep hidden apps (pinned or removed) in the model, on the page they came from */
    var seen = {};
    pages.forEach(function (pg) { pg.forEach(function (x) { seen[itemKey(x)] = 1; }); });
    Object.keys(byKey).forEach(function (k) {
      if (seen[k]) return;
      var x = byKey[k];
      if (dg.merge && k === dg.key) return;
      var p = Math.min(home[k], pages.length - 1);
      (pages[p] || pages[pages.length - 1]).push(x);
    });
    PAGES = pages.filter(function (pg) { return pg.length; });
    pinned = newPinned;
    return true;
  }
  function endDrag(cancel) {
    if (!dg) return;
    var d = dg; dg = null;
    clearTimeout(d.edgeTimer);
    d.ghost.remove(); d.el.classList.remove('is-drag-src'); ui.classList.remove('is-dragging'); $('#dock').classList.remove('is-drop');
    if (d.merge) d.merge.classList.remove('is-merge-target');
    suppress = true; setTimeout(function () { suppress = false; }, 50);
    if (cancel) { restore(d.snap); toast('Move cancelled'); return; }
    if (d.dockFull) toast('The Dock is full (' + dockLimit() + '). Unpin an app first.');
    dg = d;
    var merged = false;
    if (d.merge) {
      var sf = findItem(d.merge.dataset.cell.slice(2)), wf = findItem(d.key.slice(2));
      if (sf && wf) {
        sf.it.items.push(wf.it.type === 'item' ? { type: 'item', ref: wf.it.ref } : wf.it.type);
        sf.it.idx = sf.it.items.length - 1;
        PAGES[wf.p].splice(wf.i, 1);
        PAGES = PAGES.filter(function (pg) { return pg.length; });
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
      var nc = $('#homePages [data-cell="' + key + '"], #dock [data-cell="' + key + '"]');
      if (nc) { try { ui.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } beginDrag(nc, e); }
    }
  }, true);
  document.addEventListener('pointerup', function () { pend = null; press = null; if (dg) endDrag(false); }, true);
  document.addEventListener('pointercancel', function () { pend = null; press = null; if (dg) endDrag(true); }, true);

  /* gestures: swipe pages, swipe stack, pull-down search, swipe-down NC, long-press menu, swipe-up home */
  var drag = null, lpTimer = null, suppress = false;
  ui.addEventListener('pointerdown', function (e) {
    if (e.button > 0) return;
    drag = { x: e.clientX, y: e.clientY, t: e.target, moved: false };
    var cell = e.target.closest('.app-cell, .wg, .lib-row');
    var inHome = e.target.closest('#pages');
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
    if (d.t.closest('#homeInd') && dy < -30) { closeApp(); return; }
    if (S.app || S.overlay) return;
    if (d.t.closest('.status') && dy > 50) { openNC(); return; }
    if (!d.t.closest('#pages')) return;
    if (S.editing && d.t.closest('#homePages [data-cell]')) return;
    var st = d.t.closest('.wg--stack');
    if (st && ay > 30 && ay > ax) { rotateStack(st.dataset.cell.slice(2), dy < 0 ? 1 : -1); return; }
    if (ax > 60 && ax > ay) { if (dx > 0) { if (S.page === 0) openNC(); else setPage(S.page - 1); } else setPage(S.page + 1); return; }
    if (dy > 70 && ax < 40 && S.page < S.nPages) openSpot();
  });
  ui.addEventListener('pointercancel', function () { clearTimeout(lpTimer); drag = null; });
  document.addEventListener('click', function (e) { if (suppress) { suppress = false; e.stopPropagation(); e.preventDefault(); } }, true);
  ui.addEventListener('wheel', function (e) {
    var st = e.target.closest('.wg--stack');
    if (st && Math.abs(e.deltaY) > 20 && !S.editing) { e.preventDefault(); if (!ui._wl) { ui._wl = 1; rotateStack(st.dataset.cell.slice(2), e.deltaY > 0 ? 1 : -1); setTimeout(function () { ui._wl = 0; }, 500); } }
  }, { passive: false });
  ui.addEventListener('contextmenu', function (e) {
    if (S.editing || S.app || S.overlay) return;
    if (!e.target.closest('#pages, #dock')) return;
    e.preventDefault();
    var cell = e.target.closest('.app-cell, .wg, .lib-row');
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
    var mc = e.altKey && e.target.closest && e.target.closest('#homePages [data-cell]');
    if (mc && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) > -1) {
      e.preventDefault(); moveItem(mc.dataset.cell, (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 1); return;
    }
    var rh0 = e.target.closest && e.target.closest('.rs');
    if (rh0 && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key) > -1) {
      e.preventDefault();
      var fi = findItem(rh0.dataset.resize); if (!fi) return;
      var cur = SZ.indexOf(eff(fi.it.size)), nx = Math.max(0, Math.min(maxSz(), cur + ((e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1)));
      if (nx !== cur) setSize(fi.it.id, SZ[nx]); else toast(nx === 0 ? 'Already the smallest size' : 'Largest size for this screen');
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
      var cell = e.target.closest('.app-cell, .wg, .lib-row'); if (cell) { e.preventDefault(); openCtxFor(cell); return; }
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
    if (!S.app && !S.overlay && (e.key === 'PageDown' || e.key === 'PageUp')) { e.preventDefault(); setPage(S.page + (e.key === 'PageDown' ? 1 : -1)); }
  });
  $('#libQ').addEventListener('input', function (e) { S.libQ = e.target.value; renderLibrary(); });
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
  var lastLim = dockLimit();
  window.addEventListener('resize', function () {
    if (!isMobile()) { $('#ticketForm').classList.remove('is-open'); $('#appwin').classList.remove('is-thread'); }
    else if ($('#chat').classList.contains('is-open') && S.app === 'communication') $('#appwin').classList.add('is-thread');
    lastLim = dockLimit(); clearTimeout(window._rh); window._rh = setTimeout(renderHome, 120);
    if (S.app) updateAppHeader();
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
