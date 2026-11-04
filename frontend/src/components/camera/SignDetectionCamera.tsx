import { useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/Icon';
import { useGestureDetection } from '../../hooks/useGestureDetection';

type CameraElements = {
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  stream: MediaStream;
};

type SignDetectionCameraProps = {
  detectedSign?: string | null;
  confidence?: number | null;
  onCameraReady?: (elements: CameraElements) => void;
  onCameraStop?: () => void;
  onDetectionPauseChange?: (paused: boolean) => void;
};

function getCameraError(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') return 'Bạn chưa cấp quyền dùng máy ảnh. Hãy cho phép truy cập trong trình duyệt rồi thử lại.';
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') return 'Không tìm thấy máy ảnh trên thiết bị này.';
    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') return 'Máy ảnh đang được ứng dụng khác sử dụng. Hãy đóng ứng dụng đó rồi thử lại.';
    if (error.name === 'OverconstrainedError') return 'Máy ảnh đã chọn không khả dụng. Hãy chọn camera khác rồi thử lại.';
  }
  return 'Không thể mở máy ảnh. Hãy kiểm tra kết nối và quyền truy cập rồi thử lại.';
}

export function SignDetectionCamera({
  detectedSign = null,
  confidence = null,
  onCameraReady,
  onCameraStop,
  onDetectionPauseChange,
}: SignDetectionCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { prediction, isModelReady, isDetecting, startDetection, stopDetection } = useGestureDetection(videoRef);
  const mountedRef = useRef(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [detectionPaused, setDetectionPaused] = useState(false);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState('');
  const [error, setError] = useState('');
  const hasCameraSupport = typeof navigator !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia);
  const safeConfidence = confidence === null || confidence === undefined || !Number.isFinite(confidence)
    ? null
    : Math.max(0, Math.min(100, Math.round(confidence)));

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const activeStream = streamRef.current;
      streamRef.current = null;
      activeStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function refreshCameraDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videos = devices.filter((device) => device.kind === 'videoinput');
    if (mountedRef.current) setCameraDevices(videos);
    return videos;
  }

  async function enableCamera(deviceId?: string) {
    if (!hasCameraSupport) {
      setError('Trình duyệt này không hỗ trợ truy cập máy ảnh. Hãy thử trình duyệt mới hơn và mở trang bằng HTTPS.');
      return;
    }

    setStarting(true);
    setError('');
    try {
      let nextStream: MediaStream;
      try {
        nextStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: deviceId ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } } : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch (deviceError) {
        if (!deviceId || !(deviceError instanceof DOMException) || deviceError.name !== 'OverconstrainedError') throw deviceError;
        nextStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user' } });
      }

      if (!mountedRef.current) {
        nextStream.getTracks().forEach((track) => track.stop());
        return;
      }

      const previousStream = streamRef.current;
      streamRef.current = nextStream;
      if (videoRef.current) videoRef.current.srcObject = nextStream;
      previousStream?.getTracks().forEach((track) => track.stop());

      const videoTrack = nextStream.getVideoTracks()[0];
      const currentDeviceId = videoTrack?.getSettings().deviceId ?? deviceId ?? '';
      setActiveDeviceId(currentDeviceId);
      setCameraActive(true);
      setDetectionPaused(false);
      onDetectionPauseChange?.(false);

      if (videoTrack) {
        videoTrack.onended = () => {
          if (streamRef.current !== nextStream) return;
          streamRef.current = null;
          stopDetection();
          setCameraActive(false);
          setActiveDeviceId('');
          setError('Kết nối máy ảnh đã bị ngắt. Hãy bật webcam để kết nối lại.');
          onCameraStop?.();
        };
      }

      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const fitCanvasToVideo = () => {
          if (video.videoWidth && video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
        };
        video.addEventListener('loadedmetadata', fitCanvasToVideo, { once: true });
        fitCanvasToVideo();
        onCameraReady?.({ video, canvas, stream: nextStream });
        void video.play().then(() => startDetection()).catch((detectionError: unknown) => {
          if (mountedRef.current) {
            setDetectionPaused(true);
            onDetectionPauseChange?.(true);
            setError(detectionError instanceof Error && detectionError.name !== 'NotAllowedError'
              ? 'Không thể khởi tạo nhận diện cử chỉ. Hãy tải lại trang rồi thử lại.'
              : 'Máy ảnh đã kết nối. Hãy cho phép phát video rồi thử lại.');
          }
        });
      }

      try {
        await refreshCameraDevices();
      } catch {
        // The active camera remains usable if device enumeration is unavailable.
      }
    } catch (cameraError) {
      if (mountedRef.current) setError(getCameraError(cameraError));
    } finally {
      if (mountedRef.current) setStarting(false);
    }
  }

  function disableCamera() {
    stopDetection();
    const activeStream = streamRef.current;
    streamRef.current = null;
    activeStream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    const canvasContext = canvasRef.current?.getContext('2d');
    if (canvasContext && canvasRef.current) canvasContext.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setCameraActive(false);
    setDetectionPaused(false);
    setActiveDeviceId('');
    onDetectionPauseChange?.(false);
    onCameraStop?.();
  }

  function switchCamera() {
    if (cameraDevices.length < 2) return;
    const currentIndex = cameraDevices.findIndex((device) => device.deviceId === activeDeviceId);
    const nextDevice = cameraDevices[(currentIndex + 1 + cameraDevices.length) % cameraDevices.length];
    void enableCamera(nextDevice.deviceId);
  }

  async function toggleDetection() {
    const nextPaused = !detectionPaused;
    setDetectionPaused(nextPaused);
    onDetectionPauseChange?.(nextPaused);
    if (nextPaused) {
      stopDetection();
    } else {
      try {
        await startDetection();
        setError('');
      } catch {
        setDetectionPaused(true);
        onDetectionPauseChange?.(true);
        setError('Không thể khởi tạo nhận diện cử chỉ. Hãy tải lại trang rồi thử lại.');
      }
    }
  }

  const resultLabel = prediction?.label_name ?? detectedSign;
  const resultConfidencePercent = prediction
    ? Math.round(Math.max(0, Math.min(1, prediction.confidence)) * 100)
    : safeConfidence;

  return (
    <section aria-labelledby="sign-camera-title" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-slate-800 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"><Icon name="videocam" /></span>
          <div><h2 id="sign-camera-title" className="text-sm font-semibold text-gray-900 dark:text-white">Nhận diện ký hiệu</h2><p className="text-xs text-gray-500 dark:text-gray-400">Khung camera trực tiếp</p></div>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${cameraActive ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200' : 'border-gray-200 bg-gray-100 text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300'}`}>
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${cameraActive ? 'animate-pulse bg-emerald-500' : 'bg-gray-400 dark:bg-slate-500'}`} />
          {cameraActive ? 'Đang hoạt động' : 'Đã tắt'}
        </span>
      </div>

      <div className="relative aspect-video w-full overflow-hidden bg-gray-950">
        <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 h-full w-full object-cover -scale-x-100 ${cameraActive ? 'block' : 'hidden'}`} aria-label="Hình ảnh camera của bạn" />
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100" aria-hidden="true" />

        {cameraActive ? <>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex h-[64%] w-[56%] max-w-md flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/45 bg-black/[0.08] px-4 text-center shadow-[0_0_0_999px_rgba(0,0,0,0.06)]">
              <Icon name="back_hand" className="text-4xl text-white/80 drop-shadow" />
              <span className="mt-2 rounded-lg bg-black/45 px-3 py-1.5 text-xs font-medium leading-relaxed text-white/95 sm:text-sm">Đặt tay vào trong khung hình để nhận diện tốt nhất</span>
            </div>
          </div>

          <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-3 sm:left-4 sm:right-4 sm:top-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/65 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md"><span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />Camera trực tiếp</span>
            <div aria-live="polite" className="min-w-36 max-w-[65%] rounded-xl border border-white/15 bg-slate-950/75 px-3 py-2 text-white shadow-lg backdrop-blur-md sm:min-w-44">
              <p className="truncate text-sm font-bold">{resultLabel ? `Ký hiệu: ${resultLabel}` : isModelReady ? 'Đang chờ ký hiệu...' : 'Đang tải mô hình...'}</p>
              <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] font-medium"><span>Độ tin cậy</span><span className="font-bold text-emerald-300">{resultConfidencePercent === null ? '—' : `${resultConfidencePercent}%`}</span></div>
              <div role="progressbar" aria-label="Độ tin cậy nhận diện" aria-valuemin={0} aria-valuemax={100} aria-valuenow={resultConfidencePercent ?? 0} aria-valuetext={resultConfidencePercent === null ? 'Chưa có kết quả nhận diện' : `${resultConfidencePercent}%`} className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-emerald-400 transition-[width] duration-300" style={{ width: `${resultConfidencePercent ?? 0}%` }} /></div>
            </div>
          </div>

          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3 sm:inset-x-4 sm:bottom-4">
            <div aria-live="polite" className="max-w-[82%] rounded-xl border border-white/15 bg-slate-950/75 px-4 py-3 text-white shadow-lg backdrop-blur-md sm:px-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300">Kết quả nhận diện</p>
              <p className="mt-1 truncate text-lg font-bold sm:text-xl">{detectionPaused ? 'Đang tạm dừng' : resultLabel ? `Ký hiệu: ${resultLabel}` : isDetecting ? 'Đang nhận diện...' : 'Đang chờ ký hiệu...'}</p>
            </div>
            {detectionPaused && <span className="shrink-0 rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100">Nhận diện tạm dừng</span>}
          </div>
        </> : <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.12),transparent_60%)] px-5 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-emerald-200"><Icon name="videocam_off" className="text-[28px]" /></span>
          <p className="mt-4 text-base font-semibold text-white">Bật máy ảnh để bắt đầu</p>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-gray-300">Cho phép truy cập camera để xem hình ảnh trực tiếp và nhận diện ký hiệu.</p>
          {!hasCameraSupport && <p role="alert" className="mt-3 text-sm text-amber-200">Trình duyệt này không hỗ trợ Camera API hoặc trang chưa được mở qua HTTPS.</p>}
          {error && <p role="alert" className="mt-3 max-w-md text-sm leading-relaxed text-rose-200">{error}</p>}
          <button type="button" onClick={() => void enableCamera()} disabled={!hasCameraSupport || starting} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/25 transition hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100">
            {starting ? <><Icon name="progress_activity" className="animate-spin text-[19px]" />Đang kết nối...</> : <><Icon name="photo_camera" className="text-[19px]" />Cho phép truy cập máy ảnh</>}
          </button>
        </div>}
      </div>

      {error && cameraActive && <p role="status" className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100 sm:px-5">{error}</p>}

      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-gray-100 bg-gray-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/40 sm:gap-3 sm:p-4">
        <button type="button" onClick={() => cameraActive ? disableCamera() : void enableCamera()} disabled={starting || (!cameraActive && !hasCameraSupport)} aria-pressed={cameraActive} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${cameraActive ? 'border border-red-200 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20' : 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600'}`}>
          <Icon name={cameraActive ? 'videocam_off' : 'videocam'} className="text-[19px]" />{cameraActive ? 'Tắt webcam' : starting ? 'Đang kết nối...' : 'Bật webcam'}
        </button>
        <button type="button" onClick={switchCamera} disabled={!cameraActive || starting || cameraDevices.length < 2} aria-label="Chuyển đổi camera" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200 dark:hover:bg-slate-800"><Icon name="flip_camera_android" className="text-[19px]" /><span className="hidden sm:inline">Đổi camera</span><span className="sm:hidden">Đổi</span></button>
        <button type="button" onClick={() => void toggleDetection()} disabled={!cameraActive} aria-pressed={detectionPaused} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200 dark:hover:bg-slate-800"><Icon name={detectionPaused ? 'play_arrow' : 'pause'} className="text-[19px]" />{detectionPaused ? 'Tiếp tục nhận diện' : 'Tạm dừng nhận diện'}</button>
      </div>
    </section>
  );
}
