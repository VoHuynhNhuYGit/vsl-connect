import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';
import { FeaturePageBanner } from '../components/ui/FeaturePageBanner';
import { Icon } from '../components/ui/Icon';

const reviewModes = [
  { icon: 'auto_stories', title: 'Ôn theo chủ đề', description: 'Nhắc lại nhóm từ vựng đã học.' },
  { icon: 'quiz', title: 'Kiểm tra nhanh', description: 'Củng cố kiến thức bằng câu hỏi ngắn.' },
  { icon: 'trending_up', title: 'Theo dõi tiến độ', description: 'Biết nội dung nào cần luyện thêm.' },
];

export function ReviewPage() {
  return (
    <div className="overflow-hidden bg-white pb-14 dark:bg-slate-950 sm:pb-18">
      <FeaturePageBanner eyebrow="Củng cố kiến thức" title="Ôn tập" description="Dành vài phút mỗi ngày để ghi nhớ tốt hơn và duy trì phản xạ với ngôn ngữ ký hiệu." icon="assignment_turned_in" />
      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[242px_minmax(0,1fr)] lg:px-12 lg:py-10 xl:px-16">
        <aside className="lg:sticky lg:top-24 lg:h-fit"><div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.5)] dark:border-slate-800 dark:bg-slate-900"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Icon name="calendar_month" className="text-[23px]" /></span><h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">Nhịp ôn tập</h2><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Duy trì thói quen nhỏ mỗi ngày để việc ghi nhớ bền vững hơn.</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full w-0 rounded-full bg-emerald-500" /></div><p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">0% mục tiêu tuần</p></div></aside>
        <main className="min-w-0"><div className="mb-5"><p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Từng bước vững chắc</p><h2 className="mt-1 text-3xl font-semibold tracking-[0.01em] text-slate-950 dark:text-white">Sẵn sàng ôn tập</h2></div><div className="grid gap-4 md:grid-cols-3">{reviewModes.map((mode, index) => <article key={mode.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-900"><span className="text-xs font-bold tracking-[0.1em] text-emerald-700 dark:text-emerald-300">0{index + 1}</span><span className="mt-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Icon name={mode.icon} className="text-[23px]" /></span><h3 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">{mode.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{mode.description}</p></article>)}</div><div className="mt-6"><EmptyState icon="style" title="Chưa có nội dung ôn tập" description="Nội dung ôn tập sẽ được bổ sung sau."><Link to="/tu-dien-ky-hieu" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"><Icon name="menu_book" className="text-[18px]" />Xem từ điển</Link></EmptyState></div></main>
      </div>
    </div>
  );
}
