import { useTheme } from '../../context/ThemeContext';
import { Icon } from './Icon';

const symbols: Record<string, string> = {
  home: 'M5 12 16 3l11 9v16H5ZM12 28V17h8v11',
  school: 'M8 5v9h16v13M8 14v13M5 3h6v6H5ZM5 24h6v6H5ZM21 24h6v6h-6Z',
  auto_stories: 'M16 8C11 4 6 4 3 6v21c5-2 9-1 13 2 4-3 8-4 13-2V6c-3-2-8-2-13 2Zm0 0v21M7 11l5 1M7 16l5 1M21 12l4-1M21 17l4-1',
  play_lesson: 'M5 10h22v16H5ZM10 10l3-6h6l3 6M13 14l8 4-8 4Z',
  track_changes: 'M25 12a12 12 0 1 1-5-6M21 3v8h8M16 11a5 5 0 1 0 5 5',
  sign_language: 'M10 27 4 16q-1-4 3-2l4 5V6q0-4 3 0v9-11q0-4 3 0v11-9q0-4 3 0v10-6q0-4 3 0v10q0 8-7 9Z',
  layers: 'm16 3 13 8-13 8L3 11ZM3 17l13 8 13-8M3 23l13 8 13-8',
  sports_esports: 'M9 8h14l6 16q1 5-4 3l-6-5h-6l-6 5q-5 2-4-3ZM8 15h8M12 11v8M22 14h.1M25 18h.1',
  videocam: 'M3 7h18v19H3ZM21 13l8-5v17l-8-5',
  forum: 'M3 5h26v18H16l-8 6v-6H3ZM9 12h14M9 17h8',
};
const aliases: Record<string, string> = { account_tree: 'school', menu_book: 'auto_stories', assignment_turned_in: 'layers' };

// Text labels next to these decorative SVGs provide their accessible names.
export function ThemeIcon({ name, className = '' }: { name: string; className?: string }) {
  const { siteTheme } = useTheme();
  const path = symbols[aliases[name] || name];
  if (siteTheme === 'default' || !path) return <Icon name={name} className={className} />;
  return <svg viewBox="0 0 32 34" fill="none" stroke="currentColor" strokeWidth={siteTheme === 'dongho' ? 2.2 : 1.7} strokeLinecap={siteTheme === 'dongho' ? 'square' : 'round'} strokeLinejoin={siteTheme === 'dongho' ? 'miter' : 'round'} className={`theme-symbol theme-symbol--${siteTheme} ${className}`} aria-hidden="true" focusable="false">
    <path d={path} />
    {siteTheme === 'patterns' && <circle className="theme-symbol-accent" cx="27" cy="4" r="3" stroke="none" />}
    {siteTheme === 'puppets' && <path className="theme-symbol-accent" d="M4 32q6-3 12 0t12 0" />}
    {siteTheme === 'heritage' && <path className="theme-symbol-accent" d="m25 2 4 4-4 4-4-4Z" stroke="none" />}
  </svg>;
}
