"""Load SheetSage2 once and run transcription on CUDA."""
from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Optional

import torch
from transformers import AutoModel

from convert_abc import write_musicxml_and_mxl
from midi_preview import write_preview_wav

LAB_ROOT = Path(__file__).resolve().parent
MODEL_DIR = LAB_ROOT / "models" / "SheetSage2"
RUNS_DIR = LAB_ROOT / "runs"

_transcriber: Optional["SheetSageTranscriber"] = None


def require_cuda() -> str:
    if not torch.cuda.is_available():
        raise RuntimeError(
            "CUDA is not available. SheetSage2 trial lab requires an NVIDIA GPU "
            "(check nvidia-smi in WSL)."
        )
    return "cuda"


@dataclass
class TranscriptionResult:
    job_id: str
    output_dir: Path
    abc: str
    abc_error: Optional[str]
    events: Any
    musicxml_path: Optional[Path]
    mxl_path: Optional[Path]
    preview_wav_path: Optional[Path]
    midi_paths: list[Path]
    abc_path: Path
    events_path: Path


class SheetSageTranscriber:
    def __init__(self, model_dir: Path = MODEL_DIR) -> None:
        if not model_dir.is_dir() or not (model_dir / "config.json").is_file():
            raise FileNotFoundError(
                f"SheetSage2 snapshot not found at {model_dir}. Run ./setup.sh first."
            )
        self.device = require_cuda()
        self.model_dir = model_dir
        self.model = AutoModel.from_pretrained(
            str(model_dir),
            trust_remote_code=True,
            local_files_only=True,
        ).eval().to(self.device)

    def transcribe(
        self,
        audio_path: Path,
        *,
        max_seconds: float | None = None,
        melody_only: bool = False,
        progress: Callable[[dict[str, Any]], None] | None = None,
    ) -> TranscriptionResult:
        audio_path = Path(audio_path).resolve()
        if not audio_path.is_file():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        job_id = uuid.uuid4().hex[:12]
        output_dir = RUNS_DIR / job_id
        output_dir.mkdir(parents=True, exist_ok=True)

        options: dict[str, Any] = {"dtype": "bf16"}
        if max_seconds is not None:
            options["max_seconds"] = float(max_seconds)
        if melody_only:
            options["melody_only"] = True
        if progress is not None:
            options["progress"] = progress

        result = self.model.transcribe(str(audio_path), output_dir=str(output_dir), **options)

        abc = result.get("abc") or ""
        abc_error = result.get("abc_error")
        abc_path = output_dir / "score.abc"
        if abc and not abc_path.is_file():
            abc_path.write_text(abc, encoding="utf-8")

        events = result.get("events")
        events_path = output_dir / "events.json"
        if events is not None and not events_path.is_file():
            events_path.write_text(
                json.dumps(events, indent=2, ensure_ascii=False),
                encoding="utf-8",
            )
        elif events_path.is_file():
            events = json.loads(events_path.read_text(encoding="utf-8"))

        musicxml_path: Path | None = None
        mxl_path: Path | None = None
        if abc.strip():
            try:
                musicxml_path, mxl_path = write_musicxml_and_mxl(abc, output_dir)
            except (ValueError, RuntimeError, OSError):
                musicxml_path = None
                mxl_path = None

        midi_paths = sorted(output_dir.glob("*.mid"))
        preview_wav_path = write_preview_wav(output_dir)

        return TranscriptionResult(
            job_id=job_id,
            output_dir=output_dir,
            abc=abc,
            abc_error=abc_error,
            events=events,
            musicxml_path=musicxml_path,
            mxl_path=mxl_path,
            preview_wav_path=preview_wav_path,
            midi_paths=midi_paths,
            abc_path=abc_path,
            events_path=events_path,
        )


def get_transcriber() -> SheetSageTranscriber:
    global _transcriber
    if _transcriber is None:
        _transcriber = SheetSageTranscriber()
    return _transcriber
