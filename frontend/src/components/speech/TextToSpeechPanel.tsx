import { useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/Icon';

const quickPhrases = ['Xin chào', 'Cảm ơn', 'Tôi cần giúp đỡ', 'Hẹn gặp lại'];

type TextToSpeechPanelProps = { suggestedText?: string };

export function TextToSpeechPanel({ suggestedText = '' }: TextToSpeechPanelProps) {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [message, setMessage] = useState('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSupported = typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && typeof SpeechSynthesisUtterance !== 'undefined';

  useEffect(() => () => {
    const utterance = utteranceRef.current;
    if (utterance) {
      utterance.onstart = null;
      utterance.onend = null;
      utterance.onerror = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    if (!suggestedText) return;
    setText(suggestedText);
    setMessage('Đã chọn từ vựng từ chủ đề giao tiếp.');
  }, [suggestedText]);

  function stopSpeech(announce = true) {
    const utterance = utteranceRef.current;
    if (utterance) {
      utterance.onstart = null;
      utterance.onend = null;
      utterance.onerror = null;
      utteranceRef.current = null;
    }
    if (isSupported) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    if (announce) setMessage('Đã dừng đọc.');
  }

  function speak() {
    const phrase = text.trim();
    if (!isSupported) {
      setMessage('Trình duyệt này chưa hỗ trợ đọc văn bản. Hãy thử phiên bản mới của Chrome, Edge hoặc Safari.');
      return;
    }
    if (!phrase) {
      setMessage('Hãy nhập nội dung trước khi phát âm thanh.');
      textareaRef.current?.focus();
      return;
    }

    stopSpeech(false);
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = 'vi-VN';
    const vietnameseVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase() === 'vi-vn')
      ?? window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith('vi'));
    if (vietnameseVoice) utterance.voice = vietnameseVoice;

    utterance.onstart = () => setMessage('Đang đọc văn bản tiếng Việt.');
    utterance.onend = () => {
      utteranceRef.current = null;
      setIsSpeaking(false);
      setMessage('Đã đọc xong.');
    };
    utterance.onerror = (event) => {
      utteranceRef.current = null;
      setIsSpeaking(false);
      setMessage(event.error === 'canceled' || event.error === 'interrupted'
        ? 'Đã dừng đọc.'
        : 'Không thể phát giọng đọc. Vui lòng thử lại.');
    };

    utteranceRef.current = utterance;
    setIsSpeaking(true);
    setMessage('Đang chuẩn bị giọng đọc...');
    window.speechSynthesis.speak(utterance);
  }

  function choosePhrase(phrase: string) {
    if (isSpeaking) stopSpeech(false);
    setText(phrase);
    setMessage('Đã thêm câu mẫu vào nội dung.');
  }

  function clearText() {
    if (isSpeaking) stopSpeech(false);
    setText('');
    setMessage('Đã xóa nội dung.');
    textareaRef.current?.focus();
  }

  return (
    <section aria-labelledby="tts-title" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="tts-title" className="text-xl font-semibold text-gray-900 dark:text-white">Văn bản thành giọng nói</h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">Nhập hoặc chọn câu mẫu để nghe cách đọc tiếng Việt.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
          <Icon name="translate" className="text-[15px]" />Tiếng Việt
        </span>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="tts-text" className="text-sm font-medium text-gray-800 dark:text-gray-200">Nội dung cần đọc</label>
          <span className="text-xs text-gray-500 dark:text-gray-400">{text.length} ký tự</span>
        </div>
        <textarea
          ref={textareaRef}
          id="tts-text"
          value={text}
          onChange={(event) => { setText(event.target.value); setMessage(''); }}
          rows={5}
          placeholder="Nhập nội dung tiếng Việt tại đây..."
          className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-base leading-7 text-gray-900 placeholder:text-gray-500 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
          aria-describedby="tts-status"
        />
      </div>

      <div className="mt-5">
        <p className="mb-2.5 text-sm font-medium text-gray-800 dark:text-gray-200">Câu mẫu thường dùng</p>
        <div className="flex flex-wrap gap-2">
          {quickPhrases.map((phrase) => <button
            key={phrase}
            type="button"
            onClick={() => choosePhrase(phrase)}
            className="min-h-10 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95 dark:border-slate-700 dark:bg-slate-800/70 dark:text-gray-200 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-100"
          >{phrase}</button>)}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 dark:border-slate-800 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={speak}
          disabled={!isSupported || isSpeaking}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-900/10 transition hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 dark:focus-visible:ring-offset-slate-900 sm:min-w-48"
        >
          {isSpeaking ? <><span aria-hidden="true" className="flex h-4 items-center gap-0.5">{[0, 1, 2, 3].map((bar) => <span key={bar} className="h-2 w-1 animate-pulse rounded-full bg-white" style={{ animationDelay: `${bar * 120}ms` }} />)}</span>Đang đọc...</> : <><Icon name="volume_up" className="text-[20px]" />Phát âm thanh</>}
        </button>
        {isSpeaking && <button type="button" onClick={() => stopSpeech()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-800 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:scale-[0.98] dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"><Icon name="stop" className="text-[18px]" />Dừng lại</button>}
        <button type="button" onClick={clearText} disabled={!text && !isSpeaking} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200 dark:hover:bg-slate-800 sm:ml-auto"><Icon name="delete" className="text-[18px]" />Xóa</button>
      </div>

      <div id="tts-status" role="status" aria-live="polite" className="mt-4 min-h-5 text-sm">
        {!isSupported
          ? <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">Trình duyệt chưa hỗ trợ Web Speech API. Bạn vẫn có thể nhập và sao chép văn bản.</p>
          : message && <p className={message.startsWith('Không thể') || message.startsWith('Hãy nhập') ? 'text-red-700 dark:text-red-300' : 'text-gray-600 dark:text-gray-300'}>{message}</p>}
      </div>
    </section>
  );
}
