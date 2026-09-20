/* Abyssal Audit Dashboard — per-language edition.
 *
 * Same dashboard as the English family (Raw Data / Results / Compare) plus a
 * Languages switch and a Docs tab. Everything is driven by manifest.json,
 * which CI rebuilds from audits/<country>/ on every push; if the manifest is
 * missing the page lists the folders live through the GitHub contents API.
 * Every metric is computed here, in the browser, from the raw per-call CSV. */
(() => {
'use strict';

// ═══════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════
const VARS = ['exact', 'native_in_random', 'native_in_nearsyn', 'custom_in', 'native_out'];
const VLBL = { exact: 'Exact', native_in_random: 'Native (Random)', native_in_nearsyn: 'Native (Near-Syn)', custom_in: 'Custom', native_out: 'Native (Gold excluded)' };
const MODES = ['free', 'enum'];
const INSC = new Set(['exact', 'native_in_random', 'native_in_nearsyn', 'custom_in']);
const RH = 38, BUF = 25;
const DEFAULT_GATES = { inscope: 94, nearsyn_free: 94, custom_free: 88, exact_free: 100, in_list: 100 };
// Preferred raw-table columns & widths; any extra CSV columns are appended.
const COLW = { case_id: 55, variant: 125, mode: 55, draw: 45, message: 240, gold: 120, expected: 110, output_norm: 120, matched: 55, in_list: 55, correct: 60, latency_ms: 75, tokens: 55, candidates: 260, output_raw: 120 };
const COLPREF = ['case_id', 'variant', 'mode', 'draw', 'message', 'gold', 'expected', 'output_norm', 'matched', 'in_list', 'correct', 'latency_ms', 'tokens', 'candidates', 'output_raw'];
const HIDE = new Set(['prompt']);

// ═══════════════════════════════════════
// STATE
// ═══════════════════════════════════════
let manifest = null, country = null, models = [];
let selModel = null, curData = [], filtData = [], sortCol = null, sortDir = 1, query = '', cols = [];
const cache = {};          // file -> {h, r}
let cmpSel = new Set(), cmpCache = {};
let vsBody, vsScrollAttached = false, curDoc = null;

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const T = v => /^(true|1|yes)$/i.test(String(v ?? '').trim());

// ═══════════════════════════════════════
// CSV PARSER (RFC4180-ish, handles quoted newlines)
// ═══════════════════════════════════════
function parseCSV(t) {
  const rows = [], lines = [];
  let i = 0;
  while (i < t.length) {
    const line = []; let f = '', q = false;
    while (i < t.length) {
      const c = t[i];
      if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i += 2; } else { q = false; i++; } } else { f += c; i++; } }
      else if (c === '"') { q = true; i++; }
      else if (c === ',') { line.push(f); f = ''; i++; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; i++; break; }
      else { f += c; i++; }
    }
    line.push(f);
    if (line.length > 1 || line[0] !== '') lines.push(line);
  }
  if (!lines.length) return { h: [], r: [] };
  const h = lines[0].map(x => x.replace(/^﻿/, ''));
  for (let r = 1; r < lines.length; r++) { const o = {}; for (let c = 0; c < h.length; c++) o[h[c]] = c < lines[r].length ? lines[r][c] : ''; rows.push(o); }
  return { h, r: rows };
}

// ═══════════════════════════════════════
// MANIFEST
// ═══════════════════════════════════════
async function loadManifest() {
  try { const r = await fetch('manifest.json', { cache: 'no-cache' }); if (!r.ok) throw new Error(r.status); return await r.json(); }
  catch (e) { return manifestFromGitHub(); }
}
async function manifestFromGitHub() {
  const m = location.hostname.match(/^([^.]+)\.github\.io$/), repo = location.pathname.split('/').filter(Boolean)[0];
  if (!m || !repo) throw new Error('manifest.json missing and not on GitHub Pages');
  const dirs = await (await fetch(`https://api.github.com/repos/${m[1]}/${repo}/contents/audits`)).json();
  if (!Array.isArray(dirs)) throw new Error('GitHub API unavailable');
  const countries = [];
  for (const d of dirs.filter(x => x.type === 'dir')) {
    const files = await (await fetch(d.url)).json(); let meta = {};
    const mf = files.find(f => f.name === 'meta.json'); if (mf) { try { meta = await (await fetch(mf.download_url)).json(); } catch (e) { /* ignore */ } }
    countries.push({ key: d.name, name: meta.name || d.name[0].toUpperCase() + d.name.slice(1), language: meta.language || '', flag: meta.flag || '🏳️',
      description: meta.description || '', scoring: meta.scoring, gates: { ...DEFAULT_GATES, ...(meta.gates || {}) }, stats: meta.stats || {},
      runs: files.filter(f => /\.csv$/i.test(f.name)).map(f => ({ file: `audits/${d.name}/${f.name}`, name: f.name, bytes: f.size,
        label: f.name.replace(/^results?[_-]/, '').replace(/\.csv$/i, '').replace(/_/g, ' '), baseline: /base|baseline|stock/i.test(f.name), ...((meta.runs || {})[f.name] || {}) })),
      docs: files.filter(f => /\.md$/i.test(f.name)).map(f => ({ file: `audits/${d.name}/${f.name}`, name: f.name, bytes: f.size,
        title: (meta.docs || {})[f.name] || f.name.replace(/\.md$/i, '').replace(/[_-]+/g, ' ') })) });
  }
  return { generated: null, countries };
}

