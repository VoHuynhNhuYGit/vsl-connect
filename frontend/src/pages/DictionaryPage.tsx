import { useState } from 'react';
import { EmptyState, LoadState } from '../components/ui/EmptyState';
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mb-7"><p className="text-label-sm uppercase tracking-[0.16em] text-primary">Tra cứu</p><h1 className="mt-2 text-headline-xl">Từ điển ký hiệu</h1><p className="mt-2 text-body-lg text-on-surface-variant">Tìm ký hiệu theo từ khóa.</p></div>
      <form onSubmit={(event) => { event.preventDefault(); setOffset(0); setQuery(input.trim()); }} className="mb-7 flex max-w-2xl items-center gap-2 rounded-2xl border border-surface-container bg-surface-container-lowest p-2 shadow-card">
        <Icon name="search" className="ml-2 text-primary" /><input value={input} onChange={(event) => setInput(event.target.value)} maxLength={200} className="min-w-0 flex-1 bg-transparent px-2 py-2 text-body-lg text-on-surface" placeholder="Nhập từ cần tìm..." aria-label="Tìm ký hiệu" /><button type="submit" className="rounded-xl bg-primary px-4 py-2.5 text-label-md text-on-primary transition hover:bg-primary-container">Tìm kiếm</button>
      </form>
      {loading || error ? <LoadState loading={loading} retry={retry} /> : signs && signs.length > 0 ? <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">{signs.map((sign) => <article key={sign.id} className="rounded-2xl border border-surface-container bg-surface-container-lowest p-5 shadow-card"><div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container"><Icon name="sign_language" /></span><span className="rounded-full bg-surface-container-low px-3 py-1 text-label-sm text-on-surface-variant">{sign.region}</span></div><h2 className="mt-4 text-headline-md">{sign.label}</h2><p className="mt-1 text-label-md text-primary">{sign.topic}</p>{sign.description && <p className="mt-3 text-body-sm text-on-surface-variant">{sign.description}</p>}{sign.video_url && <video controls preload="none" className="mt-4 w-full rounded-xl bg-inverse-surface" src={sign.video_url} aria-label={`Video ký hiệu ${sign.label}`} />}{sign.source && <p className="mt-3 text-label-sm text-on-surface-variant">Nguồn: {sign.source}</p>}</article>)}</div> : <EmptyState icon="manage_search" title={query ? 'Không tìm thấy ký hiệu' : offset ? 'Không còn ký hiệu' : 'Chưa có ký hiệu'} description={query ? 'Thử tìm bằng từ khóa khác.' : 'Các ký hiệu sẽ xuất hiện tại đây khi được xuất bản.'} />}
      {!loading && !error && signs && <Pagination offset={offset} pageSize={PAGE_SIZE} count={signs.length} onChange={setOffset} />}
    </div>
  );
}
