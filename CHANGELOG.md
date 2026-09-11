# Changelog

## 2026-09-11

### Version: 1.0.16

- **Fix**
  - Keep Linux Docker auto-start privilege-free by trying only the rootless user service, directing system-service setup to the existing guide instead of invoking or generating privileged commands.

- **Docs**
  - Remove the recursive Docker/containerd system-data deletion command from the Linux uninstall guide and direct intentional full cleanup to Docker's distribution-specific documentation.

- **Chore**
  - Remove the built-in software updater and its server endpoints, leaving SmartLLM upgrades to ComfyUI Manager or explicit repository/package-management workflows.

**Changed files:**
- `Readme/Docker_Installation_Guide_Linux.md`
- `core/self_update.py`
- `core/sml/docker_image_manager.py`
- `core/sml/docker_utils.py`
- `core/sml/server_endpoints.py`
- `js/smartllm-self-update.js`
- `js/smartllm-registry-manager.js`
- `pyproject.toml`

## 2026-09-11

### Version: 1.0.15

- **Fix**
  - Let WD14 honor its established CPU fallback when CUDA is requested but ONNX Runtime does not expose `CUDAExecutionProvider`, warning about the effective provider instead of aborting before model load.

**Changed files:**
- `core/sml/backend_wd14.py`
- `pyproject.toml`

## 2026-09-11

### Version: 1.0.14

- **Fix**
  - Remove five Anzhc YOLO artifacts explicitly marked unsafe by Hugging Face from bundled downloads and provenance; upgrade cleanup retires stale remote entries while preserving already-downloaded files as local-only models protected by restricted loading.

**Changed files:**
- `.defaults/.manifest.json`
- `.defaults/registry/yolo_models.json.example`
- `core/sml/model_registry.py`
- `pyproject.toml`

## 2026-09-11

### Version: 1.0.13

- **Fix**
  - Keep shipped YOLO registry models selectable before their artifacts exist locally, allowing Smart Detection to invoke the existing pinned, hash-verified automatic download path while continuing to hide missing local-only discoveries.
  - Show YOLO models in Smart LM Manager with safe add, edit, inspect, download, verify, delete, and registry-removal support, including dedicated checkpoint filename and bbox/segm fields.
  - Replace vague restricted-loader guidance with the exact supported Ultralytics `>=8.4.67,<8.5` and PyTorch `>=2.6` requirements, detected installed versions, and an interpreter-specific Ultralytics upgrade command.

**Changed files:**
- `core/sml/backend_yolo.py`
- `core/sml/model_acquisition.py`
- `core/sml/model_registry.py`
- `core/sml/server_endpoints.py`
- `js/smartllm-registry-manager.js`
- `pyproject.toml`

## 2026-09-09

### Version: 1.0.12

- **Feat**
  - Turn an empty `user_prompt` on the duration-neutral MiniMax H3 Scene task into an automatic one-shot story: create an original scene without images, ground it in one image, or connect two ordered endpoints, with synchronized sound, suitable music, and dialogue only when plausible.

- **Compat**
  - Remove `5s` and `15s` from all visible MiniMax H3 task names while preserving retired names as hidden backend and frontend aliases, migrating saved widget values, runtime system prompts, and customized few-shot entries without breaking older workflows or API prompts.
  - Keep explicit timeline generation planned within MiniMax H3's 15-second maximum, and use the same ceiling when automatic story pacing needs a duration bound.

- **Docs**
  - Document duration-neutral H3 task selection, automatic empty-prompt storytelling, custom-system-prompt behavior, and the distinction between automatic story music and explicit no-music requests.

**Changed files:**
- `.defaults/config/llm_few_shot_training.json.example`
- `.defaults/config/llm_few_shot_training_nsfw.json.example`
- `.defaults/config/system_prompts.json.example`
- `README.md`
- `Readme/Smart_LM_Loader_Guide.md`
- `core/migration.py`
- `core/sml/config_templates.py`
- `core/sml/tasks.py`
- `js/smartllm-loader.js`
- `js/smartllm-task-compat.js`
- `py/RvLoader_SmartLMLoader.py`
- `pyproject.toml`

## 2026-09-09

### Version: 1.0.11

- **Fix**
  - Apply a shared MiniMax H3 music-intent policy across every backend and task mode so explicit requests for no background music, score, or soundtrack produce `non_diegetic_music: N/A` without removing scene sound.

- **Docs**
  - Document the common three-field H3 output contract and the distinction between non-diegetic music and dialogue, ambience, or action sounds.

**Changed files:**
- `README.md`
- `Readme/Smart_LM_Loader_Guide.md`
- `core/sml/tasks.py`
- `pyproject.toml`

## 2026-09-08

### Version: 1.0.10

- **Fix**
  - Remove standalone reference-picture alignment metadata from every MiniMax H3 output mode, strip legacy/custom preambles before validation, and keep recovery plus fallback output limited to the three generator-ready H3 fields.
  - Update bundled H3 prompts and few-shot examples to stop requesting alignment lines, while migrating untouched runtime defaults without replacing user customizations.

- **Docs**
  - Clarify that MiniMax H3 tasks return only the three required prompt fields.

**Changed files:**
- `.defaults/config/llm_few_shot_training.json.example`
- `.defaults/config/llm_few_shot_training_nsfw.json.example`
- `.defaults/config/system_prompts.json.example`
- `Readme/Smart_LM_Loader_Guide.md`
- `core/migration.py`
- `py/RvLoader_SmartLMLoader.py`
- `pyproject.toml`

## 2026-09-08

### Version: 1.0.9

