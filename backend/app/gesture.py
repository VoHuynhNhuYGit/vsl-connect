import base64
import logging
import os
import shutil
import subprocess
import tempfile
from time import perf_counter
from pathlib import Path
from typing import Any, List, Optional

from fastapi import APIRouter, File, HTTPException, Response, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
import numpy as np
from starlette.background import BackgroundTask

try:
    import cv2
    import mediapipe as mp
except ImportError:
    cv2 = None
    mp = None

from app.ml.model import classifier

router = APIRouter(prefix="/api/v1/gesture", tags=["Gesture Recognition"])
logger = logging.getLogger(__name__)
GESTURE_DEBUG = os.getenv("GESTURE_DEBUG", "false").lower() in {"1", "true", "yes", "on"}
MAX_VIDEO_BYTES = 50 * 1024 * 1024
UPLOAD_CHUNK_SIZE = 1024 * 1024
ALLOWED_VIDEO_SUFFIXES = {".mp4", ".m4v", ".webm", ".mov", ".ogv", ".ogg"}
# Ngưỡng tin cậy nhận diện: mặc định 0.42 theo yêu cầu đồng bộ Video Upload và Camera
CONFIDENCE_THRESHOLD = float(os.getenv("GESTURE_CONFIDENCE_THRESHOLD", "0.42"))
MIN_HAND_FRAMES = 6

class GesturePredictRequest(BaseModel):
    # Nhận vào mảng 2 chiều: 60 frames, mỗi frame gồm 126 điểm landmarks
    sequence: List[List[float]] = Field(
        ..., 
        description="Mảng 60 khung hình liên tiếp, mỗi khung hình gồm 126 tọa độ (x, y, z)"
    )

class GestureCameraFramesRequest(BaseModel):
    frames: List[str] = Field(
        ...,
        description="Danh sách các frame ảnh JPEG dạng base64 từ camera"
    )

class TopPrediction(BaseModel):
    label_id: str
    label_name: str
    confidence: float

class GesturePredictResponse(BaseModel):
    label_id: str
    label_name: str
    confidence: float


def resample_sequence(frames: np.ndarray, target_len: int = 60) -> np.ndarray:
    """
    Nội suy tuyến tính (linear interpolation) co giãn chuỗi keypoints về đúng target_len (60 frames).
    - Nếu 10 <= N <= 59 frames (video ngắn 2-3s): co giãn về đúng 60 frames, giữ nguyên quỹ đạo cử chỉ,
      TUYỆT ĐỐI KHÔNG chèn zero-padding.
    - Nếu N > 60 frames: lấy mẫu đều 60 frames trải dài toàn bộ đoạn cử chỉ.
    """
    n = len(frames)
    if n == target_len:
        return frames.astype(np.float32)
    if n == 1:
        return np.tile(frames[0], (target_len, 1)).astype(np.float32)

    indices = np.linspace(0, n - 1, target_len)
    low_idx = np.floor(indices).astype(int)
    high_idx = np.ceil(indices).astype(int)
    high_idx = np.clip(high_idx, 0, n - 1)
    weights = (indices - low_idx)[:, np.newaxis]

    resampled = (1.0 - weights) * frames[low_idx] + weights * frames[high_idx]
    return resampled.astype(np.float32)


def flip_hand_landmarks(pts: np.ndarray) -> np.ndarray:
    """Lật ngang tọa độ X (1.0 - x) cho 21 landmarks (63 floats)."""
    flipped = pts.copy()
    if np.any(flipped):
        for i in range(0, 63, 3):
            if flipped[i] != 0.0 or flipped[i + 1] != 0.0:
                flipped[i] = 1.0 - flipped[i]
    return flipped


def flip_sequence_mirror(seq: np.ndarray) -> np.ndarray:
    """
    Tạo chuỗi đối xứng ngang (mirror):
    - Đảo tay Trái (0..62) <-> tay Phải (63..125)
    - Lật tọa độ X: x = 1.0 - x cho cả 2 tay
    """
    seq_flipped = np.zeros_like(seq)
    for t in range(len(seq)):
        left = seq[t, :63]
        right = seq[t, 63:126]
        flipped_left = flip_hand_landmarks(right)
        flipped_right = flip_hand_landmarks(left)
        seq_flipped[t] = np.concatenate([flipped_left, flipped_right])
    return seq_flipped


def evaluate_dual_orientation(
    seq_orig: np.ndarray,
    source_name: str = "Pipeline",
    prefer_original: bool = False,
) -> tuple[dict, str, dict, dict]:
    """
    Dự đoán song song trên chuỗi gốc (original) và chuỗi lật đối xứng (flipped) để giải quyết
    triệt để lỗi lệch chiều (mirror webcam vs video gốc):
    - Chạy classifier.predict trên cả 2 chuỗi.
    - So sánh kết quả và chọn chiều có độ tin cậy cao hơn, hoặc loại bỏ non-sign.
    - Trả về (best_pred, chosen_orientation, pred_orig, pred_flipped).
    """
    seq_flipped = flip_sequence_mirror(seq_orig)

    pred_orig = classifier.predict(seq_orig)
    pred_flipped = classifier.predict(seq_flipped)

    orig_conf = pred_orig.get("confidence", 0.0)
    flip_conf = pred_flipped.get("confidence", 0.0)
    orig_lbl = pred_orig.get("label_name", "").lower()
    flip_lbl = pred_flipped.get("label_name", "").lower()

    orig_is_nonsign = orig_lbl in ["non-sign", "không phát hiện ký hiệu"]
    flip_is_nonsign = flip_lbl in ["non-sign", "không phát hiện ký hiệu"]

    if orig_is_nonsign and not flip_is_nonsign:
        best_pred = pred_flipped
        chosen = "flipped"
    elif flip_is_nonsign and not orig_is_nonsign:
        best_pred = pred_orig
        chosen = "original"
    else:
        if prefer_original:
            if flip_conf > orig_conf + 0.15:
                best_pred = pred_flipped
                chosen = "flipped"
            else:
                best_pred = pred_orig
                chosen = "original"
        else:
            if flip_conf > orig_conf:
                best_pred = pred_flipped
                chosen = "flipped"
            else:
                best_pred = pred_orig
                chosen = "original"

    return best_pred, chosen, pred_orig, pred_flipped


