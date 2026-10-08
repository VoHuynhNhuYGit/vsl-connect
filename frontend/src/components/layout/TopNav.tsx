import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon';

const navItems = [
  { label: 'Trang chủ', to: '/' },
  { label: 'Lộ trình học tập', to: '/lo-trinh-hoc-tap' },
  { label: 'Từ điển ký hiệu', to: '/tu-dien-ky-hieu' },
  { label: 'Luyện tập', to: '/luyen-tap' },
  { label: 'Ôn tập', to: '/on-tap' },
  { label: 'Giao tiếp', to: '/giao-tiep' },
];

export function TopNav() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
      if (event.key === 'Escape') {
        setSearchOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-[72px] bg-surface-container-lowest/95 shadow-card backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <NavLink to="/" className="flex shrink-0 items-center gap-3" aria-label="VSL Connect - Trang chủ">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container shadow-sm">
              <Icon name="sign_language" className="text-[24px]" />
            </div>
            <div className="hidden flex-col sm:flex">
              <span className="text-headline-sm leading-tight tracking-tight">VSL Connect</span>
              <span className="text-label-sm font-normal tracking-wide text-on-surface-variant">Ngôn ngữ Ký hiệu VN</span>
            </div>
          </NavLink>

          <nav className="hidden items-center gap-1 xl:flex" aria-label="Điều hướng chính">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `rounded-lg px-3.5 py-2 transition-colors ${isActive ? 'bg-secondary-container text-on-secondary-container text-headline-sm' : 'text-body-md text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
            <button onClick={() => setSearchOpen(true)} className="flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-1.5 text-on-surface-variant transition-colors hover:bg-surface-container" type="button" aria-label="Mở tìm kiếm nhanh">
              <Icon name="search" className="text-[18px]" />
              <span className="hidden rounded bg-surface-container-lowest px-1.5 py-0.5 text-code-sm text-on-surface shadow-sm sm:inline">⌘K</span>
            </button>
            <div className="hidden items-center gap-1.5 rounded-full bg-surface-container-low px-2.5 py-1 sm:flex">
              <Icon name="local_fire_department" className="text-[18px] text-error" />
              <span className="text-label-md text-on-surface">14 ngày</span>
            </div>
            <div className="hidden items-center gap-1.5 rounded-full bg-secondary-container px-2.5 py-1 md:flex">
              <Icon name="diamond" className="text-[18px] text-on-secondary-container" />
              <span className="text-label-md text-on-secondary-container">1,280 EXP</span>
            </div>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface" type="button" aria-label="Thông báo">
              <Icon name="notifications" className="text-[20px]" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error ring-2 ring-surface-container-lowest" />
            </button>
            <div className="relative">
              <button onClick={() => setProfileOpen((open) => !open)} className="flex items-center gap-2 rounded-full px-1.5 py-1 transition-colors hover:bg-surface-container-low" type="button" aria-expanded={profileOpen} aria-haspopup="menu">
                <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
                  <Icon name="person" className="text-[18px]" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-surface-container-lowest" />
                </span>
                <span className="hidden text-label-md text-on-surface md:inline">Minh Anh</span>
                <Icon name="expand_more" className="text-[18px] text-on-surface-variant" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl bg-surface-container-lowest py-2 shadow-modal" role="menu">
                  <div className="border-b border-surface-container px-4 py-2">
                    <p className="text-label-md text-on-surface">Minh Anh</p>
                    <p className="text-body-sm text-on-surface-variant">Học viên Cao cấp</p>
                  </div>
                  {[
                    ['space_dashboard', 'Tổng quan học tập'],
                    ['school', 'Khóa học của tôi'],
                    ['trending_up', 'Tiến độ học tập'],
                    ['military_tech', 'Thành tích'],
                    ['manage_accounts', 'Hồ sơ cá nhân'],
                    ['settings', 'Cài đặt'],
                  ].map(([icon, label]) => (
                    <button key={label} onClick={() => setProfileOpen(false)} className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-body-sm text-on-surface transition-colors hover:bg-surface-container-low" type="button" role="menuitem">
                      <Icon name={icon} className="text-[18px] text-on-surface-variant" />
                      {label}
                    </button>
                  ))}
                  <div className="mt-1 border-t border-surface-container pt-1">
                    <button onClick={() => setProfileOpen(false)} className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-body-sm text-error transition-colors hover:bg-surface-container-low" type="button" role="menuitem">
                      <Icon name="logout" className="text-[18px]" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => navigate('/')} className="flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low xl:hidden" type="button" aria-label="Về trang chủ">
              <Icon name="home" className="text-[20px]" />
            </button>
          </div>
        </div>
      </header>

      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-on-surface/20 px-4 pt-24 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Tìm kiếm nhanh">
          <div className="w-full max-w-xl rounded-2xl bg-surface-container-lowest p-4 shadow-modal">
            <div className="flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3">
              <Icon name="search" className="text-primary" />
              <input autoFocus className="min-w-0 flex-1 bg-transparent text-body-lg text-on-surface outline-none" placeholder="Tìm bài học, ký hiệu hoặc chủ đề..." aria-label="Từ khóa tìm kiếm" />
              <button onClick={() => setSearchOpen(false)} className="rounded bg-surface-container px-2 py-1 text-code-sm text-on-surface-variant" type="button">Esc</button>
            </div>
            <p className="px-1 pt-3 text-body-sm text-on-surface-variant">Tìm kiếm nhanh sẽ được kết nối với dữ liệu bài học ở nhóm trang tiếp theo.</p>
          </div>
        </div>
      )}
    </>
  );
}
