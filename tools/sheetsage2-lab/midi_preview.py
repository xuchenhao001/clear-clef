"""Synthesize SheetSage2 MIDI outputs to WAV for Gradio playback."""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pretty_midi
from scipy.io import wavfile

PREVIEW_MIDI_CANDIDATES = ("transcription.mid", "melody.mid")


def pick_preview_midi(output_dir: Path) -> Path | None:
    output_dir = output_dir.resolve()
    for name in PREVIEW_MIDI_CANDIDATES:
        path = output_dir / name
        if path.is_file() and path.stat().st_size > 0:
            return path
    for path in sorted(output_dir.glob("*.mid")):
        if path.stat().st_size > 0:
            return path
    return None


def synthesize_midi_to_wav(
    midi_path: Path,
    wav_path: Path,
    sample_rate: int = 22050,
) -> Path:
    midi_path = midi_path.resolve()
    if not midi_path.is_file():
        raise FileNotFoundError(f"MIDI not found: {midi_path}")
    if midi_path.stat().st_size == 0:
        raise ValueError(f"MIDI file is empty: {midi_path}")

    midi = pretty_midi.PrettyMIDI(str(midi_path))
    if not midi.instruments and midi.get_end_time() <= 0:
        raise ValueError(f"MIDI contains no playable notes: {midi_path}")

    audio = midi.synthesize(fs=sample_rate)
    if audio.size == 0:
        raise ValueError(f"MIDI synthesis produced no audio: {midi_path}")

    peak = float(np.max(np.abs(audio)))
    if peak > 0:
        audio = audio / peak * 0.95

    wav_path = wav_path.resolve()
    wav_path.parent.mkdir(parents=True, exist_ok=True)
    wavfile.write(wav_path, sample_rate, np.clip(audio, -1.0, 1.0))

    return wav_path


def write_preview_wav(output_dir: Path, wav_name: str = "preview.wav") -> Path | None:
    midi_path = pick_preview_midi(output_dir)
    if midi_path is None:
        return None
    try:
        return synthesize_midi_to_wav(midi_path, output_dir / wav_name)
    except (OSError, ValueError):
        return None
