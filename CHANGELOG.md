# Changelog

## 2026-08-29

### Version: 1.0.4

- **Feat**
  - Add a qualified Ollama runtime-version selector to Smart LM Manager's Docker Images tab. Installing a selected 0.33.1 or legacy-compatible 0.20.2 image persists its immutable vendor-specific pin and lets the existing container-spec check recreate Ollama on its next start without changing registry entries or deleting model data.
  - Add per-backend Stop controls for SmartLLM-managed Docker containers. Container shutdown reuses the server-side model-maintenance gate and returns a busy response instead of interrupting an active SmartLLM execution.

- **Fix**
  - Keep a Transformers VLM on its effective device for every mapped/list item and defer Keep Loaded off cleanup until the complete node execution finishes, preventing later prompts from sending CUDA token IDs into a prematurely CPU-offloaded embedding layer.
  - Preserve Ollama tensor-shape model-load failures as actionable installed-artifact incompatibility errors, including the rejected tensor and expected/actual dimensions, instead of replacing them with a misleading model-file-not-found diagnosis.

**Changed files:**
- `core/sml/backend_ollama_docker.py`
- `core/sml/docker_error_handler.py`
- `core/sml/docker_image_manager.py`
- `core/sml/docker_image_policy.py`
- `core/sml/server_endpoints.py`
- `core/sml/backend_transformers.py`
- `js/smartllm-registry-manager.js`
- `README.md`
- `Readme/Docker_Installation_Guide_Linux.md`
- `Readme/Smart_LM_Loader_Guide.md`
- `pyproject.toml`

## 2026-08-28

### Version: 1.0.3

- **Feat**
  - Add a Docker Images view to the Smart LM Manager with Docker Engine, daemon, group, and GPU readiness diagnostics; terminal-only Linux installer guidance; vendor-specific managed-image status; and guarded install, update, and removal controls that refuse images still used by containers.
  - Report Docker image installation and removal milestones in the ComfyUI console, with filtered pull progress and command details available at SmartLLM's debug log level.

- **Fix**
  - Update the qualified Ollama NVIDIA/CPU and ROCm fallback images from 0.20.2 to 0.33.1 so Qwen 3.8 models use a compatible backend.
  - Make the standalone Docker image manager pull Ollama's current release channel, detect the installed version and repository digest, and atomically record that immutable pin in SmartLLM's active Docker configuration.

**Changed files:**
- `.defaults/docker_config.json.example`
- `core/sml/docker_image_manager.py` (new)
- `core/sml/docker_image_policy.py`
- `core/sml/server_endpoints.py`
- `js/smartllm-registry-manager.js`
- `README.md`
- `scripts/manage-docker-images.sh`
- `pyproject.toml`

## 2026-08-22

### Version: 1.0.2

- **Feat**
  - **Configurable chip accent:** Add a SmartLLM-owned color picker that persists a validated hexadecimal accent in private `config.json` and applies derived hover, border, trigger, and contrast colors to chip bars and selected chips immediately.
  - **Aligned chip popovers:** Match Smart LM Loader and Smart Detection popup widths to their rendered chip bars without stretching or shrinking individual chips.

- **Fix**
  - Set the Smart LM Registry Editor and its model-download surface background to `#3a3a3a`.
  - Restore the configured chip-bar surface and interactive popup on Smart LM Loader and Smart Detection by keeping each widget's CSS prefix synchronized with its injected stylesheet in both Nodes 2.0 and classic renderers; also release deferred outside-click listeners whenever the popup closes.

**Changed files:**
- `.defaults/config.json.example`
- `.defaults/.manifest.json`
- `core/config_store.py`
- `core/sml/config_templates.py`
- `core/sml/server_endpoints.py`
- `js/smartllm-combo-chip.js`
- `js/smartllm-detection.js`
- `js/smartllm-loader.js`
- `js/smartllm-registry-manager.js`
- `js/smartllm-settings.js`
- `README.md`
- `pyproject.toml`

## 2026-08-19

### Version: 1.0.1

- **Refactor**
  - Move Smart LM Loader and Smart Detection from the Eclipse node menu into the pack-owned `Smart LM Loader → Loader` menu without changing their serialized IDs.
  - Move Detection to Bboxes and its conditional-widget frontend from Eclipse into the pack-owned `Smart LM Loader → Conversion` menu, preserving its data, mask, bbox, list, and workflow contracts.

- **Fix**
  - Extend the compatibility guard to reject an active Eclipse release that still registers Detection to Bboxes, preventing duplicate node and frontend ownership during partial upgrades.

- **Docs**
  - Replace the compact landing page with a Nodes 2.0 visual walkthrough covering Smart LM modes, multi-task chaining, WD14 tagging, Smart Detection, detection conversion, and Registry Manager model acquisition.
  - Clarify task-owned system prompts, optional `user_prompt` context, complete connected-system-prompt overrides, focused-part detection, Wan/LTX image-to-video prompting, and paste-ready song lyric generation.
  - Add the backend-specific copy-paste model registry reference transferred from Eclipse, aligned with the current YOLO `repo_id` schema and standard model directories.

**Changed files:**
- `core/compatibility.py`
- `core/keys.py`
- `js/smartllm-detection-to-bboxes.js` (new)
- `README.md`
- `Readme/assets/*.png` (new)
- `Readme/Smart_LM_Loader_Guide.md`
- `Readme/Smart_Detection_Guide.md`
- `Readme/Model_Repos_Reference_CP.md` (new)
- `py/RvConversion_DetectionToBboxes.py` (new)
- `pyproject.toml`

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