def format_top3(pred: dict) -> str:
    """Định dạng chuỗi Top-3 dự đoán kèm xác suất để in ra log terminal."""
    top3 = pred.get("top3", [])
    if not top3:
        return f"{pred.get('label_name', 'N/A')} ({pred.get('confidence', 0.0)*100:.1f}%)"
    return " | ".join(
        [f"#{idx+1}: {item['label_name']} ({item['confidence']*100:.1f}%)" for idx, item in enumerate(top3)]
    )


# ==============================================================================
# HÀM TRÍCH XUẤT VÀ CĂN CHỈNH TỌA ĐỘ BÀN TAY (ĐỒNG BỘ 100% VỚI NORMALIZATION.NPZ)
# ==============================================================================
def calculate_landmark_displacement(prev_frame: np.ndarray, curr_frame: np.ndarray) -> float:
    """
    Tính vận tốc di chuyển trung bình (Euclidean displacement) của các điểm keypoints giữa 2 frames liên tiếp.
    Chỉ tính trên các điểm được phát hiện (tọa độ khác 0) ở cả hai frame.
    """
    if len(prev_frame) != 126 or len(curr_frame) != 126:
        return 0.0

    prev_xy = prev_frame.reshape(-1, 3)[:, :2]
    curr_xy = curr_frame.reshape(-1, 3)[:, :2]

    valid_prev = (prev_xy[:, 0] != 0.0) | (prev_xy[:, 1] != 0.0)
    valid_curr = (curr_xy[:, 0] != 0.0) | (curr_xy[:, 1] != 0.0)
    valid_both = valid_prev & valid_curr

    if not np.any(valid_both):
        return 0.0

    diff = curr_xy[valid_both] - prev_xy[valid_both]
    dists = np.sqrt(np.sum(diff ** 2, axis=1))
    return float(np.mean(dists))


def trim_static_boundary_frames(
    frames: np.ndarray,
    min_displacement: float = 0.006,
    min_remaining_frames: int = 6,
) -> tuple[np.ndarray, int, int]:
    """
    Loại bỏ các frame đứng yên (displacement < min_displacement) ở đầu và cuối chuỗi cử chỉ
    trước khi nội suy về 60 frames. Giúp loại bỏ giai đoạn chuẩn bị giơ tay hoặc giữ tay bất động.
    """
    N = len(frames)
    if N <= min_remaining_frames:
        return frames, 0, 0

    displacements = [
        calculate_landmark_displacement(frames[i], frames[i + 1])
        for i in range(N - 1)
    ]

    start_idx = 0
    while start_idx < len(displacements) and displacements[start_idx] < min_displacement:
        start_idx += 1

    end_idx = N - 1
    while end_idx > start_idx and (end_idx - 1) < len(displacements) and displacements[end_idx - 1] < min_displacement:
        end_idx -= 1

    trimmed_len = end_idx - start_idx + 1
    if trimmed_len >= min_remaining_frames:
        return frames[start_idx : end_idx + 1], start_idx, (N - 1 - end_idx)

    return frames, 0, 0


def interpolate_missing_hand_gaps(sequence: np.ndarray, max_gap: int = 4) -> np.ndarray:
    """
    Nội suy lấp khoảng trống các frame bị mất tay giữa chừng (Gap Interpolation).
    Nếu ở giữa chuỗi động tác có 1 đến 4 frames liên tiếp bị mất dấu bàn tay (do vung tay nhanh / motion blur),
    KHÔNG được điền số 0 vào các frame đó.
    Dùng nội suy tuyến tính (linear interpolation) nối thẳng tọa độ từ frame có tay liền trước sang frame có tay
    liền sau, giữ mượt đường đi của bàn tay trước khi co giãn về 60 frames.
    Xử lý độc lập cho từng slot bàn tay:
    - Slot 1 [0..62]   (Bàn tay 1 / Screen Right)
    - Slot 2 [63..125] (Bàn tay 2 / Screen Left)
    """
    if len(sequence) == 0:
        return sequence

    out = sequence.copy()
    slots = [(0, 63), (63, 126)]

    for start_col, end_col in slots:
        is_present = np.abs(out[:, start_col:end_col]).sum(axis=1) > 1e-4
        present_indices = np.where(is_present)[0]

        if len(present_indices) < 2:
            continue

        for i in range(len(present_indices) - 1):
            idx_prev = present_indices[i]
            idx_next = present_indices[i + 1]
            gap = idx_next - idx_prev - 1

            if 1 <= gap <= max_gap:
                prev_vals = out[idx_prev, start_col:end_col]
                next_vals = out[idx_next, start_col:end_col]
                for step, k in enumerate(range(idx_prev + 1, idx_next), start=1):
                    alpha = step / (gap + 1)
                    out[k, start_col:end_col] = (1.0 - alpha) * prev_vals + alpha * next_vals

    return out


