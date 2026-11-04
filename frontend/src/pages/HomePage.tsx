import { Link } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';

const shortcuts = [
  { title: 'Lộ trình học', description: 'Khám phá các khóa học và xây nền tảng từng bước.', icon: 'route', to: '/lo-trinh-hoc-tap', tone: 'bg-emerald-100 text-emerald-800 ring-emerald-300 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-300/15' },
  { title: 'Từ điển ký hiệu', description: 'Tra cứu ký hiệu nhanh theo từ khóa và chủ đề.', icon: 'menu_book', to: '/tu-dien-ky-hieu', tone: 'bg-sky-100 text-sky-800 ring-sky-300 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-300/15' },
  { title: 'Ôn tập', description: 'Củng cố những kiến thức bạn đã học.', icon: 'style', to: '/on-tap', tone: 'bg-violet-100 text-violet-800 ring-violet-300 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-300/15' },
];

export function HomePage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <section className="group relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-teal-800 via-emerald-900 to-slate-950 px-6 py-10 text-white shadow-[0_24px_80px_-28px_rgba(16,185,129,0.45)] sm:px-10 sm:py-14 lg:min-h-[360px] lg:px-14 lg:py-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-12 -top-36 h-96 w-96 rounded-full bg-emerald-400/20 blur-[90px]" />
          <div className="absolute -bottom-48 left-[38%] h-80 w-80 rounded-full bg-teal-400/10 blur-[85px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.09),transparent_52%)]" />
          <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:linear-gradient(to_right,black,transparent_75%)]" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-100/20 bg-white/[0.07] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.9)]" />VSL Connect
          </p>
          <h1 className="mt-5 max-w-xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[44px] lg:leading-[1.15]">Học ký hiệu, kết nối dễ dàng hơn.</h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-emerald-50/90 sm:text-lg">Bắt đầu hành trình học ngôn ngữ ký hiệu Việt Nam bằng trải nghiệm trực quan, gần gũi và linh hoạt.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/lo-trinh-hoc-tap" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-950 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-900 active:scale-[0.98]">Khám phá khóa học <Icon name="arrow_forward" className="text-[19px] transition-transform group-hover:translate-x-0.5" /></Link>
            <Link to="/tu-dien-ky-hieu" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:scale-[0.98]">Tra từ điển <Icon name="manage_search" className="text-[19px]" /></Link>
          </div>
        </div>

        <div aria-hidden="true" className="pointer-events-none absolute bottom-2 right-8 hidden h-72 w-72 items-center justify-center lg:flex xl:right-16">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.18)_0%,rgba(16,185,129,0.08)_35%,transparent_72%)] blur-2xl" />
          <div className="absolute h-56 w-56 rounded-full border border-white/10 bg-white/[0.025] shadow-[0_0_90px_rgba(52,211,153,0.14)]" />
          <div className="absolute h-44 w-44 rounded-full border border-white/10" />
          <Icon name="sign_language" className="animate-float relative text-[176px] text-emerald-50/75 drop-shadow-[0_12px_28px_rgba(0,0,0,.32)] transition duration-500 group-hover:scale-105 group-hover:text-white" />
          <span className="absolute right-3 top-9 h-2 w-2 rounded-full bg-emerald-200 shadow-[0_0_18px_rgba(167,243,208,.9)]" />
          <span className="absolute bottom-10 left-4 h-1.5 w-1.5 rounded-full bg-teal-100/80" />
        </div>
      </section>

      <section className="mt-10 sm:mt-12" aria-labelledby="home-explore">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">Bắt đầu hành trình</p><h2 id="home-explore" className="mt-2 text-2xl font-bold tracking-tight text-on-surface sm:text-[26px]">Bắt đầu từ đây</h2></div>
          <p className="hidden max-w-sm text-right text-sm leading-relaxed text-gray-600 dark:text-gray-400 sm:block">Chọn một hoạt động để khám phá và luyện tập ngôn ngữ ký hiệu.</p>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shortcuts.map((item, index) => <Link key={item.to} to={item.to} className="group relative flex min-h-40 items-start gap-4 overflow-hidden rounded-2xl border border-surface-border bg-surface-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:p-6">
            <span aria-hidden="true" className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 transition duration-300 group-hover:-translate-y-0.5 group-hover:scale-105 ${item.tone}`}><Icon name={item.icon} className="text-[25px]" /></span>
            <span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-base font-semibold text-on-surface">{item.title}<span className="text-xs font-medium text-gray-500">0{index + 1}</span></span><span className="mt-2 block max-w-xs text-sm leading-relaxed text-gray-600 dark:text-gray-400">{item.description}</span><span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Khám phá <Icon name="arrow_forward" className="text-[16px] transition-transform duration-200 group-hover:translate-x-1" /></span></span>
            <span aria-hidden="true" className="absolute -bottom-10 -right-8 h-28 w-28 rounded-full bg-emerald-400/[0.035] blur-2xl transition group-hover:bg-emerald-300/[0.09]" />
          </Link>)}
        </div>
      </section>
    </div>
  );
}
