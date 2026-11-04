import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const PREDICT_URL = '/api/v1/gesture/predict';
const WINDOW_SIZE = 60;
const THROTTLE_FRAMES = 5;

export type GesturePrediction = { label_id: string; label_name: string; confidence: number };

export function extract126Landmarks(results: HandLandmarkerResult): number[] {
  const values = Array<number>(126).fill(0.0);
  (results.handednesses ?? []).forEach((categories, handIndex) => {
    const label = categories[0]?.categoryName?.toLowerCase();
    const offset = label === 'left' ? 0 : label === 'right' ? 63 : -1;
    if (offset < 0) return;

    (results.landmarks[handIndex] ?? []).slice(0, 21).forEach((point, pointIndex) => {
      const index = offset + pointIndex * 3;
      values[index] = Number.isFinite(point.x) ? point.x : 0.0;
      values[index + 1] = Number.isFinite(point.y) ? point.y : 0.0;
      values[index + 2] = Number.isFinite(point.z) ? point.z : 0.0;
    });
  });
  return values;
}

export function useGestureDetection(videoRef: RefObject<HTMLVideoElement | null>) {
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const landmarkerPromiseRef = useRef<Promise<HandLandmarker> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const bufferRef = useRef<number[][]>([]);
  const frameCountRef = useRef(0);
  const requestPendingRef = useRef(false);
  const detectingRef = useRef(false);
  const mountedRef = useRef(true);
  const [prediction, setPrediction] = useState<GesturePrediction | null>(null);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  const getLandmarker = useCallback(() => {
    if (landmarkerRef.current) return Promise.resolve(landmarkerRef.current);
    if (!landmarkerPromiseRef.current) {
      landmarkerPromiseRef.current = (async () => {
        const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
        const landmarker = await HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL },
          runningMode: 'VIDEO',
          numHands: 2,
        });
        if (!mountedRef.current) {
          landmarker.close();
          throw new Error('Gesture detection hook was unmounted during model loading.');
        }
        landmarkerRef.current = landmarker;
        setIsModelReady(true);
        return landmarker;
      })().catch((error: unknown) => {
        landmarkerPromiseRef.current = null;
        throw error;
      });
    }
    return landmarkerPromiseRef.current;
  }, []);

  const stopDetection = useCallback(() => {
    detectingRef.current = false;
    if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
    if (mountedRef.current) setIsDetecting(false);
  }, []);

  const startDetection = useCallback(async () => {
    if (detectingRef.current || animationFrameRef.current !== null) return;
    detectingRef.current = true;
    try {
      const landmarker = await getLandmarker();
      const video = videoRef.current;
      if (!mountedRef.current || !detectingRef.current || !video) {
        detectingRef.current = false;
        return;
      }

      bufferRef.current = [];
      frameCountRef.current = 0;
      setIsDetecting(true);
      const processFrame = () => {
        if (!mountedRef.current || !detectingRef.current) return;
        const currentVideo = videoRef.current;
        if (currentVideo && !currentVideo.paused && currentVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          const results = landmarker.detectForVideo(currentVideo, performance.now());
          const frame = extract126Landmarks(results);
          const buffer = bufferRef.current;
          buffer.push(frame);
          if (buffer.length > WINDOW_SIZE) buffer.shift();
          frameCountRef.current += 1;

          if (buffer.length === WINDOW_SIZE && frameCountRef.current % THROTTLE_FRAMES === 0 && !requestPendingRef.current) {
            requestPendingRef.current = true;
            const sequence = buffer.map((landmarks) => [...landmarks]);
            void fetch(PREDICT_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sequence }),
            })
              .then(async (response) => {
                if (!response.ok) throw new Error(`Gesture prediction failed: ${response.status}`);
                return response.json() as Promise<GesturePrediction>;
              })
              .then((result) => {
                if (mountedRef.current && result.confidence > 0.75 && typeof result.label_name === 'string') {
                  setPrediction({ label_id: result.label_id, label_name: result.label_name, confidence: result.confidence });
                }
              })
              .catch((error: unknown) => console.error('Gesture prediction request failed:', error))
              .finally(() => { requestPendingRef.current = false; });
          }
        }
        animationFrameRef.current = requestAnimationFrame(processFrame);
      };
      animationFrameRef.current = requestAnimationFrame(processFrame);
    } catch (error) {
      detectingRef.current = false;
      throw error;
    }
  }, [getLandmarker, videoRef]);

  // Tự động nạp model và bắt đầu nhận diện khi video sẵn sàng
  useEffect(() => {
    mountedRef.current = true;

    // Tự động tải model trước
    getLandmarker().catch((err) => console.error("Lỗi nạp model:", err));

    return () => {
      mountedRef.current = false;
      detectingRef.current = false;
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      bufferRef.current = [];
    };
  }, [getLandmarker]);

  // Tự động kích hoạt startDetection khi model xong và có video
  useEffect(() => {
    if (isModelReady && videoRef.current && !isDetecting) {
      startDetection().catch((err) => console.error("Lỗi khởi chạy detection:", err));
    }
  }, [isModelReady, videoRef, isDetecting, startDetection]);

  return { prediction, isModelReady, isDetecting, startDetection, stopDetection };
}
