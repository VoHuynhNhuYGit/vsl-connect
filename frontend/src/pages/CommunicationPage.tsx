import { TextToSpeechPanel } from '../components/speech/TextToSpeechPanel';

export function CommunicationPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6">
        <p className="text-label-sm uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">Hỗ trợ giao tiếp</p>
        <h1 className="mt-2 text-headline-xl text-on-surface">Giao tiếp bằng giọng nói</h1>
        <p className="mt-2 max-w-2xl text-body-md leading-relaxed text-on-surface-variant">Nhập nội dung hoặc chọn câu mẫu để phát giọng đọc tiếng Việt, hỗ trợ giao tiếp trong các tình huống thường ngày.</p>
      </header>
      <TextToSpeechPanel />
    </div>
  );
}