def extract_hands_from_mediapipe(results) -> tuple[np.ndarray, bool]:
    """
    Trích xuất 126 đặc trưng (Slot 1 [0..62] và Slot 2 [63..125]) từ kết quả MediaPipe Hands.
    Khớp 100% với phân bố không gian trong normalization.npz:
    - Slot 1 (0..62): Bàn tay ở nửa phải khung hình (Mean X ~ 0.61, wrist X >= 0.49).
    - Slot 2 (63..125): Bàn tay ở nửa trái khung hình (Mean X ~ 0.36, wrist X < 0.49).
    - Bàn tay không phát hiện: giữ 0.0 (chuẩn hóa zero-masking sẽ đưa về 0.0 trung tính).
    """
    slot1 = np.zeros(63, dtype=np.float32)
    slot2 = np.zeros(63, dtype=np.float32)
    has_hand = False

    if results.multi_hand_landmarks:
        has_hand = True
        detected_hands = []
        for hand in results.multi_hand_landmarks:
            pts = np.array([[p.x, p.y, p.z] for p in hand.landmark], dtype=np.float32).flatten()
            wrist_x = float(hand.landmark[0].x)
            detected_hands.append((wrist_x, pts))

        if len(detected_hands) == 1:
            wrist_x, pts = detected_hands[0]
            if wrist_x >= 0.49:
                slot1 = pts
            else:
                slot2 = pts
        elif len(detected_hands) >= 2:
            # Sắp xếp theo X giảm dần: tay bên phải (X lớn) vào slot 1, tay bên trái (X nhỏ) vào slot 2
            detected_hands.sort(key=lambda item: item[0], reverse=True)
            slot1 = detected_hands[0][1]
            slot2 = detected_hands[1][1]

    frame_features = np.concatenate([slot1, slot2])
    return frame_features, has_hand


def extract_keypoints_from_image(image_bgr: np.ndarray, hands_detector) -> tuple[np.ndarray, bool]:
    """
    Chuẩn hóa kích thước khung hình (resize max_w=640, giữ aspect ratio),
    chuyển chuẩn BGR -> RGB và trích xuất 126 keypoints qua MediaPipe Hands.
    """
    h, w = image_bgr.shape[:2]
    frame = image_bgr
    if w > 640:
        new_w = 640
        new_h = int(h * (640 / w))
        frame = cv2.resize(image_bgr, (new_w, new_h), interpolation=cv2.INTER_AREA)

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands_detector.process(rgb)
    return extract_hands_from_mediapipe(results)


def align_spatial_hands(sequence: np.ndarray) -> tuple[np.ndarray, str]:
    """
    Chuẩn hóa và căn chỉnh slot không gian theo đúng phân bố trong normalization.npz:
    - Slot 1 [0..62]  : Screen Right (Anatomical Left Hand, Mean X ~ 0.61, Wrist X >= 0.49).
    - Slot 2 [63..125]: Screen Left  (Anatomical Right Hand, Mean X ~ 0.36, Wrist X < 0.49).

    Xử lý thông minh chống nhiễu:
    1. Kiểm tra cử chỉ 1 tay hay 2 tay bằng cách đếm số frame có 2 tay đồng thời.
    2. Cử chỉ 1 tay: Nếu MediaPipe bị nhảy slot (chớp tắt giữa slot 1 và slot 2), tính Wrist X
       trung bình để chốt CỐ ĐỊNH 1 slot duy nhất cho toàn bộ cử chỉ:
       - Nếu avg_wrist_x < 0.49 -> Slot 2 (Right Hand, 63..125)
       - Nếu avg_wrist_x >= 0.49 -> Slot 1 (Left Hand, 0..62)
    3. Cử chỉ 2 tay: Đảm bảo bàn tay bên phải khung hình (X lớn hơn) luôn ở Slot 1,
       bàn tay bên trái khung hình (X nhỏ hơn) luôn ở Slot 2.
    """
    aligned = sequence.copy()
    num_frames = len(aligned)
    if num_frames == 0:
        return aligned, "Chuỗi rỗng"

    h1_present = np.abs(aligned[:, :63]).sum(axis=1) > 1e-4
    h2_present = np.abs(aligned[:, 63:126]).sum(axis=1) > 1e-4
    both_present = h1_present & h2_present
    any_present = h1_present | h2_present

    total_hand_frames = int(np.sum(any_present))
    two_hand_frames = int(np.sum(both_present))

    if total_hand_frames == 0:
        return aligned, "Không có tay"

    is_two_handed = two_hand_frames >= max(5, int(total_hand_frames * 0.15))

    if not is_two_handed:
        wrist_xs = []
        hand_pts_per_frame = []

        for t in range(num_frames):
            s1_active = h1_present[t]
            s2_active = h2_present[t]

            if s1_active and not s2_active:
                wrist_x = float(aligned[t, 0])
                pts = aligned[t, :63]
            elif s2_active and not s1_active:
                wrist_x = float(aligned[t, 63])
                pts = aligned[t, 63:126]
            elif s1_active and s2_active:
                wrist_x = float(aligned[t, 63]) if aligned[t, 63] < 0.49 else float(aligned[t, 0])
                pts = aligned[t, 63:126] if aligned[t, 63] < 0.49 else aligned[t, :63]
            else:
                wrist_x = None
                pts = None

            if wrist_x is not None:
                wrist_xs.append(wrist_x)
            hand_pts_per_frame.append(pts)

        avg_wrist_x = float(np.mean(wrist_xs)) if wrist_xs else 0.5
        target_slot = 2 if avg_wrist_x < 0.49 else 1

        for t in range(num_frames):
            pts = hand_pts_per_frame[t]
            aligned[t, :] = 0.0
            if pts is not None:
                if target_slot == 2:
                    aligned[t, 63:126] = pts
                else:
                    aligned[t, :63] = pts

        slot_desc = (
            f"Cử chỉ 1 tay -> Slot 2 Right Hand [63..125] (avg wrist X={avg_wrist_x:.3f} < 0.49)"
            if target_slot == 2
            else f"Cử chỉ 1 tay -> Slot 1 Left Hand [0..62] (avg wrist X={avg_wrist_x:.3f} >= 0.49)"
        )
        return aligned, slot_desc

    else:
        for t in range(num_frames):
            if both_present[t]:
                wrist1_x = aligned[t, 0]
                wrist2_x = aligned[t, 63]
                if wrist1_x < wrist2_x:
                    tmp = aligned[t, :63].copy()
                    aligned[t, :63] = aligned[t, 63:126]
                    aligned[t, 63:126] = tmp
            elif h1_present[t] and not h2_present[t]:
                wrist_x = aligned[t, 0]
                if wrist_x < 0.49:
                    aligned[t, 63:126] = aligned[t, :63]
                    aligned[t, :63] = 0.0
            elif h2_present[t] and not h1_present[t]:
                wrist_x = aligned[t, 63]
                if wrist_x >= 0.49:
                    aligned[t, :63] = aligned[t, 63:126]
                    aligned[t, 63:126] = 0.0

        slot_desc = f"Cử chỉ 2 tay ({two_hand_frames}/{total_hand_frames} frames active song song)"
        return aligned, slot_desc


