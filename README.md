# ComfyUI SmartLLM

ComfyUI SmartLLM is the standalone home of the Smart LM Loader, Smart Detection, and the Smart LM Registry Manager. Version 1.0.0 preserves the workflow-facing node IDs from Eclipse:

- `Smart LM Loader [Eclipse]`
- `Smart Detection [Eclipse]`

The pack registers exactly those two nodes. It owns the existing `/smartlml/...` API namespace and supports Transformers, native and Docker vLLM, SGLang, Ollama, llama.cpp, GGUF, WD14, YOLO, and Florence-2.

User-facing settings appear under **Smart LM Loader → Configuration** while
the repository/package name remains `ComfyUI_SmartLLM` and stable setting IDs
remain `SmartLLM.*`. SmartLLM exclusively owns its model path, retry policy,
log level, Hugging Face and ModelScope credentials, `/smartlml/config/...`
endpoints, and private `config.json`; its derived absolute model path remains
internal. These values are independent from the **Eclipse** and **Smart Model
Loader** settings categories regardless of installation or extension load
order.

## Installation

Clone this repository into `ComfyUI/custom_nodes/ComfyUI_SmartLLM`, then install the base requirements with ComfyUI's Python interpreter:

```bash
python -m pip install -r requirements.txt
```

Install compiled or backend-specific integrations only when needed:

```bash
python -m pip install -e ".[sml]"
```

Docker backends require Docker separately. See the [general Docker guide](Readme/Docker_Installation_Guide.md) or [Linux Docker guide](Readme/Docker_Installation_Guide_Linux.md).

## Migration and compatibility

On first startup, SmartLLM migrates runtime data before bundled defaults are created. Existing standalone data wins, followed by current Eclipse data, legacy `ComfyUI_SmartLML` data, and bundled defaults. Registry edits, user models, YOLO discovery state, few-shot files, system prompts, Docker mappings, model paths, retry policy, logging, and write-only credentials are preserved with atomic writes.

Migration never moves or deletes model artifacts, provenance sidecars, partial downloads, lock files, caches, or an existing `models/SmartLML` link. Eclipse integration nodes such as Detection to Bboxes, Get First/Last Image, preview culling, and seed nodes continue to consume the unchanged SmartLLM node outputs and IDs.

SmartLLM refuses to register if an active legacy SmartLML pack or an Eclipse version that still contains Smart LM is detected. Disable the older provider or update Eclipse, then restart ComfyUI.

## Documentation

- [Smart LM Loader guide](Readme/Smart_LM_Loader_Guide.md)
- [Smart Detection guide](Readme/Smart_Detection_Guide.md)
- [Registry Manager](Readme/Registry_Manager.md)
- [Model repository reference](Readme/Model_Repos_Reference_Links.md)
- [Security and model integrity](Readme/LLM_Security_Warning.md)
- [Migration details](Readme/Migration.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)

## Security defaults

Mutation routes remain POST-only, same-origin protected, limited to 16 KiB JSON objects, and loopback-only in ComfyUI multi-user mode. Credentials are write-only and stored with private permissions. Model acquisition uses immutable revisions, integrity verification, atomic commits, and provenance records. YOLO uses restricted loading, while Docker reuse is bound to immutable image and container-spec identity.

Licensed under Apache-2.0.
