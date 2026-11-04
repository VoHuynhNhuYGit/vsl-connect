import React, { useEffect, useRef, useState } from 'react';
import { Camera, Settings2, VideoOff } from 'lucide-react';

export const AICameraCard: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, facingMode: "user" }, 
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Phải đảm bảo stream đã gắn vào srcObject rồi mới đổi state
        setIsStreamActive(true);
      }
    } catch (err) {
      setError('Không thể truy cập camera. Vui lòng cấp quyền trong trình duyệt.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop()); // Tắt hẳn đèn camera
      videoRef.current.srcObject = null;
      setIsStreamActive(false);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 w-full flex flex-col gap-4">
      <div className="flex gap-4 items-start">
        <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center shrink-0">
          <Camera size={24} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-lg font-bold text-gray-800">AI So Khớp Cử Chỉ</h3>
            <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full">
              Live AI 2.0
            </span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Kích hoạt webcam để hệ thống phân tích hình bàn tay và độ chính xác quỹ đạo theo thời gian thực.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* SỬA LỖI Ở ĐÂY: Luôn render thẻ video nhưng dùng CSS (hidden) để ẩn đi khi chưa bật, giúp videoRef không bị null */}
      <div className={`relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden my-2 ${!isStreamActive ? 'hidden' : ''}`}>
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" 
        />
        <canvas className="absolute inset-0 w-full h-full pointer-events-none z-10" />
      </div>

      <div className="flex gap-3 mt-2">
        {!isStreamActive ? (
          <button
            onClick={startCamera}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition-colors font-medium text-sm"
          >
            <Camera size={18} />
            Bật AI Camera Thực Hành
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
          >
            <VideoOff size={18} />
            Tắt Camera
          </button>
        )}
        
        <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm">
          <Settings2 size={18} />
          Cài đặt Cam
        </button>
      </div>
    </div>
  );
};