# Abyssal/intent-classifier-general-no-acv3

The Norwegian sibling of the family: never refuses, routes bokmål, nynorsk and dialect to the single best-matching intent, defined at prompt time with no retraining. Refusal is opt-in via a catch-all intent.

## Recommended usage

Two modes, depending on whether you need out-of-scope detection.

**1. Routing (the normal case).** No catch-all, no `enum` — the model always answers with one of your intents, as a bare name. Across all 10,008 audit calls it stayed inside the candidate list on **100%**:

```
curl http://localhost:11434/api/chat -d '{
  "model": "Abyssal/intent-classifier-general-no-acv3:1.5b",
  "stream": false,
  "options": {"temperature": 0},
  "messages": [{"role": "user", "content":
    "Candidate intents:\nsporing: Brukeren vil vite hvor pakken eller forsendelsen er, sporingsnummer eller om pakken er sendt\nrefusjon: Brukeren vil ha pengene tilbake for et kjøp, få refundert eller reversert en betaling\nkonto: Brukeren spør om kontoen sin\n\nUser message: Hvor er pakken min?\n\nAnswer with exactly one intent name from the list above."
  }]
}'
# -> sporing
```

Want the answer as a JSON string instead? Add a JSON-schema `enum` in `format` — `"format": {"type": "string", "enum": ["sporing", "refusjon", "konto"]}` — which also grammar-constrains decoding so the answer structurally cannot leave your list. Or append `Return the intent name as a JSON string.` to the prompt for a quoted `"sporing"` without the grammar. Both were trained; enum-constrained accuracy matches free generation (99.4–100%).

**2. Out-of-scope detection (opt-in).** Append a catch-all intent and treat that answer as “no match”. Any wording works — `other`, `misc`, `something_else`, `not_listed`, `general_inquiry`:

```
curl http://localhost:11434/api/chat -d '{
  "model": "Abyssal/intent-classifier-general-no-acv3:1.5b",
  "stream": false,
  "options": {"temperature": 0},
  "messages": [{"role": "user", "content":
    "Candidate intents:\nsporing: Brukeren vil vite hvor pakken eller forsendelsen er, sporingsnummer eller om pakken er sendt\nrefusjon: Brukeren vil ha pengene tilbake for et kjøp, få refundert eller reversert en betaling\nother: anything that does not match the other intents\n\nUser message: Når stenger dere på søndager?\n\nAnswer with exactly one intent name from the list above."
  }]
}'
# -> other
```

Remove that `other` line and the same message returns the closest available match.

## Getting the best results

- **Write clear, specific descriptions — in Norwegian.** The model matches on the description, so this is the single biggest lever. Prefer `sporing: Brukeren vil vite hvor pakken er, sporingsnummer eller om pakken er sendt` over a terse `sporing: pakkestatus`. If two intents are neighbours (`refusjon` / `defekt_vare`), say in the description which one owns the overlap.
- **Keep `temperature 0`** (the baked-in default) for deterministic, repeatable routing.
- **Use the exact prompt shape** shown above (`Candidate intents:` … `User message:` … `Answer with exactly one intent name from the list above.`) — it was trained on this format.
- **Names are free-form** — `snake_case`, `CamelCase`, hyphens, Norwegian compounds (`konto_gjenoppretting`) or plain words all work, including names the model has never seen; it matches by description and echoes your name verbatim (99.5% on invented names, 100% in-list).
- **Only add a catch-all when you actually need it.** Offering an escape hatch costs a few points of in-scope accuracy, because a model given one occasionally takes it.

## Under the hood

