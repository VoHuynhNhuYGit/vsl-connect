/**
 * Tiện ích nội suy tuyến tính và xử lý chuỗi keypoints cử chỉ VSL.
 *
 * Yêu cầu mô hình AI (LSTM) ở Backend:
 * - Đầu vào bắt buộc là một chuỗi cố định 60 frames (seq_len = 60), mỗi frame gồm 126 keypoints (21 điểm x 3 tọa độ x 2 bàn tay).
 *
 * Thuật toán:
 * - Nếu tổng số frame có tay nằm trong khoảng từ 10 đến 59 frames (video ngắn 2-3s):
 *   KHÔNG được chèn zero-padding (toàn số 0). Dùng nội suy tuyến tính (linspace từ 0 đến N-1 lấy đủ 60 điểm)
 *   để co giãn chuỗi keypoints thành đúng 60 frames, giúp giữ nguyên quỹ đạo cử chỉ từ đầu đến cuối.
 * - Nếu video dài hơn 60 frames: lấy mẫu đều 60 frames trải dài toàn bộ đoạn có cử chỉ.
 */

export const EMPTY_FEATURES = 126;

/**
 * Tính vận tốc di chuyển trung bình (Euclidean displacement) của các điểm keypoints giữa 2 frames.
 * Chỉ tính các điểm được phát hiện (tọa độ khác 0) ở cả hai frame.
 */
export function calculateLandmarkDisplacement(prev: number[], curr: number[]): number {
  if (prev.length !== EMPTY_FEATURES || curr.length !== EMPTY_FEATURES) return 0;
  let totalDist = 0;
  let count = 0;

  // 42 landmarks: 21 điểm bàn tay trái (0..62) và 21 điểm bàn tay phải (63..125)
  for (let i = 0; i < 42; i++) {
    const idx = i * 3;
    const px = prev[idx];
    const py = prev[idx + 1];
    const cx = curr[idx];
    const cy = curr[idx + 1];

    if ((px !== 0 || py !== 0) && (cx !== 0 || cy !== 0)) {
      const dx = cx - px;
      const dy = cy - py;
      totalDist += Math.sqrt(dx * dx + dy * dy);
      count += 1;
    }
  }

  return count > 0 ? totalDist / count : 0;
}

/**
 * Co giãn hoặc lấy mẫu đều chuỗi keypoints về đúng targetLen (mặc định 60 frames)
 * bằng thuật toán nội suy tuyến tính (linear interpolation).
 */
export function resampleKeypointsSequence(frames: number[][], targetLen = 60): number[][] {
  const n = frames.length;
  if (n === 0) return [];
  if (n === targetLen) return frames.map((frame) => [...frame]);
  if (n === 1) return Array.from({ length: targetLen }, () => [...frames[0]]);

  const resampled: number[][] = [];
  const featureLen = frames[0].length;

  for (let i = 0; i < targetLen; i++) {
    const t = (i / (targetLen - 1)) * (n - 1);
    const low = Math.floor(t);
    const high = Math.min(n - 1, Math.ceil(t));
    const weight = t - low;

    const frame = new Array<number>(featureLen);
    for (let j = 0; j < featureLen; j++) {
      frame[j] = (1 - weight) * frames[low][j] + weight * frames[high][j];
    }
    resampled.push(frame);
  }

  return resampled;
}

export type FrameExtraction = {
  hasHand: boolean;
  features: number[];
};

/**
 * Xử lý chuỗi frames trích xuất từ video:
 * 1. Lọc bỏ các frame rỗng ở đầu/cuối video (những frame không phát hiện bàn tay).
 * 2. Nếu tổng số frame có tay dưới 8 frames: trả về null (non-sign).
 * 3. Nếu >= 8 frames: co giãn/lấy mẫu đều về đúng 60 frames mà không dùng zero-padding.
 */
export function processExtractedVideoFrames(
  frames: readonly FrameExtraction[],
  targetLen = 60,
  minHandFrames = 8,
): number[][] | null {
  if (!frames || frames.length === 0) return null;

  let firstHandIdx = -1;
  let lastHandIdx = -1;
  for (let i = 0; i < frames.length; i++) {
    if (frames[i].hasHand) {
      if (firstHandIdx === -1) firstHandIdx = i;
      lastHandIdx = i;
    }
  }

  if (firstHandIdx === -1) {
    return null;
  }

  const gestureFrames = frames
    .slice(firstHandIdx, lastHandIdx + 1)
    .filter((f) => f.hasHand)
    .map((f) => f.features);

  if (gestureFrames.length < minHandFrames) {
    return null;
  }

  return resampleKeypointsSequence(gestureFrames, targetLen);
}
