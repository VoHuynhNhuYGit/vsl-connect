import logging
import os
import shutil
import subprocess
import tempfile
from time import perf_counter
from pathlib import Path
from typing import List

from fastapi import APIRouter, File, HTTPException, Response, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
import numpy as np
from starlette.background import BackgroundTask

from app.ml.model import classifier

router = APIRouter(prefix="/api/v1/gesture", tags=["Gesture Recognition"])
logger = logging.getLogger(__name__)
GESTURE_DEBUG = os.getenv("GESTURE_DEBUG", "false").lower() in {"1", "true", "yes", "on"}
MAX_VIDEO_BYTES = 50 * 1024 * 1024
UPLOAD_CHUNK_SIZE = 1024 * 1024
ALLOWED_VIDEO_SUFFIXES = {".mp4", ".m4v", ".webm", ".mov", ".ogv", ".ogg"}

class GesturePredictRequest(BaseModel):
    # Nhận vào mảng 2 chiều: 60 frames, mỗi frame gồm 126 điểm landmarks
    sequence: List[List[float]] = Field(
        ..., 
        description="Mảng 60 khung hình liên tiếp, mỗi khung hình gồm 126 tọa độ (x, y, z)"
    )

class GesturePredictResponse(BaseModel):
    label_id: str
    label_name: str
    confidence: float


@router.post(
    "/video/convert",
    status_code=status.HTTP_200_OK,
    summary="Chuyá»ƒn video sang MP4 H.264 Ä‘á»ƒ nháº­n diá»‡n trong trĂ¬nh duyá»‡t",
)
def convert_video_for_browser(video_file: UploadFile = File(...)):
    """Temporarily transcode browser-incompatible videos without persisting them."""
    suffix = Path(video_file.filename or "").suffix.lower()
    if suffix not in ALLOWED_VIDEO_SUFFIXES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Chá»‰ há»— trá»£ video MP4, M4V, WebM, MOV hoáº·c OGV.",
        )

    temporary_directory = Path(tempfile.mkdtemp(prefix="vsl-video-"))
    input_path = temporary_directory / f"source{suffix}"
    output_path = temporary_directory / "converted.mp4"

    try:
        written_bytes = 0
        with input_path.open("wb") as destination:
            while chunk := video_file.file.read(UPLOAD_CHUNK_SIZE):
                written_bytes += len(chunk)
                if written_bytes > MAX_VIDEO_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="Video quá 50 MB. Hãy rút ngắn hoặc nén video rồi thử lại.",
                    )
                destination.write(chunk)

        command = [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(input_path),
            "-map",
            "0:v:0",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "23",
            "-pix_fmt",
            "yuv420p",
            "-movflags",
            "+faststart",
            "-an",
            str(output_path),
        ]
        conversion = subprocess.run(
            command,
            check=False,
            capture_output=True,
            text=True,
            timeout=120,
        )
        if conversion.returncode != 0 or not output_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="KhĂ´ng thá»ƒ chuyá»ƒn Ä‘á»•i video nĂ y. HĂ£y thá»­ má»™t tá»‡p video khĂ¡c.",
            )

        return FileResponse(
            output_path,
            media_type="video/mp4",
            filename="video-da-chuyen-doi.mp4",
            background=BackgroundTask(shutil.rmtree, temporary_directory, ignore_errors=True),
        )
    except subprocess.TimeoutExpired as error:
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail="Chuyá»ƒn Ä‘á»•i video quĂ¡ lĂ¢u. HĂ£y thá»­ video ngáº¯n hÆ¡n.",
        ) from error
    finally:
        video_file.file.close()
        if not output_path.is_file():
            shutil.rmtree(temporary_directory, ignore_errors=True)

@router.post(
    "/predict",
    response_model=GesturePredictResponse,
    status_code=status.HTTP_200_OK,
    summary="Nhận diện cử chỉ tay từ chuỗi 60 frames"
)
def predict_gesture(payload: GesturePredictRequest, response: Response):
    # 1. Kiểm tra độ dài chuỗi frames
    if len(payload.sequence) != classifier.seq_len:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Cần đúng {classifier.seq_len} khung hình. Đã nhận: {len(payload.sequence)}"
        )

    # 2. Chuyển đổi sang numpy array và kiểm tra kích thước
    try:
        input_data = np.array(payload.sequence, dtype=np.float32)
        if input_data.shape != (classifier.seq_len, classifier.input_size):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Dữ liệu không đúng kích thước ({classifier.seq_len}, {classifier.input_size}). Nhận được: {input_data.shape}"
            )
        if not np.isfinite(input_data).all():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Dữ liệu landmarks không được chứa NaN hoặc Inf.",
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lỗi định dạng dữ liệu: {str(e)}"
        )

    # 3. Gọi model dự đoán
    try:
        started_at = perf_counter()
        result = classifier.predict(input_data)
        inference_ms = (perf_counter() - started_at) * 1000
        response.headers["X-Gesture-Inference-Ms"] = f"{inference_ms:.1f}"
        if GESTURE_DEBUG:
            logger.info(
                "gesture_predict input_shape=%s finite=%s inference_ms=%.1f label_id=%s confidence=%.4f",
                input_data.shape,
                bool(np.isfinite(input_data).all()),
                inference_ms,
                result["label_id"],
                result["confidence"],
            )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi trong quá trình suy luận mô hình: {str(e)}"
        )
