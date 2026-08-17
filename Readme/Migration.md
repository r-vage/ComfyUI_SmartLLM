# Migration

Migration runs once, before bundled defaults are materialized, with this precedence:

1. Existing `ComfyUI_SmartLLM` runtime data
2. Current `comfyui_eclipse` runtime data
3. Legacy `ComfyUI_SmartLML` runtime data, including disabled folders
4. Bundled SmartLLM defaults

The migration copies or non-destructively merges `config.json`, `docker_config.json`, `config/*.json`, and `registry/*.json`. Existing destination values win conflicts. For an existing destination, only missing source customizations relative to the source's bundled defaults are merged.

`config.json` is committed atomically with mode `0600` on POSIX. Credentials are never written to logs or migration markers. The durable `.smartllm-migration.json` marker contains only the migration version, migrated relative filenames, and the names—not values—of Eclipse configuration keys examined during migration. Eclipse uses that confirmation to remove extracted Smart LM fields without deleting destination-preferred values.

Locks, caches, bytecode, temporary conversion files, download staging, model files, provenance sidecars, and partial downloads are not copied or removed.
