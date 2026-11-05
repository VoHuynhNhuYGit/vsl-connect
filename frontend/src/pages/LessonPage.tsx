import { SignDetectionCamera } from '../components/camera/SignDetectionCamera';
import { FeaturePageBanner } from '../components/ui/FeaturePageBanner';
import { Icon } from '../components/ui/Icon';

const cameraTips = [
  { icon: 'light_mode', title: 'Đủ ánh sáng', description: 'Ưu tiên khu vực sáng đều và rõ khuôn mặt, bàn tay.' },
  { icon: 'center_focus_strong', title: 'Đúng vị trí', description: 'Đặt tay trong khung hướng dẫn của camera.' },
  { icon: 'visibility', title: 'Giữ ổn định', description: 'Thực hiện động tác chậm rãi để nhận diện tốt hơn.' },
];

export function LessonPage() {
  return (
    <div className="overflow-hidden bg-white pb-14 dark:bg-slate-950 sm:pb-18">
      <FeaturePageBanner eyebrow="Luyện tập trực quan" title="Luyện tập ký hiệu" description="Sử dụng camera để quan sát và luyện biểu đạt ký hiệu theo thời gian thực." icon="sign_language" />
      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[242px_minmax(0,1fr)] lg:px-12 lg:py-10 xl:px-16">
        <aside className="lg:sticky lg:top-24 lg:h-fit"><div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.5)] dark:border-slate-800 dark:bg-slate-900"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Icon name="tips_and_updates" className="text-[23px]" /></span><h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">Mẹo luyện tập</h2><div className="mt-4 space-y-4">{cameraTips.map((tip) => <div key={tip.title} className="flex gap-3"><Icon name={tip.icon} className="mt-0.5 text-[19px] text-emerald-600 dark:text-emerald-400" /><div><h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{tip.title}</h3><p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{tip.description}</p></div></div>)}</div></div></aside>
        <main className="min-w-0"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Thực hành cùng camera</p><h2 className="mt-1 text-3xl font-semibold tracking-[0.01em] text-slate-950 dark:text-white">Nhận diện ký hiệu</h2></div><span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"><Icon name="videocam" className="text-[17px]" />Camera trực tiếp</span></div><SignDetectionCamera /></main>
      </div>
    </div>
  );
}
