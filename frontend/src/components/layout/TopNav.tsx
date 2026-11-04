import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAdminResource, type AuthSession } from '../../services/adminApi';
import { ThemeToggle } from '../common/ThemeToggle';
import { Icon } from '../ui/Icon';

const navItems = [
  { label: 'Trang chủ', to: '/', icon: 'home', end: true },
  { label: 'Lộ trình', to: '/lo-trinh-hoc-tap', icon: 'route' },
  { label: 'Từ điển', to: '/tu-dien-ky-hieu', icon: 'sign_language' },
  { label: 'Luyện tập', to: '/luyen-tap', icon: 'play_lesson' },
  { label: 'Ôn tập', to: '/on-tap', icon: 'style' },
  { label: 'Giao tiếp', to: '/giao-tiep', icon: 'forum' },
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

  const linkClass = ({ isActive }: { isActive: boolean }) => `group relative inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-[0.98] ${isActive ? 'border-emerald-600/20 bg-emerald-50 text-emerald-800 shadow-sm dark:border-emerald-400/20 dark:bg-white/[0.09] dark:text-emerald-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_16px_rgba(16,185,129,0.08)]' : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/[0.07] dark:hover:text-white'}`;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/80 text-gray-900 shadow-[0_8px_32px_rgba(15,23,42,0.06)] backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/70 dark:text-gray-100 dark:shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
      <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="VSL Connect — Trang chủ" className="group inline-flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700 text-white shadow-glow transition duration-300 group-hover:-rotate-3 group-hover:scale-105 group-hover:shadow-lg">
            <Icon name="sign_language" className="text-[25px]" />
          </span>
          <span className="hidden text-base font-bold tracking-tight text-gray-900 dark:text-white sm:inline">VSL Connect</span>
        </Link>

        <nav aria-label="Điều hướng chính" className="hidden min-w-0 flex-1 items-center justify-center gap-1 overflow-visible lg:flex">
          {navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
            <Icon name={item.icon} className="text-[18px] opacity-80" /><span>{item.label}</span>
          </NavLink>)}
          {isAdmin && (isLocal
            ? <a href={adminUrl.href} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-gray-300 dark:hover:bg-white/[0.07] dark:hover:text-white"><Icon name="admin_panel_settings" className="text-[18px]" />Quản trị</a>
            : <NavLink to="/admin" className={linkClass}><Icon name="admin_panel_settings" className="text-[18px]" />Quản trị</NavLink>)}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <Link to="/dang-nhap" aria-label={`Tài khoản ${displayName}, vai trò ${isAdmin ? 'quản trị viên' : 'học viên'}`} className="group inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 py-1.5 pl-1.5 pr-3 transition hover:border-emerald-500/40 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-surface-border dark:bg-white/[0.04] dark:hover:bg-white/[0.08]">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${isAdmin ? 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-300 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/25' : 'bg-indigo-100 text-indigo-800 ring-1 ring-inset ring-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-200 dark:ring-indigo-400/25'}`}>{initials || 'HV'}</span>
            <span className="hidden max-w-28 text-left sm:block"><span className="block truncate text-xs font-semibold text-gray-900 dark:text-gray-100">{displayName}</span><span className={`mt-0.5 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${isAdmin ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-200'}`}>{isAdmin ? 'Admin' : 'Learner'}</span></span>
          </Link>
          <button type="button" aria-label={menuOpen ? 'Đóng điều hướng' : 'Mở điều hướng'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-surface-border text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-gray-200 dark:hover:bg-white/[0.08] lg:hidden"><Icon name={menuOpen ? 'close' : 'menu'} /></button>
        </div>
      </div>

      <nav aria-label="Điều hướng chính" className={`${menuOpen ? 'grid grid-cols-2' : 'hidden'} gap-1 border-t border-gray-200 px-4 py-3 dark:border-slate-800 sm:px-6 lg:hidden`}>
        {navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMenuOpen(false)} className={linkClass}><Icon name={item.icon} className="text-[18px]" /><span>{item.label}</span></NavLink>)}
        {isAdmin && (isLocal ? <a href={adminUrl.href} className="inline-flex min-h-10 items-center gap-2 rounded-full px-3.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-white/[0.07] dark:hover:text-white"><Icon name="admin_panel_settings" className="text-[18px]" />Quản trị</a> : <NavLink to="/admin" onClick={() => setMenuOpen(false)} className={linkClass}><Icon name="admin_panel_settings" className="text-[18px]" />Quản trị</NavLink>)}
      </nav>
    </header>
  );
}
