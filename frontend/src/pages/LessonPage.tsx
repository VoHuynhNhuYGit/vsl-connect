import { SignDetectionCamera } from '../components/camera/SignDetectionCamera';

export function LessonPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6">
        <p className="text-label-sm uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">Luyện tập trực quan</p>
        <h1 className="mt-2 text-headline-xl text-on-surface">Luyện tập ký hiệu</h1>
        <p className="mt-2 max-w-2xl text-body-md leading-relaxed text-on-surface-variant">Bật camera, đặt tay vào khung hướng dẫn và luyện biểu đạt ký hiệu. Khu vực nhận diện sẵn sàng để kết nối với mô hình AI.</p>
      </header>
      <SignDetectionCamera />
    </div>
  );
}
