# SheetSage2 trial lab

Standalone **local GPU** workspace to try [SheetSage2](https://huggingface.co/m-a-p/SheetSage2): full-length audio → ABC/MIDI/events, ABC → MusicXML/MXL, and a MIDI audio preview in Gradio. **Not** part of the ClearClef Next.js app.

## What it does

| Step | Output |
| --- | --- |
| SheetSage2 inference | `score.abc`, `transcription.mid`, `events.json`, split MIDIs |
| abc2xml | `score.musicxml`, `score.mxl` |
| pretty_midi synth | `preview.wav` (when MIDI has notes) |

- **Transcription preview** in the UI plays the synthesized MIDI (not MXL).
- **score.mxl** is for visual review in MuseScore or ClearClef `/admin/upload`.

There is **no max-seconds clip** in the Gradio UI or default Python API: the full uploaded file is transcribed (SheetSage2 uses overlapping windows for long songs). Expect longer runs and higher VRAM use on full tracks.

## Layout

```
tools/sheetsage2-lab/
  app.py              # Gradio UI
  transcribe.py       # load model once, run inference
  convert_abc.py      # ABC → MusicXML + MXL
  midi_preview.py     # MIDI → preview.wav
  setup.sh            # uv venv, CUDA torch, weights, Gradio
  vendor/abc2xml.py   # vendored converter (rev 268)
  models/             # SheetSage2 snapshot (gitignored)
  runs/               # per-job outputs (gitignored)
```

## Prerequisites

- WSL2 Linux with NVIDIA driver + CUDA (`nvidia-smi` shows your GPU)
- [uv](https://docs.astral.sh/uv/) on `PATH`
- FFmpeg (`ffmpeg -version`)
- Hugging Face access to **both** `m-a-p/SheetSage2` and `m-a-p/MERT-v2-FullSong`

```bash
uv tool run --from huggingface-hub==0.36.0 huggingface-cli login
```

## One-time setup

```bash
cd tools/sheetsage2-lab
chmod +x setup.sh
./setup.sh
```

Install order (handled by `setup.sh`): CUDA PyTorch → snapshot `requirements.txt` → Gradio → re-pin `huggingface-hub==0.36.0`. Do **not** run `uv sync` afterward; it can replace GPU torch with CPU wheels from PyPI.

Large CUDA wheels may take 15–20 minutes on first install. If downloads time out, re-run `./setup.sh` or set `UV_HTTP_TIMEOUT=600`.

The first transcription also downloads **MERT-v2-FullSong** into your Hugging Face cache (~1–2 GB) unless already cached.

Weights and venv live under `models/` and `.venv/` (gitignored).

## Smoke test (official CLI)

Use a **licensed** clip you own:

```bash
cd tools/sheetsage2-lab
uv run --no-sync python models/SheetSage2/infer.py /path/to/clip.mp3 \
  --output runs/smoke --dtype bf16
uv run --no-sync python convert_abc.py runs/smoke/score.abc
```

Optional CLI clip for a quick try: add `--max-seconds 30` to `infer.py` only.

Use `uv run --no-sync` so the lab venv is not re-resolved against `pyproject.toml` (which would upgrade `huggingface-hub` and break `transformers==4.45.2`).

Expect `runs/smoke/score.abc`, MIDI files, `events.json`, `score.musicxml`, `score.mxl`, and `preview.wav` (when MIDI is present).

## Trial UI (Gradio)

```bash
cd tools/sheetsage2-lab
uv run --no-sync python app.py
```

Open [http://127.0.0.1:7860](http://127.0.0.1:7860). Upload audio, transcribe, then:

- **Transcription preview** (Files tab) — `transcription.mid` → `preview.wav`.
- **score.mxl** — MuseScore or ClearClef `/admin/upload`.

Also: ABC / MIDI / MusicXML downloads. Editing ABC and re-converting does not refresh audio; transcribe again to update MIDI/WAV.

The model loads once at startup (may take a minute). One transcription runs at a time.

## License note

SheetSage2 weights are [CC BY-NC 4.0](https://huggingface.co/m-a-p/SheetSage2). Trial and evaluation only unless you obtain a commercial license.

## Optional: ClearClef check

Upload `score.mxl` manually via ClearClef `/admin/upload` to see Verovio engraving. No automated hook in v1.
