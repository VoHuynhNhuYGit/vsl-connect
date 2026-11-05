import { Link } from 'react-router-dom';
import { Icon } from '../ui/Icon';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-7 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12 xl:px-16">
        <Link to="/" className="inline-flex items-center gap-2 font-bold text-slate-900 transition-colors hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:text-white dark:hover:text-emerald-300">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white"><Icon name="play_arrow" className="text-[20px]" /></span>
          VSL <span className="text-emerald-600 dark:text-emerald-400">Connect</span>
        </Link>
        <p className="text-slate-500 dark:text-slate-400">Học ngôn ngữ ký hiệu Việt Nam theo cách trực quan và dễ tiếp cận.</p>
      </div>
    </footer>
  );
}
