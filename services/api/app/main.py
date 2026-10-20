from __future__ import annotations

import hmac
import logging
import re
import uuid
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from sqlalchemy import text

from . import __version__
from .api.v1.routes import router as v1_router
from .api.v1.schemas import HealthOut, ReadyOut
from .config import Settings, get_settings
from .container import Container, build_container
from .errors import ErrorBody, ErrorResponse, install_error_handlers
from .logging_setup import configure_logging, request_id_var, user_id_var
from .workers.runner import Worker

logger = logging.getLogger(__name__)
_REQUEST_ID = re.compile(r"^[A-Za-z0-9-]{8,64}$")
_PUBLIC_PATHS = {"/health"}
_MULTIPART_OVERHEAD = 64 * 1024


def create_app(settings: Settings | None = None, container: Container | None = None,
               start_worker: bool | None = None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(settings.log_level)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        c = container or build_container(settings)
        app.state.container = c
        worker: Worker | None = None
        if settings.run_embedded_worker if start_worker is None else start_worker:
            worker = Worker(c)
            worker.start()
        try:
            yield
        finally:
            if worker is not None:
                await worker.stop()
            if container is None:
                await c.aclose()

    docs = settings.environment != "production"
    app = FastAPI(title="AI Math Tutor API", version=__version__, lifespan=lifespan,
                  docs_url="/docs" if docs else None, redoc_url=None,
                  openapi_url="/openapi.json" if docs else None)
    install_error_handlers(app)

    @app.middleware("http")
    async def context_middleware(request: Request, call_next: Callable[[Request], Awaitable[Response]]
                                 ) -> Response:
        incoming = request.headers.get("x-request-id", "")
        request_id = incoming if _REQUEST_ID.match(incoming) else uuid.uuid4().hex
        token = request_id_var.set(request_id)
        user_token = user_id_var.set(None)
        try:
            secret = settings.gateway_secret
            if secret is not None and request.url.path not in _PUBLIC_PATHS:
                provided = request.headers.get("x-gateway-secret", "")
                if not hmac.compare_digest(provided.encode(), secret.get_secret_value().encode()):
                    body = ErrorResponse(error=ErrorBody(code="forbidden", message="Truy cập không hợp lệ.",
                                                         request_id=request_id))
                    response: Response = Response(content=body.model_dump_json(), status_code=403,
                                                  media_type="application/json")
                    response.headers["X-Request-ID"] = request_id
                    return response
            if request.method == "POST" and request.url.path == "/api/v1/documents":
                # Reject oversized uploads before Starlette buffers the multipart body.
                length = request.headers.get("content-length")
                limit = settings.max_upload_bytes + _MULTIPART_OVERHEAD
                if length is None or not length.isdigit() or int(length) > limit:
                    status, code, message = ((411, "length_required", "Thiếu kích thước tệp.") if length is None
                                             else (413, "payload_too_large", "Tệp quá lớn."))
                    body = ErrorResponse(error=ErrorBody(code=code, message=message, request_id=request_id))
                    response = Response(content=body.model_dump_json(), status_code=status,
                                        media_type="application/json")
                    response.headers["X-Request-ID"] = request_id
                    return response
            response = await call_next(request)
            response.headers["X-Request-ID"] = request_id
            response.headers.setdefault("X-Content-Type-Options", "nosniff")
            response.headers.setdefault("Referrer-Policy", "no-referrer")
            return response
        finally:
            request_id_var.reset(token)
            user_id_var.reset(user_token)

    @app.get("/health", response_model=HealthOut, tags=["health"])
    async def health() -> HealthOut:
        return HealthOut(status="ok", service="math-tutor-api", version=__version__)

    @app.get("/ready", response_model=ReadyOut, tags=["health"])
    async def ready(request: Request) -> ReadyOut:
        c: Container = request.app.state.container
        db_ok = True
        try:
            async with c.db.sessionmaker() as session:
                await session.execute(text("SELECT 1"))
        except Exception:
            db_ok = False
        ocr_ok = c.ocr is not None
        return ReadyOut(status="ready" if db_ok and ocr_ok else "degraded", database=db_ok,
                        ocr_configured=ocr_ok, problems=c.config_problems if docs else [])

    app.include_router(v1_router)
    return app


def app_factory() -> FastAPI:
    return create_app()
