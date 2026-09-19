"""Gradio trial UI for SheetSage2 (local GPU only)."""
from __future__ import annotations

import json
from pathlib import Path

import gradio as gr

from convert_abc import abc_to_musicxml, write_musicxml_and_mxl
from transcribe import TranscriptionResult, get_transcriber

HOST = "127.0.0.1"
PORT = 7860

_last_result: TranscriptionResult | None = None


def _events_text(events: object) -> str:
    if events is None:
        return "(no events)"
    return json.dumps(events, indent=2, ensure_ascii=False)


def _file_choices(result: TranscriptionResult) -> list[str]:
    paths: list[Path] = []
    if result.abc_path.is_file():
        paths.append(result.abc_path)
    if result.mxl_path and result.mxl_path.is_file():
        paths.append(result.mxl_path)
    if result.musicxml_path and result.musicxml_path.is_file():
        paths.append(result.musicxml_path)
    paths.extend(result.midi_paths)
    if result.events_path.is_file():
        paths.append(result.events_path)
    if result.preview_wav_path and result.preview_wav_path.is_file():
        paths.append(result.preview_wav_path)
    return [str(p) for p in paths]


def transcribe_handler(
    audio_path: str | None,
    melody_only: bool,
    progress: gr.Progress = gr.Progress(),
) -> tuple[str, str, str, str, str | None, str | None, list[str]]:
    global _last_result

    if not audio_path:
        raise gr.Error("Upload an audio file first.")

    transcriber = get_transcriber()

    def on_progress(value: dict) -> None:
        if value.get("stage") == "encoding":
            w = value.get("window", 0)
            total = value.get("windows", 1)
            progress((w / max(total, 1)), desc=f"Encoding window {w}/{total}")

    progress(0, desc="Starting transcription…")
    result = transcriber.transcribe(
        Path(audio_path),
        melody_only=melody_only,
        progress=on_progress,
    )
    _last_result = result
    progress(1.0, desc="Done")

    status = f"Job {result.job_id} → {result.output_dir}"
    if result.abc_error:
        status += f"\nABC note: {result.abc_error}"

    xml_text = ""
    if result.musicxml_path and result.musicxml_path.is_file():
        xml_text = result.musicxml_path.read_text(encoding="utf-8")

    mxl_file = str(result.mxl_path) if result.mxl_path and result.mxl_path.is_file() else None
    preview_audio = (
        str(result.preview_wav_path)
        if result.preview_wav_path and result.preview_wav_path.is_file()
        else None
    )

    return (
        status,
        result.abc or "(no ABC produced)",
        _events_text(result.events),
        xml_text,
        mxl_file,
        preview_audio,
        _file_choices(result),
    )


def convert_abc_handler(abc_text: str) -> tuple[str, str | None, list[str]]:
    global _last_result  # noqa: PLW0603

    if not abc_text or not abc_text.strip():
        raise gr.Error("ABC is empty.")

    try:
        xml_text = abc_to_musicxml(abc_text)
    except (ValueError, RuntimeError, FileNotFoundError) as exc:
        raise gr.Error(str(exc)) from exc

    files: list[str] = []
    if _last_result:
        musicxml_path, mxl_path = write_musicxml_and_mxl(
            abc_text, _last_result.output_dir
        )
        updated = TranscriptionResult(
            job_id=_last_result.job_id,
            output_dir=_last_result.output_dir,
            abc=abc_text,
            abc_error=_last_result.abc_error,
            events=_last_result.events,
            musicxml_path=musicxml_path,
            mxl_path=mxl_path,
            preview_wav_path=_last_result.preview_wav_path,
            midi_paths=_last_result.midi_paths,
            abc_path=_last_result.abc_path,
            events_path=_last_result.events_path,
        )
        _last_result = updated
        files = _file_choices(updated)
    else:
        files = []

    mxl_file = (
        str(updated.mxl_path)
        if _last_result and _last_result.mxl_path and _last_result.mxl_path.is_file()
        else None
    )
    return xml_text, mxl_file, files


def build_ui() -> gr.Blocks:
    with gr.Blocks(title="SheetSage2 trial lab") as demo:
        gr.Markdown(
            "# SheetSage2 trial lab\n"
            "Audio → lead sheet (ABC/MIDI) + MusicXML via abc2xml. "
            "**Local GPU only** — not connected to ClearClef."
        )

        with gr.Row():
            audio_in = gr.Audio(
                label="Audio",
                type="filepath",
                sources=["upload", "microphone"],
            )
        with gr.Row():
            melody_only = gr.Checkbox(label="Melody only (omit chords from ABC)", value=False)

        transcribe_btn = gr.Button("Transcribe", variant="primary")
        status_out = gr.Textbox(label="Status", lines=2, interactive=False)

        with gr.Tabs():
            with gr.Tab("ABC"):
                abc_out = gr.Textbox(label="ABC", lines=20)
            with gr.Tab("Events"):
                events_out = gr.Textbox(label="events.json", lines=20, interactive=False)
            with gr.Tab("MusicXML"):
                xml_out = gr.Textbox(label="MusicXML", lines=20)
                convert_btn = gr.Button("Convert ABC → MusicXML")
            with gr.Tab("Files"):
                mxl_out = gr.File(
                    label="score.mxl (MuseScore / ClearClef upload)",
                    interactive=False,
                )
                preview_audio_out = gr.Audio(
                    label="Transcription preview (from MIDI; re-transcribe to refresh)",
                    type="filepath",
                    interactive=False,
                )
                files_out = gr.File(label="All outputs", file_count="multiple")

        transcribe_btn.click(
            fn=transcribe_handler,
            inputs=[audio_in, melody_only],
            outputs=[
                status_out,
                abc_out,
                events_out,
                xml_out,
                mxl_out,
                preview_audio_out,
                files_out,
            ],
        )
        convert_btn.click(
            fn=convert_abc_handler,
            inputs=[abc_out],
            outputs=[xml_out, mxl_out, files_out],
        )

    return demo


def main() -> None:
    gr.set_static_paths(paths=[Path(__file__).resolve().parent])
    demo = build_ui()
    demo.queue(default_concurrency_limit=1)
    # Warm-load model before binding the port (slow first start).
    get_transcriber()
    demo.launch(server_name=HOST, server_port=PORT, show_error=True)


if __name__ == "__main__":
    main()
