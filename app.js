/* SOC122 Corpus: the course source library. Vanilla JS, no build step, no framework.
   Organized by WEEK (the course arc). Each content week pairs one Western reading with
   one Indigenous-scholar reading (Two-Eyed Seeing). A companion to Blackboard:
   no accounts, no grading, no student-to-student interaction.
   Saved + compare live on the student's own device (localStorage). */
(function () {
  'use strict';
  var D = window.SOC122;
  var MC = window.SOC122_MC || {};
  var HAS_EYE = !!(D.course && D.course.frame);
  if (!D) { document.getElementById('app').textContent = 'Course data did not load.'; return; }

  var SKEY = 'soc122corpus.v2';
  function load() { try { var o = JSON.parse(localStorage.getItem(SKEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
  function persist() { try { localStorage.setItem(SKEY, JSON.stringify({ saved: state.saved, layout: state.layout, introOpen: state.introOpen, cmpNotes: state.cmpNotes, rcNotes: state.rcNotes, mapNotes: state.mapNotes, mapLayer: state.mapLayer, mapRegion: state.mapRegion, journeyWeek: state.journeyWeek })); } catch (e) {} }
  var saved0 = load();

  var state = {
    screen: 'journey',
    journeyWeek: saved0.journeyWeek || null,
    stationWeek: null,
    layout: saved0.layout || 'byweek',
    search: '',
    activeTypes: [],
    activeWeek: null,
    sort: 'week',
    detailId: null,
    compareIds: [],
    saved: Array.isArray(saved0.saved) ? saved0.saved : [],
    introOpen: saved0.introOpen !== false,
    savedView: false,
    showSynthesis: false,
    lens: 'thematic',
    cmpNotes: (saved0.cmpNotes && typeof saved0.cmpNotes === 'object') ? saved0.cmpNotes : {},
    showModel: false,
    exampleOpen: false,
    rcReading: null,
    rcNotes: (saved0.rcNotes && typeof saved0.rcNotes === 'object') ? saved0.rcNotes : {},
    revealed: {},
    mcSel: {},
    libScroll: 0,
    toast: null,
    cardWeek: null,
    glossWeek: 'all',
    glossSearch: '',
    mapLayer: saved0.mapLayer || 'admin',
    mapRegion: saved0.mapRegion || 'mikmaki-lawrence',
    mapNotes: (saved0.mapNotes && typeof saved0.mapNotes === 'object') ? saved0.mapNotes : {},
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
    return r.url || (r.doi ? 'https://doi.org/' + r.doi : null);
  }
  function readLabel(r) { return (r.fulltext === false) ? 'Find it in the Seneca Library' : 'Open the reading'; }
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
    play: ['M7 5l11 7-11 7z'],
    gallery: ['M3 5h18v14H3z', 'M3 16l5-5 4 4 3-3 6 6', 'M8.5 9.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2'],
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
    var navDefs = [['journey', 'Home', 'gauge'], ['readings', 'Library of Readings', 'gallery'], ['compare', 'Compare Reading Concepts', 'columns'], ['reading', 'Build Your Reading Comprehension', 'book'], ['glossary', 'Glossary & Thinkers', 'book'], ['cards', 'Self-check', 'clipboard']];
    if (D.course && D.course.frame) navDefs.push(['map', 'Personal Cartography', 'globe']);
    var btns = navDefs.map(function (d) {
      var key = d[0], active = (key === 'journey' && (s.screen === 'journey' || s.screen === 'library' || s.screen === 'station' || s.screen === 'detail')) || s.screen === key;
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

  /* ---------- library of readings (immersive gallery) ---------- */
  function topicLabel(k) {
    var M = { twoeyed: 'Two-Eyed Seeing', facial: 'Facial Recognition', bias: 'Algorithmic Bias', policing: 'Policing', surveillance: 'Surveillance', policy: 'Law and Policy', resistance: 'Resistance and Design Justice', intersectionality: 'Intersectionality', reconciliation: 'Reconciliation', sociology: 'Sociology', anthropology: 'Anthropology', psychology: 'Psychology', family: 'Family and Kinship', stratification: 'Stratification', socialization: 'Socialization', culture: 'Culture', learning: 'Learning', memory: 'Memory and Recall', motivation: 'Motivation', cognition: 'Cognition', development: 'Development', behaviour: 'Behaviour', behavior: 'Behaviour', identity: 'Identity', education: 'Education', conditioning: 'Conditioning', emotion: 'Emotion' };
    return M[k] || (String(k).charAt(0).toUpperCase() + String(k).slice(1));
  }
  function rgTopics() {
    var seen = {}, out = [];
    D.records.forEach(function (r) { (r.themes || []).forEach(function (t) { if (!seen[t]) { seen[t] = 1; out.push(t); } }); });
    return out.sort(function (a, b) { return topicLabel(a).localeCompare(topicLabel(b)); });
  }
  function rgList() {
    var w = state.galWeek, t = state.galTopic;
    return D.records.filter(function (r) {
      if (w != null && r.week !== w) return false;
      if (t && (r.themes || []).indexOf(t) < 0) return false;
      return true;
    }).sort(function (a, b) { return (a.week - b.week) || a.title.localeCompare(b.title); });
  }
  function rgAccessBadge(r) {
    var full = r.fulltext !== false;
    var fg = full ? '#1f7a4d' : '#B7791F', bg = full ? '#E4F0E9' : '#FCEFD2';
    return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:.6875rem;font-weight:600;letter-spacing:.03em;color:' + fg + ';background:' + bg + ';padding:4px 9px;border-radius:999px">' + ic(full ? 'unlock' : 'book', 12) + (full ? 'Read online' : 'Seneca Library') + '</span>';
  }
  function rgVideoCover(r) {
    var v = r.video;
    return '<div class="rgvideo" style="position:relative;width:100%;aspect-ratio:16/9;background:#15171C;overflow:hidden">'
      + '<button onclick="SOC.playVideo(this,\'' + v.yt + '\')" aria-label="Play a talk by ' + esc(v.scholar || r.authors) + '" style="position:absolute;inset:0;width:100%;height:100%;border:none;padding:0;cursor:pointer;background:none">'
      + '<img src="https://i.ytimg.com/vi/' + v.yt + '/maxresdefault.jpg" onerror="this.onerror=null;this.src=\'https://i.ytimg.com/vi/' + v.yt + '/hqdefault.jpg\'" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block" />'
      + '<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><span style="display:flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:999px;background:rgba(218,41,28,.94);color:#fff;box-shadow:0 4px 16px rgba(0,0,0,.45)">' + ic('play', 24) + '</span></span>'
      + '<span style="position:absolute;left:0;right:0;bottom:0;padding:22px 13px 10px;background:linear-gradient(transparent,rgba(0,0,0,.9));color:#fff;text-align:left">'
      + '<span class="mono" style="display:block;font-size:.6rem;letter-spacing:.08em;color:#f3b0a8;font-weight:600;margin-bottom:2px">WATCH</span>'
      + '<span style="display:block;font-size:.8125rem;font-weight:700;line-height:1.2">' + esc(v.scholar || r.authors) + '</span>'
      + (v.title ? '<span style="display:block;font-size:.7rem;color:rgba(255,255,255,.8);line-height:1.3;margin-top:2px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' + esc(v.title) + '</span>' : '')
      + '</span>'
      + '</button></div>';
  }
  function rgCard(r) {
    var tm = typeMeta(r.type);
    var topics = (r.themes || []).slice(0, 3).map(function (t) {
      var on = state.galTopic === t;
      return '<button onclick="SOC.galTopic(\'' + t + '\')" style="border:1px solid ' + (on ? '#DA291C' : '#DEE3EA') + ';background:' + (on ? '#F6E3E1' : '#F7F8FA') + ';color:' + (on ? '#DA291C' : '#474C57') + ';font-size:.6875rem;font-weight:600;padding:3px 9px;border-radius:999px;cursor:pointer">' + esc(topicLabel(t)) + '</button>';
    }).join('');
    return '<div class="rgcard" style="background:#fff;border:1px solid #DEE3EA;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(21,23,28,.06);display:flex;flex-direction:column">'
      + (r.video ? rgVideoCover(r) : '<div style="height:6px;background:' + tm.color + '"></div>')
      + '<div style="padding:16px 17px 15px;flex:1;display:flex;flex-direction:column">'
      + '<div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:10px">'
      + '<span style="display:inline-flex;align-items:center;gap:5px;background:' + tm.soft + ';color:' + tm.color + ';font-size:.6875rem;font-weight:600;padding:4px 9px;border-radius:999px">' + ic(tm.icon, 12) + esc(r.type) + '</span>'
      + rgAccessBadge(r)
      + '<span class="mono" style="font-size:.75rem;color:#8a909c;margin-left:auto">' + esc(String(r.year)) + '</span>'
      + '</div>'
      + '<h3 style="font-size:1.0625rem;line-height:1.3;font-weight:600;margin:0 0 4px;color:#15171C">' + esc(r.title) + '</h3>'
      + '<div style="font-size:.8125rem;color:#474C57;margin-bottom:9px">' + esc(r.authors) + '</div>'
      + '<p style="font-size:.84rem;line-height:1.5;color:#5a616e;margin:0 0 12px">' + esc(r.coreIdea || r.abstract) + '</p>'
      + (topics ? '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:13px">' + topics + '</div>' : '')
      + (r.assigned ? '<div style="display:flex;align-items:flex-start;gap:7px;background:#FBF3F2;border:1px solid #F1D5D2;border-radius:9px;padding:8px 11px;margin:0 0 12px"><span style="display:flex;color:var(--red);flex:none;margin-top:1px">' + ic('book', 13) + '</span><span style="font-size:.78rem;line-height:1.4;color:#15171C"><span style="font-weight:700">Read:</span> ' + esc(r.assigned) + '</span></div>' : '')
      + '<div style="margin-top:auto;display:flex;align-items:center;gap:9px">'
      + '<button onclick="SOC.read(\'' + r.id + '\')" style="flex:1;display:inline-flex;align-items:center;justify-content:center;gap:7px;background:var(--red);color:#fff;border:none;border-radius:10px;padding:11px;font-size:.875rem;font-weight:600;cursor:pointer">' + readLabel(r) + '<span style="display:flex">' + ic('external', 15) + '</span></button>'
      + '<button onclick="SOC.open(\'' + r.id + '\')" title="Details" aria-label="Open details" style="display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:10px;border:1px solid #DEE3EA;background:#fff;color:#474C57;cursor:pointer;flex:none">' + ic('chevron', 18) + '</button>'
      + '</div>'
      + '<div style="margin-top:10px;display:flex;align-items:center;gap:7px">' + weekTag(r) + ((D.course && D.course.frame) ? eyePill(r) : '') + '</div>'
      + '</div></div>';
  }
  function readingsGallery() {
    var s = state, list = rgList();
    var nFull = D.records.filter(function (r) { return r.fulltext !== false; }).length;
    var nVid = D.records.filter(function (r) { return !!r.video; }).length;
    var weeks = weeksWithReadings(), topics = rgTopics();
    var stats = [['Readings', D.records.length], ['Read online', nFull]];
    if (nVid) stats.push(['Scholar talks', nVid]);
    var hero = '<section style="background:#fff;border:1px solid #DEE3EA;border-top:4px solid var(--red);border-radius:14px;padding:26px 30px;margin-bottom:18px;box-shadow:0 1px 2px rgba(21,23,28,.04)">'
      + '<div style="display:flex;align-items:flex-start;gap:24px;flex-wrap:wrap;justify-content:space-between">'
      + '<div style="flex:1;min-width:280px">'
      + '<div class="mono" style="font-size:.75rem;letter-spacing:.06em;color:var(--red);font-weight:600;margin-bottom:10px">LIBRARY OF READINGS</div>'
      + '<h1 style="font-size:2.125rem;line-height:1.14;font-weight:600;margin:0 0 10px;color:var(--ink)">Open every source online.</h1>'
      + '<p style="font-size:1rem;line-height:1.6;color:#474C57;margin:0;max-width:62ch">Click any reading to open the full text in a new tab, watch the scholars speak, and filter the collection by week or by topic.</p></div>'
      + '<div style="display:flex;gap:10px;flex:none">'
      + stats.map(function (st) { return '<div style="background:#EEF1F5;border:1px solid #DEE3EA;border-radius:12px;padding:12px 16px;text-align:center;min-width:82px"><div class="mono" style="font-size:1.75rem;font-weight:600;line-height:1;color:var(--red)">' + st[1] + '</div><div style="font-size:.6875rem;text-transform:uppercase;letter-spacing:.06em;color:#474C57;margin-top:5px">' + st[0] + '</div></div>'; }).join('')
      + '</div></div></section>';
    function pill(active, label, onclick, accent) {
      accent = accent || '#DA291C';
      return '<button onclick="' + onclick + '" aria-pressed="' + active + '" style="flex:none;border:1px solid ' + (active ? accent : '#DEE3EA') + ';background:' + (active ? accent : '#fff') + ';color:' + (active ? '#fff' : '#474C57') + ';font-size:.8125rem;font-weight:' + (active ? '600' : '500') + ';padding:7px 13px;border-radius:999px;white-space:nowrap;cursor:pointer">' + label + '</button>';
    }
    var weekRail = '<div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px">'
      + pill(s.galWeek == null, 'All weeks', 'SOC.galWeek(null)')
      + weeks.map(function (w) { return pill(s.galWeek === w, '<span class="mono" style="opacity:.7">W' + w + '</span> ' + esc(weekTitle(w)), 'SOC.galWeek(' + w + ')'); }).join('')
      + '</div>';
    var topicRail = '<div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px">'
      + pill(s.galTopic == null, 'All topics', 'SOC.galTopic(null)', '#15171C')
      + topics.map(function (t) { return pill(s.galTopic === t, esc(topicLabel(t)), 'SOC.galTopic(\'' + t + '\')', '#15171C'); }).join('')
      + '</div>';
    var anyFilter = (s.galWeek != null) || s.galTopic;
    var filterBar = '<section style="background:#fff;border:1px solid #DEE3EA;border-radius:14px;padding:14px 16px;margin-bottom:16px;box-shadow:0 1px 2px rgba(21,23,28,.04);position:sticky;top:0;z-index:5">'
      + '<div style="display:flex;align-items:center;gap:7px;margin-bottom:7px"><span style="display:flex;color:#8a909c">' + ic('calendar', 15) + '</span><span style="font-size:.7rem;font-weight:600;letter-spacing:.05em;color:#8a909c;text-transform:uppercase">Filter by week</span></div>'
      + weekRail
      + '<div style="display:flex;align-items:center;gap:7px;margin:13px 0 7px"><span style="display:flex;color:#8a909c">' + ic('sparkle', 15) + '</span><span style="font-size:.7rem;font-weight:600;letter-spacing:.05em;color:#8a909c;text-transform:uppercase">Filter by topic</span></div>'
      + topicRail
      + '<div style="display:flex;align-items:center;gap:11px;margin-top:13px;padding-top:12px;border-top:1px solid #EEF1F5"><span style="font-size:.8125rem;font-weight:500;color:#474C57">' + list.length + ' of ' + D.records.length + ' readings</span>' + (anyFilter ? '<button onclick="SOC.galClear()" style="background:none;border:none;color:var(--red);font-size:.8125rem;font-weight:600;cursor:pointer">Clear filters</button>' : '') + '</div>'
      + '</section>';
    var grid = list.length
      ? '<div class="soc-cardgrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">' + list.map(rgCard).join('') + '</div>'
      : '<div style="text-align:center;padding:60px 20px;color:#474C57"><div style="font-size:1.0625rem;font-weight:600;color:#15171C;margin-bottom:10px">No readings match those filters.</div><button onclick="SOC.galClear()" style="background:var(--red);color:#fff;border:none;border-radius:9px;padding:10px 18px;font-size:.9375rem;font-weight:600;cursor:pointer">Clear filters</button></div>';
    return '<div class="rise">' + hero + filterBar + grid + '</div>';
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
      + '<button onclick="SOC.read(\'' + r.id + '\')" aria-label="' + esc(readLabel(r)) + ' in a new tab" style="width:100%;background:var(--red);color:#fff;border:none;border-radius:9px;padding:13px;font-size:1rem;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:9px">' + readLabel(r) + '<span style="display:flex">' + ic('external', 16) + '</span></button>'
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
  var RC_GUIDANCE = {
    thematic: [
      ['States the single main idea in one clear sentence, in your own words.', 'Names the central claim the author argues, not just the topics covered.', 'Is specific enough that a reader could tell which reading it came from.'],
      ['Points to specific evidence the author uses (a study, example, case, or text), not just that evidence exists.', 'Shows HOW that evidence supports the claim, not only that it is there.', 'Separates the author\'s strongest support from a minor or passing example.'],
      ['Moves past the surface topic to the deeper claim the author makes about it.', 'Names what the author wants you to think or do differently.', 'Connects the reading to the wider course theme it speaks to.'],
      ['Names something specific that shifted, was added to, or was challenged in your thinking.', 'Explains why that change matters, not just that it happened.', 'Is honest about what still feels unclear or unresolved.']
    ],
    stylistic: [
      ['Names the tone in a word or two (for example plain, urgent, careful, personal).', 'Points to a specific line or moment where you felt that tone.', 'Says what the tone does to you as a reader (draws you in, warns, reassures).'],
      ['Describes the structure (for example story then analysis, problem then solution, a list of cases).', 'Links that structure to how the argument builds or lands.', 'Notes one place where the order of the ideas matters.'],
      ['Picks one specific word, image, phrase, or moment, not a general impression.', 'Describes the effect it had on you as a reader.', 'Says why the author might have chosen it.'],
      ['Names the likely audience (students, scholars, the public, a community).', 'Points to what in the writing signals who it is for (vocabulary, references, assumptions).', 'Considers who is not addressed.']
    ],
    contextual: [
      ['Identifies the author and the position or background they write from.', 'Notes how that position might shape what they notice or value.', 'Stays within what the reading or its context actually tells you, without guessing.'],
      ['Ties the time, place, or community to a specific choice the author makes.', 'Shows how the same idea might read differently in another context.', 'Treats context as shaping the argument, not just decorating it.'],
      ['Names whose perspective is centred in the reading.', 'Names a perspective that is absent or mentioned only in passing.', 'Gives a reason that absence matters for the argument.'],
      ['Names the specific background a fair reader needs, not just that context matters.', 'Separates what the reading assumes you know from what it explains.', 'Considers how a reader without that background might misread it.']
    ],
    theoretical: [
      ['Picks one clear lens (for example power, gender, colonialism, whose knowledge counts).', 'Says what that lens makes visible in this specific reading.', 'Uses the lens to read the text, not just to label it.'],
      ['Names who benefits from the way the reading frames the issue.', 'Names who is disadvantaged, ignored, or carries the cost.', 'Ties the benefit or harm to a specific part of the text.'],
      ['Identifies an assumption the author treats as given.', 'Explains why a critical reader should question it.', 'Considers what changes if that assumption does not hold.'],
      ['Names a second, different lens.', 'Shows how the reading would look different through it.', 'Says what each lens catches that the other misses.']
    ]
  };
  function rcChips() {
    return Object.keys(LENSES).map(function (k) {
      var on = state.lens === k;
      return '<button onclick="SOC.setLens(\'' + k + '\')" style="border:1px solid ' + (on ? '#15171C' : '#DEE3EA') + ';background:' + (on ? '#15171C' : '#fff') + ';color:' + (on ? '#fff' : '#15171C') + ';border-radius:999px;padding:7px 15px;font-size:.85rem;font-weight:600">' + LENSES[k].label + '</button>';
    }).join(' ');
  }
  function numList(arr) { if (!arr.length) return ''; if (arr.length === 1) return 'question ' + arr[0]; if (arr.length === 2) return 'questions ' + arr[0] + ' and ' + arr[1]; return 'questions ' + arr.slice(0, -1).join(', ') + ', and ' + arr[arr.length - 1]; }
  function listJoin(arr) { if (!arr.length) return ''; if (arr.length === 1) return arr[0]; if (arr.length === 2) return arr[0] + ' and ' + arr[1]; return arr.slice(0, -1).join(', ') + ', and ' + arr[arr.length - 1]; }
  var RC_SKILLS = { argument: 'the main argument', concepts: 'the key concepts', context: 'the context and who is speaking', significance: 'why the reading matters' };
  var RC_SKILL_ORDER = ['argument', 'concepts', 'context', 'significance'];
  function rcSkillProfile(rid, items) {
    var stat = {};
    items.forEach(function (m, mi) { var sk = m.skill; if (!sk) return; var sel = state.mcSel[rid + '|mc|' + mi]; if (sel === undefined || sel === null) return; if (!stat[sk]) stat[sk] = { right: 0, total: 0, whys: [] }; stat[sk].total++; if (sel === m.answer) stat[sk].right++; else if (m.why) stat[sk].whys.push(m.why); });
    var strengths = [], opps = [];
    RC_SKILL_ORDER.forEach(function (sk) { var s = stat[sk]; if (!s) return; if (s.right === s.total) strengths.push(RC_SKILLS[sk]); else opps.push({ key: sk, label: RC_SKILLS[sk], whys: s.whys }); });
    return { strengths: strengths, opps: opps, has: (strengths.length + opps.length) > 0 };
  }
  function lcFirst(s) { s = String(s == null ? '' : s); return s.charAt(0).toLowerCase() + s.slice(1); }
  function ucFirst(s) { s = String(s == null ? '' : s); return s.charAt(0).toUpperCase() + s.slice(1); }
  function rcBand(correct, total) {
    if (correct === total) return { label: 'Strong grasp', color: '#2c6b3f', bg: '#E9EFE7', icon: 'check', msg: 'You have a strong hold on this reading across every kind of question. The read-out below shows what came through.' };
    var pct = correct / total;
    if (pct >= 0.6) return { label: 'On your way', color: '#1552D8', bg: '#E7EEFB', icon: 'book', msg: 'You have the core of this reading. The read-out below shows where you are strong and where to look again.' };
    if (pct >= 0.4) return { label: 'Building', color: '#8F5E0F', bg: '#F3ECE0', icon: 'book', msg: 'You are part way into this reading. The read-out below shows what is landing and what to firm up.' };
    return { label: 'Worth another read', color: '#b23121', bg: '#FBE9E7', icon: 'book', msg: 'This reading has not fully landed yet. The read-out below shows exactly where to focus your next pass.' };
  }
  function readingComp() {
    var practiceNote = '<div style="display:flex;align-items:flex-start;gap:9px;background:#EEF1F5;border:1px solid #DEE3EA;border-radius:10px;padding:11px 14px;margin:0 0 16px;font-size:.85rem;line-height:1.5;color:#474C57"><span style="display:flex;color:#8a909c;flex:none;margin-top:1px">' + ic('book', 16) + '</span><span>This is a private space for practice and self-study. Nothing here is graded, recorded, or counted toward a mark. It is here to help you check your own understanding and see where to focus.</span></div>';
    var r = state.rcReading ? rec(state.rcReading) : null;
    if (!r) {
      var picks = D.records.map(function (rd) {
        var tm = typeMeta(rd.type);
        return '<button onclick="SOC.rcPick(\'' + rd.id + '\')" style="display:flex;align-items:center;gap:11px;width:100%;text-align:left;background:#fff;border:1px solid #DEE3EA;border-radius:10px;padding:12px 14px;margin-bottom:8px;color:#15171C"><span style="width:9px;height:9px;border-radius:50%;background:' + tm.color + ';flex:none"></span><span style="flex:1;min-width:0"><span style="display:block;font-weight:600;font-size:.95rem">' + esc(rd.title) + '</span><span style="font-size:.8125rem;color:#474C57">Week ' + rd.week + ' · ' + esc(rd.authors) + '</span></span><span style="color:#8a909c">' + ic('book', 16) + '</span></button>';
      }).join('');
      return '<div class="rise"><h1 style="font-size:1.75rem;margin:0 0 6px">Build Your Reading Comprehension</h1><p class="lede" style="max-width:72ch;margin:0 0 18px">Pick one reading. You will work through questions that build your understanding of it. Switch the lens to change the kind of questions you answer. Your answers save to your notes.</p>' + practiceNote + picks + '</div>';
    }
    var lens = LENSES[state.lens] || LENSES.thematic;
    var qs = RC_QUESTIONS[state.lens] || RC_QUESTIONS.thematic;
    var guide = RC_GUIDANCE[state.lens] || RC_GUIDANCE.thematic;
    var zones = qs.map(function (q, i) {
      var key = r.id + '|' + state.lens + '|' + i;
      var v = esc((state.rcNotes && state.rcNotes[key]) || '');
      var coreIdea = (i === 0 && r.coreIdea) ? esc(String(r.coreIdea).replace(/\s*\.?\s*$/, '')) + '.' : '';
      var crit = guide[i] || [];
      var rev = state.revealed[key]
        ? '<div style="margin-top:10px;background:#15171C;color:#fff;border-radius:10px;padding:13px 16px"><div class="mono" style="font-size:.66rem;letter-spacing:.05em;color:#9aa3b2;margin-bottom:8px">A STRONG RESPONSE COVERS</div><ul style="margin:0;padding-left:17px;font-size:.875rem;line-height:1.55;color:rgba(255,255,255,.93)">' + crit.map(function (c) { return '<li style="margin-bottom:5px">' + esc(c) + '</li>'; }).join('') + '</ul>' + (coreIdea ? '<div style="margin-top:11px;padding-top:10px;border-top:1px solid rgba(255,255,255,.16);font-size:.85rem;line-height:1.5;color:rgba(255,255,255,.9)"><span style="color:#F2A900;font-weight:600">From this reading: </span>the central idea is ' + coreIdea + '</div>' : '') + '<div style="margin-top:11px;font-size:.78rem;color:#9aa3b2">Compare your answer against this. There is no single right wording.</div><button onclick="SOC.rcReveal(\'' + key + '\')" style="margin-top:9px;background:rgba(255,255,255,.14);border:none;color:#fff;border-radius:7px;padding:5px 11px;font-size:.78rem;font-weight:600">Hide</button></div>'
        : '<button onclick="SOC.rcReveal(\'' + key + '\')" style="margin-top:10px;background:none;border:1px solid #DEE3EA;border-radius:8px;padding:7px 13px;font-size:.82rem;font-weight:600;color:#15171C">Reveal a strong response</button>';
      return '<div style="background:#fff;border:1px solid #DEE3EA;border-radius:12px;padding:15px 17px;margin-bottom:11px"><div style="display:flex;align-items:baseline;gap:10px;margin-bottom:7px"><span style="display:inline-flex;width:24px;height:24px;align-items:center;justify-content:center;background:#15171C;color:#fff;border-radius:50%;font-size:.8rem;font-weight:700;flex:none">' + (i + 1) + '</span><p style="margin:0;font-size:.95rem;color:#15171C">' + esc(q) + '</p></div><textarea oninput="SOC.rcNote(\'' + key + '\',this.value)" placeholder="Your answer" style="width:100%;min-height:68px;font:inherit;font-size:.9rem;line-height:1.5;padding:10px 12px;border:1px solid #DEE3EA;border-radius:8px;color:#15171C;background:#fff;resize:vertical">' + v + '</textarea>' + rev + '</div>';
    }).join('');
    var mcItems = MC[r.id] || [];
    var mcHtml = '';
    if (mcItems.length) {
      var answered = 0, correct = 0, missed = [];
      var rows = mcItems.map(function (m, mi) {
        var mkey = r.id + '|mc|' + mi;
        var sel = state.mcSel[mkey];
        var done = (sel !== undefined && sel !== null);
        if (done) { answered++; if (sel === m.answer) correct++; else missed.push(mi + 1); }
        var opts = (m.options || []).map(function (o, oi) {
          var isSel = (sel === oi), isCor = (oi === m.answer);
          var bg = '#fff', bd = '#DEE3EA', col = '#15171C';
          if (done && isCor) { bg = '#E9EFE7'; bd = '#50694C'; col = '#2c3b29'; }
          else if (done && isSel) { bg = '#F6E3E1'; bd = '#DA291C'; col = '#8f1b12'; }
          var mark = (done && isCor) ? ' &#10003;' : ((done && isSel) ? ' &#10007;' : '');
          return '<button onclick="SOC.mcPick(\'' + mkey + '\',' + oi + ')" style="display:block;width:100%;text-align:left;border:1px solid ' + bd + ';background:' + bg + ';color:' + col + ';border-radius:8px;padding:9px 12px;margin-bottom:7px;font-size:.9rem;font-weight:500">' + esc(o) + mark + '</button>';
        }).join('');
        var ok = (sel === m.answer);
        var why = done ? '<div style="margin:9px 0 0;padding:10px 13px;border-radius:9px;background:' + (ok ? '#E9EFE7' : '#FBE9E7') + ';border:1px solid ' + (ok ? '#9CC4A8' : '#E5A9A2') + '"><span style="display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:.9rem;color:' + (ok ? '#2c6b3f' : '#b23121') + '">' + (ok ? ic('check', 15, 2.4) + 'Correct' : ic('x', 15, 2.4) + 'Not quite') + '</span><div style="margin-top:4px;font-size:.85rem;line-height:1.5;color:#474C57">' + esc(m.why || '') + '</div></div>' : '';
        return '<div style="background:#fff;border:1px solid #DEE3EA;border-radius:12px;padding:15px 17px;margin-bottom:11px"><p style="margin:0 0 9px;font-size:.95rem;font-weight:600;color:#15171C">' + (mi + 1) + '. ' + esc(m.q) + '</p>' + opts + why + '</div>';
      }).join('');
      var total = mcItems.length, pct = Math.round(100 * correct / total);
      var score = '<div style="margin:2px 0 16px;max-width:460px">'
        + '<div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px"><span style="font-size:.9rem;font-weight:700;color:#15171C">' + (answered ? 'You got ' + correct + ' of ' + total : 'Answer to fill the meter') + '</span><span style="font-size:.78rem;color:#8a909c">' + answered + ' of ' + total + ' answered</span></div>'
        + '<div style="height:11px;background:#EEF1F5;border-radius:999px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#50694C,#74a878);border-radius:999px;transition:width .35s ease"></div></div>'
        + (answered ? '' : '<p style="font-size:.8rem;color:#8a909c;margin:8px 0 0">Pick an answer to check it right away. You can change your choice.</p>') + '</div>';
      var band = (answered === total && total) ? rcBand(correct, total) : null;
      var pctLabel = band ? Math.round(100 * correct / total) + '%' : '';
      var diagLine = '';
      if (band) {
        var prof = rcSkillProfile(r.id, mcItems);
        if (prof.has) {
          if (prof.strengths.length) { var coreBit = (prof.strengths.indexOf(RC_SKILLS.argument) >= 0 && r.coreIdea) ? ' You have the central point, that ' + lcFirst(esc(String(r.coreIdea).replace(/\s*\.?\s*$/, ''))) + '.' : ''; diagLine += '<div style="margin-top:12px"><span class="mono" style="font-size:.66rem;letter-spacing:.05em;color:#2c6b3f">YOUR STRENGTHS</span><div style="font-size:.9rem;line-height:1.5;color:#15171C;margin-top:3px">Your answers show you read ' + listJoin(prof.strengths) + ' well.' + coreBit + '</div></div>'; }
          if (prof.opps.length) { var oppRows = prof.opps.map(function (o) { return '<div style="margin-top:7px"><span style="font-weight:600;color:#15171C">' + ucFirst(o.label) + '.</span> <span style="color:#474C57">' + (o.whys.length ? esc(o.whys.join(' ')) : 'Go back to this in the reading and read for it directly.') + '</span></div>'; }).join(''); diagLine += '<div style="margin-top:12px"><span class="mono" style="font-size:.66rem;letter-spacing:.05em;color:#8F5E0F">AREAS OF OPPORTUNITY</span><div style="font-size:.875rem;line-height:1.5;color:#15171C;margin-top:1px">' + oppRows + '</div></div>'; }
          else diagLine += '<div style="margin-top:10px;font-size:.85rem;color:#2c6b3f">No gaps stood out. You handled the argument, the concepts, the context, and the significance, all of it.</div>';
        } else {
          diagLine = (missed.length) ? '<p style="margin:7px 0 0;font-size:.9rem;line-height:1.5;color:#15171C"><span style="font-weight:600">Look again at ' + numList(missed) + '.</span> Those are the ideas to firm up before you move on.</p>' : '<p style="margin:7px 0 0;font-size:.9rem;color:#15171C"><span style="font-weight:600">You answered every question correctly.</span> Nothing to revisit here.</p>';
        }
      }
      var bandHtml = band ? '<div style="margin:18px 0 4px;background:' + band.bg + ';border:1.5px solid ' + band.color + ';border-radius:13px;padding:17px 19px">'
        + '<div class="mono" style="font-size:.68rem;letter-spacing:.06em;color:' + band.color + ';margin-bottom:7px">WHERE YOU ARE IN THIS READING</div>'
        + '<div style="display:flex;align-items:center;gap:11px;flex-wrap:wrap"><span style="display:flex;color:' + band.color + '">' + ic(band.icon, 24, 2.2) + '</span><span style="font-size:1.35rem;font-weight:700;color:' + band.color + '">' + band.label + '</span><span style="margin-left:auto;text-align:right"><span style="display:block;font-size:1.05rem;font-weight:700;color:' + band.color + '">' + correct + ' of ' + total + '</span><span style="font-size:.72rem;color:#474C57">correct (' + pctLabel + ')</span></span></div>'
        + '<div style="height:8px;background:#fff;border-radius:999px;overflow:hidden;margin:11px 0 2px"><div style="height:100%;width:' + Math.round(100 * correct / total) + '%;background:' + band.color + ';border-radius:999px"></div></div>'
        + '<p style="margin:11px 0 0;font-size:.92rem;line-height:1.55;color:#15171C">' + band.msg + '</p>'
        + diagLine
        + '<div style="margin-top:14px;display:flex;gap:9px;flex-wrap:wrap"><button onclick="SOC.read(\'' + r.id + '\')" style="background:' + band.color + ';border:none;color:#fff;border-radius:9px;padding:8px 15px;font-size:.875rem;font-weight:600">' + readLabel(r) + ' &#8599;</button><button onclick="SOC.mcReset(\'' + r.id + '\')" style="background:#fff;border:1px solid ' + band.color + ';color:' + band.color + ';border-radius:9px;padding:8px 15px;font-size:.875rem;font-weight:600">Try these questions again</button></div></div>' : '';
      mcHtml = '<div style="margin:24px 0 4px"><h2 style="font-size:1.15rem;margin:0 0 3px">Check your understanding</h2><p style="font-size:.85rem;color:#8a909c;margin:0 0 12px">Quick questions on this reading, with the answer right away.</p>' + score + rows + bandHtml + '</div>';
    }
    return '<div class="rise"><div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:4px"><h1 style="font-size:1.5rem;margin:0">Build Your Reading Comprehension</h1><button onclick="SOC.rcClear()" style="margin-left:auto;background:none;border:none;color:var(--red);font-size:.875rem;font-weight:600">Choose a different reading</button></div>'
      + practiceNote
      + '<div style="background:#15171C;color:#fff;border-radius:12px;padding:15px 18px;margin:8px 0 16px"><div class="mono" style="font-size:.6875rem;letter-spacing:.04em;color:#9aa3b2;margin-bottom:3px">YOUR READING</div><div style="font-size:1.0625rem;font-weight:600">' + esc(r.title) + '</div><div style="font-size:.875rem;color:rgba(255,255,255,.85)">Week ' + r.week + ' · ' + esc(r.authors) + ' · ' + esc(r.year) + '</div><button onclick="SOC.read(\'' + r.id + '\')" style="margin-top:10px;background:rgba(255,255,255,.14);border:none;color:#fff;border-radius:7px;padding:7px 13px;font-size:.85rem;font-weight:600">' + readLabel(r) + ' ↗</button></div>'
      + '<div style="font-size:.8125rem;font-weight:600;color:#15171C;margin-bottom:7px">Choose a lens (this changes the questions)</div><div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:6px">' + rcChips() + '</div><p style="font-size:.82rem;color:#8a909c;margin:0 0 16px">' + esc(lens.label) + ': ' + esc(lens.hint) + '.</p>'
      + zones
      + mcHtml
      + '<button onclick="SOC.saveReadingNotes()" style="background:var(--red);border:none;color:#fff;border-radius:9px;padding:10px 18px;font-size:.9rem;font-weight:600;margin-top:8px">Save my notes</button></div>';
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
  function courseCode() { return (D.course && D.course.code) || ''; }
  function focusWeek(sel) { var ws = weeksWithReadings(); return sel == null ? (ws[0] || 1) : sel; }
  function recordsForWeek(w) { return D.records.filter(function (r) { return r.week === w; }); }
  function firstWhere(list, fn) { for (var i = 0; i < list.length; i++) if (fn(list[i])) return list[i]; return null; }
  function firstSentence(s) { var t = String(s || '').replace(/\s+/g, ' ').trim(), m = t.match(/^(.{60,220}?[.!?])\s/); return m ? m[1] : t.slice(0, 240); }
  function studioOpenBtn(r) {
    return r ? '<button onclick="SOC.read(\'' + r.id + '\')" style="margin-top:6px;align-self:flex-start;background:none;border:none;color:#1552D8;font-size:.78rem;font-weight:600;padding:0;cursor:pointer">Open the reading &#8599;</button>' : '';
  }
  function studioPanel(kicker, title, body, meta, icon, accent, r) {
    return '<div style="background:#fff;border:1px solid #DEE3EA;border-top:4px solid ' + accent + ';border-radius:12px;padding:15px 16px;display:flex;flex-direction:column;gap:8px;min-height:190px">'
      + '<div class="mono" style="display:flex;align-items:center;gap:7px;font-size:.6875rem;letter-spacing:.05em;color:#8a909c">' + ic(icon || 'clipboard', 14) + esc(kicker) + '</div>'
      + '<h3 style="font-size:1.0625rem;line-height:1.3;margin:0;color:#15171C">' + esc(title) + '</h3>'
      + '<p style="font-size:.875rem;line-height:1.55;color:#474C57;margin:0">' + esc(body) + '</p>'
      + (meta ? '<div style="margin-top:auto;border-left:3px solid #DEE3EA;padding-left:10px;font-size:.75rem;line-height:1.45;color:#6b7280">' + esc(meta) + '</div>' : '')
      + studioOpenBtn(r)
      + '</div>';
  }
  function studioCheck(key, check) {
    var sel = state.mcSel[key], done = (sel !== undefined && sel !== null), ok = done && sel === check.answer;
    var opts = check.options.map(function (o, oi) {
      var isSel = sel === oi, isCor = oi === check.answer, bg = '#fff', bd = '#DEE3EA', col = '#15171C';
      if (done && isCor) { bg = '#E9EFE7'; bd = '#50694C'; col = '#2c3b29'; }
      else if (done && isSel) { bg = '#F6E3E1'; bd = '#DA291C'; col = '#8f1b12'; }
      var mark = (done && isCor) ? ' &#10003;' : ((done && isSel) ? ' &#10007;' : '');
      return '<button onclick="SOC.mcPick(\'' + key + '\',' + oi + ')" aria-pressed="' + (isSel ? 'true' : 'false') + '" style="display:block;width:100%;text-align:left;border:1px solid ' + bd + ';background:' + bg + ';color:' + col + ';border-radius:8px;padding:9px 12px;margin-bottom:7px;font-size:.875rem;font-weight:500;cursor:pointer">' + esc(o) + mark + '</button>';
    }).join('');
    var why = done ? '<div style="margin:8px 0 0;padding:10px 13px;border-radius:9px;background:' + (ok ? '#E9EFE7' : '#FBE9E7') + ';border:1px solid ' + (ok ? '#9CC4A8' : '#E5A9A2') + '"><span style="display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:.875rem;color:' + (ok ? '#2c6b3f' : '#b23121') + '">' + (ok ? ic('check', 14, 2.4) + 'Correct' : ic('x', 14, 2.4) + 'Not quite') + '</span><div style="margin-top:4px;font-size:.84rem;line-height:1.5;color:#474C57">' + esc(check.why) + '</div></div>' : '';
    return '<div role="group" style="background:#F7F8FA;border:1px solid #DEE3EA;border-radius:12px;padding:14px 16px;margin-top:14px"><div class="mono" style="font-size:.6875rem;letter-spacing:.05em;color:#8a909c;margin-bottom:8px">QUICK CHECK</div><p style="margin:0 0 9px;font-size:.9rem;font-weight:600;color:#15171C">' + esc(check.q) + '</p>' + opts + why + '</div>';
  }
  function studioShell(title, intro, inner) {
    return '<section style="background:#fff;border:1px solid #DEE3EA;border-radius:14px;padding:18px 18px 20px;margin:0 0 22px;box-shadow:0 1px 2px rgba(21,23,28,.04)">'
      + '<div class="mono" style="font-size:.6875rem;letter-spacing:.06em;color:var(--red);font-weight:600;margin-bottom:6px">SELF-CHECK STUDIO</div>'
      + '<h2 style="font-size:1.3125rem;line-height:1.25;margin:0 0 7px;color:#15171C">' + esc(title) + '</h2>'
      + '<p style="font-size:.9375rem;line-height:1.55;color:#474C57;margin:0 0 15px;max-width:78ch">' + esc(intro) + '</p>' + inner + '</section>';
  }
  function socStudio(sel) {
    if (!HAS_EYE) return '';
    var w = focusWeek(sel), recs = recordsForWeek(w);
    var west = firstWhere(recs, function (r) { return r.eye === 'western'; });
    var ind = firstWhere(recs, function (r) { return r.eye === 'indigenous'; });
    if (!ind) return '';
    var panels = (west ? studioPanel('WESTERN EYE', west.authors, west.coreIdea, west.title + ' (' + west.year + ')', 'eye', '#3a47a8', west) : '')
      + studioPanel('INDIGENOUS EYE', ind.authors, ind.coreIdea, ind.title + ' (' + ind.year + ')', 'eye', '#1f4d38', ind);
    var soloNote = west ? '' : '<div style="margin-top:12px;background:#E4F0E9;border:1px solid #c4ddcf;border-radius:11px;padding:12px 15px;font-size:.85rem;line-height:1.55;color:#1f4d38">This week centres Indigenous knowledge; there is no separate Western-eye reading to set beside it. That is itself a Two-Eyed Seeing observation: not every topic carries a Western counterpart, and the Indigenous frame stands on its own here.</div>';
    var prompts = west
      ? ['What does ' + ind.authors + '\'s reading let you see that ' + west.authors + '\'s does not?', 'What would be missed if this week were read with only the Western eye?', 'What responsibility does ' + ind.authors + ' ask you to keep visible?']
      : ['What does ' + ind.authors + '\'s reading let you see about this week\'s topic?', 'What responsibility does ' + ind.authors + ' ask you to keep visible?'];
    var practice = '<div style="margin-top:14px;background:#F7F8FA;border:1px solid #DEE3EA;border-radius:12px;padding:14px 16px"><div class="mono" style="font-size:.6875rem;letter-spacing:.05em;color:#8a909c;margin-bottom:7px">TWO-EYED SEEING PRACTICE</div><p style="font-size:.78rem;color:#6b7280;line-height:1.5;margin:0 0 9px">Two-Eyed Seeing (Etuaptmumk) was named by Mi\'kmaw Elder Albert Marshall: seeing with the strengths of Indigenous knowledge in one eye and Western knowledge in the other, both kept whole. It is a practice you bring, not a synthesis the app writes.</p>' + prompts.map(function (p) { return '<div style="display:flex;gap:9px;align-items:flex-start;font-size:.875rem;line-height:1.5;color:#15171C;margin:6px 0"><span style="color:var(--red);font-weight:700">+</span><span>' + esc(p) + '</span></div>'; }).join('') + '</div>';
    var check = west ? studioCheck('SOC122|studio|' + w, {
      q: 'What is most at risk if this week\'s topic is treated as only a Western research-methods question?',
      options: [firstSentence(ind.coreIdea), 'Nothing important; the Western frame already covers it', 'Only the choice of examples or the citation style'],
      answer: 0,
      why: 'What is lost is exactly what ' + ind.authors + ' brings: ' + lcFirst(String(ind.coreIdea).replace(/\s*\.?\s*$/, '')) + '. Two-Eyed Seeing keeps both eyes open so this is not flattened into a footnote.'
    }) : '';
    var woven = '';
    if (west) {
      var wk2 = 'SOC122|weave|' + w, syn = (D.syntheses || {})[[west.id, ind.id].sort().join('|')];
      if (syn) woven = state.revealed[wk2]
        ? '<div style="margin-top:12px;background:#15171C;color:#fff;border-radius:11px;padding:14px 16px"><div class="mono" style="font-size:.62rem;letter-spacing:.05em;color:#9aa3b2;margin-bottom:6px">ONE GROUNDED WEAVE</div><p style="font-size:.86rem;line-height:1.55;color:rgba(255,255,255,.92);margin:0">' + esc(syn) + '</p><p style="font-size:.72rem;color:#9aa3b2;margin:9px 0 0">One way the course readings have been held together, not the answer. Two-Eyed Seeing keeps both eyes distinct (Etuaptmumk), never blended. <button onclick="SOC.rcReveal(\'' + wk2 + '\')" style="background:none;border:none;color:#f3b0a8;font-weight:600;cursor:pointer;padding:0">Hide</button></p></div>'
        : '<button onclick="SOC.rcReveal(\'' + wk2 + '\')" style="margin-top:12px;background:#fff;border:1px solid #DEE3EA;color:#15171C;border-radius:9px;padding:9px 14px;font-size:.84rem;font-weight:600;cursor:pointer">Reflect first, then see one grounded weave &#8595;</button>';
    }
    var save = '<div style="margin-top:14px"><button onclick="SOC.saveStudio()" style="background:var(--red);border:none;color:#fff;border-radius:9px;padding:9px 16px;font-size:.875rem;font-weight:600;cursor:pointer">Save my work to the Personal Cartography (.docx)</button></div>';
    return studioShell('Two attributed eyes', 'Read the two source frames as attributed readings, then bring Two-Eyed Seeing yourself. The app does not write a bridge for you.', '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px">' + panels + '</div>' + soloNote + practice + check + woven + save);
  }
  function psyStudio(sel) {
    var w = focusWeek(sel), recs = recordsForWeek(w), r = recs[0] || D.records[0], g = conceptsForWeek(w)[0] || (D.glossary || [])[0], items = (r && MC[r.id]) || [];
    if (!r) return '';
    var ev = firstWhere(items, function (m) { return m.skill === 'argument' || m.skill === 'context'; });
    var panels = studioPanel('CLAIM', r.title, r.coreIdea, r.authors + ' (' + r.year + ')', 'book', '#1552D8')
      + studioPanel('EVIDENCE', ev ? ev.q : 'What supports the claim?', ev ? ev.why : firstSentence(r.abstract), 'Ground this in the reading before applying it.', 'search', '#1f7a4d')
      + studioPanel('BOUNDARY', 'What this does not prove', 'Do not turn this idea into a rule for every learner. Check the context, supports, workload, strategy, and evidence before giving advice.', g ? g.term : 'Course concept', 'x', '#B7791F')
      + studioPanel('TRANSFER', 'Academic next step', 'Name one course task, one support, one study strategy, and one sign that the strategy is working.', 'No clinical or diagnostic framing.', 'external', '#7C3AED');
    var check = studioCheck('PSY355|studio|' + w, {
      q: 'Which next step uses this idea responsibly, without turning it into a rule or blaming the student?',
      options: ['Name one course task, one support, and one sign the strategy is working, then check the context before advising.', 'Tell the student they just need more grit or a better attitude.', 'Apply it the same way to every student, whatever their situation.'],
      answer: 0,
      why: 'The responsible step respects the boundary: ' + lcFirst(String(r.coreIdea).replace(/\s*\.?\s*$/, '')) + ', but only within its supports and context. Grit-talk blames the learner; one-size-fits-all overstates the reading.'
    });
    var save = '<div style="margin-top:14px"><button onclick="SOC.saveStudio()" style="background:var(--red);border:none;color:#fff;border-radius:9px;padding:9px 16px;font-size:.875rem;font-weight:600;cursor:pointer">Save my work to the Resilience Plan (.docx)</button></div>';
    return studioShell('Evidence Transfer Lab', 'Move from definition to responsible application: claim, evidence, boundary, then academic transfer.', '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px">' + panels + '</div>' + check + save);
  }
  function bfsStudio(sel) {
    var w = focusWeek(sel), recs = recordsForWeek(w), r = recs[0] || D.records[0], g = conceptsForWeek(w)[0] || (D.glossary || [])[0];
    if (!r) return '';
    var response = firstWhere(D.records, function (x) { return (x.themes || []).indexOf('resistance') >= 0 || /Benjamin|Costanza|Tanksley/i.test(x.authors + ' ' + x.title); }) || r;
    var rows = [['System or technology', 'Name the system, platform, model, database, policy, or technical process.'], ['Design, data, or default', 'Locate the design choice, data source, rule, threshold, category, or default setting.'], ['Racialized mechanism', 'Explain how the system sorts, exposes, excludes, predicts, surveils, or ranks people.'], ['Harm and accountability', 'Name the harm and the institutions responsible for changing the structure, not just one bad actor.'], ['Response', 'Ground the repair, refusal, abolitionist tool, or policy response in the course readings.']];
    var chain = rows.map(function (row, i) { return '<div style="display:grid;grid-template-columns:34px minmax(0,1fr);gap:11px;align-items:start;background:#fff;border:1px solid #DEE3EA;border-radius:12px;padding:12px 14px"><div class="mono" style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9px;background:#F6E3E1;color:var(--red);font-weight:700">' + (i + 1) + '</div><div><div style="font-size:.9375rem;font-weight:600;color:#15171C;margin-bottom:3px">' + esc(row[0]) + '</div><div style="font-size:.8125rem;line-height:1.5;color:#474C57">' + esc(row[1]) + '</div></div></div>'; }).join('');
    var anchor = '<div style="margin-top:14px;background:#F7F8FA;border:1px solid #DEE3EA;border-radius:12px;padding:14px 16px"><div class="mono" style="font-size:.6875rem;letter-spacing:.05em;color:#8a909c;margin-bottom:7px">SOURCE ANCHORS</div><p style="font-size:.875rem;line-height:1.55;color:#15171C;margin:0 0 8px"><strong>' + esc(r.authors) + ':</strong> ' + esc(r.coreIdea) + '</p><p style="font-size:.875rem;line-height:1.55;color:#15171C;margin:0"><strong>Response reading:</strong> ' + esc(response.coreIdea) + '</p></div>';
    var check = studioCheck('BFS218|studio|' + w, {
      q: 'Which option names the racialized MECHANISM, not only the outcome or someone\'s intent?',
      options: [firstSentence(r.coreIdea), 'Someone built the system to be racist on purpose.', 'The unequal results just happened by chance.'],
      answer: 0,
      why: 'The mechanism sits in the design and data, not in intent or luck: ' + lcFirst(String(r.coreIdea).replace(/\s*\.?\s*$/, '')) + '. That is the New Jim Code, harm built into how the system is made.'
    });
    var save = '<div style="margin-top:14px"><button onclick="SOC.saveStudio()" style="background:var(--red);border:none;color:#fff;border-radius:9px;padding:9px 16px;font-size:.875rem;font-weight:600;cursor:pointer">Save my work to the Personal Cartography (.docx)</button></div>';
    return studioShell('Accountability Chain Lab', 'Trace techno-racism through mechanism and responsibility. A strong answer names structure, not only intent.', '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px">' + chain + '</div>' + anchor + (g ? '<div style="font-size:.75rem;color:#8a909c;margin-top:10px">Concept anchor: ' + esc(g.term) + '</div>' : '') + check + save);
  }
  function selfCheckStudio(sel) {
    var code = courseCode();
    if (code === 'SOC122') return socStudio(sel);
    if (code === 'PSY355') return psyStudio(sel);
    if (code === 'BFS218') return bfsStudio(sel);
    return '';
  }

  var MAP_CAVEAT = 'This layer is a teaching aid, not a legal or definitive boundary. Regions are anchored in the self-identified nations of the Indigenous scholars assigned this term. For authoritative representations of territories and treaties, consult the Nations themselves and sources such as Native-Land.ca.';
  var MAP_REGIONS = [
    { id: 'mikmaki-lawrence', region: "Mi'kma'ki (Atlantic)", admin: 'NS / NB / PEI / NL', nation: "Mi'kmaw", scholar: 'Bonita Lawrence', records: ['lawrence2003'], concept: 'regulation of Native identity; social structure', lat: 45.4, lng: -63.0, check: "Lawrence's account of identity regulation: law turns belonging into a bureaucratic category with gendered and racial effects." },
    { id: 'mikmaki-learning', region: "Mi'kma'ki (Atlantic)", admin: 'NS', nation: "Mi'kmaw", scholar: 'Marie Battiste; Albert Marshall', records: ['battiste', 'amarshall'], concept: 'learning spirit; Two-Eyed Seeing (Etuaptmumk)', lat: 45.95, lng: -60.65, check: "Battiste and Marshall's account of learning spirit and Two-Eyed Seeing as a whole-person, two-knowledge practice." },
    { id: 'mikmaki-palmater', region: "Mi'kma'ki (Atlantic)", admin: 'NB', nation: "Mi'kmaw, Eel River Bar", scholar: 'Pamela Palmater', records: ['palmater'], concept: 'poverty produced by law and policy', lat: 47.9, lng: -65.6, check: "Palmater's structural claim that poverty is produced by law and policy, not by culture or individual failure." },
    { id: 'blackfoot', region: 'Niitsitapi / Blackfoot', admin: 'southern Alberta', nation: 'Blackfoot, Kainai', scholar: 'Leroy Little Bear', records: ['littlebear'], concept: 'worldview difference at the root', lat: 49.6, lng: -113.1, check: "Little Bear's worldview claim: colonial mapping can hide the deeper clash between imposed Western categories and Indigenous worldviews." },
    { id: 'redriver', region: 'Red River / Metis homeland', admin: 'Manitoba / prairies', nation: 'Red River Metis; Cree-Metis; Metis', scholar: 'Zoe Todd; Kim Anderson; Janet Smylie', records: ['todd2016', 'anderson2019', 'smylie'], concept: 'place and ontology; kinship as work; centring Indigenous knowledge', lat: 49.9, lng: -97.1, check: 'Todd, Anderson, and Smylie keep place, kinship, and Indigenous health tied to relationships and knowledge control.' },
    { id: 'cree', region: 'Cree territory', admin: 'Sturgeon Lake / prairies-north', nation: 'Cree', scholar: 'Willie Ermine', records: ['ermine'], concept: 'ethical space', lat: 53.0, lng: -106.5, check: "Ermine's ethical space: the meeting place has to be negotiated, not governed by one side's rules." },
    { id: 'anishinaabe', region: 'Anishinaabe', admin: 'Great Lakes', nation: 'Anishinaabe', scholar: 'Amy Bombay', records: ['bombay2014'], concept: 'historical trauma across generations', lat: 48.7, lng: -94.2, check: "Bombay and colleagues' account of historical trauma and community connection across generations." },
    { id: 'aaniiih', region: 'Aaniiih', admin: 'Montana / medicine-line', nation: 'Aaniiih', scholar: 'Joseph P. Gone', records: ['gone2023'], concept: 'trauma as postcolonial, not individual', lat: 48.1, lng: -108.7, check: "Gone's warning that trauma and health inequities are postcolonial and community-defined, not only individual symptoms." }
  ];
  function mapActive() {
    return firstWhere(MAP_REGIONS, function (m) { return m.id === state.mapRegion; }) || MAP_REGIONS[0];
  }
  function mapRecords(m) {
    return (m.records || []).map(rec).filter(Boolean);
  }
  function mapCheck(m) {
    return {
      q: 'What is lost if you read this place only through the administrative label?',
      options: [m.check, 'Nothing important; the administrative label already contains the course concept.', 'Only the spelling of the place name changes.'],
      answer: 0,
      why: 'The administrative label can help you locate the anchor, but it does not carry the course concept by itself. The reading is what brings ' + m.concept + ' into view.'
    };
  }
  function mapLayerTitle(m) {
    return state.mapLayer === 'admin' ? m.admin : m.region;
  }
  function mapLayerMeta(m) {
    return state.mapLayer === 'admin' ? 'Administrative naming' : (m.scholar + ' (' + m.nation + ')');
  }
  function mapPoint(m) {
    var on = state.mapRegion === m.id;
    var label = mapLayerTitle(m), meta = mapLayerMeta(m);
    return '<button onclick="SOC.mapPick(\'' + m.id + '\')" aria-pressed="' + (on ? 'true' : 'false') + '" title="' + esc(m.region + ' / ' + m.admin) + '" style="position:absolute;left:' + m.x + '%;top:' + m.y + '%;transform:translate(-50%,-50%);width:138px;min-height:54px;display:flex;flex-direction:column;justify-content:center;gap:3px;text-align:center;border:2px solid ' + (on ? 'var(--red)' : '#DEE3EA') + ';background:' + (on ? '#F6E3E1' : '#fff') + ';color:#15171C;border-radius:10px;padding:7px 8px;box-shadow:0 4px 12px rgba(21,23,28,.10);font-size:.75rem;font-weight:700;line-height:1.18;white-space:normal;z-index:' + (on ? '4' : '2') + '"><span>' + esc(label) + '</span><span style="font-size:.62rem;font-weight:600;color:#6b7280;line-height:1.2">' + esc(meta) + '</span></button>';
  }
  function mapVisual() {
    var adminOn = state.mapLayer === 'admin', indOn = state.mapLayer === 'indigenous';
    var layerBtns = '<div style="display:flex;gap:4px;background:#EEF1F5;border-radius:9px;padding:4px;align-self:flex-start" role="group" aria-label="Map layer">'
      + '<button onclick="SOC.mapLayer(\'admin\')" aria-pressed="' + adminOn + '" style="' + segStyle(adminOn) + '">' + ic('grid', 15) + '<span>Administrative</span></button>'
      + '<button onclick="SOC.mapLayer(\'indigenous\')" aria-pressed="' + indOn + '" style="' + segStyle(indOn) + '">' + ic('eye', 15) + '<span>Indigenous scholar anchors</span></button></div>';
    return '<section style="background:#fff;border:1px solid #DEE3EA;border-radius:14px;padding:16px 18px;box-shadow:0 1px 2px rgba(21,23,28,.04)">'
      + '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px"><div><div class="mono" style="font-size:.6875rem;letter-spacing:.05em;color:#8a909c;margin-bottom:4px">LAYER TOGGLE</div><h2 style="font-size:1.125rem;margin:0;color:#15171C">One land, two naming systems</h2></div>' + layerBtns + '</div>'
      + '<div style="overflow:auto;border:1px solid #DEE3EA;border-radius:14px;background:#EEF1F5">'
      + '<div role="img" aria-label="Teaching map of Canada using approximate reading anchors, not territory boundaries." style="position:relative;min-width:720px;min-height:430px;background:linear-gradient(180deg,#F7FBFF,#EEF1F5);overflow:hidden">'
      + '<div style="position:absolute;left:4%;right:4%;top:20%;bottom:18%;border-radius:46% 42% 38% 40%;background:#fff;border:1px solid #D6DEE9;box-shadow:inset 0 0 0 1px rgba(255,255,255,.8)"></div>'
      + '<div class="mono" style="position:absolute;left:20px;top:16px;font-size:.65rem;letter-spacing:.06em;color:#8a909c">PACIFIC</div>'
      + '<div class="mono" style="position:absolute;right:20px;top:16px;font-size:.65rem;letter-spacing:.06em;color:#8a909c">ATLANTIC</div>'
      + '<div class="mono" style="position:absolute;left:22px;bottom:17px;font-size:.65rem;letter-spacing:.06em;color:#8a909c">GENERAL READING ANCHORS ONLY</div>'
      + MAP_REGIONS.map(mapPoint).join('')
      + '</div></div>'
      + '<p style="font-size:.78rem;line-height:1.5;color:#6b7280;margin:10px 0 0">The visual marks general reading anchors only. It does not draw, define, or replace territory or treaty boundaries.</p>'
      + '</section>';
  }
  function mapNoteBox(k, label, prompt) {
    return '<label style="display:block;background:#fff;border:1px solid #DEE3EA;border-radius:12px;padding:13px 15px;margin-bottom:12px"><span class="mono" style="display:block;font-size:.6875rem;letter-spacing:.05em;color:#8a909c;margin-bottom:6px">' + esc(label) + '</span><span style="display:block;font-size:.875rem;line-height:1.45;color:#15171C;margin-bottom:8px">' + esc(prompt) + '</span><textarea oninput="SOC.mapNote(\'' + k + '\',this.value)" style="width:100%;min-height:82px;font:inherit;font-size:.9rem;line-height:1.5;padding:10px 12px;border:1px solid #DEE3EA;border-radius:8px;color:#15171C;background:#fff;resize:vertical">' + esc(state.mapNotes[k] || '') + '</textarea></label>';
  }
  function mapReadingRows(m) {
    return mapRecords(m).map(function (r) {
      return '<div style="background:#fff;border:1px solid #DEE3EA;border-radius:10px;padding:12px 14px;margin-bottom:9px"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px">' + eyePill(r) + weekTag(r) + '<span class="mono" style="font-size:.6875rem;color:#8a909c">' + esc(String(r.year)) + '</span></div><div style="font-size:.95rem;font-weight:700;color:#15171C;line-height:1.25">' + esc(r.title) + '</div><div style="font-size:.8125rem;color:#474C57;margin:3px 0 7px">' + esc(r.authors) + '</div><p style="font-size:.84rem;line-height:1.5;color:#474C57;margin:0">' + esc(r.coreIdea) + '</p><button onclick="SOC.read(\'' + r.id + '\')" style="margin-top:9px;background:none;border:none;color:#1552D8;font-size:.8125rem;font-weight:700;padding:0">' + readLabel(r) + ' &#8599;</button></div>';
    }).join('');
  }
  function mapDetail() {
    var m = mapActive();
    return '<section id="map-detail" style="background:#fff;border:1px solid #DEE3EA;border-radius:14px;padding:16px 18px;box-shadow:0 1px 2px rgba(21,23,28,.04)">'
      + '<div class="mono" style="font-size:.6875rem;letter-spacing:.05em;color:var(--red);font-weight:600;margin-bottom:6px">SELECTED ANCHOR</div>'
      + '<h2 style="font-size:1.25rem;line-height:1.25;margin:0 0 6px;color:#15171C">' + esc(m.region) + '</h2>'
      + '<div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:12px"><span style="font-size:.75rem;font-weight:700;background:#EEF1F5;color:#15171C;border-radius:999px;padding:5px 9px">Administrative: ' + esc(m.admin) + '</span><span style="font-size:.75rem;font-weight:700;background:#E4F0E9;color:#1f4d38;border-radius:999px;padding:5px 9px">' + esc(m.nation) + '</span></div>'
      + '<div style="font-size:.875rem;line-height:1.55;color:#474C57;margin-bottom:11px"><strong>Scholar anchor:</strong> ' + esc(m.scholar) + '<br><strong>Concept:</strong> ' + esc(m.concept) + '</div>'
      + mapReadingRows(m)
      + studioCheck('SOC122|map|' + m.id, mapCheck(m))
      + '<div style="margin-top:14px"><button onclick="SOC.saveMap()" style="background:var(--red);border:none;color:#fff;border-radius:9px;padding:9px 16px;font-size:.875rem;font-weight:600;cursor:pointer">Save to Personal Cartography (.docx)</button></div>'
      + '</section>';
  }
  function mapFallbackTable() {
    var rows = MAP_REGIONS.map(function (m) {
      return '<tr><td style="padding:10px 12px;border-top:1px solid #EEF1F5">' + esc(m.region) + '</td><td style="padding:10px 12px;border-top:1px solid #EEF1F5">' + esc(m.admin) + '</td><td style="padding:10px 12px;border-top:1px solid #EEF1F5">' + esc(m.scholar + ' (' + m.nation + ')') + '</td><td style="padding:10px 12px;border-top:1px solid #EEF1F5">' + esc(m.concept) + '</td><td style="padding:10px 12px;border-top:1px solid #EEF1F5"><button onclick="SOC.mapSelect(\'' + m.id + '\')" style="background:#fff;border:1px solid #DEE3EA;color:#15171C;border-radius:8px;padding:6px 10px;font-size:.8125rem;font-weight:700">Show on map</button></td></tr>';
    }).join('');
    return '<section style="background:#fff;border:1px solid #DEE3EA;border-radius:14px;margin-top:18px;overflow:hidden;box-shadow:0 1px 2px rgba(21,23,28,.04)"><div style="padding:14px 16px;border-bottom:1px solid #EEF1F5"><div class="mono" style="font-size:.6875rem;letter-spacing:.05em;color:#8a909c;margin-bottom:4px">ACCESSIBLE TABLE</div><h2 style="font-size:1.0625rem;margin:0;color:#15171C">Same anchors without the visual</h2></div><div style="overflow:auto"><table style="width:100%;min-width:820px;border-collapse:collapse;font-size:.84rem;color:#15171C"><thead><tr style="text-align:left;background:#F7F8FA"><th style="padding:10px 12px">Indigenous layer</th><th style="padding:10px 12px">Administrative layer</th><th style="padding:10px 12px">Scholar anchor</th><th style="padding:10px 12px">Concept</th><th style="padding:10px 12px">Action</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>';
  }
  function mapById(id) { return firstWhere(MAP_REGIONS, function (m) { return m.id === id; }) || MAP_REGIONS[0]; }
  var _leafletMap = null, _leafletMarkers = {};
  function ensureLeaflet(cb) {
    if (window.L) { cb(); return; }
    if (!document.getElementById('leaflet-css')) { var lk = document.createElement('link'); lk.id = 'leaflet-css'; lk.rel = 'stylesheet'; lk.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(lk); }
    if (document.getElementById('leaflet-js')) return;
    var sc = document.createElement('script'); sc.id = 'leaflet-js'; sc.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    sc.onload = cb;
    sc.onerror = function () { var h = document.getElementById('soc-leaflet'); if (h) h.innerHTML = '<div style="padding:26px;color:#6b7280;font-size:.9rem;line-height:1.5">The interactive map could not load (you may be offline). The table below has the same anchors, scholars, and readings.</div>'; };
    document.head.appendChild(sc);
  }
  function initCartography() {
    var host = document.getElementById('soc-leaflet');
    if (!host || !window.L || host.getAttribute('data-init') === '1') return;
    host.setAttribute('data-init', '1');
    _leafletMap = L.map(host, { scrollWheelZoom: false, attributionControl: true });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap contributors &copy; CARTO', subdomains: 'abcd', minZoom: 3, maxZoom: 11 }).addTo(_leafletMap);
    _leafletMarkers = {};
    var pts = [];
    MAP_REGIONS.forEach(function (m) {
      if (m.lat == null) return;
      pts.push([m.lat, m.lng]);
      var icon = L.divIcon({ className: '', html: '<div class="soc-pin"></div>', iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -11] });
      var mk = L.marker([m.lat, m.lng], { icon: icon, keyboard: true, title: m.scholar + ' (' + m.nation + ')', alt: m.scholar + ', ' + m.nation }).addTo(_leafletMap);
      mk.bindPopup(mapPopupHTML(m), { maxWidth: 260 });
      mk.on('click', function () { state.mapRegion = m.id; var el = document.getElementById('soc-mapdetail'); if (el) el.innerHTML = mapDetailInner(m); persist(); });
      _leafletMarkers[m.id] = mk;
    });
    if (pts.length) _leafletMap.fitBounds(L.latLngBounds(pts).pad(0.25));
  }
  function mapPopupHTML(m) {
    var r = mapRecords(m)[0];
    return '<div style="min-width:178px"><div style="font-size:.62rem;font-weight:700;letter-spacing:.04em;color:#1f4d38;text-transform:uppercase">' + esc(m.nation) + '</div>'
      + '<div style="font-size:.95rem;font-weight:700;color:#15171C;margin:2px 0 4px">' + esc(m.scholar) + '</div>'
      + (r ? '<div style="font-size:.8rem;color:#474C57;line-height:1.4">' + esc(r.title) + '</div><button onclick="SOC.read(\'' + r.id + '\')" style="margin-top:7px;background:#DA291C;border:none;color:#fff;border-radius:7px;padding:6px 11px;font-size:.78rem;font-weight:600;cursor:pointer">Open the reading</button>' : '')
      + '<div style="margin-top:6px;font-size:.7rem;color:#8a909c">Approximate anchor, not a boundary.</div></div>';
  }
  function mapDetailInner(m) {
    return '<section id="map-detail" style="background:#fff;border:1px solid var(--border);border-radius:14px;padding:16px 18px;box-shadow:0 1px 2px rgba(21,23,28,.04)">'
      + '<div class="mono" style="font-size:.6875rem;letter-spacing:.05em;color:var(--red);font-weight:600;margin-bottom:6px">SELECTED ANCHOR</div>'
      + '<h2 style="font-size:1.25rem;line-height:1.25;margin:0 0 8px;color:#15171C">' + esc(m.scholar) + '</h2>'
      + '<div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:12px"><span style="font-size:.75rem;font-weight:700;background:#E4F0E9;color:#1f4d38;border-radius:999px;padding:5px 9px">' + esc(m.nation) + '</span><span style="font-size:.75rem;font-weight:600;background:#EEF1F5;color:#474C57;border-radius:999px;padding:5px 9px">' + esc(m.region) + '</span></div>'
      + '<div style="font-size:.84rem;line-height:1.5;color:#474C57;margin-bottom:12px"><strong style="color:#15171C">Concept:</strong> ' + esc(m.concept) + '</div>'
      + mapReadingRows(m)
      + '</section>';
  }
  function mapNotesSaveBlock() {
    return '<section style="background:#fff;border:1px solid var(--border);border-radius:14px;padding:16px 18px;margin-top:18px;box-shadow:0 1px 2px rgba(21,23,28,.04)">'
      + '<div class="mono" style="font-size:.6875rem;letter-spacing:.05em;color:#8a909c;margin-bottom:6px">YOUR CARTOGRAPHY NOTES</div>'
      + '<label style="display:block"><span style="display:block;font-size:.875rem;line-height:1.5;color:#15171C;margin-bottom:8px">Pick an anchor on the map, open its reading, then note what reading this place through the scholar and the concept makes visible that an administrative map leaves out.</span>'
      + '<textarea oninput="SOC.mapNote(\'apply\',this.value)" style="width:100%;min-height:96px;font:inherit;font-size:.9rem;line-height:1.5;padding:10px 12px;border:1px solid var(--border);border-radius:8px;color:#15171C;background:#fff;resize:vertical">' + esc(state.mapNotes.apply || '') + '</textarea></label>'
      + '<div style="margin-top:14px"><button onclick="SOC.saveMap()" style="background:var(--red);border:none;color:#fff;border-radius:9px;padding:9px 16px;font-size:.875rem;font-weight:600;cursor:pointer">Save to Personal Cartography (.docx)</button></div>'
      + '</section>';
  }
  function mapScreen() {
    var m = mapActive();
    return '<div class="rise">'
      + '<div class="mono" style="font-size:.75rem;letter-spacing:.06em;color:var(--red);font-weight:600;margin-bottom:8px">PERSONAL CARTOGRAPHY</div>'
      + '<h1 style="font-size:1.75rem;line-height:1.2;font-weight:600;margin:0 0 8px;color:#15171C">Travel the country through the readings.</h1>'
      + '<p style="font-size:.9375rem;line-height:1.55;color:#474C57;margin:0 0 14px;max-width:78ch">Each pin marks where an Indigenous scholar assigned this term locates their own nation. Tap a pin to meet the scholar, the place, and the reading. Then note what each place makes visible.</p>'
      + '<div style="display:flex;align-items:flex-start;gap:10px;background:#FCEFD2;border:1px solid #E6C878;border-radius:12px;padding:12px 15px;margin:0 0 18px;color:#59410B;font-size:.85rem;line-height:1.5"><span style="display:flex;flex:none;color:#8F5E0F;margin-top:1px">' + ic('layers', 16) + '</span><span>' + esc(MAP_CAVEAT) + '</span></div>'
      + '<div class="soc-mapgrid">'
      + '<div><div id="soc-leaflet" style="height:540px;border:1px solid var(--border);border-radius:14px;overflow:hidden;background:#EEF1F5" role="application" aria-label="Interactive map of approximate Indigenous scholar reading anchors across Canada"></div>'
      + '<p style="font-size:.78rem;line-height:1.5;color:#6b7280;margin:10px 0 0">Pins are approximate anchors at each scholar\'s self-identified nation. They do not draw, define, or replace territory or treaty boundaries.</p></div>'
      + '<aside id="soc-mapdetail">' + mapDetailInner(m) + '</aside>'
      + '</div>'
      + mapNotesSaveBlock()
      + mapFallbackTable()
      + '</div>';
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
      + selfCheckStudio(sel)
      + '<div class="soc-cardgrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">' + list.map(card).join('') + '</div></div>';
  }

  /* ---------- immersive journey shell ---------- */
  var JOURNEY_Q = {
    SOC122: {
      1: 'What makes a private trouble a public, patterned question, and who gets to decide what counts as knowledge?',
      2: 'What becomes possible when Indigenous and Western knowledges are held together, each kept whole?',
      3: 'Who decides what counts as knowledge in a classroom, and what would real change ask of the institution?',
      4: 'When the data itself fails Indigenous peoples, what does honest, accountable evidence look like?',
      5: 'What turns an assertion about people into a claim you can defend, and who gets to set the method?',
      6: 'If culture is just what a group learns and shares, how do we understand difference without ranking it, or borrow ideas without erasing people?',
      8: 'How much of who we are is made in relationship, and how much is decided by law?',
      9: 'Is inequality random, or is it engineered and then kept in place?',
      10: 'When we explain the mind, what do we miss if we forget history and colonization?',
      11: 'How much of identity and behaviour is shaped between people, and carried across generations?',
      12: 'What is a family: a structure, a set of relationships, or the ongoing work of keeping a home?'
    }
  };
  function journeyQ(w) { var c = (D.course && D.course.code) || ''; return (JOURNEY_Q[c] && JOURNEY_Q[c][w]) || 'What is this week asking you to see?'; }
  function journeyWeeks() { return weeksWithReadings(); }
  function currentJourneyWeek() { var ws = journeyWeeks(); if (!ws.length) return null; if (state.journeyWeek && ws.indexOf(state.journeyWeek) >= 0) return state.journeyWeek; return ws[0]; }
  function heroArt() {
    return '<svg class="jhero-art" viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'
      + '<path d="M0,250 C160,210 300,300 460,250 C620,200 720,260 800,230 L800,320 L0,320 Z" fill="#DA291C" fill-opacity=".05"/>'
      + '<path d="M0,285 C180,250 320,320 500,280 C660,245 740,295 800,275 L800,320 L0,320 Z" fill="#1B2A4A" fill-opacity=".04"/>'
      + '<g stroke="#DA291C" stroke-opacity=".10" fill="none" stroke-width="1.4"><path d="M360,150 C480,110 600,180 760,130 C800,116 810,120 830,112"/><path d="M360,185 C480,150 600,215 760,165 C800,150 810,156 830,148"/></g>'
      + '<g fill="#DA291C" fill-opacity=".16"><circle cx="690" cy="70" r="2.6"/><circle cx="742" cy="118" r="1.8"/><circle cx="636" cy="52" r="1.6"/></g>'
      + '</svg>';
  }
  function journeyIntro() {
    var fr = (D.course && D.course.frame);
    if (fr) return 'One question runs through this course: how do we understand people and society, and whose knowledge counts? You follow it week by week, with two ways of seeing held side by side, ' + fr + '. Start at the top, or pick up where you left off.';
    return 'Follow one question through the whole course, week by week. Each week sets up what to read, why it matters, and one thing to do with it. Start at the top, or pick up where you left off.';
  }
  function journeyHome() {
    var ws = journeyWeeks(), cur = currentJourneyWeek(), started = !!state.journeyWeek;
    var title = (D.course && (D.course.name || D.course.code)) || 'Your course';
    var ctaLabel = started ? ('Resume Week ' + cur) : ('Start Week ' + (ws[0] || 1));
    var hero = '<section class="jhero jfade" style="margin-bottom:26px">' + heroArt()
      + '<div style="position:relative;max-width:64ch">'
      + '<div class="mono" style="font-size:.75rem;letter-spacing:.08em;color:var(--red);font-weight:600;margin-bottom:12px">SENECA POLYTECHNIC &middot; FALL 2026</div>'
      + '<h1 style="font-size:2.5rem;line-height:1.1;font-weight:600;margin:0 0 14px;letter-spacing:-.01em">' + esc(title) + '</h1>'
      + '<p style="font-size:1.0625rem;line-height:1.6;color:var(--ink-dim);margin:0 0 24px;max-width:54ch">' + esc(journeyIntro()) + '</p>'
      + '<button class="jhero-cta" onclick="SOC.station(' + (cur || (ws[0] || 1)) + ')">' + ctaLabel + ic('chevron', 18, 2.4) + '</button>'
      + (started ? '' : '<div style="margin-top:14px;font-size:.8125rem;color:var(--ink-faint)">' + ws.length + ' weeks &middot; two ways of seeing each one</div>')
      + '</div></section>';
    var spineHead = '<div style="display:flex;align-items:baseline;gap:12px;margin:0 0 16px;flex-wrap:wrap"><h2 style="font-size:1.375rem;font-weight:600;margin:0;color:var(--ink)">Your journey</h2><span style="font-size:.875rem;color:var(--ink-faint)">' + ws.length + ' weeks, in course order</span></div>';
    return '<div class="rise">' + hero + spineHead + journeyStations(cur) + '</div>';
  }
  function journeyStations(cur) {
    var ws = journeyWeeks();
    return '<div style="display:flex;flex-direction:column;gap:12px">' + ws.map(function (w) {
      var recs = recordsForWeek(w), n = recs.length, isCur = (w === cur), eyes = {};
      recs.forEach(function (r) { if (r.eye) eyes[r.eye] = 1; });
      var eyeNote = (eyes.western && eyes.indigenous) ? 'Western and Indigenous readings' : (eyes.indigenous ? 'Indigenous reading' + (n > 1 ? 's' : '') : (n + (n === 1 ? ' reading' : ' readings')));
      return '<button class="jstation' + (isCur ? ' cur' : '') + '" onclick="SOC.station(' + w + ')">'
        + '<div style="display:flex;align-items:flex-start;gap:16px">'
        + '<span class="jdot" style="display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;flex:none;border-radius:12px;background:' + (isCur ? 'var(--red)' : '#1B2A4A') + ';color:#fff;font-family:var(--mono);font-size:1.0625rem;font-weight:600">' + w + '</span>'
        + '<div style="flex:1;min-width:0">'
        + '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:3px">' + (isCur ? '<span class="mono" style="font-size:.625rem;font-weight:700;letter-spacing:.06em;color:var(--red);background:#F6E3E1;padding:2px 8px;border-radius:999px">YOU ARE HERE</span>' : '') + '<h3 style="font-size:1.0625rem;font-weight:600;margin:0;color:var(--ink)">' + esc(weekTitle(w)) + '</h3></div>'
        + '<p style="font-size:.9375rem;line-height:1.5;color:var(--ink-dim);margin:0 0 8px">' + esc(journeyQ(w)) + '</p>'
        + '<div style="display:flex;align-items:center;gap:7px;font-size:.75rem;color:var(--ink-faint)"><span style="display:inline-flex;color:#8a909c">' + ic('book', 13) + '</span>' + esc(eyeNote) + '<span style="margin:0 4px">&middot;</span><span style="color:var(--red);font-weight:600">Open &rarr;</span></div>'
        + '</div></div></button>';
    }).join('') + '</div>';
  }
  function stationFraming(w, west, ind) {
    if (west && ind.length) return 'This week sets two readings side by side. ' + west.authors + ' brings the disciplinary view, and ' + ind[0].authors + ' brings an Indigenous one. They are not the same argument, and that is the point.';
    if (ind.length) return 'This week centres an Indigenous reading. Read it on its own terms before you reach for a frame from elsewhere.';
    if (west) return 'This week builds the disciplinary groundwork you carry forward into the rest of the course.';
    return '';
  }
  function stationReading(r, kicker) {
    var u = readUrl(r), eye = r.eye === 'indigenous' ? 'INDIGENOUS' : (r.eye === 'western' ? 'WESTERN' : ''), accent = r.eye === 'indigenous' ? '#1f4d38' : '#3a47a8';
    var look = r.assigned ? ('<div style="margin-top:10px;background:#F7F8FA;border-left:3px solid ' + accent + ';padding:8px 12px;border-radius:0 8px 8px 0;font-size:.8125rem;line-height:1.5;color:var(--ink-dim)"><span style="font-weight:600;color:var(--ink)">Read:</span> ' + esc(r.assigned) + '</div>') : '';
    return '<div style="border:1px solid var(--border);border-top:4px solid ' + accent + ';background:#fff;border-radius:13px;padding:17px 19px">'
      + '<div style="display:flex;align-items:center;gap:9px;margin-bottom:7px"><span class="mono" style="font-size:.625rem;font-weight:700;letter-spacing:.04em;color:' + accent + '">' + esc(kicker) + '</span>' + (eye ? '<span class="mono" style="font-size:.625rem;color:#8a909c">' + eye + ' EYE</span>' : '') + '</div>'
      + '<h3 style="font-size:1.1875rem;line-height:1.3;font-weight:600;margin:0 0 3px;color:var(--ink)">' + esc(r.title) + '</h3>'
      + '<div style="font-size:.8125rem;color:var(--ink-dim);margin-bottom:9px">' + esc(r.authors) + ' &middot; ' + esc(String(r.year)) + '</div>'
      + '<p style="font-size:.9375rem;line-height:1.55;color:var(--ink-dim);margin:0">' + esc(r.coreIdea) + '</p>'
      + look
      + '<div style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap">'
      + (u ? '<button onclick="SOC.read(\'' + r.id + '\')" style="display:inline-flex;align-items:center;gap:7px;background:var(--red);border:none;color:#fff;border-radius:9px;padding:9px 16px;font-size:.875rem;font-weight:600;cursor:pointer">Open the reading' + ic('external', 14, 2.2) + '</button>' : '')
      + '<button onclick="SOC.open(\'' + r.id + '\')" style="background:#fff;border:1px solid var(--border);color:var(--ink);border-radius:9px;padding:9px 16px;font-size:.875rem;font-weight:600;cursor:pointer">Details</button>'
      + '</div></div>';
  }
  function stationDo(w) {
    var tiles = [['See it for yourself', 'Work this week\'s readings in the Self-Check Studio.', 'clipboard', 'SOC.goWeek(\'cards\',' + w + ')']];
    if (D.course && D.course.frame) tiles.push(['Locate it on your map', 'Add this week to your Personal Cartography.', 'globe', 'SOC.go(\'map\')']);
    tiles.push(['Hold two readings together', 'Compare any two readings, side by side.', 'columns', 'SOC.go(\'compare\')']);
    var th = tiles.map(function (t) {
      return '<button class="jtile" onclick="' + t[3] + '"><span style="display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:11px;background:#F6E3E1;color:var(--red)">' + ic(t[2], 19) + '</span><h4 style="font-size:1rem;font-weight:600;margin:4px 0 0;color:var(--ink)">' + t[0] + '</h4><p style="font-size:.84rem;line-height:1.5;color:var(--ink-dim);margin:0">' + t[1] + '</p></button>';
    }).join('');
    return '<div style="margin-top:8px"><div class="mono" style="font-size:.6875rem;letter-spacing:.05em;color:var(--ink-faint);margin:0 0 12px">NOW DO SOMETHING WITH IT</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px">' + th + '</div></div>';
  }
  function weekStation(w) {
    var ws = journeyWeeks(), idx = ws.indexOf(w), recs = recordsForWeek(w);
    if (idx < 0 || !recs.length) return '<div style="padding:40px 0;color:var(--ink-dim);font-size:1rem">This week has no readings posted yet. <button onclick="SOC.go(\'journey\')" style="background:none;border:none;color:var(--red);font-weight:600;cursor:pointer">Back to your journey</button></div>';
    var west = null, ind = [];
    recs.forEach(function (r) { if (r.eye === 'western') { west = west || r; } else { ind.push(r); } });
    var hero = '<section class="jfade jhero" style="margin-bottom:22px;padding:30px 32px 28px">' + heroArt()
      + '<div style="position:relative">'
      + '<div class="mono" style="font-size:.6875rem;letter-spacing:.06em;color:var(--red);font-weight:600;margin-bottom:9px">WEEK ' + w + ' OF YOUR JOURNEY</div>'
      + '<h1 style="font-size:1.875rem;line-height:1.16;font-weight:600;margin:0 0 12px">' + esc(weekTitle(w)) + '</h1>'
      + '<p style="font-size:1.0625rem;line-height:1.5;color:var(--ink);font-weight:500;margin:0;max-width:60ch">' + esc(journeyQ(w)) + '</p>'
      + '</div></section>';
    var framing = '<p style="font-size:1rem;line-height:1.65;color:var(--ink-dim);margin:0 0 22px;max-width:72ch">' + esc(stationFraming(w, west, ind)) + '</p>';
    var readBlocks = '<div style="display:flex;flex-direction:column;gap:14px;margin-bottom:24px">';
    if (west) readBlocks += stationReading(west, 'Start here, the disciplinary view');
    ind.forEach(function (r) { readBlocks += stationReading(r, west ? 'Then, the Indigenous view' : 'Indigenous reading'); });
    readBlocks += '</div>';
    var prev = idx > 0 ? ws[idx - 1] : null, next = idx < ws.length - 1 ? ws[idx + 1] : null;
    var navRow = '<div style="display:flex;gap:12px;margin-top:26px;flex-wrap:wrap">'
      + (prev != null ? '<button onclick="SOC.station(' + prev + ')" style="flex:1;min-width:190px;text-align:left;border:1px solid var(--border);background:#fff;border-radius:12px;padding:13px 16px;cursor:pointer"><div class="mono" style="font-size:.6875rem;color:var(--ink-faint)">&larr; PREVIOUS</div><div style="font-size:.9375rem;font-weight:600;color:var(--ink);margin-top:2px">Week ' + prev + ': ' + esc(weekTitle(prev)) + '</div></button>' : '')
      + (next != null ? '<button onclick="SOC.station(' + next + ')" style="flex:1;min-width:190px;text-align:right;border:1px solid var(--border);background:#fff;border-radius:12px;padding:13px 16px;cursor:pointer"><div class="mono" style="font-size:.6875rem;color:var(--red)">NEXT &rarr;</div><div style="font-size:.9375rem;font-weight:600;color:var(--ink);margin-top:2px">Week ' + next + ': ' + esc(weekTitle(next)) + '</div></button>' : '')
      + '</div>';
    return '<div class="rise">' + hero + framing + '<div class="mono" style="font-size:.6875rem;letter-spacing:.05em;color:var(--ink-faint);margin:0 0 12px">WHAT YOU ARE READING</div>' + readBlocks + stationDo(w) + navRow + '</div>';
  }
  function exploreHub() {
    var tiles = [];
    if (D.course && D.course.frame) tiles.push(['Personal Cartography', 'Place each week on a map of scholars, nations, and ideas, and keep your own notes.', 'globe', 'SOC.go(\'map\')']);
    tiles.push(['Self-Check Studio', 'Practise with a week\'s readings and save your work.', 'clipboard', 'SOC.go(\'cards\')']);
    tiles.push(['Compare readings', 'Hold any two readings side by side and see where they meet.', 'columns', 'SOC.go(\'compare\')']);
    tiles.push(['Build reading comprehension', 'Read closely with guided questions, then check yourself.', 'book', 'SOC.go(\'reading\')']);
    var th = tiles.map(function (t) {
      return '<button class="jtile" onclick="' + t[3] + '" style="min-height:172px"><span style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:12px;background:#F6E3E1;color:var(--red)">' + ic(t[2], 22) + '</span><h3 style="font-size:1.1875rem;font-weight:600;margin:6px 0 0;color:var(--ink)">' + t[0] + '</h3><p style="font-size:.9rem;line-height:1.55;color:var(--ink-dim);margin:0">' + t[1] + '</p><span style="margin-top:auto;color:var(--red);font-weight:600;font-size:.875rem">Open &rarr;</span></button>';
    }).join('');
    return '<div class="rise"><div class="mono" style="font-size:.75rem;letter-spacing:.06em;color:var(--red);font-weight:600;margin-bottom:8px">EXPLORE</div><h1 style="font-size:1.75rem;font-weight:600;margin:0 0 8px;color:var(--ink)">Ways to go deeper</h1><p style="font-size:.9375rem;color:var(--ink-dim);margin:0 0 22px;max-width:62ch">Beyond the week-by-week path, here are the hands-on tools. Use them whenever you like.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px">' + th + '</div></div>';
  }

  /* ---------- render ---------- */
  function homeBar() {
    return '<button onclick="SOC.go(\'journey\')" style="display:inline-flex;align-items:center;gap:7px;background:#fff;border:1px solid #DEE3EA;border-radius:8px;padding:8px 14px;font-size:.875rem;font-weight:600;color:#15171C;margin-bottom:18px;cursor:pointer">&#8592; Back to your journey</button>';
  }
  function body() {
    if (state.screen === 'journey' || state.screen === 'library') return journeyHome();
    if (state.screen === 'station') return homeBar() + weekStation(state.stationWeek || currentJourneyWeek());
    if (state.screen === 'explore') return homeBar() + exploreHub();
    if (state.screen === 'detail') return homeBar() + detail();
    if (state.screen === 'readings') return homeBar() + readingsGallery();
    if (state.screen === 'compare') return homeBar() + compare();
    if (state.screen === 'reading') return homeBar() + readingComp();
    if (state.screen === 'glossary') return homeBar() + glossaryScreen();
    if (state.screen === 'cards') return homeBar() + cardsScreen();
    if (state.screen === 'map' && D.course && D.course.frame) return homeBar() + mapScreen();
    return journeyHome();
  }
  function render() {
    if (state.screen !== 'compare' && render._prev !== undefined && render._prev !== state.screen && (state.compareIds.length || state.showSynthesis)) { state.compareIds = []; state.showSynthesis = false; }
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
    if (state.screen === 'map' && D.course && D.course.frame) ensureLeaflet(initCartography);
  }
  function topScroll() { var m = document.getElementById('soc-main'); if (m) m.scrollTop = 0; }

  /* ---------- actions ---------- */
  function flash(msg) { clearTimeout(toastTimer); var lr = document.getElementById('soc-live'); if (lr) { lr.textContent = ''; setTimeout(function () { lr.textContent = msg; }, 30); } state.toast = msg; render(); toastTimer = setTimeout(function () { state.toast = null; render(); }, 2200); }
  /* ---- real .docx (OOXML, dependency-free) ---- */
  function dxEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]; }); }
  function dxRun(text, opt) { opt = opt || {}; var rpr = '<w:rPr>'; if (opt.bold) rpr += '<w:b/>'; if (opt.color) rpr += '<w:color w:val="' + opt.color + '"/>'; if (opt.size) rpr += '<w:sz w:val="' + opt.size + '"/><w:szCs w:val="' + opt.size + '"/>'; rpr += '<w:rFonts w:ascii="IBM Plex Sans" w:hAnsi="IBM Plex Sans" w:cs="IBM Plex Sans"/></w:rPr>'; var parts = String(text == null ? '' : text).split('\n'), t = ''; for (var i = 0; i < parts.length; i++) { if (i > 0) t += '<w:br/>'; t += '<w:t xml:space="preserve">' + dxEsc(parts[i]) + '</w:t>'; } return '<w:r>' + rpr + t + '</w:r>'; }
  function dxPara(runsXml, opt) { opt = opt || {}; var ppr = '<w:pPr><w:spacing w:before="' + (opt.before || 0) + '" w:after="' + (opt.after || 120) + '"/>'; if (opt.border) ppr += '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="6" w:color="DEE3EA"/></w:pBdr>'; ppr += '</w:pPr>'; return '<w:p>' + ppr + runsXml + '</w:p>'; }
  function dxDoc(course, title, subLines, sections) { var body = ''; body += dxPara(dxRun('SENECA POLYTECHNIC · ' + course, { bold: true, color: 'DA291C', size: 18 }), { after: 40 }); body += dxPara(dxRun(title, { bold: true, color: 'DA291C', size: 36 }), { after: 60 }); (subLines || []).forEach(function (line, i) { body += dxPara(dxRun(line, { color: '474C57', size: 20 }), { after: (i === subLines.length - 1 ? 160 : 40), border: (i === subLines.length - 1) }); }); (sections || []).forEach(function (sec) { body += dxPara(dxRun(sec.h, { bold: true, color: 'DA291C', size: 22 }), { before: 160, after: 30 }); if (sec.t !== undefined && sec.t !== null) { var t = (String(sec.t).trim()) ? sec.t : '(not written yet)'; body += dxPara(dxRun(t, { color: '15171C', size: 22 }), { after: 80 }); } }); return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + body + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>'; }
  var DX_CT = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>';
  var DX_RELS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
  var dxCrcT = null;
  function dxCrc(bytes) { if (!dxCrcT) { dxCrcT = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); dxCrcT[n] = c >>> 0; } } var crc = 0xFFFFFFFF; for (var i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ dxCrcT[(crc ^ bytes[i]) & 0xFF]; return (crc ^ 0xFFFFFFFF) >>> 0; }
  function dxCat(arrs) { var len = 0, i; for (i = 0; i < arrs.length; i++) len += arrs[i].length; var out = new Uint8Array(len), off = 0; for (i = 0; i < arrs.length; i++) { out.set(arrs[i], off); off += arrs[i].length; } return out; }
  function dxU16(n) { return new Uint8Array([n & 255, (n >> 8) & 255]); }
  function dxU32(n) { return new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]); }
  function dxZip(files) { var enc = new TextEncoder(); var chunks = [], central = [], offset = 0; files.forEach(function (f) { var nameB = enc.encode(f.name); var data = (f.data instanceof Uint8Array) ? f.data : enc.encode(f.data); var crc = dxCrc(data), size = data.length; var lfh = dxCat([dxU32(0x04034b50), dxU16(20), dxU16(0), dxU16(0), dxU16(0), dxU16(0), dxU32(crc), dxU32(size), dxU32(size), dxU16(nameB.length), dxU16(0), nameB, data]); chunks.push(lfh); central.push(dxCat([dxU32(0x02014b50), dxU16(20), dxU16(20), dxU16(0), dxU16(0), dxU16(0), dxU16(0), dxU32(crc), dxU32(size), dxU32(size), dxU16(nameB.length), dxU16(0), dxU16(0), dxU16(0), dxU16(0), dxU32(0), dxU32(offset), nameB])); offset += lfh.length; }); var centralB = dxCat(central); var eocd = dxCat([dxU32(0x06054b50), dxU16(0), dxU16(0), dxU16(files.length), dxU16(files.length), dxU32(centralB.length), dxU32(offset), dxU16(0)]); return dxCat([dxCat(chunks), centralB, eocd]); }
  function senecaDoc(course, title, subLines, sections, fn) {
    var bytes = dxZip([{ name: '[Content_Types].xml', data: DX_CT }, { name: '_rels/.rels', data: DX_RELS }, { name: 'word/document.xml', data: dxDoc(course, title, subLines, sections) }]);
    var blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fn + '.docx';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
    flash('Saved to your device (Seneca template).');
  }
  window.SOC = {
    go: function (s) { if (s === 'library') { state.savedView = false; } if (s === 'reading') { state.rcReading = null; state.lens = 'thematic'; } if (s === 'readings') { state.galWeek = null; state.galTopic = null; } state.screen = s; focusTarget = 'soc-main'; render(); topScroll(); },
    station: function (w) { state.stationWeek = w; state.journeyWeek = w; state.screen = 'station'; persist(); focusTarget = 'soc-main'; render(); topScroll(); },
    goWeek: function (s, w) { state.cardWeek = w; state.screen = s; focusTarget = 'soc-main'; render(); topScroll(); },
    galWeek: function (w) { var m = document.getElementById('soc-main'); var y = m ? m.scrollTop : 0; state.galWeek = (state.galWeek === w) ? null : w; render(); var m2 = document.getElementById('soc-main'); if (m2) m2.scrollTop = y; },
    galTopic: function (t) { var m = document.getElementById('soc-main'); var y = m ? m.scrollTop : 0; state.galTopic = (state.galTopic === t) ? null : t; render(); var m2 = document.getElementById('soc-main'); if (m2) m2.scrollTop = y; },
    galClear: function () { state.galWeek = null; state.galTopic = null; render(); },
    playVideo: function (el, id) { var box = el.closest ? el.closest('.rgvideo') : el.parentNode; if (box) { box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1" title="Scholar talk" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>'; } },
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
    rcPick: function (id) { state.rcReading = id; state.lens = 'thematic'; persist(); render(); topScroll(); },
    rcClear: function () { state.rcReading = null; render(); topScroll(); },
    rcNote: function (k, v) { state.rcNotes[k] = v; persist(); },
    rcReveal: function (k) { var m = document.getElementById('soc-main'); var top = m ? m.scrollTop : 0; state.revealed[k] = !state.revealed[k]; render(); var m2 = document.getElementById('soc-main'); if (m2) m2.scrollTop = top; },
    mcPick: function (k, i) { var m = document.getElementById('soc-main'); var top = m ? m.scrollTop : 0; state.mcSel[k] = i; render(); var m2 = document.getElementById('soc-main'); if (m2) m2.scrollTop = top; },
    mcReset: function (id) { var m = document.getElementById('soc-main'); var top = m ? m.scrollTop : 0; var keep = {}; Object.keys(state.mcSel).forEach(function (k) { if (k.indexOf(id + '|mc|') !== 0) keep[k] = state.mcSel[k]; }); state.mcSel = keep; render(); var m2 = document.getElementById('soc-main'); if (m2) m2.scrollTop = top; },
    saveReadingNotes: function () {
      var r = state.rcReading && rec(state.rcReading); if (!r) { flash('Pick a reading first.'); return; }
      var cc = (D.course && D.course.code) || 'Course';
      var L = (LENSES[state.lens] || LENSES.thematic).label, qs = RC_QUESTIONS[state.lens] || RC_QUESTIONS.thematic;
      var sections = qs.map(function (q, i) { return { h: q, t: (state.rcNotes[r.id + '|' + state.lens + '|' + i] || '').trim() }; });
      var mcItems = MC[r.id] || [];
      if (mcItems.length) {
        var ans = 0, cor = 0, miss = [];
        mcItems.forEach(function (m, mi) { var s = state.mcSel[r.id + '|mc|' + mi]; if (s !== undefined && s !== null) { ans++; if (s === m.answer) cor++; else miss.push(mi + 1); } });
        var head = 'Score: ' + cor + ' of ' + mcItems.length + ' correct' + (ans < mcItems.length ? ' (' + ans + ' of ' + mcItems.length + ' answered).' : '.');
        if (ans === mcItems.length) {
          var b = rcBand(cor, mcItems.length); head += '\nWhere you are: ' + b.label + '. ' + b.msg;
          var prof = rcSkillProfile(r.id, mcItems);
          if (prof.has) {
            if (prof.strengths.length) { var cb = (prof.strengths.indexOf(RC_SKILLS.argument) >= 0 && r.coreIdea) ? ' You have the central point, that ' + lcFirst(String(r.coreIdea).replace(/\s*\.?\s*$/, '')) + '.' : ''; head += '\nYour strengths: you read ' + listJoin(prof.strengths) + ' well.' + cb; }
            if (prof.opps.length) { head += '\nAreas of opportunity:'; prof.opps.forEach(function (o) { head += '\n  ' + ucFirst(o.label) + '. ' + (o.whys.length ? o.whys.join(' ') : 'Go back to this in the reading and read for it directly.'); }); }
          } else if (miss.length) head += '\nLook again at ' + numList(miss) + '.';
        }
        sections.push({ h: 'Check your understanding', t: head });
        mcItems.forEach(function (m, mi) {
          var sel = state.mcSel[r.id + '|mc|' + mi];
          var done = (sel !== undefined && sel !== null);
          var chosen = done ? (m.options[sel] || '') : '(not answered)';
          var verdict = !done ? 'Not answered.' : (sel === m.answer ? 'Correct.' : 'Not quite.');
          var t = 'Your answer: ' + chosen + '\n' + verdict;
          if (done && sel !== m.answer) t += ' The correct answer is: ' + (m.options[m.answer] || '') + '.';
          if (m.why) t += '\n' + m.why;
          sections.push({ h: (mi + 1) + '. ' + m.q, t: t });
        });
      }
      senecaDoc(cc, 'Build Your Reading Comprehension', ['Reading: ' + r.title + ' by ' + r.authors, 'Lens: ' + L], sections, cc + '_reading_comprehension');
    },
    saveStudio: function () {
      var cc = courseCode(), w = focusWeek(state.cardWeek), recs = recordsForWeek(w), sections = [], sub = [], sel = state.mcSel[cc + '|studio|' + w], checkQ = '';
      if (cc === 'SOC122') {
        var west = firstWhere(recs, function (r) { return r.eye === 'western'; }), ind = firstWhere(recs, function (r) { return r.eye === 'indigenous'; });
        if (!ind) { flash('Open a week first.'); return; }
        sub = ['Self-Check Studio: Two attributed eyes', 'Week ' + w];
        if (west) sections.push({ h: 'Western eye', t: west.authors + ', ' + west.title + ' (' + west.year + ')\n' + west.coreIdea });
        sections.push({ h: 'Indigenous eye', t: ind.authors + ', ' + ind.title + ' (' + ind.year + ')\n' + ind.coreIdea });
        sections.push({ h: 'Two-Eyed Seeing practice', t: 'Two-Eyed Seeing (Etuaptmumk), named by Mi\'kmaw Elder Albert Marshall. The bridge is the practice you bring, not one the app writes.' });
        checkQ = 'What is most at risk if this is treated as only a Western research-methods question?';
      } else if (cc === 'PSY355') {
        var rp = recs[0] || D.records[0]; if (!rp) { flash('Open a week first.'); return; }
        sub = ['Self-Check Studio: Evidence Transfer Lab', 'Week ' + w];
        sections.push({ h: 'Claim', t: rp.authors + ' (' + rp.year + '): ' + rp.coreIdea });
        sections.push({ h: 'Boundary', t: 'What this does not prove: do not turn it into a rule for every learner; check context, supports, workload, strategy, and evidence first.' });
        sections.push({ h: 'Academic transfer', t: 'One course task, one support, one study strategy, and one sign the strategy is working. No clinical framing.' });
        checkQ = 'Which next step applies the idea responsibly, without blaming the student or overstating the reading?';
      } else if (cc === 'BFS218') {
        var rb = recs[0] || D.records[0]; if (!rb) { flash('Open a week first.'); return; }
        sub = ['Self-Check Studio: Accountability Chain Lab', 'Week ' + w];
        sections.push({ h: 'Source anchor', t: rb.authors + ': ' + rb.coreIdea });
        sections.push({ h: 'Accountability chain', t: 'System or technology, then design or data or default, then the racialized mechanism, then harm and the institutions responsible (not one bad actor), then a response grounded in the readings.' });
        checkQ = 'Which option names the racialized mechanism, not only the outcome or intent?';
      } else { flash('Self-Check Studio save is for the course sites.'); return; }
      if (sel !== undefined && sel !== null) sections.push({ h: 'Quick check', t: 'Q: ' + checkQ + '\nYour answer was ' + (sel === 0 ? 'the grounded one. Correct.' : 'not the grounded one. Look again at what the reading actually claims.') });
      senecaDoc(cc || 'Course', 'Self-Check Studio', sub, sections, (cc || 'Course') + '_self_check_studio');
    },
    mapLayer: function (layer) {
      var m = document.getElementById('soc-main'), top = m ? m.scrollTop : 0;
      state.mapLayer = layer === 'indigenous' ? 'indigenous' : 'admin';
      persist();
      render();
      var m2 = document.getElementById('soc-main'); if (m2) m2.scrollTop = top;
    },
    mapPick: function (id) {
      state.mapRegion = id;
      persist();
      focusTarget = 'map-detail';
      render();
    },
    mapNote: function (k, v) {
      state.mapNotes[k] = v;
      persist();
    },
    mapSelect: function (id) {
      state.mapRegion = id; persist();
      var m = mapById(id), el = document.getElementById('soc-mapdetail'); if (el) el.innerHTML = mapDetailInner(m);
      if (_leafletMap && m.lat != null) { _leafletMap.setView([m.lat, m.lng], 5); var mk = _leafletMarkers[id]; if (mk) mk.openPopup(); }
      var d = document.getElementById('soc-leaflet'); if (d && d.scrollIntoView) d.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },
    saveMap: function () {
      var m = mapActive(), rs = mapRecords(m);
      var readings = rs.map(function (r) { return 'Week ' + r.week + ': ' + r.title + ' by ' + r.authors + ' (' + r.year + ')\n' + r.coreIdea; }).join('\n\n');
      var sections = [
        { h: 'Caveat', t: MAP_CAVEAT },
        { h: 'Selected anchor', t: 'Scholar: ' + m.scholar + ' (' + m.nation + ')\nRegion: ' + m.region + '\nConcept: ' + m.concept },
        { h: 'Readings connected to this anchor', t: readings },
        { h: 'What this place makes visible', t: (state.mapNotes.apply || '').trim() }
      ];
      senecaDoc('SOC122', 'Personal Cartography Workspace', ['SOC122 Introduction to the Social Sciences', 'Selected anchor: ' + m.scholar + ' (' + m.nation + ')'], sections, 'SOC122_personal_cartography_workspace');
    },
    read: function (id) { var r = rec(id); var u = r && readUrl(r); if (u) { window.open(u, '_blank', 'noopener'); } else { state.screen = 'detail'; state.detailId = id; focusTarget = 'soc-main'; render(); topScroll(); } },
    openSaved: function () { state.screen = 'library'; state.activeTypes = []; state.activeWeek = null; state.search = ''; state.savedView = state.saved.length > 0; flash(state.saved.length ? 'Your saved shelf.' : 'Nothing saved yet. Tap the bookmark on any reading.'); topScroll(); },
    cardWeek: function (v) { state.cardWeek = (v === '' ? null : parseInt(v, 10)); render(); },
    glossWeek: function (v) { state.glossWeek = v; var o = document.getElementById('soc-gout'); if (o) o.innerHTML = glossaryByWeek(v); },
    glossSearch: function (v) { state.glossSearch = v; var o = document.getElementById('soc-gsearchout'); if (o) o.innerHTML = glossarySearchHTML(v); },
    glossWeekGo: function (w) { state.glossWeek = String(w); var sel = document.getElementById('soc-gweek'); if (sel) sel.value = String(w); var o = document.getElementById('soc-gout'); if (o) { o.innerHTML = glossaryByWeek(String(w)); o.scrollIntoView({ behavior: 'smooth', block: 'start' }); } },
    flip: function (el) { var c = el && (el.classList && el.classList.contains('flip') ? el : (el.closest ? el.closest('.flip') : null)); if (c) c.classList.toggle('flipped'); },
  };

  render();
})();
