import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, LoadState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Pagination } from '../components/ui/Pagination';
import { type Course, useApi } from '../services/api';

const PAGE_SIZE = 20;

export function LearningPathPage() {
  const [offset, setOffset] = useState(0);
  const { data: courses, loading, error, retry } = useApi<Course[]>(`/api/v1/courses?limit=${PAGE_SIZE}&offset=${offset}`);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mb-7"><p className="text-label-sm uppercase tracking-[0.16em] text-primary">Học tập</p><h1 className="mt-2 text-headline-xl">Lộ trình học</h1><p className="mt-2 text-body-lg text-on-surface-variant">Chọn một khóa học để bắt đầu.</p></div>
      {loading || error ? <LoadState loading={loading} retry={retry} /> : courses && courses.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => <Link key={course.id} to={`/lo-trinh-hoc-tap/${encodeURIComponent(course.slug)}`} className="group flex min-h-52 flex-col rounded-2xl border border-surface-container bg-surface-container-lowest p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"><div className="flex items-center justify-between gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container"><Icon name="school" className="text-[24px]" /></span><span className="rounded-full bg-surface-container-low px-3 py-1 text-label-sm text-on-surface-variant">{course.difficulty}</span></div><h2 className="mt-5 text-headline-md">{course.title}</h2>{course.description && <p className="mt-2 line-clamp-2 text-body-sm text-on-surface-variant">{course.description}</p>}<span className="mt-auto inline-flex items-center gap-1 pt-5 text-label-md text-primary">Xem bài học <Icon name="arrow_forward" className="text-[18px] transition group-hover:translate-x-1" /></span></Link>)}
        </div>
      ) : <EmptyState icon="school" title={offset ? 'Không còn khóa học' : 'Chưa có khóa học'} description="Các khóa học sẽ xuất hiện tại đây khi được xuất bản." />}
      {!loading && !error && courses && <Pagination offset={offset} pageSize={PAGE_SIZE} count={courses.length} onChange={setOffset} />}
    </div>
  );
}
