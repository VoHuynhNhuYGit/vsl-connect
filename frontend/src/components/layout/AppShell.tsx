import { Outlet, useLocation } from 'react-router-dom';
import { AnimatedBackdrop } from '../common/AnimatedBackdrop';
import { useTheme } from '../../context/ThemeContext';
import { Footer } from './Footer';
import { TopNav } from './TopNav';
import './themed-shell.css';

export function AppShell() {
  const { pathname } = useLocation();
  const { siteTheme } = useTheme();
  return (
    <div className="site-shell flex min-h-screen flex-col bg-surface-app text-body-md text-on-surface">
      {siteTheme !== 'default' && pathname !== '/luyen-tap' && <AnimatedBackdrop />}
      <a href="#main-content" className="sr-only z-[70] rounded-lg bg-brand-500 px-4 py-2 font-semibold text-surface-app focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Bỏ qua điều hướng, đến nội dung</a>
      <TopNav />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
