import { useTheme } from '../../context/ThemeContext';
import { Icon } from '../ui/Icon';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Chuyển sang giao diện ${nextTheme === 'dark' ? 'tối' : 'sáng'}`}
      aria-pressed={theme === 'dark'}
      title={`Giao diện ${theme === 'dark' ? 'tối' : 'sáng'}`}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-all duration-300 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-95 dark:bg-slate-800 dark:text-yellow-400 dark:hover:bg-slate-700"
    >
      <span className="relative flex h-5 w-5 items-center justify-center" aria-hidden="true">
        <Icon name="light_mode" className={`absolute text-[20px] transition-all duration-300 ${theme === 'light' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-50 opacity-0'}`} />
        <Icon name="dark_mode" className={`absolute text-[20px] transition-all duration-300 ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'}`} />
      </span>
    </button>
  );
}
