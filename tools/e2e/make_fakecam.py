"""Builds fakecam.mjpeg (Chrome fake camera feed) from an OCR fixture."""
import io
from pathlib import Path
from PIL import Image

here = Path(__file__).parent
src = Image.open(here / "../ocr-eval/fixtures/09-geometry-vi.jpg").convert("RGB")
frame = Image.new("RGB", (720, 1280), (120, 110, 100))
w = 680
h = int(src.height * w / src.width)
frame.paste(src.resize((w, h)), (20, (1280 - h) // 2))
buf = io.BytesIO()
frame.save(buf, "JPEG", quality=90)
(here / "fakecam.mjpeg").write_bytes(buf.getvalue() * 30)
