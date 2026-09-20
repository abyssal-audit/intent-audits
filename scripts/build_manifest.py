#!/usr/bin/env python3
"""Scan audits/<country>/ and write manifest.json.

Runs in GitHub Actions on every push (see .github/workflows/manifest.yml), so
adding a country is just: create audits/<country>/, drop CSV + Markdown files
(optionally a meta.json), push. The site reads manifest.json at start and
computes every metric client-side from the CSVs.

Zero third-party dependencies on purpose.
"""
import csv
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUDITS = ROOT / "audits"
OUT = ROOT / "manifest.json"

DEFAULT_GATES = {"inscope": 94, "nearsyn_free": 94, "custom_free": 88, "exact_free": 100, "in_list": 100}
FLAGS = {"norway": "🇳🇴", "denmark": "🇩🇰", "sweden": "🇸🇪", "finland": "🇫🇮", "iceland": "🇮🇸",
         "germany": "🇩🇪", "netherlands": "🇳🇱", "france": "🇫🇷", "spain": "🇪🇸", "italy": "🇮🇹",
         "uk": "🇬🇧", "england": "🇬🇧", "usa": "🇺🇸", "english": "🇬🇧", "poland": "🇵🇱"}
LANGS = {"norway": "Norwegian (bokmål · nynorsk)", "denmark": "Danish", "sweden": "Swedish",
         "finland": "Finnish", "iceland": "Icelandic", "germany": "German", "netherlands": "Dutch",
         "france": "French", "spain": "Spanish", "italy": "Italian", "uk": "English", "usa": "English",
         "english": "English", "poland": "Polish"}


def count_rows(p: Path):
    """Return (header, n_rows, stats) — stats = distinct cases / intents for the footer."""
    cases, intents, n = set(), set(), 0
    with open(p, encoding="utf-8", errors="replace", newline="") as f:
        r = csv.DictReader(f)
        header = r.fieldnames or []
        for row in r:
            n += 1
            if row.get("case_id"):
                cases.add(row["case_id"])
            if row.get("gold"):
                intents.add(row["gold"])
    return header, n, {"cases": len(cases), "intents": len(intents), "calls": n}


def guess_run(fname: str):
    """Derive a label / model hint / baseline flag from a results filename."""
    stem = Path(fname).stem
    base = bool(re.search(r"base|baseline|stock", stem, re.I))
    label = re.sub(r"^results?[_-]", "", stem).replace("_", " ")
    return {"label": label, "baseline": base}


def scan_country(d: Path):
    meta = {}
    mp = d / "meta.json"
    if mp.exists():
        with open(mp, encoding="utf-8") as f:
            meta = json.load(f)
    key = d.name.lower()
    runs, docs = [], []
    for p in sorted(d.iterdir()):
        if p.name.startswith(".") or p.name == "meta.json":
            continue
        rel = f"audits/{d.name}/{p.name}"
        if p.suffix.lower() == ".csv":
            header, n, st = count_rows(p)
            r = {"file": rel, "name": p.name, "rows": n, "bytes": p.stat().st_size, "columns": header, "stats": st}
            r.update(guess_run(p.name))
            r.update((meta.get("runs") or {}).get(p.name, {}))
            runs.append(r)
        elif p.suffix.lower() in (".md", ".markdown"):
            docs.append({"file": rel, "name": p.name, "bytes": p.stat().st_size,
                         "title": (meta.get("docs") or {}).get(p.name)
                         or re.sub(r"[_-]+", " ", p.stem).strip()})
    # Footer stats: from meta.json, else from the primary (or first non-baseline) run.
    primary = next((r for r in runs if r.get("primary")), None) or next((r for r in runs if not r.get("baseline")), None) or (runs[0] if runs else None)
    stats = {**(primary["stats"] if primary else {}), **(meta.get("stats") or {})}
    return {
        "scoring": meta.get("scoring"),   # "accept_bias" | "refusal" | None (auto-detect)
        "stats": stats,
        "key": d.name,
        "name": meta.get("name") or d.name.capitalize(),
        "language": meta.get("language") or LANGS.get(key, ""),
        "flag": meta.get("flag") or FLAGS.get(key, "🏳️"),
        "description": meta.get("description", ""),
        "gates": {**DEFAULT_GATES, **(meta.get("gates") or {})},
        "runs": runs,
        "docs": docs,
    }


def main():
    countries = [scan_country(d) for d in sorted(AUDITS.iterdir()) if d.is_dir() and not d.name.startswith(".")]
    manifest = {
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "countries": countries,
    }
    OUT.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"manifest.json: {len(countries)} countries, "
          f"{sum(len(c['runs']) for c in countries)} runs, {sum(len(c['docs']) for c in countries)} docs")
    return 0


if __name__ == "__main__":
    sys.exit(main())
