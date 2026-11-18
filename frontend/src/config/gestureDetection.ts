/**
 * One place for the client-side hand detector settings.
 *
 * The defaults intentionally match MediaPipe's documented 0.5 defaults and
 * the legacy OpenCV test program in this repository. Tune a value only after
 * recording the result against representative VSL videos; changing it does
 * not change the classifier's 126-feature input or its normalization.
 */
export const gestureDetectionConfig = {
  mediaPipe: {
    wasmUrl: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm',
    modelAssetUrl: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  },
  sequence: {
    length: 60,
    // Số frame tối thiểu để coi là có ký hiệu hợp lệ khi hạ tay sớm (từ 12 frames trở lên)
    minFramesForGesture: 12,
    minGestureFrames: 12,
    // Giới hạn bộ đệm (buffer) tối đa đúng 60 frames: chốt ngay khi đủ 60 frames
    maxGestureFrames: 60,
    // Số frame mất dấu tay tối đa được coi là nhiễu mờ vung tay (1-4 frames) vẫn giữ chuỗi
    maxTemporaryDropFrames: 4,
    // Số frame mất dấu tay liên tiếp để chốt kết thúc cử chỉ (người dùng hạ tay nghỉ, 8 frames)
    dropHandFrames: 8,
    // Trạng thái nghỉ / non-sign: không phát hiện bàn tay trong khoảng 10-15 frame liên tiếp
    maxConsecutiveMissingFrames: 10,
    // Thời gian nghỉ giữa 2 từ (cooldown) tính theo ms (~0.5 giây)
    interGestureCooldownMs: 500,
    // Ngưỡng vận tốc di chuyển tĩnh
    stillVelocityThreshold: 0.006,
    stillFramesRequired: 16,
    // Hạ nhẹ ngưỡng độ tin cậy (~0.5 - 0.6) để Camera bắt nhạy và ổn định
    confidenceThreshold: 0.50,
    minConsecutiveStableFrames: 4,
    minimumPredictionConfidence: 0.50,
    stablePredictionCount: 1,
    minFramesForRealtimeInference: 12,
    maxBufferLength: 60,
  },
  quality: {
    minFrameWidth: 480,
    minFrameHeight: 360,
    minBrightness: 35,
    maxBrightness: 220,
    minContrast: 18,
    minSharpness: 7,
    minHandSpan: 0.07,
    sampleEveryFrames: 10,
  },
  guide: {
    left: 0.14,
    top: 0.1,
    width: 0.72,
    height: 0.8,
  },
  debug: {
    enabledByDefault: false,
    consoleLogging: true,
  },
} as const;

export type GestureInputSource = 'camera' | 'upload';
