import { useState } from 'react';
import { EmptyState, LoadState } from '../components/ui/EmptyState';
import { FeaturePageIntro } from '../components/ui/FeaturePageIntro';
import { Icon } from '../components/ui/Icon';
import { Pagination } from '../components/ui/Pagination';
import { type Sign, useApi } from '../services/api';

const PAGE_SIZE = 20;

export function DictionaryPage() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
  if (query) params.set('q', query);
  const { data: signs, loading, error, retry } = useApi<Sign[]>(`/api/v1/signs?${params.toString()}`);

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 xl:px-16">
      <FeaturePageIntro eyebrow="Tra cứu ký hiệu" title="Từ điển ký hiệu" description="Tìm nhanh từ vựng và xem minh họa để ghi nhớ cách biểu đạt tự nhiên hơn." icon="auto_stories" />

      <form onSubmit={(event) => { event.preventDefault(); setOffset(0); setQuery(input.trim()); }} className="mt-7 flex max-w-3xl items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-900">
        <Icon name="search" className="ml-2 text-[22px] text-emerald-700 dark:text-emerald-300" />
        <input value={input} onChange={(event) => setInput(event.target.value)} maxLength={200} className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-slate-500" placeholder="Nhập từ hoặc chủ đề cần tìm..." aria-label="Tìm ký hiệu" />
        <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">Tìm kiếm</button>
      </form>

      <section className="mt-8" aria-labelledby="sign-list-title">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Kho từ vựng</p><h2 id="sign-list-title" className="mt-1 text-2xl font-semibold tracking-[0.01em] text-slate-950 dark:text-white">{query ? `Kết quả cho “${query}”` : 'Khám phá ký hiệu'}</h2></div>{signs && signs.length > 0 && <span className="text-sm text-slate-500 dark:text-slate-400">{signs.length} kết quả</span>}</div>
        {loading || error ? <LoadState loading={loading} retry={retry} /> : signs && signs.length > 0 ? (
          <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {signs.map((sign) => (
              <article key={sign.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Icon name="sign_language" className="text-[23px]" /></span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{sign.region}</span></div>
                <h3 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">{sign.label}</h3>
                <p className="mt-1 text-sm font-bold text-emerald-700 dark:text-emerald-300">{sign.topic}</p>
                {sign.description && <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{sign.description}</p>}
                {sign.video_url && <video controls preload="none" className="mt-5 w-full rounded-lg bg-slate-950" src={sign.video_url} aria-label={`Video ký hiệu ${sign.label}`} />}
                {sign.source && <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Nguồn: {sign.source}</p>}
              </article>
            ))}
          </div>
        ) : <EmptyState icon="manage_search" title={query ? 'Không tìm thấy ký hiệu' : offset ? 'Không còn ký hiệu' : 'Chưa có ký hiệu'} description={query ? 'Thử tìm bằng từ khóa khác.' : 'Các ký hiệu sẽ xuất hiện tại đây khi được xuất bản.'} />}
        {!loading && !error && signs && <Pagination offset={offset} pageSize={PAGE_SIZE} count={signs.length} onChange={setOffset} />}
      </section>
    </div>
  );
}
