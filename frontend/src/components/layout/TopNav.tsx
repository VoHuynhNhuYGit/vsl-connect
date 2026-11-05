import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAdminResource, type AuthSession } from '../../services/adminApi';
import { ThemeToggle } from '../common/ThemeToggle';
import { Icon } from '../ui/Icon';

const navItems = [
  { label: 'Trang chủ', to: '/', icon: 'home', end: true },
  { label: 'Lộ trình', to: '/lo-trinh-hoc-tap', icon: 'account_tree' },
  { label: 'Từ điển', to: '/tu-dien-ky-hieu', icon: 'auto_stories' },
  { label: 'Luyện tập', to: '/luyen-tap', icon: 'play_lesson' },
  { label: 'Ôn tập', to: '/on-tap', icon: 'layers' },
  { label: 'Giao tiếp', to: '/giao-tiep', icon: 'videocam' },
];

export function TopNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useAdminResource<AuthSession>('/auth/me');
  const user = session?.user;
  const isAdmin = user?.role === 'admin';
  const displayName = user?.display_name || 'Học viên';
  const initials = displayName.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toLocaleUpperCase('vi-VN');
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname.toLowerCase());
  const adminUrl = new URL(window.location.href);
  adminUrl.hostname = 'admin.localhost';
  adminUrl.pathname = '/';
  adminUrl.search = '';
  adminUrl.hash = '';

  const linkClass = ({ isActive }: { isActive: boolean }) => `inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white'}`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 text-slate-950 shadow-[0_5px_20px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 dark:text-white">
      <div className="mx-auto flex min-h-[76px] max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8 xl:px-12">
        <Link to="/" aria-label="VSL Connect — Trang chủ" className="group inline-flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-[0_7px_16px_-10px_rgba(5,150,105,0.95)] transition-transform duration-200 group-hover:scale-[1.04]">
            <Icon name="play_arrow" className="translate-x-px text-[26px]" />
          </span>
          <span className="hidden text-[21px] font-bold tracking-[-0.045em] text-slate-950 dark:text-white sm:block">VSL <span className="text-emerald-600 dark:text-emerald-400">Connect</span></span>
        </Link>

        <span aria-hidden="true" className="hidden h-8 w-px bg-slate-200 lg:block dark:bg-slate-800" />

        <nav aria-label="Điều hướng chính" className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto xl:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              <Icon name={item.icon} className="text-[19px]" /><span>{item.label}</span>
            </NavLink>
          ))}
          {isAdmin && (isLocal
            ? <a href={adminUrl.href} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white"><Icon name="admin_panel_settings" className="text-[19px]" />Quản trị</a>
            : <NavLink to="/admin" className={linkClass}><Icon name="admin_panel_settings" className="text-[19px]" />Quản trị</NavLink>)}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {user ? (
            <Link to="/dang-nhap" aria-label={`Tài khoản ${displayName}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-1.5 py-1.5 pr-2.5 transition-colors hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-emerald-400/10">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${isAdmin ? 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200'}`}>{initials || 'HV'}</span>
              <span className="hidden max-w-24 text-left sm:block"><span className="block truncate text-xs font-bold text-slate-900 dark:text-white">{displayName}</span><span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">{isAdmin ? 'Quản trị viên' : 'Học viên'}</span></span>
              <Icon name="keyboard_arrow_down" className="hidden text-[17px] text-slate-500 sm:block" />
            </Link>
          ) : (
            <Link to="/dang-nhap" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-sm font-bold text-white shadow-[0_7px_16px_-12px_rgba(5,150,105,0.95)] transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:bg-emerald-600 dark:hover:bg-emerald-500">
              <Icon name="login" className="text-[18px]" /><span className="hidden sm:inline">Đăng nhập</span>
            </Link>
          )}
          <button type="button" aria-label={menuOpen ? 'Đóng điều hướng' : 'Mở điều hướng'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 xl:hidden"><Icon name={menuOpen ? 'close' : 'menu'} /></button>
        </div>
      </div>

      <nav aria-label="Điều hướng chính trên thiết bị nhỏ" className={`${menuOpen ? 'grid' : 'hidden'} grid-cols-2 gap-1 border-t border-slate-200 px-4 py-3 dark:border-slate-800 sm:grid-cols-3 sm:px-6 xl:hidden`}>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMenuOpen(false)} className={linkClass}>
            <Icon name={item.icon} className="text-[19px]" /><span>{item.label}</span>
          </NavLink>
        ))}
        {isAdmin && (isLocal
          ? <a href={adminUrl.href} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white"><Icon name="admin_panel_settings" className="text-[19px]" />Quản trị</a>
          : <NavLink to="/admin" onClick={() => setMenuOpen(false)} className={linkClass}><Icon name="admin_panel_settings" className="text-[19px]" />Quản trị</NavLink>)}
      </nav>
    </header>
  );
}
