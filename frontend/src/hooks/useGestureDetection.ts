import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { DrawingUtils, FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { gestureDetectionConfig, type GestureInputSource } from '../config/gestureDetection';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const PREDICT_URL = `${API_BASE_URL}/api/v1/gesture/predict`;
const EMPTY_FEATURES = 126;

export type GesturePrediction = { label_id: string; label_name: string; confidence: number };
export type DetectionPhase = 'idle' | 'no-hand' | 'outside-guide' | 'unstable' | 'collecting' | 'ready' | 'error';
export type HandDebugInfo = {
  label: 'Left' | 'Right' | 'Unknown';
  landmarkCount: number;
  handednessScore: number | null;
};
export type FrameQuality = {
  width: number;
  height: number;
  brightness: number | null;
  contrast: number | null;
  sharpness: number | null;
  handSpan: number | null;
  handCropped: boolean;
  warning: string | null;
};
export type GestureDebugInfo = {
  frameWidth: number;
  frameHeight: number;
  fps: number;
  detectedHands: number;
  leftHandDetected: boolean;
  rightHandDetected: boolean;
  landmarkCount: number;
  handednessScores: string;
  framesCollected: number;
  inputShape: string;
  inferenceMs: number | null;
  prediction: string | null;
  predictionConfidence: number | null;
};

type DetectorMode = 'IMAGE' | 'VIDEO';
type Landmark = HandLandmarkerResult['landmarks'][number][number];

const defaultDebugInfo: GestureDebugInfo = {
  frameWidth: 0,
  frameHeight: 0,
  fps: 0,
  detectedHands: 0,
  leftHandDetected: false,
  rightHandDetected: false,
  landmarkCount: 0,
  handednessScores: 'N/A',
  framesCollected: 0,
  inputShape: '(1, 60, 126)',
  inferenceMs: null,
  prediction: null,
  predictionConfidence: null,
};

function toHandLabel(value: string | undefined): HandDebugInfo['label'] {
  const label = value?.toLowerCase();
  if (label === 'left') return 'Left';
  if (label === 'right') return 'Right';
  return 'Unknown';
}

function hasFiniteLandmarks(landmarks: readonly Landmark[]) {
  return landmarks.length === 21 && landmarks.every((point) => (
    Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z)
  ));
}

/**
 * Feature order is deliberately fixed to the legacy/training pipeline:
 * 21 * (x, y, z) for Left followed by 21 * (x, y, z) for Right. Missing hands
 * remain zero-filled, exactly as in the pre-existing OpenCV extractor.
 */
export function extract126Landmarks(results: HandLandmarkerResult): number[] {
  const values = Array<number>(EMPTY_FEATURES).fill(0);
  results.landmarks.forEach((landmarks, handIndex) => {
    if (!hasFiniteLandmarks(landmarks)) return;
    const label = toHandLabel(results.handednesses[handIndex]?.[0]?.categoryName);
    const offset = label === 'Left' ? 0 : label === 'Right' ? 63 : -1;
    if (offset < 0) return;

    landmarks.forEach((point, pointIndex) => {
      const index = offset + pointIndex * 3;
      values[index] = point.x;
      values[index + 1] = point.y;
      values[index + 2] = point.z;
    });
  });
  return values;
}

function handBounds(landmarks: readonly Landmark[]) {
  const xs = landmarks.map((point) => point.x);
  const ys = landmarks.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, maxX, minY, maxY, span: Math.max(maxX - minX, maxY - minY) };
}

