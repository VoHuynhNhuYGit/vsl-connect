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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <Link to="/lo-trinh-hoc-tap" className="inline-flex items-center gap-1 text-label-md text-primary"><Icon name="arrow_back" className="text-[18px]" />Tất cả khóa học</Link>
      {course.loading || course.error ? <div className="mt-6"><LoadState loading={course.loading} retry={course.retry} /></div> : course.data && <><div className="mb-7 mt-6"><p className="text-label-sm uppercase tracking-[0.16em] text-primary">{course.data.difficulty}</p><h1 className="mt-2 text-headline-xl">{course.data.title}</h1>{course.data.description && <p className="mt-2 max-w-2xl text-body-lg text-on-surface-variant">{course.data.description}</p>}</div><h2 className="mb-4 text-headline-md">Bài học</h2>{lessons.loading || lessons.error ? <LoadState loading={lessons.loading} retry={lessons.retry} /> : lessons.data && lessons.data.length > 0 ? <div className="space-y-3">{lessons.data.map((lesson) => <article key={lesson.id} className="rounded-2xl border border-surface-container bg-surface-container-lowest p-5 shadow-card"><div className="flex items-start gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-label-md text-on-secondary-container">{lesson.position}</span><div className="min-w-0 flex-1"><h3 className="text-headline-sm">{lesson.title}</h3>{lesson.description && <p className="mt-1 text-body-sm text-on-surface-variant">{lesson.description}</p>}{lesson.video_url ? <video controls preload="none" className="mt-4 w-full max-w-2xl rounded-xl bg-inverse-surface" src={lesson.video_url}>{lesson.captions_url && <track kind="captions" src={lesson.captions_url} srcLang="vi" label="Tiếng Việt" />}</video> : <p className="mt-2 text-body-sm text-on-surface-variant">Chưa có video.</p>}</div></div></article>)}</div> : <EmptyState icon="video_library" title={offset ? 'Không còn bài học' : 'Chưa có bài học'} description="Bài học sẽ xuất hiện khi được xuất bản." />}{!lessons.loading && !lessons.error && lessons.data && <Pagination offset={offset} pageSize={PAGE_SIZE} count={lessons.data.length} onChange={setOffset} />}</>}
    </div>
  );
}