// ═══════════════════════════════════════
// FETCH
// ═══════════════════════════════════════
async function fetchData(file) {
  if (cache[file]) return cache[file];
  const resp = await fetch(file);
  if (!resp.ok) throw new Error(`${file}: ${resp.status}`);
  cache[file] = parseCSV(await resp.text());
  return cache[file];
}

// ═══════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════
function initLangs() {
  $('langCount').textContent = manifest.countries.length;
  $('langList').innerHTML = manifest.countries.map(c =>
    `<div class="l-item ${c === country ? 'active' : ''}" data-k="${esc(c.key)}" title="${esc(c.language)}"><span class="flag">${c.flag}</span>${esc(c.name)}</div>`).join('');
  $('langList').querySelectorAll('.l-item').forEach(el => el.addEventListener('click', () => pickCountry(el.dataset.k)));
}
function modelId(run) { return run.name.replace(/\.csv$/i, ''); }
function modelName(run) { return run.model ? run.model.replace(/^Abyssal\//, '').replace(/:latest$/, '') : run.label; }
function modelTag(run) { return run.tag || (run.baseline ? 'Baseline' : run.primary ? 'Primary' : (run.label.match(/v\d+[a-z]?/i)?.[0] || 'Run')); }
function initSidebar() {
  models = country.runs.map(r => ({ id: modelId(r), name: modelName(r), tag: modelTag(r), f: r.file, run: r }));
  $('modelCount').textContent = models.length;
  $('modelList').innerHTML = models.length ? models.map(m =>
    `<div class="m-item ${m.id === selModel ? 'active' : ''}" data-id="${esc(m.id)}" title="${esc(m.run.label)}">
      <div class="m-dot ${m.run.baseline ? 'stock' : 'fine'}"></div>
      <span class="m-name">${esc(m.name)}</span>
      <span class="m-tag">${esc(m.tag)}</span>
    </div>`).join('') : `<div class="empty" style="height:auto;padding:20px"><p>No CSV files in <code>audits/${esc(country.key)}/</code> yet.</p></div>`;
  $('modelList').querySelectorAll('.m-item').forEach(el => el.addEventListener('click', () => pickModel(el.dataset.id)));
  renderFoot();
}
function renderFoot() {
  const s = country.stats || {}, parts = [];
  if (s.intents) parts.push(`${s.intents} intents`);
  if (s.domains) parts.push(`${s.domains} domains`);
  if (s.cases) parts.push(`${s.cases} cases`);
  if (s.calls) parts.push(`${Number(s.calls).toLocaleString()} calls/model`);
  $('foot').innerHTML = (parts.length ? parts.join(' &middot; ') : esc(country.language)) +
    `<br><span style="opacity:.7">${esc(country.language)}</span>` +
    (manifest.generated ? `<br><span style="opacity:.55">manifest ${new Date(manifest.generated).toLocaleDateString()}</span>` : '');
}

function pickCountry(key, keepHash) {
  const c = manifest.countries.find(x => x.key === key) || manifest.countries[0];
  if (!c) return;
  country = c; selModel = null; curData = []; filtData = []; cmpSel = new Set();
  initLangs(); initSidebar(); initCmpSel(); initDocs();
  $('cmpSub').textContent = `Select two or more ${c.name} models to compare side by side.`;
  $('cmpMet').innerHTML = ''; $('cmpDif').innerHTML = '';
  resetRaw();
  $('resBox').innerHTML = '<div class="empty"><div class="ico">&#9672;</div><h3>No model selected</h3><p>Select a model to view computed results.</p></div>';
  if (!keepHash) setHash();
}
function pickModel(id, keepHash) {
  selModel = id;
  document.querySelectorAll('.m-item').forEach(e => e.classList.toggle('active', e.dataset.id === id));
  loadRaw(id);
  if (!keepHash) setHash();
}

// ═══════════════════════════════════════
// TABS + HASH ROUTING  (#norway/model=<id>/tab=results/doc=<file>)
// ═══════════════════════════════════════
function currentTab() { const a = document.querySelector('.tab.active'); return a ? a.dataset.t : 'raw'; }
function showTab(v, keepHash) {
  document.querySelectorAll('.tab').forEach(e => e.classList.toggle('active', e.dataset.t === v));
  document.querySelectorAll('.tp').forEach(e => e.classList.toggle('on', e.id === 'p' + v.charAt(0).toUpperCase() + v.slice(1)));
  if (v === 'compare') initCmpSel();
  if (v === 'results' && selModel) renderResults(selModel);
  if (!keepHash) setHash();
}
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => showTab(t.dataset.t)));
function setHash() {
  const parts = [country?.key || ''];
  if (selModel) parts.push('model=' + encodeURIComponent(selModel));
  const tab = currentTab(); if (tab !== 'raw') parts.push('tab=' + tab);
  if (curDoc && tab === 'docs') parts.push('doc=' + encodeURIComponent(curDoc));
  const next = '#' + parts.join('/');
  if (location.hash !== next) history.replaceState(null, '', next);
}
function applyHash() {
  const [c, ...rest] = location.hash.replace(/^#\/?/, '').split('/');
  const q = Object.fromEntries(rest.map(kv => kv.split('=').map(decodeURIComponent)));
  if (!country || country.key !== c) pickCountry(c, true);
  if (q.tab) showTab(q.tab, true);
  if (q.doc) showDoc(q.doc, true);
  if (q.model && models.some(m => m.id === q.model) && selModel !== q.model) pickModel(q.model, true);
}
window.addEventListener('hashchange', applyHash);

// ═══════════════════════════════════════
// RAW DATA + VIRTUAL SCROLL
// ═══════════════════════════════════════
function resetRaw() {
  $('rEmpty').style.display = ''; $('rContent').style.display = 'none'; $('rLoad').style.display = 'none';
  $('rcount').textContent = '0 rows'; $('dlink').style.display = 'none';
}
function buildCols(h) {
  const present = new Set(h);
  const order = [...COLPREF.filter(k => present.has(k)), ...h.filter(k => !COLPREF.includes(k))].filter(k => !HIDE.has(k));
  cols = order.map(k => ({ k, l: k.replace(/_/g, ' ').replace(/\bms\b/, '(ms)'), w: COLW[k] || 110 }));
}
function renderHead() {
  $('rHead').innerHTML = cols.map(c => {
    const s = sortCol === c.k, a = s ? (sortDir === 1 ? '&#9650;' : '&#9660;') : '&#9661;';
    return `<th style="width:${c.w}px" class="${s ? 'sorted' : ''}" data-k="${esc(c.k)}">${esc(c.l)}<span class="arr">${a}</span></th>`;
  }).join('');
  $('rHead').querySelectorAll('th').forEach(th => th.addEventListener('click', () => doSort(th.dataset.k)));
}
function doSort(col) {
  if (sortCol === col) sortDir *= -1; else { sortCol = col; sortDir = 1; }
  applyFilter(); renderVS(); renderHead();
}
function applyFilter() {
  let d = curData;
  if (query) { const q = query.toLowerCase(); d = d.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q))); }
  if (sortCol) {
    d = [...d].sort((a, b) => { const va = a[sortCol], vb = b[sortCol]; const na = Number(va), nb = Number(vb);
      if (va !== '' && vb !== '' && !isNaN(na) && !isNaN(nb)) return (na - nb) * sortDir; return String(va).localeCompare(String(vb)) * sortDir; });
  }
  filtData = d;
  $('rcount').textContent = d.length.toLocaleString() + ' rows';
}
function onVsScroll() { requestAnimationFrame(renderVS); }
function renderVS() {
  if (!vsBody) return;
  const st = vsBody.scrollTop, vis = Math.ceil(vsBody.clientHeight / RH) + BUF, start = Math.max(0, Math.floor(st / RH) - BUF);
  const rows = filtData, end = Math.min(rows.length, start + vis);
  const totalW = cols.reduce((s, c) => s + c.w, 0);
  let html = `<table style="width:${totalW}px;min-width:100%;border-collapse:collapse;table-layout:fixed"><colgroup>${cols.map(c => `<col style="width:${c.w}px">`).join('')}</colgroup><tbody>`;
  if (start > 0) html += `<tr style="height:${start * RH}px"><td colspan="${cols.length}" style="padding:0;border:none"></td></tr>`;
  for (let i = start; i < end; i++) {
    const r = rows[i]; html += '<tr>';
    for (const c of cols) {
      const k = c.k, v = r[k] ?? ''; let cls = '';
      if (k === 'matched' || k === 'in_list') cls = T(v) ? 'mt' : 'mf';
      else if (k === 'correct') cls = T(v) ? 'ct' : 'cf';
      else if (k === 'latency_ms') cls = 'lat';
      const disp = k === 'latency_ms' ? (v ? Number(v).toFixed(0) + 'ms' : '') : v;
      html += `<td class="${cls}" title="${esc(v)}">${esc(disp)}</td>`;
    }
    html += '</tr>';
  }
  if (end < rows.length) html += `<tr style="height:${(rows.length - end) * RH}px"><td colspan="${cols.length}" style="padding:0;border:none"></td></tr>`;
  vsBody.innerHTML = html + '</tbody></table>';
  const hdrTable = $('rHead').closest('table'); hdrTable.style.width = totalW + 'px'; hdrTable.style.minWidth = '100%';
  $('rHead').closest('.raw-hdr').scrollLeft = vsBody.scrollLeft;
}
async function loadRaw(id) {
  const m = models.find(x => x.id === id); if (!m) return;
  $('rEmpty').style.display = 'none'; $('rContent').style.display = 'none';
  const ld = $('rLoad'); ld.style.display = 'flex';
  ld.innerHTML = `<div class="spinner"></div><div class="load-txt">Fetching audit data...</div><div class="load-sub">${esc(m.name)} &middot; ${esc(m.run.name)}</div>`;
  try {
    const d = await fetchData(m.f);
    if (selModel !== id) return;
    curData = d.r; buildCols(d.h);
    sortCol = null; sortDir = 1; query = ''; $('sbox').value = '';
    applyFilter(); renderHead();
    ld.style.display = 'none'; $('rContent').style.display = 'flex';
    const dl = $('dlink'); dl.href = m.f; dl.download = m.run.name; dl.style.display = ''; dl.title = `Download ${m.run.name} (${((m.run.bytes || 0) / 1e6).toFixed(1)} MB)`;
    vsBody = $('rBody');
    if (!vsScrollAttached) { vsBody.addEventListener('scroll', onVsScroll, { passive: true }); vsScrollAttached = true; }
    vsBody.scrollTop = 0; renderVS();
    if (currentTab() === 'results') renderResults(id);
  } catch (e) {
    ld.innerHTML = `<div class="empty"><div class="ico">&#9888;</div><h3>Failed to load</h3><p>${esc(e.message)}</p></div>`;
  }
}
$('sbox').addEventListener('input', e => { query = e.target.value; applyFilter(); if (vsBody) vsBody.scrollTop = 0; renderVS(); });
document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); $('sbox').focus(); } });

