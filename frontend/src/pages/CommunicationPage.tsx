import { TextToSpeechPanel } from '../components/speech/TextToSpeechPanel';
import { FeaturePageBanner } from '../components/ui/FeaturePageBanner';
import { Icon } from '../components/ui/Icon';

const communicationSteps = [
  { icon: 'edit_note', title: 'Nhập nội dung', description: 'Viết điều bạn muốn diễn đạt.' },
  { icon: 'volume_up', title: 'Phát âm thanh', description: 'Nghe cách đọc tiếng Việt.' },
  { icon: 'forum', title: 'Chia sẻ dễ dàng', description: 'Dùng câu nói trong hội thoại hằng ngày.' },
];

export function CommunicationPage() {
  return (
    <div className="overflow-hidden bg-white pb-14 dark:bg-slate-950 sm:pb-18">
      <FeaturePageBanner eyebrow="Công cụ giao tiếp" title="Giao tiếp dễ dàng hơn" description="Soạn câu tiếng Việt và phát âm thanh để hỗ trợ bạn trong những tình huống hằng ngày." icon="forum" />
      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[242px_minmax(0,1fr)] lg:px-12 lg:py-10 xl:px-16">
        <aside className="lg:sticky lg:top-24 lg:h-fit"><div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.5)] dark:border-slate-800 dark:bg-slate-900"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Icon name="tips_and_updates" className="text-[23px]" /></span><h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">Cách sử dụng</h2><div className="mt-4 space-y-4">{communicationSteps.map((step, index) => <div key={step.title} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">{index + 1}</span><div><h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{step.title}</h3><p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{step.description}</p></div></div>)}</div></div></aside>
        <main className="min-w-0"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Văn bản thành giọng nói</p><h2 className="mt-1 text-3xl font-semibold tracking-[0.01em] text-slate-950 dark:text-white">Soạn và lắng nghe</h2></div><span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"><Icon name="translate" className="text-[17px]" />Tiếng Việt</span></div><TextToSpeechPanel /></main>
      </div>
    </div>
  );
}
