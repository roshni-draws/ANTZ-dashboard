/* ═══════════════════════════════════════════════════════════════════════
   ANTZ HOME · WIDGET KIT
   Shared by index.html (app.js) and widgets.html (catalogue.js), so the widget catalogue
   always draws exactly what the app draws:
     ANTZ_KIT.frame(o)          the widget cell: card, ⋯ button, remove (−) and resize handle
     ANTZ_KIT.spans(ctx, phone)  grid spans per size for the dashboard main area / right column
     ANTZ_KIT.notes.render(size, model)   the Notes quick-capture widget
   A renderer only reads the model it is given (data + state flags), so every state in the
   catalogue is the real renderer fed different data, never hand-made markup.
   Plain script (no modules) so both pages work from file:// and under /app/.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var sym = function (name, cls) { return '<span class="material-symbols-outlined' + (cls ? ' ' + cls : '') + '" aria-hidden="true">' + name + '</span>'; };

  /* ---- sizes: [columns, rows] per place. Main area 4 columns (2 on phones), right column 1. ---- */
  var SZ_NAME = { S: 'Small', M: 'Medium', L: 'Large', W: 'Wide', XL: 'Extra large' };
  var SPANS = {
    main: { S: [1, 2], M: [2, 2], L: [2, 4], W: [4, 2], XL: [4, 4] },
    mainPhone: { S: [1, 2], M: [2, 2], W: [2, 3], L: [2, 4] },
    side: { S: [1, 2], M: [1, 3], L: [1, 4] }
  };
  function spans(ctx, phone) { return ctx === 'side' ? SPANS.side : phone ? SPANS.mainPhone : SPANS.main; }

  /* ---- the widget cell. o: { id, size, sizeName, cls, style, label, body, dots } ---- */
  function frame(o) {
    var label = esc(o.label || 'widget');
    return '<div class="wg wg--' + o.size + (o.cls || '') + '" data-cell="w:' + esc(o.id) + '"' + (o.style || '') + '>' +
      o.body + (o.dots || '') +
      '<button type="button" class="more" data-more="w:' + esc(o.id) + '" aria-haspopup="menu" aria-label="More options for ' + label + '">' + sym('more_horiz', 'ico ico--sm') + '</button>' +
      '<button type="button" class="rm" data-remove="w:' + esc(o.id) + '" aria-label="Remove ' + label + '">−</button>' +
      '<button type="button" class="rs" data-resize="' + esc(o.id) + '" aria-label="Resize ' + label + ', now ' + (o.sizeName || SZ_NAME[o.size]) + '. Drag the corner, or use the arrow keys"></button></div>';
  }

  /* ═════════════════ NOTES: a shortcut for writing notes ═════════════════
     S   one big "New note" button and today's count; it opens the composer.
     M/W quick capture: a text field, Save, type chips and an animal chip; the last note below.
     L   quick capture plus the most recent notes and View all.
     XL  (desktop) quick capture with templates and photo / voice buttons, beside the recent notes.
     model = {
       id            widget id (keeps control ids unique)
       interactive   false draws a static preview (gallery tiles), with no form controls
       notes         newest first: { t, type, animal, by, when, photo (image src or true) }
       today         notes written today
       draft         { text, type, animal }   the quick-capture field
       status        'idle' | 'focus' | 'error' | 'saving' | 'saved' | 'failed' | 'loading'
       message       optional status text (error / failure reason)
       attached      a photo file name on the draft, or ''
       pinned        Notes is pinned to the sidebar
       animals       [[value, label], …] for the animal chip
       focusDemo     catalogue only: draw the keyboard focus ring on this control ('new' | 'save' | 'field')
     } */
  var TYPES = ['Observation', 'Medical', 'Behaviour', 'Feeding', 'General'];
  var TEMPLATES = [
    { key: 'daily', label: 'Daily observation', type: 'Observation', title: 'Daily observation', body: 'Appetite: \nMovement: \nBehaviour: \nAnything unusual: ' },
    { key: 'incident', label: 'Incident', type: 'Medical', title: 'Incident report', body: 'What happened: \nWhen and where: \nAnimals involved: \nAction taken: ' },
    { key: 'feed', label: 'Feeding check', type: 'Feeding', title: 'Feeding check', body: 'Diet offered: \nAmount eaten: \nNotes: ' }
  ];

  function notesRender(size, m) {
    m = m || {};
    var id = esc(m.id || 'notes'), live = m.interactive !== false, st = m.status || 'idle';
    var draft = m.draft || { text: '', type: 'Observation', animal: '' };
    var notes = m.notes || [], fd = m.focusDemo || '';
    var demo = function (k) { return fd === k ? ' data-demo-focus' : ''; };
    if (size === 'W') size = 'M';
    /* a static preview turns controls into plain spans */
    var btn = function (attrs, cls, inner) { return live ? '<button type="button" class="' + cls + '"' + attrs + '>' + inner + '</button>' : '<span class="' + cls + '">' + inner + '</span>'; };

    var head = '<span class="nw__hd"><span class="nw__ic">' + sym('edit_note') + '</span><span class="nw__t">Notes</span>' +
      (m.pinned ? '<span class="nw__pin" title="Pinned to the sidebar">' + sym('push_pin') + '<span class="vh">, pinned to the sidebar</span></span>' : '') +
      (size !== 'S' ? btn(' data-act="nwNew" aria-label="Open the note composer"' + demo('new'), 'nw__open', sym('open_in_full') ) : '') + '</span>';

    if (st === 'loading') {
      var sk = size === 'S' ? '<span class="skel skel--block"></span><span class="skel skel--line"></span>' :
        '<span class="skel skel--field"></span><span class="skel skel--chips"></span>' + (size === 'M' ? '<span class="skel skel--line"></span>' : '<span class="skel skel--row"></span><span class="skel skel--row"></span><span class="skel skel--row"></span>');
      return head + '<span class="nw__skel" aria-busy="true"><span class="vh">Loading notes</span>' + sk + '</span>';
    }

    /* status line, read out politely */
    var statusText = '', statusCls = '', statusAct = '';
    if (st === 'error') { statusText = m.message || 'Write something first, then save.'; statusCls = ' is-error'; }
    else if (st === 'saving') statusText = 'Saving…';
    else if (st === 'saved') { statusText = size === 'S' ? 'Saved.' : 'Saved to Notes.'; statusCls = ' is-ok'; statusAct = btn(' data-act="nwUndo"', 'nw__link', 'Undo'); }
    else if (st === 'failed') { statusText = size === 'S' ? 'Not saved.' : (m.message || 'Couldn’t save. You’re offline.'); statusCls = ' is-error'; statusAct = btn(' data-act="nwRetry"', 'nw__link', 'Retry'); }
    var status = '<span class="nw__status' + statusCls + '" id="nw-st-' + id + '" role="status" aria-live="polite">' +
      (st === 'saved' ? sym('check_circle') : st === 'error' || st === 'failed' ? sym('error') : '') + '<span>' + esc(statusText) + '</span>' + statusAct + '</span>';

    if (size === 'S') {
      return head + btn(' data-act="nwNew"' + demo('new'), 'nw__new', '<span class="nw__plus">' + sym('add') + '</span><span class="nw__newl">New note</span>') +
        '<span class="nw__meta">' + (notes.length ? (m.today ? m.today + ' today' : 'None today yet') : 'No notes yet') + '</span>' + (st === 'saved' || st === 'failed' ? status : '');
    }

    /* quick capture */
    var busy = st === 'saving', err = st === 'error';
    var field = live
      ? '<label class="vh" for="nw-in-' + id + '">Write a note</label><input class="nw__in' + (st === 'focus' ? ' is-focus' : '') + '" id="nw-in-' + id + '" type="text" autocomplete="off" maxlength="280" placeholder="Write a note…" value="' + esc(draft.text) + '"' +
        (err ? ' aria-invalid="true"' : '') + ' aria-describedby="nw-st-' + id + '"' + (busy ? ' readonly' : '') + demo('field') + '>'
      : '<span class="nw__in is-static">' + (draft.text ? esc(draft.text) : '<span class="nw__ph">Write a note…</span>') + '</span>';
    var save = live ? '<button type="button" class="btn btn--primary btn--sm nw__save" data-act="nwSave"' + (busy ? ' disabled aria-disabled="true"' : '') + demo('save') + '>' + (busy ? 'Saving…' : 'Save') + '</button>' : '<span class="btn btn--primary btn--sm nw__save">Save</span>';
    var chips = '<span class="nw__chips" role="group" aria-label="Note type">' + TYPES.map(function (t) {
      return live ? '<button type="button" class="chip nw__chip" data-act="nwType" data-type="' + t + '" aria-pressed="' + (draft.type === t) + '">' + t + '</button>' : '<span class="chip nw__chip"' + (draft.type === t ? ' aria-current="true"' : '') + '>' + t + '</span>';
    }).join('') + '</span>';
    var animals = m.animals || [];
    var animal = live
      ? '<label class="nw__animal">' + sym('pets') + '<span class="vh">Link an animal</span><select class="nw__sel" data-nw="animal"><option value="">Animal</option>' +
        animals.map(function (a) { return '<option value="' + esc(a[0]) + '"' + (draft.animal === a[0] ? ' selected' : '') + '>' + esc(a[1]) + '</option>'; }).join('') + '</select></label>'
      : '<span class="nw__animal">' + sym('pets') + '<span>Animal</span></span>';
    var attached = m.attached ? '<span class="nw__att">' + sym('image') + '<span class="ell">' + esc(m.attached) + '</span>' + btn(' data-act="nwDetach" aria-label="Remove attached photo"', 'nw__x', sym('close')) + '</span>' : '';
    var cap = '<span class="nw__cap">' + field + save + '</span>' + '<span class="nw__opts">' + animal + chips + '</span>' + attached;

    var item = function (n) {
      var thumb = n.photo ? (typeof n.photo === 'string' ? '<span class="nw__th"><img src="' + esc(n.photo) + '" alt="" loading="lazy" onerror="this.remove()"></span>' : '<span class="nw__th">' + sym('image') + '</span>') : '';
      return '<li class="nw__item">' + thumb + '<span class="nw__body"><span class="nw__row"><b class="nw__it">' + esc(n.t) + '</b><span class="tag">' + esc(n.type) + '</span></span>' +
        '<small class="nw__im">' + esc([n.animal, n.by, n.when].filter(Boolean).join(' · ')) + (n.photo ? '<span class="vh">, has a photo</span>' : '') + '</small></span></li>';
    };
    var empty = '<span class="nw__empty"><b>No notes yet</b><span>Your first observation takes ten seconds. Write it above.</span></span>';

    if (size === 'M') {
      var last = notes[0];
      /* one line below the field: the status if there is one, else the latest note (an attached photo takes that line) */
      var below = st === 'error' || st === 'saving' || st === 'saved' || st === 'failed' || m.attached ? status
        : (last ? status + '<span class="nw__last"><span class="tag">' + esc(last.type) + '</span><span class="ell">' + esc(last.t) + '</span><small>' + esc(last.when || '') + '</small></span>' : status + '<span class="nw__last nw__last--empty">No notes yet. Write the first one above.</span>');
      return head + cap + below;
    }

    /* only whole rows: a status line or an attached photo takes the room of one note in Large */
    var shown = size === 'XL' ? 4 : (statusText || m.attached ? 2 : 3);
    var list = notes.length ? '<span class="nw__lh"><span>Recent</span>' + btn(' data-open="notes"', 'nw__all', 'View all' + (notes.length > shown ? ' ' + notes.length : '') + sym('arrow_forward')) + '</span>' +
      '<ul class="nw__list">' + notes.slice(0, shown).map(item).join('') + '</ul>' : empty;

    if (size === 'XL') {
      var tpl = '<span class="nw__tpls" role="group" aria-label="Start from a template">' + TEMPLATES.map(function (t) { return btn(' data-act="nwTemplate" data-tpl="' + t.key + '"', 'chip nw__tpl', sym('description') + t.label); }).join('') + '</span>';
      var tools = '<span class="nw__tools">' + btn(' data-act="nwPhoto"', 'btn btn--ghost btn--sm', sym('photo_camera') + 'Add photo') + btn(' data-act="nwVoice"', 'btn btn--ghost btn--sm', sym('mic') + 'Voice note') + '</span>';
      return head + '<span class="nw__xl"><span class="nw__col">' + cap + status + '<span class="nw__sub">Templates</span>' + tpl + tools + '</span><span class="nw__col">' + list + '</span></span>';
    }
    return head + cap + status + list;
  }

  /* keep the chosen type chip in view (the chip row scrolls sideways in narrow cells) */
  function revealChips(root) {
    (root || document).querySelectorAll('.nw__opts').forEach(function (row) {
      var on = row.querySelector('.nw__chip[aria-pressed="true"], .nw__chip[aria-current="true"]'); if (!on) return;
      var over = on.offsetLeft + on.offsetWidth - (row.scrollLeft + row.clientWidth - 28);
      if (over > 0) row.scrollLeft += over; else if (on.offsetLeft < row.scrollLeft) row.scrollLeft = on.offsetLeft - 8;
    });
  }

  window.ANTZ_KIT = { esc: esc, sym: sym, SZ_NAME: SZ_NAME, spans: spans, frame: frame, notes: { render: notesRender, reveal: revealChips, TYPES: TYPES, TEMPLATES: TEMPLATES } };
})();