// ═══════════════════════════════════════
// METRICS
// ═══════════════════════════════════════
// Scoring mode. "refusal" (English family): on native_out the right behaviour is to
// ESCAPE the list (none_of_the_above) → correct = not in_list. "accept_bias" (Norwegian
// acv3): there is no refusal — native_out has no gold and is scored on in-list obedience.
function scoringMode(rows) {
  if (country?.scoring) return country.scoring;
  const no = rows.filter(r => r.variant === 'native_out');
  if (!no.length) return 'accept_bias';
  return no.some(r => r.expected && !/^(none|null)$/i.test(r.expected)) ? 'refusal' : 'accept_bias';
}
function metrics(rows) {
  const n = rows.length; if (!n) return null;
  const mode = scoringMode(rows);
  const bc = col => rows.filter(r => T(r[col])).length;
  const sorted = xs => xs.filter(x => !isNaN(x) && x > 0).sort((a, b) => a - b);
  const avg = a => a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
  const med = a => { if (!a.length) return 0; const m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
  const p95 = a => a.length ? a[Math.floor(a.length * .95)] : 0;
  const lat = sorted(rows.map(r => Number(r.latency_ms))), tok = rows.map(r => Number(r.tokens)).filter(x => !isNaN(x));
  const il = bc('in_list');
  const ok = r => r.variant === 'native_out' ? (mode === 'refusal' ? !T(r.in_list) : T(r.in_list)) : T(r.correct);
  const bv = {}, bvm = {}, bm = {};
  for (const v of VARS) {
    const s = rows.filter(r => r.variant === v), sc = s.filter(ok).length; bv[v] = { t: s.length, c: sc, a: s.length ? sc / s.length : null };
    for (const mo of MODES) { const sm = s.filter(r => r.mode === mo), scm = sm.filter(ok).length;
      bvm[v + '|' + mo] = { t: sm.length, c: scm, a: sm.length ? scm / sm.length : null, il: sm.length ? sm.filter(r => T(r.in_list)).length / sm.length : null, ml: med(sorted(sm.map(r => Number(r.latency_ms)))) }; }
  }
  for (const m of MODES) { const s = rows.filter(r => r.mode === m && INSC.has(r.variant)), sc = s.filter(r => T(r.correct)).length; bm[m] = { t: s.length, c: sc, a: s.length ? sc / s.length : null }; }
  const no = rows.filter(r => r.variant === 'native_out'), noFree = no.filter(r => r.mode === 'free');
  const rej = no.filter(r => !T(r.in_list)).length, noIl = noFree.filter(r => T(r.in_list)).length;
  const ins = rows.filter(r => INSC.has(r.variant)), inc = ins.filter(r => T(r.correct)).length, insIl = ins.filter(r => T(r.in_list)).length;
  return { n, mode, il, acc: rows.filter(ok).length / n, ir: il / n, al: avg(lat), ml: med(lat), pl: p95(lat), at: avg(tok),
    rr: no.length ? rej / no.length : null, not: no.length, noIl: noFree.length ? noIl / noFree.length : null, noFreeN: noFree.length,
    inn: ins.length, iacc: ins.length ? inc / ins.length : null, iir: ins.length ? insIl / ins.length : null,
    cst: bvm['custom_in|free']?.a ?? null, near: bvm['native_in_nearsyn|free']?.a ?? null, exact: bvm['exact|free']?.a ?? null,
    cases: new Set(rows.map(r => r.case_id)).size, msgs: new Set(rows.map(r => r.message)).size, intents: new Set(rows.map(r => r.gold).filter(Boolean)).size,
    bv, bvm, bm };
}
function gates(m) {
  const g = country.gates || DEFAULT_GATES, p = v => v == null ? null : v * 100;
  return [
    { k: 'inscope', l: 'In-scope accuracy', op: '>=', v: p(m.iacc) },
    { k: 'nearsyn_free', l: 'Near-syn trap (free)', op: '>=', v: p(m.near) },
    { k: 'custom_free', l: 'Invented names (free)', op: '>=', v: p(m.cst) },
    { k: 'exact_free', l: 'Exact probes (free)', op: '=', v: p(m.exact) },
    { k: 'in_list', l: 'In-list obedience', op: '=', v: p(m.ir) },
  ].filter(d => g[d.k] != null && d.v != null).map(d => ({ ...d, thr: +g[d.k], pass: d.op === '>=' ? d.v >= +g[d.k] - 1e-9 : Math.abs(d.v - +g[d.k]) < 0.05 }));
}

// ═══════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════
function renderResults(id) {
  const box = $('resBox'), m0 = models.find(x => x.id === id), d = m0 && cache[m0.f];
  if (!d) { box.innerHTML = '<div class="empty"><h3>Loading...</h3><p>Select the model in Raw Data tab first.</p></div>'; return; }
  const m = metrics(d.r); if (!m) { box.innerHTML = '<div class="empty"><h3>No data</h3></div>'; return; }
  const p = v => v == null ? '—' : (v * 100).toFixed(1) + '%', ms = v => v.toFixed(0) + 'ms';
  const bc = v => v == null ? 'var(--text-muted)' : v >= .9 ? 'var(--green)' : v >= .7 ? 'var(--yellow)' : 'var(--red)';
  const cl = v => v == null ? 'b' : v >= .9 ? 'g' : v >= .7 ? 'y' : 'r';
  const gs = gates(m), gPass = gs.filter(x => x.pass).length, accept = m.mode === 'accept_bias';
  const bar = (a) => `<td class="bcell"><div class="abar"><div class="abar-f" style="width:${(a || 0) * 100}%;background:${bc(a)}"></div></div></td>`;
  box.innerHTML = `
    <div class="res-hdr"><h2>${esc(m0.name)} ${gs.length ? `<span class="pill ${gPass === gs.length ? 'ok' : 'bad'}">${gPass}/${gs.length} gates</span>` : ''}</h2>
      <p>${m.n.toLocaleString()} calls &middot; ${m.cases.toLocaleString()} cases &middot; ${m.msgs.toLocaleString()} messages &middot; ${p(m.iacc)} in-scope accuracy &middot; ${accept ? p(m.noIl) + ' in-list when gold excluded' : p(m.rr) + ' rejection'}${m0.run.model ? ` &middot; <code style="color:var(--cyan)">${esc(m0.run.model)}</code>` : ''}</p></div>
    ${gs.length ? `<div class="gate-row">${gs.map(g => `<div class="gate ${g.pass ? 'ok' : 'bad'}"><span>${g.pass ? '&#10003;' : '&#10007;'}</span><span>${g.l}</span><span class="v">${g.v.toFixed(1)}%</span><span class="t">gate ${g.op} ${g.thr}%</span></div>`).join('')}</div>` : ''}
    <div class="mgrid">
      <div class="mcard"><div class="lb">In-Scope Accuracy</div><div class="vl ${cl(m.iacc)}">${p(m.iacc)}</div><div class="sb">${m.inn.toLocaleString()} calls where the gold intent was offered</div></div>
      ${accept
        ? `<div class="mcard"><div class="lb">Gold Excluded &rarr; In-List</div><div class="vl c">${p(m.noIl)}</div><div class="sb">picked the closest offered intent on ${m.noFreeN.toLocaleString()} accept-bias tests</div></div>`
        : `<div class="mcard"><div class="lb">Rejection Rate</div><div class="vl c">${p(m.rr)}</div><div class="sb">escaped the list on ${m.not.toLocaleString()} refusal tests</div></div>`}
      <div class="mcard"><div class="lb">Overall Accuracy</div><div class="vl ${cl(m.acc)}">${p(m.acc)}</div><div class="sb">${accept ? 'gold-excluded tests scored on in-list' : 'refusal tests scored strict'}</div></div>
      <div class="mcard"><div class="lb">Avg Latency</div><div class="vl b">${ms(m.al)}</div><div class="sb">median ${ms(m.ml)}</div></div>
      <div class="mcard"><div class="lb">P95 Latency</div><div class="vl b">${ms(m.pl)}</div><div class="sb">95th percentile</div></div>
      <div class="mcard"><div class="lb">Avg Tokens</div><div class="vl c">${m.at ? m.at.toFixed(1) : '—'}</div><div class="sb">per response</div></div>
      <div class="mcard"><div class="lb">Invented-Name Accuracy</div><div class="vl ${cl(m.cst)}">${p(m.cst)}</div><div class="sb">intents renamed to unseen labels (free)</div></div>
      <div class="mcard"><div class="lb">Near-Synonym Trap</div><div class="vl ${cl(m.near)}">${p(m.near)}</div><div class="sb">favourite look-alike label IS offered (free)</div></div>
      <div class="mcard"><div class="lb">In-List Obedience</div><div class="vl b">${p(m.ir)}</div><div class="sb">${p(m.iir)} across in-scope calls</div></div>
      <div class="mcard"><div class="lb">Total Calls</div><div class="vl g">${m.n.toLocaleString()}</div><div class="sb">${m.intents.toLocaleString()} intents &middot; ${m.cases.toLocaleString()} cases &times; variant &times; mode &times; draw</div></div>
    </div>
    <div class="stitle"><span class="ic">&#9672;</span> Accuracy by Variant <span class="note">${accept ? 'Native (Gold excluded) scores in-list obedience, not a pick' : 'Native (Refusal) scores an escape from the list, not a pick'}</span></div>
    <table class="btable"><thead><tr><th>Variant</th><th>Calls</th><th>Correct</th><th>Accuracy</th><th class="bcell">Visual</th></tr></thead><tbody>
    ${VARS.filter(v => m.bv[v].t).map(v => { const x = m.bv[v]; return `<tr><td style="font-weight:600">${VLBL[v]}</td><td>${x.t.toLocaleString()}</td><td>${x.c.toLocaleString()}</td><td style="font-variant-numeric:tabular-nums;font-weight:600;color:${bc(x.a)}">${p(x.a)}</td>${bar(x.a)}</tr>`; }).join('')}
    </tbody></table>
    <div class="stitle"><span class="ic">&#9672;</span> Variant &times; Mode <span class="note">free generation vs enum-constrained decoding</span></div>
    <table class="btable"><thead><tr><th>Variant</th><th>Mode</th><th>Calls</th><th>Top-1</th><th>In-list</th><th>Median</th><th class="bcell">Visual</th></tr></thead><tbody>
    ${VARS.flatMap(v => MODES.map(mo => { const x = m.bvm[v + '|' + mo]; if (!x?.t) return ''; return `<tr><td style="font-weight:600">${VLBL[v]}</td><td>${mo}</td><td>${x.t.toLocaleString()}</td><td style="font-variant-numeric:tabular-nums;font-weight:600;color:${bc(x.a)}">${p(x.a)}</td><td>${p(x.il)}</td><td class="lat">${ms(x.ml)}</td>${bar(x.a)}</tr>`; })).join('')}
    </tbody></table>
    <div class="stitle"><span class="ic">&#9672;</span> In-Scope Accuracy by Mode <span class="note">gold-excluded tests excluded</span></div>
    <table class="btable"><thead><tr><th>Mode</th><th>Calls</th><th>Correct</th><th>Accuracy</th><th class="bcell">Visual</th></tr></thead><tbody>
    ${MODES.filter(mo => m.bm[mo].t).map(mo => { const x = m.bm[mo]; return `<tr><td style="font-weight:600">${mo === 'free' ? 'Free Generation' : 'Enum (Constrained)'}</td><td>${x.t.toLocaleString()}</td><td>${x.c.toLocaleString()}</td><td style="font-variant-numeric:tabular-nums;font-weight:600;color:${bc(x.a)}">${p(x.a)}</td>${bar(x.a)}</tr>`; }).join('')}
    </tbody></table>`;
}

// ═══════════════════════════════════════
// COMPARE
// ═══════════════════════════════════════
function initCmpSel() {
  $('cmpSel').innerHTML = models.map(m => { const s = cmpSel.has(m.id);
    return `<div class="cmp-chip ${s ? 'sel' : ''}" data-id="${esc(m.id)}"><span class="cmp-chk">${s ? '&#10003;' : ''}</span>${esc(m.name)} <span style="opacity:.6;font-size:.65rem">${esc(m.tag)}</span></div>`; }).join('');
  $('cmpSel').querySelectorAll('.cmp-chip').forEach(el => el.addEventListener('click', () => togCmp(el.dataset.id)));
  $('cmpActs').style.display = cmpSel.size > 0 ? '' : 'none';
}
function togCmp(id) {
  if (cmpSel.has(id)) cmpSel.delete(id); else cmpSel.add(id);
  initCmpSel();
  const two = cmpSel.size === 2;
  $('bDif').disabled = !two;
  if (!two) cmpView('met');
  renderCmpMet();
}
function cmpView(v) {
  $('bMet').classList.toggle('on', v === 'met'); $('bDif').classList.toggle('on', v === 'dif');
  $('cmpMet').style.display = v === 'met' ? '' : 'none'; $('cmpDif').style.display = v === 'dif' ? '' : 'none';
  if (v === 'dif') renderDiff();
}
$('bMet').addEventListener('click', () => cmpView('met'));
$('bDif').addEventListener('click', () => cmpView('dif'));
async function renderCmpMet() {
  const box = $('cmpMet'); if (!cmpSel.size) { box.innerHTML = ''; return; }
  const ids = [...cmpSel];
  box.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted)"><div class="spinner" style="margin:0 auto 10px"></div>Loading...</div>';
  const ms = {};
  for (const id of ids) { const m = models.find(x => x.id === id); try { const d = await fetchData(m.f); cmpCache[id] = d; ms[id] = metrics(d.r); } catch (e) { ms[id] = null; } }
  const p = v => v != null ? (v * 100).toFixed(1) + '%' : '—', la = v => v != null ? v.toFixed(0) + 'ms' : '—';
  const hl = (vals, hi) => { const nv = vals.map(v => v != null ? v : (hi ? -Infinity : Infinity)); const best = hi ? Math.max(...nv) : Math.min(...nv), worst = hi ? Math.min(...nv) : Math.max(...nv);
    return vals.map(v => v == null ? '' : v === best && best !== worst ? 'best' : v === worst && best !== worst ? 'worst' : ''); };
  const accept = ids.some(id => ms[id]?.mode === 'accept_bias');
  const rows = [
    { l: 'Total Calls', k: 'n', f: v => v?.toLocaleString() || '—', h: null },
    { l: 'In-Scope Accuracy', k: 'iacc', f: p, h: true },
    accept ? { l: 'Gold excluded → in-list', k: 'noIl', f: p, h: true } : { l: 'Rejection Rate', k: 'rr', f: p, h: true },
    { l: 'Overall Accuracy', k: 'acc', f: p, h: true },
    { l: 'In-List Obedience', k: 'ir', f: p, h: true },
    { l: 'Gates passed', k: 'x', f: v => v ?? '—', h: null, gv: m => m ? `${gates(m).filter(g => g.pass).length}/${gates(m).length}` : null },
    { l: 'Avg Latency', k: 'al', f: la, h: false },
    { l: 'Median Latency', k: 'ml', f: la, h: false },
    { l: 'P95 Latency', k: 'pl', f: la, h: false },
    { l: 'Avg Tokens', k: 'at', f: v => v ? v.toFixed(1) : '—', h: null },
  ];
  for (const v of VARS) rows.push({ l: `Accuracy: ${VLBL[v]}`, k: 'x', f: p, h: true, gv: m => m?.bv?.[v]?.a ?? null });
  for (const mo of MODES) rows.push({ l: `In-scope accuracy: ${mo === 'free' ? 'Free Gen' : 'Enum'}`, k: 'x', f: p, h: true, gv: m => m?.bm?.[mo]?.a ?? null });
  let h = '<table class="ctbl"><thead><tr><th>Metric</th>' + ids.map(id => `<th>${esc(models.find(m => m.id === id)?.name || id)}</th>`).join('') + '</tr></thead><tbody>';
  for (const r of rows) {
    const vals = ids.map(id => r.gv ? r.gv(ms[id]) : ms[id]?.[r.k] ?? null);
    const cls = r.h != null ? hl(vals, r.h) : vals.map(() => '');
    h += `<tr><td class="ml">${r.l}</td>` + ids.map((_, i) => `<td class="${cls[i]}">${r.f(vals[i])}</td>`).join('') + '</tr>';
  }
  box.innerHTML = h + '</tbody></table>';
}

