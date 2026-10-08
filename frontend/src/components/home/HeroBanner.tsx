import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon';

export function HeroBanner() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-6 shadow-card md:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-secondary-container/40 blur-3xl" />
      <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface-container px-3 py-1 text-code-sm text-on-surface-variant">
            <span className="h-2 w-2 animate-ping rounded-full bg-primary" />
            Kỳ học mùa Thu · Tuần thứ 3
          </div>
          <h1 className="text-headline-xl text-on-surface">Chào buổi sáng, Minh Anh <span className="inline-block animate-bounce">👋</span></h1>
          <p className="text-body-lg text-on-surface-variant">Hôm nay bạn còn <span className="text-headline-sm text-primary">3 ký hiệu</span> để hoàn thành mục tiêu ngày! Giữ vững chuỗi phong độ nhé.</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <button onClick={() => navigate('/lo-trinh-hoc-tap')} className="inline-flex items-center gap-2.5 rounded-lg bg-primary px-5 py-3 text-headline-sm text-on-primary shadow-sm transition hover:bg-primary-container active:scale-95" type="button">
            <Icon name="play_circle" className="text-[20px]" />
            Tiếp tục học ngay
          </button>
          <button onClick={() => navigate('/luyen-tap')} className="inline-flex items-center gap-2 rounded-lg bg-surface-container-low px-4 py-3 text-headline-sm text-primary transition-colors hover:bg-surface-container" type="button">
            <Icon name="bolt" className="text-[20px]" />
            Luyện phản xạ nhanh
          </button>
        </div>
      </div>
    </section>
  );
}
