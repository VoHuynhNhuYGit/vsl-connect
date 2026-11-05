import { useEffect, useMemo, useState } from 'react';
import { TextToSpeechPanel } from '../components/speech/TextToSpeechPanel';
import { EmptyState, LoadState } from '../components/ui/EmptyState';
import { FeaturePageBanner } from '../components/ui/FeaturePageBanner';
import { Icon } from '../components/ui/Icon';
import { type Sign, useApi } from '../services/api';

type TopicMeta = { label: string; icon: string; description: string };

const topicCatalog: Record<string, TopicMeta> = {
  'Chào hỏi': { label: 'Chào hỏi', icon: 'waving_hand', description: 'Những câu mở đầu cuộc trò chuyện.' },
  'Gia đình': { label: 'Gia đình', icon: 'family_restroom', description: 'Từ vựng về người thân và gia đình.' },
  'Ăn uống': { label: 'Ăn uống', icon: 'restaurant', description: 'Dùng trong bữa ăn và nhu cầu hằng ngày.' },
  'Di chuyển': { label: 'Di chuyển', icon: 'directions_car', description: 'Hỏi đường và phương tiện đi lại.' },
  'Sức khỏe': { label: 'Sức khỏe', icon: 'medical_services', description: 'Giao tiếp khi cần hỗ trợ y tế.' },
  'Trường học': { label: 'Trường học', icon: 'school', description: 'Từ vựng trong lớp học và học tập.' },
};

const fallbackTopics = Object.entries(topicCatalog).map(([id, meta]) => ({ id, ...meta }));

function getTopicMeta(topic: string): TopicMeta {
  return topicCatalog[topic] ?? { label: topic, icon: 'forum', description: 'Từ vựng giao tiếp bằng ngôn ngữ ký hiệu.' };
}

