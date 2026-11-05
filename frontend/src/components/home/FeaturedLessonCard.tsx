import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { ProgressBar } from '../ui/ProgressBar';
import { SurfaceCard } from '../ui/SurfaceCard';

const lessonImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2o6Kf0BcGcQL52r4n3sszpARp3IlnJoozSrk2iXFQFLuxZ2UvrOaXA3APpsz77x3n9vMbJW9YA6rmQNCiipNW_DTRIltp0BXmski2fcyQxoy3ZnlDfqpRKSY0CC0Vn9_c1v9r_cp8rUIcRj5-nc5UJAGnHh6EFjbLhTijNzOaHwd5Sam-91j8HzoQZUlHNrA2NEuhCZkj-LqI2QkNSeCHdaDm-YN1MzhNZpSu7L5f';

export function FeaturedLessonCard() {
  const navigate = useNavigate();
  return (
    <SurfaceCard className="flex flex-col gap-5 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span className="text-label-md uppercase tracking-wider text-on-surface-variant">Bài học dở dang</span>
        </div>
        <span className="rounded bg-surface-container px-2.5 py-1 text-code-sm text-on-surface">Cấp độ: Sơ cấp II</span>
      </div>
      <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-12">
        <div className="group relative aspect-video overflow-hidden rounded-lg bg-on-surface md:col-span-6">
          <img className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" src={lessonImage} alt="Giảng viên thực hiện ký hiệu chào hỏi" />
          <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-on-surface/80 via-transparent to-transparent p-3">
            <span className="self-end rounded bg-on-surface/80 px-2 py-0.5 text-code-sm text-on-primary backdrop-blur-sm">HD 1080p</span>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-code-sm text-on-primary"><Icon name="speed" className="text-[16px]" />0.75x · 1.0x</span>
              <button onClick={() => navigate('/lo-trinh-hoc-tap')} className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-transform hover:scale-110" type="button" aria-label="Phát bài học">
                <Icon name="play_arrow" className="text-[20px]" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex h-full flex-col justify-between space-y-4 md:col-span-6">
          <div className="space-y-1.5">
            <span className="text-label-sm uppercase font-semibold text-primary">Khóa học cốt lõi</span>
            <h2 className="text-headline-md leading-tight">Ký hiệu giao tiếp hàng ngày — Phần 2</h2>
            <p className="line-clamp-2 text-body-sm text-on-surface-variant">Chủ đề: Đi chợ, hỏi giá tiền và các đơn vị đo lường thông dụng tại 3 miền Bắc – Trung – Nam.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-label-sm text-on-surface"><span>Tiến độ bài học: 13/20 ký hiệu</span><span className="font-semibold text-primary">65%</span></div>
            <ProgressBar value={65} />
          </div>
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="flex items-center gap-1.5 text-body-sm text-on-surface-variant"><Icon name="schedule" className="text-[18px]" />Còn 4 phút nữa</span>
            <button onClick={() => navigate('/lo-trinh-hoc-tap')} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-headline-sm text-on-primary transition hover:bg-primary-container" type="button">Vào học ngay <Icon name="arrow_forward" className="text-[20px]" /></button>
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}
