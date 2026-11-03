/* ANTZ module widgets: every module's widget in two sizes, in the Style 6 look.
   small = the 1:1 card (one number, its label, one status); large = the detailed card
   (charts, lists, period tabs). card(id, size) returns the whole <article class="w w--s|w--l">.
   Styles live in widget-lib.css, which index.html loads inside each widget's shadow root so
   they never clash with the page. Needs config.js and data.js.
   Lifted from ideations/5 Module widgets/style6-widgets.html. */
(function () {
  var CFG = window.ANTZ_CONFIG, DATA = window.ANTZ_DATA, D = CFG.data || {}, IMG = CFG.images || {};
  var fmt = DATA.fmt, $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var ORDER = ['Animals', 'Medical & care', 'Antz Kitchen', 'Operations', 'Team', 'Records', 'Admin'];
  var state = { site: 'all', group: 'All', q: '', period: {}, size: 'both' };

  /* Module names and one-liners as the ANTZ mobile app has them (github.com/ANTZ-Systems/antz_mobile_app).
     Only this page uses them; config.js keeps its own copy for the other pages. */
  var APP = {
    collections: ['Taxonomic Hierarchy', 'Class, order, family, genus, species'],
    animals: ['Animals', 'Single and group animals, by sex and status'],
    housing: ['Housing', 'Sites, sections and enclosures'],
    natality: ['Natality', 'Births recorded'],
    training: ['Training', 'Sessions and their progress'],
    'k-diet': ['Diet', 'By species, directory and changes'],
    'k-kitchen': ['Kitchen', 'Prep sheet, packing stations, keeper areas'],
    'k-inventory': ['Inventory', 'Stock, goods received, vendors'],
    'k-invoices': ['Invoices', 'Receipt reconciliation'],
    'k-procurement': ['Procurement', 'Weekly and monthly plans, forecast'],
    'k-mis': ['MIS', 'Coverage, receiving, wastage, gate'],
    'k-gate': ['Gate & Security', 'Gate visits'],
    'k-admin': ['Kitchen Admin', 'Users, roles, audit reports, kiosk logs'],
    mortality: ['Mortality', 'Deaths, approvals and carcass transfers'],
    necropsy: ['Necropsy', 'Requests, drafts and reports'],
    eggs: ['Eggs', 'Collected, nest box, nursery, hatched'],
    fetal: ['Fetal Death', 'Still births and abortions'],
    tags: ['Tags', 'Public and private labels'],
    medical: ['Medical Record', 'Active and closed cases'],
    administer: ['Administer', 'Today’s doses'],
    diet: ['Species Diet', 'Species with and without a diet'],
    lab: ['Lab', 'Requests and samples'],
    pharmacy: ['Pharmacy', 'Store requests and dispensing'],
    approvals: ['Approval Task', 'Animal transfer requests'],
    audit: ['Enclosure Audit', 'Headcount verification'],
    reports: ['Reports', 'Insights by site and species'],
    security: ['Security', 'Transfer checkpoint by site'],
    compliance: ['Compliance', 'Organisations and their holdings'],
    notes: ['Notes', 'Observations, by priority'],
    announcements: ['Announcements', 'News for your sites and roles'],
    communication: ['Communication', 'Chats and groups'],
    focus: ['My Focus Hub', 'Favourites, bookmarks and folders'],
    help: ['Requests', 'Help desk requests and approvals'],
    users: ['Users', 'Staff, roles and activity']
  };
  /* Natality and Training are modules in the app but not in config.js */
  var apps = (CFG.modules || []).concat([{ id: 'natality', name: 'Natality', icon: 'child_care', colour: '#37BD69', group: 'Animals' }, { id: 'training', name: 'Training', icon: 'model_training', colour: '#7B6CF0', group: 'Animals' }]);
  /* Antz Kitchen (kitchen.dev.antzsystems.com): the web console behind Diet. Built from its menus; numbers are samples */
  apps = apps.concat([
    { id: 'k-diet', icon: 'restaurant', colour: '#1E8F5A', group: 'Antz Kitchen', kitchen: 1 },
    { id: 'k-kitchen', icon: 'skillet', colour: '#C98A12', group: 'Antz Kitchen', kitchen: 1 },
    { id: 'k-inventory', icon: 'inventory_2', colour: '#3E6E8E', group: 'Antz Kitchen', kitchen: 1 },
    { id: 'k-invoices', icon: 'receipt_long', colour: '#4F5D66', group: 'Antz Kitchen', kitchen: 1 },
    { id: 'k-procurement', icon: 'local_shipping', colour: '#2C7A7B', group: 'Antz Kitchen', kitchen: 1 },
    { id: 'k-mis', icon: 'monitoring', colour: '#B4466C', group: 'Antz Kitchen', kitchen: 1 },
    { id: 'k-gate', icon: 'shield', colour: '#B3261E', group: 'Antz Kitchen', kitchen: 1 },
    { id: 'k-admin', icon: 'admin_panel_settings', colour: '#C4581F', group: 'Antz Kitchen', kitchen: 1 }
  ]);
  apps.forEach(function (a) { var x = APP[a.id]; if (x) { a.appName = x[0]; a.appSub = x[1]; a.name = a.name || x[0]; } });
  var TONE = { 'k-diet': 't-deep', 'k-kitchen': 't-butter', 'k-gate': 't-night', 'k-mis': 't-dew', animals: 't-cyan', approvals: 't-teal', mortality: 't-night', housing: 't-lime', eggs: 't-egg', natality: 't-dew', diet: 't-coral', compliance: 't-navy', collections: 't-deep', focus: 't-butter', security: 't-navy', administer: 't-teal' };

  /* sample figures the app tracks but data.js does not: fixed per site, so they never jump on reload */
  function rng(key) { var h = 2166136261; for (var i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); } return function () { h += 0x6D2B79F5; var t = h; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function sample(mod) { var r = rng(state.site + ':' + mod); return function (a, b) { return Math.floor(a + r() * (b - a + 1)); }; }
  var val = function (mod, key, a, b) { return sample(mod + ':' + key)(a, b); };

  /* animals with photos, from config.js and data.js */
  var SPECIES = D.species || [];
  var POOL = (D.animals || []).map(function (a) { return Object.assign({ sp: SPECIES[0] ? SPECIES[0][0] : '' }, a); });
  Object.keys(DATA.animalsBySpecies || {}).forEach(function (si) { DATA.animalsBySpecies[si].forEach(function (a) { POOL.push(Object.assign({ sp: SPECIES[si][0] }, a)); }); });
  var photo = function (a) { return IMG[a.id] || IMG[a.sp] || ''; };
  var siteName = function () { return DATA.site(state.site).name; };
  var mine = function (list) { var n = siteName(); return state.site === 'all' ? list : list.filter(function (a) { return a.site === n; }).concat(list).slice(0, list.length); };

  /* ---- shared pieces ---- */
  function head(a, extra) {
    return '<div class="w__hd"><span class="w__ic"><span class="ms">' + esc(a.icon) + '</span></span><div class="w__t"><b>' + esc(a.appName || a.name) + (a.id === 'natality' || a.id === 'training' ? '<span class="newb">New</span>' : '') + (a.kitchen ? '<span class="kit">Kitchen</span>' : '') + '</b><small>' + esc(a.appSub || a.sub || '') + '</small></div>' +
      (extra || '') + '<a class="go" href="index.html" aria-label="Open ' + esc(a.appName || a.name) + '"><span class="ms">arrow_outward</span></a></div>';
  }
  function big(v, l, t) { return '<div class="w__k"><b>' + esc(v) + '</b><span>' + esc(l) + '</span></div>' + (t ? '<div class="w__trend">' + t + '</div>' : ''); }
  function tabs(id, opts, cur) { return '<span class="seg" role="group" aria-label="Period">' + opts.map(function (o) { return '<button type="button" data-per="' + id + ':' + o[0] + '" aria-pressed="' + (cur === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</span>'; }
  function per(id, def) { return state.period[id] || def; }
  function split(parts) {
    var t = parts.reduce(function (s, p) { return s + p[1]; }, 0) || 1;
    return '<div class="split" role="img" aria-label="' + esc(parts.map(function (p) { return p[0] + ' ' + p[1]; }).join(', ')) + '">' + parts.map(function (p) { return '<i style="width:' + (p[1] / t * 100).toFixed(1) + '%;background:' + p[2] + '"></i>'; }).join('') + '</div>' +
      '<div class="leg">' + parts.map(function (p) { return '<span><i class="dot" style="background:' + p[2] + '"></i>' + esc(p[0]) + ' <b class="num">' + fmt(p[1]) + '</b></span>'; }).join('') + '</div>';
  }
  function stats4(items) { return '<div class="stats4" style="--n:' + items.length + '">' + items.map(function (x) { return '<div class="' + (x[2] ? 'hot' : '') + '"><b>' + fmt(x[0]) + '</b><small>' + esc(x[1]) + '</small></div>'; }).join('') + '</div>'; }
  function flow(steps, on) { return '<div class="flow" style="--n:' + steps.length + '">' + steps.map(function (x, i) { return '<div class="' + (i === on ? 'on' : '') + '"><b>' + fmt(x[0]) + '</b><small>' + esc(x[1]) + '</small></div>'; }).join('') + '</div>'; }
  function rows(list) { return '<ul class="rowx w__foot">' + list.map(function (x) { return '<li><b>' + x[0] + '</b><small>' + x[1] + '</small>' + (x[2] || '') + '</li>'; }).join('') + '</ul>'; }
  var chip = function (t, cls) { return '<span class="chipc ' + (cls || '') + '">' + esc(t) + '</span>'; };
  var idt = function (id) { return '<span class="idt">' + esc(id) + '</span>'; };
  function bars(items, pct) {
    var mx = Math.max.apply(null, items.map(function (x) { return x[1]; })) || 1;
    return '<div class="bars' + (pct ? ' pct' : '') + '" role="img">' + items.map(function (x, i) {
      var cls = pct ? (x[1] < 60 ? 'low' : i === 0 ? 'best' : '') : '';
      return '<div class="' + cls + '"><b>' + fmt(x[1]) + (pct ? '%' : '') + '</b><span><i style="height:' + Math.max(4, pct ? x[1] : x[1] / mx * 100).toFixed(1) + '%"></i></span><small title="' + esc(x[0]) + '">' + esc(x[0]) + '</small></div>';
    }).join('') + '</div>';
  }
  function rank(c) {
    var top = c.max || Math.max.apply(null, c.bars.map(function (b) { return b[1]; })) || 1;
    return '<ul class="rank">' + c.bars.slice(0, 5).map(function (b) {
      return '<li class="' + (c.warnBelow != null && b[1] < c.warnBelow ? 'low' : '') + '"><span>' + esc(b[0]) + '</span><b>' + fmt(b[1]) + (c.unit || '') + '</b><em><i style="width:' + Math.min(100, b[1] / top * 100).toFixed(1) + '%"></i></em></li>';
    }).join('') + '</ul>';
  }
  function area(series, labels) {
    /* the line stretches to the card's width; labels and the end dot are HTML so their Inter text and circle stay true */
    var W = 320, H = 108, T = 10, mx = Math.max.apply(null, series) * 1.15, mn = Math.min.apply(null, series) * .85, L = series.length - 1;
    var x = function (i) { return i * W / L; }, y = function (v) { return T + (1 - (v - mn) / ((mx - mn) || 1)) * (H - T); };
    var path = series.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join('');
    var ax = labels.map(function (l, i) { return (i % 3 === 0 && L - i >= 2) || i === L ? '<span style="left:' + (i / L * 100).toFixed(2) + '%" class="' + (i === 0 ? 'a0' : i === L ? 'aL' : '') + '">' + esc(l) + '</span>' : ''; }).join('');
    return '<div class="area"><div class="area__plot" style="height:' + H + 'px"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="Trend, latest ' + esc(String(series[L])) + '"><path class="fl" d="' + path + 'L' + W + ' ' + H + 'L0 ' + H + 'Z"/><path class="ln" d="' + path + '" vector-effect="non-scaling-stroke"/></svg>' +
      '<i class="area__dt" style="left:100%;top:' + (y(series[L]) / H * 100).toFixed(2) + '%"></i></div><div class="area__ax">' + ax + '</div></div>';
  }

  function ring(parts, centreV, centreL) {
    var t = parts.reduce(function (s, p) { return s + p[1]; }, 0) || 1, C = 2 * Math.PI * 44, off = 0;
    var arcs = parts.map(function (p) { var len = p[1] / t * C, el = '<circle r="44" cx="56" cy="56" stroke="' + p[2] + '" stroke-dasharray="' + len.toFixed(1) + ' ' + (C - len).toFixed(1) + '" stroke-dashoffset="' + (-off).toFixed(1) + '"/>'; off += len; return el; }).join('');
    return '<div class="ringrow"><div class="ring"><svg viewBox="0 0 112 112" role="img" aria-label="' + esc(parts.map(function (p) { return p[0] + ' ' + p[1]; }).join(', ')) + '"><circle class="bg" r="44" cx="56" cy="56"/>' + arcs + '</svg><span><span><b>' + esc(centreV) + '</b>' + esc(centreL) + '</span></span></div>' +
      '<ul class="ringleg">' + parts.map(function (p) { return '<li><i class="dot" style="background:' + p[2] + '"></i><span>' + esc(p[0]) + '</span><b>' + fmt(p[1]) + '</b></li>'; }).join('') + '</ul></div>';
  }
  /* ---- more chart types, so each large widget shows its data its own way ---- */
  var DAYS7 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  function leg(series) { return '<div class="leg">' + series.map(function (x) { return '<span><i class="dot" style="background:' + x[1] + '"></i>' + esc(x[0]) + '</span>'; }).join('') + '</div>'; }
  /* calendar heatmap: rowsIn = [[label, [values…]]], one column per cols label */
  function heat(rowsIn, cols) {
    var mx = Math.max.apply(null, rowsIn.reduce(function (t, r) { return t.concat(r[1]); }, [])) || 1;
    return '<div class="heat" style="--cols:' + cols.length + '" role="img" aria-label="Heatmap"><small></small>' + cols.map(function (c) { return '<small class="hc">' + esc(c) + '</small>'; }).join('') +
      rowsIn.map(function (r) { return '<small>' + esc(r[0]) + '</small>' + r[1].map(function (v) { return '<i style="opacity:' + (0.14 + v / mx * 0.86).toFixed(2) + '" title="' + v + '"></i>'; }).join(''); }).join('') + '</div>';
  }
  /* half-circle gauge for one share */
  function gauge(pct, label) {
    var L = Math.PI * 70, on = L * Math.max(0, Math.min(100, pct)) / 100;
    return '<div class="gaugec"><svg viewBox="0 0 160 88" role="img" aria-label="' + esc(pct + '% ' + label) + '"><path class="bg" d="M10 80 A70 70 0 0 1 150 80"/><path class="fg" d="M10 80 A70 70 0 0 1 150 80" stroke-dasharray="' + on.toFixed(1) + ' ' + L.toFixed(1) + '"/></svg><span><b>' + pct + '%</b>' + esc(label) + '</span></div>';
  }
  /* stacked columns: series = [[name, colour]], data[i] = one value per series for cats[i] */
  function stack(cats, series, data) {
    var mx = Math.max.apply(null, data.map(function (d) { return d.reduce(function (t, v) { return t + v; }, 0); })) || 1;
    return '<div class="stk" role="img" aria-label="' + esc(series.map(function (x) { return x[0]; }).join(', ')) + ' by period">' + cats.map(function (c, i) {
      return '<div><span>' + data[i].map(function (v, j) { return '<i style="height:' + (v / mx * 100).toFixed(1) + '%;background:' + series[j][1] + '" title="' + esc(series[j][0] + ' ' + v) + '"></i>'; }).join('') + '</span><small>' + esc(c) + '</small></div>';
    }).join('') + '</div>' + leg(series);
  }
  /* 100 squares, one per percent */
  function waffle(pct, label) {
    var n = Math.round(pct), cells = ''; for (var i = 0; i < 100; i++) cells += '<i' + (i < n ? ' class="on"' : '') + '></i>';
    return '<div class="waf" role="img" aria-label="' + esc(n + '% ' + label) + '">' + cells + '</div>';
  }
  /* lollipops: [[label, value]] */
  function lolli(items) {
    var mx = Math.max.apply(null, items.map(function (x) { return x[1]; })) || 1;
    return '<div class="lol" role="img" aria-label="' + esc(items.map(function (x) { return x[0] + ' ' + x[1]; }).join(', ')) + '">' + items.map(function (x) { return '<div><span><i style="height:' + (8 + x[1] / mx * 82).toFixed(1) + '%"><b>' + fmt(x[1]) + '</b></i></span><small>' + esc(x[0]) + '</small></div>'; }).join('') + '</div>';
  }
  /* concentric activity rings: [[label, value, of, colour]] */
  function rings(parts) {
    var svg = parts.map(function (p, i) { var r = 50 - i * 13, C = 2 * Math.PI * r, on = C * Math.min(1, p[1] / (p[2] || 1)); return '<circle class="bg" r="' + r + '" cx="60" cy="60"/><circle r="' + r + '" cx="60" cy="60" stroke="' + p[3] + '" stroke-dasharray="' + on.toFixed(1) + ' ' + C.toFixed(1) + '"/>'; }).join('');
    return '<div class="ringrow"><div class="ring rings"><svg viewBox="0 0 120 120" role="img" aria-label="' + esc(parts.map(function (p) { return p[0] + ' ' + p[1] + ' of ' + p[2]; }).join(', ')) + '">' + svg + '</svg></div>' +
      '<ul class="ringleg">' + parts.map(function (p) { return '<li><i class="dot" style="background:' + p[3] + '"></i><span>' + esc(p[0]) + '</span><b>' + fmt(p[1]) + ' <small style="font-weight:400;color:var(--mute)">of ' + fmt(p[2]) + '</small></b></li>'; }).join('') + '</ul></div>';
  }
  var weeks = function (n) { return DATA.weeks.slice(-n); };
  var SAMPLE = '<span class="sample">Sample data</span>';

  /* ---- one widget per module, each built around what the app tracks ---- */
  var W = {
    collections: function (a) {
      var m = DATA.site(state.site), r = sample('tax');
      var cls = [['Mammals', .34, '#1D7E4C'], ['Birds', .30, '#46CADE'], ['Reptiles', .18, '#E0A21B'], ['Amphibians', .08, '#8479F9'], ['Fish', .10, '#FB7456']];
      var parts = cls.map(function (c) { return [c[0], Math.round(m.species * c[1]), c[2]]; });
      return head(a) + big(fmt(m.species), 'species', fmt(m.animals) + ' animals · ' + r(6, 14) + ' orders · ' + r(40, 90) + ' families') +
        '<div class="split" style="height:14px">' + parts.map(function (p) { return '<i style="width:' + (p[1] / m.species * 100).toFixed(1) + '%;background:rgba(255,255,255,' + (0.35 + parts.indexOf(p) * 0.13).toFixed(2) + ')"></i>'; }).join('') + '</div>' +
        '<div class="w__foot">' + rank({ bars: parts.map(function (p) { return [p[0], p[1]]; }) }) + '</div>';
    },
    animals: function (a) {
      var m = DATA.site(state.site), r = sample('animals'), groups = Math.round(m.animals * .06), single = m.animals - groups;
      var sx = [['Male', Math.round(single * .44), '#fff'], ['Female', Math.round(single * .47), 'rgba(255,255,255,.7)'], ['Undetermined', Math.round(single * .07), 'rgba(255,255,255,.45)'], ['Indeterminate', Math.round(single * .02), 'rgba(255,255,255,.25)']];
      var recent = mine(POOL).slice(0, 3);
      return head(a) + big(fmt(m.animals), 'animals', fmt(single) + ' single · ' + fmt(groups) + ' groups') +
        split(sx) + '<div class="note">Animals added per week, last 12 weeks</div>' + area(m.series.newAnimals, DATA.weeks) + stats4([[r(4, 18), 'In transit'], [m.hospital, 'Hospitalized', 1], [r(1, 6), 'Mortality approval pending', 1], [DATA.site(state.site).series.newAnimals.slice(-1)[0], 'Added this week']]) +
        rows(recent.map(function (x) { return [esc(x.n) + ' ' + idt(x.id), esc(x.sp + ' · ' + (x.sex || '') + ' · ' + (x.enc || '').split(' · ').pop()), chip(x.st, x.st === 'Under treatment' ? 'crit' : x.st === 'Quarantine' ? 'warn' : 'ok')]; })) + SAMPLE;
    },
    housing: function (a) {
      var m = DATA.site(state.site), list = state.site === 'all' ? DATA.sites.slice().sort(function (x, y) { return y.animals - x.animals; }).slice(0, 3) : [m];
      return head(a) + '<div class="tiles" style="--n:3"><div><b>' + (state.site === 'all' ? DATA.sites.length : 1) + '</b><small>Sites</small></div><div><b>' + fmt(m.sections) + '</b><small>Sections</small></div><div><b>' + fmt(m.enclosures) + '</b><small>Enclosures</small></div></div>' +
        '<div><div class="note" style="margin-bottom:8px">' + fmt(m.occupied) + ' of ' + fmt(m.enclosures) + ' enclosures occupied · ' + Math.round(m.occupied / m.enclosures * 100) + '%</div>' + waffle(m.occupied / m.enclosures * 100, 'enclosures occupied') + '</div>' +
        '<ul class="list w__foot">' + list.map(function (x) { return '<li><span>' + esc(x.name) + ' · ' + x.sections + ' sections · ' + fmt(x.enclosures) + ' enclosures</span><b>' + fmt(x.animals) + '</b></li>'; }).join('') + '</ul>';
    },
    natality: function (a) {
      var p = per('natality', '7'), m = DATA.site(state.site), n = p === '7' ? 1 : p === '30' ? 4 : 12, v = m.series.newAnimals.slice(-n).reduce(function (t, x) { return t + x; }, 0);
      var top = SPECIES.slice(0, 3).map(function (s, i) { return [s[0], Math.max(1, Math.round(v * [.22, .14, .09][i]))]; });
      return head(a, tabs('natality', [['7', '7D'], ['30', '30D'], ['90', '30+']], p)) + big(fmt(v), 'births recorded') +
        '<div class="note">Births per week</div>' + bars(m.series.newAnimals.slice(-8).map(function (x, i) { return [weeks(8)[i], x]; })) +
        '<ul class="rows w__foot">' + top.map(function (t) { var src = IMG[t[0]]; return '<li>' + (src ? '<img src="' + esc(src) + '" alt="">' : '<span class="ph"></span>') + '<span><b>' + esc(t[0]) + '</b><small>Top species this period</small></span><time>' + t[1] + ' births</time></li>'; }).join('') + '</ul>';
    },
    training: function (a) {
      var r = sample('training'), days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      var perDay = days.map(function (d) { return [d, r(4, 18)]; }), week = perDay.reduce(function (t, x) { return t + x[1]; }, 0);
      var month = val('training', 'month', 120, 320);
      var flag = [['Low motivation', 'warn'], ['Not trained ' + r(9, 21) + ' days', 'crit'], ['Not rated yet', 'mute']];
      return head(a) + big(fmt(month), 'sessions this month', (week / 7).toFixed(1) + ' a day, 7-day average') +
        stats4([[val('training', 'animals', 30, 90), 'Animals trained'], [r(40, 120), 'Training hours'], [val('training', 'drafts', 1, 6), 'Drafts to resume', 1]]) +
        '<div><div class="note" style="margin-bottom:8px">Sessions per day, 4 weeks · avg score ' + (3.2 + r(0, 14) / 10).toFixed(1) + ' of 5</div>' + heat(['3 wk ago', '2 wk ago', 'Last wk', 'This wk'].map(function (w, i) { return [w, DAYS7.map(function () { return i === 3 ? r(0, 18) : r(2, 18); })]; }), DAYS7) + '</div>' +
        '<div class="note">Needs attention</div>' +
        rows(mine(POOL).slice(2, 5).map(function (x, i) { return [esc(x.n) + ' ' + idt(x.id), esc(x.sp + ' · ' + ['Target training', 'Crate training', 'Station training'][i]), chip(flag[i][0], flag[i][1])]; })) + SAMPLE;
    },
    'k-diet': function (a) {
      var m = DATA.site(state.site), r = sample('k-diet'), cov = val('k-diet', 'cov', 82, 96), withD = Math.round(m.species * cov / 100);
      var ch = [['Asiatic Lion', 'Meat portion 4.5 → 5 kg', 'Updated', 'ok'], ['Great Hornbill', 'Added papaya, removed banana', 'Updated', 'ok'], ['Purple Frog', 'New diet from import', 'New', 'info']];
      return head(a) + big(cov + '%', 'species covered by a diet', fmt(withD) + ' of ' + fmt(m.species) + ' species') +
        '<div class="note">Diet changes per week</div>' + stack(weeks(6), [['Updated', '#fff'], ['New', '#A7F9C6'], ['Removed', 'rgba(255,255,255,.4)']], weeks(6).map(function () { return [r(2, 9), r(0, 5), r(0, 3)]; })) +
        stats4([[val('k-diet', 'plans', 300, 900), 'Diets in directory'], [val('k-diet', 'chg', 4, 18), 'Changes this week'], [r(0, 3), 'Imports to review', 1]]) +
        '<div class="note">Recent diet changes</div>' + rows(ch.map(function (x) { return [esc(x[0]), esc(x[1]), chip(x[2], x[3])]; })) + SAMPLE;
    },
    'k-kitchen': function (a) {
      var r = sample('k-kitchen'), planned = val('k-kitchen', 'plan', 380, 620), packed = val('k-kitchen', 'packed', 180, 360), prep = r(40, 90), left = Math.max(0, planned - packed - prep);
      var st = [['Station 1 · Carnivore Section', r(30, 60), r(60, 70)], ['Station 2 · Primates', r(20, 40), r(40, 50)], ['Station 3 · Aviary', r(10, 30), r(30, 40)]];
      return head(a) + ring([['Packed', packed, '#1E8F5A'], ['In prep', prep, '#F2B544'], ['To pack', left, '#E5DCC2']], Math.round(packed / planned * 100) + '%', 'packed today') +
        stats4([[val('k-kitchen', 'areas', 8, 18), 'Keeper areas'], [r(4, 9), 'Packing stations'], [r(10, 40), 'Prep sheet items']]) +
        '<div class="note">Packing stations</div>' + rows(st.map(function (x) { var d = x[1] >= x[2] ? 'Done' : x[1] + ' / ' + x[2]; return [esc(x[0]), 'Packaging list · ' + x[2] + ' packs', chip(d, x[1] >= x[2] ? 'ok' : 'warn')]; })) + SAMPLE;
    },
    'k-inventory': function (a) {
      var r = sample('k-inventory');
      var vend = [['FreshMeat Co', r(88, 99)], ['GreenLeaf Farms', r(80, 97)], ['Aqua Feeds', r(70, 95)], ['Seed & Grain', r(60, 92)]];
      return head(a) + stats4([[val('k-inventory', 'low', 3, 14), 'Items low on stock', 1], [r(8, 24), 'Goods received today'], [val('k-inventory', 'rej', 0, 4), 'Rejected', 1], [r(1, 6), 'Transfers']]) +
        '<div class="note">Vendor performance · on-time deliveries</div>' + rank({ bars: vend, unit: '%', max: 100, warnBelow: 75 }) +
        rows([['Chicken, whole', r(8, 20) + ' kg left · reorder at 40 kg', chip('Low', 'crit')], ['Carrots', r(15, 30) + ' kg left · reorder at 25 kg', chip('Low', 'warn')]]) + SAMPLE;
    },
    'k-invoices': function (a) {
      var r = sample('k-invoices'), mt = r(20, 60), mis = val('k-invoices', 'mis', 1, 6), pend = val('k-invoices', 'pend', 3, 14);
      return head(a) + big(fmt(pend), 'receipts to reconcile', fmt(mt) + ' matched this month') + stack(weeks(6), [['Matched', '#3DCB72'], ['Mismatch', 'var(--coral)'], ['Pending', '#C9D6CF']], weeks(6).map(function (w, i) { return [r(6, 16), i === 5 ? mis : r(0, 4), i === 5 ? pend : r(0, 3)]; })) +
        rows([['Challan #' + r(4000, 9999) + ' · FreshMeat Co', 'Billed 120 kg · received ' + r(105, 118) + ' kg', chip('Mismatch', 'crit')], ['Challan #' + r(4000, 9999) + ' · GreenLeaf Farms', 'Waiting for goods received note', chip('Pending', 'mute')]]) + SAMPLE;
    },
    'k-procurement': function (a) {
      var r = sample('k-procurement'), wk = val('k-procurement', 'wk', 55, 95);
      var fc = [['Chicken', r(400, 900)], ['Beef', r(300, 700)], ['Fish', r(200, 500)], ['Bananas', r(150, 400)], ['Carrots', r(100, 300)], ['Seeds', r(50, 200)]];
      return head(a) + big(wk + '%', 'of this week’s plan ordered', 'Monthly plan ' + r(30, 70) + '% ordered') +
        '<div><div class="prog"><i style="width:' + wk + '%"></i></div></div>' +
        '<div class="note">Diet items forecast · next 7 days, kg</div>' + bars(fc) +
        '<div class="note w__foot">' + val('k-procurement', 'chg', 2, 9) + ' diet changes affect this week’s order</div>' + SAMPLE;
    },
    'k-mis': function (a) {
      var r = sample('k-mis'), wst = DATA.weeks.slice(-8).map(function (w, i) { return r(40, 160); });
      return head(a) + stats4([[val('k-diet', 'cov', 82, 96), 'Diet coverage %'], [r(82, 98), 'Received on time %'], [val('k-mis', 'waste', 60, 260), 'Wastage this week, kg', 1], [val('k-gate', 'visits', 12, 40), 'Gate visits']]) +
        '<div class="note">Wastage per week, kg</div>' + area(wst, DATA.weeks.slice(-8)) + SAMPLE;
    },
    'k-gate': function (a) {
      var r = sample('k-gate'), inside = val('k-gate', 'inside', 1, 6), visits = val('k-gate', 'visits', 12, 40);
      return head(a) + '<div class="tiles" style="--n:3"><div><b>' + visits + '</b><small>Gate visits today</small></div><div><b>' + inside + '</b><small>Inside now</small></div><div><b>' + (visits - inside) + '</b><small>Exited</small></div></div>' + '<div class="note">Gate visits by hour</div>' + lolli(['6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17'].map(function (h, i) { return [h, [3, 6, 8, 5, 3, 2, 2, 3, 2, 1, 1, 0][i] + r(0, 2)]; })) +
        rows([['MH 12 AB ' + r(1000, 9999) + ' · FreshMeat Co', 'In ' + r(6, 9) + ':' + r(10, 59) + ' · meat delivery', chip('Inside', 'warn')], ['MH 14 CD ' + r(1000, 9999) + ' · GreenLeaf Farms', 'In 07:' + r(10, 59) + ' · out 08:' + r(10, 59), chip('Exited', 'ok')], ['MH 12 EF ' + r(1000, 9999) + ' · Aqua Feeds', 'In 09:' + r(10, 59) + ' · vehicle check', chip('Inside', 'warn')]]) + SAMPLE;
    },
    'k-admin': function (a) {
      var r = sample('k-admin');
      return head(a) + stats4([[val('k-admin', 'users', 25, 80), 'Kitchen users'], [r(4, 9), 'Roles'], [val('k-admin', 'kiosk', 6, 30), 'Kiosk logins today']]) +
        '<div class="note">Kiosk logins, 4 weeks</div>' + heat(['3 wk ago', '2 wk ago', 'Last wk', 'This wk'].map(function (w) { return [w, DAYS7.map(function (d, j) { return j > 4 ? r(2, 10) : r(8, 30); })]; }), DAYS7) +
        '<div class="note">Audit reports</div>' + rows([['Diet imported · 42 species', 'Meera Pillai · today ' + r(8, 11) + ':' + r(10, 59), '<time>Diet</time>'], ['Piece weight changed · Apple', 'Kunal Singh · yesterday', '<time>Kitchen</time>'], ['Role updated · Store keeper', 'Admin · 2 days ago', '<time>Admin</time>']]) + SAMPLE;
    },
    mortality: function (a) {
      var p = per('mortality', '7'), m = DATA.site(state.site), n = p === '7' ? 1 : p === '30' ? 4 : 12, v = m.series.mortality.slice(-n).reduce(function (t, x) { return t + x; }, 0), r = sample('mortality');
      var ns = [['Completed', Math.round(v * .58), '#7CE0A3'], ['Pending', Math.round(v * .24), '#FFB29C'], ['Unsuitable', Math.round(v * .08), '#9A90A8'], ['Not required', Math.round(v * .10), '#5B5466']];
      var reasons = ['Old age', 'Trauma', 'Infection', 'Predation', 'Unknown'], deaths = mine(POOL).slice(3, 6);
      return head(a, tabs('mortality', [['7', '7D'], ['30', '30D'], ['90', '30+']], p)) + big(fmt(v), 'deaths recorded', r(3, 9) + ' reasons · ' + r(12, 40) + ' species') +
        stats4([[val('mortality', 'appr', 2, 9), 'Approvals pending', 1], [r(1, 6), 'Carcass transfers'], [Math.round(v * .12), 'Late reports', 1]]) +
        '<div><div class="note" style="margin-bottom:8px">Necropsy status</div>' + split(ns) + '</div>' +
        rows(deaths.map(function (x, i) { return [esc(x.n) + ' ' + idt(x.id), esc(x.sp + ' · ' + reasons[i] + ' · ' + x.site), chip(['Necropsy pending', 'Necropsy completed', 'Late report'][i], ['warn', 'ok', 'crit'][i])]; })) + SAMPLE;
    },
    necropsy: function (a) {
      var m = DATA.site(state.site), r = sample('necropsy'), pend = Math.min(m.pending.necropsy, val('necropsy', 'pend', 8, 30));
      return head(a) + big(fmt(pend), 'pending necropsies', fmt(m.necropsy.done) + ' completed this month') +
        flow([[r(2, 9), 'Incoming'], [pend, 'Pending'], [m.necropsy.drafts, 'Draft'], [m.necropsy.done, 'Completed']], 1) +
        rows(mine(POOL).slice(6, 8).map(function (x, i) { return [esc(x.sp) + ' ' + idt(x.id), esc((i ? 'Necropsy Center' : 'Onsite') + ' · ' + r(1, 5) + ' days since death'), chip(i ? 'Low' : 'High', i ? 'mute' : 'crit')]; })) + SAMPLE;
    },
    eggs: function (a) {
      var m = DATA.site(state.site), r = sample('eggs'), col = r(30, 90), nest = m.eggs.incubating, nur = r(2, 9), hatch = m.eggs.hatched + val('eggs', 'hatch', 4, 12);
      var conds = ['Intact', 'Cracked', 'Thin shelled'], egg = SPECIES.slice(3, 6);
      return head(a) + flow([[col, 'Collected'], [nest, 'In nest box'], [nur, 'To nursery'], [hatch, 'Hatched']], 1) +
        stats4([[r(1, 6), 'To be discarded', 1], [r(0, 4), 'In transfer'], [r(3, 12), 'Discarded']]) +
        rows(egg.map(function (s, i) { return [esc(s[0]) + ' · clutch ' + r(1, 4), 'Nest box ' + r(1, 12) + ' · collected ' + r(1, 28) + ' Oct', chip(conds[i], ['ok', 'warn', 'info'][i])]; })) + SAMPLE;
    },
    fetal: function (a) {
      var r = sample('fetal'), sb = val('fetal', 'sb', 1, 6), ab = val('fetal', 'ab', 0, 4);
      return head(a) + big(fmt(sb + ab), 'records in October') + rings([['Still birth', sb, 12, 'var(--c)'], ['Abortion', ab, 12, '#F2B544'], ['Necropsy done', r(1, sb + ab), sb + ab, '#7CC6E8']]) +
        rows(SPECIES.slice(1, 3).map(function (s, i) { return [esc(s[0]), 'Dam ' + idt(mine(POOL)[i + 2].id) + ' · ' + r(1, 28) + ' Oct', chip(i ? 'Abortion' : 'Still birth', i ? 'warn' : 'violet')]; })) + SAMPLE;
    },
    tags: function (a) {
      var r = sample('tags'), tg = [['Hand-reared', '#E0A21B'], ['Breeding loan', '#1D7E4C'], ['Diet watch', '#FB7456'], ['Behaviour study', '#8479F9'], ['Quarantine', '#D0526C'], ['VIP enclosure', '#00ABAB']];
      return head(a) + '<div class="stats4" style="--n:2"><div><b>' + val('tags', 'pub', 18, 40) + '</b><small>Public tags</small></div><div><b>' + r(4, 15) + '</b><small>My private tags</small></div></div>' +
        '<div class="tagcloud">' + tg.map(function (t) { return '<span style="--tc:' + t[1] + '">' + esc(t[0]) + ' <em>' + r(3, 60) + '</em></span>'; }).join('') + '</div>' +
        '<div class="note w__foot">Labels on animals, species, enclosures, sections and sites</div>' + SAMPLE;
    },
    medical: function (a) {
      var m = DATA.site(state.site), r = sample('medical'), closed = r(30, 120);
      return head(a) + big(fmt(m.inTreatment), 'active cases', m.hospital + ' in hospital') +
        stats4([[m.inTreatment, 'Active'], [closed, 'Closed, 30 days'], [m.overdue.followups, 'Follow-ups due', 1]]) +
        '<div class="note">Cases opened and closed per week</div>' + stack(weeks(8), [['Opened', 'var(--c)'], ['Closed', 'color-mix(in srgb, var(--c) 35%, #fff)']], weeks(8).map(function () { return [r(4, 14), r(3, 13)]; })) +
        rows(mine(POOL).filter(function (x) { return x.st === 'Under treatment'; }).concat(mine(POOL)).slice(0, 3).map(function (x, i) { return [esc(x.n) + ' ' + idt(x.id), esc(['Wound care', 'Respiratory infection', 'Foot abscess'][i] + ' · opened ' + r(1, 20) + ' Oct'), chip('Follow-up ' + r(1, 9) + ' Nov', i ? 'mute' : 'warn')]; })) + SAMPLE;
    },
    administer: function (a) {
      var m = DATA.site(state.site), r = sample('administer'), pend = m.vacc.pending + m.deworm.pending, done = Math.round((m.vacc.done + m.deworm.done) / 7), sk = r(1, 9), st = r(0, 4);
      return head(a) + ring([['Administered', done, '#fff'], ['Pending', pend, '#FFD27A'], ['Skipped', sk, 'rgba(255,255,255,.45)'], ['Stopped', st, '#FFB4A0']], fmt(done + pend + sk + st), 'doses today') +
        stats4([[r(20, 60), 'Single'], [r(3, 12), 'Batch'], [r(1, 6), 'Controlled substance', 1]]) +
        rows(mine(POOL).slice(0, 2).map(function (x, i) { return [esc(x.n) + ' ' + idt(x.id), esc(['Ivermectin 1% · 2 ml', 'Rabies vaccine · 1 dose'][i]), '<time>' + ['10:30', '14:00'][i] + '</time>']; })) + SAMPLE;
    },
    diet: function (a) {
      var m = DATA.site(state.site), r = sample('diet'), withD = Math.round(m.species * .86), without = m.species - withD;
      return head(a) + big(fmt(withD), 'species with a diet', fmt(without) + ' species still without one') +
        gauge(Math.round(withD / m.species * 100), 'of species have a diet') +
        '<ul class="list w__foot">' + SPECIES.slice(4, 7).map(function (s) { return '<li><span>' + esc(s[0]) + ' · ' + esc(s[2]) + '</span><b>No diet</b></li>'; }).join('') + '</ul>';
    },
    lab: function (a) {
      var m = DATA.site(state.site), r = sample('lab');
      return head(a) + big(fmt(m.pending.lab + m.lab.inProcess), 'requests pending') +
        stats4([[m.lab.flagged + val('lab', 'high', 1, 4), 'High priority', 1], [r(0, 5), 'Resubmit sample', 1], [r(20, 80), 'Completed, 30 days']]) +
        '<div class="note">Requests by test, 30 days</div>' + rank({ bars: [['Blood panel', r(30, 60)], ['Faecal parasitology', r(20, 40)], ['Urinalysis', r(10, 25)], ['Culture and sensitivity', r(5, 18)], ['Histopathology', r(2, 10)]].sort(function (x, y) { return y[1] - x[1]; }) }) +
        rows(mine(POOL).slice(1, 3).map(function (x, i) { return [esc(x.n) + ' ' + idt(x.id), esc(['Blood panel', 'Faecal parasitology'][i] + ' · ' + r(1, 6) + ' days'), chip(i ? 'Normal' : 'High priority', i ? 'mute' : 'crit')]; })) + SAMPLE;
    },
    pharmacy: function (a) {
      var r = sample('pharmacy');
      return head(a) + stats4([[val('pharmacy', 'pend', 4, 16), 'Pending'], [r(2, 9), 'Shipped'], [val('pharmacy', 'disp', 0, 3), 'Disputed', 1]]) +
        '<div class="note">Store requests per day</div>' + lolli(DAYS7.map(function (d, j) { return [d, j > 4 ? r(0, 4) : r(3, 12)]; })) +
        rows([['Main store → ' + esc(siteName() === 'All sites' ? 'Clearspring' : siteName()), '6 items · Meloxicam, Ivermectin…', chip(r(1, 6) + ' days', 'warn')], ['Hospital store → Ward 2', '2 items · prescription required', chip('Shipped', 'info')], ['Main store → Foxglen', '4 items · disputed quantity', chip('Disputed', 'crit')]]) + SAMPLE;
    },
    approvals: function (a) {
      var m = DATA.site(state.site), r = sample('approvals'), pend = Math.max(m.pending.approvals, val('approvals', 'pend', 3, 12)), intra = Math.round(pend * .55), inter = Math.round(pend * .3);
      return head(a) + big(fmt(pend), 'transfers waiting for you') + ring([['Intra-site', intra, '#fff'], ['Inter-site', inter, 'rgba(255,255,255,.55)'], ['External', Math.max(0, pend - intra - inter), '#FFD27A']], fmt(pend), 'waiting') +
        rows([['Asiatic Lion ×2', 'Clearspring → Foxglen · Kunal Singh', chip('Inter', 'info')], ['Gharial ×4', 'Hollowpine → Mistvale · Meera Pillai', chip('Inter', 'info')], ['Great Hornbill ×1', 'Redcliff → partner zoo · Arjun Rao', chip('External', 'warn')]]) + SAMPLE;
    },
    audit: function (a) {
      var p = per('audit', '60'), m = DATA.site(state.site), r = sample('audit' + p), total = m.enclosures, ver = Math.round(total * m.audit / 100 * (p === '30' ? .92 : 1)), disc = Math.round(total * .03), unv = Math.max(0, total - ver - disc);
      var top = DATA.sites.slice().sort(function (x, y) { return y.audit - x.audit; }).map(function (x) { return [x.name, Math.min(99, x.audit + (p === '30' ? -4 : 0))]; });
      return head(a, tabs('audit', [['30', '30D'], ['60', '60D']], p)) + big(Math.round(ver / total * 100) + '%', 'enclosures verified', fmt(disc) + ' with a discrepancy') +
        split([['Verified', ver, '#3DCB72'], ['Unverified', unv, '#DCE6E1'], ['Discrepancy', disc, 'var(--coral)']]) + bars(top, true);
    },
    reports: function (a) {
      var p = per('reports', 'month'), m = DATA.site(state.site), r = sample('reports' + p);
      return head(a, tabs('reports', [['today', 'Today'], ['week', 'Week'], ['month', 'Month']], p)) +
        stats4([[m.species, 'Species'], [state.site === 'all' ? DATA.sites.length : 1, 'Sites'], [m.animals, 'Animals'], [val('reports', 'waste' + p, 40, 400), 'Food wastage, kg', 1]]) +
        '<div class="note">Food wastage per week, kg</div>' + area(weeks(8).map(function () { return r(20, 90); }), weeks(8)) +
        '<ul class="list w__foot"><li><span>Mortality by reason</span><b>' + r(3, 9) + ' reasons</b></li><li><span>Births</span><b>' + fmt(m.series.newAnimals.slice(-1)[0]) + '</b></li><li><span>By site or by species</span><b>Drill down</b></li></ul>' + SAMPLE;
    },
    security: function (a) {
      var r = sample('security'), cats = [['Animal', 'var(--lime)'], ['Egg', '#9FD7FF'], ['Hospital', '#FFD27A'], ['Carcass', '#FFB4A0']];
      var out = val('security', 'out', 2, 9), inn = val('security', 'in', 1, 6);
      return head(a) + '<div class="tiles" style="--n:2"><div><b>' + out + '</b><small>Waiting for checkout</small></div><div><b>' + inn + '</b><small>Waiting for check-in</small></div></div>' +
        '<div class="note">Checkouts per day, by type</div>' + stack(DAYS7, cats, DAYS7.map(function () { return cats.map(function (c, j) { return j ? r(0, 3) : r(1, 6); }); })) +
        rows([['Clearspring · animal transfer', 'Asiatic Lion ×2 · ride started', chip('Checkout pending', 'warn')], ['Foxglen · hospital', 'Tara ' + idt('PL-001'), chip('Check-in pending', 'info')]]) + SAMPLE;
    },
    compliance: function (a) {
      var m = DATA.site(state.site), r = sample('compliance'), orgs = ['ANTZ Wildlife Trust', 'Northern Zoo Society', 'Coastal Rescue Centre'];
      return head(a) + big(String(orgs.length), 'organisations', 'Read-only view of holdings') +
        stats4([[m.species, 'Species'], [m.animals, 'Active animals'], [state.site === 'all' ? DATA.sites.length : 1, 'Sites']]) +
        '<ul class="list w__foot">' + orgs.map(function (o, i) { return '<li><span>' + esc(o) + '</span><b>' + fmt(Math.round(m.animals / [1.6, 3.2, 6][i])) + ' animals</b></li>'; }).join('') + '</ul>' + SAMPLE;
    },
    notes: function (a) {
      var r = sample('notes'), stored = []; try { stored = JSON.parse(localStorage.getItem('antz-notes-v1')) || []; } catch (e) { /* storage blocked */ }
      var all = (D.notes || []).concat(stored).sort(function (x, y) { return (y.ts || y.n) - (x.ts || x.n); });
      var pri = ['Critical', 'High', 'Medium'], pcls = { Critical: 'crit', High: 'warn', Medium: 'info', Low: 'mute' };
      var pr4 = [['Critical', val('notes', 'crit', 0, 3), '#E5533D'], ['High', r(2, 8), '#F2B544'], ['Medium', r(4, 12), '#46A8DE'], ['Low', r(3, 10), '#B8C4BE']];
      return head(a) + stats4([[val('notes', 'mine', 2, 6), 'Assigned to me'], [all.length, 'All notes']]) + ring(pr4, fmt(pr4.reduce(function (t, x) { return t + x[1]; }, 0)), 'open notes') +
        rows(all.slice(0, 3).map(function (n, i) { var pr = n.priority || pri[i]; return [esc(n.t), esc((n.type || 'Note') + ' · ' + (n.by || '') + ' · ' + (n.d || '')), chip(pr, pcls[pr])]; })) + SAMPLE;
    },
    announcements: function (a) {
      var an = D.announcements || [], a0 = an[0] || {}, src = IMG['announcement:0'], r = sample('ann');
      return head(a) + '<div class="photo">' + (src ? '<img src="' + esc(src) + '" alt="">' : '') + '<span>' + (a0.important ? 'Important' : 'General') + '</span></div>' +
        '<div><b style="display:block;font-size:14.5px;font-weight:600;line-height:1.35">' + esc(a0.t) + '</b><small style="color:var(--mute);font-size:12px">' + esc((a0.by || '') + ' · ' + (a0.d || '')) + ' · ' + r(4, 40) + ' likes · ' + r(0, 12) + ' comments</small></div>' +
        rows(an.slice(1, 3).map(function (x) { return [esc(x.t), esc(x.by + ' · ' + x.d), x.important ? chip('Important', 'crit') : '']; }));
    },
    communication: function (a) {
      var ch = D.chats || [], unreadChats = ch.filter(function (x) { return x.unread; }).length, unreadGroups = ch.filter(function (x) { return x.unread && x.group; }).length;
      return head(a) + '<div class="tiles" style="--n:2"><div><b>' + unreadChats + '</b><small>Unread chats</small></div><div><b>' + unreadGroups + '</b><small>Unread groups</small></div></div>' + '<div class="note">Messages per day</div>' + bars(DAYS7.map(function (d, j) { return [d, val('communication', d, j > 4 ? 4 : 18, j > 4 ? 14 : 60)]; })) +
        '<ul class="rows w__foot">' + ch.slice(0, 3).map(function (x) { return '<li><span class="ph"><span class="ms">' + (x.group ? 'groups' : 'person') + '</span></span><span><b>' + esc(x.n) + '</b><small>' + esc(x.last) + '</small></span>' + (x.unread ? '<span class="badge">' + x.unread + '</span>' : '<time>' + esc(x.time) + '</time>') + '</li>'; }).join('') + '</ul>';
    },
    focus: function (a) {
      var tab = per('focus', 'fav'), saved = D.saved || [], sp = SPECIES;
      var pick = tab === 'fav' ? saved.filter(function (x) { return x.liked; }) : tab === 'bm' ? saved.filter(function (x) { return x.bm; }) : saved.filter(function (x) { return x.folder; });
      var item = function (x) {
        var k = x.key.split(':');
        if (k[0] === 'sp' && sp[+k[1]]) return [sp[+k[1]][0], IMG[sp[+k[1]][0]], 'Species'];
        if (k[0] === 'an') { var al = +k[1] === 0 ? (D.animals || []) : (DATA.animalsBySpecies[+k[1]] || []), an = al[+k[2]]; if (an) return [an.n + ' · ' + an.id, IMG[an.id] || IMG[(sp[+k[1]] || [])[0]], 'Animal']; }
        if (k[0] === 'nt' && (D.notes || [])[+k[1]]) return [D.notes[+k[1]].t, '', 'Note'];
        if (k[0] === 'ac' && (D.announcements || [])[+k[1]]) return [D.announcements[+k[1]].t, IMG['announcement:' + k[1]], 'Announcement'];
        return null;
      };
      return head(a, tabs('focus', [['fav', 'Favourites'], ['bm', 'Bookmarks'], ['folder', 'Folders']], tab)) +
        '<div class="strip w__foot">' + pick.map(item).filter(Boolean).map(function (x) { return '<a href="index.html">' + (x[1] ? '<img src="' + esc(x[1]) + '" alt="">' : '<span class="ph"><span class="ms">sticky_note_2</span></span>') + '<span>' + esc(x[0]) + '<br><small style="font-weight:400;opacity:.8">' + esc(x[2]) + '</small></span></a>'; }).join('') + '</div>';
    },
    help: function (a) {
      var r = sample('help');
      return head(a) + stats4([[val('help', 'mine', 1, 6), 'My approvals', 1], [r(1, 5), 'Awaiting costing'], [r(2, 9), 'In progress'], [r(3, 14), 'Pending']]) +
        '<div class="note">Requests raised per week</div>' + stack(weeks(6), [['Emergency', '#E5533D'], ['High', '#F2B544'], ['Normal', 'color-mix(in srgb, var(--c) 40%, #fff)']], weeks(6).map(function () { return [r(0, 2), r(1, 5), r(3, 10)]; })) +
        rows([['REQ-' + r(1000, 9999) + ' · Water pump, Aviary 2', 'Maintenance · Kai Vance · ' + r(1, 6) + 'd', chip('Emergency', 'crit')], ['REQ-' + r(1000, 9999) + ' · Replace mesh, E7', 'Housing · Meera Pillai · ' + r(2, 9) + 'd', chip('High', 'warn')], ['REQ-' + r(1000, 9999) + ' · Printer toner', 'Admin · Arjun Rao · ' + r(1, 3) + 'd', chip('Normal', 'mute')]]) + SAMPLE;
    },
    users: function (a) {
      var m = DATA.site(state.site), r = sample('users'), team = DATA.team(state.site);
      return head(a) + stats4([[m.staff, 'Users'], [team.onDuty, 'Active today'], [r(0, 4), 'Blocked', 1]]) +
        '<div class="note">Users active per day, 4 weeks</div>' + heat(['3 wk ago', '2 wk ago', 'Last wk', 'This wk'].map(function () { return [arguments[0], DAYS7.map(function (d, j) { return j > 4 ? r(10, 40) : r(50, 120); })]; }), DAYS7) +
        '<div class="note">Inactive for 7 days or more</div>' +
        rows(team.people.slice(0, 3).map(function (p, i) { return [esc(p.name), esc(p.role + ' · ' + p.site), '<time>' + r(7, 30) + 'd ago</time>']; })) + SAMPLE;
    }
  };

  /* ---- small: the one number that matters, its label, one status ---- */
  function small(a) {
    var m = DATA.site(state.site), one = state.site === 'all' ? DATA.sites.length : 1, ch = '';
    var S = {
      collections: [fmt(m.species), 'species', fmt(m.animals) + ' animals'],
      animals: [fmt(m.animals), 'animals', chip(m.hospital + ' hospitalized', 'warn')],
      housing: [fmt(m.enclosures), 'enclosures', one + ' sites · ' + m.sections + ' sections'],
      natality: [fmt(m.series.newAnimals.slice(-1)[0]), 'births, 7 days', ''],
      'k-diet': [val('k-diet', 'cov', 82, 96) + '%', 'species covered by a diet', val('k-diet', 'chg', 4, 18) + ' changes this week'],
      'k-kitchen': [Math.round(val('k-kitchen', 'packed', 180, 360) / val('k-kitchen', 'plan', 380, 620) * 100) + '%', 'packed today', val('k-kitchen', 'areas', 8, 18) + ' keeper areas'],
      'k-inventory': [fmt(val('k-inventory', 'low', 3, 14)), 'items low on stock', val('k-inventory', 'rej', 0, 4) ? chip(val('k-inventory', 'rej', 0, 4) + ' rejected', 'crit') : ''],
      'k-invoices': [fmt(val('k-invoices', 'pend', 3, 14)), 'receipts to reconcile', chip(val('k-invoices', 'mis', 1, 6) + ' mismatched', 'crit')],
      'k-procurement': [val('k-procurement', 'wk', 55, 95) + '%', 'of this week’s plan ordered', val('k-procurement', 'chg', 2, 9) + ' diet changes to include'],
      'k-mis': [fmt(val('k-mis', 'waste', 60, 260)) + ' kg', 'wastage this week', ''],
      'k-gate': [fmt(val('k-gate', 'inside', 1, 6)), 'vehicles inside now', val('k-gate', 'visits', 12, 40) + ' gate visits today'],
      'k-admin': [fmt(val('k-admin', 'kiosk', 6, 30)), 'kiosk logins today', val('k-admin', 'users', 25, 80) + ' kitchen users'],
      training: [fmt(val('training', 'month', 120, 320)), 'sessions this month', val('training', 'drafts', 1, 6) ? chip(val('training', 'drafts', 1, 6) + (val('training', 'drafts', 1, 6) === 1 ? ' draft' : ' drafts') + ' to resume', 'violet') : ''],
      mortality: [fmt(m.series.mortality.slice(-1)[0]), 'deaths, 7 days', chip(val('mortality', 'appr', 2, 9) + ' to approve', 'crit')],
      necropsy: [fmt(Math.min(m.pending.necropsy, val('necropsy', 'pend', 8, 30))), 'pending necropsies', chip(m.necropsy.drafts + ' drafts', 'mute')],
      eggs: [fmt(m.eggs.incubating), 'eggs in nest box', fmt(m.eggs.hatched + val('eggs', 'hatch', 4, 12)) + ' hatched'],
      fetal: [fmt(val('fetal', 'sb', 1, 6) + val('fetal', 'ab', 0, 4)), 'records this month', val('fetal', 'sb', 1, 6) + ' still births'],
      tags: [fmt(val('tags', 'pub', 18, 40)), 'public tags', ''],
      medical: [fmt(m.inTreatment), 'active cases', chip(m.overdue.followups + ' follow-ups due', 'warn')],
      administer: [fmt(m.vacc.pending + m.deworm.pending), 'doses pending today', fmt(Math.round((m.vacc.done + m.deworm.done) / 7)) + ' administered'],
      diet: [fmt(m.species - Math.round(m.species * .86)), 'species without a diet', ''],
      lab: [fmt(m.pending.lab + m.lab.inProcess), 'requests pending', chip(m.lab.flagged + val('lab', 'high', 1, 4) + ' high priority', 'crit')],
      pharmacy: [fmt(val('pharmacy', 'pend', 4, 16)), 'store requests pending', val('pharmacy', 'disp', 0, 3) ? chip(val('pharmacy', 'disp', 0, 3) + ' disputed', 'crit') : ''],
      approvals: [fmt(Math.max(m.pending.approvals, val('approvals', 'pend', 3, 12))), 'transfers to approve', ''],
      audit: [m.audit + '%', 'enclosures verified', chip(fmt(Math.round(m.enclosures * .03)) + ' discrepancies', 'crit')],
      reports: [fmt(val('reports', 'wastemonth', 40, 400)) + ' kg', 'food wastage this month', ''],
      security: [fmt(val('security', 'out', 2, 9)), 'waiting for checkout', val('security', 'in', 1, 6) + ' waiting for check-in'],
      compliance: ['3', 'organisations', fmt(m.animals) + ' active animals'],
      notes: [fmt(val('notes', 'mine', 2, 6)), 'notes assigned to me', val('notes', 'crit', 0, 3) ? chip(val('notes', 'crit', 0, 3) + ' critical', 'crit') : ''],
      announcements: [String(((D.announcements || []).filter(function (x) { return x.unread; })).length), 'unread announcements', esc(((D.announcements || [])[0] || {}).t || '')],
      communication: [String((D.chats || []).filter(function (x) { return x.unread; }).length), 'unread chats', ''],
      focus: [String((D.saved || []).filter(function (x) { return x.liked; }).length), 'favourites', (D.saved || []).filter(function (x) { return x.bm; }).length + ' bookmarks'],
      help: [fmt(val('help', 'mine', 1, 6)), 'requests for my approval', chip('1 emergency', 'crit')],
      users: [fmt(DATA.team(state.site).onDuty), 'active today', 'of ' + fmt(m.staff) + ' users']
    }[a.id] || ['–', '', ''];
    return '<div class="w__hd"><span class="w__ic"><span class="ms">' + esc(a.icon) + '</span></span><div class="w__t"><b>' + esc(a.appName || a.name) + '</b></div><a class="go" href="index.html" aria-label="Open ' + esc(a.appName || a.name) + '"><span class="ms">arrow_outward</span></a></div>' +
      '<div class="w__k"><b>' + S[0] + '</b></div><div class="w__lbl">' + esc(S[1]) + '</div>' + (S[2] ? '<div class="w__sub">' + S[2] + '</div>' : '');
  }
  function find(id) { return apps.filter(function (x) { return x.id === id; })[0]; }
  function card(id, size, opts) {
    var a = find(id); if (!a) return '';
    var body = size === 's' ? small(a) : (W[a.id] ? W[a.id](a) : head(a) + '<p class="empty">No widget yet</p>');
    return '<article class="w w--' + (size === 's' ? 's' : 'l') + ' ' + (TONE[a.id] || '') + (opts && opts.fill ? ' fill' : '') + '" data-mod="' + a.id + '" style="--c:' + esc(a.colour) + (opts && opts.still ? ';animation:none' : '') + '">' + body + '</article>';
  }
  window.ANTZ_WIDGETS = {
    apps: apps, groups: ORDER, find: find, card: card,
    name: function (id) { var a = find(id); return a ? (a.appName || a.name) : id; },
    sub: function (id) { var a = find(id); return a ? (a.appSub || a.sub || '') : ''; },
    setSite: function (s) { state.site = s || 'all'; },
    setPeriod: function (id, p) { state.period[id] = p; }
  };
})();
