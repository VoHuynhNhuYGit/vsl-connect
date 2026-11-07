import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useGestureDetection } from '../../hooks/useGestureDetection';
import { Icon } from '../ui/Icon';

type CameraElements = { video: HTMLVideoElement; canvas: HTMLCanvasElement; stream: MediaStream };
type DetectionMediaSource = 'camera' | 'upload' | null;
const VIDEO_FILE_EXTENSION = /\.(mp4|m4v|webm|mov|ogv|ogg)$/i;

type SignDetectionCameraProps = {
  mode?: 'video' | 'camera';
  autoStartCamera?: boolean;
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

function isVideoFile(file: File) {
  return file.type.startsWith('video/') || VIDEO_FILE_EXTENSION.test(file.name);
}

function getVideoLoadError(file: File) {
  if (/\.(mp4|m4v)$/i.test(file.name)) {
    return 'Không thể phát tệp MP4 này. Hãy xuất video ở định dạng MP4 dùng codec H.264/AAC hoặc chuyển sang WebM rồi thử lại.';
  }
  return 'Không thể đọc video đã chọn. Hãy thử video MP4 (H.264/AAC) hoặc WebM khác.';
}

export function SignDetectionCamera({ mode = 'video', autoStartCamera = false, detectedSign = null, confidence = null, onCameraReady, onCameraStop, onDetectionPauseChange }: SignDetectionCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const uploadedVideoUrlRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const hasStartedInitialCameraRef = useRef(false);
  const {
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
  } = useGestureDetection(videoRef, canvasRef);
  const [cameraActive, setCameraActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [detectionPaused, setDetectionPaused] = useState(false);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState('');
  const [mediaSource, setMediaSource] = useState<DetectionMediaSource>(null);
  const [uploadedVideoName, setUploadedVideoName] = useState('');
  const [uploadFinished, setUploadFinished] = useState(false);
  const [conversionCandidate, setConversionCandidate] = useState<File | null>(null);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [error, setError] = useState('');
  const hasCameraSupport = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
  const isVideoMode = mode === 'video';
  const isUploadedVideo = mediaSource === 'upload';
  const fallbackConfidence = confidence === null || confidence === undefined || !Number.isFinite(confidence)
    ? null
    : Math.max(0, Math.min(100, Math.round(confidence)));
  const confidencePercent = prediction
    ? Math.round(Math.max(0, Math.min(1, prediction.confidence)) * 100)
    : fallbackConfidence;
  const signLabel = prediction?.label_name ?? detectedSign;
  const activeError = error || detectionError;
  const handTrackingLabel = detectedHands > 0
    ? `Đã nhận diện ${detectedHands} bàn tay`
    : isDetecting
      ? 'Đưa tay vào khung'
      : 'Đang chuẩn bị nhận diện';
  const recognitionResult = detectionError
      ? 'Chưa thể nhận diện'
      : signLabel
        ? `Ký hiệu: ${signLabel}`
        : detectionPaused
          ? uploadFinished
            ? 'Video đã phát xong'
            : 'Đang tạm dừng'
        : detectedHands > 0
          ? 'Đang đối chiếu từ vựng...'
          : isDetecting
            ? 'Đưa tay vào khung hướng dẫn'
            : 'Đang chờ nhận diện...';

  const detectorStatus = phase === 'no-hand'
    ? 'Không phát hiện bàn tay.'
    : phase === 'outside-guide'
      ? `Đã phát hiện ${detectedHands} bàn tay nhưng đang nằm ngoài vùng hướng dẫn.`
      : phase === 'unstable'
        ? detectedHands > 0
          ? `Đã phát hiện ${detectedHands} bàn tay nhưng landmarks chưa ổn định.`
          : 'Mất bàn tay thoáng qua — đang giữ chuỗi dữ liệu.'
        : phase === 'collecting'
          ? `Đã phát hiện ${detectedHands} bàn tay. Đang thu thập ${debugInfo.framesCollected}/60 frame.`
          : phase === 'ready'
            ? `Đã phát hiện đủ ${detectedHands} bàn tay để đưa dữ liệu vào mô hình.`
            : 'Đang chuẩn bị nhận diện.';

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const activeStream = streamRef.current;
      streamRef.current = null;
      activeStream?.getTracks().forEach((track) => track.stop());
      if (uploadedVideoUrlRef.current) {
        URL.revokeObjectURL(uploadedVideoUrlRef.current);
        uploadedVideoUrlRef.current = null;
      }
    };
  }, []);

  async function refreshCameraDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    const devices = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === 'videoinput');
    if (mountedRef.current) setCameraDevices(devices);
    return devices;
  }

  function fitCanvasToVideo() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video?.videoWidth && video.videoHeight && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
  }

  function releaseUploadedVideo() {
    if (uploadedVideoUrlRef.current) {
      URL.revokeObjectURL(uploadedVideoUrlRef.current);
      uploadedVideoUrlRef.current = null;
    }
    setUploadedVideoName('');
    setUploadFinished(false);
  }

  function clearMediaElement() {
    const video = videoRef.current;
    if (!video) return;
    video.onended = null;
    video.pause();
    video.srcObject = null;
    video.removeAttribute('src');
    video.load();
  }

  async function enableCamera(deviceId?: string) {
    if (!hasCameraSupport) {
      setError('Trình duyệt này không hỗ trợ truy cập máy ảnh. Hãy thử trình duyệt mới hơn và mở trang bằng HTTPS.');
      return;
    }

    setStarting(true);
    setError('');
    try {
      if (mediaSource === 'upload') disableCamera();
      let nextStream: MediaStream;
      try {
        nextStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: deviceId
            ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
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
      if (videoRef.current) {
        videoRef.current.removeAttribute('src');
        videoRef.current.srcObject = nextStream;
      }
      previousStream?.getTracks().forEach((track) => track.stop());

      const videoTrack = nextStream.getVideoTracks()[0];
      const currentDeviceId = videoTrack?.getSettings().deviceId ?? deviceId ?? '';
      setActiveDeviceId(currentDeviceId);
      setCameraActive(true);
      setMediaSource('camera');
      setDetectionPaused(false);
      setUploadFinished(false);
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
        video.addEventListener('loadedmetadata', fitCanvasToVideo, { once: true });
        fitCanvasToVideo();
        onCameraReady?.({ video, canvas, stream: nextStream });
        void video.play()
          .then(() => startDetection('camera'))
          .catch((playError: unknown) => {
            if (!mountedRef.current) return;
            setDetectionPaused(true);
            onDetectionPauseChange?.(true);
            setError(playError instanceof Error && playError.name !== 'NotAllowedError'
              ? 'Không thể khởi tạo nhận diện cử chỉ. Hãy tải lại trang rồi thử lại.'
              : 'Máy ảnh đã kết nối. Hãy cho phép phát video rồi thử lại.');
          });
      }

      try {
        await refreshCameraDevices();
      } catch {
        // Camera remains usable if device enumeration is unavailable.
      }
    } catch (cameraError) {
      if (mountedRef.current) setError(getCameraError(cameraError));
    } finally {
      if (mountedRef.current) setStarting(false);
    }
  }

  useEffect(() => {
    if (!autoStartCamera || hasStartedInitialCameraRef.current) return;
    hasStartedInitialCameraRef.current = true;
    void enableCamera();
  }, [autoStartCamera]);

  function disableCamera() {
    stopDetection();
    const activeStream = streamRef.current;
    streamRef.current = null;
    activeStream?.getTracks().forEach((track) => track.stop());
    clearMediaElement();
    releaseUploadedVideo();
    const canvasContext = canvasRef.current?.getContext('2d');
    if (canvasContext && canvasRef.current) canvasContext.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setCameraActive(false);
    setMediaSource(null);
    setDetectionPaused(false);
    setActiveDeviceId('');
    setConversionCandidate(null);
    onDetectionPauseChange?.(false);
    onCameraStop?.();
  }

  async function loadUploadedVideo(file: File, converted = false) {
    const video = videoRef.current;
    if (!video || !canvasRef.current) return;

    disableCamera();
    setStarting(true);
    setError('');
    try {
      const videoUrl = URL.createObjectURL(file);
      uploadedVideoUrlRef.current = videoUrl;
      video.src = videoUrl;

      await new Promise<void>((resolve, reject) => {
        const handleLoaded = () => resolve();
        const handleError = () => reject(new Error(getVideoLoadError(file)));
        video.addEventListener('loadedmetadata', handleLoaded, { once: true });
        video.addEventListener('error', handleError, { once: true });
        video.load();
      });

      if (!mountedRef.current) return;
      fitCanvasToVideo();
      setUploadedVideoName(file.name);
      setUploadFinished(false);
      setMediaSource('upload');
      setCameraActive(true);
      setDetectionPaused(false);
      onDetectionPauseChange?.(false);
      video.onended = () => {
        if (uploadedVideoUrlRef.current !== videoUrl) return;
        stopDetection(false, false);
        setDetectionPaused(true);
        setUploadFinished(true);
        onDetectionPauseChange?.(true);
      };
      await video.play();
      await startDetection('upload');
    } catch (uploadError) {
      releaseUploadedVideo();
      clearMediaElement();
      if (mountedRef.current) {
        setCameraActive(false);
        setMediaSource(null);
        if (!converted) setConversionCandidate(file);
        setError(uploadError instanceof Error ? uploadError.message : 'Không thể mở video đã chọn. Hãy thử tệp khác.');
      }
    } finally {
      if (mountedRef.current) setStarting(false);
    }
  }

  async function useUploadedVideo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!isVideoFile(file)) {
      setError('Hãy chọn một tệp video hợp lệ (MP4, WebM, MOV hoặc OGV) để nhận diện.');
      return;
    }
    await loadUploadedVideo(file);
  }

  async function convertUnsupportedVideo() {
    if (!conversionCandidate) return;

    setStarting(true);
    setError('');
    try {
      const payload = new FormData();
      payload.append('video_file', conversionCandidate);
      const response = await fetch('/api/v1/gesture/video/convert', { method: 'POST', body: payload });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { detail?: string } | null;
        throw new Error(body?.detail || 'Không thể chuyển đổi video này.');
      }
      const convertedBlob = await response.blob();
      const originalBaseName = conversionCandidate.name.replace(/\.[^.]+$/, '');
      const convertedVideo = new File([convertedBlob], `${originalBaseName}-h264.mp4`, { type: 'video/mp4' });
      setConversionCandidate(null);
      await loadUploadedVideo(convertedVideo, true);
    } catch (conversionError) {
      if (mountedRef.current) {
        setError(conversionError instanceof Error ? conversionError.message : 'Không thể chuyển đổi video này.');
      }
    } finally {
      if (mountedRef.current) setStarting(false);
    }
  }

  function switchCamera() {
    if (cameraDevices.length < 2) return;
    const currentIndex = cameraDevices.findIndex((device) => device.deviceId === activeDeviceId);
    const nextDevice = cameraDevices[(currentIndex + 1 + cameraDevices.length) % cameraDevices.length];
    void enableCamera(nextDevice.deviceId);
  }

  async function activateCamera() {
    if (isUploadedVideo) disableCamera();
    await enableCamera();
  }

  async function toggleDetection() {
    const nextPaused = !detectionPaused;
    setDetectionPaused(nextPaused);
    onDetectionPauseChange?.(nextPaused);
    if (nextPaused) {
      stopDetection();
    } else {
      try {
        const video = videoRef.current;
        if (isUploadedVideo && video?.ended) {
          video.currentTime = 0;
          setUploadFinished(false);
          await video.play();
        }
        await startDetection(isUploadedVideo ? 'upload' : 'camera');
        setError('');
      } catch {
        setDetectionPaused(true);
        onDetectionPauseChange?.(true);
        setError('Không thể khởi tạo nhận diện cử chỉ. Hãy tải lại trang rồi thử lại.');
      }
    }
  }

  const shownConfidence = prediction ? confidencePercent : fallbackConfidence;

  return (
    <section aria-labelledby="sign-camera-title" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-slate-800 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${isVideoMode ? 'bg-sky-100 text-sky-800 dark:bg-sky-500/10 dark:text-sky-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'}`}><Icon name={isVideoMode ? 'video_file' : 'videocam'} /></span>
          <div><h2 id="sign-camera-title" className="text-sm font-semibold text-gray-900 dark:text-white">{isVideoMode ? 'Nhận diện bằng video' : 'Nhận diện bằng camera'}</h2><p className="text-xs text-gray-500 dark:text-gray-400">{isVideoMode ? 'Tải video để phân tích ký hiệu' : 'Nhận diện ký hiệu trực tiếp qua webcam'}</p></div>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${cameraActive ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200' : 'border-gray-200 bg-gray-100 text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300'}`}>
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${cameraActive ? 'animate-pulse bg-emerald-500' : 'bg-gray-400 dark:bg-slate-500'}`} />{cameraActive ? 'Đang hoạt động' : 'Đã tắt'}
        </span>
      </div>

      <section aria-labelledby="recognition-mode-title" className="border-b border-gray-100 p-4 dark:border-slate-800 sm:p-5">
        {!cameraActive && isVideoMode && <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 text-center dark:border-sky-400/20 dark:bg-sky-400/5 sm:p-5">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm"><Icon name="video_file" className="text-[24px]" /></span>
          <h3 id="recognition-mode-title" className="mt-3 text-base font-semibold text-gray-900 dark:text-white">Nhận diện bằng video</h3>
          <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-gray-600 dark:text-gray-300">Tải video có động tác tay rõ trong ít nhất 2 giây để hệ thống đối chiếu ký hiệu.</p>
          <button type="button" onClick={() => uploadInputRef.current?.click()} disabled={starting} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900"><Icon name="upload_file" className="text-[19px]" />{starting ? 'Đang chuẩn bị video...' : 'Tải video lên để nhận diện'}</button>
        </div>}

        {!cameraActive && !isVideoMode && <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-center dark:border-emerald-400/20 dark:bg-emerald-400/5 sm:p-5">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm"><Icon name="videocam" className="text-[24px]" /></span>
          <h3 id="recognition-mode-title" className="mt-3 text-base font-semibold text-gray-900 dark:text-white">Nhận diện bằng camera</h3>
          <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-gray-600 dark:text-gray-300">Cho phép truy cập webcam và đặt tay trong khung hình để nhận diện trực tiếp.</p>
          <button type="button" onClick={() => void activateCamera()} disabled={starting || !hasCameraSupport} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900"><Icon name="photo_camera" className="text-[19px]" />{starting ? 'Đang mở camera...' : 'Mở camera'}</button>
          {!hasCameraSupport && <p role="alert" className="mt-3 text-sm text-amber-800 dark:text-amber-200">Trình duyệt này không hỗ trợ Camera API hoặc trang chưa được mở qua HTTPS.</p>}
        </div>}

        {isVideoMode && conversionCandidate && <div role="status" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left dark:border-amber-400/25 dark:bg-amber-400/10">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white"><Icon name="video_settings" className="text-[21px]" /></span>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-amber-950 dark:text-amber-100">Video cần chuyển đổi trước khi nhận diện</h4>
              <p className="mt-1 text-xs leading-5 text-amber-900/85 dark:text-amber-100/85">Trình duyệt không đọc được codec của “{conversionCandidate.name}”. Bạn có thể gửi tạm thời video đến máy chủ để chuyển sang MP4 H.264; tệp sẽ được xóa ngay sau khi trả về.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => void convertUnsupportedVideo()} disabled={starting} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900"><Icon name={starting ? 'progress_activity' : 'autorenew'} className={`text-[18px] ${starting ? 'animate-spin' : ''}`} />{starting ? 'Đang chuyển đổi...' : 'Chuyển đổi và nhận diện'}</button>
                <button type="button" onClick={() => { setConversionCandidate(null); setError(''); uploadInputRef.current?.click(); }} disabled={starting} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-950 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-400/30 dark:bg-slate-900 dark:text-amber-100 dark:hover:bg-amber-400/10">Chọn video khác</button>
              </div>
            </div>
          </div>
        </div>}
      </section>

      {/* {!mediaSource ? <section aria-labelledby="recognition-source-title" className="border-b border-gray-100 p-4 dark:border-slate-800 sm:p-5">
        <div className="mb-4 text-center">
          <h3 id="recognition-source-title" className="text-base font-semibold text-gray-900 dark:text-white">Chọn cách nhận diện</h3>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">Chỉ chọn một nguồn để bắt đầu luyện tập.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => void activateCamera()} disabled={starting || !hasCameraSupport} className="group rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-left transition hover:border-emerald-400 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-400/20 dark:bg-emerald-400/5 dark:hover:bg-emerald-400/10">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm"><Icon name="videocam" className="text-[22px]" /></span>
            <span className="mt-4 block text-sm font-semibold text-gray-900 dark:text-white">Mở camera để nhận diện</span>
            <span className="mt-1 block text-xs leading-5 text-gray-600 dark:text-gray-300">Sử dụng webcam để nhận diện ký hiệu trực tiếp.</span>
            <span className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white group-hover:bg-emerald-700"><Icon name="photo_camera" className="text-[18px]" />Mở camera</span>
          </button>
          <button type="button" onClick={() => uploadInputRef.current?.click()} disabled={starting} className="group rounded-2xl border border-sky-200 bg-sky-50/70 p-4 text-left transition hover:border-sky-400 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-sky-400/20 dark:bg-sky-400/5 dark:hover:bg-sky-400/10">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm"><Icon name="video_file" className="text-[22px]" /></span>
            <span className="mt-4 block text-sm font-semibold text-gray-900 dark:text-white">Tải video để nhận diện</span>
            <span className="mt-1 block text-xs leading-5 text-gray-600 dark:text-gray-300">Chọn video có tay rõ trong ít nhất 2 giây. Video được xử lý trên thiết bị.</span>
            <span className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white group-hover:bg-sky-700"><Icon name="upload_file" className="text-[18px]" />Chọn video</span>
          </button>
        </div>
        {conversionCandidate && <div role="status" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left dark:border-amber-400/25 dark:bg-amber-400/10">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white"><Icon name="video_settings" className="text-[21px]" /></span>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-amber-950 dark:text-amber-100">Video cần chuyển đổi trước khi nhận diện</h4>
              <p className="mt-1 text-xs leading-5 text-amber-900/85 dark:text-amber-100/85">Trình duyệt không đọc được codec của “{conversionCandidate.name}”. Bạn có thể gửi tạm thời video đến máy chủ để chuyển sang MP4 H.264; tệp sẽ được xóa ngay sau khi trả về.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => void convertUnsupportedVideo()} disabled={starting} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-slate-900"><Icon name={starting ? 'progress_activity' : 'autorenew'} className={`text-[18px] ${starting ? 'animate-spin' : ''}`} />{starting ? 'Đang chuyển đổi...' : 'Chuyển đổi và nhận diện'}</button>
                <button type="button" onClick={() => { setConversionCandidate(null); setError(''); }} disabled={starting} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-950 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-400/30 dark:bg-slate-900 dark:text-amber-100 dark:hover:bg-amber-400/10">Chọn video khác</button>
              </div>
            </div>
          </div>
        </div>}
      </section> : <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/30 sm:px-5">
        <span className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${isUploadedVideo ? 'bg-sky-100 text-sky-800 dark:bg-sky-400/10 dark:text-sky-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200'}`}><Icon name={isUploadedVideo ? 'video_file' : 'videocam'} className="text-[18px]" />{isUploadedVideo ? `Video: ${uploadedVideoName}` : 'Camera trực tiếp'}</span>
        <button type="button" onClick={disableCamera} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200 dark:hover:bg-slate-800"><Icon name="switch_video" className="text-[18px]" />Chọn nguồn khác</button>
      </div>}

      */}

      <div className="relative aspect-video w-full overflow-hidden bg-gray-950">
        <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 h-full w-full -scale-x-100 object-cover ${cameraActive ? 'block' : 'hidden'}`} aria-label={isUploadedVideo ? 'Video tải lên để nhận diện ký hiệu' : 'Hình ảnh camera của bạn'} />
        <canvas ref={canvasRef} className={`pointer-events-none absolute inset-0 h-full w-full ${showLandmarks ? '' : 'hidden'}`} aria-hidden="true" />
        {cameraActive ? <>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className={`flex h-[80%] w-[72%] max-w-2xl flex-col items-center justify-center rounded-3xl border-2 border-dashed bg-black/[0.08] px-4 text-center shadow-[0_0_0_999px_rgba(0,0,0,0.06)] ${phase === 'outside-guide' ? 'border-amber-300' : phase === 'ready' ? 'border-emerald-300' : 'border-white/45'}`}>
              <Icon name="back_hand" className="text-4xl text-white/80 drop-shadow" />
              <span className="mt-2 rounded-lg bg-black/45 px-3 py-1.5 text-xs font-medium leading-relaxed text-white/95 sm:text-sm">Đặt tay vào trong khung hình để nhận diện tốt nhất</span>
            </div>
          </div>
          <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-3 sm:left-4 sm:right-4 sm:top-4">
            <span className="inline-flex max-w-[58%] items-center gap-2 rounded-full border border-white/15 bg-slate-950/65 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md"><span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /><span className="truncate">{isUploadedVideo ? uploadedVideoName || 'Video tải lên' : 'Camera trực tiếp'}</span></span>
            <div aria-live="polite" className="min-w-36 max-w-[65%] rounded-xl border border-white/15 bg-slate-950/75 px-3 py-2 text-white shadow-lg backdrop-blur-md sm:min-w-44">
              <p className="truncate text-sm font-bold">{signLabel ? `Ký hiệu: ${signLabel}` : isModelReady ? 'Đang chờ ký hiệu...' : 'Đang tải mô hình...'}</p>
              <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] font-medium"><span>Độ tin cậy</span><span className="font-bold text-emerald-300">{shownConfidence === null ? '—' : `${shownConfidence}%`}</span></div>
              <div role="progressbar" aria-label="Độ tin cậy nhận diện" aria-valuemin={0} aria-valuemax={100} aria-valuenow={shownConfidence ?? 0} aria-valuetext={shownConfidence === null ? 'Chưa có kết quả nhận diện' : `${shownConfidence}%`} className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-emerald-400 transition-[width] duration-300" style={{ width: `${shownConfidence ?? 0}%` }} /></div>
            </div>
          </div>
          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3 sm:inset-x-4 sm:bottom-4">
            <div aria-live="polite" className="max-w-[82%] rounded-xl border border-white/15 bg-slate-950/75 px-4 py-3 text-white shadow-lg backdrop-blur-md sm:px-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300">Kết quả nhận diện</p>
              <p className="mt-1 truncate text-lg font-bold sm:text-xl">{recognitionResult}</p>
            </div>
            {detectionPaused && <span className="shrink-0 rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100">Nhận diện tạm dừng</span>}
          </div>
        </> : <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.12),transparent_60%)] px-5 text-center">
          <span className={`flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] ${isVideoMode ? 'text-sky-200' : 'text-emerald-200'}`}><Icon name={isVideoMode ? 'video_file' : 'videocam_off'} className="text-[28px]" /></span>
          <p className="mt-4 text-base font-semibold text-white">{isVideoMode ? 'Tải video để bắt đầu nhận diện' : 'Đang chuẩn bị camera'}</p>
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-gray-300">{isVideoMode ? 'Chọn tệp video ở phần phía trên để phân tích ký hiệu.' : 'Camera sẽ hiển thị sau khi bạn cho phép truy cập webcam.'}</p>
          {!isVideoMode && !hasCameraSupport && <p role="alert" className="mt-3 text-sm text-amber-200">Trình duyệt này không hỗ trợ Camera API hoặc trang chưa được mở qua HTTPS.</p>}
          {activeError && <p role="alert" className="mt-3 max-w-md text-sm leading-relaxed text-rose-200">{activeError}</p>}
        </div>}
      </div>

      {isUploadedVideo && <section aria-labelledby="uploaded-video-result-title" aria-live="polite" className="border-t border-sky-100 bg-sky-50/70 px-4 py-4 dark:border-sky-400/15 dark:bg-sky-400/5 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm"><Icon name="sign_language" className="text-[21px]" /></span>
            <div className="min-w-0">
              <p id="uploaded-video-result-title" className="text-xs font-semibold uppercase tracking-[0.1em] text-sky-800 dark:text-sky-200">Kết quả nhận diện video</p>
              <p className="mt-1 truncate text-lg font-bold text-slate-900 dark:text-white">{recognitionResult}</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{handTrackingLabel}{uploadFinished ? '. Video đã chạy xong.' : '.'}</p>
            </div>
          </div>
          <div className="rounded-xl border border-sky-200 bg-white px-4 py-2 text-center shadow-sm dark:border-sky-400/20 dark:bg-slate-900">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">Độ tin cậy</p>
            <p className="mt-0.5 text-lg font-bold text-sky-700 dark:text-sky-300">{shownConfidence === null ? '—' : `${shownConfidence}%`}</p>
          </div>
        </div>
      </section>}

      {activeError && cameraActive && <p role="status" className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100 sm:px-5">{activeError}</p>}
      {cameraActive && !activeError && <section aria-live="polite" className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-center dark:border-slate-800 dark:bg-slate-950/40 sm:px-5">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{detectorStatus}</p>
        {handInfo.length > 0 && <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
          {handInfo.map((hand, index) => <span key={`${hand.label}-${index}`} className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-200">{hand.label} · {hand.landmarkCount}/21 điểm</span>)}
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">Hand detected: {detectedHands}</span>
        </div>}
      </section>}

      {cameraActive && frameQuality?.warning && <p role="status" className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100 sm:px-5">{frameQuality.warning}</p>}

      {cameraActive && debugEnabled && <section aria-label="Thông tin gỡ lỗi nhận diện" className="border-t border-slate-200 bg-slate-950 px-4 py-4 text-left text-xs text-slate-100 dark:border-slate-700 sm:px-5">
        <div className="mb-3 flex items-center justify-between gap-3"><p className="font-bold uppercase tracking-[0.12em] text-emerald-300">Debug detector</p><span className="text-slate-400">Handedness score là độ tin cậy nhãn trái/phải; Tasks API không trả detection/presence score.</span></div>
        <dl className="grid gap-x-5 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="text-slate-400">Frame</dt><dd>{debugInfo.frameWidth} × {debugInfo.frameHeight} · {debugInfo.fps} FPS</dd></div>
          <div><dt className="text-slate-400">Bàn tay</dt><dd>{debugInfo.detectedHands} · Left: {String(debugInfo.leftHandDetected)} · Right: {String(debugInfo.rightHandDetected)}</dd></div>
          <div><dt className="text-slate-400">Landmarks</dt><dd>{debugInfo.landmarkCount} · {debugInfo.handednessScores}</dd></div>
          <div><dt className="text-slate-400">Sequence</dt><dd>{debugInfo.framesCollected}/60 · {debugInfo.inputShape}</dd></div>
          <div><dt className="text-slate-400">Inference</dt><dd>{debugInfo.inferenceMs === null ? 'Chưa có' : `${debugInfo.inferenceMs} ms`}</dd></div>
          <div><dt className="text-slate-400">Prediction</dt><dd>{debugInfo.prediction ?? 'Chưa có'}{debugInfo.predictionConfidence === null ? '' : ` · ${(debugInfo.predictionConfidence * 100).toFixed(1)}%`}</dd></div>
        </dl>
      </section>}

      <div className={`flex flex-wrap items-center justify-center gap-2 border-t border-gray-100 bg-gray-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/40 sm:gap-3 sm:p-4 ${cameraActive ? '' : 'hidden'}`}>
        <input ref={uploadInputRef} type="file" accept="video/*,.mp4,.m4v,.webm,.mov,.ogv" onChange={(event) => void useUploadedVideo(event)} className="hidden" aria-label="Tải video để nhận diện ký hiệu" />
        <button type="button" onClick={disableCamera} disabled={!cameraActive || starting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-800 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"><Icon name="stop_circle" className="text-[19px]" />{isUploadedVideo ? 'Dừng video' : 'Tắt webcam'}</button>
        <button type="button" onClick={switchCamera} disabled={!cameraActive || isUploadedVideo || starting || cameraDevices.length < 2} aria-label="Chuyển đổi camera" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200 dark:hover:bg-slate-800"><Icon name="flip_camera_android" className="text-[19px]" /><span className="hidden sm:inline">Đổi camera</span><span className="sm:hidden">Đổi</span></button>
        <button type="button" onClick={() => void toggleDetection()} disabled={!cameraActive} aria-pressed={detectionPaused} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200 dark:hover:bg-slate-800"><Icon name={detectionPaused ? 'play_arrow' : 'pause'} className="text-[19px]" />{detectionPaused ? 'Tiếp tục nhận diện' : 'Tạm dừng nhận diện'}</button>
        {isUploadedVideo && <button type="button" onClick={() => setShowLandmarks((visible) => !visible)} aria-pressed={showLandmarks} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200 dark:hover:bg-slate-800"><Icon name={showLandmarks ? 'visibility_off' : 'visibility'} className="text-[19px]" />{showLandmarks ? 'Ẩn landmarks' : 'Hiện landmarks'}</button>}
        <button type="button" onClick={() => setDebugEnabled((enabled) => !enabled)} aria-pressed={debugEnabled} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 active:scale-[0.98] ${debugEnabled ? 'border-slate-700 bg-slate-900 text-white dark:border-slate-600' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200 dark:hover:bg-slate-800'}`}><Icon name="terminal" className="text-[19px]" />DEBUG</button>
      </div>
    </section>
  );
}
