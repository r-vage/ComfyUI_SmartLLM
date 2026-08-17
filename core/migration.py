import copy
import hashlib
import json
import os
from pathlib import Path
from typing import Any

from .json_store import (
    JsonStoreError,
    read_json_object,
    update_json_object,
    write_json_object,
)
from .logger import log

_LOG_PREFIX = "Migration"
_MIGRATION_MARKER = ".smartllm-migration.json"
_MIGRATION_MARKER_VERSION = 2
_MANIFEST_NAME = ".manifest.json"
_CONFIG_KEYS = {
    "log_level",
    "llm_models_path",
    "llm_models_absolute_path",
    "retry_download_attempts",
    "few_shot_training_file",
    "hf_token",
    "modelscope_token",
}
_ECLIPSE_CONFIG_KEYS = frozenset(_CONFIG_KEYS)


def _file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _read_optional_object(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None
    try:
        return read_json_object(path)
    except (JsonStoreError, OSError) as error:
        log.warning(_LOG_PREFIX, f"Skipped unreadable migration source '{path}': {error}")
        return None


def _read_bundled_object(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None
    try:
        with path.open("r", encoding="utf-8") as source:
            data = json.load(source)
    except (OSError, json.JSONDecodeError) as error:
        log.warning(_LOG_PREFIX, f"Skipped unreadable bundled JSON '{path}': {error}")
        return None
    if not isinstance(data, dict):
        log.warning(_LOG_PREFIX, f"Skipped non-object bundled JSON '{path}'")
        return None
    return data


def _filter_config(data: dict[str, Any]) -> dict[str, Any]:
    filtered = {key: copy.deepcopy(value) for key, value in data.items() if key in _CONFIG_KEYS}
    comments = data.get("_comments")
    if isinstance(comments, dict):
        relevant = {
            key: copy.deepcopy(value)
            for key, value in comments.items()
            if key in _CONFIG_KEYS or key in {"description", "log_level_options"}
        }
        if relevant:
            filtered["_comments"] = relevant
    return filtered


def _custom_delta(current: Any, bundled: Any) -> Any:
    if isinstance(current, dict) and isinstance(bundled, dict):
        delta: dict[str, Any] = {}
        for key, value in current.items():
            if key not in bundled:
                delta[key] = copy.deepcopy(value)
                continue
            nested = _custom_delta(value, bundled[key])
            if nested is not None:
                delta[key] = nested
        return delta or None
    return copy.deepcopy(current) if current != bundled else None


def _merge_missing(target: dict[str, Any], additions: dict[str, Any]) -> None:
    for key, value in additions.items():
        if key not in target:
            target[key] = copy.deepcopy(value)
        elif isinstance(target[key], dict) and isinstance(value, dict):
            _merge_missing(target[key], value)


def _source_roots(repo_root: Path) -> list[Path]:
    custom_nodes = repo_root.parent
    candidates = [
        custom_nodes / "comfyui_eclipse",
        custom_nodes / "ComfyUI_Eclipse",
        custom_nodes / "ComfyUI_SmartLML",
        custom_nodes / "comfyui_smartlml",
        custom_nodes / "ComfyUI_SmartLML.disabled",
        custom_nodes / "comfyui_smartlml.disabled",
    ]
    roots: list[Path] = []
    seen: set[str] = set()
    for candidate in candidates:
        identity = os.path.normcase(str(candidate.resolve(strict=False)))
        if identity in seen or identity == os.path.normcase(str(repo_root.resolve(strict=False))):
            continue
        seen.add(identity)
        if candidate.is_dir():
            roots.append(candidate)
    return roots


def _is_eclipse_root(path: Path) -> bool:
    return path.name.casefold() == "comfyui_eclipse"


def _default_rel_paths(repo_root: Path) -> list[Path]:
    defaults = repo_root / ".defaults"
    paths = []
    for example in sorted(defaults.rglob("*.example")):
        relative = example.relative_to(defaults)
        paths.append(Path(str(relative)[: -len(".example")]))
    return paths


def _migration_rel_paths(repo_root: Path, sources: list[Path]) -> list[Path]:
    paths = set(_default_rel_paths(repo_root))
    paths.update({Path("config.json"), Path("docker_config.json")})
    for source_root in sources:
        for directory in ("config", "registry"):
            source_directory = source_root / directory
            if not source_directory.is_dir():
                continue
            for source_file in source_directory.glob("*.json"):
                if source_file.is_file() and not source_file.is_symlink():
                    paths.add(source_file.relative_to(source_root))
    return sorted(paths, key=lambda path: path.as_posix())


def _migrate_file(
    repo_root: Path,
    relative: Path,
    sources: list[Path],
) -> tuple[bool, set[str]]:
    destination = repo_root / relative
    destination_data = _read_optional_object(destination)
    created = destination_data is None
    result = destination_data if destination_data is not None else {}
    found_source = False
    examined_eclipse_keys: set[str] = set()

    for source_root in sources:
        source_path = source_root / relative
        if relative == Path("config.json") and not source_path.is_file():
            legacy_config = source_root / "smartlml_config.json"
            if legacy_config.is_file():
                source_path = legacy_config
        source_data = _read_optional_object(source_path)
        if source_data is None:
            continue
        found_source = True
        if relative == Path("config.json"):
            source_data = _filter_config(source_data)
            if _is_eclipse_root(source_root):
                examined_eclipse_keys.update(_ECLIPSE_CONFIG_KEYS)

        source_default_path = source_root / ".defaults" / Path(f"{relative}.example")
        source_default = _read_bundled_object(source_default_path)
        if source_default is not None and relative == Path("config.json"):
            source_default = _filter_config(source_default)

        if created and not result:
            result = copy.deepcopy(source_data)
            created = False
            continue

        additions = source_data
        if source_default is not None:
            additions = _custom_delta(source_data, source_default) or {}
        _merge_missing(result, additions)

    if not found_source:
        return False, examined_eclipse_keys

    if relative == Path("config.json"):
        bundled = _read_bundled_object(
            repo_root / ".defaults" / "config.json.example"
        )
        if bundled is not None:
            _merge_missing(result, _filter_config(bundled))

    destination.parent.mkdir(parents=True, exist_ok=True)
    private = relative == Path("config.json")
    if destination_data is None:
        write_json_object(destination, result, private=private)
    else:
        def merge_current(current: dict[str, Any]) -> None:
            _merge_missing(current, result)

        update_json_object(destination, merge_current, private=private)
    return True, examined_eclipse_keys


def _read_marker_state(marker: Path) -> tuple[dict[str, Any], set[str], set[str]]:
    data = _read_optional_object(marker) or {}
    migrated_files = data.get("migrated_files")
    examined_keys = data.get("examined_eclipse_config_keys")
    migrated = (
        {value for value in migrated_files if isinstance(value, str)}
        if isinstance(migrated_files, list)
        else set()
    )
    examined = (
        {value for value in examined_keys if isinstance(value, str)}
        if isinstance(examined_keys, list)
        else set()
    )
    return data, migrated, examined


def _marker_is_current(data: dict[str, Any], examined: set[str]) -> bool:
    version = data.get("version")
    return (
        isinstance(version, int)
        and not isinstance(version, bool)
        and version >= _MIGRATION_MARKER_VERSION
        and data.get("completed") is True
        and _ECLIPSE_CONFIG_KEYS <= examined
    )


def migrate_runtime_data(repo_root: Path) -> None:
    marker = repo_root / _MIGRATION_MARKER
    marker_data, migrated, examined = _read_marker_state(marker)
    if _marker_is_current(marker_data, examined):
        return

    sources = _source_roots(repo_root)
    for relative in _migration_rel_paths(repo_root, sources):
        did_migrate, newly_examined = _migrate_file(repo_root, relative, sources)
        examined.update(newly_examined)
        if did_migrate:
            migrated.add(relative.as_posix())

    write_json_object(
        marker,
        {
            "version": _MIGRATION_MARKER_VERSION,
            "completed": True,
            "migrated_files": sorted(migrated),
            "examined_eclipse_config_keys": sorted(examined),
        },
        private=True,
    )
    if migrated:
        log.msg(_LOG_PREFIX, f"Preserved {len(migrated)} Smart LM runtime file(s)")


def _load_manifest(defaults: Path) -> dict[str, Any]:
    manifest = _read_optional_object(defaults / _MANIFEST_NAME)
    return manifest if manifest is not None else {}


def materialize_defaults(repo_root: Path) -> None:
    defaults = repo_root / ".defaults"
    manifest_path = defaults / _MANIFEST_NAME
    manifest = _load_manifest(defaults)
    changed = False
    extracted = 0
    updated = 0

    for example in sorted(defaults.rglob("*.example")):
        relative = example.relative_to(defaults)
        relative = Path(str(relative)[: -len(".example")])
        key = relative.as_posix()
        target = repo_root / relative
        example_hash = _file_hash(example)
        previous_hash = manifest.get(key)

        if not target.exists():
            if previous_hash is not None:
                continue
            data = _read_bundled_object(example)
            if data is None:
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            write_json_object(target, data, private=relative == Path("config.json"))
            manifest[key] = example_hash
            changed = True
            extracted += 1
        elif previous_hash is None:
            data = _read_bundled_object(example)
            if data is not None:
                update_json_object(
                    target,
                    lambda current, bundled_data=data: _merge_missing(
                        current, bundled_data
                    ),
                    private=relative == Path("config.json"),
                )
            manifest[key] = example_hash
            changed = True
        elif previous_hash != example_hash:
            if _file_hash(target) == previous_hash:
                data = _read_bundled_object(example)
                if data is not None:
                    write_json_object(
                        target,
                        data,
                        private=relative == Path("config.json"),
                    )
                    updated += 1
            else:
                data = _read_bundled_object(example)
                if data is not None:
                    update_json_object(
                        target,
                        lambda current, bundled_data=data: _merge_missing(
                            current, bundled_data
                        ),
                        private=relative == Path("config.json"),
                    )
            manifest[key] = example_hash
            changed = True

    if changed:
        write_json_object(manifest_path, manifest, private=True)
    if extracted:
        log.msg(_LOG_PREFIX, f"Extracted {extracted} bundled default file(s)")
    if updated:
        log.msg(_LOG_PREFIX, f"Updated {updated} unmodified default file(s)")


def run_migrations(repo_root: Path | None = None) -> None:
    root = repo_root or Path(__file__).resolve().parent.parent
    migrate_runtime_data(root)
    materialize_defaults(root)