// ═══════════════════════════════════════
// DIFF VIEW
// ═══════════════════════════════════════
async function renderDiff() {
  const box = $('cmpDif'), ids = [...cmpSel];
  if (ids.length !== 2) { box.innerHTML = '<p style="color:var(--text-muted);padding:20px">Select exactly 2 models.</p>'; return; }
  box.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted)"><div class="spinner" style="margin:0 auto 10px"></div>Computing diff...</div>';
  for (const id of ids) { if (!cmpCache[id]) try { cmpCache[id] = await fetchData(models.find(m => m.id === id).f); } catch (e) { box.innerHTML = `<p style="color:var(--red);padding:20px">Failed: ${esc(e.message)}</p>`; return; } }
  const a = cmpCache[ids[0]].r, b = cmpCache[ids[1]].r;
  const rk = r => `${r.case_id}|${r.variant}|${r.mode}|${r.draw}`;
  const mA = new Map(a.map(r => [rk(r), r])), mB = new Map(b.map(r => [rk(r), r]));
  const diffs = [];
  for (const [k, ra] of mA) { const rb = mB.get(k); if (rb && (ra.output_norm !== rb.output_norm || ra.correct !== rb.correct)) diffs.push({ ra, rb }); }
  const oA = [...mA.keys()].filter(k => !mB.has(k)).length, oB = [...mB.keys()].filter(k => !mA.has(k)).length;
  const nA = models.find(m => m.id === ids[0])?.name || ids[0], nB = models.find(m => m.id === ids[1])?.name || ids[1];
  const dc = ['case_id', 'variant', 'mode', 'message', 'gold', 'output_norm', 'correct', 'in_list', 'latency_ms'];
  const pane = (key, label) => {
    let h = `<div class="diff-pane"><div class="diff-ph">${esc(label)}<span style="font-size:.68rem;color:var(--text-muted)">${diffs.length} diffs</span></div><table class="dtbl"><thead><tr>${dc.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>`;
    for (const d of diffs.slice(0, 500)) { const r = d[key]; h += '<tr>';
      for (const c of dc) { const v = r[c] || ''; const hlc = (c === 'output_norm' || c === 'correct') && d.ra.output_norm !== d.rb.output_norm ? 'dh' : '';
        h += `<td class="${hlc}" title="${esc(v)}">${esc(c === 'latency_ms' && v ? Number(v).toFixed(0) + 'ms' : v)}</td>`; }
      h += '</tr>'; }
    return h + '</tbody></table></div>';
  };
  box.innerHTML = `<div class="diff-sum"><div class="diff-st"><strong>${diffs.length.toLocaleString()}</strong> differing rows</div><div class="diff-st"><strong>${oA}</strong> only in ${esc(nA)}</div><div class="diff-st"><strong>${oB}</strong> only in ${esc(nB)}</div><div class="diff-st">out of <strong>${a.length.toLocaleString()}</strong> shared</div></div>
    <div class="diff-box">${pane('ra', nA)}${pane('rb', nB)}</div>
    ${diffs.length > 500 ? `<p style="text-align:center;color:var(--text-muted);padding:14px;font-size:.78rem">Showing 500 of ${diffs.length.toLocaleString()} differences</p>` : ''}`;
  const panes = box.querySelectorAll('.diff-pane'); let sync = false;
  panes.forEach((pn, i) => pn.addEventListener('scroll', () => { if (sync) return; sync = true; panes[i ? 0 : 1].scrollTop = pn.scrollTop; sync = false; }, { passive: true }));
}

