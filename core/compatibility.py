from pathlib import Path
from typing import Any

_SMART_LM_ROUTE_PREFIX = "/smartlml/"


def _active_pack(path: Path) -> bool:
    return path.is_dir() and (path / "__init__.py").is_file()


def _registered_smart_lm_routes() -> list[str]:
    try:
        from server import PromptServer  # type: ignore

        route_table: Any = PromptServer.instance.routes
        items = getattr(route_table, "_items", ())
        paths = []
        for item in items:
            path = getattr(item, "path", "")
            if isinstance(path, str) and path.startswith(_SMART_LM_ROUTE_PREFIX):
                method = getattr(item, "method", "*")
                paths.append(f"{method} {path}")
        return sorted(set(paths))
    except (AttributeError, ImportError, RuntimeError):
        return []


def find_conflicts(repo_root: Path) -> list[str]:
    custom_nodes = repo_root.parent
    conflicts: list[str] = []

    for name in ("ComfyUI_SmartLML", "comfyui_smartlml"):
        candidate = custom_nodes / name
        if (
            candidate.resolve(strict=False) != repo_root.resolve(strict=False)
            and _active_pack(candidate)
        ):
            conflicts.append(f"legacy SmartLML pack: {candidate}")

    for name in ("comfyui_eclipse", "ComfyUI_Eclipse"):
        candidate = custom_nodes / name
        if candidate.resolve(strict=False) == repo_root.resolve(strict=False):
            continue
        if (
            _active_pack(candidate)
            and (candidate / "core" / "sml").is_dir()
            and (candidate / "py" / "RvLoader_SmartModelLoader_LM.py").is_file()
        ):
            conflicts.append(f"Eclipse still includes Smart LM: {candidate}")

    registered = _registered_smart_lm_routes()
    if registered:
        conflicts.append(
            "Smart LM routes are already registered: " + ", ".join(registered)
        )
    return conflicts
