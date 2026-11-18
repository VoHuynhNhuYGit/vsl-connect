import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { DrawingUtils, FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { gestureDetectionConfig, type GestureInputSource } from '../config/gestureDetection';
import {
  resampleKeypointsSequence,
  calculateLandmarkDisplacement,
  EMPTY_FEATURES,
} from '../utils/gestureInterpolation';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const PREDICT_URL = `${API_BASE_URL}/api/v1/gesture/predict`;
const PREDICT_VIDEO_URL = `${API_BASE_URL}/api/v1/gesture/predict/video`;

export { resampleKeypointsSequence };
export type TopPrediction = { label_id: string; label_name: string; confidence: number };
export type GesturePrediction = { label_id: string; label_name: string; confidence: number; top3?: TopPrediction[] };
export type DetectionPhase = 'idle' | 'no-hand' | 'outside-guide' | 'unstable' | 'collecting' | 'predicting' | 'ready' | 'error';
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
 * Thứ tự đặc trưng khớp 100% với pipeline huấn luyện mô hình:
 * - 21 điểm x 3 tọa độ (x, y, z) cho bàn tay Trái (indices 0..62)
 * - 21 điểm x 3 tọa độ (x, y, z) cho bàn tay Phải (indices 63..125)
 * Tuyệt đối không lật tọa độ X của keypoints để giữ nguyên vẹn không gian huấn luyện.
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
  sample.width = 64;
  sample.height = 48;
  const context = sample.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return { width, height, brightness: null, contrast: null, sharpness: null, handSpan, handCropped, warning: null };
  }
  context.drawImage(source, 0, 0, sample.width, sample.height);
  const image = context.getImageData(0, 0, sample.width, sample.height);
  const data = image.data;
  let totalLuminance = 0;
  const luminances: number[] = [];

  for (let index = 0; index < data.length; index += 4) {
    const luminance = 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
    luminances.push(luminance);
    totalLuminance += luminance;
  }

  const pixelCount = luminances.length;
  const brightness = pixelCount ? totalLuminance / pixelCount : 0;
  const variance = pixelCount
    ? luminances.reduce((total, value) => total + (value - brightness) ** 2, 0) / pixelCount
    : 0;
  const contrast = Math.sqrt(variance);

  let laplacianSum = 0;
  const sampleWidth = sample.width;
  for (let y = 1; y < sample.height - 1; y++) {
    for (let x = 1; x < sampleWidth - 1; x++) {
      const center = luminances[y * sampleWidth + x];
      const delta = (
        luminances[(y - 1) * sampleWidth + x]
        + luminances[(y + 1) * sampleWidth + x]
        + luminances[y * sampleWidth + (x - 1)]
        + luminances[y * sampleWidth + (x + 1)]
        - 4 * center
      );
      laplacianSum += Math.abs(delta);
    }
  }
  const innerPixels = (sample.width - 2) * (sample.height - 2);
  const sharpness = innerPixels ? laplacianSum / innerPixels : 0;

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

  // Bộ gom cử chỉ thông minh (Gesture Sequence Buffer & Debounce)
  const gestureBufferRef = useRef<number[][]>([]);
  const isCollectingRef = useRef(false);
  const consecutiveMissingHandsRef = useRef(0);
  const stillCountRef = useRef(0);
  const prevFeaturesRef = useRef<number[] | null>(null);
  const cooldownUntilRef = useRef(0);
  const waitingForHandResetRef = useRef(false);
  const isPredictingRef = useRef(false);

  const currentSourceRef = useRef<GestureInputSource>('camera');
  const requestControllerRef = useRef<AbortController | null>(null);
  const detectingRef = useRef(false);
  const mountedRef = useRef(true);
  const lastVideoTimeRef = useRef(-1);
  const lastTimestampRef = useRef(-1);
  const qualityFrameRef = useRef(0);
  const qualityRef = useRef<FrameQuality | null>(null);
  const lastFpsAtRef = useRef(0);
  const fpsFramesRef = useRef(0);
  const fpsRef = useRef(0);
  const lastInferenceMsRef = useRef<number | null>(null);
  const lastDebugPublishAtRef = useRef(0);

  const [prediction, setPrediction] = useState<GesturePrediction | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [recognitionHistory, setRecognitionHistory] = useState<GesturePrediction[]>([]);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedHands, setDetectedHands] = useState(0);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [phase, setPhase] = useState<DetectionPhase>('idle');
  const [handInfo, setHandInfo] = useState<HandDebugInfo[]>([]);
  const [frameQuality, setFrameQuality] = useState<FrameQuality | null>(null);
  const [debugEnabled, setDebugEnabled] = useState<boolean>(gestureDetectionConfig.debug.enabledByDefault);
  const [debugInfo, setDebugInfo] = useState<GestureDebugInfo>(defaultDebugInfo);

  const clearHistory = useCallback(() => {
    setRecognitionHistory([]);
  }, []);

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
    const isMirrored = currentSourceRef.current !== 'upload';

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
      if (isMirrored) {
        context.translate(wrist.x * canvas.width - 8, wrist.y * canvas.height - 8);
        context.scale(-1, 1);
        context.strokeText(label, 0, 0);
        context.fillText(label, 0, 0);
      } else {
        context.strokeText(label, wrist.x * canvas.width + 8, wrist.y * canvas.height - 8);
        context.fillText(label, wrist.x * canvas.width + 8, wrist.y * canvas.height - 8);
      }
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
    setDebugInfo((prev) => ({
      ...prev,
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
      framesCollected: gestureBufferRef.current.length,
      inferenceMs: lastInferenceMsRef.current,
      prediction: prev.prediction,
      predictionConfidence: prev.predictionConfidence,
    }));
  }, [videoRef]);

  /**
   * Gửi chuỗi 60 frames đã nội suy đều xuống Backend dự đoán qua POST /api/v1/gesture/predict.
   * Áp dụng cờ khóa Request Locking (isPredicting) để chống nghẽn và chồng chéo.
   */
  const submitSequenceToBackend = useCallback(async (
    sequence: number[][],
    currentHands: HandDebugInfo[],
  ) => {
    if (isPredictingRef.current) return;
    isPredictingRef.current = true;
    setIsPredicting(true);
    setPhase('predicting');

    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    const requestStartedAt = performance.now();

    try {
      const response = await fetch(PREDICT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Inference request failed: ${response.status}`);
      }

      const result = (await response.json()) as GesturePrediction;
      const serverTime = Number(response.headers.get('X-Gesture-Inference-Ms'));
      const inferenceMs = Number.isFinite(serverTime) ? serverTime : performance.now() - requestStartedAt;

      if (!mountedRef.current) return;

      setPrediction(result);
      if (result.label_id !== '-1') {
        setRecognitionHistory((prev) => [result, ...prev].slice(0, 10));
      }

      setDebugInfo((prev) => ({
        ...prev,
        prediction: result.label_name,
        predictionConfidence: result.confidence,
      }));
      publishDebug(currentHands, Math.round(inferenceMs));

      // Console log Top-3 xác suất cao nhất
      if (gestureDetectionConfig.debug.consoleLogging) {
        const top3Str = result.top3
          ? result.top3.map((t) => `${t.label_name} (${(t.confidence * 100).toFixed(1)}%)`).join(' | ')
          : 'N/A';
        console.info(
          `[VSL Gesture Recognized] ${result.label_name} (${(result.confidence * 100).toFixed(1)}%) | Top-3: ${top3Str} | Time: ${Math.round(inferenceMs)}ms`
        );
      }

      // Trạng thái nghỉ giữa 2 từ (Cooldown ~0.5s) và đợi hạ tay / đổi tư thế
      cooldownUntilRef.current = performance.now() + gestureDetectionConfig.sequence.interGestureCooldownMs;
      waitingForHandResetRef.current = true;
      setPhase('ready');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Gesture inference failed:', error);
      if (mountedRef.current) {
        setPhase('error');
        setDetectionError('Không thể nhận diện ký hiệu từ camera. Hãy kiểm tra kết nối tới backend rồi thử lại.');
      }
    } finally {
      if (requestControllerRef.current === controller) requestControllerRef.current = null;
      isPredictingRef.current = false;
      if (mountedRef.current) {
        setIsPredicting(false);
      }
    }
  }, [publishDebug]);

  /**
   * Nhận diện file video tải lên qua POST /api/v1/gesture/predict/video (Độc lập 100% với camera).
   */
  const predictVideoFile = useCallback(async (file: File): Promise<GesturePrediction | null> => {
    const formData = new FormData();
    formData.append('video_file', file);
    try {
      const response = await fetch(PREDICT_VIDEO_URL, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = (await response.json()) as GesturePrediction;
      setPrediction(result);
      setPhase('ready');
      return result;
    } catch (err) {
      console.error('Error predicting uploaded video:', err);
      setPhase('error');
      setDetectionError('Không thể nhận diện ký hiệu từ video đã chọn.');
      return null;
    }
  }, []);

  const stopDetection = useCallback((clearPrediction = true, abortRequest = true) => {
    detectingRef.current = false;
    if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    if (abortRequest) {
      requestControllerRef.current?.abort();
      requestControllerRef.current = null;
      isPredictingRef.current = false;
    }
    gestureBufferRef.current = [];
    isCollectingRef.current = false;
    consecutiveMissingHandsRef.current = 0;
    updateDetectedHands(0);
    setHandInfo([]);
    setPhase('idle');
    if (mountedRef.current) {
      setIsDetecting(false);
      setIsPredicting(false);
      if (clearPrediction) setPrediction(null);
    }
  }, [updateDetectedHands]);

  const startDetection = useCallback(async (source: GestureInputSource) => {
    if (detectingRef.current || animationFrameRef.current !== null) return;
    detectingRef.current = true;
    currentSourceRef.current = source;
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

      gestureBufferRef.current = [];
      isCollectingRef.current = false;
      consecutiveMissingHandsRef.current = 0;
      stillCountRef.current = 0;
      prevFeaturesRef.current = null;
      isPredictingRef.current = false;
      lastVideoTimeRef.current = -1;
      lastTimestampRef.current = -1;
      qualityFrameRef.current = 0;
      lastFpsAtRef.current = performance.now();
      fpsFramesRef.current = 0;
      fpsRef.current = 0;
      lastInferenceMsRef.current = null;
      if (source !== 'upload') {
        setPrediction(null);
      }
      setDetectionError(null);
      qualityRef.current = null;
      setFrameQuality(null);
      setPhase('no-hand');
      setIsDetecting(true);

      const processFrame = () => {
        if (!mountedRef.current || !detectingRef.current) return;
        const video = videoRef.current;
        if (video && !video.paused && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth && video.videoHeight) {
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
              // Vẽ video tự nhiên vào processingCanvas, không lật ngược
              processingContext.drawImage(video, 0, 0, processingCanvas.width, processingCanvas.height);

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

              // Vẽ visual feedback landmarks
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

              // ================================================================
              // BỘ GOM CỬ CHỈ THÔNG MINH CHO CAMERA REALTIME (DEBOUNCE + LOCK)
              // ================================================================
              if (source === 'camera') {
                // 1. Cờ khóa Request Locking: nếu đang chờ kết quả từ Backend thì không gửi chồng chéo
                if (isPredictingRef.current) {
                  publishDebug(hands);
                  animationFrameRef.current = requestAnimationFrame(processFrame);
                  return;
                }

                // 2. Cooldown nghỉ giữa 2 từ (~0.5s) hoặc chờ người dùng hạ tay / chuẩn bị động tác mới
                if (now < cooldownUntilRef.current) {
                  publishDebug(hands);
                  animationFrameRef.current = requestAnimationFrame(processFrame);
                  return;
                }

                // Nếu đang chờ người dùng hạ tay sau từ trước:
                if (waitingForHandResetRef.current) {
                  if (hands.length === 0 || now > cooldownUntilRef.current + 800) {
                    waitingForHandResetRef.current = false;
                  } else {
                    // Người dùng chưa hạ tay, tiếp tục chờ
                    publishDebug(hands);
                    animationFrameRef.current = requestAnimationFrame(processFrame);
                    return;
                  }
                }

                const features = extract126Landmarks(results);

                if (hands.length > 0) {
                  consecutiveMissingHandsRef.current = 0;

                  if (!isCollectingRef.current) {
                    // Bắt đầu thu cử chỉ mới khi phát hiện tay
                    isCollectingRef.current = true;
                    gestureBufferRef.current = [features];
                    stillCountRef.current = 0;
                    prevFeaturesRef.current = features;
                    setPhase('collecting');
                  } else {
                    // Đang ghi nhận chuỗi chuyển động
                    gestureBufferRef.current.push(features);
                    setPhase('collecting');

                    // Chốt trần đúng 60 frames:
                    // Nếu người dùng giữ tay lâu, KHÔNG được gom vượt quá 60 frames — tự động chốt và gửi dự đoán ngay khi đủ 60 frames
                    if (gestureBufferRef.current.length >= 60) {
                      const raw = gestureBufferRef.current.slice(0, 60);
                      gestureBufferRef.current = [];
                      isCollectingRef.current = false;
                      stillCountRef.current = 0;
                      void submitSequenceToBackend(raw, hands);
                    }
                  }
                } else {
                  // Mất bàn tay trong frame hiện tại
                  consecutiveMissingHandsRef.current += 1;
                  stillCountRef.current = 0;
                  prevFeaturesRef.current = null;

                  if (isCollectingRef.current) {
                    // Debounce: Nếu chỉ mất tay 1-4 frames do vung tay nhanh bị mờ:
                    if (consecutiveMissingHandsRef.current <= gestureDetectionConfig.sequence.maxTemporaryDropFrames) {
                      // KHÔNG XÓA BUFFER, lặp lại frame cuối để giữ quỹ đạo liền mạch (tối đa 60 frames)
                      if (gestureBufferRef.current.length > 0 && gestureBufferRef.current.length < 60) {
                        gestureBufferRef.current.push([...gestureBufferRef.current[gestureBufferRef.current.length - 1]]);
                      }
                      setPhase('collecting');
                    } else if (consecutiveMissingHandsRef.current >= gestureDetectionConfig.sequence.dropHandFrames) {
                      // Không phát hiện tay liên tiếp từ 8 frames trở lên: người dùng đã hạ tay nghỉ -> Chốt cử chỉ!
                      const raw = [...gestureBufferRef.current];
                      gestureBufferRef.current = [];
                      isCollectingRef.current = false;

                      // Lọc bỏ các frames lặp tạm thời khi hạ tay để chuỗi ký hiệu sạch
                      const validCount = Math.max(0, raw.length - gestureDetectionConfig.sequence.maxTemporaryDropFrames);
                      const cleanRaw = validCount >= gestureDetectionConfig.sequence.minGestureFrames
                        ? raw.slice(0, validCount)
                        : raw;

                      // Nếu người dùng hạ tay sớm (từ 12 đến dưới 60 frames):
                      // Nội suy đều (np.linspace / resampleKeypointsSequence) lên đúng 60 frames rồi gửi dự đoán
                      if (cleanRaw.length >= gestureDetectionConfig.sequence.minGestureFrames) {
                        const resampled = resampleKeypointsSequence(cleanRaw, 60);
                        void submitSequenceToBackend(resampled, hands);
                      } else {
                        setPhase('no-hand');
                      }
                    }
                  } else {
                    setPhase('no-hand');
                  }
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
  }, [drawHandLandmarks, getLandmarker, publishDebug, submitSequenceToBackend, updateDetectedHands, videoRef]);

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
      gestureBufferRef.current = [];
    };
  }, []);

  return {
    prediction,
    isModelReady,
    isDetecting,
    isPredicting,
    detectedHands,
    detectionError,
    phase,
    recognitionHistory,
    clearHistory,
    handInfo,
    frameQuality,
    debugEnabled,
    setDebugEnabled,
    debugInfo,
    startDetection,
    stopDetection,
    predictVideoFile,
  };
}