# ==============================================================================
# LÕI TIỀN XỬ LÝ & SUY LUẬN CHUNG (SHARED INFERENCE PIPELINE) CHO VIDEO VÀ CAMERA
# ==============================================================================
def shared_inference_pipeline(
    raw_sequence: np.ndarray,
    source_name: str = "Pipeline",
    min_hand_frames: int = MIN_HAND_FRAMES,
    prefer_original: bool | None = None,
) -> tuple[dict, str, dict, dict, int, int, str, tuple[float, float, float], np.ndarray | None]:
    """
    LÕI TIỀN XỬ LÝ & SUY LUẬN CHUNG (SHARED INFERENCE PIPELINE) CHO CẢ VIDEO VÀ CAMERA:
    1. Kiểm tra số frame có bàn tay: Yêu cầu tối thiểu min_hand_frames >= 6 frames.
    2. Cắt lát khoảng thời gian chuyển động chính (từ first_hand_idx đến last_hand_idx).
    3. Căn chỉnh slot không gian theo chuẩn normalization.npz (Screen Right: Slot 1 [0..62], Screen Left: Slot 2 [63..125]).
    4. Gap Interpolation: Lấp khoảng trống 1-4 frames bị mất tay giữa chừng do motion blur (tuyệt đối không điền số 0).
    5. Static Frame Trimming: Lọc bỏ các frame đứng yên (displacement < 0.006) ở đầu và cuối chuỗi, chỉ giữ lại đoạn chuyển động chính (tối thiểu 6 frames, tối đa 60 frames).
    6. Co giãn đều (np.linspace / resample_sequence) về đúng 60 frames (TUYỆT ĐỐI KHÔNG chèn zero-padding).
    7. Dự đoán song song 2 chiều (evaluate_dual_orientation: original vs flipped mirror).
    8. Áp dụng cùng ngưỡng tin cậy CONFIDENCE_THRESHOLD (0.42) để chặn đoán mò.
    """
    if prefer_original is None:
        prefer_original = (source_name == "Video Upload")

    if raw_sequence is None or len(raw_sequence) == 0:
        empty_pred = {"label_id": "-1", "label_name": "Không phát hiện ký hiệu", "confidence": 0.0, "top3": []}
        return empty_pred, "none", empty_pred, empty_pred, 0, 0, "Không có dữ liệu", (0.0, 0.0, 0.0), None

    has_hand = (np.abs(raw_sequence[:, :63]).sum(axis=1) > 1e-4) | (np.abs(raw_sequence[:, 63:126]).sum(axis=1) > 1e-4)
    hand_indices = np.where(has_hand)[0]
    valid_hand_frames = len(hand_indices)

    if valid_hand_frames < min_hand_frames:
        empty_pred = {
            "label_id": "-1",
            "label_name": "Không phát hiện ký hiệu",
            "confidence": 0.0,
            "top3": [],
        }
        return empty_pred, "none", empty_pred, empty_pred, valid_hand_frames, 0, f"Số frame có tay ({valid_hand_frames}) < {min_hand_frames}", (0.0, 0.0, 0.0), None

    first_idx = hand_indices[0]
    last_idx = hand_indices[-1]
    active_raw = raw_sequence[first_idx : last_idx + 1]

    # 1. Căn chỉnh slot không gian theo chuẩn normalization.npz
    aligned, slot_desc = align_spatial_hands(active_raw)

    # 2. Gap Interpolation: Lấp khoảng trống 1-4 frames bị mất tay giữa chừng do motion blur
    gap_filled = interpolate_missing_hand_gaps(aligned, max_gap=4)

    # 3. Lọc bỏ các frame hoàn toàn trống còn lại (nếu có khoảng trống lớn > 4 frames do nghỉ lâu)
    has_any_hand = (np.abs(gap_filled[:, :63]).sum(axis=1) > 1e-4) | (np.abs(gap_filled[:, 63:126]).sum(axis=1) > 1e-4)
    clean_frames = gap_filled[has_any_hand]
    if len(clean_frames) >= min_hand_frames:
        gap_filled = clean_frames

    # 4. Static Frame Trimming: Loại bỏ các frame đứng yên (displacement < 0.006) ở đầu và cuối chuỗi
    trimmed, drop_front, drop_back = trim_static_boundary_frames(
        gap_filled, min_displacement=0.006, min_remaining_frames=min_hand_frames
    )

    # 5. Co giãn tuyến tính về đúng 60 frames (TUYỆT ĐỐI KHÔNG zero-padding)
    seq_resampled = resample_sequence(trimmed, target_len=classifier.seq_len)

    # 6. Tính thống kê min/max/mean sau chuẩn hóa (slot-based zero-masking)
    norm_seq = np.zeros_like(seq_resampled)
    for t in range(len(seq_resampled)):
        if np.abs(seq_resampled[t, :63]).sum() > 1e-3:
            norm_seq[t, :63] = (seq_resampled[t, :63] - classifier.mean[:63]) / (classifier.std[:63] + 1e-8)
        if np.abs(seq_resampled[t, 63:126]).sum() > 1e-3:
            norm_seq[t, 63:126] = (seq_resampled[t, 63:126] - classifier.mean[63:126]) / (classifier.std[63:126] + 1e-8)
    s_min = float(np.min(norm_seq))
    s_max = float(np.max(norm_seq))
    s_mean = float(np.mean(norm_seq))
    stats = (s_min, s_max, s_mean)

    # 7. Dự đoán song song 2 chiều (đối chiếu gốc vs đối xứng gương webcam)
    best_pred, chosen, pred_orig, pred_flipped = evaluate_dual_orientation(
        seq_resampled,
        source_name=source_name,
        prefer_original=prefer_original,
    )

    # 8. Xử lý ngưỡng tin cậy CONFIDENCE_THRESHOLD (0.42)
    result = dict(best_pred)
    pred_lbl = result.get("label_name", "").lower()
    conf = float(result.get("confidence", 0.0))

    if pred_lbl in ["non-sign", "không phát hiện ký hiệu"] or conf < CONFIDENCE_THRESHOLD:
        result["label_id"] = "-1"
        result["label_name"] = "Không phát hiện ký hiệu" if source_name == "Video Upload" else "Chưa rõ ký hiệu"
        result["confidence"] = 0.0 if source_name == "Video Upload" else round(conf, 4)

    return result, chosen, pred_orig, pred_flipped, valid_hand_frames, len(trimmed), slot_desc, stats, seq_resampled


