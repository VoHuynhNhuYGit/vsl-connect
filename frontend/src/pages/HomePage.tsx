import { Link } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { ThemeArtwork } from '../components/common/ThemeArtwork';

import { siteThemes } from '../config/themes';
import { useTheme } from '../context/ThemeContext';
import { AnimatedBackdrop } from '../components/common/AnimatedBackdrop';
import { DefaultHomePage } from './DefaultHomePage';

const highlights = [
  { icon: 'account_tree', title: 'Lộ trình rõ ràng', description: 'Từng bước, theo nhịp của bạn' },
  { icon: 'smart_display', title: 'Bài học trực quan', description: 'Khám phá ký hiệu qua video' },
  { icon: 'menu_book', title: 'Từ điển ký hiệu', description: 'Tra cứu và học thêm mỗi ngày' },
  { icon: 'diversity_1', title: 'Kết nối gần hơn', description: 'Cùng học, cùng thấu hiểu' },
];
const journeys = [
  { icon: 'school', title: 'Lộ trình học', description: 'Bắt đầu từ những ký hiệu đầu tiên.', to: '/lo-trinh-hoc-tap', number: '01' },
  { icon: 'auto_stories', title: 'Từ điển ký hiệu', description: 'Mở thêm một cách để diễn đạt.', to: '/tu-dien-ky-hieu', number: '02' },
  { icon: 'track_changes', title: 'Luyện tập', description: 'Quan sát, thực hành và tiến bộ.', to: '/luyen-tap', number: '03' },
  { icon: 'assignment_turned_in', title: 'Ôn tập', description: 'Ghi nhớ từng điều đã khám phá.', to: '/on-tap', number: '04' },
];

export function HomePage() {
  const { siteTheme } = useTheme();
  const current = siteThemes.find(item => item.id === siteTheme)!;
  if (siteTheme === 'default') return <DefaultHomePage />;
  return <div className="overflow-hidden pb-16 sm:pb-20">
    <section className="theme-hero relative isolate overflow-hidden border-b border-surface-border">
      <AnimatedBackdrop variant="hero" />
      <div className="relative mx-auto grid max-w-[1440px] items-center gap-6 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.12fr_1fr] lg:gap-10 lg:px-12 xl:px-16">
        <div className="relative z-10 max-w-2xl">
          <p className="theme-eyebrow flex items-center gap-2"><span className="h-px w-8 bg-primary" />NGÔN NGỮ KÝ HIỆU VIỆT NAM</p>
          <h1 className="mt-6 text-[clamp(2.5rem,4.5vw,4.7rem)] font-medium leading-[1.12] text-on-surface">Một ký hiệu nhỏ.<br /><span className="text-primary">Một kết nối lớn.</span></h1>
          <p className="mt-6 max-w-lg text-base leading-8 text-on-surface-variant">Học cách lắng nghe bằng ánh mắt, kể chuyện bằng đôi tay. Khám phá ngôn ngữ ký hiệu Việt Nam, theo nhịp riêng của bạn.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/lo-trinh-hoc-tap" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-primary-container">Bắt đầu hành trình<Icon name="arrow_forward" className="text-[19px]" /></Link>
            <Link to="/tu-dien-ky-hieu" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-outline-variant bg-surface-card px-5 py-3 text-sm font-bold text-on-surface transition hover:border-primary hover:text-primary"><Icon name="menu_book" className="text-[19px]" />Khám phá từ điển</Link>
          </div>
          <div className="mt-9 flex items-center gap-3 text-xs text-on-surface-variant"><span className="flex h-8 w-8 items-center justify-center rounded-full border border-surface-border text-primary"><Icon name="sign_language" className="text-[18px]" /></span>Mỗi người một cách học. Mọi người cùng kết nối.</div>
        </div>
        <div className="theme-hero-art w-full max-w-xl justify-self-center">
          <div className="relative flex items-center justify-between px-5"><span className="theme-eyebrow">{current.tag}</span><span className="font-serif text-sm text-on-surface-variant">{current.number} / 04</span></div>
          <ThemeArtwork theme={siteTheme} className="relative mx-auto w-full motion-safe:animate-[gentle-float_8s_ease-in-out_infinite]" />
          <div className="theme-hero-caption relative mx-5 flex items-center justify-between gap-4 py-3"><span className="font-serif text-xl text-on-surface">{current.name}</span><span className="text-right text-[10px] uppercase tracking-wider">{current.motif}</span></div>
        </div>
      </div>
    </section>
    <section aria-label="Cùng học với VSL Connect" className="border-b border-surface-border bg-surface-card">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-5 px-5 py-6 sm:grid-cols-2 sm:px-8 lg:px-12 xl:grid-cols-4 xl:px-16">{highlights.map(item => <div key={item.title} className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-surface-border text-primary"><Icon name={item.icon} className="text-[23px]" /></span><div><strong className="block text-sm font-semibold text-on-surface">{item.title}</strong><span className="mt-1 block text-xs text-on-surface-variant">{item.description}</span></div></div>)}</div>
    </section>
    <section className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 xl:px-16">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="theme-eyebrow">TỪ NHỮNG ĐIỀU ĐẦU TIÊN</p><h2 className="mt-3 text-3xl font-medium text-on-surface sm:text-4xl">Hôm nay, bạn muốn học gì?</h2></div><p className="max-w-sm text-sm leading-6 text-on-surface-variant">Một chút tò mò, một chút thực hành.<br />Mỗi ngày, gần nhau hơn một chút.</p></div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{journeys.map(item => <Link key={item.to} to={item.to} className="journey-card group relative min-h-[200px] border border-surface-border p-5 transition hover:-translate-y-1 hover:shadow-lift"><div className="flex items-center justify-between"><span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-primary"><Icon name={item.icon} className="text-[25px]" /></span><span className="font-serif text-sm text-on-surface-variant">{item.number}</span></div><h3 className="mt-6 text-lg font-bold text-on-surface">{item.title}</h3><p className="mt-2 pr-5 text-xs leading-6 text-on-surface-variant">{item.description}</p><Icon name="arrow_outward" className="absolute bottom-5 right-5 text-primary transition group-hover:-translate-y-1 group-hover:translate-x-1" /></Link>)}</div>
    </section>
  </div>;
}
