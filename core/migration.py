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
_DEFAULT_VALUE_UPGRADES = {
    Path("config/system_prompts.json"): {
        "MiniMax H3 Scene 5s": (
            "e03e44bae85d73581a1908c7dc21e0c898a008019096482631d743b09794ffe8",
            "0b7efa02451ded08444004329cfc3defa0b5fd9b558dd5c5493e068643d0caaa",
        ),
        "MiniMax H3 I2VA Timeline 15s": (
            "a0db383415417dc60a310a0cf6bc7414af6502b8aa278bd63ff71c7e7685fe56",
        ),
        "Wan 2.2 Scene 5s": "4e85319ae508d07c8df224dabb11c02cd686f88ef11557071d1d7c7aae48ff5f",
        "Wan 2.2 Timeline 5s": "955c2d2efd52d093fa57ff646652615a145b0e7b46d60f95909af2c52987d5e0",
        "Wan 2.2 Timeline 5s 2s": "88d1e095216abcd1acd1721f9b63f4e104f93711e261f5b7553b6f9b15d2c0d0",
        "Wan 2.2 Timeline 5s 3s": "46761f8c47641b6d776a8b1d3ba29806f26aa48ad904b9fa3c10b2076b847225",
        "Wan 2.2 Scene 10s": "ecd4a75b5b62b9028fda5e4f23a23bad082620f61e99266f67d270fd62d59513",
        "Wan 2.2 Timeline 10s": "361d1dcd651abaf2cbbdf07224d01e96d2c3e06704dbc928bd492e895e1ab722",
        "Wan 2.2 Scene 20s": "7a919e2e6e6b286818a2cc640bac7fb580f66dd09a2628b9b9f95dd9f4ef05e2",
        "Wan 2.2 Timeline 20s": "706468776084156d1c42bbbfcbb7556b47309740dafb1561ed3b133d47a40b02",
        "Wan 2.2 CN Atomic": "7a5523da49285d67ce93f538a6b89c538ee4ab8e65900805e4b28a11321220cd",
        "LTX 2.3 I2V": "dbf829e66bc2232fb5dd542c069f804b81641e2add4cc3233c9d8def4b705eeb",
    },
    Path("config/llm_few_shot_training.json"): {
        "minimax_h3_scene_5s": (
            "eecd52bf4a3e38146d684c9bbfd400074a8819eacc27e40a5b11901153bb7885",
            "a44c6a7d90bd547f0fa504e933ceadd81d3aa5db92d029ce415e637d102fc70e",
        ),
        "minimax_h3_i2va_timeline_15s": (
            "b7cf284d40b783c691c093487cc4fc1bd0902122c0d027370e51b88a18ae6aef",
        ),
        "wan_2.2_scene_5s": "bd734ddd2927506eea6208fc2eaf9f3aac38601853fac3e360c439b43a6b4712",
        "wan_2.2_timeline_5s": "74ce9c85afcb14c01dcc48ce682c8cd844aabd7cedb14c3e4c5644383df2579c",
        "wan_2.2_timeline_5s_2s": "8c63941e5b244b21a6b5473afea1e2a7c438a6fbf6114f488df4fd36136166a8",
        "wan_2.2_timeline_5s_3s": "dbfc717968a30a7edfe0cf1461708a528bc30e295acf1bdf8e0be757266faf09",
        "wan_2.2_scene_10s": "289bd17589b10f0eb2bcab9b8a9e42fd37bc2d30c1884ef5ed4aa08f43b707ea",
        "wan_2.2_timeline_10s": "839803e40b31b23d11f6e234a8788a3893d87ff8a2620c7b05110a182d178714",
        "wan_2.2_scene_20s": "cfde6cefcb4e1e1af9c06004dfe5d877e75b41dde6bf8f63d395bd5db666d8c5",
        "wan_2.2_timeline_20s": "3cf9e9399d9f94bbcfe34cb8d85ddc12dc0ea931c98f5d75a1f6ae918713e53b",
        "ltx_2.3_i2v": "ddddcb90ebc4292ae937be87f8fe1d542e6ab55416fc777a56dd44208ea4a397",
    },
    Path("config/llm_few_shot_training_nsfw.json"): {
        "minimax_h3_scene_5s": (
            "eecd52bf4a3e38146d684c9bbfd400074a8819eacc27e40a5b11901153bb7885",
            "a44c6a7d90bd547f0fa504e933ceadd81d3aa5db92d029ce415e637d102fc70e",
        ),
        "minimax_h3_i2va_timeline_15s": (
            "b7cf284d40b783c691c093487cc4fc1bd0902122c0d027370e51b88a18ae6aef",
        ),
        "wan_2.2_scene_5s": "1c61cde6ddc8c83ef910f2bee4fa6ce644cecd6f300a76267ba000e75e793f44",
        "wan_2.2_timeline_5s": "ce2153d353b6849013343f621fd7beb47a77a0ca32eff391eb5a97905a1b10b9",
        "wan_2.2_timeline_5s_2s": "8c63941e5b244b21a6b5473afea1e2a7c438a6fbf6114f488df4fd36136166a8",
        "wan_2.2_timeline_5s_3s": "dbfc717968a30a7edfe0cf1461708a528bc30e295acf1bdf8e0be757266faf09",
        "wan_2.2_scene_10s": "1fdf84cd819dc66ca8f23fd7fc2c5e4dd452b2410e60513632888792abe5ef3f",
        "wan_2.2_timeline_10s": "95989ed6d728aede0e8e811eb4e420e2f523f6a35e79a2155dbd87323bc4dad4",
        "wan_2.2_scene_20s": "cfde6cefcb4e1e1af9c06004dfe5d877e75b41dde6bf8f63d395bd5db666d8c5",
        "wan_2.2_timeline_20s": "3cf9e9399d9f94bbcfe34cb8d85ddc12dc0ea931c98f5d75a1f6ae918713e53b",
        "ltx_2.3_i2v": "54d0a9b12e92b6eace281b066c6758d8ddc89fdb54479a215d5fa075c9e4dbbb",
    },
}


