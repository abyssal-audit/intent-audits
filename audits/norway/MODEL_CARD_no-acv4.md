# Abyssal/intent-classifier-general-no-acv4

The most accurate Norwegian model in the family, and the best at telling lookalike intents apart. Define intents at prompt time, no retraining. It always returns the single best match, and refuses only if you add a catch-all intent.

## Recommended usage

Two modes, depending on whether you need out-of-scope detection.

**1. Routing (the normal case).** No catch-all, no `enum` — the model always answers with one of your intents. Across 10,008 audit calls and every held-out set it never once produced a label outside the candidate list:

```
curl http://localhost:11434/api/chat -d '{
  "model": "Abyssal/intent-classifier-general-no-acv4:1.5b",
  "stream": false,
  "options": {"temperature": 0},
  "messages": [{"role": "user", "content":
    "Candidate intents:\nsporing: Brukeren vil vite hvor pakken er eller spore en forsendelse\nrefusjon: Brukeren vil ha pengene tilbake for et kjøp\nkonto: Brukeren spør om kontoen sin\n\nUser message: Hvor er pakken min?\n\nAnswer with exactly one intent name from the list above."
  }]
}'
# -> sporing
```

Add a JSON-schema `enum` in `format` if you want decoding itself grammar-constrained: `"format": {"type": "string", "enum": ["sporing", "refusjon", "konto"]}`. Enum-constrained accuracy matches free generation on this model.

**2. Out-of-scope detection (opt-in).** Append a catch-all intent and treat that answer as “no match”. Any wording works — `other`, `misc`, `something_else`, `not_listed`, `general_inquiry`:

```
curl http://localhost:11434/api/chat -d '{
  "model": "Abyssal/intent-classifier-general-no-acv4:1.5b",
  "stream": false,
  "options": {"temperature": 0},
  "messages": [{"role": "user", "content":
    "Candidate intents:\nsporing: Brukeren vil vite hvor pakken er eller spore en forsendelse\nrefusjon: Brukeren vil ha pengene tilbake for et kjøp\nother: anything that does not match the other intents\n\nUser message: Når stenger dere på søndager?\n\nAnswer with exactly one intent name from the list above."
  }]
}'
# -> other
```

Remove that `other` line and the same message returns `sporing` — the closest available match.

## Getting the best results

- **Write clear, specific descriptions — in Norwegian.** The model matches on the description, so this is the single biggest lever. Prefer `sporing: Brukeren vil vite hvor pakken er eller spore en forsendelse` over a terse `sporing: pakkestatus` — though acv4 was trained on terse descriptions too and degrades gracefully.
- **Keep `temperature 0`** (the baked-in default) for deterministic, repeatable routing.
- **Use the exact prompt shape** shown above (`Candidate intents:` … `User message:` … `Answer with exactly one intent name from the list above.`) — it was trained on this format.
- **Names are free-form** — `snake_case`, `CamelCase`, hyphens, Norwegian compounds or plain words all work, including names the model has never seen; it matches by description and echoes your name verbatim.
- **Only add a catch-all when you actually need it.** Offering an escape hatch costs a few points of in-scope accuracy, because a model given one occasionally takes it.

## Under the hood

**Base:** LoRA fine-tune of **Qwen2.5-1.5B-Instruct** (Apache-2.0), continued from no-acv3. Trained on the family's English acv3 corpus machine-translated to bokmål, native Norwegian utterances from MASSIVE, and a 128-intent / 16-domain Norwegian catalog — each example presenting a different candidate list, ~50% of them renamed to invented names so the model matches on meaning rather than memorising label strings. All data, prompts and the baked-in system prompt are Norwegian (bokmål + nynorsk + informal/dialect). Runs at `temperature 0` and is fully deterministic.

no-acv4 adds contrastive hard-pair training, the same idea as the English acv3: 192 confusable intent pairs were mined from the training taxonomy and a local 35B model wrote 5,211 Norwegian messages that belong to one side and clearly not the other; a second pass by the same model as judge rejected 619 that leaked or were ambiguous, leaving 4,592. Pairs come from the training taxonomy only, never from the audit, so this is a transferable skill rather than benchmark fitting. Two smaller fixes ride along: truncated and near-duplicate descriptions inherited from the English corpus were cleaned out of the training rows, and 20% of examples show deliberately terse descriptions so brief real-world intent lists still route well.

