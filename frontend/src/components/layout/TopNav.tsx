import { NavLink } from 'react-router-dom';
import { Icon } from '../ui/Icon';

const navItems = [
  { label: 'Tài khoản', to: '/dang-nhap' },
  { label: 'Trang chủ', to: '/' },
  { label: 'Lộ trình', to: '/lo-trinh-hoc-tap' },
  { label: 'Từ điển', to: '/tu-dien-ky-hieu' },
  { label: 'Luyện tập', to: '/luyen-tap' },
  { label: 'Ôn tập', to: '/on-tap' },
  { label: 'Giao tiếp', to: '/giao-tiep' },
  { label: 'Quản trị', to: '/admin' },
];

export function TopNav() {
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname.toLowerCase());
  const adminUrl = new URL(window.location.href);
  adminUrl.hostname = 'admin.localhost';
  adminUrl.pathname = '/';
  adminUrl.search = '';
  adminUrl.hash = '';
  return (
    <header className="border-b border-surface-container bg-surface-container-lowest">
      <div className="mx-auto flex max-w-7xl flex-col px-4 sm:px-6 lg:flex-row lg:items-center lg:gap-10 lg:px-8">
        <NavLink to="/" className="flex w-fit shrink-0 items-center gap-3 py-4" aria-label="VSL Connect - Trang chủ">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container"><Icon name="sign_language" className="text-[24px]" /></span>
          <span className="text-headline-sm">VSL Connect</span>
        </NavLink>
        <nav className="flex gap-1 overflow-x-auto pb-3 lg:pb-0" aria-label="Điều hướng chính">
          {navItems.map((item) => item.to === '/admin' && isLocal
            ? <a key={item.to} href={adminUrl.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface">{item.label}</a>
            : <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-2 text-label-md transition-colors ${isActive ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'}`}>{item.label}</NavLink>)}
        </nav>
      </div>
    </header>
  );
}
