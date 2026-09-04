"""
Storage abstraction for uploaded report images.

`LocalStorageBackend` is used for development (and is fine for small/self-
hosted deployments) — it writes files under STORAGE_DIR and serves them from
the FastAPI app itself at MEDIA_URL_PREFIX.

To move to Alibaba Cloud OSS or AWS S3 later, implement `S3StorageBackend.save()`
using the corresponding SDK (oss2 / boto3) and flip STORAGE_BACKEND=s3 in
.env — nothing in the routers needs to change, since they only ever call
`storage.save_image(...)`.
"""
import base64
import binascii
import re
import uuid
from abc import ABC, abstractmethod
from io import BytesIO
from pathlib import Path

from fastapi import HTTPException, status
from PIL import Image

from app.config import settings

DATA_URL_RE = re.compile(r"^data:image/(?P<ext>\w+);base64,(?P<data>.+)$", re.DOTALL)

ALLOWED_EXTS = {"jpeg", "jpg", "png", "webp", "gif"}
MAX_IMAGE_BYTES = 12 * 1024 * 1024  # 12 MB


class StorageBackend(ABC):
    @abstractmethod
    def save(self, data: bytes, ext: str) -> str:
        """Persist the given bytes and return a publicly-accessible URL."""
        raise NotImplementedError


class LocalStorageBackend(StorageBackend):
    def __init__(self) -> None:
        self.dir = Path(settings.STORAGE_DIR)
        self.dir.mkdir(parents=True, exist_ok=True)

    def save(self, data: bytes, ext: str) -> str:
        filename = f"{uuid.uuid4().hex}.{ext}"
        path = self.dir / filename
        path.write_bytes(data)
        return f"{settings.PUBLIC_BASE_URL}{settings.MEDIA_URL_PREFIX}/{filename}"


class S3StorageBackend(StorageBackend):
    """Placeholder for Alibaba Cloud OSS / AWS S3. Not wired up by default —
    implement with `oss2` or `boto3` and configure the S3_* settings when
    ready to move off local disk."""

    def save(self, data: bytes, ext: str) -> str:  # pragma: no cover
        raise NotImplementedError(
            "S3StorageBackend is a placeholder. Implement using boto3/oss2 and "
            "set STORAGE_BACKEND=s3 with the S3_* settings in .env."
        )


def _get_backend() -> StorageBackend:
    if settings.STORAGE_BACKEND == "s3":
        return S3StorageBackend()
    return LocalStorageBackend()


_backend = _get_backend()


def decode_data_url(image_data: str) -> tuple[bytes, str]:
    """Decode a `data:image/...;base64,...` string (or a raw base64 string)
    into (bytes, extension), validating it's actually a readable image."""
    match = DATA_URL_RE.match(image_data.strip())
    if match:
        ext = match.group("ext").lower()
        raw_b64 = match.group("data")
    else:
        ext = "jpeg"
        raw_b64 = image_data.strip()

    if ext not in ALLOWED_EXTS:
        ext = "jpeg"

    try:
        data = base64.b64decode(raw_b64, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid base64 image data")

    if len(data) == 0 or len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Image is empty or exceeds the size limit")

    try:
        img = Image.open(BytesIO(data))
        img.verify()
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Uploaded file is not a valid image")

    return data, ext


def save_image(image_data: str) -> str:
    """Decode + validate + persist an uploaded image, returning its URL."""
    data, ext = decode_data_url(image_data)
    return _backend.save(data, ext)