def _file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _value_hash(value: Any) -> str:
    payload = json.dumps(
        value,
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


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


def _merge_bundled_update(
    relative: Path,
    current: dict[str, Any],
    bundled: dict[str, Any],
) -> None:
    # New defaults remain additive. Prompt entries are upgraded individually
    # only while they still match a recognized prior bundled value; local edits
    # and retired keys remain untouched.
    upgrades = _DEFAULT_VALUE_UPGRADES.get(relative, {})
    for key, legacy_hashes in upgrades.items():
        recognized_hashes = (
            (legacy_hashes,) if isinstance(legacy_hashes, str) else legacy_hashes
        )
        if (
            key in current
            and key in bundled
            and _value_hash(current[key]) in recognized_hashes
        ):
            current[key] = copy.deepcopy(bundled[key])
    _merge_missing(current, bundled)


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
                    lambda current, bundled_data=data, rel=relative: (
                        _merge_bundled_update(rel, current, bundled_data)
                    ),
                    private=relative == Path("config.json"),
                )
            manifest[key] = example_hash
            changed = True
        elif previous_hash != example_hash:
            if _file_hash(target) == previous_hash:
                data = _read_bundled_object(example)
                if data is not None:
                    if relative in _DEFAULT_VALUE_UPGRADES:
                        update_json_object(
                            target,
                            lambda current, bundled_data=data, rel=relative: (
                                _merge_bundled_update(rel, current, bundled_data)
                            ),
                            private=relative == Path("config.json"),
                        )
                    else:
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
                        lambda current, bundled_data=data, rel=relative: (
                            _merge_bundled_update(rel, current, bundled_data)
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
