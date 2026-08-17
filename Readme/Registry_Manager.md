# Smart LM Registry Manager

Open the manager through the `SmartLLM` application menu, the `LM Registry` sidebar launcher, or the classic-menu button. The modal can inspect, add, edit, download, verify, and remove entries for Transformers, GGUF, llama.cpp, Ollama, vLLM, native vLLM, SGLang, and WD14.

New entries are written to `registry/user_models.json`. Existing entries are edited in their runtime registry file; bundled `.defaults` files are never changed. Remote revisions are resolved to immutable commits before persistence. Local-only entries must remain below the configured LLM model root.

`Delete Local Files` and `Remove Registry Entry` are separate confirmed actions. Registry changes emit `smartllm:registry-changed`, refreshing both Smart LM Loader and Smart Detection choices.

All mutations use `/smartlml/...`, bounded object-only JSON, same-origin and multi-user checks, atomic persistence, and the idle-maintenance gate.