def extract_video_raw_sequence(video_path: Path) -> tuple[np.ndarray, int, int, dict[str, Any]]:
    """
    Đọc toàn bộ video (step = 1, không skip frame, auto-orientation),
    chuẩn hóa kích thước (max_w=640, giữ aspect ratio), chuyển BGR -> RGB,
    và trích xuất keypoints bằng MediaPipe Hands (static_image_mode=False,
    model_complexity=0, min_detection_confidence=0.3, min_tracking_confidence=0.3).
    Trả về: (raw_sequence, total_frames, valid_hand_frames, video_meta).
    """
    if cv2 is None or mp is None:
        logger.error("OpenCV hoặc MediaPipe chưa được cài đặt trong môi trường này.")
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="OpenCV và MediaPipe chưa được cài đặt trên máy chủ để xử lý video trực tiếp.",
        )

    cap = cv2.VideoCapture(str(video_path))
    if hasattr(cv2, "CAP_PROP_ORIENTATION_AUTO"):
        try:
            cap.set(cv2.CAP_PROP_ORIENTATION_AUTO, 1)
        except Exception:
            pass

    total_raw_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) if cap.isOpened() else 0
    if not cap.isOpened() or total_raw_frames <= 0:
        if cap.isOpened():
            cap.release()
        fixed_path = video_path.with_name(f"fixed_{video_path.name}")
        try:
            cmd = [
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-i", str(video_path),
                "-c:v", "libx264", "-preset", "ultrafast",
                str(fixed_path)
            ]
            res = subprocess.run(cmd, capture_output=True, timeout=30)
            if res.returncode == 0 and fixed_path.is_file():
                cap = cv2.VideoCapture(str(fixed_path))
        except Exception:
            pass

    if not cap.isOpened():
        return np.zeros((0, 126), dtype=np.float32), 0, 0, {"width": 0, "height": 0, "aspect_ratio": 1.0, "fps": 0.0}

    vid_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    vid_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    vid_fps = float(cap.get(cv2.CAP_PROP_FPS)) if cap.get(cv2.CAP_PROP_FPS) > 0 else 30.0
    aspect_ratio = (vid_w / vid_h) if vid_h > 0 else 1.0
    video_meta = {
        "width": vid_w,
        "height": vid_h,
        "aspect_ratio": aspect_ratio,
        "fps": vid_fps,
    }

    mp_hands = mp.solutions.hands
    all_raw_frames: list[np.ndarray] = []
    valid_hand_frames = 0
    total_frames = 0

    try:
        with mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            model_complexity=0,
            min_detection_confidence=0.3,
            min_tracking_confidence=0.3,
        ) as hands:
            while True:
                ret, frame = cap.read()
                if not ret or frame is None:
                    break
                total_frames += 1

                frame_features, has_hand = extract_keypoints_from_image(frame, hands)
                all_raw_frames.append(frame_features)
                if has_hand:
                    valid_hand_frames += 1
    finally:
        cap.release()
        fixed_path = video_path.with_name(f"fixed_{video_path.name}")
        if fixed_path.is_file():
            try:
                fixed_path.unlink(missing_ok=True)
            except Exception:
                pass

    raw_array = np.array(all_raw_frames, dtype=np.float32) if all_raw_frames else np.zeros((0, 126), dtype=np.float32)
    return raw_array, total_frames, valid_hand_frames, video_meta


def process_video_keypoints(
    video_path: Path,
) -> tuple[dict, str, dict, dict, int, int, int, str, tuple[float, float, float], np.ndarray | None, dict[str, Any]]:
    """
    Xử lý video tải lên và dự đoán qua shared_inference_pipeline.
    """
    raw_sequence, total_frames, valid_hand_frames, video_meta = extract_video_raw_sequence(video_path)
    if valid_hand_frames < MIN_HAND_FRAMES or len(raw_sequence) == 0:
        empty_pred = {"label_id": "-1", "label_name": "Không phát hiện ký hiệu", "confidence": 0.0, "top3": []}
        return empty_pred, "none", empty_pred, empty_pred, total_frames, valid_hand_frames, 0, "Không có tay", (0.0, 0.0, 0.0), None, video_meta

    result, chosen, pred_orig, pred_flipped, valid_cnt, trim_cnt, slot_desc, stats, norm_seq = shared_inference_pipeline(
        raw_sequence,
        source_name="Video Upload",
        min_hand_frames=MIN_HAND_FRAMES,
        prefer_original=True,
    )
    return result, chosen, pred_orig, pred_flipped, total_frames, valid_cnt, trim_cnt, slot_desc, stats, norm_seq, video_meta


