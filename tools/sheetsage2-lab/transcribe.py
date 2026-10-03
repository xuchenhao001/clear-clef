"""Load SheetSage2 once and run transcription on CUDA."""
from __future__ import annotations

import json
import re
import shutil
import subprocess
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
_PCM_SUFFIXES = frozenset({".wav", ".flac", ".aif", ".aiff"})
# ~1s of 16-bit mono at 44.1 kHz
_MIN_SALVAGE_WAV_BYTES = 88_200

_transcriber: Optional["SheetSageTranscriber"] = None


def job_output_display_path(job_id: str) -> str:
    return f"tools/sheetsage2-lab/runs/{job_id}"


_UNSAFE_JOB_NAME = re.compile(r'[<>:"/\\|?*\x00]')


def _sanitize_job_folder_name(stem: str) -> str:
    name = stem.strip()
    if not name:
        return "audio"
    name = _UNSAFE_JOB_NAME.sub("_", name).strip(". ")
    return name[:200] if name else "audio"


def allocate_output_dir(audio_path: Path) -> tuple[str, Path]:
    """Pick runs/<audio-stem>/; add _2, _3, … if that folder already exists."""
    base = _sanitize_job_folder_name(audio_path.stem)
    job_id = base
    output_dir = RUNS_DIR / job_id
    suffix = 2
    while output_dir.exists():
        job_id = f"{base}_{suffix}"
        output_dir = RUNS_DIR / job_id
        suffix += 1
        if suffix > 9999:
            job_id = f"{base}_{uuid.uuid4().hex[:6]}"
            output_dir = RUNS_DIR / job_id
            break
    output_dir.mkdir(parents=True, exist_ok=True)
    return job_id, output_dir


def _first_ffmpeg_error(stderr: str) -> str:
    for line in stderr.splitlines():
        stripped = line.strip()
        if stripped:
            return stripped[:200]
    return "ffmpeg could not decode this audio file"


def _pcm_usable(path: Path) -> bool:
    return path.is_file() and path.stat().st_size >= _MIN_SALVAGE_WAV_BYTES


def _salvage_decode_flags() -> list[str]:
    return [
        "-fflags",
        "+discardcorrupt",
        "-err_detect",
        "ignore_err",
        "-max_error_rate",
        "1",
    ]


def _ffmpeg_decode_to_pcm(
    input_path: Path,
    pcm_dest: Path,
    *,
    use_aac_fixed: bool,
) -> subprocess.CompletedProcess[str]:
    cmd = [
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        *_salvage_decode_flags(),
    ]
    if use_aac_fixed:
        cmd.extend(["-c:a", "aac_fixed"])
    cmd.extend(
        [
            "-i",
            str(input_path),
            "-vn",
            "-ac",
            "1",
            "-ar",
            "44100",
            "-f",
            "s16le",
            str(pcm_dest),
        ]
    )
    return subprocess.run(cmd, capture_output=True, text=True, check=False)


def _extract_aac_elementary(audio_path: Path, dest: Path) -> bool:
    cmd = [
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(audio_path),
        "-vn",
        "-c:a",
        "copy",
        str(dest),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, check=False)
    return proc.returncode == 0 and dest.is_file() and dest.stat().st_size > 0


def _wrap_pcm_to_wav(pcm_path: Path, wav_path: Path) -> bool:
    if wav_path.is_file():
        wav_path.unlink()
    cmd = [
        "ffmpeg",
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "s16le",
        "-ar",
        "44100",
        "-ac",
        "1",
        "-i",
        str(pcm_path),
        str(wav_path),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, check=False)
    return proc.returncode == 0 and _pcm_usable(wav_path)


def _append_decode_log(output_dir: Path, text: str) -> None:
    log_path = output_dir / "decode.log"
    with log_path.open("a", encoding="utf-8") as handle:
        handle.write(text)
        if not text.endswith("\n"):
            handle.write("\n")


def _log_process(
    output_dir: Path,
    title: str,
    proc: subprocess.CompletedProcess[str],
    extra: str = "",
) -> None:
    stderr = (proc.stderr or proc.stdout or "").strip()
    if len(stderr) > 8000:
        stderr = stderr[:8000] + "\n…(truncated)"
    _append_decode_log(
        output_dir,
        f"=== {title} ===\nexit {proc.returncode}\n{extra}{stderr}\n",
    )


