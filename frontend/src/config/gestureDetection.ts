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
    inferenceEveryDetectedFrames: 5,
    // Matches the former OpenCV pipeline: tolerate brief detection loss before
    // discarding a sequence, but never synthesize missing landmark frames.
    maxConsecutiveMissingFrames: 8,
    minConsecutiveStableFrames: 4,
    minimumPredictionConfidence: 0.75,
    stablePredictionCount: 2,
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