**Base:** LoRA fine-tune of **Qwen2.5-1.5B-Instruct** (Apache-2.0) — QLoRA 4-bit, r=32/α=64, 2 epochs + a short low-LR continuation, cosine schedule, answer-tokens-only loss. All data, prompts and the baked-in system prompt are Norwegian (bokmål + nynorsk + informal/dialect). Training mix, 51.8k rows with **13.1k distinct labels**: the English acv3 corpus machine-translated to bokmål (the diversity that makes the skill general), native nb-NO utterances from MASSIVE, and a 128-intent / 16-domain Norwegian catalog. Half the catalog rows keep their real Norwegian names and the rest are renamed to invented labels, so the model both copies real compound names exactly and matches on meaning rather than memorising label strings. There is no `none_of_the_above`, ever — accept-bias: always pick the best match from the list. Runs at `temperature 0` and is fully deterministic.

**Accuracy** — 10,008 calls, temperature 0, a 128-intent / 16-domain Norwegian taxonomy (940 messages: 674 catalog seeds + 266 audit-only register variants). In-scope accuracy is **99.5%**, beating stock `qwen2.5:1.5b` on the identical audit (84.2%) by **+15.3 points**.

| Usage | Free-gen acc | In-list | Enum-constrained acc | In-list |
| --- | --- | --- | --- | --- |
| In-taxonomy names, gold offered (N=1880) | 99.5% | 100% | 99.5% | 100% |
| + near-synonym trap (N=745) | 99.5% | 100% | 99.6% | 100% |
| Invented / custom names (N=1880) | 99.5% | 100% | 99.4% | 100% |
| Exact-phrase probes, incl. adversarial traps (N=36) | 100% | 100% | 100% | 100% |
| Gold excluded — picks closest (N=926) | — | 100% | — | — |

**Held-out, no overlap with training.** 595 of the 940 audit messages (6,264 calls) never appear in any training file: in-scope **99.4%**, near-synonym trap **99.3%**, invented names **99.5%**, in-list **100%** — indistinguishable from the seen half, so the score is generalisation, not recall. On unrelated held-out taxonomies the model has never seen (translated acv3 eval, MASSIVE nb-NO) it scores 90.5% / 93.2% top-1 with 100% in-list. The remaining audit misses are genuine ambiguities in the corpus (“Kan jeg sjekke inn tidlig?” — hotel or flight).

## no-acv3 vs stock qwen (same Norwegian audit, same prompts)

| Metric | no-acv3 | stock qwen2.5:1.5b |
| --- | --- | --- |
| In-scope accuracy | **99.5%** | 84.2% |
| Free-gen accuracy, gold offered | **99.5%** | 88.8% |
| Near-synonym trap (free) | **99.5%** | 85.6% |
| Invented / custom names (free) | **99.5%** | 77.1% |
| In-list obedience (all 10,008 calls) | **100%** | 99.1% |
| Exact probes (free) | **100%** | 97.2% |
| Median latency (free, RTX 3070) | ~0.50 s | ~0.35 s |

The fine-tune wins everywhere — most dramatically on invented names (+22.4), the skill the recipe trains, and on the near-synonym trap (+13.9). The one thing stock qwen keeps is speed: it answers ~30% faster because it emits shorter, unconstrained output.

> **Note on comparing with the English family.** These numbers come from the **Norwegian 10,008-call / 128-intent / 16-domain** audit (bokmål + nynorsk + dialect). The English siblings are scored on the **6,076-call / 243-intent / 22-domain** corpus, and the two are not comparable — different language, different taxonomy, tighter adversarial probes here. Use the table above when ranking no-acv3 against stock qwen.
>
> **Every number here is reproducible.** Same 10,008 calls against both models. Raw per-call results and scoring code: `no/scripts/run_audit_no.py --profile-10k` (`no/output/results_no_10k_v3b.csv`, `AUDIT_REPORT_NO_10K_V3B.md`; baseline `no/output/results_no_10k_base_v2desc.csv`, `AUDIT_REPORT_NO_10K_BASE_V2DESC.md`).

**Good for:** routing Norwegian support tickets, chatbot intent detection, message tagging, triage — fast, local, fully customizable intents, for any workload where every message must land in exactly one bucket.

**License:** Apache-2.0 (base). ~3.1 GB, fits an 8 GB GPU.
