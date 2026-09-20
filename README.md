# Abyssal · Intent-classifier audits

Static GitHub Pages site with per-language audits and model cards for the
Abyssal intent-classifier family. **Live:** https://abyssal-audit.github.io/intent-audits/

Every metric on the site is computed **in the browser from the raw per-call CSVs** —
nothing is precomputed or hand-edited, so the page cannot drift from the data.

## Adding a language

```
audits/
  norway/                      🇳🇴 today
  denmark/                     ← create the folder, push, done
    meta.json                  optional: name, flag, language, description, gates, run labels
    results_10k_da-acv3.csv    per-call CSV(s) from the audit harness
    results_10k_baseline.csv   a file named *baseline*/*base*/*stock* is shown as the reference model
    MODEL_CARD_da-acv3.md      every *.md is rendered as a tab
```

On push, `.github/workflows/manifest.yml` runs `scripts/build_manifest.py`, which scans
`audits/*/`, writes `manifest.json`, and deploys Pages. If someone opens the site
before the workflow finished, the page falls back to the GitHub contents API and lists
the folders live.

### CSV contract

Columns used (the audit harness writes all of them): `variant`, `mode`, `correct`,
`in_list`, `latency_ms`, `message`, `gold`, `output_norm`, `candidates`.
Variants: `exact`, `native_in_random`, `native_in_nearsyn`, `native_out`, `custom_in`.
Modes: `free`, `enum`. In-scope accuracy = correct over the four gold-offered variants,
both modes (identical to `score_audit_no.py`).

### meta.json (optional)

```json
{
  "name": "Denmark", "flag": "🇩🇰", "language": "Danish",
  "description": "…",
  "gates": {"inscope": 94, "nearsyn_free": 94, "custom_free": 88, "exact_free": 100, "in_list": 100},
  "runs":  {"results_10k_da-acv3.csv": {"label": "da-acv3 · 10k", "model": "Abyssal/…:1.5b", "primary": true},
            "results_10k_baseline.csv": {"label": "stock qwen2.5:1.5b", "model": "qwen2.5:1.5b", "baseline": true}},
  "docs":  {"MODEL_CARD_da-acv3.md": "Model card · da-acv3"}
}
```

Missing fields are inferred from folder and file names.

## Local preview

```
python scripts/build_manifest.py
python -m http.server 8080   # open http://localhost:8080/
```
