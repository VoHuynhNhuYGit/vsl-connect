import { Link } from 'react-router-dom';
import heroLaptop from '../assets/vsl-hero-laptop.png';
import { Icon } from '../components/ui/Icon';

const highlights = [
  { icon: 'account_tree', title: 'Lộ trình rõ ràng', description: 'Học từ cơ bản đến nâng cao' },
  { icon: 'smart_display', title: 'Bài học trực quan', description: 'Video minh họa dễ hiểu' },
  { icon: 'menu_book', title: 'Từ điển phong phú', description: 'Tra cứu nhanh, chính xác' },
  { icon: 'videocam', title: 'Giao tiếp trực tuyến', description: 'Kết nối và thực hành cùng nhau' },
];

const journeys = [
  {
    icon: 'school',
    title: 'Lộ trình học',
    description: 'Học theo từng cấp độ',
    to: '/lo-trinh-hoc-tap',
    iconClass: 'bg-emerald-100 text-emerald-700',
    cardClass: 'from-emerald-50 to-teal-50/60 border-emerald-100',
  },
  {
    icon: 'auto_stories',
    title: 'Từ điển ký hiệu',
    description: 'Tra cứu ký hiệu nhanh',
    to: '/tu-dien-ky-hieu',
    iconClass: 'bg-sky-100 text-sky-700',
    cardClass: 'from-sky-50 to-blue-50/60 border-sky-100',
  },
  {
    icon: 'track_changes',
    title: 'Luyện tập',
    description: 'Củng cố và nâng cao kỹ năng',
    to: '/luyen-tap',
    iconClass: 'bg-orange-100 text-orange-700',
    cardClass: 'from-orange-50 to-rose-50/60 border-orange-100',
  },
  {
    icon: 'assignment_turned_in',
    title: 'Ôn tập',
    description: 'Kiểm tra kiến thức đã học',
    to: '/on-tap',
    iconClass: 'bg-violet-100 text-violet-700',
    cardClass: 'from-violet-50 to-fuchsia-50/60 border-violet-100',
  },
];

export function DefaultHomePage() {
  return (
    <div className="default-home overflow-hidden bg-surface-card pb-16 dark:bg-slate-950 sm:pb-20">
      <section className="relative isolate overflow-hidden border-b border-emerald-100 bg-[#f2fff9] dark:border-emerald-950/70 dark:bg-slate-950">
        <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-emerald-200/55 blur-3xl dark:bg-emerald-700/15" />
          <div className="absolute right-[11%] top-[-10rem] h-[31rem] w-[31rem] rounded-full border border-emerald-200/70 bg-emerald-100/35 dark:border-emerald-400/10 dark:bg-emerald-500/5" />
          <div className="absolute -bottom-44 right-[-5rem] h-80 w-[44rem] rounded-[50%] bg-gradient-to-r from-emerald-100/70 via-teal-100/50 to-transparent blur-2xl dark:from-emerald-500/5 dark:via-teal-400/5" />
        </div>

        <div className="mx-auto grid min-h-[470px] max-w-[1440px] items-center gap-8 px-5 py-12 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1.12fr)_minmax(29rem,0.88fr)] lg:gap-2 lg:px-12 lg:py-10 xl:px-16">
          <div className="relative z-10 max-w-[46rem] lg:py-8">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-surface-card/75 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-emerald-800 shadow-sm dark:border-emerald-500/30 dark:bg-slate-900/70 dark:text-emerald-300">
              <Icon name="play_arrow" className="text-[16px]" /> VSL Connect
            </span>
            <h1 className="mt-5 max-w-[780px] text-[clamp(2.1rem,3.4vw,3.5rem)] font-semibold leading-[1.26] tracking-[0.028em] text-slate-950 dark:text-white">
              <span className="block">Học ký hiệu,</span>
              <span className="block text-emerald-600 max-sm:whitespace-normal dark:text-emerald-400">Kết nối dễ dàng hơn.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg sm:leading-8">
              Nền tảng học và giao tiếp bằng ngôn ngữ ký hiệu Việt Nam trực quan, linh hoạt và dành cho mọi người.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/lo-trinh-hoc-tap" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-[0_10px_20px_-12px_rgba(5,150,105,0.9)] transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 active:translate-y-0">
                <Icon name="play_circle" className="text-[20px]" /> Bắt đầu học ngay
              </Link>
              <Link to="/tu-dien-ky-hieu" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-surface-card/70 px-5 py-3 text-sm font-bold text-emerald-800 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 active:translate-y-0 dark:border-emerald-400 dark:bg-slate-900/50 dark:text-emerald-300 dark:hover:bg-emerald-400/10">
                <Icon name="menu_book" className="text-[20px]" /> Khám phá từ điển
              </Link>
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-[720px] items-center justify-center self-end lg:self-center">
            <div aria-hidden="true" className="absolute inset-x-[10%] bottom-[13%] h-20 rounded-[50%] bg-emerald-500/15 blur-2xl dark:bg-emerald-400/10" />
            <img src={heroLaptop} alt="Bài học ngôn ngữ ký hiệu trên laptop" className="relative w-full max-w-[720px] select-none object-contain drop-shadow-[0_24px_30px_rgba(15,118,110,0.16)] motion-safe:animate-[gentle-float_7s_ease-in-out_infinite]" />
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-5 w-[calc(100%-2.5rem)] max-w-[1280px] rounded-2xl border border-slate-200 bg-surface-card px-3 py-3 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.42)] dark:border-slate-800 dark:bg-slate-900 sm:w-[calc(100%-4rem)] sm:px-5 sm:py-4">
        <div className="grid divide-y divide-slate-100 dark:divide-slate-800 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
          {highlights.map((item) => (
            <div key={item.title} className="flex items-center gap-3 px-3 py-3.5 sm:px-4">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                <Icon name={item.icon} className="text-[22px]" />
              </span>
              <span><strong className="block text-sm font-bold text-slate-900 dark:text-white">{item.title}</strong><small className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{item.description}</small></span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-[1440px] px-5 sm:mt-16 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300"><span className="h-4 w-1 rounded-full bg-emerald-500" />Bắt đầu hành trình</p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.035em] text-slate-950 dark:text-white sm:text-4xl">Khám phá ngay</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Chọn một hoạt động phù hợp với mục tiêu học tập của bạn hôm nay.</p>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {journeys.map((item) => (
            <Link key={item.to} to={item.to} className={`group relative min-h-[176px] overflow-hidden rounded-2xl border bg-gradient-to-br p-5 transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_28px_-22px_rgba(15,23,42,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${item.cardClass}`}>
              <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl shadow-sm ${item.iconClass}`}><Icon name={item.icon} className="text-[27px]" /></span>
              <h3 className="mt-5 text-lg font-bold tracking-[-0.02em] text-slate-900">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{item.description}</p>
              <span aria-hidden="true" className="absolute bottom-5 right-5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-card text-slate-800 shadow-sm transition duration-200 group-hover:translate-x-0.5 group-hover:bg-emerald-600 group-hover:text-white"><Icon name="arrow_forward" className="text-[19px]" /></span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
