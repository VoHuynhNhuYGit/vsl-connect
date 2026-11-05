import { TextToSpeechPanel } from '../components/speech/TextToSpeechPanel';
import { FeaturePageIntro } from '../components/ui/FeaturePageIntro';
import { Icon } from '../components/ui/Icon';

export function CommunicationPage() {
  return (
    <div className="mx-auto max-w-[1120px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
      <FeaturePageIntro eyebrow="Công cụ giao tiếp" title="Giao tiếp dễ dàng hơn" description="Nhập câu tiếng Việt để nghe cách phát âm, hỗ trợ bạn diễn đạt điều mình muốn nói trong các tình huống hằng ngày." icon="forum">
        <span className="hidden items-center gap-2 rounded-xl border border-emerald-200 bg-white/70 px-3 py-2 text-xs font-semibold text-emerald-800 sm:inline-flex dark:border-emerald-400/20 dark:bg-slate-900/70 dark:text-emerald-200"><Icon name="volume_up" className="text-[17px]" />Văn bản thành giọng nói</span>
      </FeaturePageIntro>
      <div className="mt-7"><TextToSpeechPanel /></div>
    </div>
  );
}