// ═══════════════════════════════════════
// DOCS (Markdown from the language folder)
// ═══════════════════════════════════════
const mdCache = {};
function initDocs() {
  curDoc = null;
  const tabs = $('docTabs'), box = $('docBox');
  if (!country.docs.length) { tabs.innerHTML = ''; box.className = 'empty'; box.style = 'height:auto;padding:60px 20px'; box.innerHTML = '<div class="ico">&#9776;</div><h3>No documents</h3><p>Markdown files placed in the language folder (model cards, audit reports) render here.</p>'; return; }
  tabs.innerHTML = country.docs.map(d => `<button class="btn" data-f="${esc(d.name)}">${esc(d.title)}</button>`).join('');
  tabs.querySelectorAll('button').forEach(b => b.addEventListener('click', () => showDoc(b.dataset.f)));
  showDoc((country.docs.find(d => /model[_-]?card/i.test(d.name)) || country.docs[0]).name, true);
}
async function showDoc(name, keepHash) {
  const d = country.docs.find(x => x.name === name); if (!d) return;
  curDoc = name;
  $('docTabs').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.f === name));
  const box = $('docBox'); box.className = 'md'; box.style = ''; box.innerHTML = '<div style="color:var(--text-muted)">Loading…</div>';
  try {
    if (!mdCache[d.file]) { const r = await fetch(d.file); if (!r.ok) throw new Error(r.status); mdCache[d.file] = await r.text(); }
    box.innerHTML = DOMPurify.sanitize(marked.parse(mdCache[d.file], { gfm: true }));
  } catch (e) { box.innerHTML = `<p style="color:var(--red)">Could not load ${esc(d.file)} (${esc(e.message)})</p>`; }
  if (!keepHash) setHash();
}

// ═══════════════════════════════════════
// INIT
// ═══════════════════════════════════════
(async () => {
  try { manifest = await loadManifest(); }
  catch (e) { $('foot').textContent = 'Could not load manifest: ' + e.message; $('rEmpty').innerHTML = `<div class="ico">&#9888;</div><h3>No manifest</h3><p>${esc(e.message)}</p>`; return; }
  if (!manifest.countries?.length) { $('foot').textContent = 'No audits yet'; $('rEmpty').innerHTML = '<div class="ico">&#8862;</div><h3>No audits yet</h3><p>Create <code>audits/&lt;country&gt;/</code>, drop the CSV files in, push.</p>'; return; }
  applyHash();
  // Deep-link convenience: auto-load the primary model when none is selected
  if (!selModel && models.length) pickModel((models.find(m => m.run.primary) || models.find(m => !m.run.baseline) || models[0]).id, true);
})();
})();
