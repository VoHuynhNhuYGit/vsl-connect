import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState, LoadState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Pagination } from '../components/ui/Pagination';
import { type Course, type Lesson, useApi } from '../services/api';

const PAGE_SIZE = 20;

export function CoursePage() {
  const { slug = '' } = useParams();
  const [offset, setOffset] = useState(0);
  const path = `/api/v1/courses/${encodeURIComponent(slug)}`;
  const course = useApi<Course>(path);
  const lessons = useApi<Lesson[]>(`${path}/lessons?limit=${PAGE_SIZE}&offset=${offset}`);

  return (
    <div className="mx-auto max-w-[1120px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
      <Link to="/lo-trinh-hoc-tap" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:text-emerald-300 dark:hover:bg-emerald-400/10"><Icon name="arrow_back" className="text-[18px]" />Tất cả khóa học</Link>
      {course.loading || course.error ? <div className="mt-5"><LoadState loading={course.loading} retry={course.retry} /></div> : course.data && <>
        <header className="relative mt-4 overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-5 py-7 dark:border-emerald-400/10 dark:from-emerald-950/45 dark:via-slate-950 dark:to-teal-950/35 sm:px-8 sm:py-9">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white"><Icon name="school" className="text-[24px]" /></span>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">{course.data.difficulty}</p>
          <h1 className="mt-1.5 text-3xl font-semibold leading-tight tracking-[0.01em] text-slate-950 dark:text-white sm:text-4xl">{course.data.title}</h1>
          {course.data.description && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">{course.data.description}</p>}
        </header>
        <section className="mt-8" aria-labelledby="lesson-list-title"><div className="mb-4 flex items-center justify-between gap-3"><h2 id="lesson-list-title" className="text-2xl font-semibold tracking-[0.01em] text-slate-950 dark:text-white">Bài học</h2>{lessons.data && lessons.data.length > 0 && <span className="text-sm text-slate-500 dark:text-slate-400">{lessons.data.length} bài</span>}</div>
          {lessons.loading || lessons.error ? <LoadState loading={lessons.loading} retry={lessons.retry} /> : lessons.data && lessons.data.length > 0 ? <div className="space-y-3">{lessons.data.map((lesson) => <article key={lesson.id} className="rounded-xl border border-slate-200 bg-surface-card p-5 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-900 sm:p-6"><div className="flex items-start gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">{lesson.position}</span><div className="min-w-0 flex-1"><h3 className="text-lg font-semibold text-slate-950 dark:text-white">{lesson.title}</h3>{lesson.description && <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{lesson.description}</p>}{lesson.video_url ? <video controls preload="none" className="mt-4 w-full max-w-2xl rounded-lg bg-slate-950" src={lesson.video_url}>{lesson.captions_url && <track kind="captions" src={lesson.captions_url} srcLang="vi" label="Tiếng Việt" />}</video> : <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Chưa có video.</p>}</div></div></article>)}</div> : <EmptyState icon="video_library" title={offset ? 'Không còn bài học' : 'Chưa có bài học'} description="Bài học sẽ xuất hiện khi được xuất bản." />}
          {!lessons.loading && !lessons.error && lessons.data && <Pagination offset={offset} pageSize={PAGE_SIZE} count={lessons.data.length} onChange={setOffset} />}
        </section>
      </>}
    </div>
  );
}
