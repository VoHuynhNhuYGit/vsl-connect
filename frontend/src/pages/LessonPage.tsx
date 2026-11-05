import { SignDetectionCamera } from '../components/camera/SignDetectionCamera';
import { FeaturePageIntro } from '../components/ui/FeaturePageIntro';
import { Icon } from '../components/ui/Icon';

export function LessonPage() {
  return (
    <div className="mx-auto max-w-[1120px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
      <FeaturePageIntro eyebrow="Luyện tập trực quan" title="Luyện tập ký hiệu" description="Bật camera, đặt tay vào khung hướng dẫn và quan sát kết quả nhận diện trong thời gian thực." icon="sign_language">
        <span className="hidden items-center gap-2 rounded-xl border border-emerald-200 bg-white/70 px-3 py-2 text-xs font-semibold text-emerald-800 sm:inline-flex dark:border-emerald-400/20 dark:bg-slate-900/70 dark:text-emerald-200"><Icon name="videocam" className="text-[17px]" />Camera trực tiếp</span>
      </FeaturePageIntro>
      <div className="mt-7"><SignDetectionCamera /></div>
      <aside className="mt-5 flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300"><Icon name="tips_and_updates" className="mt-0.5 shrink-0 text-[21px] text-emerald-600 dark:text-emerald-400" /><p>Đặt tay trong vùng sáng, giữ đủ ánh sáng và hướng camera chính diện để nhận diện ổn định hơn.</p></aside>
    </div>
  );
}
