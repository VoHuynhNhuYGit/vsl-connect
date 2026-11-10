import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, LoadState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Pagination } from '../components/ui/Pagination';
import { type Course, useApi } from '../services/api';

const PAGE_SIZE = 20;

const courseIcons = ['school', 'forum', 'menu_book', 'layers', 'videocam', 'handshake'];
const sideNavigation = [
  { icon: 'home', label: 'Tổng quan', target: 'learning-overview' },
  { icon: 'school', label: 'Khóa học', target: 'course-list' },
  { icon: 'bar_chart', label: 'Tiến độ', target: 'learning-progress' },
];

function scrollToSection(target: string) {
  document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function LearningPathPage() {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const { data: courses, loading, error, retry } = useApi<Course[]>(`/api/v1/courses?limit=${PAGE_SIZE}&offset=${offset}`);
  const levels = useMemo(() => [...new Set((courses ?? []).map((course) => course.difficulty).filter(Boolean))], [courses]);
  const visibleCourses = useMemo(() => (courses ?? []).filter((course) => {
    const haystack = `${course.title} ${course.description} ${course.difficulty}`.toLocaleLowerCase('vi-VN');
    return haystack.includes(search.trim().toLocaleLowerCase('vi-VN')) && (!difficulty || course.difficulty === difficulty);
  }), [courses, difficulty, search]);

  return (
    <div id="learning-overview" className="overflow-hidden bg-surface-card pb-14 dark:bg-slate-950 sm:pb-18">
      <section className="relative overflow-hidden border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-teal-50 dark:border-emerald-400/10 dark:from-emerald-950/45 dark:via-slate-950 dark:to-teal-950/35">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 bottom-[-7rem] h-52 w-[46rem] rounded-[50%] bg-emerald-200/70 blur-2xl dark:bg-emerald-400/10" />
          <div className="absolute right-[15%] top-[-12rem] h-64 w-64 rounded-full bg-teal-100/80 blur-3xl dark:bg-teal-400/5" />
        </div>
        <div className="relative mx-auto flex min-h-[132px] max-w-[1440px] items-center gap-5 px-5 py-8 sm:px-8 lg:px-12 xl:px-16">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-[0_10px_20px_-17px_rgba(5,150,105,0.75)] dark:bg-emerald-400/10 dark:text-emerald-300"><Icon name="assignment_turned_in" className="text-[32px]" /></span>
          <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">Học tập có định hướng</p><h1 className="mt-1.5 text-3xl font-semibold tracking-[0.01em] text-slate-950 dark:text-white sm:text-4xl">Lộ trình học tập</h1></div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[242px_minmax(0,1fr)] lg:px-12 lg:py-10 xl:px-16">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <nav aria-label="Điều hướng lộ trình" className="grid grid-cols-3 gap-2 border-b border-slate-200 pb-4 dark:border-slate-800 lg:block lg:rounded-xl lg:border lg:border-slate-200 lg:bg-surface-card lg:p-3 lg:shadow-[0_14px_28px_-24px_rgba(15,23,42,0.5)] dark:lg:border-slate-800 dark:lg:bg-slate-900">
            {sideNavigation.map((item, index) => <button key={item.target} type="button" onClick={() => scrollToSection(item.target)} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 lg:mb-1 lg:w-full lg:justify-start ${index === 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'}`}><Icon name={item.icon} className="text-[20px]" /><span className="hidden sm:inline lg:inline">{item.label}</span></button>)}
          </nav>
        </aside>

        <main className="min-w-0">
          <section id="course-list" className="scroll-mt-28" aria-labelledby="course-list-title">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Học theo từng bước</p><h2 id="course-list-title" className="mt-1 text-3xl font-semibold tracking-[0.01em] text-slate-950 dark:text-white">Danh sách khóa học</h2></div>
              <div className="flex w-full gap-2 sm:w-auto">
                <label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-surface-card px-3 shadow-sm focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/15 dark:border-slate-700 dark:bg-slate-900 sm:w-72"><Icon name="search" className="text-[20px] text-slate-500 dark:text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setOffset(0); }} className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-slate-500" placeholder="Tìm khóa học..." aria-label="Tìm khóa học" /></label>
                <label className="relative inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-surface-card text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><Icon name="filter_list" className="pointer-events-none ml-3 text-[20px]" /><select value={difficulty} onChange={(event) => { setDifficulty(event.target.value); setOffset(0); }} className="h-full max-w-28 appearance-none bg-transparent py-2 pl-2 pr-8 text-sm font-semibold focus:outline-none"><option value="">Tất cả</option>{levels.map((level) => <option key={level} value={level}>{level}</option>)}</select><Icon name="keyboard_arrow_down" className="pointer-events-none absolute right-2 text-[18px]" /></label>
              </div>
            </div>

            <div className="mt-6">
              {loading || error ? <LoadState loading={loading} retry={retry} /> : visibleCourses.length > 0 ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleCourses.map((course, index) => <Link key={course.id} to={`/lo-trinh-hoc-tap/${encodeURIComponent(course.slug)}`} className="group relative flex min-h-[170px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-surface-card p-5 shadow-[0_12px_26px_-23px_rgba(15,23,42,0.4)] transition duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_18px_32px_-23px_rgba(5,150,105,0.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500/40"><span aria-hidden="true" className="absolute -bottom-16 -right-14 h-40 w-48 rounded-[50%] bg-emerald-100/70 dark:bg-emerald-400/[0.07]" /><span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300"><Icon name={courseIcons[(offset + index) % courseIcons.length]} className="text-[27px]" /></span><span className="relative mt-auto flex items-end justify-between gap-3 pt-5"><span><h3 className="text-xl font-semibold leading-snug text-slate-950 dark:text-white">{course.title}</h3><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{course.description || course.difficulty}</p></span><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-400/10 dark:text-emerald-300"><Icon name="arrow_forward" className="text-[21px]" /></span></span></Link>)}</div> : <EmptyState icon="manage_search" title="Không tìm thấy khóa học" description="Thử thay đổi từ khóa hoặc bộ lọc để xem thêm khóa học." />}
              {!loading && !error && courses && <Pagination offset={offset} pageSize={PAGE_SIZE} count={courses.length} onChange={setOffset} />}
            </div>
          </section>

          <section id="learning-progress" className="mt-9 scroll-mt-28 rounded-xl border border-slate-200 bg-surface-card p-5 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900 sm:p-6" aria-labelledby="learning-progress-title">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(25rem,0.8fr)] lg:items-center">
              <div><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Icon name="track_changes" className="text-[23px]" /></span><div><h2 id="learning-progress-title" className="text-xl font-semibold text-slate-950 dark:text-white">Tiến độ học tập</h2><p className="text-sm text-slate-500 dark:text-slate-400">Bắt đầu một khóa học để theo dõi tiến độ.</p></div></div><strong className="text-xl font-semibold text-emerald-700 dark:text-emerald-300">0%</strong></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full w-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" /></div></div>
              <div className="grid grid-cols-3 divide-x divide-slate-200 border-t border-slate-200 pt-5 dark:divide-slate-800 dark:border-slate-800 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"><div className="px-2 first:pl-0"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Icon name="menu_book" className="text-[20px]" /></span><strong className="mt-2 block text-xl text-slate-950 dark:text-white">{courses?.length ?? 0}</strong><span className="text-xs font-medium text-slate-500 dark:text-slate-400">Khóa học</span></div><div className="px-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Icon name="smart_display" className="text-[20px]" /></span><strong className="mt-2 block text-xl text-slate-950 dark:text-white">0</strong><span className="text-xs font-medium text-slate-500 dark:text-slate-400">Bài học</span></div><div className="px-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Icon name="task_alt" className="text-[20px]" /></span><strong className="mt-2 block text-xl text-slate-950 dark:text-white">0</strong><span className="text-xs font-medium text-slate-500 dark:text-slate-400">Hoàn thành</span></div></div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
