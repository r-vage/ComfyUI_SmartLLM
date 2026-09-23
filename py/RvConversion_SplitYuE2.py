"""Split validated YuE2 JSON into the native generators' text inputs."""

# ruff: noqa: N999 - preserve the repository's node module naming convention

from comfy_api.latest import io  # type: ignore

from ..core import CATEGORY
from ..core.sml.yue2 import parse_song_json


class RvConversion_SplitYuE2(io.ComfyNode):
    @classmethod
    def define_schema(cls):
        return io.Schema(
            node_id="Split YuE2 [SmartLLM]",
            display_name="Split YuE2",
            category=CATEGORY.MAIN.value + CATEGORY.CONVERSION.value,
            description="Split YuE2 song JSON into style and lyrics for the native generators.",
            inputs=[
                io.String.Input(
                    "song_json",
                    multiline=True,
                    dynamic_prompts=False,
                    tooltip="Connect Smart LM Loader's result or paste style/lyrics JSON.",
                ),
            ],
            outputs=[io.String.Output("style"), io.String.Output("lyrics")],
        )

    @classmethod
    def execute(cls, song_json):
        song = parse_song_json(song_json)
        return io.NodeOutput(song["style"], song["lyrics"])
