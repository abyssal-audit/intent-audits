/* Abyssal intent-classifier audits — static, fully client-side.
 * Reads manifest.json (built by CI from audits/<country>/), then computes
 * every metric from the raw per-call CSVs in the browser. Falls back to the
 * GitHub contents API if manifest.json is missing (e.g. a folder was pushed
 * before the workflow ran). */
(() => {
  "use strict";

  // ---------- generic helpers ----------
  const $ = (sel, el = document) => el.querySelector(sel);
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if (k === "class") el.className = v;
      else if (k === "html") el.innerHTML = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    for (const kid of kids.flat()) if (kid != null) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pct = (a, b, d = 1) => (b ? (100 * a / b).toFixed(d) + "%" : "–");
  const num = (a, b) => (b ? 100 * a / b : NaN);
  const truthy = (v) => /^(true|1|yes|y)$/i.test(String(v ?? "").trim());
  const fmtBytes = (n) => n > 1e6 ? (n / 1e6).toFixed(1) + " MB" : n > 1e3 ? (n / 1e3).toFixed(0) + " kB" : n + " B";
  const median = (xs) => { if (!xs.length) return NaN; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

  // ---------- metric model (mirrors no/scripts/score_audit_no.py) ----------
  // Variants where the gold intent is offered → "in-scope" accuracy pool.
  const INSCOPE = new Set(["exact", "native_in_random", "native_in_nearsyn", "custom_in"]);
  const VARIANT_LABEL = {
    exact: "Exact-phrase probes (adversarial traps)",
    native_in_random: "In-taxonomy names, gold offered",
    native_in_nearsyn: "+ forced near-synonym trap",
    native_out: "Gold excluded — picks closest (in-list)",
    custom_in: "Invented / custom names",
  };
  const GATE_DEFS = [
    { key: "inscope", label: "In-scope accuracy", op: ">=", get: (m) => m.inscope },
    { key: "nearsyn_free", label: "Near-synonym trap (free)", op: ">=", get: (m) => m.cell("native_in_nearsyn", "free") },
    { key: "custom_free", label: "Invented names (free)", op: ">=", get: (m) => m.cell("custom_in", "free") },
    { key: "exact_free", label: "Exact probes (free)", op: "=", get: (m) => m.cell("exact", "free") },
    { key: "in_list", label: "In-list obedience (all calls)", op: "=", get: (m) => m.inList },
  ];

  function computeMetrics(rows) {
    const col = (r, k) => r[k] ?? "";
    const variants = [...new Set(rows.map((r) => col(r, "variant")))];
    const modes = [...new Set(rows.map((r) => col(r, "mode")))].filter(Boolean);
    const order = ["exact", "native_in_random", "native_in_nearsyn", "native_out", "custom_in"];
    const ix = (v) => { const i = order.indexOf(v); return i < 0 ? 99 : i; };
    variants.sort((a, b) => ix(a) - ix(b) || a.localeCompare(b));
    const cells = {};
    for (const v of variants) for (const mo of modes) {
      const rr = rows.filter((r) => col(r, "variant") === v && col(r, "mode") === mo);
      cells[v + "|" + mo] = {
        n: rr.length,
        acc: num(rr.filter((r) => truthy(col(r, "correct"))).length, rr.length),
        inList: num(rr.filter((r) => truthy(col(r, "in_list"))).length, rr.length),
        latency: median(rr.map((r) => +col(r, "latency_ms")).filter((x) => x > 0)),
      };
    }
    const insc = rows.filter((r) => INSCOPE.has(col(r, "variant")));
    const nOut = rows.filter((r) => col(r, "variant") === "native_out" && col(r, "mode") === "free");
    const misses = rows.filter((r) => INSCOPE.has(col(r, "variant")) && !truthy(col(r, "correct")));
    const escapes = rows.filter((r) => !truthy(col(r, "in_list")));
    return {
      rows: rows.length, variants, modes, cells,
      cell: (v, mo) => cells[v + "|" + mo]?.acc ?? NaN,
      inscope: num(insc.filter((r) => truthy(col(r, "correct"))).length, insc.length),
      inscopeN: insc.length,
      inList: num(rows.filter((r) => truthy(col(r, "in_list"))).length, rows.length),
      nativeOutInList: num(nOut.filter((r) => truthy(col(r, "in_list"))).length, nOut.length),
      latency: median(rows.filter((r) => col(r, "mode") === "free").map((r) => +col(r, "latency_ms")).filter((x) => x > 0)),
      messages: new Set(rows.map((r) => col(r, "message"))).size,
      misses, escapes,
    };
  }
  function gateResults(m, gates) {
    return GATE_DEFS.filter((g) => gates[g.key] != null).map((g) => {
      const val = g.get(m), thr = +gates[g.key];
      const pass = Number.isFinite(val) && (g.op === ">=" ? val >= thr - 1e-9 : Math.abs(val - thr) < 0.05);
      return { ...g, val, thr, pass };
    });
  }

  // ---------- data loading ----------
  const csvCache = new Map();
  async function loadCsv(file) {
    if (csvCache.has(file)) return csvCache.get(file);
    const p = new Promise((resolve, reject) => {
      Papa.parse(file, { download: true, header: true, skipEmptyLines: true, worker: false,
        complete: (res) => resolve(res.data), error: reject });
    });
    csvCache.set(file, p);
    return p;
  }
  const mdCache = new Map();
  async function loadMd(file) {
    if (!mdCache.has(file)) mdCache.set(file, fetch(file).then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); }));
    return mdCache.get(file);
  }

  // GitHub API fallback: derive owner/repo from *.github.io/<repo>/ URL.
  async function manifestFromGitHub() {
    const m = location.hostname.match(/^([^.]+)\.github\.io$/);
    const repo = location.pathname.split("/").filter(Boolean)[0];
    if (!m || !repo) throw new Error("not on github pages");
    const api = `https://api.github.com/repos/${m[1]}/${repo}/contents/audits`;
    const dirs = await (await fetch(api)).json();
    if (!Array.isArray(dirs)) throw new Error("api");
    const countries = [];
    for (const d of dirs.filter((x) => x.type === "dir")) {
      const files = await (await fetch(d.url)).json();
      let meta = {};
      const mf = files.find((f) => f.name === "meta.json");
      if (mf) { try { meta = await (await fetch(mf.download_url)).json(); } catch { /* ignore */ } }
      countries.push({
        key: d.name, name: meta.name || d.name[0].toUpperCase() + d.name.slice(1), language: meta.language || "",
        flag: meta.flag || "🏳️", description: meta.description || "",
        gates: { inscope: 94, nearsyn_free: 94, custom_free: 88, exact_free: 100, in_list: 100, ...(meta.gates || {}) },
        runs: files.filter((f) => /\.csv$/i.test(f.name)).map((f) => ({
          file: `audits/${d.name}/${f.name}`, name: f.name, bytes: f.size, rows: null,
          label: f.name.replace(/^results?[_-]/, "").replace(/\.csv$/i, "").replace(/_/g, " "),
          baseline: /base|baseline|stock/i.test(f.name), ...((meta.runs || {})[f.name] || {}) })),
        docs: files.filter((f) => /\.md$/i.test(f.name)).map((f) => ({
          file: `audits/${d.name}/${f.name}`, name: f.name, bytes: f.size,
          title: (meta.docs || {})[f.name] || f.name.replace(/\.md$/i, "").replace(/[_-]+/g, " ") })),
      });
    }
    return { generated: null, countries, fromApi: true };
  }
  async function loadManifest() {
    try {
      const r = await fetch("manifest.json", { cache: "no-cache" });
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } catch (e) {
      return manifestFromGitHub();
    }
  }

  // ---------- routing ----------
  const state = { manifest: null, country: null, run: null, doc: null, view: "overview" };
  function parseHash() {
    const [c, ...rest] = location.hash.replace(/^#\/?/, "").split("/");
    const q = Object.fromEntries(rest.map((kv) => kv.split("=").map(decodeURIComponent)));
    return { country: c || null, run: q.run || null, doc: q.doc || null };
  }
  function setHash(country, run, doc) {
    const parts = [country];
    if (run) parts.push("run=" + encodeURIComponent(run));
    if (doc) parts.push("doc=" + encodeURIComponent(doc));
    const next = "#" + parts.join("/");
    if (location.hash !== next) history.replaceState(null, "", next);
  }

  // ---------- rendering ----------
  const app = $("#app"), nav = $("#nav");

  function renderNav() {
    nav.replaceChildren(...state.manifest.countries.map((c) =>
      h("a", { href: "#" + c.key, class: c.key === state.country?.key ? "active" : "" }, `${c.flag} ${c.name}`)));
  }

  function metricTile(k, v, d, cls) {
    return h("div", { class: "tile" }, h("div", { class: "k" }, k), h("div", { class: "v " + (cls || "") }, v), d ? h("div", { class: "d" }, d) : null);
  }

  async function renderCountry(c) {
    renderNav();
    app.replaceChildren(
      h("section", { class: "hero" },
        h("h1", {}, `${c.flag} ${c.name}`, h("span", { class: "lang" }, c.language)),
        h("p", { class: "sub" }, c.description || `${c.runs.length} audit run(s), ${c.docs.length} document(s).`)),
      h("div", { id: "tiles", class: "grid" }, h("div", { class: "empty" }, h("span", { class: "spinner" }), "Computing metrics from ", c.runs.length, " CSV file(s)…")),
      h("div", { id: "runs" }), h("div", { id: "detail" }), h("div", { id: "docs" }));

    if (!c.runs.length) {
      $("#tiles").replaceChildren(h("div", { class: "empty" }, "No CSV audit files in audits/", c.key, "/ yet."));
    }
    // Load all runs in parallel, compute metrics.
    const results = await Promise.all(c.runs.map(async (r) => {
      try { return { run: r, m: computeMetrics(await loadCsv(r.file)) }; }
      catch (e) { return { run: r, error: e }; }
    }));
    if (state.country !== c) return; // navigated away
    const good = results.filter((x) => x.m);
    const primary = good.find((x) => x.run.primary) || good.filter((x) => !x.run.baseline).sort((a, b) => b.m.inscope - a.m.inscope)[0] || good[0];
    const baseline = good.find((x) => x.run.baseline && x !== primary);

    // Tiles (headline = primary run)
    if (primary) {
      const m = primary.m, g = gateResults(m, c.gates), passed = g.filter((x) => x.pass).length;
      const d = (v) => baseline && Number.isFinite(v) ? v : null;
      const delta = (a, b) => Number.isFinite(b) ? h("span", { class: "delta " + (a - b >= 0 ? "up" : "down") }, (a - b >= 0 ? "+" : "") + (a - b).toFixed(1) + " vs baseline") : null;
      $("#tiles").replaceChildren(
        metricTile("In-scope accuracy", pct(m.inscope, 100), h("span", {}, m.inscopeN.toLocaleString(), " calls ", delta(m.inscope, baseline?.m.inscope))),
        metricTile("Near-synonym trap", pct(m.cell("native_in_nearsyn", "free"), 100), h("span", {}, "free generation ", delta(m.cell("native_in_nearsyn", "free"), baseline?.m.cell("native_in_nearsyn", "free")))),
        metricTile("Invented names", pct(m.cell("custom_in", "free"), 100), h("span", {}, "free generation ", delta(m.cell("custom_in", "free"), baseline?.m.cell("custom_in", "free")))),
        metricTile("In-list obedience", pct(m.inList, 100), `${m.rows.toLocaleString()} calls`),
        metricTile("Gates", `${passed}/${g.length}`, passed === g.length ? "all passed" : g.filter((x) => !x.pass).map((x) => x.label).join(", "), passed === g.length ? "" : ""),
        metricTile("Median latency", Number.isFinite(m.latency) ? (m.latency / 1000).toFixed(2) + " s" : "–", "free mode"));
    }

    // Runs comparison table
    const cols = [["Run", null], ["Model", null], ["Calls", "rows"], ["Messages", "messages"], ["In-scope", "inscope"],
      ["Rand free", "native_in_random|free"], ["Near-syn free", "native_in_nearsyn|free"], ["Custom free", "custom_in|free"],
      ["Exact free", "exact|free"], ["Enum acc", "enum"], ["In-list", "inList"], ["Out→in-list", "nativeOutInList"], ["Latency", "latency"], ["Gates", "gates"]];
    const tbl = h("table", {}, h("thead", {}, h("tr", {}, ...cols.map(([t]) => h("th", {}, t)))),
      h("tbody", {}, ...results.map((x) => {
        const r = x.run;
        if (!x.m) return h("tr", {}, h("td", {}, r.label), h("td", { colspan: cols.length - 1, class: "small" }, "could not load: ", String(x.error)));
        const m = x.m, g = gateResults(m, c.gates), passed = g.filter((y) => y.pass).length;
        const enumAcc = (() => { const rr = m.variants.filter((v) => INSCOPE.has(v)).map((v) => m.cells[v + "|enum"]).filter(Boolean); const n = rr.reduce((s, y) => s + y.n, 0); return n ? rr.reduce((s, y) => s + y.acc * y.n, 0) / n : NaN; })();
        const tr = h("tr", { class: "clickable " + (x === primary ? "primary " : "") + (state.run === r.name ? "selected" : ""), onclick: () => selectRun(c, r.name) },
          h("td", {}, r.label, " ", r.baseline ? h("span", { class: "badge neutral" }, "baseline") : x === primary ? h("span", { class: "badge ok" }, "primary") : null),
          h("td", { class: "mono small" }, r.model || "—"),
          h("td", {}, m.rows.toLocaleString()), h("td", {}, m.messages.toLocaleString()),
          h("td", {}, pct(m.inscope, 100)), h("td", {}, pct(m.cell("native_in_random", "free"), 100)),
          h("td", {}, pct(m.cell("native_in_nearsyn", "free"), 100)), h("td", {}, pct(m.cell("custom_in", "free"), 100)),
          h("td", {}, pct(m.cell("exact", "free"), 100)), h("td", {}, pct(enumAcc, 100)),
          h("td", {}, pct(m.inList, 100)), h("td", {}, pct(m.nativeOutInList, 100)),
          h("td", {}, Number.isFinite(m.latency) ? (m.latency / 1000).toFixed(2) + " s" : "–"),
          h("td", {}, h("span", { class: "badge " + (passed === g.length ? "ok" : passed >= g.length - 1 ? "warn" : "bad") }, `${passed}/${g.length}`)));
        return tr;
      })));
    $("#runs").replaceChildren(h("div", { class: "card" },
      h("h2", {}, "Audit runs", h("span", { class: "hint" }, "click a run for the full breakdown · metrics computed live from the CSV")),
      h("div", { class: "tablewrap" }, tbl)));

    // Bars: primary vs baseline per variant (free)
    if (primary) {
      const bars = h("div", { class: "bars" });
      for (const v of primary.m.variants) {
        const isOut = v === "native_out";
        const val = isOut ? primary.m.cells[v + "|free"]?.inList : primary.m.cells[v + "|free"]?.acc;
        const bval = isOut ? baseline?.m.cells[v + "|free"]?.inList : baseline?.m.cells[v + "|free"]?.acc;
        if (!Number.isFinite(val)) continue;
        const gateKey = { native_in_nearsyn: "nearsyn_free", custom_in: "custom_free", exact: "exact_free" }[v];
        const gate = gateKey ? c.gates[gateKey] : null;
        bars.append(h("div", { class: "bar" }, h("div", {}, VARIANT_LABEL[v] || v), h("div", { class: "track" }, h("div", { class: "fill", style: `width:${val}%` }), gate != null ? h("div", { class: "gate", style: `left:${gate}%`, title: `gate ${gate}%` }) : null), h("div", { class: "n" }, val.toFixed(1) + "%")));
        if (Number.isFinite(bval)) bars.append(h("div", { class: "bar base" }, h("div", { class: "small" }, "↳ " + (baseline.run.model || baseline.run.label)), h("div", { class: "track" }, h("div", { class: "fill", style: `width:${bval}%` })), h("div", { class: "n" }, bval.toFixed(1) + "%")));
      }
      $("#runs").append(h("div", { class: "card" }, h("h2", {}, `${primary.run.label}`, h("span", { class: "hint" }, baseline ? `vs ${baseline.run.label} · free generation · orange tick = gate` : "free generation · orange tick = gate")), h("div", { class: "body" }, bars)));
    }

    // Detail for selected run (default: primary)
    const sel = c.runs.find((r) => r.name === state.run) || primary?.run;
    if (sel) await renderRunDetail(c, sel, results.find((x) => x.run === sel)?.m);
    renderDocs(c);
  }

  function selectRun(c, name) {
    state.run = name; setHash(c.key, name, state.doc);
    document.querySelectorAll("#runs tr.clickable").forEach((tr) => tr.classList.toggle("selected", tr.firstChild.textContent.startsWith(c.runs.find((r) => r.name === name)?.label || " ")));
    renderRunDetail(c, c.runs.find((r) => r.name === name));
    $("#detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function renderRunDetail(c, run, m) {
    const box = $("#detail"); if (!box) return;
    box.replaceChildren(h("div", { class: "card" }, h("h2", {}, run.label), h("div", { class: "empty" }, h("span", { class: "spinner" }), "Loading…")));
    m = m || computeMetrics(await loadCsv(run.file));
    if (state.country !== c) return;
    const g = gateResults(m, c.gates);
    // variant × mode table
    const vt = h("table", {}, h("thead", {}, h("tr", {}, h("th", {}, "Variant"), h("th", {}, "Mode"), h("th", {}, "N"), h("th", {}, "Top-1"), h("th", {}, "In-list"), h("th", {}, "Median ms"))),
      h("tbody", {}, ...m.variants.flatMap((v) => m.modes.map((mo) => { const ce = m.cells[v + "|" + mo]; if (!ce?.n) return null;
        return h("tr", {}, h("td", {}, VARIANT_LABEL[v] || v, " ", h("code", { class: "small" }, v)), h("td", {}, mo), h("td", {}, ce.n.toLocaleString()),
          h("td", {}, v === "native_out" ? "—" : pct(ce.acc, 100)), h("td", {}, pct(ce.inList, 100)), h("td", {}, Number.isFinite(ce.latency) ? Math.round(ce.latency) : "–")); }))));
    // misses explorer
    const variantsWithMisses = [...new Set(m.misses.map((r) => r.variant))];
    const search = h("input", { type: "search", placeholder: "filter misses (message, gold, prediction)…" });
    const vsel = h("select", {}, h("option", { value: "" }, "all variants"), ...variantsWithMisses.map((v) => h("option", { value: v }, v)));
    const msel = h("select", {}, h("option", { value: "" }, "all modes"), ...m.modes.map((v) => h("option", { value: v }, v)));
    const list = h("tbody");
    const count = h("span", { class: "hint" });
    const renderMisses = () => {
      const q = search.value.trim().toLowerCase();
      const rows = m.misses.filter((r) => (!vsel.value || r.variant === vsel.value) && (!msel.value || r.mode === msel.value) &&
        (!q || [r.message, r.gold, r.output_norm, r.output_raw].some((x) => String(x ?? "").toLowerCase().includes(q))));
      count.textContent = `${rows.length.toLocaleString()} of ${m.misses.length.toLocaleString()} misses (in-scope variants)`;
      list.replaceChildren(...rows.slice(0, 500).map((r) => h("tr", {},
        h("td", { class: "small" }, r.variant, h("br"), h("span", { class: "badge neutral" }, r.mode)),
        h("td", { class: "msg" }, r.message),
        h("td", {}, h("code", {}, r.gold ?? r.expected)),
        h("td", {}, h("code", { class: truthy(r.in_list) ? "" : "bad" }, r.output_norm || r.output_raw), truthy(r.in_list) ? null : h("span", { class: "badge bad", style: "margin-left:6px" }, "not in list")),
        h("td", { class: "small msg" }, String(r.candidates ?? "").split("|").join(" · ")))));
      if (rows.length > 500) list.append(h("tr", {}, h("td", { colspan: 5, class: "small" }, `… ${rows.length - 500} more (refine the filter)`)));
    };
    [search, vsel, msel].forEach((el) => el.addEventListener("input", renderMisses)); renderMisses();
    box.replaceChildren(
      h("div", { class: "card" },
        h("h2", {}, run.label, run.model ? h("code", { class: "small" }, run.model) : null, h("span", { class: "hint" }, `${m.rows.toLocaleString()} calls · ${m.messages.toLocaleString()} distinct messages · `, h("a", { href: run.file, download: run.name }, "download CSV"), ` (${fmtBytes(run.bytes || 0)})`)),
        h("div", { class: "body" },
          h("div", { class: "gates" }, ...g.map((x) => h("div", { class: "g " + (x.pass ? "ok" : "bad") }, h("span", {}, x.pass ? "✔" : "✘"), h("span", {}, x.label), h("b", {}, pct(x.val, 100)), h("span", { class: "small" }, `gate ${x.op} ${x.thr}%`)))),
          h("div", { class: "tablewrap", style: "margin-top:14px" }, vt))),
      h("div", { class: "card" },
        h("h2", {}, "Misses", count),
        h("div", { class: "body" }, h("div", { class: "toolbar" }, search, vsel, msel),
          m.misses.length ? h("div", { class: "tablewrap" }, h("table", {}, h("thead", {}, h("tr", {}, h("th", {}, "Variant"), h("th", {}, "Message"), h("th", {}, "Gold"), h("th", {}, "Predicted"), h("th", {}, "Candidates"))), list)) : h("div", { class: "empty" }, "No misses. 🎉"))));
  }

  function renderDocs(c) {
    const box = $("#docs"); if (!box || !c.docs.length) return;
    const tabs = h("div", { class: "tabs" }), body = h("div", { class: "md" });
    const show = async (d) => {
      state.doc = d.name; setHash(c.key, state.run, d.name);
      tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.f === d.name));
      body.replaceChildren(h("div", { class: "empty" }, h("span", { class: "spinner" }), "Loading…"));
      try {
        const md = await loadMd(d.file);
        body.innerHTML = DOMPurify.sanitize(marked.parse(md, { gfm: true, breaks: false }));
      } catch (e) { body.replaceChildren(h("div", { class: "empty" }, "Could not load ", d.file)); }
    };
    for (const d of c.docs) tabs.append(h("button", { "data-f": d.name, onclick: () => show(d) }, d.title));
    box.replaceChildren(h("div", { class: "card" }, h("h2", {}, "Reports & model cards", h("span", { class: "hint" }, "rendered from the Markdown files in the folder")), tabs, body));
    show(c.docs.find((d) => d.name === state.doc) || c.docs.find((d) => /model_card/i.test(d.name)) || c.docs[0]);
  }

  function renderHome() {
    renderNav();
    const cs = state.manifest.countries;
    app.replaceChildren(
      h("section", { class: "hero" }, h("h1", {}, "Intent-classifier audits"),
        h("p", { class: "sub" }, "Per-language audits and model cards for the Abyssal intent-classifier family. Every number on this site is computed in your browser from the raw per-call CSV — nothing is precomputed, nothing is hand-edited.")),
      h("div", { class: "grid" }, ...cs.map((c) => h("a", { class: "tile", href: "#" + c.key, style: "text-decoration:none;color:inherit" },
        h("div", { class: "v" }, `${c.flag} ${c.name}`), h("div", { class: "k" }, c.language), h("div", { class: "d" }, `${c.runs.length} run(s) · ${c.docs.length} doc(s)`)))),
      howTo());
  }

  function howTo() {
    return h("div", { class: "card" }, h("h2", {}, "Adding a language"), h("div", { class: "body" },
      h("p", {}, "Create ", h("code", {}, "audits/<country>/"), " and drop in the per-call CSV(s) from the audit harness plus any Markdown reports or model cards. Push. The workflow rebuilds ", h("code", {}, "manifest.json"), " and the folder appears in the navigation — no code changes."),
      h("pre", {}, `audits/
  norway/                     ← 🇳🇴 shown today
  denmark/                    ← add this folder and it just shows up
    meta.json                 (optional: name, flag, language, gates, run labels)
    results_10k_da-acv3.csv   any *.csv with variant, mode, correct, in_list, latency_ms columns
    results_10k_baseline.csv  name it *baseline* to mark it as the reference model
    MODEL_CARD_da-acv3.md     any *.md is rendered as a tab`),
      h("p", { class: "small" }, "Country name, flag and language are inferred from the folder name for common countries; ", h("code", {}, "meta.json"), " overrides everything. CSV columns used: ", h("code", {}, "variant, mode, correct, in_list, latency_ms, message, gold, output_norm, candidates"), ".")));
  }

  async function route() {
    const { country, run, doc } = parseHash();
    const c = state.manifest.countries.find((x) => x.key === country);
    state.run = run; state.doc = doc;
    if (!c) { state.country = null; renderHome(); return; }
    state.country = c; await renderCountry(c);
  }

  (async () => {
    try { state.manifest = await loadManifest(); }
    catch (e) { app.replaceChildren(h("div", { class: "empty" }, "Could not load manifest.json (", String(e), ")")); return; }
    if (!state.manifest.countries?.length) { app.replaceChildren(h("div", { class: "empty" }, "No audits yet."), howTo()); return; }
    if (!location.hash && state.manifest.countries.length === 1) history.replaceState(null, "", "#" + state.manifest.countries[0].key);
    window.addEventListener("hashchange", route);
    await route();
    const gen = state.manifest.generated ? new Date(state.manifest.generated).toLocaleString() : "live from GitHub API";
    app.append(h("footer", {}, `Manifest built ${gen}. Source and raw data: this repository. Metrics follow `, h("code", {}, "score_audit_no.py"), " (in-scope = correct answers over exact + in-taxonomy + near-synonym + invented-name calls, both modes)."));
  })();
})();