- **Feat**
  - Show the running SmartLLM version in its ComfyUI settings and provide a loopback-only, explicitly confirmed update action that replaces tracked files with official `main`, preserves untracked user data, installs requirements, and reports the required restart.

- **Fix**
  - Allow SmartLLM to start when overlay updates leave inert extracted SmartLLM source files in Eclipse, while preserving Eclipse user-data migration and continuing to block active legacy packs or already-registered `/smartlml/...` routes.

- **Docs**
  - Clarify that startup conflict detection uses active providers and registered routes rather than stale Eclipse filenames.

**Changed files:**
- `core/compatibility.py`
- `core/self_update.py`
- `core/sml/server_endpoints.py`
- `js/smartllm-self-update.js`
- `README.md`
- `pyproject.toml`

## 2026-09-08

### Version: 1.0.8

- **Fix**
  - Validate every MiniMax H3 response before returning it, retry an incomplete or audio-only response once with the same reference images and seed plus a focused format-recovery instruction, and deterministically reconstruct any still-missing fields from the requested action and usable generated audio instead of failing the workflow.
  - Preserve structured motion fields containing chronological words such as `then` by restricting shared planning cleanup to genuine leading meta-reasoning, preventing valid H3 visual prompts from being reduced to audio-only output.
  - Remove the redundant I2VA first-frame reference sentence from H3 prompts and generated output while continuing to send the image to the vision backend, and migrate untouched bundled prompt entries without overwriting customizations.

- **Refactor**
  - Rename the Smart LM Loader implementation module to `RvLoader_SmartLMLoader.py` to distinguish it from the separate Smart Model Loader project while preserving the class and serialized node ID.

**Changed files:**
- `.defaults/config/llm_few_shot_training.json.example`
- `.defaults/config/llm_few_shot_training_nsfw.json.example`
- `.defaults/config/system_prompts.json.example`
- `__init__.py`
- `core/migration.py`
- `core/sml/common.py`
- `py/RvLoader_SmartLMLoader.py`
- `pyproject.toml`

## 2026-09-07

### Version: 1.0.7

- **Feat**
  - Replace the generic 15-second MiniMax H3 timeline with explicit T2VA, I2VA, FL2VA, and L2VA tasks, centralized mode metadata, exact reference-count validation, ordered endpoint grouping, natural-language shot counts, requested camera views, and named Tracking Shots.
  - Expand neutral H3 few-shot coverage in both training profiles for every input mode, including ordered three-view stories and endpoint-convergent motion paths.

- **Fix**
  - Make explicit FL2VA accept either one first-frame prompt-writing image or an ordered first/last pair, use two-image pose/framing differences to plan subject and camera transitions, keep one-image output grounded in its source, and still land on the downstream encoder-supplied Picture 2.
  - Require every H3 response to include its complete shot timeline, soundscape, and music fields so source-only or sound-only completions are explicitly invalid.
  - Upgrade untouched bundled prompt entries individually during default migration while preserving customized values and any inert retired Timeline entry.
  - Rebuild H3 instructions and both few-shot profiles around Wan-style input/output pairs so models use reference images as visual constraints, focus output on the requested action instead of re-captioning appearance, avoid invented names/entities/story events, and return only plain-text H3 fields without follow-up questions or Markdown sections.
  - Generalize Wan, H3, and LTX role prompts to the neutral cinematic motion prompt writer occupation, remove model/vendor names from both few-shot profiles' instructional messages.

- **Docs**
  - Document H3 mode selection, image ordering, shot and camera controls, Tracking Shots, and the separation between SmartLLM prompt-writing references and downstream H3 encoder keyframes.

- **Breaking**
  - Remove **MiniMax H3 Timeline 15s** from task registration and bundled defaults without a compatibility alias; select one of the four explicit timeline modes instead.

**Changed files:**
- `.defaults/config/llm_few_shot_training.json.example`
- `.defaults/config/llm_few_shot_training_nsfw.json.example`
- `.defaults/config/system_prompts.json.example`
- `README.md`
- `Readme/Smart_LM_Loader_Guide.md`
- `core/migration.py`
- `core/sml/backend_transformers.py`
- `core/sml/tasks.py`
- `py/RvLoader_SmartModelLoader_LM.py`
- `pyproject.toml`

## 2026-09-06

### Version: 1.0.6

- **Feat**
  - Add optional-image **MiniMax H3 Scene 5s** and **MiniMax H3 Timeline 15s** tasks that turn short stories or numbered shot lists into H3's audio-video prompt structure, including conditional first-frame references, concise image anchors, dialogue, soundscape, music, and duration-safe shot timing.
  - Add neutral few-shot examples for both MiniMax H3 tasks to the standard and NSFW training profiles so strict field and timeline formatting remains available in either profile.

- **Docs**
  - Document MiniMax H3 text-to-video, image-to-video, scene, timeline, and Training-chip usage in the Smart LM Loader guide.

**Changed files:**
- `.defaults/config/llm_few_shot_training.json.example`
- `.defaults/config/llm_few_shot_training_nsfw.json.example`
- `.defaults/config/system_prompts.json.example`
- `README.md`
- `Readme/Smart_LM_Loader_Guide.md`
- `core/sml/tasks.py`
- `py/RvLoader_SmartModelLoader_LM.py`
- `pyproject.toml`

## 2026-09-01

### Version: 1.0.5

- **Docs**
  - Correct the Smart LM Loader multi-task visual tour so the final-output callout targets the image and text output sockets instead of the seed controls, with separated exterior routes and visible line segments before each arrowhead.

**Changed files:**
- `Readme/assets/multi-task.png`
- `pyproject.toml`

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