def _probe_audio(audio_path: Path) -> str:
    proc = subprocess.run(
        [
            "ffprobe",
            "-hide_banner",
            "-show_entries",
            "format=format_name,duration,bit_rate:format_tags=encoder,major_brand",
            "-show_entries",
            "stream=codec_name,profile,sample_rate,channels",
            "-of",
            "default=noprint_wrappers=1",
            str(audio_path),
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    return ((proc.stdout or "") + (proc.stderr or "")).strip()


def _faad_to_wav(audio_path: Path, wav_dest: Path) -> subprocess.CompletedProcess[str] | None:
    faad = shutil.which("faad")
    if not faad:
        return None
    if wav_dest.is_file():
        wav_dest.unlink()
    return subprocess.run(
        [faad, "-o", str(wav_dest), str(audio_path)],
        capture_output=True,
        text=True,
        check=False,
    )


def prepare_audio_for_model(audio_path: Path, output_dir: Path) -> Path:
    """Transcode compressed or problematic audio to mono WAV for SheetSage2."""
    if audio_path.suffix.lower() in _PCM_SUFFIXES:
        return audio_path

    log_path = output_dir / "decode.log"
    if log_path.is_file():
        log_path.unlink()
    _append_decode_log(output_dir, _probe_audio(audio_path) + "\n")

    pcm_dest = output_dir / "source.pcm"
    wav_dest = output_dir / "source.wav"
    elem_dest = output_dir / "source.aac"
    last_err = ""

    def try_decode(input_path: Path, *, use_aac_fixed: bool, title: str) -> bool:
        nonlocal last_err
        if pcm_dest.is_file():
            pcm_dest.unlink()
        if wav_dest.is_file():
            wav_dest.unlink()
        proc = _ffmpeg_decode_to_pcm(input_path, pcm_dest, use_aac_fixed=use_aac_fixed)
        pcm_bytes = pcm_dest.stat().st_size if pcm_dest.is_file() else 0
        last_err = proc.stderr or proc.stdout or last_err
        _log_process(output_dir, title, proc, extra=f"pcm_bytes {pcm_bytes}\n")
        if not _pcm_usable(pcm_dest):
            if pcm_dest.is_file():
                pcm_dest.unlink()
            return False
        if not _wrap_pcm_to_wav(pcm_dest, wav_dest):
            if wav_dest.is_file():
                wav_dest.unlink()
            return False
        _append_decode_log(output_dir, f"{title}: wrote {wav_dest.name}\n")
        return True

    if try_decode(audio_path, use_aac_fixed=False, title="ffmpeg native"):
        return wav_dest

    if _extract_aac_elementary(audio_path, elem_dest):
        _append_decode_log(output_dir, f"extracted {elem_dest.name}\n")
        if try_decode(elem_dest, use_aac_fixed=False, title="ffmpeg native elementary"):
            return wav_dest
        if try_decode(elem_dest, use_aac_fixed=True, title="ffmpeg aac_fixed"):
            return wav_dest

    faad_proc = _faad_to_wav(audio_path, wav_dest)
    if faad_proc is None:
        _append_decode_log(
            output_dir,
            "faad not on PATH. Nero AAC in an M4A container (often named .mp3) "
            "needs faad; ffmpeg stops after the first bad data-stream element.\n",
        )
        raise RuntimeError(
            "ffmpeg cannot decode this Nero AAC file. "
            "Install faad (`sudo apt install faad`) and run the queue again. "
            f"See {output_dir / 'decode.log'}"
        )
    wav_bytes = wav_dest.stat().st_size if wav_dest.is_file() else 0
    _log_process(output_dir, "faad", faad_proc, extra=f"wav_bytes {wav_bytes}\n")
    if _pcm_usable(wav_dest):
        return wav_dest
    if wav_dest.is_file():
        wav_dest.unlink()
    raise RuntimeError(_first_ffmpeg_error(last_err or faad_proc.stderr or faad_proc.stdout))


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

        job_id, output_dir = allocate_output_dir(audio_path)

        options: dict[str, Any] = {"dtype": "bf16"}
        if max_seconds is not None:
            options["max_seconds"] = float(max_seconds)
        if melody_only:
            options["melody_only"] = True
        if progress is not None:
            options["progress"] = progress

        model_audio = prepare_audio_for_model(audio_path, output_dir)
        result = self.model.transcribe(
            str(model_audio), output_dir=str(output_dir), **options
        )

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