def process_camera_sequence(
    raw_sequence: np.ndarray,
    source_name: str = "Webcam Stream",
) -> tuple[dict, str, dict, dict, int, int, str, tuple[float, float, float]]:
    """
    Xử lý chuỗi keypoints từ Camera qua shared_inference_pipeline.
    """
    result, chosen, pred_orig, pred_flipped, valid_cnt, trim_cnt, slot_desc, stats, _ = shared_inference_pipeline(
        raw_sequence,
        source_name=source_name,
        min_hand_frames=MIN_HAND_FRAMES,
        prefer_original=False,
    )
    return result, chosen, pred_orig, pred_flipped, valid_cnt, trim_cnt, slot_desc, stats


def process_camera_frames(frames: list[np.ndarray], source_name: str = "Camera") -> dict[str, Any]:
    """
    Xử lý danh sách frame ảnh BGR từ Webcam:
    1. Trích xuất keypoints bằng MediaPipe Python (tự động resize max_w=640, model_complexity=0, BGR -> RGB).
    2. Chuyển sang mảng numpy và xử lý bằng shared_inference_pipeline.
    3. Trả về kết quả Top-1 kèm log terminal chi tiết.
    """
    if cv2 is None or mp is None or not frames:
        return {
            "label_id": "-1",
            "label_name": "Không phát hiện ký hiệu",
            "confidence": 0.0,
        }

    first_frame = frames[0]
    frame_h, frame_w = first_frame.shape[:2]
    aspect_ratio = (frame_w / frame_h) if frame_h > 0 else 1.0

    mp_hands = mp.solutions.hands
    all_frames: list[np.ndarray] = []

    with mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        model_complexity=0,
        min_detection_confidence=0.3,
        min_tracking_confidence=0.3,
    ) as hands:
        for frame in frames:
            if frame is None or frame.size == 0:
                continue
            frame_features, _ = extract_keypoints_from_image(frame, hands)
            all_frames.append(frame_features)

    if not all_frames:
        return {
            "label_id": "-1",
            "label_name": "Không phát hiện ký hiệu",
            "confidence": 0.0,
        }

    raw_array = np.array(all_frames, dtype=np.float32)
    result, chosen, pred_orig, pred_flipped, hand_cnt, trim_cnt, slot_desc, stats, _ = shared_inference_pipeline(
        raw_array, source_name=source_name, min_hand_frames=MIN_HAND_FRAMES, prefer_original=False
    )

    top3_orig = format_top3(pred_orig)
    top3_flip = format_top3(pred_flipped)
    s_min, s_max, s_mean = stats
    log_line = (
        f"\n{'='*70}\n"
        f"[CAMERA FRAMES] Nguồn: {source_name}\n"
        f"  - Kích thước & Tỷ lệ : {frame_w}x{frame_h} (Aspect Ratio: {aspect_ratio:.2f}) -> MediaPipe max_w=640\n"
        f"  - Khung hình nhận diện: {hand_cnt}/{len(all_frames)} frames có tay (Sau Static Trimming: {trim_cnt} frames)\n"
        f"  - Slot Hand Alignment: {slot_desc}\n"
        f"  - Chuẩn hóa npz      : min={s_min:.3f}, max={s_max:.3f}, mean={s_mean:.3f}\n"
        f"  - Chuỗi GỐC (Orig)    : Top-3: {top3_orig}\n"
        f"  - Chuỗi ĐẢO (Flipped) : Top-3: {top3_flip}\n"
        f"  - LỰA CHỌN CHIỀU      : {chosen.upper()}\n"
        f"  - KẾT QUẢ TOP-1       : '{result.get('label_name')}' (Độ tin cậy: {result.get('confidence', 0.0)*100:.1f}%)\n"
        f"{'='*70}\n"
    )
    logger.info(log_line.strip())
    print(log_line)

    return {
        "label_id": str(result["label_id"]),
        "label_name": str(result["label_name"]),
        "confidence": round(float(result["confidence"]), 4),
    }


@router.post(
    "/video/convert",
    status_code=status.HTTP_200_OK,
    summary="Chuyển video sang MP4 H.264 để nhận diện trong trình duyệt",
)
def convert_video_for_browser(video_file: UploadFile = File(...)):
    """Temporarily transcode browser-incompatible videos without persisting them."""
    suffix = Path(video_file.filename or "").suffix.lower()
    if suffix not in ALLOWED_VIDEO_SUFFIXES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Chỉ hỗ trợ video MP4, M4V, WebM, MOV hoặc OGV.",
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
                detail="Không thể chuyển đổi video này. Hãy thử một tệp video khác.",
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
            detail="Chuyển đổi video quá lâu. Hãy thử video ngắn hơn.",
        ) from error
    finally:
        video_file.file.close()
        if not output_path.is_file():
            shutil.rmtree(temporary_directory, ignore_errors=True)


