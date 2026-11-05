import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, LoadState } from '../components/ui/EmptyState';
import { FeaturePageIntro } from '../components/ui/FeaturePageIntro';
import { Icon } from '../components/ui/Icon';
import { Pagination } from '../components/ui/Pagination';
import { type Course, useApi } from '../services/api';

const PAGE_SIZE = 20;

export function LearningPathPage() {
  const [offset, setOffset] = useState(0);
  const { data: courses, loading, error, retry } = useApi<Course[]>(`/api/v1/courses?limit=${PAGE_SIZE}&offset=${offset}`);

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 xl:px-16">
      <FeaturePageIntro eyebrow="Học tập có định hướng" title="Lộ trình học" description="Chọn khóa học phù hợp để xây dựng nền tảng ngôn ngữ ký hiệu theo từng bước rõ ràng." icon="account_tree" />

      <section className="mt-8" aria-labelledby="course-list-title">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Khóa học dành cho bạn</p><h2 id="course-list-title" className="mt-1 text-2xl font-semibold tracking-[0.01em] text-slate-950 dark:text-white">Bắt đầu theo nhịp của bạn</h2></div>
          {courses && courses.length > 0 && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">{courses.length} khóa học</span>}
        </div>
        {loading || error ? <LoadState loading={loading} retry={retry} /> : courses && courses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((course, index) => (
              <Link key={course.id} to={`/lo-trinh-hoc-tap/${encodeURIComponent(course.slug)}`} className="group flex min-h-56 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.4)] transition duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_18px_32px_-24px_rgba(5,150,105,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500/40 sm:p-6">
                <div className="flex items-center justify-between gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Icon name="school" className="text-[25px]" /></span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{course.difficulty}</span></div>
                <span className="mt-5 text-xs font-bold tracking-[0.1em] text-emerald-700 dark:text-emerald-300">KHÓA HỌC {String(offset + index + 1).padStart(2, '0')}</span>
                <h3 className="mt-1.5 text-xl font-semibold leading-snug text-slate-950 dark:text-white">{course.title}</h3>
                {course.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{course.description}</p>}
                <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-bold text-emerald-700 dark:text-emerald-300">Xem bài học <Icon name="arrow_forward" className="text-[18px] transition-transform duration-200 group-hover:translate-x-1" /></span>
              </Link>
            ))}
          </div>
        ) : <EmptyState icon="school" title={offset ? 'Không còn khóa học' : 'Chưa có khóa học'} description="Các khóa học sẽ xuất hiện tại đây khi được xuất bản." />}
        {!loading && !error && courses && <Pagination offset={offset} pageSize={PAGE_SIZE} count={courses.length} onChange={setOffset} />}
      </section>
    </div>
  );
}
