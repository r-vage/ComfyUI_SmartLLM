# Changelog

## 2026-08-17

### Version: 1.0.0

- **Feat (New)**
  - Standalone Smart LM Loader and Smart Detection provider preserving the two `[Eclipse]` workflow node IDs, schemas, seed behavior, list semantics, and serialized widgets.
  - SmartLLM-owned Registry Manager, settings, frontend helpers, and `smartllm:registry-changed` refresh event.
  - Native, Transformers, GGUF, WD14, YOLO, Florence-2, vLLM, SGLang, Ollama, and llama.cpp infrastructure with verified acquisition and Docker isolation.
  - Atomic precedence-based migration from Eclipse and legacy SmartLML runtime data without moving model artifacts or transient state.

- **Fix**
  - Guard every backend-writing setting against ComfyUI's automatic first change callback while hydrating defaults and credential masks only from SmartLLM's redacted endpoint.

- **Refactor**
  - Present stable `SmartLLM.*` controls under the independent `Smart LM Loader → Configuration` category while retaining `ComfyUI_SmartLLM` package branding and `/smartlml` routes.
  - Upgrade migration markers atomically with value-free examined-key confirmation while preserving destination config precedence and hiding derived absolute model paths.

- **Docs**
  - Installation, migration, Registry Manager, Smart LM, Smart Detection, Docker, security, and third-party attribution guides.
  - Document independent Eclipse, Smart Model Loader, and Smart LM Loader settings and configuration ownership.

**Changed files:**
- `core/migration.py`
- `js/smartllm-settings.js`
- `README.md`
- `Readme/Migration.md`
