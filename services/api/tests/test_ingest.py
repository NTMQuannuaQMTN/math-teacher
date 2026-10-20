from __future__ import annotations

import io

import pytest
from PIL import Image

from app.documents.ingest import InvalidDocument, crop_region, detect_kind, inspect_file, render_pages
from app.errors import UnsupportedMedia
from tests.conftest import fixture_bytes


def png(width: int = 200, height: int = 100, mode: str = "RGB") -> bytes:
    buffer = io.BytesIO()
    Image.new(mode, (width, height), "white").save(buffer, format="PNG")
    return buffer.getvalue()


def test_detect_kinds() -> None:
    assert detect_kind(png()) == "png"
    assert detect_kind(fixture_bytes("ocr/images/synthetic_exam.pdf")) == "pdf"
    buffer = io.BytesIO()
    Image.new("RGB", (10, 10)).save(buffer, format="JPEG")
    assert detect_kind(buffer.getvalue()) == "jpeg"
    buffer = io.BytesIO()
    Image.new("RGB", (10, 10)).save(buffer, format="WEBP")
    assert detect_kind(buffer.getvalue()) == "webp"


@pytest.mark.parametrize("data", [b"GIF89a....", b"<svg xmlns='http://www.w3.org/2000/svg'/>", b"MZ\x90\x00", b"hello"])
def test_rejects_unsupported(data: bytes) -> None:
    with pytest.raises(UnsupportedMedia):
        detect_kind(data)


def test_heic_has_specific_message() -> None:
    with pytest.raises(UnsupportedMedia, match="HEIC"):
        detect_kind(b"\x00\x00\x00\x18ftypheic\x00\x00\x00\x00")


def test_renamed_file_is_detected_by_content() -> None:
    # A PDF "named" .png is still treated as a PDF: type comes from bytes only.
    info = inspect_file(fixture_bytes("ocr/images/synthetic_exam.pdf"), max_pdf_pages=20, max_image_pixels=10**8)
    assert info.kind == "pdf" and info.page_count == 2


def test_truncated_image_rejected() -> None:
    data = png()[:60]
    with pytest.raises(InvalidDocument):
        inspect_file(data, max_pdf_pages=5, max_image_pixels=10**8)


def test_pixel_bomb_rejected() -> None:
    with pytest.raises(InvalidDocument, match="độ phân giải"):
        inspect_file(png(5000, 5000, mode="1"), max_pdf_pages=5, max_image_pixels=1_000_000)


def test_encrypted_pdf_rejected() -> None:
    with pytest.raises(InvalidDocument) as excinfo:
        inspect_file(fixture_bytes("ocr/images/encrypted.pdf"), max_pdf_pages=5, max_image_pixels=10**8)
    assert excinfo.value.code == "encrypted_pdf"


def test_page_limit() -> None:
    with pytest.raises(InvalidDocument) as excinfo:
        inspect_file(fixture_bytes("ocr/images/synthetic_exam.pdf"), max_pdf_pages=1, max_image_pixels=10**8)
    assert excinfo.value.code == "too_many_pages"


def test_render_pdf_pages() -> None:
    pages = render_pages(fixture_bytes("ocr/images/synthetic_exam.pdf"), "pdf", max_side=1600, pdf_scale=2.0,
                         max_image_pixels=10**8)
    assert [p.page_number for p in pages] == [1, 2]
    assert all(max(p.width, p.height) <= 1600 and p.mime_type == "image/png" for p in pages)
    assert pages[0].sha256 != pages[1].sha256


def test_render_image_fixes_exif_orientation_and_strips_metadata() -> None:
    image = Image.new("RGB", (300, 100), "white")
    exif = image.getexif()
    exif[0x0112] = 6  # rotate 90° CW on display
    exif[0x010F] = "SecretCam"
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", exif=exif.tobytes())
    (page,) = render_pages(buffer.getvalue(), "jpeg", max_side=2000, pdf_scale=2, max_image_pixels=10**8)
    assert (page.width, page.height) == (100, 300)
    assert not Image.open(io.BytesIO(page.data)).getexif()


def test_render_downscales_large_images() -> None:
    (page,) = render_pages(png(4000, 1000), "png", max_side=2000, pdf_scale=2, max_image_pixels=10**8)
    assert (page.width, page.height) == (2000, 500)


def test_transparent_png_flattened_on_white() -> None:
    (page,) = render_pages(png(10, 10, mode="RGBA"), "png", max_side=2000, pdf_scale=2, max_image_pixels=10**8)
    assert Image.open(io.BytesIO(page.data)).mode == "RGB"


def test_crop_region() -> None:
    crop = crop_region(png(1000, 1000), (0.1, 0.1, 0.3, 0.5), pad=0)
    assert Image.open(io.BytesIO(crop)).size == (201, 401)
