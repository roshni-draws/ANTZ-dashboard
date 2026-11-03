/* ═══════════════════════════════════════════════════════════════════════
   ANTZ HOME · SAMPLE DATA GENERATOR
   Builds realistic, internally consistent SAMPLE data from a fixed seed, so
   every number is the same on every reload and the same everywhere it shows.

   Per site: animals, species, enclosures, health, overdue work, 12 weeks of
   time series, audit, approvals, compliance, feeds per day, staff...
   "All sites" is always the SUM of the nine sites (percentages are weighted
   by animals), so the KPI row, the module widgets and the site list agree.

   Change SEED for a different (but still stable) dataset. Sites come from
   config.js (sites). Loaded after config.js and before app.js.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var CFG = window.ANTZ_CONFIG;
  var SEED = 20261029;

  /* ---- seeded PRNG (mulberry32): same seed, same numbers ---- */
  function prng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var R = prng(SEED);
  function int(a, b) { return Math.floor(a + R() * (b - a + 1)); }
  function jitter(v, spread) { return Math.max(0, Math.round(v * (1 + (R() * 2 - 1) * spread))); }
  function series(n, base, spread, drift) { var out = []; for (var i = 0; i < n; i++) out.push(jitter(base * (1 + (drift || 0) * (i - n + 1) / n), spread)); return out; }
  function sum(list) { return list.reduce(function (a, b) { return a + b; }, 0); }
  function addSeries(a, b) { return a.map(function (v, i) { return v + b[i]; }); }
  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-'); }

  /* ---- calendar: 12 weekly buckets ending Mon 26 Oct 2026 ---- */
  var WEEKS = 12;
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var END = new Date(2026, 9, 26);
  function weekLabel(i) { var d = new Date(END); d.setDate(d.getDate() - 7 * (WEEKS - 1 - i)); return d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  var weekLabels = []; for (var w = 0; w < WEEKS; w++) weekLabels.push(weekLabel(w));
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  /* ---- staff ---- */
  var STAFF = ['Emerson Vance', 'Kai Vance', 'Jordan Brenner', 'Kunal Singh', 'Meera Pillai', 'Arjun Rao', 'Farah Qureshi', 'Tenzin Dorje',
    'Lakshmi Iyer', 'Rohan Desai', 'Ananya Bose', 'Vikram Sethi', 'Neha Kulkarni', 'Imran Shaikh', 'Priya Menon', 'Daniel Fernandes'];

  /* ---- per-site generation ---- */
  var siteNames = (CFG.sites || []).filter(function (s) { return s !== 'All sites'; });
  var SITES = siteNames.map(function (name, i) {
    var animals = int(7200, 19800);
    var scale = animals / 12000;
    var inTreatment = Math.max(4, jitter(13 * scale, 0.35));
    var treatmentWeekly = series(WEEKS, inTreatment, 0.25, -0.15); treatmentWeekly[WEEKS - 1] = inTreatment;
    var mortalityWeekly = series(WEEKS, 21 * scale, 0.3, 0.05);
    var newWeekly = series(WEEKS, 7 * scale, 0.45, 0.2);
    var enclosures = Math.round(animals / 11.3);
    var occupancy = int(74, 95);
    var vacc = { done: jitter(220 * scale, 0.2), overdue: int(6, 28), pending: int(12, 44) };
    var deworm = { done: jitter(310 * scale, 0.2), overdue: int(14, 52), pending: int(10, 40) };
    var overdue = { vacc: vacc.overdue, deworm: deworm.overdue, followups: int(1, 6), inspections: int(0, 3), weights: int(2, 9) };
    var overdueTotal = sum(Object.keys(overdue).map(function (k) { return overdue[k]; }));
    var overdueWeekly = series(WEEKS, overdueTotal, 0.18, 0.12); overdueWeekly[WEEKS - 1] = overdueTotal;
    var audit = int(46, 93);
    var auditWeekly = series(WEEKS, audit, 0.06, 0.04).map(function (v) { return Math.min(99, v); }); auditWeekly[WEEKS - 1] = audit;
    var animalsWeekly = []; var a0 = animals - sum(newWeekly) + sum(mortalityWeekly);
    for (var k = 0; k < WEEKS; k++) { a0 += newWeekly[k] - mortalityWeekly[k]; animalsWeekly.push(a0); }
    animalsWeekly[WEEKS - 1] = animals;
    var feedsPerDay = Math.round(animals / 28);
    var feeds = []; for (var d = 0; d < WEEKS * 7; d++) feeds.push(jitter(feedsPerDay * (d % 7 >= 5 ? 0.86 : 1), 0.09));
    var licences = int(3, 6);
    return {
      id: slug(name), name: name,
      animals: animals, species: int(180, 640), sections: int(8, 18), enclosures: enclosures, occupied: Math.round(enclosures * occupancy / 100),
      inTreatment: inTreatment, hospital: Math.max(1, Math.round(inTreatment * 0.3)), critical: int(0, 2),
      vacc: vacc, deworm: deworm, overdue: overdue, overdueTotal: overdueTotal,
      pending: { lab: int(2, 9), approvals: int(0, 4), eggs: int(0, 3), necropsy: int(28, 96) },
      lab: { inProcess: int(4, 14), flagged: int(0, 2) },
      audit: audit, approvals: { approved: int(2, 8), rejected: int(0, 1) },
      licences: licences, licencesCurrent: licences - (R() < 0.3 ? 1 : 0), renewalsDue: int(0, 1),
      eggs: { incubating: int(0, 8), hatched: int(0, 3) },
      necropsy: { drafts: int(2, 8), done: int(5, 20) },
      staff: int(90, 180), pharmacy: { low: int(1, 4), refills: int(1, 5), expiring: int(0, 1) },
      security: { open: int(0, 1), gates: int(4, 7), patrols: int(1, 2) },
      tags: { untagged: Math.round(animals * 0.011), printed: int(20, 60) },
      reports: { ready: int(0, 1), scheduled: int(0, 2) },
      feeds: feeds, feedsToday: feeds[feeds.length - 1],
      series: { treatment: treatmentWeekly, mortality: mortalityWeekly, newAnimals: newWeekly, overdue: overdueWeekly, audit: auditWeekly, animals: animalsWeekly }
    };
  });

  /* ---- All sites = sum of sites (percentages weighted by animals) ---- */
  function aggregate() {
    var A = { id: 'all', name: 'All sites', series: {} };
    var numeric = ['animals', 'sections', 'enclosures', 'occupied', 'inTreatment', 'hospital', 'critical', 'overdueTotal', 'licences', 'licencesCurrent', 'renewalsDue', 'staff', 'feedsToday'];
    numeric.forEach(function (k) { A[k] = sum(SITES.map(function (s) { return s[k]; })); });
    ['vacc', 'deworm', 'overdue', 'pending', 'lab', 'approvals', 'eggs', 'necropsy', 'pharmacy', 'security', 'tags', 'reports'].forEach(function (g) {
      A[g] = {}; Object.keys(SITES[0][g]).forEach(function (k) { A[g][k] = sum(SITES.map(function (s) { return s[g][k]; })); });
    });
    A.species = Math.round(sum(SITES.map(function (s) { return s.species; })) * 0.55); /* species overlap across sites */
    A.audit = Math.round(sum(SITES.map(function (s) { return s.audit * s.animals; })) / A.animals);
    A.feeds = SITES[0].feeds.map(function (v, i) { return sum(SITES.map(function (s) { return s.feeds[i]; })); });
    Object.keys(SITES[0].series).forEach(function (k) {
      A.series[k] = k === 'audit'
        ? SITES[0].series.audit.map(function (v, i) { return Math.round(sum(SITES.map(function (s) { return s.series.audit[i] * s.animals; })) / A.animals); })
        : SITES.reduce(function (acc, s) { return acc ? addSeries(acc, s.series[k]) : s.series[k].slice(); }, null);
    });
    return A;
  }
  var ALL = aggregate();
  function site(id) { if (!id || id === 'all') return ALL; return SITES.filter(function (s) { return s.id === id; })[0] || ALL; }

  /* ---- formatting ---- */
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
  function last4(list) { return sum(list.slice(-4)); }
  function delta(list) { var a = list[list.length - 1], b = list[list.length - 2]; return { value: a - b, pct: b ? (a - b) / b * 100 : 0 }; }

  /* ---- featured animals per species (species 0 keeps the hand-written ones in config) ---- */
  var NAMES = ['Asha', 'Bodhi', 'Chandra', 'Devi', 'Ember', 'Gauri', 'Hiran', 'Indu', 'Jaya', 'Kesar', 'Leela', 'Moti', 'Nila', 'Ojas', 'Pavan', 'Raja', 'Sundari', 'Tara', 'Uma', 'Veer'];
  var STATUSES = ['On exhibit', 'On exhibit', 'On exhibit', 'Off exhibit', 'Under treatment', 'Quarantine'];
  var animalsBySpecies = {};
  (CFG.data.species || []).forEach(function (sp, si) {
    if (si === 0) return;
    var code = sp[0].split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
    var list = [];
    for (var k = 0; k < 6; k++) {
      var age = int(1, 18);
      var siteName = siteNames[int(0, siteNames.length - 1)];
      list.push({ n: NAMES[(si * 3 + k * 7) % NAMES.length], id: code + '-' + String(int(1, 240)).padStart(3, '0'), sex: R() < 0.5 ? 'Female' : 'Male',
        age: age === 1 ? '11 months' : age + ' years', enc: sp[0].split(' ').pop() + ' Habitat · E' + int(1, 9), site: siteName, st: STATUSES[int(0, STATUSES.length - 1)] });
    }
    animalsBySpecies[si] = list;
  });

  /* ---- module stats, built from the site's numbers (chart type comes from module.chart in config) ---- */
  function moduleStats(id, m) {
    var s = m.series, perSite = m.id === 'all';
    var bySite = function (fn) { return SITES.map(function (x) { return { label: x.name, value: fn(x) }; }); };
    switch (id) {
      case 'medical': return { k: [fmt(m.inTreatment), 'animals in treatment'], t: signed(delta(s.treatment).value) + ' this week',
        m: [[fmt(m.inTreatment), 'In treatment'], [fmt(m.overdue.followups), 'Follow-ups overdue'], [fmt(m.hospital), 'In hospital']],
        c: { cap: 'In treatment, last 12 weeks', series: s.treatment, labels: weekLabels, unit: 'animals' },
        l: [['Tara · PL-001', 'Wound care'], ['Gharial 07', 'Respiratory'], ['Rhino 02', 'Foot abscess']] };
      case 'administer': {
        var cats = perSite ? SITES.map(function (x) { return x.name; }) : weekLabels.slice(-6);
        var rows = perSite ? SITES.map(function (x) { return [Math.round(x.vacc.done / 4), x.vacc.overdue, x.vacc.pending]; })
          : weekLabels.slice(-6).map(function (_, i) { var f = 0.6 + i * 0.08; return [Math.round(m.vacc.done / 4 * f), Math.round(m.vacc.overdue * (0.5 + i * 0.1)), Math.round(m.vacc.pending * (0.6 + i * 0.07))]; });
        return { k: [fmt(m.overdue.vacc + m.overdue.deworm), 'doses overdue'], t: fmt(m.overdue.vacc) + ' vaccines, ' + fmt(m.overdue.deworm) + ' deworming',
          m: [[fmt(m.overdue.vacc), 'Vaccines overdue'], [fmt(m.overdue.deworm), 'Deworming overdue'], [fmt(m.vacc.pending + m.deworm.pending), 'Due this week']],
          c: { cap: perSite ? 'Vaccinations this week, by site' : 'Vaccinations, last 6 weeks', cats: cats, keys: ['Done', 'Overdue', 'Pending'], rows: rows },
          l: [['Indian Star Tortoise', '96'], ['Gharial', '41'], ['Asiatic Lion', '18']] };
      }
      case 'animals': return { k: [fmt(last4(s.newAnimals)), 'added in 4 weeks'], t: perSite ? 'across ' + SITES.length + ' sites' : m.name,
        m: [[fmt(m.animals), 'Animals'], [fmt(last4(s.newAnimals)), 'New, 4 weeks'], [fmt(m.tags.untagged), 'Untagged']],
        c: { cap: 'New animals per week', series: s.newAnimals, labels: weekLabels, unit: 'new animals' },
        l: perSite ? SITES.slice().sort(function (a, b) { return sum(b.series.newAnimals.slice(-4)) - sum(a.series.newAnimals.slice(-4)); }).slice(0, 3).map(function (x) { return [x.name, fmt(sum(x.series.newAnimals.slice(-4)))]; })
          : [['Hoofstock', fmt(Math.round(last4(s.newAnimals) * 0.4))], ['Aviary', fmt(Math.round(last4(s.newAnimals) * 0.35))], ['Reptiles', fmt(Math.round(last4(s.newAnimals) * 0.25))]] };
      case 'housing': return { k: [pct(m.occupied, m.enclosures) + '%', 'enclosures occupied'], t: fmt(m.overdue.inspections) + ' inspections overdue',
        m: [[fmt(m.sections), 'Sections'], [fmt(m.enclosures), 'Enclosures'], [fmt(m.enclosures - m.occupied), 'Vacant']],
        c: { cap: 'Enclosure occupancy', slices: [['Occupied', m.occupied], ['Vacant', m.enclosures - m.occupied]], center: pct(m.occupied, m.enclosures) + '%' },
        l: [['Big Cat House · E4', 'Inspection'], ['Aviary 2', 'Inspection'], ['Reptile House · R9', 'Repair']] };
      case 'diet': return { k: [fmt(m.feedsToday), 'feeds today'], t: fmt(Math.round(m.feedsToday * 0.06)) + ' still to do',
        m: [[fmt(m.feedsToday), 'Feeds today'], [fmt(Math.round(m.feedsToday * 0.94)), 'Done'], [fmt(Math.round(m.feedsToday * 0.06)), 'Pending']],
        c: { cap: 'Feeds per day, last 12 weeks', cells: m.feeds, days: DAYS, weeks: weekLabels, unit: 'feeds' },
        l: [['Carnivore Section', '16:00'], ['Primates', '16:30'], ['Aviary', '17:00']] };
      case 'lab': { var tot = m.pending.lab + m.lab.inProcess;
        return { k: [fmt(m.pending.lab), 'results to review'], t: fmt(m.lab.flagged) + ' flagged',
          m: [[fmt(m.pending.lab), 'To review'], [fmt(m.lab.inProcess), 'In process'], [fmt(m.lab.flagged), 'Flagged']],
          c: { cap: 'Open samples by test', bars: [['Blood', Math.round(tot * 0.34)], ['Faecal', Math.round(tot * 0.24)], ['Swab', Math.round(tot * 0.18)], ['Urine', Math.round(tot * 0.14)], ['Tissue', tot - Math.round(tot * 0.34) - Math.round(tot * 0.24) - Math.round(tot * 0.18) - Math.round(tot * 0.14)]] },
          l: [['Blood panel · PL-001', 'Flagged'], ['Faecal · Gharial 07', 'Ready'], ['Swab · Rhino 02', 'Ready']] }; }
      case 'pharmacy': return { k: [fmt(m.pharmacy.low), 'items low on stock'], t: fmt(m.pharmacy.expiring) + ' expire this month',
        m: [[fmt(m.pharmacy.low), 'Low stock'], [fmt(m.pharmacy.refills), 'Refills due'], [fmt(m.pharmacy.expiring), 'Expiring']],
        c: { cap: 'Lowest items, % of minimum stock', bars: [['Meloxicam 1.5 mg/ml', 12], ['Ivermectin 1%', 25], ['Amoxicillin 250 mg', 31], ['Enrofloxacin 50 mg', 44], ['Fenbendazole 10%', 58]], unit: '%' },
        l: [['Meloxicam 1.5 mg/ml', '12%'], ['Ivermectin 1%', '25%'], ['Amoxicillin 250 mg', '31%']] };
      case 'mortality': return { k: [fmt(s.mortality[WEEKS - 1]), 'deaths, last 7 days'], t: fmt(last4(s.mortality)) + ' in 4 weeks',
        m: [[fmt(s.mortality[WEEKS - 1]), '7 days'], [fmt(last4(s.mortality)), '4 weeks'], [fmt(sum(s.mortality)), '12 weeks']],
        c: { cap: 'Deaths per week', series: s.mortality, labels: weekLabels, unit: 'deaths' },
        l: [['Fish', fmt(Math.round(s.mortality[WEEKS - 1] * 0.46))], ['Birds', fmt(Math.round(s.mortality[WEEKS - 1] * 0.28))], ['Reptiles', fmt(Math.round(s.mortality[WEEKS - 1] * 0.16))]] };
      case 'eggs': return { k: [fmt(m.eggs.incubating), 'eggs incubating'], t: fmt(m.pending.eggs) + ' checks due',
        m: [[fmt(m.eggs.incubating), 'Incubating'], [fmt(m.pending.eggs), 'Checks due'], [fmt(m.eggs.hatched), 'Hatched, 30 days']],
        c: { cap: 'Hatched per week', bars: weekLabels.slice(-8).map(function (l, i) { return [l, Math.round(m.eggs.hatched * (0.3 + (i % 3) * 0.25))]; }) },
        l: [['Great Hornbill clutch 3', 'Day 31/40'], ['Gharial nest 2', 'Day 52/70'], ['Star Tortoise nest 5', 'Day 88/120']] };
      case 'necropsy': return { k: [fmt(m.pending.necropsy), 'reports pending'], t: fmt(m.necropsy.drafts) + ' drafts',
        m: [[fmt(m.pending.necropsy), 'Pending'], [fmt(m.necropsy.drafts), 'Drafts'], [fmt(m.necropsy.done), 'Done, 30 days']],
        c: { cap: 'Completed per week', series: s.mortality.map(function (v) { return Math.round(v * 0.55); }), labels: weekLabels, unit: 'reports' },
        l: [['Fish batch 1102', 'Pending'], ['Hornbill 04', 'Draft'], ['Antelope 19', 'Pending']] };
      case 'fetal': return { k: [fmt(Math.round(m.animals / 18000)), 'records, 30 days'], t: 'sample data',
        m: [[fmt(Math.round(m.animals / 18000)), '30 days'], [fmt(Math.round(m.animals / 2700)), 'This year'], [fmt(Math.round(m.animals / 55000)), 'Await necropsy']],
        c: { cap: 'Records per month', bars: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map(function (l, i) { return [l, Math.round(m.animals / 20000 * (0.6 + (i % 3) * 0.3))]; }) },
        l: [['Blackbuck F-112', '12 Oct'], ['Spotted deer F-109', '8 Oct'], ['Nilgai F-104', '2 Oct']] };
      case 'approvals': return { k: [fmt(m.pending.approvals), 'requests pending'], t: 'oldest waiting 3 days',
        m: [[fmt(m.pending.approvals), 'Pending'], [fmt(m.approvals.approved), 'Approved'], [fmt(m.approvals.rejected), 'Rejected']],
        c: { cap: 'Requests, last 30 days', slices: [['Approved', m.approvals.approved], ['Pending', m.pending.approvals], ['Rejected', m.approvals.rejected]], center: fmt(m.approvals.approved + m.pending.approvals + m.approvals.rejected) },
        l: [['Transfer: Asiatic Lion x2', '3 days'], ['Transfer: Gharial x4', '2 days'], ['Loan: Hornbill x1', '1 day']] };
      case 'audit': {
        var ranks = (perSite ? bySite(function (x) { return x.audit; }) : ['Hoofstock', 'Carnivores', 'Primates', 'Aviary', 'Reptiles'].map(function (n, i) { return { label: n, value: Math.max(40, Math.min(99, m.audit + [8, 3, -2, -6, 5][i])) }; }))
          .sort(function (a, b) { return b.value - a.value; });
        var low = ranks.filter(function (r) { return r.value < 60; }).length;
        return { k: [m.audit + '%', 'animal audit score'], t: low + (low === 1 ? (perSite ? ' site' : ' section') : (perSite ? ' sites' : ' sections')) + ' under 60%',
          m: [[m.audit + '%', 'Audit score'], [ranks[0].value + '%', 'Best'], [fmt(low), 'Under 60%']],
          c: { cap: perSite ? 'Audit score by site' : 'Audit score by section', bars: ranks.map(function (r) { return [r.label, r.value]; }), unit: '%', max: 100, warnBelow: 60 },
          l: ranks.slice(-3).reverse().map(function (r) { return [r.label, r.value + '%']; }) };
      }
      case 'reports': return { k: [fmt(m.reports.ready + 2), 'reports ready'], t: fmt(m.reports.scheduled + 3) + ' scheduled',
        m: [[fmt(m.reports.ready + 2), 'Ready'], [fmt(m.reports.scheduled + 3), 'Scheduled'], [fmt(Math.round(m.staff / 40)), 'Exports, Oct']],
        c: { cap: 'Exports per week', series: s.newAnimals.map(function (v) { return Math.max(1, Math.round(v / 8)); }), labels: weekLabels, unit: 'exports' },
        l: [['Natality report, Oct', 'Ready'], ['Inventory report', 'Ready'], ['Mortality report', 'Mon']] };
      case 'users': { var st = m.staff;
        return { k: [fmt(Math.round(st * 0.23)), 'active today'], t: 'of ' + fmt(st) + ' staff',
          m: [[fmt(st), 'Staff'], [fmt(Math.round(st * 0.23)), 'Active today'], [fmt(Math.round(st / 90)), 'Invites pending']],
          c: { cap: 'Staff by role', bars: [['Keepers', Math.round(st * 0.42)], ['Veterinary', Math.round(st * 0.14)], ['Maintenance', Math.round(st * 0.18)], ['Kitchen', Math.round(st * 0.11)], ['Admin', st - Math.round(st * 0.42) - Math.round(st * 0.14) - Math.round(st * 0.18) - Math.round(st * 0.11)]] },
          l: [['Keepers', fmt(Math.round(st * 0.42))], ['Maintenance', fmt(Math.round(st * 0.18))], ['Veterinary', fmt(Math.round(st * 0.14))]] }; }
      case 'security': return { k: [fmt(m.security.open), 'open incidents'], t: fmt(m.security.gates) + ' gates online',
        m: [[fmt(m.security.open), 'Open incidents'], [fmt(m.security.gates), 'Gates online'], [fmt(m.security.patrols * 6), 'Patrols today']],
        c: { cap: 'Incidents per week', bars: weekLabels.slice(-8).map(function (l, i) { return [l, (i * 7 + m.security.gates) % 4]; }) },
        l: [['Perimeter fence Z4', 'Open'], ['Night house alarm', 'Open'], ['North gate panel', 'Closed']] };
      case 'compliance': return { k: [fmt(m.renewalsDue + 2), 'renewals due, 30 days'], t: fmt(m.licences - m.licencesCurrent) + ' overdue',
        m: [[fmt(m.licences), 'Licences'], [fmt(m.licencesCurrent), 'Current'], [fmt(m.licences - m.licencesCurrent), 'Overdue']],
        c: { cap: 'Licences current', value: pct(m.licencesCurrent, m.licences), target: 100, unit: '%' },
        l: [['Pharmacy licence', m.licences - m.licencesCurrent ? 'Overdue' : '12 Dec'], ['CZA recognition', '12 Nov'], ['Fire safety check', '30 Nov']] };
      case 'tags': return { k: [fmt(m.tags.untagged), 'animals untagged'], t: fmt(m.tags.printed) + ' printed this week',
        m: [[fmt(m.tags.untagged), 'Untagged'], [fmt(m.tags.printed), 'Printed, week'], [fmt(Math.round(m.tags.printed / 6)), 'Reprints']],
        c: { cap: 'Untagged by group', bars: [['Fish', Math.round(m.tags.untagged * 0.41)], ['Reptiles', Math.round(m.tags.untagged * 0.22)], ['Birds', Math.round(m.tags.untagged * 0.19)], ['Amphibians', Math.round(m.tags.untagged * 0.11)], ['Mammals', m.tags.untagged - Math.round(m.tags.untagged * 0.41) - Math.round(m.tags.untagged * 0.22) - Math.round(m.tags.untagged * 0.19) - Math.round(m.tags.untagged * 0.11)]] },
        l: [['Fish', fmt(Math.round(m.tags.untagged * 0.41))], ['Reptiles', fmt(Math.round(m.tags.untagged * 0.22))], ['Birds', fmt(Math.round(m.tags.untagged * 0.19))]] };
      default: return null;
    }
  }
  function signed(n) { return (n > 0 ? '+' : n < 0 ? '−' : '±') + Math.abs(n); }

  /* ---- Command Centre KPIs: same figures as the module widgets ---- */
  var KPIS = {
    animals: { label: 'Animals', module: 'animals', value: function (m) { return m.animals; }, series: function (m) { return m.series.animals; }, better: 'up' },
    health: { label: 'Health cases', module: 'medical', value: function (m) { return m.inTreatment; }, series: function (m) { return m.series.treatment; }, better: 'down' },
    overdue: { label: 'Overdue tasks', module: 'administer', value: function (m) { return m.overdueTotal; }, series: function (m) { return m.series.overdue; }, better: 'down' },
    mortality: { label: 'Mortality, 7 days', module: 'mortality', value: function (m) { return m.series.mortality[WEEKS - 1]; }, series: function (m) { return m.series.mortality; }, better: 'down' },
    audit: { label: 'Audit score', module: 'audit', value: function (m) { return m.audit; }, series: function (m) { return m.series.audit; }, better: 'up', suffix: '%' }
  };
  function kpi(key, m) {
    var d = KPIS[key]; if (!d) return null;
    var ser = d.series(m), dl = delta(ser);
    return { key: key, label: d.label, module: d.module, value: fmt(d.value(m)) + (d.suffix || ''), series: ser, labels: weekLabels,
      delta: dl, deltaText: (dl.pct >= 0 ? '+' : '−') + Math.abs(dl.pct).toFixed(1) + '%', good: dl.value === 0 ? null : ((dl.value > 0) === (d.better === 'up')) };
  }

  /* ---- Needs attention: the overdue list adds up to the Overdue tasks KPI ---- */
  function attention(m) {
    return {
      overdue: [['Deworming', m.overdue.deworm, 'administer'], ['Vaccinations', m.overdue.vacc, 'administer'], ['Weight checks', m.overdue.weights, 'animals'],
        ['Treatment follow-ups', m.overdue.followups, 'medical'], ['Enclosure inspections', m.overdue.inspections, 'housing']].filter(function (r) { return r[1] > 0; }),
      pending: [['Necropsy reports', m.pending.necropsy, 'necropsy'], ['Lab results to review', m.pending.lab, 'lab'], ['Transfer approvals', m.pending.approvals, 'approvals'], ['Egg checks', m.pending.eggs, 'eggs']].filter(function (r) { return r[1] > 0; }),
      total: m.overdueTotal
    };
  }

  /* ---- Recent activity: the latest records, statuses follow the site's own overdue/pending numbers.
     Deterministic (no PRNG calls), so adding it never changes any other number. ---- */
  var ACTIVITY = [
    { type: 'Treatment', module: 'medical', title: 'Wound care check', who: 'Tara · PL-001', img: 'Persian Leopard', when: '29 Oct, 10:42', status: function () { return 'Completed'; } },
    { type: 'Vaccination', module: 'administer', title: 'Rabies booster', who: 'Zara · PL-014', img: 'PL-014', when: '29 Oct, 09:15', status: function (m) { return m.overdue.vacc > 20 ? 'Overdue' : m.vacc.pending ? 'Pending' : 'Completed'; } },
    { type: 'Feed', module: 'diet', title: 'Evening feed', who: 'Asiatic Lion · Carnivore Section', img: 'Asiatic Lion', when: '29 Oct, 16:00', status: function () { return 'Pending'; } },
    { type: 'Transfer', module: 'approvals', title: 'Transfer request', who: 'Gharial ×4', img: 'Gharial', when: '28 Oct, 17:20', status: function (m) { return m.pending.approvals ? 'Pending' : 'Completed'; } },
    { type: 'New animal', module: 'animals', title: 'Hatchling recorded', who: 'Indian Star Tortoise', img: 'Indian Star Tortoise', when: '28 Oct, 14:05', status: function () { return 'Completed'; } },
    { type: 'Lab', module: 'lab', title: 'Blood panel results', who: 'Indian Rhinoceros · Rhino 02', img: 'Indian Rhinoceros', when: '28 Oct, 11:30', status: function (m) { return m.lab.flagged ? 'Pending' : 'Completed'; } },
    { type: 'Inspection', module: 'housing', title: 'Enclosure inspection', who: 'Great Hornbill · Aviary 2', img: 'Great Hornbill', when: '27 Oct, 15:45', status: function (m) { return m.overdue.inspections ? 'Overdue' : 'Completed'; } },
    { type: 'Deworming', module: 'administer', title: 'Deworming round', who: 'African Wild Dog pack', img: 'African Wild Dog', when: '27 Oct, 08:30', status: function (m) { return m.overdue.deworm > 30 ? 'Overdue' : 'Completed'; } }
  ];
  function activity(siteId) {
    var one = siteId && siteId !== 'all' ? site(siteId) : null;
    return ACTIVITY.map(function (a, i) {
      var s = one || SITES[(i * 4) % SITES.length];
      return { type: a.type, module: a.module, title: a.title, who: a.who, img: a.img, when: a.when, site: s.name, status: a.status(s) };
    });
  }
  /* ---- On duty today: as many people as the Users widget's "active today" ---- */
  var ROLES = ['Curator', 'Veterinarian', 'Head keeper', 'Keeper', 'Nutritionist', 'Keeper', 'Vet nurse'];
  function team(siteId) {
    var m = site(siteId), idx = siteId && siteId !== 'all' ? SITES.indexOf(m) : 0;
    var people = [];
    for (var k = 0; k < 6; k++) people.push({ name: STAFF[(idx * 3 + k * 5) % STAFF.length], role: ROLES[k % ROLES.length], shift: k % 3 === 2 ? 'On call' : 'On duty', site: siteId && siteId !== 'all' ? m.name : SITES[(k * 2 + 1) % SITES.length].name });
    return { onDuty: Math.round(m.staff * 0.23), staff: m.staff, people: people };
  }
  /* ---- Planning: progress towards this week's targets ---- */
  function planning(siteId) {
    var m = site(siteId);
    var vt = m.vacc.done + m.vacc.overdue + m.vacc.pending, dt = m.deworm.done + m.deworm.overdue + m.deworm.pending;
    return [
      { label: 'Vaccination round', module: 'administer', done: m.vacc.done, total: vt, unit: 'doses' },
      { label: 'Deworming round', module: 'administer', done: m.deworm.done, total: dt, unit: 'doses' },
      { label: 'Licences current', module: 'compliance', done: m.licencesCurrent, total: m.licences, unit: 'licences' },
      { label: 'Audit score to target 85%', module: 'audit', done: m.audit, total: 85, unit: '%' }
    ];
  }
  window.ANTZ_DATA = {
    seed: SEED, sites: SITES, all: ALL, staff: STAFF, weeks: weekLabels, days: DAYS,
    site: site, moduleStats: function (id, siteId) { return moduleStats(id, site(siteId)); },
    kpi: function (key, siteId) { return kpi(key, site(siteId)); }, kpis: Object.keys(KPIS),
    attention: function (siteId) { return attention(site(siteId)); },
    activity: activity, team: team, planning: planning,
    animalsBySpecies: animalsBySpecies, fmt: fmt
  };
})();
