import { useState } from 'react';
import { SignDetectionCamera } from '../components/camera/SignDetectionCamera';
import { FeaturePageBanner } from '../components/ui/FeaturePageBanner';
import { Icon } from '../components/ui/Icon';

type RecognitionMode = 'video' | 'camera';

const practiceTips = [
  { icon: 'light_mode', title: 'Đủ ánh sáng', description: 'Ưu tiên khu vực sáng đều để bàn tay và khuôn mặt rõ nét.' },
  { icon: 'center_focus_strong', title: 'Đúng vị trí', description: 'Giữ bàn tay nằm trọn trong khung hình khi quay hoặc dùng camera.' },
  { icon: 'visibility', title: 'Giữ ổn định', description: 'Thực hiện động tác chậm rãi và rõ ràng để nhận diện tốt hơn.' },
];

export function LessonPage() {
  const [recognitionMode, setRecognitionMode] = useState<RecognitionMode>('video');
  const isVideoMode = recognitionMode === 'video';

  return (
    <div className="overflow-hidden bg-surface-card pb-14 dark:bg-slate-950 sm:pb-18">
      <FeaturePageBanner eyebrow="Luyện tập trực quan" title="Luyện tập ký hiệu" description="Tải video để nhận diện ký hiệu, hoặc chuyển sang camera để thực hành trực tiếp." icon="sign_language" />
      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[242px_minmax(0,1fr)] lg:px-12 lg:py-10 xl:px-16">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-xl border border-slate-200 bg-surface-card p-4 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.5)] dark:border-slate-800 dark:bg-slate-900">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Icon name="tips_and_updates" className="text-[23px]" /></span>
            <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">Mẹo luyện tập</h2>
            <div className="mt-4 space-y-4">
              {practiceTips.map((tip) => <div key={tip.title} className="flex gap-3"><Icon name={tip.icon} className="mt-0.5 text-[19px] text-emerald-600 dark:text-emerald-400" /><div><h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{tip.title}</h3><p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{tip.description}</p></div></div>)}
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="mb-5">
            <p className={`text-sm font-bold ${isVideoMode ? 'text-sky-700 dark:text-sky-300' : 'text-emerald-700 dark:text-emerald-300'}`}>Thực hành nhận diện ký hiệu</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-[0.01em] text-slate-950 dark:text-white">{isVideoMode ? 'Nhận diện bằng video' : 'Nhận diện bằng camera'}</h2>
          </div>

          <div role="tablist" aria-label="Chế độ nhận diện" className="relative mb-5 grid grid-cols-2 gap-1.5 rounded-2xl border border-emerald-200 practice-mode-tabs p-1.5 shadow-[0_12px_30px_-24px_rgba(5,150,105,0.72)] dark:border-emerald-400/20 dark:bg-slate-900">
            <span aria-hidden="true" className={`pointer-events-none absolute inset-y-1.5 left-1.5 w-[calc(50%-0.5625rem)] rounded-xl practice-mode-indicator shadow-[0_8px_20px_-10px_rgba(13,148,136,0.9)] transition-transform duration-300 ease-out ${isVideoMode ? 'translate-x-0' : 'translate-x-[calc(100%+0.375rem)]'}`} />
            <button id="video-recognition-tab" type="button" role="tab" aria-selected={isVideoMode} aria-controls="video-recognition-panel" onClick={() => setRecognitionMode('video')} className={`relative z-10 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${isVideoMode ? 'text-white' : 'text-sky-900/70 hover:text-sky-950 dark:text-sky-100/75 dark:hover:text-white'}`}><span className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-300 ${isVideoMode ? 'bg-surface-card/20 text-white' : 'bg-sky-100/80 text-sky-700 dark:bg-surface-card/10 dark:text-sky-200'}`}><Icon name="video_file" className="text-[18px]" /></span>Nhận diện bằng video</button>
            <button id="camera-recognition-tab" type="button" role="tab" aria-selected={!isVideoMode} aria-controls="camera-recognition-panel" onClick={() => setRecognitionMode('camera')} className={`relative z-10 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${!isVideoMode ? 'text-white' : 'text-sky-900/70 hover:text-sky-950 dark:text-sky-100/75 dark:hover:text-white'}`}><span className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-300 ${!isVideoMode ? 'bg-surface-card/20 text-white' : 'bg-sky-100/80 text-sky-700 dark:bg-surface-card/10 dark:text-sky-200'}`}><Icon name="videocam" className="text-[18px]" /></span>Nhận diện bằng camera</button>
          </div>

          <div id={isVideoMode ? 'video-recognition-panel' : 'camera-recognition-panel'} role="tabpanel" aria-labelledby={isVideoMode ? 'video-recognition-tab' : 'camera-recognition-tab'}>
            <SignDetectionCamera key={recognitionMode} mode={recognitionMode} autoStartCamera={!isVideoMode} />
          </div>
        </main>
      </div>
    </div>
  );
}
