import { Link } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';

const shortcuts = [
  { title: 'Lộ trình học', description: 'Khám phá các khóa học.', icon: 'route', to: '/lo-trinh-hoc-tap' },
  { title: 'Từ điển ký hiệu', description: 'Tìm ký hiệu theo từ khóa.', icon: 'menu_book', to: '/tu-dien-ky-hieu' },
  { title: 'Ôn tập', description: 'Củng cố kiến thức đã học.', icon: 'style', to: '/on-tap' },
];

export function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl bg-primary px-6 py-10 text-on-primary sm:px-10 sm:py-14">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-secondary-container/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="text-label-md uppercase tracking-[0.16em] text-secondary-fixed">VSL Connect</p>
          <h1 className="mt-4 text-headline-xl sm:text-[40px] sm:leading-[1.2]">Học ký hiệu, kết nối dễ dàng hơn.</h1>
          <p className="mt-4 text-body-lg text-on-primary/90">Bắt đầu hành trình học ngôn ngữ ký hiệu Việt Nam.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/lo-trinh-hoc-tap" className="inline-flex items-center gap-2 rounded-xl bg-surface-container-lowest px-5 py-3 text-headline-sm text-primary transition hover:bg-secondary-container">Khám phá khóa học <Icon name="arrow_forward" /></Link>
            <Link to="/tu-dien-ky-hieu" className="inline-flex items-center gap-2 rounded-xl border border-secondary-fixed/60 px-5 py-3 text-headline-sm text-on-primary transition hover:bg-primary-container">Tra từ điển</Link>
          </div>
        </div>
        <Icon name="sign_language" className="pointer-events-none absolute bottom-3 right-8 hidden text-[190px] text-secondary-fixed/20 lg:block" />
      </section>

      <section className="mt-10" aria-labelledby="home-explore">
        <h2 id="home-explore" className="text-headline-lg">Bắt đầu từ đây</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map((item) => <Link key={item.to} to={item.to} className="group flex items-start gap-4 rounded-2xl border border-surface-container bg-surface-container-lowest p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container"><Icon name={item.icon} className="text-[24px]" /></span><span className="min-w-0 flex-1"><span className="block text-headline-sm">{item.title}</span><span className="mt-1 block text-body-sm text-on-surface-variant">{item.description}</span></span><Icon name="arrow_forward" className="mt-1 text-primary transition group-hover:translate-x-1" /></Link>)}
        </div>
      </section>
    </div>
  );
}