function inspectHands(results: HandLandmarkerResult) {
  const hands: HandDebugInfo[] = [];
  let outsideGuide = false;
  let handSpan: number | null = null;
  let handCropped = false;
  const guide = gestureDetectionConfig.guide;
  const guideRight = guide.left + guide.width;
  const guideBottom = guide.top + guide.height;

  results.landmarks.forEach((landmarks, index) => {
    if (!hasFiniteLandmarks(landmarks)) return;
    const category = results.handednesses[index]?.[0];
    const label = toHandLabel(category?.categoryName);
    const bounds = handBounds(landmarks);
    outsideGuide ||= bounds.minX < guide.left || bounds.maxX > guideRight || bounds.minY < guide.top || bounds.maxY > guideBottom;
    handCropped ||= bounds.minX <= 0.02 || bounds.maxX >= 0.98 || bounds.minY <= 0.02 || bounds.maxY >= 0.98;
    handSpan = Math.max(handSpan ?? 0, bounds.span);
    hands.push({
      label,
      landmarkCount: landmarks.length,
      handednessScore: typeof category?.score === 'number' ? category.score : null,
    });
  });

  return { hands, outsideGuide, handSpan, handCropped };
}

function assessFrameQuality(
  source: HTMLCanvasElement,
  sample: HTMLCanvasElement,
  handSpan: number | null,
  handCropped: boolean,
): FrameQuality {
  const width = source.width;
  const height = source.height;
  if (!width || !height) {
    return { width, height, brightness: null, contrast: null, sharpness: null, handSpan, handCropped, warning: 'Chưa nhận được khung hình hợp lệ.' };
  }

  const sampleWidth = 160;
  const sampleHeight = Math.max(1, Math.round((height / width) * sampleWidth));
  if (sample.width !== sampleWidth || sample.height !== sampleHeight) {
    sample.width = sampleWidth;
    sample.height = sampleHeight;
  }
  const context = sample.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return { width, height, brightness: null, contrast: null, sharpness: null, handSpan, handCropped, warning: null };
  }
  context.drawImage(source, 0, 0, sampleWidth, sampleHeight);
  const pixels = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
  let total = 0;
  let totalSquare = 0;
  let gradient = 0;
  let count = 0;
  for (let y = 0; y < sampleHeight; y += 1) {
    for (let x = 0; x < sampleWidth; x += 1) {
      const index = (y * sampleWidth + x) * 4;
      const luma = pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722;
      total += luma;
      totalSquare += luma * luma;
      count += 1;
      if (x > 0) {
        const previous = index - 4;
        const previousLuma = pixels[previous] * 0.2126 + pixels[previous + 1] * 0.7152 + pixels[previous + 2] * 0.0722;
        gradient += Math.abs(luma - previousLuma);
      }
    }
  }
  const brightness = total / count;
  const contrast = Math.sqrt(Math.max(0, totalSquare / count - brightness * brightness));
  const sharpness = gradient / Math.max(1, count - sampleHeight);
  const quality = gestureDetectionConfig.quality;
  let warning: string | null = null;
  if (width < quality.minFrameWidth || height < quality.minFrameHeight) warning = 'Độ phân giải thấp. Hãy dùng camera hoặc video từ 480×360 trở lên.';
  else if (brightness < quality.minBrightness) warning = 'Khung hình quá tối. Hãy tăng ánh sáng phía trước tay.';
  else if (brightness > quality.maxBrightness) warning = 'Khung hình quá sáng. Hãy giảm nguồn sáng chói phía sau tay.';
  else if (contrast < quality.minContrast) warning = 'Độ tương phản thấp. Hãy đặt tay trước nền khác màu.';
  else if (sharpness < quality.minSharpness) warning = 'Khung hình có thể bị mờ. Hãy giữ thiết bị và tay ổn định hơn.';
  else if (handSpan !== null && handSpan < quality.minHandSpan) warning = 'Bàn tay đang quá xa. Hãy đưa tay gần camera hơn.';
  else if (handCropped) warning = 'Một phần bàn tay bị cắt khỏi khung hình.';
  return { width, height, brightness, contrast, sharpness, handSpan, handCropped, warning };
}