export function CommunicationPage() {
  const { data: signs, loading, error, retry } = useApi<Sign[]>('/api/v1/signs?limit=100');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedSignId, setSelectedSignId] = useState<number | null>(null);
  const topics = useMemo(() => {
    const topicsFromApi = [...new Set((signs ?? []).map((sign) => sign.topic).filter(Boolean))];
    return topicsFromApi.length > 0 ? topicsFromApi.map((topic) => ({ id: topic, ...getTopicMeta(topic) })) : fallbackTopics;
  }, [signs]);
  const visibleSigns = useMemo(() => (signs ?? []).filter((sign) => selectedTopic === 'all' || sign.topic === selectedTopic), [selectedTopic, signs]);
  const selectedSign = visibleSigns.find((sign) => sign.id === selectedSignId) ?? visibleSigns[0] ?? null;
  const selectedTopicMeta = selectedTopic === 'all'
    ? { label: 'Tất cả chủ đề', icon: 'apps', description: 'Chọn từ vựng phù hợp với tình huống của bạn.' }
    : getTopicMeta(selectedTopic);

  useEffect(() => {
    if (!selectedSignId || !visibleSigns.some((sign) => sign.id === selectedSignId)) {
      setSelectedSignId(visibleSigns[0]?.id ?? null);
    }
  }, [selectedSignId, visibleSigns]);

  return (
    <div className="overflow-hidden bg-white pb-14 dark:bg-slate-950 sm:pb-18">
      <FeaturePageBanner eyebrow="Công cụ giao tiếp" title="Giao tiếp dễ dàng hơn" description="Chọn chủ đề, học từ vựng qua video ký hiệu và sử dụng giọng nói tiếng Việt khi cần." icon="forum" />
      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[242px_minmax(0,1fr)] lg:px-12 lg:py-10 xl:px-16">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.5)] dark:border-slate-800 dark:bg-slate-900">
            <div className="px-2 pb-3 pt-1"><p className="text-sm font-bold text-slate-950 dark:text-white">Chủ đề giao tiếp</p><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Chọn tình huống để tìm từ vựng nhanh hơn.</p></div>
            <button type="button" onClick={() => setSelectedTopic('all')} className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${selectedTopic === 'all' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'}`}><Icon name="apps" className="text-[20px]" />Tất cả chủ đề<span className="ml-auto text-xs">{signs?.length ?? 0}</span></button>
            <div className="grid grid-cols-2 gap-1 lg:block">{topics.map((topic) => { const count = (signs ?? []).filter((sign) => sign.topic === topic.id).length; return <button key={topic.id} type="button" onClick={() => setSelectedTopic(topic.id)} className={`flex min-h-11 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 lg:mb-1 lg:w-full ${selectedTopic === topic.id ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'}`}><Icon name={topic.icon} className="text-[19px]" /><span className="truncate">{topic.label}</span><span className="ml-auto text-xs font-medium">{count}</span></button>; })}</div>
          </div>
        </aside>

        <main className="min-w-0">
          <section aria-labelledby="communication-vocabulary-title">
            <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{selectedTopicMeta.label}</p><h2 id="communication-vocabulary-title" className="mt-1 text-3xl font-semibold tracking-[0.01em] text-slate-950 dark:text-white">Chọn từ vựng</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedTopicMeta.description}</p></div><span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"><Icon name="sign_language" className="text-[17px]" />Video ký hiệu</span></div>
            {loading || error ? <div className="mt-6"><LoadState loading={loading} retry={retry} /></div> : visibleSigns.length > 0 ? <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(20rem,1.15fr)]">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-900"><p className="px-1 pb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Từ vựng trong chủ đề</p><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">{visibleSigns.map((sign) => <button key={sign.id} type="button" onClick={() => setSelectedSignId(sign.id)} className={`flex min-h-14 items-center gap-3 rounded-lg border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${selectedSign?.id === sign.id ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-400/20 dark:hover:bg-emerald-400/[0.06]'}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Icon name="sign_language" className="text-[19px]" /></span><span className="min-w-0"><strong className="block truncate text-sm">{sign.label}</strong><small className="block truncate text-xs text-slate-500 dark:text-slate-400">{sign.region}</small></span>{sign.video_url && <Icon name="smart_display" className="ml-auto text-[18px] text-emerald-600 dark:text-emerald-300" />}</button>)}</div></div>
              <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_10px_24px_-22px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800"><div><p className="text-xs font-bold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-300">Ký hiệu đã chọn</p><h3 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">{selectedSign?.label}</h3></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{selectedSign?.region}</span></div>{selectedSign?.video_url ? <video key={selectedSign.id} controls preload="metadata" className="aspect-video w-full bg-slate-950" src={selectedSign.video_url} aria-label={`Video ký hiệu ${selectedSign.label}`} /> : <div className="flex aspect-video flex-col items-center justify-center bg-slate-950 px-6 text-center text-white"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-emerald-300"><Icon name="video_library" className="text-[27px]" /></span><p className="mt-4 font-semibold">Chưa có video ký hiệu</p><p className="mt-1 max-w-sm text-sm leading-6 text-slate-300">Video cho từ “{selectedSign?.label}” sẽ hiển thị ở đây khi được quản trị viên bổ sung.</p></div>}<div className="p-5">{selectedSign?.description && <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{selectedSign.description}</p>}{selectedSign?.source && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Nguồn: {selectedSign.source}</p>}</div></article>
            </div> : <div className="mt-6"><EmptyState icon="video_library" title="Chưa có từ vựng trong chủ đề này" description="Hãy chọn chủ đề khác hoặc bổ sung từ vựng và video ký hiệu từ khu vực quản trị." /></div>}
          </section>
          <section className="mt-9 border-t border-slate-200 pt-8 dark:border-slate-800" aria-labelledby="communication-speech-title"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Văn bản thành giọng nói</p><h2 id="communication-speech-title" className="mt-1 text-3xl font-semibold tracking-[0.01em] text-slate-950 dark:text-white">Soạn và lắng nghe</h2></div><span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"><Icon name="translate" className="text-[17px]" />Tiếng Việt</span></div><TextToSpeechPanel suggestedText={selectedSign?.label} /></section>
        </main>
      </div>
    </div>
  );
}
