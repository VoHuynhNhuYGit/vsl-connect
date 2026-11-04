from typing import List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
import numpy as np

from app.ml.model import classifier

router = APIRouter(prefix="/gesture", tags=["Gesture Recognition"])

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
    "/predict",
    response_model=GesturePredictResponse,
    status_code=status.HTTP_200_OK,
    summary="Nhận diện cử chỉ tay từ chuỗi 60 frames"
)
async def predict_gesture(payload: GesturePredictRequest):
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lỗi định dạng dữ liệu: {str(e)}"
        )

    # 3. Gọi model dự đoán
    try:
        result = classifier.predict(input_data)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi trong quá trình suy luận mô hình: {str(e)}"
        )