**Accuracy:** — held-out benchmarks first. No message in any set was used in training. The hand-written set is 139 Norwegian customer messages written after training, each offered with its nearest lookalike intent; MASSIVE is real human-written Norwegian, with 12 of its 60 intents held out of training entirely; the translated set covers intents the model has never seen. All models below see identical prompts.

| Benchmark (held-out) | stock qwen2.5:1.5b | English acv3 | no-acv3 | this model |
| --- | --- | --- | --- | --- |
| Hand-written, near-synonym offered (n=139) | 74.8% | 89.2% | 95.0% | **97.8%** |
| MASSIVE nb-NO, 12 unseen intents (n=412) | 68.4% | 89.6% | 93.7%* | **93.9%** |
| MASSIVE nb-NO, seen intents, unseen messages (n=609) | 64.7% | 82.4% | **93.3%** | 93.1% |
| Translated acv3, unseen intents (n=600) | 66.8% | 88.7% | **91.2%** | 90.8% |

\* no-acv3 trained on these 12 intents; no-acv4 did not, and still matches it.

On the hand-written set no-acv4 fixes four of no-acv3's seven misses and breaks none — all four are lookalike pairs (fraud report vs lost card, deductible vs quote, car insurance vs quote, food-delivery discount vs shop discount), exactly what the contrastive data targets. On MASSIVE and the translated set the two models tie: the remaining misses are shared and are mostly label noise in the source data (“syv hundre” labelled as a time-zone conversion), so those sets are at their ceiling.

**In-list obedience is 100.0% on every set** — it never produced a token outside the offered list, including the 926 audit calls where the gold intent was deliberately left out.

**Catalog audit (in-distribution):** 10,008 calls, temperature 0, the 128-intent / 16-domain Norwegian taxonomy the model was tuned for (940 messages, bokmål + nynorsk + dialect). The catalog's intents and seed phrasings are part of the training set, so this measures how well the model serves *that* taxonomy — not generalisation. In-scope accuracy is 99.6%.

| Usage | Free-gen acc | In-list | Enum-constrained acc | In-list |
| --- | --- | --- | --- | --- |
| In-taxonomy names, gold offered | 99.6% | 100% | 99.7% | 100% |
| + near-synonym trap | 99.5% | 100% | 99.5% | 100% |
| Invented / custom names | 99.7% | 100% | 99.7% | 100% |
| Exact-phrase probes | 100% | 100% | 100% | 100% |

## no-acv4 vs no-acv3 vs the English acv3 vs stock qwen

| Metric | no-acv4 | no-acv3 | English acv3 | stock qwen2.5:1.5b |
| --- | --- | --- | --- | --- |
| Hand-written, near-synonym offered | **97.8%** | 95.0% | 89.2% | 74.8% |
| Native Norwegian, unseen intents (MASSIVE) | **93.9%** | 93.7% | 89.6% | 68.4% |
| Native Norwegian, held-out messages (MASSIVE) | 93.1% | **93.3%** | 82.4% | 64.7% |
| Unseen intents (translated acv3) | 90.8% | **91.2%** | 88.7% | 66.8% |
| Catalog audit, in-scope (in-distribution) | 99.6% | 99.5% | 94.3% | 84.2% |
| Exact probes (free) | **100%** | **100%** | 91.7% | 97.2% |
| In-list obedience | **100.0%** | **100.0%** | 99.9% | 96.4–99.2% |
| Rejection rate (out-of-scope) | opt-in | opt-in | opt-in | 2.7% (accidental) |
| Avg latency | ~0.51 s | ~0.51 s | ~0.51 s | ~0.36 s |

no-acv4 is a strict upgrade over no-acv3: same never-refuse design, same perfect in-list obedience, and better discrimination on lookalike intents (+2.8 on the hand-written near-synonym test, with no regressions), while tying everywhere the data is at its ceiling. Use no-acv3 only if you need a bit-identical reproduction of earlier results.

**Every number here is reproducible.** All four models are scored on the same held-out sets and the same catalog audit — 10,008 calls each, 128 intents across 16 domains, same prompts and descriptions. Raw per-call results, computed metrics and a row-level diff: [audit dashboard](https://abyssal-audit.github.io/intent-audits/#norway)

**Good for:** routing Norwegian support tickets, chatbot intent detection, message tagging, triage — fast, local, fully customizable intents, for any workload where every message must land in exactly one bucket.

**License:** Apache-2.0 (base). ~3.1 GB, fits an 8 GB GPU.
