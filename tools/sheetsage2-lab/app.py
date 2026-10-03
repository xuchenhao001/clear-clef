"""Gradio trial UI for SheetSage2 (local GPU only)."""
from __future__ import annotations

import html
import json
import threading
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Generator

import gradio as gr

from convert_abc import abc_to_musicxml, write_musicxml_and_mxl
from transcribe import TranscriptionResult, get_transcriber, job_output_display_path

HOST = "127.0.0.1"
PORT = 7860

# queue item id -> transcription result
_results: dict[str, TranscriptionResult] = {}
# Live queue mirror while a batch generator is running (for mid-run removals).
_active_queue: list[dict[str, Any]] | None = None
_cancel_requested = False

LAB_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400&family=Geist:wght@400;500;600&family=Newsreader:opsz,wght@6..72,300&display=swap');

.gradio-container {
  --canvas: #f5f5f5;
  --ink: #0c0a09;
  --body: #4e4e4e;
  --muted: #777169;
  --hairline: #e7e5e4;
  --surface: #ffffff;
  --error: #dc2626;
  --primary: #292524;
  --primary-active: #0c0a09;
  font-family: 'Geist', system-ui, sans-serif !important;
  background: var(--canvas) !important;
  color: var(--ink) !important;
}
.lab-title {
  font-family: 'Newsreader', Georgia, serif !important;
  font-weight: 300 !important;
  font-size: 2.25rem !important;
  letter-spacing: -0.02em !important;
  line-height: 1.15 !important;
  margin: 0 0 0.5rem 0 !important;
  color: var(--ink) !important;
}
.lab-lede {
  color: var(--body) !important;
  max-width: 42rem;
  line-height: 1.55;
  margin-bottom: 1.5rem !important;
}
.lab-panel {
  background: var(--surface) !important;
  border: 1px solid var(--hairline) !important;
  border-radius: 12px !important;
  padding: 1.25rem !important;
}
.batch-progress { margin: 0.75rem 0 1rem; }
.batch-progress-track {
  height: 8px;
  background: var(--hairline);
  border-radius: 999px;
  overflow: hidden;
}
.batch-progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 999px;
}
.batch-progress-label {
  font-family: 'Geist Mono', ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
  font-size: 0.8125rem;
  color: var(--muted);
  margin: 0.5rem 0 0;
}
.queue-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--hairline);
  font-size: 0.875rem;
}
.queue-row:last-child { border-bottom: none; }
.queue-name { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.queue-status {
  font-family: 'Geist Mono', ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted);
}
.queue-status.running { color: var(--ink); }
.queue-status.failed { color: var(--error); }
.queue-status.done { color: var(--body); }
.queue-row-active .queue-name { text-decoration: underline; text-underline-offset: 3px; }
.queue-mini-track {
  grid-column: 1 / -1;
  height: 4px;
  background: var(--hairline);
  border-radius: 999px;
  overflow: hidden;
}
.queue-mini-fill {
  height: 100%;
  background: var(--primary);
}
.queue-path {
  grid-column: 1 / -1;
  font-family: 'Geist Mono', ui-monospace, monospace;
  font-size: 0.75rem;
  color: var(--muted);
}
.queue-empty { color: var(--muted); font-size: 0.875rem; margin: 0; }
.detail-empty { color: var(--muted); font-style: italic; padding: 2rem 0; }
button.primary, .primary {
  background: var(--primary) !important;
  color: #fff !important;
  border-radius: 999px !important;
  transition: background 0.2s ease, transform 0.15s ease !important;
}
button.primary:hover { background: var(--primary-active) !important; }
button.primary:active { transform: scale(0.98) !important; }
*:focus-visible {
  outline: 2px solid var(--ink) !important;
  outline-offset: 2px !important;
}
"""


@dataclass
class QueueItem:
    id: str
    path: str
    name: str
    status: str  # queued | running | done | failed
    error: str | None = None
    job_id: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "path": self.path,
            "name": self.name,
            "status": self.status,
            "error": self.error,
            "job_id": self.job_id,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> QueueItem:
        return cls(
            id=str(data["id"]),
            path=str(data["path"]),
            name=str(data["name"]),
            status=str(data.get("status", "queued")),
            error=data.get("error"),
            job_id=data.get("job_id"),
        )


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


def _queue_from_state(raw: list[dict[str, Any]] | None) -> list[QueueItem]:
    if not raw:
        return []
    return [QueueItem.from_dict(x) for x in raw]


def _queue_to_state(items: list[QueueItem]) -> list[dict[str, Any]]:
    return [x.to_dict() for x in items]


def _short_error_message(exc: BaseException) -> str:
    raw = str(exc).strip()
    first = raw.splitlines()[0] if raw else "Unknown error"
    if len(first) > 280:
        first = first[:277] + "..."
    return first


def request_cancel() -> None:
    global _cancel_requested
    _cancel_requested = True


def _progress_html(
    fraction: float,
    label: str,
) -> str:
    pct = max(0.0, min(1.0, fraction)) * 100
    return (
        '<div class="batch-progress">'
        f'<div class="batch-progress-track">'
        f'<div class="batch-progress-fill" style="width:{pct:.1f}%"></div>'
        f"</div>"
        f'<p class="batch-progress-label">{label}</p>'
        "</div>"
    )


def _queue_list_html(
    items: list[QueueItem],
    selected_id: str | None,
    active_fraction: float | None = None,
) -> str:
    if not items:
        return '<p class="queue-empty">Add audio files to build a queue.</p>'
    parts: list[str] = []
    for item in items:
        status_cls = f"queue-status {item.status}"
        status_label = item.status
        if item.status == "failed" and item.error:
            status_label = "failed"
        row_cls = "queue-row"
        if item.id == selected_id:
            row_cls += " queue-row-active"
        parts.append(f'<div class="{row_cls}">')
        safe_name = html.escape(item.name)
        parts.append(f'<span class="queue-name" title="{safe_name}">{safe_name}</span>')
        parts.append(f'<span class="{status_cls}">{status_label}</span>')
        if item.status == "done" and item.job_id:
            parts.append(
                f'<span class="queue-path">{html.escape(job_output_display_path(item.job_id))}</span>'
            )
        if item.status == "running" and active_fraction is not None:
            pct = max(0.0, min(1.0, active_fraction)) * 100
            parts.append(
                f'<div class="queue-mini-track">'
                f'<div class="queue-mini-fill" style="width:{pct:.1f}%"></div>'
                f"</div>"
            )
        if item.status == "failed" and item.error:
            parts.append(
                f'<span class="queue-status failed" style="grid-column:1/-1;text-transform:none;">'
                f"{html.escape(item.error)}</span>"
            )
        parts.append("</div>")
    return "\n".join(parts)


def _idle_progress_label(items: list[QueueItem]) -> str:
    n = len(items)
    queued = sum(1 for x in items if x.status == "queued")
    if n == 0:
        return "No files queued"
    if queued == n:
        return f"{n} file{'s' if n != 1 else ''} queued"
    done = sum(1 for x in items if x.status == "done")
    failed = sum(1 for x in items if x.status == "failed")
    if done + failed == n:
        if failed:
            return f"{done} finished, {failed} failed"
        return f"{done} of {n} finished"
    return f"{n} in queue"


def _append_paths(
    queue: list[QueueItem],
    paths: list[str] | None,
) -> list[QueueItem]:
    if not paths:
        return queue
    seen = {x.path for x in queue}
    out = list(queue)
    for p in paths:
        if not p or p in seen:
            continue
        seen.add(p)
        out.append(
            QueueItem(
                id=uuid.uuid4().hex[:10],
                path=p,
                name=Path(p).name,
                status="queued",
            )
        )
    return out


def _remove_selected(
    queue: list[QueueItem],
    selected_id: str | None,
) -> list[QueueItem]:
    if not selected_id:
        return queue
    return [
        x
        for x in queue
        if not (x.id == selected_id and x.status == "queued")
    ]


def _clear_finished(queue: list[QueueItem]) -> list[QueueItem]:
    return [x for x in queue if x.status in ("queued", "running")]


def _queue_choices(items: list[QueueItem]) -> list[tuple[str, str]]:
    choices: list[tuple[str, str]] = []
    for item in items:
        label = f"{item.name} ({item.status})"
        choices.append((label, item.id))
    return choices


def _detail_from_item(item_id: str | None) -> tuple[str, str, str, str, str | None, str | None, list[str]]:
    if not item_id or item_id not in _results:
        return (
            "Scores appear here as each file finishes.",
            "",
            "",
            "",
            None,
            None,
            [],
        )
    result = _results[item_id]
    status = (
        f"Output folder: {job_output_display_path(result.job_id)}\n"
        f"Absolute path: {result.output_dir}"
    )
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


def _detail_from_failed(item: QueueItem) -> tuple[str, str, str, str, str | None, str | None, list[str]]:
    return (
        item.error or "Transcription failed.",
        "",
        "",
        "",
        None,
        None,
        [],
    )


def _detail_header(item_id: str | None, items: list[QueueItem]) -> str:
    if not item_id:
        return '<p class="detail-empty">Scores appear here as each file finishes.</p>'
    item = next((x for x in items if x.id == item_id), None)
    if not item:
        return '<p class="detail-empty">Select a finished file from the queue.</p>'
    safe_name = html.escape(item.name)
    if item.status == "failed":
        return f"<p><strong>{safe_name}</strong> — failed</p>"
    if item.job_id:
        path = html.escape(job_output_display_path(item.job_id))
        return f"<p><strong>{safe_name}</strong><br><code>{path}</code></p>"
    return f"<p><strong>{safe_name}</strong></p>"


def _pack_ui(
    queue: list[QueueItem],
    selected_id: str | None,
    progress_fraction: float,
    progress_label: str,
    running: bool,
    active_row_fraction: float | None = None,
) -> tuple[Any, ...]:
    choices = _queue_choices(queue)
    dropdown_value = selected_id if any(c[1] == selected_id for c in choices) else (
        choices[-1][1] if choices else None
    )
    detail = (
        _detail_from_failed(next(x for x in queue if x.id == selected_id))
        if selected_id
        and (item := next((x for x in queue if x.id == selected_id), None))
        and item.status == "failed"
        else _detail_from_item(selected_id if selected_id in _results else None)
    )
    return (
        _queue_to_state(queue),
        running,
        selected_id,
        _progress_html(progress_fraction, progress_label),
        _queue_list_html(queue, selected_id, active_row_fraction),
        _detail_header(selected_id, queue),
        gr.update(choices=choices, value=dropdown_value),
        gr.update(interactive=not running),
        gr.update(interactive=running),
        gr.update(interactive=not running),
        gr.update(interactive=True),
        gr.update(interactive=not running),
        *detail,
    )


def add_files_handler(
    queue_state: list[dict[str, Any]] | None,
    new_files: list[str] | None,
) -> tuple[list[dict[str, Any]], str, str]:
    queue = _append_paths(_queue_from_state(queue_state), new_files or [])
    label = _idle_progress_label(queue)
    return (
        _queue_to_state(queue),
        _progress_html(0.0, label),
        _queue_list_html(queue, None),
    )


def add_mic_handler(
    queue_state: list[dict[str, Any]] | None,
    mic_path: str | None,
) -> tuple[list[dict[str, Any]], str, str]:
    paths = [mic_path] if mic_path else None
    return add_files_handler(queue_state, paths)


def remove_handler(
    queue_state: list[dict[str, Any]] | None,
    selected_id: str | None,
) -> tuple[list[dict[str, Any]], str, str]:
    global _active_queue
    queue = _queue_from_state(queue_state)
    queue = _remove_selected(queue, selected_id)
    if _active_queue is not None:
        _active_queue = [x.to_dict() for x in queue]
    label = _idle_progress_label(queue)
    return (
        _queue_to_state(queue),
        _progress_html(0.0, label),
        _queue_list_html(queue, selected_id),
    )


def clear_finished_handler(
    queue_state: list[dict[str, Any]] | None,
    selected_id: str | None,
) -> tuple[list[dict[str, Any]], str, str, dict[str, Any]]:
    queue = _clear_finished(_queue_from_state(queue_state))
    still_selected = selected_id if any(x.id == selected_id for x in queue) else None
    label = _idle_progress_label(queue)
    choices = _queue_choices(queue)
    return (
        _queue_to_state(queue),
        _progress_html(0.0, label),
        _queue_list_html(queue, still_selected),
        gr.update(
            choices=choices,
            value=still_selected if still_selected else (choices[-1][1] if choices else None),
        ),
    )


def select_result_handler(
    item_id: str | None,
    queue_state: list[dict[str, Any]] | None,
) -> tuple[str, str, str, str, str, str, str, str | None, str | None, list[str]]:
    items = _queue_from_state(queue_state)
    if not item_id:
        return ("", *_detail_from_item(None))
    item = next((x for x in items if x.id == item_id), None)
    if item and item.status == "failed":
        return (_detail_header(item_id, items), *_detail_from_failed(item))
    if item and item.status in ("queued", "running"):
        return (
            _detail_header(item_id, items),
            "Waiting to transcribe." if item.status == "queued" else "Transcription in progress…",
            "",
            "",
            "",
            None,
            None,
            [],
        )
    return (_detail_header(item_id, items), *_detail_from_item(item_id))


def transcribe_queue_generator(
    queue_state: list[dict[str, Any]] | None,
    melody_only: bool,
    selected_id: str | None,
) -> Generator[tuple[Any, ...], None, None]:
    global _active_queue, _results, _cancel_requested

    _cancel_requested = False
    queue = _queue_from_state(queue_state)
    pending = [x for x in queue if x.status == "queued"]
    if not pending:
        raise gr.Error("Add at least one audio file to the queue.")

    transcriber = get_transcriber()
    total = len([x for x in queue if x.status in ("queued", "running", "done", "failed")])
    # Only count items that will run in this batch
    batch_ids = {x.id for x in pending}
    batch_total = len(pending)
    finished_before = sum(1 for x in queue if x.status in ("done", "failed") and x.id not in batch_ids)

    _active_queue = _queue_to_state(queue)
    current_selected = selected_id
    window_frac = 0.0

    def sync_queue() -> list[QueueItem]:
        return _queue_from_state(_active_queue)

    yield _pack_ui(
        queue,
        current_selected,
        finished_before / max(total, 1),
        f"Starting… · 0 of {batch_total}",
        True,
        None,
    )

    done_in_batch = 0
    batch_denom = finished_before + batch_total
    cancelled = False
    for item in list(queue):
        if _cancel_requested:
            cancelled = True
            break
        if item.status != "queued":
            continue
        live = sync_queue()
        if not any(x.id == item.id for x in live):
            continue

        for i, q in enumerate(live):
            if q.id == item.id:
                live[i] = QueueItem(
                    id=q.id,
                    path=q.path,
                    name=q.name,
                    status="running",
                    error=None,
                    job_id=q.job_id,
                )
        _active_queue = _queue_to_state(live)
        queue = live

        tick: dict[str, Any] = {
            "window_frac": 0.0,
            "window": 0,
            "windows": 1,
            "done": False,
            "error": None,
            "result": None,
        }

        def on_progress(value: dict) -> None:
            if value.get("stage") == "encoding":
                w = value.get("window", 0)
                win_total = value.get("windows", 1)
                tick["window"] = int(w)
                tick["windows"] = int(win_total)
                tick["window_frac"] = w / max(win_total, 1)

        def run_one() -> None:
            try:
                tick["result"] = transcriber.transcribe(
                    Path(item.path),
                    melody_only=melody_only,
                    progress=on_progress,
                )
            except Exception as exc:  # noqa: BLE001
                tick["error"] = exc
            finally:
                tick["done"] = True

        worker = threading.Thread(target=run_one, daemon=True)
        worker.start()
        while not tick["done"]:
            window_frac = tick["window_frac"]
            overall_frac = (finished_before + done_in_batch + window_frac) / max(
                batch_denom, 1
            )
            label = (
                f"{finished_before + done_in_batch + 1} of {batch_denom} · {item.name}"
            )
            if tick["windows"] > 1:
                label += f" · window {tick['window']} of {tick['windows']}"
            yield _pack_ui(
                queue,
                current_selected,
                overall_frac,
                label,
                True,
                window_frac,
            )
            time.sleep(0.2)
        worker.join()

        if tick["error"] is not None:
            exc = tick["error"]
            for i, q in enumerate(queue):
                if q.id == item.id:
                    queue[i] = QueueItem(
                        id=q.id,
                        path=q.path,
                        name=q.name,
                        status="failed",
                        error=_short_error_message(exc),
                        job_id=None,
                    )
            done_in_batch += 1
            current_selected = item.id
        else:
            result = tick["result"]
            assert isinstance(result, TranscriptionResult)
            _results[item.id] = result
            for i, q in enumerate(queue):
                if q.id == item.id:
                    queue[i] = QueueItem(
                        id=q.id,
                        path=q.path,
                        name=q.name,
                        status="done",
                        error=None,
                        job_id=result.job_id,
                    )
            done_in_batch += 1
            current_selected = item.id

        _active_queue = _queue_to_state(queue)
        overall_done = finished_before + done_in_batch
        overall_frac = overall_done / max(batch_denom, 1)
        yield _pack_ui(
            queue,
            current_selected,
            overall_frac,
            f"{overall_done} of {batch_denom} · {item.name}",
            True,
            None,
        )

    _active_queue = None
    _cancel_requested = False
    failed = sum(1 for x in queue if x.status == "failed")
    done = sum(1 for x in queue if x.status == "done")
    finished_count = finished_before + done_in_batch
    if cancelled:
        end_label = f"Cancelled · {finished_count} of {batch_denom} finished"
    elif failed:
        end_label = f"{done} finished, {failed} failed"
    else:
        end_label = f"{done} of {done} finished"
    yield _pack_ui(
        queue,
        current_selected,
        1.0,
        end_label,
        False,
        None,
    )


def convert_abc_handler(
    abc_text: str,
    open_item_id: str | None,
) -> tuple[str, str | None, list[str]]:
    if not abc_text or not abc_text.strip():
        raise gr.Error("ABC is empty.")
    if not open_item_id or open_item_id not in _results:
        raise gr.Error("Open a finished transcription before converting.")

    try:
        xml_text = abc_to_musicxml(abc_text)
    except (ValueError, RuntimeError, FileNotFoundError) as exc:
        raise gr.Error(str(exc)) from exc

    base = _results[open_item_id]
    musicxml_path, mxl_path = write_musicxml_and_mxl(abc_text, base.output_dir)
    updated = TranscriptionResult(
        job_id=base.job_id,
        output_dir=base.output_dir,
        abc=abc_text,
        abc_error=base.abc_error,
        events=base.events,
        musicxml_path=musicxml_path,
        mxl_path=mxl_path,
        preview_wav_path=base.preview_wav_path,
        midi_paths=base.midi_paths,
        abc_path=base.abc_path,
        events_path=base.events_path,
    )
    _results[open_item_id] = updated
    mxl_file = str(mxl_path) if mxl_path.is_file() else None
    return xml_text, mxl_file, _file_choices(updated)


def build_ui() -> gr.Blocks:
    with gr.Blocks(title="SheetSage2 trial lab", css=LAB_CSS) as demo:
        queue_state = gr.State([])
        running_state = gr.State(False)
        open_item_id = gr.State(None)

        gr.Markdown(
            '<p class="lab-title">SheetSage2 trial lab</p>'
            '<p class="lab-lede">Queue several audio files, transcribe them one at a time on your GPU, '
            "then review ABC, MusicXML, and previews per file. "
            "<strong>Local GPU only</strong> — not connected to ClearClef.</p>"
        )

        with gr.Row(equal_height=False):
            with gr.Column(scale=4, elem_classes=["lab-panel"]):
                gr.Markdown("### Queue")
                file_in = gr.File(
                    label="Add audio files",
                    file_count="multiple",
                    type="filepath",
                    file_types=["audio"],
                )
                mic_in = gr.Audio(
                    label="Add a recording",
                    type="filepath",
                    sources=["microphone"],
                )
                melody_only = gr.Checkbox(
                    label="Melody only (omit chords from ABC)",
                    value=False,
                )
                progress_html = gr.HTML(_progress_html(0.0, "No files queued"))
                queue_html = gr.HTML(_queue_list_html([], None))
                with gr.Row():
                    remove_btn = gr.Button("Remove selected")
                    clear_btn = gr.Button("Clear finished")
                queue_pick = gr.Dropdown(
                    label="Select in queue",
                    choices=[],
                    value=None,
                )
                with gr.Row():
                    transcribe_btn = gr.Button("Transcribe queue", variant="primary")
                    cancel_btn = gr.Button("Cancel", interactive=False)

            with gr.Column(scale=6, elem_classes=["lab-panel"]):
                gr.Markdown("### Selected score")
                detail_header = gr.HTML(
                    '<p class="detail-empty">Scores appear here as each file finishes.</p>'
                )
                status_out = gr.Textbox(label="Status", lines=2, interactive=False)

                with gr.Tabs():
                    with gr.Tab("ABC"):
                        abc_out = gr.Textbox(label="ABC", lines=20)
                    with gr.Tab("Events"):
                        events_out = gr.Textbox(
                            label="events.json", lines=20, interactive=False
                        )
                    with gr.Tab("MusicXML"):
                        xml_out = gr.Textbox(label="MusicXML", lines=20)
                        convert_btn = gr.Button("Convert ABC → MusicXML")
                    with gr.Tab("Files"):
                        mxl_out = gr.File(
                            label="score.mxl (MuseScore / ClearClef upload)",
                            interactive=False,
                        )
                        preview_audio_out = gr.Audio(
                            label="Transcription preview (from MIDI)",
                            type="filepath",
                            interactive=False,
                        )
                        files_out = gr.File(label="All outputs", file_count="multiple")

        detail_outputs = [
            queue_state,
            running_state,
            open_item_id,
            progress_html,
            queue_html,
            detail_header,
            queue_pick,
            transcribe_btn,
            cancel_btn,
            melody_only,
            remove_btn,
            clear_btn,
            status_out,
            abc_out,
            events_out,
            xml_out,
            mxl_out,
            preview_audio_out,
            files_out,
        ]

        def sync_pick_dropdown(queue_state: list[dict[str, Any]] | None) -> dict[str, Any]:
            items = _queue_from_state(queue_state)
            choices = _queue_choices(items)
            return gr.update(choices=choices, value=choices[-1][1] if choices else None)

        file_in.change(
            fn=add_files_handler,
            inputs=[queue_state, file_in],
            outputs=[queue_state, progress_html, queue_html],
        ).then(fn=sync_pick_dropdown, inputs=[queue_state], outputs=[queue_pick])

        mic_in.change(
            fn=add_mic_handler,
            inputs=[queue_state, mic_in],
            outputs=[queue_state, progress_html, queue_html],
        ).then(fn=sync_pick_dropdown, inputs=[queue_state], outputs=[queue_pick])

        remove_btn.click(
            fn=remove_handler,
            inputs=[queue_state, queue_pick],
            outputs=[queue_state, progress_html, queue_html],
        ).then(fn=sync_pick_dropdown, inputs=[queue_state], outputs=[queue_pick])
        clear_btn.click(
            fn=clear_finished_handler,
            inputs=[queue_state, queue_pick],
            outputs=[queue_state, progress_html, queue_html, queue_pick],
        )
        queue_pick.change(
            fn=select_result_handler,
            inputs=[queue_pick, queue_state],
            outputs=[detail_header, status_out, abc_out, events_out, xml_out, mxl_out, preview_audio_out, files_out],
        ).then(
            fn=lambda item_id: item_id,
            inputs=[queue_pick],
            outputs=[open_item_id],
        )

        cancel_btn.click(fn=request_cancel, inputs=[], outputs=[])

        transcribe_btn.click(
            fn=transcribe_queue_generator,
            inputs=[queue_state, melody_only, open_item_id],
            outputs=detail_outputs,
        )

        convert_btn.click(
            fn=convert_abc_handler,
            inputs=[abc_out, open_item_id],
            outputs=[xml_out, mxl_out, files_out],
        )

    return demo


def main() -> None:
    gr.set_static_paths(paths=[Path(__file__).resolve().parent])
    demo = build_ui()
    demo.queue(default_concurrency_limit=1)
    get_transcriber()
    demo.launch(server_name=HOST, server_port=PORT, show_error=True)


if __name__ == "__main__":
    main()