@router.post(
    "/predict",
    response_model=GesturePredictResponse,
    status_code=status.HTTP_200_OK,
    summary="Nhận diện cử chỉ tay từ chuỗi 60 frames (Smart Trimming & Mirror Checking)"
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

    # 3. Gọi pipeline xử lý camera (Static Trimming, Mirror Check, 60 frames resampling)
    try:
        started_at = perf_counter()
        result, chosen, pred_orig, pred_flipped, hand_cnt, trim_cnt, slot_desc, stats = process_camera_sequence(
            input_data, source_name="Webcam Stream"
        )
        inference_ms = (perf_counter() - started_at) * 1000
        response.headers["X-Gesture-Inference-Ms"] = f"{inference_ms:.1f}"

        # In log chi tiết ra terminal
        top3_orig = format_top3(pred_orig)
        top3_flip = format_top3(pred_flipped)
        s_min, s_max, s_mean = stats
        log_line = (
            f"\n{'='*70}\n"
            f"[CAMERA PREDICT] Nhận diện camera realtime:\n"
            f"  - Frames đầu vào     : {len(input_data)} frames (Số frame có bàn tay: {hand_cnt} frames)\n"
            f"  - Static Trimming    : Cắt frame tĩnh đầu/cuối (displacement < 0.006) -> Còn {trim_cnt} frames -> Nội suy về 60 frames\n"
            f"  - Slot Hand Alignment: {slot_desc}\n"
            f"  - Chuẩn hóa npz      : min={s_min:.3f}, max={s_max:.3f}, mean={s_mean:.3f}\n"
            f"  - Chuỗi GỐC (Orig)   : Top-3: {top3_orig}\n"
            f"  - Chuỗi ĐẢO (Flipped): Top-3: {top3_flip}\n"
            f"  - LỰA CHỌN CHIỀU     : {chosen.upper()}\n"
            f"  - KẾT QUẢ TOP-1      : '{result.get('label_name')}' (Độ tin cậy: {result.get('confidence', 0.0)*100:.1f}%, time={inference_ms:.1f}ms)\n"
            f"{'='*70}\n"
        )
        print(log_line)
        logger.info(log_line.strip())

        return {
            "label_id": str(result["label_id"]),
            "label_name": str(result["label_name"]),
            "confidence": round(float(result["confidence"]), 4),
        }
    except Exception as e:
        logger.exception("Lỗi trong quá trình suy luận mô hình Camera")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi trong quá trình suy luận mô hình: {str(e)}"
        )


# ==============================================================================
# ENDPOINT NHẬN DIỆN CHO VIDEO UPLOAD (CHUẨN XÁC, NGUYÊN BẢN, TÁCH BIỆT HOÀN TOÀN)
# ==============================================================================
@router.post(
    "/video/predict",
    response_model=GesturePredictResponse,
    status_code=status.HTTP_200_OK,
    summary="Nhận diện cử chỉ tay từ video tải lên (chuẩn hóa 60 frames)",
)
@router.post(
    "/predict/video",
    response_model=GesturePredictResponse,
    status_code=status.HTTP_200_OK,
    summary="Nhận diện cử chỉ tay từ video tải lên (chuẩn hóa 60 frames)",
    include_in_schema=False,
)
def predict_video_gesture(
    video_file: UploadFile = File(...),
    response: Response = None,
):
    suffix = Path(video_file.filename or "").suffix.lower()
    if suffix not in ALLOWED_VIDEO_SUFFIXES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Chỉ hỗ trợ video MP4, M4V, WebM, MOV hoặc OGV.",
        )

    temporary_directory = Path(tempfile.mkdtemp(prefix="vsl-predict-video-"))
    input_path = temporary_directory / f"source{suffix}"

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

        started_at = perf_counter()
        result, chosen, pred_orig, pred_flipped, total_frames, valid_hand_frames, trim_cnt, slot_desc, stats, norm_seq, video_meta = process_video_keypoints(input_path)

        inference_ms = (perf_counter() - started_at) * 1000
        if response is not None:
            response.headers["X-Gesture-Inference-Ms"] = f"{inference_ms:.1f}"

        if norm_seq is None or result.get("label_id") == "-1":
            log_line = (
                f"\n{'='*70}\n"
                f"[VIDEO UPLOAD] Không phát hiện cử chỉ tay hợp lệ:\n"
                f"  - Tệp video           : {video_file.filename} ({written_bytes/1024:.1f} KB)\n"
                f"  - Kích thước & Tỷ lệ  : {video_meta['width']}x{video_meta['height']} (Aspect Ratio: {video_meta['aspect_ratio']:.2f}, {video_meta['fps']:.1f} fps)\n"
                f"  - Tổng số frame video : {total_frames} frames\n"
                f"  - Frame có bàn tay    : {valid_hand_frames} frames (< {MIN_HAND_FRAMES} frames hoặc dưới ngưỡng {CONFIDENCE_THRESHOLD})\n"
                f"  - KẾT QUẢ             : 'Không phát hiện ký hiệu' (Độ tin cậy: {result.get('confidence', 0.0)*100:.1f}%) - Chặn không đoán mò\n"
                f"{'='*70}\n"
            )
            logger.info(log_line.strip())
            print(log_line)
            return {
                "label_id": "-1",
                "label_name": "Không phát hiện ký hiệu",
                "confidence": 0.0,
            }

        top3_orig = format_top3(pred_orig)
        top3_flip = format_top3(pred_flipped)
        s_min, s_max, s_mean = stats
        log_line = (
            f"\n{'='*70}\n"
            f"[VIDEO UPLOAD] Nhận diện video thành công:\n"
            f"  - Tệp video           : {video_file.filename} ({written_bytes/1024:.1f} KB)\n"
            f"  - Kích thước & Tỷ lệ  : {video_meta['width']}x{video_meta['height']} (Aspect Ratio: {video_meta['aspect_ratio']:.2f}, {video_meta['fps']:.1f} fps) -> MediaPipe max_w=640\n"
            f"  - Tổng số frame video : {total_frames} frames (Số frame có bàn tay: {valid_hand_frames} frames, Sau Static Trimming: {trim_cnt} frames)\n"
            f"  - Slot Hand Alignment: {slot_desc}\n"
            f"  - Chuẩn hóa npz      : min={s_min:.3f}, max={s_max:.3f}, mean={s_mean:.3f}\n"
            f"  - Mảng keypoints      : {norm_seq.shape} (Nội suy mượt toàn bộ frame có tay, triệt tiêu 0.0 giả)\n"
            f"  - Chuỗi GỐC (Orig)    : Top-3: {top3_orig}\n"
            f"  - Chuỗi ĐẢO (Flipped) : Top-3: {top3_flip}\n"
            f"  - LỰA CHỌN CHIỀU      : {chosen.upper()}\n"
            f"  - KẾT QUẢ TOP-1       : '{result.get('label_name')}' (Độ tin cậy: {result.get('confidence', 0.0)*100:.1f}%, time={inference_ms:.1f}ms)\n"
            f"{'='*70}\n"
        )
        logger.info(log_line.strip())
        print(log_line)

        return {
            "label_id": str(result["label_id"]),
            "label_name": str(result["label_name"]),
            "confidence": round(float(result["confidence"]), 4),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error processing uploaded video for gesture prediction")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi trong quá trình xử lý video: {str(e)}",
        )
    finally:
        video_file.file.close()
        shutil.rmtree(temporary_directory, ignore_errors=True)


