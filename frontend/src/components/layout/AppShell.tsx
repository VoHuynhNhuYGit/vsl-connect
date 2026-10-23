import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';
import { TopNav } from './TopNav';

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-body-md text-on-surface">
      <TopNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
