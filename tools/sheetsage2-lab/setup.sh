#!/usr/bin/env bash
# SheetSage2 local lab: uv venv, CUDA PyTorch, gated weights, Gradio.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

UV="${UV:-}"
if [[ -z "$UV" ]]; then
  if command -v uv >/dev/null 2>&1; then
    UV=uv
  elif [[ -x "${HOME}/.local/bin/uv" ]]; then
    UV="${HOME}/.local/bin/uv"
  else
    echo "uv not found. Install: curl -LsSf https://astral.sh/uv/install.sh | sh" >&2
    exit 1
  fi
fi

export PATH="${HOME}/.local/bin:${HOME}/.cargo/bin:${PATH}"

ABC2XML_ZIP="https://wim.vree.org/svgParse/abc2xml.py-268.zip"
mkdir -p vendor models runs
if [[ ! -f vendor/abc2xml.py ]]; then
  echo "Downloading abc2xml (revision 268 zip)…"
  tmp_zip="$(mktemp)"
  curl -fsSL -o "$tmp_zip" "$ABC2XML_ZIP"
  python3 - "$tmp_zip" <<'PY'
import sys
import zipfile
from pathlib import Path

zip_path = Path(sys.argv[1])
out = Path("vendor/abc2xml.py")
with zipfile.ZipFile(zip_path) as zf:
    name = next(n for n in zf.namelist() if n.endswith("/abc2xml.py"))
    out.write_bytes(zf.read(name))
print(out.resolve())
PY
  rm -f "$tmp_zip"
fi

"$UV" python pin 3.11
if [[ ! -d .venv ]]; then
  "$UV" venv --python 3.11
fi

echo "Installing CUDA PyTorch 2.8 (cu126)…"
"$UV" pip install torch==2.8.0 torchaudio==2.8.0 \
  --index-url https://download.pytorch.org/whl/cu126

MODEL_DIR="models/SheetSage2"
if [[ ! -f "${MODEL_DIR}/config.json" ]]; then
  echo "Downloading m-a-p/SheetSage2 (gated — ensure huggingface-cli login)…"
  "$UV" tool run --from huggingface-hub==0.36.0 huggingface-cli download \
    m-a-p/SheetSage2 --local-dir "${MODEL_DIR}"
else
  echo "Using existing ${MODEL_DIR}"
fi

echo "Installing SheetSage2 snapshot requirements…"
"$UV" pip install -r "${MODEL_DIR}/requirements.txt"

echo "Installing lab UI (Gradio)…"
"$UV" pip install 'gradio>=5.26,<6'

# Gradio can upgrade huggingface-hub; SheetSage2 pins transformers 4.45.2.
echo "Re-pinning huggingface-hub for transformers compatibility…"
"$UV" pip install huggingface-hub==0.36.0

if command -v git >/dev/null 2>&1 && [[ -d "${MODEL_DIR}/.git" ]]; then
  git -C "${MODEL_DIR}" rev-parse HEAD > REVISION.txt 2>/dev/null || true
fi
if [[ ! -f REVISION.txt ]] && [[ -f "${MODEL_DIR}/config.json" ]]; then
  date -u +"%Y-%m-%dT%H:%M:%SZ snapshot at ${MODEL_DIR}" > REVISION.txt
fi

echo ""
echo "Setup complete."
echo "  Smoke test:  uv run --no-sync python models/SheetSage2/infer.py /path/to/clip.mp3 --output runs/smoke --dtype bf16"
echo "  Trial UI:    uv run --no-sync python app.py  →  http://127.0.0.1:7860"
echo "  HF login:    uv tool run --from huggingface-hub==0.36.0 huggingface-cli login"
