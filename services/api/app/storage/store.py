"""Object storage: local filesystem for development, S3 API (Cloudflare R2) in production."""

from __future__ import annotations

import asyncio
import re
import shutil
from pathlib import Path
from typing import Any, Protocol

from ..config import Settings

_KEY = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._/-]{0,500}$")


class StorageError(Exception):
    pass


def validate_key(key: str) -> str:
    if not _KEY.match(key) or ".." in key or "//" in key:
        raise StorageError("Invalid storage key")
    return key


class ObjectStore(Protocol):
    async def put(self, key: str, data: bytes, content_type: str) -> None: ...
    async def get(self, key: str) -> bytes: ...
    async def delete_prefix(self, prefix: str) -> int: ...


class LocalObjectStore:
    def __init__(self, root: Path) -> None:
        self.root = root.resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        path = (self.root / validate_key(key)).resolve()
        if self.root not in path.parents:
            raise StorageError("Invalid storage key")
        return path

    async def put(self, key: str, data: bytes, content_type: str) -> None:
        path = self._path(key)

        def _write() -> None:
            path.parent.mkdir(parents=True, exist_ok=True)
            tmp = path.with_suffix(path.suffix + ".tmp")
            tmp.write_bytes(data)
            tmp.replace(path)

        await asyncio.to_thread(_write)

    async def get(self, key: str) -> bytes:
        path = self._path(key)
        try:
            return await asyncio.to_thread(path.read_bytes)
        except FileNotFoundError as exc:
            raise StorageError("Object not found") from exc

    async def delete_prefix(self, prefix: str) -> int:
        base = self._path(prefix.rstrip("/"))

        def _delete() -> int:
            if not base.exists():
                return 0
            if base.is_file():
                base.unlink()
                return 1
            count = sum(1 for p in base.rglob("*") if p.is_file())
            shutil.rmtree(base)
            return count

        return await asyncio.to_thread(_delete)


class S3ObjectStore:
    """S3-compatible store. With Cloudflare R2 use endpoint https://<account_id>.r2.cloudflarestorage.com."""

    def __init__(self, settings: Settings, client: Any | None = None) -> None:
        import boto3
        from botocore.config import Config

        self.bucket = settings.s3_bucket
        self.client = client or boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint_url,
            aws_access_key_id=settings.s3_access_key_id.get_secret_value() if settings.s3_access_key_id else None,
            aws_secret_access_key=(settings.s3_secret_access_key.get_secret_value()
                                   if settings.s3_secret_access_key else None),
            region_name=settings.s3_region,
            config=Config(retries={"max_attempts": 3, "mode": "standard"}, connect_timeout=10, read_timeout=60),
        )

    async def put(self, key: str, data: bytes, content_type: str) -> None:
        await asyncio.to_thread(self.client.put_object, Bucket=self.bucket, Key=validate_key(key), Body=data,
                                ContentType=content_type)

    async def get(self, key: str) -> bytes:
        from botocore.exceptions import ClientError

        try:
            obj = await asyncio.to_thread(self.client.get_object, Bucket=self.bucket, Key=validate_key(key))
            return await asyncio.to_thread(obj["Body"].read)
        except ClientError as exc:
            raise StorageError("Object not found") from exc

    async def delete_prefix(self, prefix: str) -> int:
        validate_key(prefix)

        def _delete() -> int:
            deleted = 0
            paginator = self.client.get_paginator("list_objects_v2")
            for page in paginator.paginate(Bucket=self.bucket, Prefix=prefix):
                keys: list[Any] = [{"Key": o["Key"]} for o in page.get("Contents", [])]
                if keys:
                    self.client.delete_objects(Bucket=self.bucket, Delete={"Objects": keys, "Quiet": True})
                    deleted += len(keys)
            return deleted

        return await asyncio.to_thread(_delete)


def build_store(settings: Settings) -> ObjectStore:
    if settings.storage_backend == "s3":
        return S3ObjectStore(settings)
    return LocalObjectStore(settings.storage_local_dir)
