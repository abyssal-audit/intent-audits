# Abyssal/intent-classifier-general-no-acv3

The Norwegian model in the family: routes bokmål, nynorsk and dialect to the single best-matching intent, defined at prompt time with no retraining. It always returns the best match, and refuses only if you add a catch-all intent.

## Recommended usage

Two modes, depending on whether you need out-of-scope detection.

**1. Routing (the normal case).** No catch-all, no `enum` — the model always answers with one of your intents. Across all 10,008 audit calls and every held-out set it never once produced a label outside the candidate list:

```
curl http://localhost:11434/api/chat -d '{
  "model": "Abyssal/intent-classifier-general-no-acv3:1.5b",
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
  "model": "Abyssal/intent-classifier-general-no-acv3:1.5b",
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

- **Write clear, specific descriptions — in Norwegian.** The model matches on the description, so this is the single biggest lever. Prefer `sporing: Brukeren vil vite hvor pakken er eller spore en forsendelse` over a terse `sporing: pakkestatus`.
- **Keep `temperature 0`** (the baked-in default) for deterministic, repeatable routing.
- **Use the exact prompt shape** shown above (`Candidate intents:` … `User message:` … `Answer with exactly one intent name from the list above.`) — it was trained on this format.
- **Names are free-form** — `snake_case`, `CamelCase`, hyphens, Norwegian compounds or plain words all work, including names the model has never seen; it matches by description and echoes your name verbatim.
- **Only add a catch-all when you actually need it.** Offering an escape hatch costs a few points of in-scope accuracy, because a model given one occasionally takes it.

## Under the hood

**Base:** LoRA fine-tune of **Qwen2.5-1.5B-Instruct** (Apache-2.0). Trained on the family's English acv3 corpus machine-translated to bokmål, native Norwegian utterances from MASSIVE, and a 128-intent / 16-domain Norwegian catalog — 13,100 distinct intents, each example presenting a different candidate list, ~50% of them renamed to invented names so the model matches on meaning rather than memorising label strings. All data, prompts and the baked-in system prompt are Norwegian (bokmål + nynorsk + informal/dialect). Runs at `temperature 0` and is fully deterministic.

no-acv3 keeps the never-refuse design of acv3: there is no `none_of_the_above`, so it always picks the best match from the list. The label side was trained explicitly — half the catalog examples keep their real Norwegian names, and a share of the translated examples are renamed to Norwegian compounds — so long names like `konto_gjenoppretting` are copied character-for-character.

**Accuracy:** — held-out benchmarks first. Neither set was used in training, and both use intents the model has never seen: MASSIVE is real human-written Norwegian across 60 assistant intents; the translated set is 1,166 messages over unseen customer-service intents. In-scope accuracy is **92.2%** on unseen Norwegian.

| Benchmark (unseen intents and messages) | stock qwen2.5:1.5b | English acv3 | this model |
| --- | --- | --- | --- |
| MASSIVE nb-NO (n=615) | 64.2% | 83.9% | **92.2%** |
| Translated acv3, unseen intents (n=600) | 65.5% | 89.8% | **91.5%** |
| Fresh hand-written messages, near-synonym offered (n=57) | — | — | 94.7% |

**In-list obedience is 100.0% on every set** — it never produced a token outside the offered list, including the 926 audit calls where the gold intent was deliberately left out.

**Catalog audit (in-distribution):** 10,008 calls, temperature 0, the 128-intent / 16-domain Norwegian taxonomy the model was tuned for (940 messages, bokmål + nynorsk + dialect). The catalog's intents and seed phrasings are part of the training set, so this measures how well the model serves *that* taxonomy — not generalisation. In-scope accuracy is 99.5%.

| Usage | Free-gen acc | In-list | Enum-constrained acc | In-list |
| --- | --- | --- | --- | --- |
| In-taxonomy names, gold offered | 99.5% | 100% | 99.5% | 100% |
| + near-synonym trap | 99.5% | 100% | 99.6% | 100% |
| Invented / custom names | 99.5% | 100% | 99.4% | 100% |
| Exact-phrase probes | 100% | 100% | 100% | 100% |

## no-acv3 vs the English acv3 vs stock qwen

| Metric | no-acv3 | English acv3 | stock qwen2.5:1.5b |
| --- | --- | --- | --- |
| Unseen Norwegian, in-scope (MASSIVE) | **92.2%** | 83.9% | 64.2% |
| Unseen intents, in-scope (translated acv3) | **91.5%** | 89.8% | 65.5% |
| Catalog audit, in-scope (in-distribution) | **99.5%** | 94.3% | 84.2% |
| Catalog audit, near-synonym trap (free) | **99.5%** | 95.4% | 85.6% |
| Catalog audit, invented / custom names (free) | **99.5%** | 96.2% | 77.1% |
| Exact probes (free) | **100%** | 91.7% | 97.2% |
| In-list obedience | **100.0%** | 99.9% | 98.0–99.1% |
| Rejection rate (out-of-scope) | opt-in | opt-in | 2.7% (accidental) |
| Avg latency | ~0.51 s | ~0.51 s | ~0.36 s |

no-acv3 leads every accuracy row. The English acv3 already reads Norwegian well — it reaches 94.3% on the catalog audit with no Norwegian training — so the fair measure of the Norwegian fine-tune is the **+8.3 points on real human Norwegian** (MASSIVE) and the exact copying of Norwegian compound names (+8.3 on exact probes), where the English model stumbles on words like `konto_gjenoppretting`. Stock qwen keeps only speed. The remaining misses are genuine ambiguities (“lommeboka er borte, sperr alt” — lost card or fraud report).

**Every number here is reproducible.** All three models are scored on the same catalog audit — 10,008 calls each, 128 intents across 16 domains, same prompts and descriptions. Raw per-call results, computed metrics and a row-level diff: [audit dashboard](https://abyssal-audit.github.io/intent-audits/#norway)

**Good for:** routing Norwegian support tickets, chatbot intent detection, message tagging, triage — fast, local, fully customizable intents, for any workload where every message must land in exactly one bucket.

**License:** Apache-2.0 (base). ~3.1 GB, fits an 8 GB GPU.
