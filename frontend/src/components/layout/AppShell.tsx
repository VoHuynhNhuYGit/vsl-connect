import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';
import { TopNav } from './TopNav';

export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-body-md text-on-surface">
      <TopNav />
      <main className="min-h-[calc(100vh-72px)] pt-[72px]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
