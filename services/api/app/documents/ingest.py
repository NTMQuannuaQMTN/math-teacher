"""Secure file inspection and page rendering.

Type detection uses magic bytes, never the client-supplied filename or Content-Type.
"""

from __future__ import annotations

import hashlib
import io
import warnings
from dataclasses import dataclass
from typing import Literal

from PIL import Image, ImageOps, UnidentifiedImageError

from ..errors import AppError, UnsupportedMedia

FileKind = Literal["jpeg", "png", "webp", "pdf"]

CONTENT_TYPES: dict[FileKind, str] = {
    "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp", "pdf": "application/pdf",
}


class InvalidDocument(AppError):
    status_code = 422
    code = "invalid_document"
    message = "Không đọc được tệp. Tệp có thể bị hỏng."


def detect_kind(data: bytes) -> FileKind:
    if data.startswith(b"\xff\xd8\xff"):
        return "jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    if data[:1024].lstrip().startswith(b"%PDF-"):
        return "pdf"
    if len(data) >= 12 and data[4:8] == b"ftyp" and data[8:12] in (b"heic", b"heix", b"mif1", b"heif"):
        raise UnsupportedMedia("Ảnh HEIC chưa được hỗ trợ. Hãy chuyển sang JPG hoặc chụp màn hình rồi tải lên.")
    raise UnsupportedMedia()


@dataclass(frozen=True)
class FileInfo:
    kind: FileKind
    content_type: str
    sha256: str
    page_count: int


@dataclass(frozen=True)
class RenderedPage:
    page_number: int
    data: bytes
    mime_type: str
    width: int
    height: int
    sha256: str


def _open_image(data: bytes, max_pixels: int) -> Image.Image:
    with warnings.catch_warnings():
        warnings.simplefilter("error", Image.DecompressionBombWarning)
        try:
            probe = Image.open(io.BytesIO(data))
            width, height = probe.size
            if width * height > max_pixels:
                raise InvalidDocument("Ảnh có độ phân giải quá lớn.", code="image_too_large")
            probe.verify()
            image = Image.open(io.BytesIO(data))
            image.load()
        except (UnidentifiedImageError, OSError, SyntaxError, Image.DecompressionBombError,
                Image.DecompressionBombWarning) as exc:
            raise InvalidDocument() from exc
    if getattr(image, "n_frames", 1) > 1:
        image.seek(0)
    return image


def inspect_file(data: bytes, *, max_pdf_pages: int, max_image_pixels: int) -> FileInfo:
    if not data:
        raise InvalidDocument("Tệp rỗng.", code="empty_file")
    kind = detect_kind(data)
    digest = hashlib.sha256(data).hexdigest()
    if kind == "pdf":
        pages = _pdf_page_count(data)
        if pages == 0:
            raise InvalidDocument("Tệp PDF không có trang nào.", code="empty_pdf")
        if pages > max_pdf_pages:
            raise InvalidDocument(f"Tệp PDF có {pages} trang, tối đa {max_pdf_pages} trang.", code="too_many_pages")
        return FileInfo(kind=kind, content_type=CONTENT_TYPES[kind], sha256=digest, page_count=pages)
    _open_image(data, max_image_pixels)
    return FileInfo(kind=kind, content_type=CONTENT_TYPES[kind], sha256=digest, page_count=1)


def _pdf_open(data: bytes):  # type: ignore[no-untyped-def]
    import pypdfium2 as pdfium

    try:
        return pdfium.PdfDocument(data)
    except pdfium.PdfiumError as exc:
        if "password" in str(exc).lower():
            raise InvalidDocument("Tệp PDF có mật khẩu. Hãy gỡ mật khẩu rồi tải lại.", code="encrypted_pdf") from exc
        raise InvalidDocument() from exc


def _pdf_page_count(data: bytes) -> int:
    pdf = _pdf_open(data)
    try:
        return len(pdf)
    finally:
        pdf.close()


def _fit(image: Image.Image, max_side: int) -> Image.Image:
    if max(image.size) <= max_side:
        return image
    scale = max_side / max(image.size)
    return image.resize((max(1, round(image.width * scale)), max(1, round(image.height * scale))),
                        Image.Resampling.LANCZOS)


def _encode(image: Image.Image, fmt: Literal["PNG", "JPEG"]) -> tuple[bytes, str]:
    buffer = io.BytesIO()
    if fmt == "PNG":
        image.save(buffer, format="PNG", optimize=True)
        return buffer.getvalue(), "image/png"
    image.save(buffer, format="JPEG", quality=90, optimize=True)
    return buffer.getvalue(), "image/jpeg"


def _page(number: int, image: Image.Image, fmt: Literal["PNG", "JPEG"]) -> RenderedPage:
    data, mime = _encode(image, fmt)
    return RenderedPage(page_number=number, data=data, mime_type=mime, width=image.width, height=image.height,
                        sha256=hashlib.sha256(data).hexdigest())


def render_pages(data: bytes, kind: FileKind, *, max_side: int, pdf_scale: float, max_image_pixels: int
                 ) -> list[RenderedPage]:
    """Normalise the upload into page images: orientation fixed, metadata stripped, size bounded."""
    if kind != "pdf":
        image = _open_image(data, max_image_pixels)
        image = ImageOps.exif_transpose(image) or image
        if image.mode not in ("RGB", "L"):
            background = Image.new("RGB", image.size, "white")
            rgba = image.convert("RGBA")
            background.paste(rgba, mask=rgba.split()[-1])
            image = background
        image = _fit(image.convert("RGB"), max_side)
        # Screenshots of rendered LaTeX compress well and stay sharp as PNG; photos use JPEG.
        return [_page(1, image, "PNG" if kind == "png" else "JPEG")]

    pdf = _pdf_open(data)
    pages: list[RenderedPage] = []
    try:
        for index in range(len(pdf)):
            page = pdf[index]
            try:
                width, height = page.get_size()
                scale = min(pdf_scale, max_side / max(width, height, 1))
                bitmap = page.render(scale=scale)
                image = bitmap.to_pil().convert("RGB")
            finally:
                page.close()
            pages.append(_page(index + 1, _fit(image, max_side), "PNG"))
    finally:
        pdf.close()
    return pages


def crop_region(page: bytes, bbox: tuple[float, float, float, float], pad: float = 0.01) -> bytes:
    """Crop a normalised [0,1] bbox (x0, y0, x1, y1) out of a page image and return PNG bytes."""
    image = Image.open(io.BytesIO(page))
    x0, y0, x1, y1 = bbox
    left = max(0, int((x0 - pad) * image.width))
    top = max(0, int((y0 - pad) * image.height))
    right = min(image.width, int((x1 + pad) * image.width) + 1)
    bottom = min(image.height, int((y1 + pad) * image.height) + 1)
    data, _ = _encode(image.crop((left, top, right, bottom)).convert("RGB"), "PNG")
    return data
