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
- [faad](https://packages.debian.org/faad) for Nero AAC files that ffmpeg cannot decode (`sudo apt install faad`). These often arrive as `.mp3` but are M4A/AAC from the Nero encoder.
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

Install order (handled by `setup.sh`): CUDA PyTorch → snapshot `requirements.txt` → Gradio → re-pin `huggingface-hub==0.36.2` and `numpy==1.26.4`. Never run `uv sync`: it prunes everything installed outside `pyproject.toml`, including the CUDA PyTorch wheels and the model's own requirements. `uv run` is safe (it updates only `pyproject.toml` dependencies and never prunes), and the pins in `pyproject.toml` keep it from upgrading `huggingface-hub`/`numpy` past what `transformers==4.45.2` and `scipy==1.13.1` accept.

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

Plain `uv run` works too: `pyproject.toml` pins `huggingface-hub<1` and `numpy<2.3`, so syncing cannot break `transformers==4.45.2`. `--no-sync` just skips the (no-op) check.

Expect `runs/smoke/score.abc`, MIDI files, `events.json`, `score.musicxml`, `score.mxl`, and `preview.wav` (when MIDI is present).

## Trial UI (Gradio)

```bash
cd tools/sheetsage2-lab
uv run app.py
```

Open [http://127.0.0.1:7860](http://127.0.0.1:7860).

### Queue several files

1. **Add audio files** (multi-select) or **Add a recording** (microphone). Each upload appends to the queue; duplicates are ignored.
2. Optionally remove **queued** rows with **Remove selected** (pick the row in **Select in queue**). **Clear finished** drops done and failed rows.
3. Click **Transcribe queue**. The GPU processes **one file at a time**; the batch progress bar shows overall position and the active encoding window.
4. When a file finishes, the **Selected score** pane opens that result automatically. Use **Select in queue** to switch between finished (or failed) jobs.

Per file:

- **Transcription preview** (Files tab) — `transcription.mid` → `preview.wav`.
- **score.mxl** — MuseScore or ClearClef `/admin/upload`.

Also: ABC / MIDI / MusicXML downloads. **Convert ABC → MusicXML** writes into the **currently open** job only. Editing ABC and re-converting does not refresh audio; transcribe again to update MIDI/WAV.

If one file fails, the error appears on that queue row and the batch continues with the next file.

**Cancel** stops the batch after the file currently on the GPU finishes. Remaining **queued** files are left in the queue so you can run **Transcribe queue** again.

### Output on disk

Each successful job writes under `tools/sheetsage2-lab/runs/<audio-filename>/` (gitignored), using the upload’s basename without extension (for example `runs/prelude/` for `prelude.m4a`). If that folder already exists, the lab uses `prelude_2`, `prelude_3`, and so on. Expect `score.abc`, `score.mxl`, MIDI files, `events.json`, and `preview.wav`. The UI shows the repo-relative path on finished queue rows and in the status line; the absolute path is also listed there.

Non-WAV/FLAC/AIFF uploads are transcoded to `source.wav` in that folder first. ffmpeg tries a salvage decode, then the lab falls back to `faad` when ffmpeg only recovers a fraction of a second (typical of Nero AAC). Each attempt is appended to `decode.log` in the same folder.

The model loads once at startup (may take a minute). Only one transcription runs at a time on the GPU.

## License note

SheetSage2 weights are [CC BY-NC 4.0](https://huggingface.co/m-a-p/SheetSage2). Trial and evaluation only unless you obtain a commercial license.

## Optional: ClearClef check

Upload `score.mxl` manually via ClearClef `/admin/upload` to see Verovio engraving. No automated hook in v1.
