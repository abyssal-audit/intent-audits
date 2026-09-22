# Held-out comparison (Ollama, temperature 0)

| Set | n | Abyssal/intent-classifier-general-no-acv5:1.7b-candidate | Abyssal/intent-classifier-general-no-acv4:1.5b | Abyssal/intent-classifier-general-no-acv3:1.5b | Abyssal/intent-classifier-general-acv3:1.5b | qwen2.5:1.5b |
|---|---|---|---|---|---|---|
| massive_unseen | 412 | 92.5% (in-list 99.8%) | 94.4% (in-list 99.8%) | 93.9% (in-list 100.0%) | 87.9% (in-list 100.0%) | 67.5% (in-list 96.6%) |
| massive_seen | 609 | 93.4% (in-list 100.0%) | 93.3% (in-list 100.0%) | 92.4% (in-list 100.0%) | 84.7% (in-list 100.0%) | 58.6% (in-list 97.5%) |
| translated | 600 | 90.5% (in-list 100.0%) | 89.0% (in-list 100.0%) | 89.7% (in-list 100.0%) | 87.7% (in-list 100.0%) | 66.0% (in-list 99.7%) |
| fresh | 258 | 96.5% (in-list 100.0%) | 95.0% (in-list 100.0%) | 94.2% (in-list 100.0%) | 91.9% (in-list 99.2%) | 77.9% (in-list 96.9%) |