# ==============================================================================
# ENDPOINT NHẬN DIỆN CHO CAMERA (FRAMES BASE64)
# ==============================================================================
@router.post(
    "/predict/frames",
    response_model=GesturePredictResponse,
    status_code=status.HTTP_200_OK,
    summary="Nhận diện cử chỉ tay từ danh sách frame ảnh webcam (Smart Trimming & Mirror Checking)",
)
def predict_camera_frames(payload: GestureCameraFramesRequest, response: Response = None):
    if not payload.frames:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Danh sách frames không được rỗng.")

    started_at = perf_counter()
    bgr_frames: list[np.ndarray] = []
    for b64_str in payload.frames:
        try:
            raw = base64.b64decode(b64_str.split(",")[-1])
            np_arr = np.frombuffer(raw, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if img is not None:
                bgr_frames.append(img)
        except Exception:
            continue

    if len(bgr_frames) < MIN_HAND_FRAMES:
        if response is not None:
            response.headers["X-Gesture-Inference-Ms"] = "0.0"
        return {
            "label_id": "-1",
            "label_name": "Không phát hiện ký hiệu",
            "confidence": 0.0,
        }

    result = process_camera_frames(bgr_frames, source_name="Webcam Frame-Stream")
    inference_ms = (perf_counter() - started_at) * 1000
    if response is not None:
        response.headers["X-Gesture-Inference-Ms"] = f"{inference_ms:.1f}"

    return result


# ==============================================================================
# ENDPOINT NHẬN DIỆN CHO CAMERA (VIDEO CLIP TỪ WEBCAM)
# ==============================================================================
@router.post(
    "/predict/camera-clip",
    response_model=GesturePredictResponse,
    status_code=status.HTTP_200_OK,
    summary="Nhận diện cử chỉ tay từ đoạn clip ghi hình webcam (Smart Trimming & Mirror Checking)",
)
def predict_camera_clip(
    video_file: UploadFile = File(...),
    response: Response = None,
):
    temporary_directory = Path(tempfile.mkdtemp(prefix="vsl-camera-clip-"))
    suffix = Path(video_file.filename or "").suffix.lower() or ".webm"
    input_path = temporary_directory / f"camera_clip{suffix}"

    try:
        written_bytes = 0
        with input_path.open("wb") as destination:
            while chunk := video_file.file.read(UPLOAD_CHUNK_SIZE):
                written_bytes += len(chunk)
                if written_bytes > MAX_VIDEO_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="Video quá 50 MB.",
                    )
                destination.write(chunk)

        started_at = perf_counter()
        frames: list[np.ndarray] = []
        cap = cv2.VideoCapture(str(input_path))
        if cap.isOpened():
            while True:
                ret, frame = cap.read()
                if not ret or frame is None:
                    break
                frames.append(frame)
            cap.release()

        # Nếu file WebM/video ghi từ MediaRecorder thiếu cluster header, dùng ffmpeg remux
        if len(frames) == 0:
            fixed_path = input_path.with_name("fixed_clip.mp4")
            try:
                cmd = [
                    "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                    "-i", str(input_path),
                    "-c:v", "libx264", "-preset", "ultrafast",
                    str(fixed_path)
                ]
                res = subprocess.run(cmd, capture_output=True, timeout=15)
                if res.returncode == 0 and fixed_path.is_file():
                    cap = cv2.VideoCapture(str(fixed_path))
                    if cap.isOpened():
                        while True:
                            ret, frame = cap.read()
                            if not ret or frame is None:
                                break
                            frames.append(frame)
                        cap.release()
                    fixed_path.unlink(missing_ok=True)
            except Exception as e:
                logger.warning("Lỗi ffmpeg remux camera clip: %s", e)

        if len(frames) < MIN_HAND_FRAMES:
            if response is not None:
                response.headers["X-Gesture-Inference-Ms"] = "0.0"
            return {
                "label_id": "-1",
                "label_name": "Không phát hiện ký hiệu",
                "confidence": 0.0,
            }

        result = process_camera_frames(frames, source_name="Webcam Video-Clip")
        inference_ms = (perf_counter() - started_at) * 1000
        if response is not None:
            response.headers["X-Gesture-Inference-Ms"] = f"{inference_ms:.1f}"

        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error processing camera clip")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi trong quá trình xử lý camera clip: {str(e)}",
        )
    finally:
        video_file.file.close()
        shutil.rmtree(temporary_directory, ignore_errors=True)
