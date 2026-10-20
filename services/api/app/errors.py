"""Consistent error responses. Every user-visible message is Vietnamese."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

from .logging_setup import request_id_var

logger = logging.getLogger(__name__)


class ErrorBody(BaseModel):
    code: str
    message: str
    request_id: str | None = None
    details: Any = None


class ErrorResponse(BaseModel):
    error: ErrorBody


class AppError(Exception):
    """Domain error carrying an HTTP status, a stable code and a Vietnamese message."""

    status_code = 400
    code = "bad_request"
    message = "Yêu cầu không hợp lệ."

    def __init__(self, message: str | None = None, *, details: Any = None, code: str | None = None) -> None:
        super().__init__(message or self.message)
        if message:
            self.message = message
        if code:
            self.code = code
        self.details = details


class NotFound(AppError):
    status_code = 404
    code = "not_found"
    message = "Không tìm thấy dữ liệu."


class Unauthorized(AppError):
    status_code = 401
    code = "unauthorized"
    message = "Bạn cần đăng nhập để tiếp tục."


class Forbidden(AppError):
    status_code = 403
    code = "forbidden"
    message = "Bạn không có quyền thực hiện thao tác này."


class Conflict(AppError):
    status_code = 409
    code = "conflict"
    message = "Dữ liệu đã được thay đổi ở nơi khác. Hãy tải lại trang."


class RateLimited(AppError):
    status_code = 429
    code = "rate_limited"
    message = "Bạn thao tác quá nhanh. Hãy thử lại sau ít phút."

    def __init__(self, retry_after: int, message: str | None = None) -> None:
        super().__init__(message, details={"retry_after_seconds": retry_after})
        self.retry_after = retry_after


class PayloadTooLarge(AppError):
    status_code = 413
    code = "payload_too_large"
    message = "Tệp quá lớn."


class UnsupportedMedia(AppError):
    status_code = 415
    code = "unsupported_media_type"
    message = "Định dạng tệp không được hỗ trợ. Hãy tải ảnh JPG, PNG, WebP hoặc tệp PDF."


class BudgetExceeded(AppError):
    status_code = 402
    code = "budget_exceeded"
    message = "Hệ thống đã dùng hết ngân sách AI hôm nay. Hãy thử lại vào ngày mai."


class ServiceUnavailable(AppError):
    status_code = 503
    code = "service_unavailable"
    message = "Dịch vụ tạm thời không khả dụng. Hãy thử lại sau."


_STATUS_MESSAGES = {
    400: ("bad_request", "Yêu cầu không hợp lệ."),
    401: ("unauthorized", "Bạn cần đăng nhập để tiếp tục."),
    403: ("forbidden", "Bạn không có quyền thực hiện thao tác này."),
    404: ("not_found", "Không tìm thấy dữ liệu."),
    405: ("method_not_allowed", "Phương thức không được hỗ trợ."),
    413: ("payload_too_large", "Tệp quá lớn."),
    422: ("validation_error", "Dữ liệu gửi lên không hợp lệ."),
}


def _response(status: int, code: str, message: str, details: Any = None, headers: dict[str, str] | None = None
              ) -> JSONResponse:
    body = ErrorResponse(error=ErrorBody(code=code, message=message, request_id=request_id_var.get(),
                                         details=details))
    return JSONResponse(status_code=status, content=body.model_dump(mode="json"), headers=headers)


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError) -> JSONResponse:
        headers = {"Retry-After": str(exc.retry_after)} if isinstance(exc, RateLimited) else None
        return _response(exc.status_code, exc.code, exc.message, exc.details, headers)

    @app.exception_handler(RequestValidationError)
    async def _validation(_: Request, exc: RequestValidationError) -> JSONResponse:
        details = [{"loc": list(e.get("loc", ())), "msg": e.get("msg"), "type": e.get("type")}
                   for e in exc.errors()]
        return _response(422, "validation_error", "Dữ liệu gửi lên không hợp lệ.", details)

    @app.exception_handler(StarletteHTTPException)
    async def _http(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        code, message = _STATUS_MESSAGES.get(exc.status_code, ("http_error", "Đã xảy ra lỗi."))
        return _response(exc.status_code, code, message)

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("unhandled_error", extra={"error_type": type(exc).__name__})
        return _response(500, "internal_error", "Đã xảy ra lỗi hệ thống. Hãy thử lại sau.")


class NotImplementedYet(AppError):
    status_code = 501
    code = "not_implemented"
    message = "Chức năng này chưa được triển khai."
