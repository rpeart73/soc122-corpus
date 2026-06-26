/* SOC122 Corpus: the course source library. Vanilla JS, no build step, no framework.
   Organized by WEEK (the course arc). Each content week pairs one Western reading with
   one Indigenous-scholar reading (Two-Eyed Seeing). A companion to Blackboard:
   no accounts, no grading, no student-to-student interaction.
   Saved + compare live on the student's own device (localStorage). */
(function () {
  'use strict';
  var D = window.SOC122;
  if (!D) { document.getElementById('app').textContent = 'Course data did not load.'; return; }

  var SKEY = 'soc122corpus.v2';
  function load() { try { var o = JSON.parse(localStorage.getItem(SKEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
  function persist() { try { localStorage.setItem(SKEY, JSON.stringify({ saved: state.saved, compareIds: state.compareIds, layout: state.layout, introOpen: state.introOpen, cmpNotes: state.cmpNotes, lens: state.lens, rcReading: state.rcReading, rcNotes: state.rcNotes })); } catch (e) {} }
  var saved0 = load();

  var state = {
    screen: 'library',
    layout: saved0.layout || 'byweek',
    search: '',
    activeTypes: [],
    activeWeek: null,
    sort: 'week',
    detailId: null,
    compareIds: Array.isArray(saved0.compareIds) ? saved0.compareIds.slice(0, 3) : [],
    saved: Array.isArray(saved0.saved) ? saved0.saved : [],
    introOpen: saved0.introOpen !== false,
    savedView: false,
    showSynthesis: false,
    lens: saved0.lens || 'thematic',
    cmpNotes: (saved0.cmpNotes && typeof saved0.cmpNotes === 'object') ? saved0.cmpNotes : {},
    showModel: false,
    exampleOpen: false,
    rcReading: saved0.rcReading || null,
    rcNotes: (saved0.rcNotes && typeof saved0.rcNotes === 'object') ? saved0.rcNotes : {},
    libScroll: 0,
    toast: null,
    cardWeek: null,
    glossWeek: 'all',
    glossSearch: '',
  };
  var refocusSearch = false, focusTarget = null, toastTimer = null;

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function typeMeta(t) { return D.types[t] || D.types.Article; }
  function rec(id) { for (var i = 0; i < D.records.length; i++) if (D.records[i].id === id) return D.records[i]; return null; }
  var OPENSTAX_CH = {
    'soc-intro': 'https://openstax.org/books/introduction-sociology-3e/pages/1-introduction',
    'soc-research': 'https://openstax.org/books/introduction-sociology-3e/pages/2-introduction',
    'soc-socialization': 'https://openstax.org/books/introduction-sociology-3e/pages/5-introduction',
    'soc-stratification': 'https://openstax.org/books/introduction-sociology-3e/pages/9-introduction',
    'soc-family': 'https://openstax.org/books/introduction-sociology-3e/pages/14-introduction',
    'anth-culture': 'https://openstax.org/books/introduction-anthropology/pages/3-introduction',
    'psy-intro': 'https://openstax.org/books/psychology-2e/pages/1-introduction',
    'psy-social': 'https://openstax.org/books/psychology-2e/pages/12-introduction'
  };
  // Only free, openly accessible readings get a public link. Copyrighted or
  // library readings (access 'verified' or 'library') are reached through
  // Blackboard or the Seneca Library, never linked or hosted here (copyright).
  function readUrl(r) {
    if (r.access === 'openstax') return OPENSTAX_CH[r.id] || 'https://openstax.org/';
    if (r.access === 'open') return r.url || (r.doi ? 'https://doi.org/' + r.doi : null);
    return null;
  }
  function accessNote(r) {
    if (r.access === 'openstax') return 'Free and open on OpenStax. Opens in a new tab.';
    if (r.access === 'open') return 'Open access. Opens in a new tab.';
    if (r.access === 'library') return 'A licensed reading. Read it through the Seneca Library, and in this week\'s Readings folder on Blackboard.';
    return 'Posted in this week\'s Readings folder on Blackboard.';
  }
  function eyeLabel(r) { return r.eye === 'indigenous' ? 'Indigenous-scholar reading' : 'Western reading'; }
  function weekTitle(n) { return (D.weeks && D.weeks[n]) ? D.weeks[n] : ''; }
  function weeksWithReadings() { var set = {}; D.records.forEach(function (r) { set[r.week] = (set[r.week] || 0) + 1; }); return Object.keys(set).map(Number).sort(function (a, b) { return a - b; }); }
  function templatedSynthesis(recs) {
    function who(r) { return r.authors.indexOf('OpenStax') >= 0 ? 'OpenStax' : r.authors; }
    function lower(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
    function trim(s) { return s.replace(/\.\s*$/, ''); }
    var west = recs.filter(function (r) { return r.eye === 'western'; });
    var ind = recs.filter(function (r) { return r.eye === 'indigenous'; });
    var both = west.length && ind.length;
    var named = recs.map(function (r) { return r.title + ' by ' + who(r); });
    var lead = recs.length === 2
      ? 'This compares ' + named[0] + ' and ' + named[1] + '.'
      : 'This compares ' + named.slice(0, -1).join(', ') + ', and ' + named[named.length - 1] + '.';
    var ideas = recs.map(function (r, i) {
      var ord = recs.length === 2 ? (i === 0 ? 'The first' : 'The second') : ('The ' + (['first', 'second', 'third'][i] || 'next'));
      return ord + ' says that ' + lower(trim(r.coreIdea)) + '.';
    }).join(' ');
    var rel = both
      ? 'These include a Western reading and an Indigenous one. The course asks you to read them together rather than choose between them.'
      : (ind.length
        ? 'Both are by Indigenous scholars. Read them for how Indigenous knowledge applies to different topics.'
        : 'Both are Western readings. Read them for how the same approach applies to different topics.');
    var close = 'Reading them together shows what you would miss from ' + (recs.length === 2 ? 'either one' : 'any one') + ' alone.';
    return [lead + ' ' + ideas + ' ' + rel + ' ' + close];
  }
  function pairText(a, b) {
    var k = [a.id, b.id].sort().join('|');
    return (D.syntheses && D.syntheses[k]) ? D.syntheses[k] : templatedSynthesis([a, b])[0];
  }
  function buildSynthesis(recs) {
    if (recs.length <= 2) {
      if (recs.length === 2) return { paras: [pairText(recs[0], recs[1])] };
      return { paras: templatedSynthesis(recs) };
    }
    var paras = [];
    for (var i = 0; i < recs.length; i++) for (var j = i + 1; j < recs.length; j++) paras.push(pairText(recs[i], recs[j]));
    return { paras: paras };
  }

  var ICON = {
    book: ['M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z', 'M4 18.5A2.5 2.5 0 0 1 6.5 16H20'],
    file: ['M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8z', 'M14 3v5h5'],
    clipboard: ['M9 4.5h6v3H9z', 'M9 6H6v15h12V6h-3'],
    search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M20 20l-4-4'],
    x: ['M6 6l12 12', 'M18 6L6 18'],
    check: ['M4 12.5l5 5 11-11'],
    bookmark: ['M6 3h12v18l-6-4-6 4z'],
    grid: ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'],
    list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
    layers: ['M12 3l9 5-9 5-9-5z', 'M3 13l9 5 9-5'],
    columns: ['M4 4h7v16H4z', 'M13 4h7v16h-7z'],
    sparkle: ['M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z'],
    chevron: ['M9 6l6 6-6 6'],
    external: ['M14 4h6v6', 'M20 4l-9 9', 'M19 14v5H5V5h5'],
    plus: ['M12 5v14', 'M5 12h14'],
    clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 6v6l4 2'],
    globe: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M2 12h20', 'M12 2a15 15 0 0 1 0 20', 'M12 2a15 15 0 0 0 0 20'],
    gauge: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 12l4-3'],
    calendar: ['M5 5h14v15H5z', 'M5 9h14', 'M9 3v4', 'M15 3v4'],
    type: ['M4 7V5h16v2', 'M9 19h6', 'M12 5v14'],
    eye: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
    unlock: ['M7 11V8a5 5 0 0 1 9.9-1', 'M5 11h14v10H5z'],
  };
  function ic(name, size, w) {
    var paths = ICON[name] || ICON.file, s = size || 20;
    var out = '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
    for (var i = 0; i < paths.length; i++) out += '<path d="' + paths[i] + '"></path>';
    return out + '</svg>';
  }

  /* ---------- filtering + sorting ---------- */
  function filtered() {
    var q = state.search.trim().toLowerCase();
    var base = state.savedView ? D.records.filter(function (r) { return state.saved.indexOf(r.id) >= 0; }) : D.records;
    var list = base.filter(function (r) {
      if (state.activeTypes.length && state.activeTypes.indexOf(r.type) < 0) return false;
      if (state.activeWeek != null && r.week !== state.activeWeek) return false;
      if (q) {
        var hay = (r.title + ' ' + r.authors + ' ' + r.abstract + ' ' + r.coreIdea + ' ' + r.type + ' Week ' + r.week + ' ' + weekTitle(r.week)).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });
    var by = state.sort;
    list.sort(function (a, b) {
      return by === 'year' ? b.year - a.year : by === 'title' ? a.title.localeCompare(b.title) : by === 'type' ? (a.type.localeCompare(b.type) || a.week - b.week) : (a.week - b.week || (a.eye === b.eye ? 0 : a.eye === 'western' ? -1 : 1));
    });
    return list;
  }

  /* ---------- style builders ---------- */
  function saveBtnStyle(on) { return 'display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;border:1px solid ' + (on ? '#f0d89a' : '#DEE3EA') + ';background:' + (on ? '#FCEFD2' : '#fff') + ';color:' + (on ? '#B7791F' : '#8a909c') + ';flex:none'; }
  function cmpBtnStyle(on) { return 'display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;border:1px solid ' + (on ? '#bcd0f2' : '#DEE3EA') + ';background:' + (on ? '#E7EEFB' : '#fff') + ';color:' + (on ? '#1552D8' : '#8a909c') + ';flex:none'; }
  function chipStyle(active, accent) { return 'display:inline-flex;align-items:center;gap:6px;border:1px solid ' + (active ? accent : '#DEE3EA') + ';background:' + (active ? accent + '22' : '#fff') + ';color:' + (active ? '#15171C' : '#474C57') + ';font-size:.8125rem;font-weight:' + (active ? '600' : '500') + ';padding:6px 11px;border-radius:999px'; }
  function segStyle(active) { return 'border:none;border-radius:7px;padding:6px 12px;font-size:.8125rem;font-weight:' + (active ? '600' : '500') + ';background:' + (active ? '#fff' : 'transparent') + ';color:' + (active ? '#15171C' : '#474C57') + ';box-shadow:' + (active ? '0 1px 2px rgba(21,23,28,.12)' : 'none') + ';display:flex;align-items:center;gap:6px'; }
  function eyePill(r) {
    var ind = r.eye === 'indigenous';
    return '<span title="' + esc(eyeLabel(r)) + '" style="display:inline-flex;align-items:center;gap:5px;font-family:var(--mono);font-size:.625rem;font-weight:600;letter-spacing:.04em;color:' + (ind ? '#1f4d38' : '#3a47a8') + ';background:' + (ind ? '#E4F0E9' : '#E7E9FB') + ';padding:3px 8px;border-radius:999px">' + (ind ? 'INDIGENOUS' : 'WESTERN') + '</span>';
  }
  function weekTag(r) { return '<span class="mono" style="font-size:.6875rem;color:#8a909c;background:#EEF1F5;padding:3px 8px;border-radius:6px">Week ' + r.week + '</span>'; }

  /* ---------- cards ---------- */
  function tileCard(r) {
    var tm = typeMeta(r.type), savedOn = state.saved.indexOf(r.id) >= 0, inC = state.compareIds.indexOf(r.id) >= 0;
    return '<div class="card" style="background:#fff;border:1px solid #DEE3EA;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(21,23,28,.04);display:flex;flex-direction:column">'
      + '<button onclick="SOC.open(\'' + r.id + '\')" style="text-align:left;background:none;border:none;padding:0;display:flex;flex-direction:column;flex:1">'
      + '<div style="height:5px;background:' + tm.color + ';width:100%"></div>'
      + '<div style="padding:16px 17px 12px;flex:1;display:flex;flex-direction:column">'
      + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:11px;flex-wrap:wrap">'
      + '<span style="display:inline-flex;align-items:center;gap:6px;background:' + tm.soft + ';color:' + tm.color + ';font-size:.6875rem;font-weight:600;letter-spacing:.03em;padding:4px 9px;border-radius:999px">' + ic(tm.icon, 13) + esc(r.type) + '</span>'
      + eyePill(r)
      + '<span class="mono" style="font-size:.75rem;color:#8a909c;margin-left:auto">' + esc(String(r.year)) + '</span></div>'
      + '<h3 style="font-size:1.125rem;line-height:1.28;font-weight:600;margin:0 0 4px;color:#15171C">' + esc(r.title) + '</h3>'
      + '<div style="font-size:.8125rem;color:#474C57;margin-bottom:11px">' + esc(r.authors) + '</div>'
      + '<p style="font-size:.875rem;line-height:1.5;color:#474C57;margin:0 0 13px">' + esc(r.abstract) + '</p>'
      + '<div style="margin-top:auto">' + weekTag(r) + '</div>'
      + '</div></button>'
      + '<div style="display:flex;align-items:center;gap:8px;padding:11px 17px;border-top:1px solid #EEF1F5;background:#FBFCFD">'
      + '<span class="mono" style="font-size:.75rem;color:#8a909c">' + esc(r.len) + '</span>'
      + '<button onclick="SOC.compare(\'' + r.id + '\')" aria-label="' + (inC ? 'In compare' : 'Add to compare') + '" title="' + (inC ? 'In compare' : 'Add to compare') + '" style="' + cmpBtnStyle(inC) + ';margin-left:auto">' + ic('columns', 15) + '</button>'
      + '</div></div>';
  }
  function indexRow(r) {
    var tm = typeMeta(r.type), savedOn = state.saved.indexOf(r.id) >= 0, inC = state.compareIds.indexOf(r.id) >= 0;
    return '<div class="idxrow" style="display:flex;align-items:center;gap:14px;padding:13px 18px;border-bottom:1px solid #EEF1F5">'
      + '<span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9px;background:' + tm.soft + ';color:' + tm.color + ';flex:none">' + ic(tm.icon, 18) + '</span>'
      + '<button onclick="SOC.open(\'' + r.id + '\')" style="flex:1;min-width:0;text-align:left;background:none;border:none;padding:0">'
      + '<div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap"><span style="font-size:1rem;font-weight:600;color:#15171C">' + esc(r.title) + '</span><span style="font-size:.8125rem;color:#474C57">' + esc(r.authors) + ' · ' + esc(String(r.year)) + '</span></div>'
      + '<div style="font-size:.8125rem;color:#8a909c;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:64ch">' + esc(r.abstract) + '</div></button>'
      + eyePill(r)
      + '<span class="mono" style="font-size:.75rem;color:#8a909c;flex:none;width:64px;text-align:right">Week ' + r.week + '</span>'
      + '<button onclick="SOC.compare(\'' + r.id + '\')" aria-label="' + (inC ? 'In compare' : 'Add to compare') + '" style="' + cmpBtnStyle(inC) + '">' + ic('columns', 15) + '</button>'
      + '</div>';
  }

  /* ---------- chrome ---------- */
  function header() {
    return '<header style="position:sticky;top:0;z-index:40;height:62px;background:#fff;border-bottom:2px solid var(--red);display:flex;align-items:center;padding:0 22px;gap:14px;flex:none">'
      + '<div style="display:flex;align-items:center;gap:10px;flex:none"><img src="./seneca-logo.png" alt="Seneca Polytechnic" style="height:34px;width:auto;display:block"><span style="font-weight:600;font-size:1.0625rem;color:var(--ink);letter-spacing:-.01em">SOC122 Corpus</span></div>'
      + '<span class="mono" style="margin-left:auto;font-size:.75rem;font-weight:600;color:var(--red);background:#F6E3E1;padding:5px 10px;border-radius:6px;flex:none">FALL 2026</span>'
      + '</header>';
  }
  function sidebar() {
    var s = state;
    var navDefs = [['library', 'Home', 'grid'], ['compare', 'Compare', 'columns'], ['reading', 'Build Your Reading Comprehension', 'book'], ['glossary', 'Glossary & Thinkers', 'book'], ['cards', 'Self-check', 'clipboard']];
    var btns = navDefs.map(function (d) {
      var key = d[0], active = (key === 'library' && (s.screen === 'library' || s.screen === 'detail')) || s.screen === key;
      var badge = '';
      if (key === 'compare' && s.compareIds.length) badge = '<span class="mono" style="font-size:.6875rem;font-weight:600;color:#1552D8;background:#E7EEFB;padding:1px 7px;border-radius:999px">' + s.compareIds.length + '</span>';
      var click = "SOC.go('" + key + "')";
      return '<button onclick="' + click + '" aria-current="' + (active ? 'page' : 'false') + '" style="display:flex;align-items:center;gap:11px;width:100%;border:none;border-radius:10px;padding:10px 12px;font-size:.9375rem;font-weight:' + (active ? '600' : '500') + ';background:' + (active ? '#EEF1F5' : 'transparent') + ';color:' + (active ? '#15171C' : '#474C57') + ';text-align:left">'
        + '<span style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;flex:none;color:' + (active ? 'var(--red)' : '#8a909c') + '">' + ic(d[2], 19) + '</span><span style="flex:1;text-align:left">' + d[1] + '</span>' + badge + '</button>';
    });
    var walk = '<a href="https://rpeart73.github.io/soc122-corpus/walkthroughs/" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:11px;width:100%;border-radius:10px;padding:10px 12px;font-size:.9375rem;font-weight:500;color:#474C57;text-decoration:none"><span style="display:flex;align-items:center;justify-content:center;width:22px;height:22px;flex:none;color:#8a909c">' + ic('layers', 19) + '</span><span style="flex:1">Weekly Walkthrough</span><span style="color:#8a909c">↗</span></a>';
    var nav = btns[0] + walk + btns.slice(1).join('');
    var counts = {}; D.records.forEach(function (r) { counts[r.week] = (counts[r.week] || 0) + 1; });
    var weekNav = weeksWithReadings().map(function (w) {
      var active = s.activeWeek === w;
      return '<button onclick="SOC.week(' + w + ')" style="display:flex;align-items:center;gap:9px;width:100%;border:none;border-radius:9px;padding:7px 12px;font-size:.8125rem;font-weight:' + (active ? '600' : '500') + ';background:' + (active ? '#E6EAF1' : 'transparent') + ';color:' + (active ? '#1B2A4A' : '#474C57') + ';text-align:left">'
        + '<span class="mono" style="font-size:.6875rem;color:' + (active ? '#1B2A4A' : '#8a909c') + ';flex:none;width:18px">' + w + '</span>'
        + '<span style="flex:1;text-align:left;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(weekTitle(w)) + '</span>'
        + '<span class="mono" style="font-size:.6875rem;color:#8a909c">' + counts[w] + '</span></button>';
    }).join('');
    return '<nav class="soc-sidebar" aria-label="Primary" style="width:240px;flex:none;border-right:1px solid #DEE3EA;background:#fff;padding:18px 14px;display:flex;flex-direction:column;gap:4px;position:sticky;top:62px;align-self:flex-start;height:calc(100vh - 62px);overflow:auto">'
      + nav
      + '<div style="margin-top:14px;padding-top:14px;border-top:1px solid #EEF1F5"><div class="mono" style="font-size:.6875rem;letter-spacing:.04em;color:#8a909c;padding:0 12px 8px">WEEKS</div>' + weekNav + '</div>'
      + '<div style="margin-top:auto;padding:13px 12px;border-radius:12px;background:#EEF1F5"><div class="mono" style="font-size:.75rem;color:#474C57;margin-bottom:4px">SOC122</div><div style="font-size:.8125rem;color:#15171C;line-height:1.45">A living collection, week by week. A companion to Blackboard.</div></div>'
      + '</nav>';
  }

  /* ---------- library ---------- */
  function library() {
    var s = section_state();
    return s;
  }
  function section_state() {
    var s = state, list = filtered();
    var typeCounts = {}; D.records.forEach(function (r) { typeCounts[r.type] = (typeCounts[r.type] || 0) + 1; });
    var html = '<div class="rise">' + (s.introOpen ? '' : '<h1 class="vh">SOC122 source library, by week</h1>');

    if (s.introOpen) {
      var stats = [['Readings', D.records.length], ['Weeks', weeksWithReadings().length], ['Formats', Object.keys(typeCounts).length]];
      html += '<section style="background:#fff;border:1px solid #DEE3EA;border-top:4px solid var(--red);border-radius:14px;padding:28px 30px;margin-bottom:22px;position:relative;box-shadow:0 1px 2px rgba(21,23,28,.04)">'
        + '<div style="display:flex;align-items:flex-start;gap:24px;flex-wrap:wrap;justify-content:space-between">'
        + '<div style="flex:1;min-width:280px"><div class="mono" style="font-size:.75rem;letter-spacing:.06em;color:var(--red);margin-bottom:10px;font-weight:600">THE COURSE CORPUS</div>'
        + '<h1 style="font-size:2.125rem;line-height:1.14;font-weight:600;margin:0 0 10px;color:var(--ink)">Every reading, week by week.</h1>'
        + '<p style="font-size:1rem;line-height:1.6;color:#474C57;margin:0;max-width:62ch">These are the readings behind SOC122, in course order, the Western eye and the Indigenous eye side by side each week. Search them, hold two against each other, and follow the course as it moves.</p></div>'
        + '<div style="display:flex;gap:10px;flex:none">' + stats.map(function (st) { return '<div style="background:#EEF1F5;border:1px solid #DEE3EA;border-radius:12px;padding:12px 16px;text-align:center;min-width:78px"><div class="mono" style="font-size:1.75rem;font-weight:600;line-height:1;color:var(--red)">' + st[1] + '</div><div style="font-size:.6875rem;text-transform:uppercase;letter-spacing:.06em;color:#474C57;margin-top:5px">' + st[0] + '</div></div>'; }).join('') + '</div></div>'
        + '<button onclick="SOC.dismissIntro()" aria-label="Dismiss" style="position:absolute;top:14px;right:14px;background:#EEF1F5;border:none;border-radius:8px;width:30px;height:30px;color:#474C57;display:flex;align-items:center;justify-content:center">' + ic('x', 16) + '</button></section>';
    }

    var layoutDefs = [['byweek', 'By week', 'layers'], ['tiles', 'Tiles', 'grid'], ['index', 'Index', 'list']];
    var layoutChips = layoutDefs.map(function (d) { return '<button onclick="SOC.layout(\'' + d[0] + '\')" title="' + d[1] + '" aria-label="' + d[1] + '" aria-pressed="' + (s.layout === d[0]) + '" style="' + segStyle(s.layout === d[0]) + '">' + ic(d[2], 15) + '<span>' + d[1] + '</span></button>'; }).join('');
    var filtersActive = s.activeTypes.length || s.activeWeek != null || s.search.trim().length || s.savedView;
    var n = list.length;
    var resultLabel = s.savedView ? ('Saved shelf · ' + n + (n === 1 ? ' reading' : ' readings')) : (s.activeWeek != null ? ('Week ' + s.activeWeek + ' · ' + n + (n === 1 ? ' reading' : ' readings')) : (n === D.records.length ? 'All ' + n + ' readings' : n + ' of ' + D.records.length));
    var weekStrip = '<div class="soc-weekstrip" style="gap:8px;overflow-x:auto;margin-bottom:16px;padding-bottom:4px" aria-label="Filter by week">' + weeksWithReadings().map(function (w) { var aw = s.activeWeek === w; return '<button onclick="SOC.week(' + w + ')" aria-pressed="' + aw + '" style="flex:none;border:1px solid ' + (aw ? '#1B2A4A' : '#DEE3EA') + ';background:' + (aw ? '#E6EAF1' : '#fff') + ';color:' + (aw ? '#1B2A4A' : '#474C57') + ';font-size:.8125rem;font-weight:' + (aw ? '600' : '500') + ';padding:8px 12px;border-radius:999px;white-space:nowrap"><span class="mono" style="opacity:.7">W' + w + '</span> ' + esc(weekTitle(w)) + '</button>'; }).join('') + '</div>';

    html += '<section style="background:#fff;border:1px solid #DEE3EA;border-radius:14px;padding:16px 18px;margin-bottom:18px;box-shadow:0 1px 2px rgba(21,23,28,.04)">'
      + '<div style="display:flex;align-items:center;gap:10px;background:#F7F8FA;border:1px solid #DEE3EA;border-radius:10px;padding:11px 14px">'
      + '<span style="display:flex;color:#8a909c;flex:none">' + ic('search', 18) + '</span>'
      + '<input id="soc-search" value="' + esc(s.search) + '" oninput="SOC.search(this.value)" placeholder="Search by title, author, idea, or week..." aria-label="Search readings" style="flex:1;border:none;background:none;outline:none;font-size:1rem;color:#15171C;min-width:0" />'
      + (s.search ? '<button onclick="SOC.clearSearch()" aria-label="Clear search" style="background:none;border:none;color:#8a909c;display:flex;padding:2px">' + ic('x', 16) + '</button>' : '')
      + '</div>'
      + '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:14px;padding-top:14px;border-top:1px solid #EEF1F5">'
      + '<span style="font-size:.8125rem;color:#474C57">' + resultLabel + '</span>'
      + (filtersActive ? '<button onclick="SOC.clearFilters()" style="background:none;border:none;color:var(--red);font-size:.8125rem;font-weight:600;padding:2px 4px">Clear</button>' : '')
      + '<div style="margin-left:auto;display:flex;gap:4px;background:#EEF1F5;border-radius:9px;padding:4px" role="group" aria-label="Layout">' + layoutChips + '</div>'
      + '</div></section>';
    html += weekStrip;

    if (n === 0) {
      html += '<div style="text-align:center;padding:70px 20px;color:#474C57"><div style="display:inline-flex;color:#C9D1DC;margin-bottom:14px">' + ic('search', 44, 1.4) + '</div><div style="font-size:1.125rem;font-weight:600;color:#15171C;margin-bottom:6px">No readings match that yet.</div><p style="margin:0 0 16px;font-size:.9375rem">Try a broader term or clear a filter.</p><button onclick="SOC.clearFilters()" style="background:#1B2A4A;color:#fff;border:none;border-radius:8px;padding:10px 18px;font-size:.9375rem;font-weight:600">Reset filters</button></div>';
    } else if (s.layout === 'tiles') {
      html += '<div class="soc-cardgrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(296px,1fr));gap:16px">' + list.map(tileCard).join('') + '</div>';
    } else if (s.layout === 'index') {
      html += '<div style="background:#fff;border:1px solid #DEE3EA;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(21,23,28,.04)">' + list.map(indexRow).join('') + '</div>';
    } else {
      // by week
      var weeks = {};
      list.forEach(function (r) { (weeks[r.week] = weeks[r.week] || []).push(r); });
      var order = Object.keys(weeks).map(Number).sort(function (a, b) { return a - b; });
      html += '<div style="display:flex;flex-direction:column;gap:26px">' + order.map(function (w) {
        var cards = weeks[w].map(tileCard).join('');
        return '<section><div style="display:flex;align-items:baseline;gap:10px;margin-bottom:12px">'
          + '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:26px;padding:0 8px;border-radius:8px;background:#1B2A4A;color:#fff;font-family:var(--mono);font-size:.8125rem;font-weight:600;flex:none">' + w + '</span>'
          + '<h2 style="font-size:1.1875rem;font-weight:600;margin:0;color:#15171C">' + esc(weekTitle(w)) + '</h2>'
          + '<span class="mono" style="font-size:.75rem;color:#8a909c">' + weeks[w].length + (weeks[w].length === 1 ? ' reading' : ' readings') + '</span>'
          + '<div style="flex:1;height:1px;background:#EEF1F5"></div></div>'
          + '<div class="soc-cardgrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(296px,1fr));gap:16px">' + cards + '</div></section>';
      }).join('') + '</div>';
    }
    return html + '</div>';
  }

  /* ---------- detail ---------- */
  function detail() {
    var r = rec(state.detailId); if (!r) return library();
    var tm = typeMeta(r.type), savedOn = state.saved.indexOf(r.id) >= 0, inC = state.compareIds.indexOf(r.id) >= 0;
    var related = (r.related || []).map(function (id) {
      var rr = rec(id); if (!rr) return ''; var rtm = typeMeta(rr.type);
      var conn = rr.week === r.week ? 'Also in Week ' + rr.week : eyeLabel(rr);
      return '<button onclick="SOC.open(\'' + id + '\')" class="relrow" style="display:flex;align-items:center;gap:13px;text-align:left;background:#fff;border:1px solid #DEE3EA;border-radius:12px;padding:13px 15px"><span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;background:' + rtm.soft + ';color:' + rtm.color + ';flex:none">' + ic(rtm.icon, 16) + '</span><span style="flex:1;min-width:0"><span style="display:block;font-size:.9375rem;font-weight:600;color:#15171C">' + esc(rr.title) + '</span><span style="display:block;font-size:.8125rem;color:#474C57">' + esc(rr.authors) + ' · ' + esc(conn) + '</span></span><span style="display:flex;color:#C9D1DC;flex:none">' + ic('chevron', 18) + '</span></button>';
    }).join('');
    var facts = [
      [ic('calendar', 16), 'Used in', 'Week ' + r.week + ': ' + esc(weekTitle(r.week))],
      [ic('type', 16), 'Format', esc(r.type)],
      [ic('eye', 16), 'Perspective', esc(eyeLabel(r))],
      [ic('clock', 16), 'Length', esc(r.len)],
      [ic('gauge', 16), 'Level', esc(D.levels[r.diff] || '')],
      [ic('unlock', 16), 'Access', esc((D.accessLabels && D.accessLabels[r.access]) || '')],
      [ic('globe', 16), 'Origin', esc(r.origin)],
    ].map(function (f) { return '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #EEF1F5"><span style="display:flex;color:#8a909c;flex:none">' + f[0] + '</span><span style="font-size:.8125rem;color:#474C57;flex:none;width:84px">' + f[1] + '</span><span style="font-size:.875rem;font-weight:500;color:#15171C;text-align:right;flex:1">' + f[2] + '</span></div>'; }).join('');
    var hasLink = !!readUrl(r);

    return '<div class="rise"><button onclick="SOC.back()" style="background:none;border:none;color:#474C57;font-size:.875rem;font-weight:500;padding:0 0 16px;display:inline-flex;align-items:center;gap:6px">&larr; Back to the library</button>'
      + '<div class="soc-detailgrid" style="display:grid;grid-template-columns:1fr 312px;gap:26px;align-items:start"><div>'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:13px;flex-wrap:wrap"><span style="display:inline-flex;align-items:center;gap:7px;background:' + tm.soft + ';color:' + tm.color + ';font-size:.8125rem;font-weight:600;padding:5px 12px;border-radius:999px">' + ic(tm.icon, 15) + esc(r.type) + '</span>' + eyePill(r) + '<button onclick="SOC.week(' + r.week + ')" class="mono" style="font-size:.8125rem;color:#1B2A4A;background:#E6EAF1;border:none;padding:4px 10px;border-radius:999px">Week ' + r.week + '</button><span class="mono" style="font-size:.8125rem;color:#474C57">' + esc(String(r.year)) + ' · ' + esc(r.origin) + '</span></div>'
      + '<h1 style="font-size:2.125rem;line-height:1.15;font-weight:600;margin:0 0 8px">' + esc(r.title) + '</h1>'
      + '<div style="font-size:1.0625rem;color:#474C57;margin-bottom:24px">' + esc(r.authors) + '</div>'
      + '<div class="mono" style="font-size:.75rem;letter-spacing:.04em;color:#8a909c;margin-bottom:9px">ABSTRACT</div><p style="font-size:1.0625rem;line-height:1.62;color:#15171C;margin:0 0 26px;max-width:64ch">' + esc(r.abstract) + '</p>'
      + '<div style="background:' + tm.soft + ';border-radius:14px;padding:20px 22px;margin-bottom:26px;border:1px solid ' + tm.color + '33"><div style="display:flex;align-items:center;gap:9px;margin-bottom:9px"><span style="display:flex;color:' + tm.color + '">' + ic('sparkle', 17) + '</span><span style="font-size:.8125rem;font-weight:600;color:' + tm.color + ';letter-spacing:.02em">THE CORE IDEA</span></div><p style="font-size:1.1875rem;line-height:1.5;font-weight:500;color:#15171C;margin:0">' + esc(r.coreIdea) + '</p></div>'
      + (related ? '<div class="mono" style="font-size:.75rem;letter-spacing:.04em;color:#8a909c;margin-bottom:12px">READ ALONGSIDE</div><div style="display:flex;flex-direction:column;gap:10px">' + related + '</div>' : '')
      + '</div>'
      + '<aside class="soc-rail" style="position:sticky;top:84px;display:flex;flex-direction:column;gap:14px">'
      + '<div style="background:#fff;border:1px solid #DEE3EA;border-radius:14px;padding:18px;box-shadow:0 1px 2px rgba(21,23,28,.04)">'
      + '<button onclick="SOC.read(\'' + r.id + '\')" aria-label="' + (hasLink ? 'Open the reading in a new tab' : 'Find this reading on Blackboard') + '" style="width:100%;background:var(--red);color:#fff;border:none;border-radius:9px;padding:13px;font-size:1rem;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:9px">' + (hasLink ? 'Open the reading' : 'Find this on Blackboard') + '<span style="display:flex">' + ic('external', 16) + '</span></button>'
      + '<div style="font-size:.75rem;line-height:1.4;color:#6B7280;margin:-2px 0 9px;text-align:center">' + esc(accessNote(r)) + '</div>'
      + '<button onclick="SOC.compare(\'' + r.id + '\')" style="width:100%;display:inline-flex;align-items:center;justify-content:center;gap:7px;border-radius:9px;padding:11px;font-size:.9375rem;font-weight:600;border:1px solid ' + (inC ? '#bcd0f2' : '#DEE3EA') + ';background:' + (inC ? '#E7EEFB' : '#fff') + ';color:' + (inC ? '#1552D8' : '#15171C') + '">' + ic('columns', 16) + (inC ? 'In tray' : 'Compare') + '</button>'
      + '</div>'
      + '<div style="background:#fff;border:1px solid #DEE3EA;border-radius:14px;padding:6px 18px;box-shadow:0 1px 2px rgba(21,23,28,.04)">' + facts + '</div>'
      + '</aside></div></div>';
  }

  /* ---------- compare ---------- */
  function comparePickList() {
    var list = D.records.slice().sort(function (a, b) { return a.week - b.week || (a.eye === b.eye ? 0 : a.eye === 'western' ? -1 : 1); });
    return list.map(function (r) {
      var tm = typeMeta(r.type), sel = state.compareIds.indexOf(r.id) >= 0;
      return '<button onclick="SOC.compare(\'' + r.id + '\')" class="mapsrc" style="display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:' + (sel ? '#E7EEFB' : 'none') + ';border:none;border-bottom:1px solid #EEF1F5;padding:10px 12px">'
        + '<span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:7px;background:' + tm.soft + ';color:' + tm.color + ';flex:none">' + ic(tm.icon, 14) + '</span>'
        + '<span style="flex:1;min-width:0"><span style="display:block;font-size:.8125rem;font-weight:600;color:#15171C;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(r.title) + '</span><span style="display:block;font-size:.6875rem;color:#8a909c">Week ' + r.week + ' · ' + (r.eye === 'indigenous' ? 'Indigenous' : 'Western') + '</span></span>'
        + (sel ? '<span style="display:flex;color:#1552D8;flex:none">' + ic('check', 16, 2.2) + '</span>' : '<span style="display:flex;color:#6b7280;flex:none">' + ic('plus', 16) + '</span>') + '</button>';
    }).join('');
  }
  var LENSES = {
    thematic: { label: 'Thematic', hint: 'shared themes or topics, and how each text handles them differently', diff: 'How does each reading treat the shared topic? What does each one emphasize, include, or leave out?' },
    stylistic: { label: 'Stylistic', hint: 'tone, structure, and how each text is written', diff: 'How do their tone, structure, and word choices differ? Who does each one seem written for?' },
    contextual: { label: 'Contextual', hint: 'the history, culture, and who is speaking', diff: 'How do the authors background, time, or community shape what each one says?' },
    theoretical: { label: 'Theoretical', hint: 'a critical lens, for example power or whose knowledge counts', diff: 'Read both through one lens, for example power or whose knowledge counts. What does that lens show in each?' }
  };
  var CMP_EXAMPLE = [
    ['The subject', 'Two newspapers report the same event: a 1.5% city property tax increase.'],
    ['Article A, the Community Gazette', 'A human-interest lens. Empathetic, a little critical. Leads with retirees on fixed incomes and asks whether the council tried other cuts first.'],
    ['Article B, the Metro Financial Daily', 'An economic lens. Objective and forward-looking. Focuses on the transit and roads the revenue funds, and the long-run savings.'],
    ['Similarities', 'Both agree on the core fact, a 1.5% increase, and both treat it as controversial.'],
    ['Differences', 'The Gazette uses a local, emotional frame. The Financial Daily uses a structural, analytical one.'],
    ['The insight', 'A city makeup and its politics shape how the same policy gets framed in the press. The framing is the story behind the story.']
  ];
  function comparativeStudio(recs) {
    var lens = LENSES[state.lens] || LENSES.thematic;
    function zone(n, title, prompt, key, ph) {
      var v = esc((state.cmpNotes && state.cmpNotes[key]) || '');
      return '<div style="background:#fff;border:1px solid #DEE3EA;border-radius:12px;padding:15px 17px;margin-bottom:11px">'
        + '<div style="display:flex;align-items:baseline;gap:10px;margin-bottom:5px"><span style="display:inline-flex;width:24px;height:24px;align-items:center;justify-content:center;background:#15171C;color:#fff;border-radius:50%;font-size:.8rem;font-weight:700;flex:none">' + n + '</span><h3 style="margin:0;font-size:1.0625rem">' + title + '</h3></div>'
        + '<p style="margin:0 0 8px;font-size:.875rem;color:#474C57">' + prompt + '</p>'
        + '<textarea oninput="SOC.cmpNote(\'' + key + '\',this.value)" placeholder="' + ph + '" style="width:100%;min-height:68px;font:inherit;font-size:.9rem;line-height:1.5;padding:10px 12px;border:1px solid #DEE3EA;border-radius:8px;color:#15171C;background:#fff;resize:vertical">' + v + '</textarea></div>';
    }
    var chips = Object.keys(LENSES).map(function (k) {
      var on = state.lens === k;
      return '<button onclick="SOC.setLens(\'' + k + '\')" style="border:1px solid ' + (on ? '#15171C' : '#DEE3EA') + ';background:' + (on ? '#15171C' : '#fff') + ';color:' + (on ? '#fff' : '#15171C') + ';border-radius:999px;padding:7px 15px;font-size:.85rem;font-weight:600">' + LENSES[k].label + '</button>';
    }).join(' ');
    var ex = state.exampleOpen
      ? '<div style="background:#15171C;color:#fff;border-radius:13px;padding:16px 18px;margin-bottom:15px"><div style="display:flex;align-items:center;margin-bottom:10px"><span class="mono" style="font-size:.72rem;letter-spacing:.05em;color:#fff">A WORKED EXAMPLE</span><button onclick="SOC.toggleExample()" style="margin-left:auto;background:rgba(255,255,255,.14);border:none;border-radius:7px;color:#fff;padding:4px 10px;font-size:.78rem;font-weight:600">Hide</button></div>'
        + CMP_EXAMPLE.map(function (r) { return '<div style="margin-bottom:8px"><div class="mono" style="font-size:.6875rem;letter-spacing:.04em;color:#9aa3b2">' + esc(r[0]).toUpperCase() + '</div><div style="font-size:.875rem;line-height:1.5;color:rgba(255,255,255,.93)">' + esc(r[1]) + '</div></div>'; }).join('') + '</div>'
      : '<button onclick="SOC.toggleExample()" style="background:none;border:1px solid #DEE3EA;border-radius:9px;padding:9px 14px;font-size:.875rem;font-weight:600;color:#15171C;margin-bottom:15px">See a worked example</button>';
    var model = state.showModel
      ? '<div style="background:#15171C;color:#fff;border-radius:14px;padding:18px 20px;margin-top:12px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><span style="display:flex;color:#fff">' + ic('sparkle', 16) + '</span><span class="mono" style="font-size:.72rem;letter-spacing:.04em;color:#fff">A MODEL COMPARISON</span><button onclick="SOC.hideModel()" aria-label="Hide" style="margin-left:auto;background:rgba(255,255,255,.14);border:none;border-radius:7px;color:#fff;width:26px;height:26px">' + ic('x', 14) + '</button></div>'
        + buildSynthesis(recs).paras.map(function (p) { return '<p style="font-size:.95rem;line-height:1.6;margin:0 0 10px;color:rgba(255,255,255,.94)">' + esc(p) + '</p>'; }).join('')
        + '<p style="font-size:.82rem;margin:6px 0 0;color:#9aa3b2">One way to read it. Compare it with yours, do not copy it.</p></div>'
      : '<button onclick="SOC.revealModel()" style="background:none;border:1px solid #15171C;color:#15171C;border-radius:9px;padding:10px 16px;font-size:.9rem;font-weight:600">Reveal a model comparison</button>';
    return '<div style="margin-bottom:18px">'
      + '<h2 style="font-size:1.25rem;margin:0 0 4px">Compare them</h2>'
      + '<p style="font-size:.9375rem;color:#474C57;margin:0 0 14px;max-width:72ch">Comparative reading goes past what each text says on its own. Read the two together and look for what they share, how they differ, and why those differences matter.</p>'
      + ex
      + '<div style="font-size:.8125rem;font-weight:600;color:#15171C;margin-bottom:7px">Read them through a lens</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:6px">' + chips + '</div>'
      + '<p style="font-size:.82rem;color:#8a909c;margin:0 0 16px">' + esc(lens.label) + ': ' + esc(lens.hint) + '.</p>'
      + zone('1', 'Similarities', 'What do these readings share? Where do they agree, in facts, topic, or the same idea?', 'sim', 'They both...')
      + zone('2', 'Differences', esc(lens.diff), 'diff', 'The first... while the second...')
      + zone('3', 'Why the differences matter', 'Finish the thought: these differences matter because...', 'ins', 'These differences matter because...')
      + '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:4px"><button onclick="SOC.saveComparison()" style="background:var(--red);border:none;color:#fff;border-radius:9px;padding:10px 18px;font-size:.9rem;font-weight:600">Save my comparison</button>' + (state.showModel ? '' : model) + '</div>'
      + (state.showModel ? model : '')
      + '</div>';
  }
  var RC_QUESTIONS = {
    thematic: ['What is the main idea or argument of this reading? Put it in one sentence.', 'What evidence or examples does the author use to support it?', 'What is the author really saying about the larger topic or theme?', 'How does this reading change or add to how you understand the topic?'],
    stylistic: ['What is the author tone (for example plain, urgent, careful, personal)?', 'How is the reading organized, and how does that shape its argument?', 'Which words, images, or moments stood out, and what effect did they have?', 'Who does the writing seem to be for?'],
    contextual: ['Who wrote this, and from what background or position?', 'How might the time, place, or community shape what the author says?', 'Whose perspective is centred here, and whose is missing?', 'What would someone need to know about the context to read this fairly?'],
    theoretical: ['Read this through one lens, for example power, or whose knowledge counts. What does that lens reveal?', 'Who benefits from the way this is framed, and who is left out?', 'What does the author assume that a critical reader should question?', 'What would change if you read it through a different lens?']
  };
  function rcChips() {
    return Object.keys(LENSES).map(function (k) {
      var on = state.lens === k;
      return '<button onclick="SOC.setLens(\'' + k + '\')" style="border:1px solid ' + (on ? '#15171C' : '#DEE3EA') + ';background:' + (on ? '#15171C' : '#fff') + ';color:' + (on ? '#fff' : '#15171C') + ';border-radius:999px;padding:7px 15px;font-size:.85rem;font-weight:600">' + LENSES[k].label + '</button>';
    }).join(' ');
  }
  function readingComp() {
    var r = state.rcReading ? rec(state.rcReading) : null;
    if (!r) {
      var picks = D.records.map(function (rd) {
        var tm = typeMeta(rd.type);
        return '<button onclick="SOC.rcPick(\'' + rd.id + '\')" style="display:flex;align-items:center;gap:11px;width:100%;text-align:left;background:#fff;border:1px solid #DEE3EA;border-radius:10px;padding:12px 14px;margin-bottom:8px;color:#15171C"><span style="width:9px;height:9px;border-radius:50%;background:' + tm.color + ';flex:none"></span><span style="flex:1;min-width:0"><span style="display:block;font-weight:600;font-size:.95rem">' + esc(rd.title) + '</span><span style="font-size:.8125rem;color:#474C57">Week ' + rd.week + ' · ' + esc(rd.authors) + '</span></span><span style="color:#8a909c">' + ic('book', 16) + '</span></button>';
      }).join('');
      return '<div class="rise"><h1 style="font-size:1.75rem;margin:0 0 6px">Build Your Reading Comprehension</h1><p class="lede" style="max-width:72ch;margin:0 0 18px">Pick one reading. You will work through questions that build your understanding of it. Switch the lens to change the kind of questions you answer. Your answers save to your notes.</p>' + picks + '</div>';
    }
    var lens = LENSES[state.lens] || LENSES.thematic;
    var qs = RC_QUESTIONS[state.lens] || RC_QUESTIONS.thematic;
    var zones = qs.map(function (q, i) {
      var key = r.id + '|' + state.lens + '|' + i;
      var v = esc((state.rcNotes && state.rcNotes[key]) || '');
      return '<div style="background:#fff;border:1px solid #DEE3EA;border-radius:12px;padding:15px 17px;margin-bottom:11px"><div style="display:flex;align-items:baseline;gap:10px;margin-bottom:7px"><span style="display:inline-flex;width:24px;height:24px;align-items:center;justify-content:center;background:#15171C;color:#fff;border-radius:50%;font-size:.8rem;font-weight:700;flex:none">' + (i + 1) + '</span><p style="margin:0;font-size:.95rem;color:#15171C">' + esc(q) + '</p></div><textarea oninput="SOC.rcNote(\'' + key + '\',this.value)" placeholder="Your answer" style="width:100%;min-height:68px;font:inherit;font-size:.9rem;line-height:1.5;padding:10px 12px;border:1px solid #DEE3EA;border-radius:8px;color:#15171C;background:#fff;resize:vertical">' + v + '</textarea></div>';
    }).join('');
    return '<div class="rise"><div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:4px"><h1 style="font-size:1.5rem;margin:0">Build Your Reading Comprehension</h1><button onclick="SOC.rcClear()" style="margin-left:auto;background:none;border:none;color:var(--red);font-size:.875rem;font-weight:600">Choose a different reading</button></div>'
      + '<div style="background:#15171C;color:#fff;border-radius:12px;padding:15px 18px;margin:8px 0 16px"><div class="mono" style="font-size:.6875rem;letter-spacing:.04em;color:#9aa3b2;margin-bottom:3px">YOUR READING</div><div style="font-size:1.0625rem;font-weight:600">' + esc(r.title) + '</div><div style="font-size:.875rem;color:rgba(255,255,255,.85)">Week ' + r.week + ' · ' + esc(r.authors) + ' · ' + esc(r.year) + '</div><button onclick="SOC.read(\'' + r.id + '\')" style="margin-top:10px;background:rgba(255,255,255,.14);border:none;color:#fff;border-radius:7px;padding:7px 13px;font-size:.85rem;font-weight:600">Open the reading ↗</button></div>'
      + '<div style="font-size:.8125rem;font-weight:600;color:#15171C;margin-bottom:7px">Choose a lens (this changes the questions)</div><div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:6px">' + rcChips() + '</div><p style="font-size:.82rem;color:#8a909c;margin:0 0 16px">' + esc(lens.label) + ': ' + esc(lens.hint) + '.</p>'
      + zones
      + '<button onclick="SOC.saveReadingNotes()" style="background:var(--red);border:none;color:#fff;border-radius:9px;padding:10px 18px;font-size:.9rem;font-weight:600;margin-top:4px">Save my notes</button></div>';
  }
  function compare() {
    var recs = state.compareIds.map(rec).filter(Boolean);
    var html = '<div class="rise"><div style="display:flex;align-items:baseline;gap:12px;margin-bottom:6px;flex-wrap:wrap"><h1 style="font-size:1.75rem;font-weight:600;margin:0">Hold them side by side</h1><span style="font-size:.9375rem;color:#474C57">' + (recs.length ? recs.length + ' of 3 selected' : 'choose 2 or 3') + '</span>'
      + (recs.length ? '<button onclick="SOC.clearCompare()" style="margin-left:auto;background:none;border:none;color:var(--red);font-size:.875rem;font-weight:600">Clear all</button>' : '') + '</div>'
      + '<p style="font-size:.9375rem;color:#474C57;margin:0 0 22px;max-width:70ch">Choose readings from the list on the right, up to three, and they appear side by side here. Pairing a week\'s Western and Indigenous reading shows both eyes on the same topic.</p>';

    var left;
    if (recs.length >= 1) {
      var cols = recs.map(function (r) {
        var tm = typeMeta(r.type);
        var rows = [['WEEK', 'Week ' + r.week + ': ' + weekTitle(r.week)], ['YEAR', String(r.year)], ['PERSPECTIVE', eyeLabel(r)], ['ORIGIN', r.origin], ['LENGTH', r.len], ['LEVEL', D.levels[r.diff] || ''], ['THE CORE IDEA', r.coreIdea]]
          .map(function (row) { return '<div style="padding:11px 17px;border-top:1px solid #EEF1F5"><div class="mono" style="font-size:.625rem;letter-spacing:.05em;color:#8a909c;margin-bottom:4px">' + row[0] + '</div><div style="font-size:.875rem;line-height:1.45;color:#15171C">' + esc(row[1]) + '</div></div>'; }).join('');
        return '<div style="flex:none;width:280px;background:#fff;border:1px solid #DEE3EA;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(21,23,28,.04);display:flex;flex-direction:column"><div style="height:5px;background:' + tm.color + '"></div><div style="padding:16px 17px 14px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:11px"><span style="display:inline-flex;align-items:center;gap:6px;background:' + tm.soft + ';color:' + tm.color + ';font-size:.6875rem;font-weight:600;padding:4px 9px;border-radius:999px">' + ic(tm.icon, 13) + esc(r.type) + '</span><button onclick="SOC.compare(\'' + r.id + '\')" class="removebtn" aria-label="Remove" style="margin-left:auto;background:none;border:none;color:#6b7280;display:flex;padding:6px">' + ic('x', 16) + '</button></div><button onclick="SOC.open(\'' + r.id + '\')" style="text-align:left;background:none;border:none;padding:0;display:block;margin-bottom:4px"><h3 style="font-size:1.0625rem;line-height:1.3;font-weight:600;margin:0;color:#15171C">' + esc(r.title) + '</h3></button><div style="font-size:.8125rem;color:#474C57">' + esc(r.authors) + '</div></div>' + rows + '</div>';
      }).join('');
      var hint = recs.length < 2 ? '<p style="font-size:.875rem;color:#8a909c;margin:0 0 12px">Pick one more reading on the right to compare it against this one.</p>' : '';
      var synthBlock = '';
      if (recs.length >= 2) {
        if (state.showSynthesis) {
          var syn = buildSynthesis(recs);
          synthBlock = '<div style="background:#15171C;color:#fff;border-radius:14px;padding:20px 22px;margin-bottom:18px">'
            + '<div style="display:flex;align-items:center;gap:9px;margin-bottom:12px"><span style="display:flex;color:#fff">' + ic('sparkle', 17) + '</span><span class="mono" style="font-size:.75rem;letter-spacing:.04em;color:#fff">HOW THESE CONNECT</span><button onclick="SOC.hideSynthesis()" aria-label="Hide" style="margin-left:auto;background:rgba(255,255,255,.12);border:none;border-radius:7px;color:#fff;width:26px;height:26px;display:flex;align-items:center;justify-content:center">' + ic('x', 15) + '</button></div>'
            + syn.paras.map(function (p) { return '<p style="font-size:1rem;line-height:1.6;margin:0 0 12px;color:rgba(255,255,255,.92)">' + esc(p) + '</p>'; }).join('')
            + '</div>';
        } else {
          synthBlock = '<button onclick="SOC.synthesize()" style="display:inline-flex;align-items:center;gap:8px;border:none;border-radius:9px;padding:12px 22px;font-size:1rem;font-weight:600;color:#fff;background:#15171C;margin-bottom:18px">' + ic('sparkle', 16) + 'Synthesize their relationship</button>';
        }
      }
      left = hint + synthBlock + '<div class="hshelf" style="display:flex;gap:16px;align-items:stretch;overflow-x:auto;padding-bottom:10px">' + cols + '</div>';
    } else {
      left = '<div style="background:#fff;border:1px dashed #DEE3EA;border-radius:14px;padding:48px 26px;text-align:center;color:#474C57"><div style="display:inline-flex;color:#C9D1DC;margin-bottom:12px">' + ic('columns', 40, 1.4) + '</div><div style="font-size:1.0625rem;font-weight:600;color:#15171C;margin-bottom:6px">Nothing selected yet.</div><p style="font-size:.9375rem;margin:0">Choose two or three readings from the list on the right.</p></div>';
    }

    var right = '<aside class="soc-rail" style="position:sticky;top:84px">'
      + '<div class="soc-pickbox" style="background:#fff;border:1px solid #DEE3EA;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(21,23,28,.04);display:flex;flex-direction:column;max-height:calc(100vh - 110px)">'
      + '<div style="padding:13px 14px;border-bottom:1px solid #EEF1F5;flex:none"><div style="font-size:.9375rem;font-weight:600;color:#15171C">Readings</div><div style="font-size:.75rem;color:#8a909c;margin-top:2px">' + recs.length + ' of 3 selected. Tap to add or remove.</div></div>'
      + '<div class="scrollarea" style="overflow:auto">' + comparePickList() + '</div>'
      + '</div></aside>';

    html += '<div class="soc-detailgrid" style="display:grid;grid-template-columns:1fr 300px;gap:26px;align-items:start"><div>' + left + '</div>' + right + '</div>';
    return html + '</div>';
  }

  /* ---------- glossary & thinkers + self-check (course concepts) ---------- */
  function conceptsForWeek(w) { return (D.glossary || []).filter(function (g) { return g.week === w; }); }
  function thinkersForWeek(w) { return D.records.filter(function (r) { return r.week === w && r.authors.indexOf('OpenStax') < 0; }); }

  function glossaryByWeek(sel) {
    var weeks = (sel === 'all' || sel == null) ? weeksWithReadings() : [parseInt(sel, 10)];
    return weeks.map(function (w) {
      var cons = conceptsForWeek(w).map(function (g) {
        return '<div style="margin:12px 0"><div style="font-size:.9375rem;font-weight:600;color:#15171C">' + esc(g.term) + '</div><div style="font-size:.875rem;line-height:1.55;color:#474C57;margin-top:3px">' + esc(g.def) + '</div>' + (g.cite ? '<div style="font-size:.75rem;color:#8a909c;border-left:3px solid #DEE3EA;padding-left:10px;margin-top:7px">' + esc(g.cite) + '</div>' : '') + '</div>';
      }).join('');
      var thinks = thinkersForWeek(w);
      var tk = thinks.length ? '<div class="mono" style="font-size:.6875rem;letter-spacing:.04em;color:#8a909c;margin:14px 0 5px">SCHOLARS THIS WEEK</div>' + thinks.map(function (r) {
        return '<div style="margin:5px 0;font-size:.8125rem;color:#15171C;line-height:1.5">' + eyePill(r) + ' <button onclick="SOC.open(\'' + r.id + '\')" style="background:none;border:none;padding:0;color:#1552D8;font-weight:600;cursor:pointer">' + esc(r.authors) + '</button>. ' + esc(r.coreIdea) + '</div>';
      }).join('') : '';
      return '<div style="border:1px solid #DEE3EA;border-radius:12px;padding:10px 16px 15px;margin-bottom:14px;background:#fff"><div class="mono" style="font-size:.6875rem;letter-spacing:.04em;color:#1B2A4A;margin:6px 0 2px">WEEK ' + w + ' &middot; ' + esc(weekTitle(w)) + '</div>' + (cons || '<p style="color:#8a909c;font-size:.875rem">No concepts listed.</p>') + tk + '</div>';
    }).join('');
  }
  function glossarySearchHTML(q) {
    q = (q || '').toLowerCase().trim(); if (!q) return '';
    var hits = (D.glossary || []).filter(function (g) { return (g.term + ' ' + g.def).toLowerCase().indexOf(q) >= 0; });
    if (!hits.length) return '<p style="color:#8a909c;font-size:.875rem">No matches. Try another word.</p>';
    return '<div class="soc-cardgrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">' + hits.map(function (g) {
      return '<div style="background:#fff;border:1px solid #DEE3EA;border-radius:12px;padding:14px 16px"><div style="font-size:.9375rem;font-weight:600;color:#15171C">' + esc(g.term) + '</div><div style="font-size:.8125rem;line-height:1.55;color:#474C57;margin:4px 0 8px">' + esc(g.def) + '</div>' + (g.cite ? '<div style="font-size:.7rem;color:#8a909c;margin-bottom:8px">' + esc(g.cite) + '</div>' : '') + '<button onclick="SOC.glossWeekGo(' + g.week + ')" class="mono" style="font-size:.6875rem;color:#1B2A4A;background:#E6EAF1;border:none;padding:3px 8px;border-radius:6px;cursor:pointer">Week ' + g.week + '</button></div>';
    }).join('') + '</div>';
  }
  function glossaryScreen() {
    var sel = state.glossWeek;
    var weekOpts = '<option value="all"' + (sel === 'all' ? ' selected' : '') + '>All weeks</option>' + weeksWithReadings().map(function (w) { return '<option value="' + w + '"' + (String(w) === String(sel) ? ' selected' : '') + '>Week ' + w + ': ' + esc(weekTitle(w)) + '</option>'; }).join('');
    return '<div class="rise">'
      + '<div class="mono" style="font-size:.75rem;letter-spacing:.06em;color:#8a909c;margin-bottom:8px">REFERENCE</div>'
      + '<h1 style="font-size:1.75rem;font-weight:600;margin:0 0 8px">Glossary and Thinkers</h1>'
      + '<p style="font-size:.9375rem;color:#474C57;margin:0 0 18px;max-width:72ch">The course concepts in plain words, week by week, and the scholars behind the readings. Built on the Two-Eyed Seeing frame: Indigenous and Western knowledge held side by side.</p>'
      + '<label for="soc-gsearch" style="font-size:.8125rem;font-weight:600;color:#474C57;display:block;margin-bottom:6px">Search every concept</label>'
      + '<input id="soc-gsearch" oninput="SOC.glossSearch(this.value)" value="' + esc(state.glossSearch) + '" placeholder="Type a concept, for example: ways of knowing" autocomplete="off" style="width:100%;max-width:460px;padding:10px 13px;border:1px solid #DEE3EA;border-radius:9px;background:#fff;font-size:.9375rem;color:#15171C" />'
      + '<div id="soc-gsearchout" style="margin-top:12px">' + glossarySearchHTML(state.glossSearch) + '</div>'
      + '<label for="soc-gweek" style="font-size:.8125rem;font-weight:600;color:#474C57;display:block;margin:18px 0 6px">Or browse by week</label>'
      + '<select id="soc-gweek" onchange="SOC.glossWeek(this.value)" style="max-width:440px;padding:9px 12px;border:1px solid #DEE3EA;border-radius:9px;background:#fff;font-size:.9375rem;color:#15171C">' + weekOpts + '</select>'
      + '<div id="soc-gout" style="margin-top:16px">' + glossaryByWeek(sel) + '</div>'
      + '</div>';
  }

  function card(g) {
    return '<button class="flip" onclick="SOC.flip(this)" aria-label="Self-check: ' + esc(g.term) + '. Activate to reveal the definition.">'
      + '<span class="flip-inner">'
      + '<span class="flip-face flip-front">'
      + '<span style="display:flex;align-items:center;gap:8px;margin-bottom:11px"><span class="mono" style="font-size:.6875rem;color:#8a909c;margin-left:auto">WEEK ' + g.week + '</span></span>'
      + '<span class="mono" style="font-size:.6875rem;letter-spacing:.05em;color:#1B2A4A;margin-bottom:6px">RECALL</span>'
      + '<span style="font-size:1.0625rem;font-weight:600;line-height:1.3;color:#15171C">' + esc(g.term) + '</span>'
      + '<span style="margin-top:auto;padding-top:14px;font-size:.8125rem;color:#1552D8;font-weight:600">Reveal the definition &rarr;</span>'
      + '</span>'
      + '<span class="flip-face flip-back">'
      + '<span class="mono" style="font-size:.6875rem;letter-spacing:.05em;color:#F2A900;margin-bottom:8px">DEFINITION</span>'
      + '<span style="font-size:.9rem;line-height:1.5;font-weight:500">' + esc(g.def) + '</span>'
      + '<span style="margin-top:auto;padding-top:10px;font-size:.7rem;color:rgba(255,255,255,.62)">' + (g.cite ? esc(g.cite) : 'Week ' + g.week + ' &middot; ' + esc(weekTitle(g.week))) + '</span>'
      + '</span>'
      + '</span></button>';
  }
  function cardsScreen() {
    var weeks = weeksWithReadings();
    var sel = state.cardWeek;
    var list = (D.glossary || []).filter(function (g) { return sel == null || g.week === sel; });
    var opts = '<option value="">All weeks</option>' + weeks.map(function (w) { return '<option value="' + w + '"' + (sel === w ? ' selected' : '') + '>Week ' + w + ': ' + esc(weekTitle(w)) + '</option>'; }).join('');
    return '<div class="rise">'
      + '<div class="mono" style="font-size:.75rem;letter-spacing:.06em;color:#8a909c;margin-bottom:8px">SELF-CHECK</div>'
      + '<h1 style="font-size:1.75rem;font-weight:600;margin:0 0 8px">Recall the concepts</h1>'
      + '<p style="font-size:.9375rem;color:#474C57;margin:0 0 18px;max-width:70ch">Read the concept, define it in your own words, then flip the card to check yourself. Each card is one concept. Private study, never a test.</p>'
      + '<label for="soc-cardweek" style="font-size:.8125rem;font-weight:600;color:#474C57;display:block;margin-bottom:6px">Show concepts for</label>'
      + '<select id="soc-cardweek" onchange="SOC.cardWeek(this.value)" style="max-width:360px;padding:9px 12px;border:1px solid #DEE3EA;border-radius:9px;background:#fff;font-size:.9375rem;color:#15171C;margin-bottom:20px">' + opts + '</select>'
      + '<div class="soc-cardgrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">' + list.map(card).join('') + '</div></div>';
  }

  /* ---------- render ---------- */
  function body() {
    if (state.screen === 'detail') return detail();
    if (state.screen === 'compare') return compare();
    if (state.screen === 'reading') return readingComp();
    if (state.screen === 'glossary') return glossaryScreen();
    if (state.screen === 'cards') return cardsScreen();
    return library();
  }
  function render() {
    if (render._prev === 'compare' && state.screen !== 'compare') { state.compareIds = []; state.showSynthesis = false; persist(); }
    render._prev = state.screen;
    var toast = state.toast ? '<div role="status" style="position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:80;background:#15171C;color:#fff;font-size:.9375rem;font-weight:500;padding:12px 20px;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.24);display:flex;align-items:center;gap:10px"><span style="display:flex;color:#F2A900">' + ic('check', 16, 2.2) + '</span>' + esc(state.toast) + '</div>' : '';
    document.getElementById('app').innerHTML =
      '<div style="min-height:100vh;display:flex;flex-direction:column;background:#F7F8FA">' + header()
      + '<div style="display:flex;flex:1;min-height:0">' + sidebar()
      + '<main id="soc-main" class="scrollarea" style="flex:1;min-width:0;overflow:auto;height:calc(100vh - 62px)"><div style="max-width:1180px;margin:0 auto;padding:30px 30px 110px">' + body() + '</div></main>'
      + '</div>' + toast + '</div>';
    if (refocusSearch) {
      var el = document.getElementById('soc-search');
      if (el) { el.focus(); var v = el.value; el.setSelectionRange(v.length, v.length); }
      refocusSearch = false;
    }
    if (focusTarget) {
      var ft = document.getElementById(focusTarget);
      if (ft) { if (!ft.hasAttribute('tabindex')) ft.setAttribute('tabindex', '-1'); ft.focus(); }
      focusTarget = null;
    }
  }
  function topScroll() { var m = document.getElementById('soc-main'); if (m) m.scrollTop = 0; }

  /* ---------- actions ---------- */
  function flash(msg) { clearTimeout(toastTimer); var lr = document.getElementById('soc-live'); if (lr) { lr.textContent = ''; setTimeout(function () { lr.textContent = msg; }, 30); } state.toast = msg; render(); toastTimer = setTimeout(function () { state.toast = null; render(); }, 2200); }
  function senecaDoc(course, title, sub, body, fn) {
    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>'
      + '@page{margin:1in} body{font-family:"IBM Plex Sans",Calibri,Arial,sans-serif;color:#15171C;font-size:11pt;line-height:1.5}'
      + '.eyebrow{color:#DA291C;font-weight:bold;letter-spacing:1pt;font-size:9pt;margin:0} h1{color:#DA291C;font-size:18pt;margin:2pt 0 2pt} .sub{color:#474C57;margin:0 0 12pt;font-size:10pt;border-bottom:1pt solid #DEE3EA;padding-bottom:8pt}'
      + '</style></head><body><p class="eyebrow">SENECA POLYTECHNIC &middot; ' + esc(course) + '</p><h1>' + esc(title) + '</h1><p class="sub">' + sub + '</p>' + body + '</body></html>';
    var blob = new Blob(['﻿' + html], { type: 'application/msword' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fn + '.doc';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
    flash('Saved to your device (Seneca template).');
  }
  window.SOC = {
    go: function (s) { if (s === 'library') { state.savedView = false; } state.screen = s; focusTarget = 'soc-main'; render(); topScroll(); },
    back: function () { state.screen = 'library'; focusTarget = 'soc-main'; render(); var m = document.getElementById('soc-main'); if (m) m.scrollTop = state.libScroll || 0; },
    open: function (id) { var m = document.getElementById('soc-main'); if (m) state.libScroll = m.scrollTop; state.screen = 'detail'; state.detailId = id; focusTarget = 'soc-main'; render(); topScroll(); },
    layout: function (l) { state.layout = l; persist(); render(); },
    sort: function (s) { state.sort = s; render(); },
    search: function (v) { state.search = v; refocusSearch = true; render(); },
    clearSearch: function () { state.search = ''; render(); },
    type: function (t) { state.activeTypes = (state.activeTypes.length === 1 && state.activeTypes[0] === t) ? [] : [t]; render(); },
    week: function (w) { state.activeWeek = (state.activeWeek === w) ? null : w; state.savedView = false; state.screen = 'library'; focusTarget = 'soc-main'; render(); topScroll(); },
    clearFilters: function () { state.activeTypes = []; state.activeWeek = null; state.search = ''; state.savedView = false; render(); },
    dismissIntro: function () { state.introOpen = false; persist(); render(); },
    save: function (id) { var a = state.saved, i = a.indexOf(id); var msg; if (i >= 0) { a.splice(i, 1); msg = 'Removed from saved.'; } else { a.push(id); msg = 'Saved to your shelf.'; } persist(); flash(msg); },
    compare: function (id) { var a = state.compareIds, i = a.indexOf(id); if (i >= 0) { a.splice(i, 1); persist(); flash('Removed from compare.'); } else { if (a.length >= 3) { flash('Compare holds three at a time.'); return; } a.push(id); persist(); flash('Added to compare.'); } },
    clearCompare: function () { state.compareIds = []; state.showSynthesis = false; render(); },
    synthesize: function () { state.showSynthesis = true; render(); },
    hideSynthesis: function () { state.showSynthesis = false; render(); },
    setLens: function (l) { state.lens = l; render(); },
    rcPick: function (id) { state.rcReading = id; persist(); render(); topScroll(); },
    rcClear: function () { state.rcReading = null; render(); topScroll(); },
    rcNote: function (k, v) { state.rcNotes[k] = v; persist(); },
    saveReadingNotes: function () {
      var r = state.rcReading && rec(state.rcReading); if (!r) { flash('Pick a reading first.'); return; }
      var L = (LENSES[state.lens] || LENSES.thematic).label, qs = RC_QUESTIONS[state.lens] || RC_QUESTIONS.thematic;
      var body = qs.map(function (q, i) { var a = (state.rcNotes[r.id + '|' + state.lens + '|' + i] || '').trim(); return '<p style="margin:14pt 0 2pt;font-weight:bold;color:#DA291C">' + esc(q) + '</p><p style="margin:0">' + (a ? esc(a).replace(/\n/g, '<br>') : '<i>(not written yet)</i>') + '</p>'; }).join('');
      senecaDoc('SOC122', 'Build Your Reading Comprehension', 'Reading: ' + esc(r.title) + ' by ' + esc(r.authors) + '<br>Lens: ' + esc(L), body, 'SOC122_reading_comprehension');
    },
    read: function (id) { var r = rec(id); var u = r && readUrl(r); if (u) { window.open(u, '_blank', 'noopener'); } else { flash('Find this in this week\'s Readings folder on Blackboard.'); } },
    openSaved: function () { state.screen = 'library'; state.activeTypes = []; state.activeWeek = null; state.search = ''; state.savedView = state.saved.length > 0; flash(state.saved.length ? 'Your saved shelf.' : 'Nothing saved yet. Tap the bookmark on any reading.'); topScroll(); },
    cardWeek: function (v) { state.cardWeek = (v === '' ? null : parseInt(v, 10)); render(); },
    glossWeek: function (v) { state.glossWeek = v; var o = document.getElementById('soc-gout'); if (o) o.innerHTML = glossaryByWeek(v); },
    glossSearch: function (v) { state.glossSearch = v; var o = document.getElementById('soc-gsearchout'); if (o) o.innerHTML = glossarySearchHTML(v); },
    glossWeekGo: function (w) { state.glossWeek = String(w); var sel = document.getElementById('soc-gweek'); if (sel) sel.value = String(w); var o = document.getElementById('soc-gout'); if (o) { o.innerHTML = glossaryByWeek(String(w)); o.scrollIntoView({ behavior: 'smooth', block: 'start' }); } },
    flip: function (el) { var c = el && (el.classList && el.classList.contains('flip') ? el : (el.closest ? el.closest('.flip') : null)); if (c) c.classList.toggle('flipped'); },
  };

  render();
})();