export function useGestureDetection(
  videoRef: RefObject<HTMLVideoElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
) {
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const landmarkerModeRef = useRef<DetectorMode | null>(null);
  const landmarkerPromiseRef = useRef<Promise<HandLandmarker> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const qualityCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bufferRef = useRef<number[][]>([]);
  const requestPendingRef = useRef(false);
  const requestControllerRef = useRef<AbortController | null>(null);
  const detectingRef = useRef(false);
  const mountedRef = useRef(true);
  const lastVideoTimeRef = useRef(-1);
  const lastTimestampRef = useRef(-1);
  const missingHandsRef = useRef(0);
  const stableHandsRef = useRef(0);
  const detectedFrameCountRef = useRef(0);
  const sequenceGenerationRef = useRef(0);
  const predictionHistoryRef = useRef<GesturePrediction[]>([]);
  const qualityFrameRef = useRef(0);
  const qualityRef = useRef<FrameQuality | null>(null);
  const lastFpsAtRef = useRef(0);
  const fpsFramesRef = useRef(0);
  const fpsRef = useRef(0);
  const lastInferenceMsRef = useRef<number | null>(null);
  const lastDebugPublishAtRef = useRef(0);

  const [prediction, setPrediction] = useState<GesturePrediction | null>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedHands, setDetectedHands] = useState(0);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [phase, setPhase] = useState<DetectionPhase>('idle');
  const [handInfo, setHandInfo] = useState<HandDebugInfo[]>([]);
  const [frameQuality, setFrameQuality] = useState<FrameQuality | null>(null);
  const [debugEnabled, setDebugEnabled] = useState<boolean>(gestureDetectionConfig.debug.enabledByDefault);
  const [debugInfo, setDebugInfo] = useState<GestureDebugInfo>(defaultDebugInfo);

  const updateDetectedHands = useCallback((nextCount: number) => {
    setDetectedHands((current) => current === nextCount ? current : nextCount);
  }, []);

  const getLandmarker = useCallback((mode: DetectorMode) => {
    if (landmarkerRef.current && landmarkerModeRef.current === mode) return Promise.resolve(landmarkerRef.current);
    if (landmarkerPromiseRef.current) return landmarkerPromiseRef.current;

    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    landmarkerModeRef.current = null;
    landmarkerPromiseRef.current = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(gestureDetectionConfig.mediaPipe.wasmUrl);
      const landmarker = await HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: gestureDetectionConfig.mediaPipe.modelAssetUrl },
        runningMode: mode,
        numHands: gestureDetectionConfig.mediaPipe.numHands,
        minHandDetectionConfidence: gestureDetectionConfig.mediaPipe.minHandDetectionConfidence,
        minHandPresenceConfidence: gestureDetectionConfig.mediaPipe.minHandPresenceConfidence,
        minTrackingConfidence: gestureDetectionConfig.mediaPipe.minTrackingConfidence,
      });
      if (!mountedRef.current) {
        landmarker.close();
        throw new Error('Gesture detector was unmounted while loading.');
      }
      landmarkerRef.current = landmarker;
      landmarkerModeRef.current = mode;
      setIsModelReady(true);
      setDetectionError(null);
      return landmarker;
    })().catch((error: unknown) => {
      if (mountedRef.current) {
        setIsModelReady(false);
        setPhase('error');
        setDetectionError('Không tải được mô hình nhận diện bàn tay. Hãy kiểm tra kết nối mạng rồi thử lại.');
      }
      throw error;
    }).finally(() => {
      landmarkerPromiseRef.current = null;
    });
    return landmarkerPromiseRef.current;
  }, []);

  const drawHandLandmarks = useCallback((results: HandLandmarkerResult, hands: HandDebugInfo[]) => {
    const canvas = canvasRef.current;
    if (!canvas?.width || !canvas.height) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    const drawing = new DrawingUtils(context);
    results.landmarks.forEach((landmarks, index) => {
      if (!hasFiniteLandmarks(landmarks)) return;
      drawing.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: '#34d399', lineWidth: 4 });
      drawing.drawLandmarks(landmarks, { color: '#f8fafc', fillColor: '#10b981', radius: 4 });
      const wrist = landmarks[0];
      const label = hands[index]?.label ?? 'Unknown';
      context.save();
      context.font = '600 16px system-ui, sans-serif';
      context.fillStyle = '#f8fafc';
      context.strokeStyle = '#064e3b';
      context.lineWidth = 4;
      context.strokeText(label, wrist.x * canvas.width + 8, wrist.y * canvas.height - 8);
      context.fillText(label, wrist.x * canvas.width + 8, wrist.y * canvas.height - 8);
      context.restore();
    });
  }, [canvasRef]);

  const publishDebug = useCallback((hands: HandDebugInfo[], inferenceMs?: number) => {
    if (inferenceMs !== undefined) lastInferenceMsRef.current = inferenceMs;
    const now = performance.now();
    if (now - lastDebugPublishAtRef.current < 100) return;
    lastDebugPublishAtRef.current = now;
    const video = videoRef.current;
    const landmarkCount = hands.reduce((total, hand) => total + hand.landmarkCount, 0);
    const currentPrediction = predictionHistoryRef.current[predictionHistoryRef.current.length - 1] ?? null;
    setDebugInfo({
      frameWidth: video?.videoWidth ?? 0,
      frameHeight: video?.videoHeight ?? 0,
      fps: fpsRef.current,
      detectedHands: hands.length,
      leftHandDetected: hands.some((hand) => hand.label === 'Left'),
      rightHandDetected: hands.some((hand) => hand.label === 'Right'),
      landmarkCount,
      handednessScores: hands.length
        ? hands.map((hand) => `${hand.label}: ${hand.handednessScore === null ? 'N/A' : hand.handednessScore.toFixed(2)}`).join(', ')
        : 'N/A',
      framesCollected: bufferRef.current.length,
      inputShape: `(1, ${gestureDetectionConfig.sequence.length}, 126)`,
      inferenceMs: lastInferenceMsRef.current,
      prediction: currentPrediction?.label_name ?? null,
      predictionConfidence: currentPrediction?.confidence ?? null,
    });
  }, [videoRef]);

  const resetSequence = useCallback(() => {
    sequenceGenerationRef.current += 1;
    bufferRef.current = [];
    missingHandsRef.current = 0;
    stableHandsRef.current = 0;
    detectedFrameCountRef.current = 0;
    predictionHistoryRef.current = [];
  }, []);

  const stopDetection = useCallback((clearPrediction = true, abortRequest = true) => {
    detectingRef.current = false;
    if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    if (abortRequest) {
      requestControllerRef.current?.abort();
      requestControllerRef.current = null;
      requestPendingRef.current = false;
    }
    resetSequence();
    updateDetectedHands(0);
    setHandInfo([]);
    setPhase('idle');
    if (mountedRef.current) {
      setIsDetecting(false);
      if (clearPrediction) setPrediction(null);
    }
  }, [resetSequence, updateDetectedHands]);

  const startDetection = useCallback(async (source: GestureInputSource) => {
    if (detectingRef.current || animationFrameRef.current !== null) return;
    detectingRef.current = true;
    const detectorMode: DetectorMode = source === 'upload' ? 'IMAGE' : 'VIDEO';
    try {
      const initialLandmarker = await getLandmarker(detectorMode);
      const landmarker = landmarkerModeRef.current === detectorMode
        ? initialLandmarker
        : await getLandmarker(detectorMode);
      if (!mountedRef.current || !detectingRef.current || !videoRef.current) {
        detectingRef.current = false;
        return;
      }

      resetSequence();
      lastVideoTimeRef.current = -1;
      lastTimestampRef.current = -1;
      qualityFrameRef.current = 0;
      lastFpsAtRef.current = performance.now();
      fpsFramesRef.current = 0;
      fpsRef.current = 0;
      lastInferenceMsRef.current = null;
      setPrediction(null);
      setDetectionError(null);
      qualityRef.current = null;
      setFrameQuality(null);
      setPhase('no-hand');
      setIsDetecting(true);

      const processFrame = () => {
        if (!mountedRef.current || !detectingRef.current) return;
        const video = videoRef.current;
        if (video && !video.paused && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth && video.videoHeight) {
          // A CSS transform does not change the pixels passed to MediaPipe. The
          // legacy training/test pipeline mirrored every frame before detection,
          // so mirror in an off-screen canvas and draw the visible overlay in
          // that same coordinate system. No crop or coordinate normalization is added.
          if (video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;
            const processingCanvas = processingCanvasRef.current ?? document.createElement('canvas');
            processingCanvasRef.current = processingCanvas;
            if (processingCanvas.width !== video.videoWidth || processingCanvas.height !== video.videoHeight) {
              processingCanvas.width = video.videoWidth;
              processingCanvas.height = video.videoHeight;
            }
            const processingContext = processingCanvas.getContext('2d', { willReadFrequently: true });
            if (processingContext) {
              processingContext.setTransform(-1, 0, 0, 1, processingCanvas.width, 0);
              processingContext.drawImage(video, 0, 0, processingCanvas.width, processingCanvas.height);
              processingContext.setTransform(1, 0, 0, 1, 0, 0);

              const timestamp = Math.max(Math.round(video.currentTime * 1000), lastTimestampRef.current + 1);
              lastTimestampRef.current = timestamp;
              const results = detectorMode === 'VIDEO'
                ? landmarker.detectForVideo(processingCanvas, timestamp)
                : landmarker.detect(processingCanvas);
              const handInspection = inspectHands(results);
              const hands = handInspection.hands;
              updateDetectedHands(hands.length);
              setHandInfo((current) => (
                current.length === hands.length
                && current.every((hand, index) => hand.label === hands[index].label && hand.landmarkCount === hands[index].landmarkCount)
              ) ? current : hands);
              drawHandLandmarks(results, hands);

              fpsFramesRef.current += 1;
              const now = performance.now();
              if (now - lastFpsAtRef.current >= 500) {
                fpsRef.current = Math.round((fpsFramesRef.current * 1000) / (now - lastFpsAtRef.current));
                fpsFramesRef.current = 0;
                lastFpsAtRef.current = now;
              }

              qualityFrameRef.current += 1;
              if (qualityFrameRef.current % gestureDetectionConfig.quality.sampleEveryFrames === 0 || !qualityRef.current) {
                const qualityCanvas = qualityCanvasRef.current ?? document.createElement('canvas');
                qualityCanvasRef.current = qualityCanvas;
                const nextQuality = assessFrameQuality(processingCanvas, qualityCanvas, handInspection.handSpan, handInspection.handCropped);
                qualityRef.current = nextQuality;
                setFrameQuality(nextQuality);
              }

              if (hands.length > 0) {
                missingHandsRef.current = 0;
                stableHandsRef.current += 1;
                detectedFrameCountRef.current += 1;
                const features = extract126Landmarks(results);
                if (features.length !== EMPTY_FEATURES || !features.every(Number.isFinite)) {
                  setPhase('error');
                  setDetectionError('Landmarks không hợp lệ nên không thể gửi tới mô hình.');
                } else {
                  bufferRef.current.push(features);
                  if (bufferRef.current.length > gestureDetectionConfig.sequence.length) bufferRef.current.shift();
                  if (handInspection.outsideGuide) setPhase('outside-guide');
                  else if (stableHandsRef.current < gestureDetectionConfig.sequence.minConsecutiveStableFrames) setPhase('unstable');
                  else if (bufferRef.current.length < gestureDetectionConfig.sequence.length) setPhase('collecting');
                  else setPhase('ready');

                  if (
                    bufferRef.current.length === gestureDetectionConfig.sequence.length
                    && stableHandsRef.current >= gestureDetectionConfig.sequence.minConsecutiveStableFrames
                    && detectedFrameCountRef.current % gestureDetectionConfig.sequence.inferenceEveryDetectedFrames === 0
                    && !requestPendingRef.current
                  ) {
                    requestPendingRef.current = true;
                    const controller = new AbortController();
                    requestControllerRef.current = controller;
                    const sequence = bufferRef.current.map((frame) => [...frame]);
                    const sequenceGeneration = sequenceGenerationRef.current;
                    const requestStartedAt = performance.now();
                    void fetch(PREDICT_URL, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ sequence }),
                      signal: controller.signal,
                    })
                      .then(async (response) => {
                        if (!response.ok) throw new Error(`Gesture prediction failed: ${response.status}`);
                        const result = await response.json() as GesturePrediction;
                        const serverTime = Number(response.headers.get('X-Gesture-Inference-Ms'));
                        return { result, inferenceMs: Number.isFinite(serverTime) ? serverTime : performance.now() - requestStartedAt };
                      })
                      .then(({ result, inferenceMs }) => {
                        if (!mountedRef.current || sequenceGeneration !== sequenceGenerationRef.current) return;
                        const history = [...predictionHistoryRef.current, result].slice(-gestureDetectionConfig.sequence.stablePredictionCount);
                        predictionHistoryRef.current = history;
                        const stable = history.length === gestureDetectionConfig.sequence.stablePredictionCount
                          && history.every((item) => item.label_id === result.label_id);
                        if (stable && result.confidence >= gestureDetectionConfig.sequence.minimumPredictionConfidence) {
                          setPrediction(result);
                        }
                        publishDebug(hands, Math.round(inferenceMs));
                        if (debugEnabled && gestureDetectionConfig.debug.consoleLogging) {
                          console.debug('[VSL gesture]', { phase: 'inference', inputShape: '(1, 60, 126)', inferenceMs: Math.round(inferenceMs), label: result.label_name, confidence: result.confidence });
                        }
                      })
                      .catch((error: unknown) => {
                        if (error instanceof DOMException && error.name === 'AbortError') return;
                        console.error('Gesture prediction request failed:', error);
                        if (mountedRef.current) {
                          setPhase('error');
                          setDetectionError('Không thể kết nối dịch vụ nhận diện từ vựng. Hãy kiểm tra backend rồi thử lại.');
                        }
                      })
                      .finally(() => {
                        if (requestControllerRef.current === controller) requestControllerRef.current = null;
                        requestPendingRef.current = false;
                      });
                  }
                }
              } else {
                stableHandsRef.current = 0;
                missingHandsRef.current += 1;
                if (missingHandsRef.current > gestureDetectionConfig.sequence.maxConsecutiveMissingFrames) {
                  resetSequence();
                  setPrediction(null);
                  setPhase('no-hand');
                } else {
                  setPhase('unstable');
                }
              }
              publishDebug(hands);
            }
          }
        }
        animationFrameRef.current = requestAnimationFrame(processFrame);
      };
      animationFrameRef.current = requestAnimationFrame(processFrame);
    } catch (error) {
      detectingRef.current = false;
      setIsDetecting(false);
      throw error;
    }
  }, [debugEnabled, drawHandLandmarks, getLandmarker, publishDebug, resetSequence, updateDetectedHands, videoRef]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      detectingRef.current = false;
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      requestControllerRef.current?.abort();
      requestControllerRef.current = null;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      landmarkerModeRef.current = null;
      bufferRef.current = [];
    };
  }, []);

  return {
    prediction,
    isModelReady,
    isDetecting,
    detectedHands,
    detectionError,
    phase,
    handInfo,
    frameQuality,
    debugEnabled,
    setDebugEnabled,
    debugInfo,
    startDetection,
    stopDetection,
  };
}
