# Held-out comparison (Ollama, temperature 0)

| Set | n | Abyssal/intent-classifier-general-no-acv4:1.5b-b | Abyssal/intent-classifier-general-no-acv4:1.5b | Abyssal/intent-classifier-general-no-acv3:1.5b | Abyssal/intent-classifier-general-acv3:1.5b | qwen2.5:1.5b |
|---|---|---|---|---|---|---|
| massive_unseen | 412 | 93.9% (in-list 99.8%) | 93.0% (in-list 100.0%) | 93.7% (in-list 100.0%) | 89.6% (in-list 100.0%) | 68.4% (in-list 96.8%) |
| massive_seen | 609 | 93.1% (in-list 100.0%) | 92.6% (in-list 100.0%) | 93.3% (in-list 100.0%) | 82.4% (in-list 100.0%) | 64.7% (in-list 98.2%) |
| translated | 600 | 90.8% (in-list 100.0%) | 90.2% (in-list 100.0%) | 91.2% (in-list 100.0%) | 88.7% (in-list 100.0%) | 66.8% (in-list 99.2%) |
| fresh | 139 | 97.8% (in-list 100.0%) | 96.4% (in-list 100.0%) | 95.0% (in-list 100.0%) | 89.2% (in-list 99.3%) | 74.8% (in-list 96.4%) |
