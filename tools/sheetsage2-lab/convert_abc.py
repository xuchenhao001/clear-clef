"""Convert ABC notation to MusicXML using vendored abc2xml."""
from __future__ import annotations

import argparse
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

LAB_ROOT = Path(__file__).resolve().parent
ABC2XML = LAB_ROOT / "vendor" / "abc2xml.py"


def abc_to_musicxml(abc_text: str) -> str:
    if not abc_text or not abc_text.strip():
        raise ValueError("ABC text is empty")

    if not ABC2XML.is_file():
        raise FileNotFoundError(
            f"Missing {ABC2XML}. Run ./setup.sh to download vendor/abc2xml.py."
        )

    with tempfile.NamedTemporaryFile(
        mode="w",
        suffix=".abc",
        encoding="utf-8",
        delete=False,
    ) as tmp:
        tmp.write(abc_text)
        abc_path = Path(tmp.name)

    try:
        proc = subprocess.run(
            [sys.executable, str(ABC2XML), str(abc_path)],
            capture_output=True,
            text=True,
            check=False,
        )
    finally:
        abc_path.unlink(missing_ok=True)

    if proc.returncode != 0:
        stderr = (proc.stderr or proc.stdout or "").strip()
        raise RuntimeError(f"abc2xml failed: {stderr or 'unknown error'}")

    xml = proc.stdout
    if not xml or not xml.strip():
        raise RuntimeError("abc2xml produced empty MusicXML")

    return xml


def write_musicxml(abc_text: str, out_path: Path) -> Path:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    xml = abc_to_musicxml(abc_text)
    out_path.write_text(xml, encoding="utf-8")
    return out_path


MXL_ROOT_ENTRY = "score.musicxml"

_CONTAINER_XML = f"""<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="{MXL_ROOT_ENTRY}" media-type="application/vnd.recordare.musicxml+xml"/>
  </rootfiles>
</container>
"""


def write_mxl_from_musicxml(musicxml_path: Path, mxl_path: Path | None = None) -> Path:
    """Package uncompressed MusicXML into a standard .mxl zip for MuseScore / ClearClef."""
    musicxml_path = musicxml_path.resolve()
    if not musicxml_path.is_file():
        raise FileNotFoundError(f"MusicXML not found: {musicxml_path}")

    mxl_path = (mxl_path or musicxml_path.with_suffix(".mxl")).resolve()
    mxl_path.parent.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(mxl_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("META-INF/container.xml", _CONTAINER_XML)
        archive.write(musicxml_path, arcname=MXL_ROOT_ENTRY)

    return mxl_path


def write_musicxml_and_mxl(abc_text: str, output_dir: Path) -> tuple[Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    musicxml_path = output_dir / "score.musicxml"
    mxl_path = output_dir / "score.mxl"
    write_musicxml(abc_text, musicxml_path)
    write_mxl_from_musicxml(musicxml_path, mxl_path)
    return musicxml_path, mxl_path


def main() -> None:
    parser = argparse.ArgumentParser(description="ABC file or stdin → MusicXML file")
    parser.add_argument(
        "abc",
        type=Path,
        help="Path to .abc file (writes score.musicxml alongside unless -o is set)",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        help="Output .musicxml path (default: <abc_dir>/score.musicxml)",
    )
    args = parser.parse_args()

    abc_text = args.abc.read_text(encoding="utf-8")
    out = args.output or args.abc.parent / "score.musicxml"
    write_musicxml(abc_text, out)
    mxl = write_mxl_from_musicxml(out)
    print(out.resolve())
    print(mxl.resolve())


if __name__ == "__main__":
    main()
