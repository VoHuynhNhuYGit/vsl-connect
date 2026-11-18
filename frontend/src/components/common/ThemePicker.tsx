import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { siteThemes } from '../../config/themes';
import { useTheme } from '../../context/ThemeContext';
import { Icon } from '../ui/Icon';
import { ThemeArtwork } from './ThemeArtwork';

export function ThemeChoices({ compact = false }: { compact?: boolean }) {
  const { siteTheme, setSiteTheme, canCustomize } = useTheme();
  const group = useId();
  if (!canCustomize) return null;
  return <div className={`theme-choices grid gap-4 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-4'}`} role="group" aria-label="Chọn chủ đề giao diện">
    {siteThemes.map((item) => <label key={item.id} className={`theme-choice ${item.id === 'default' ? `theme-choice--default ${compact ? 'sm:col-span-2' : 'sm:col-span-2 xl:col-span-4'}` : ''} group relative block cursor-pointer overflow-hidden rounded-2xl border-2 transition hover:-translate-y-1 ${siteTheme === item.id ? 'border-primary shadow-lift' : 'border-surface-border hover:border-primary'}`}>
      <input type="radio" name={group} value={item.id} checked={siteTheme === item.id} onChange={() => setSiteTheme(item.id)} className="peer sr-only" />
      <span className="pointer-events-none absolute inset-0 z-10 rounded-[14px] peer-focus-visible:ring-4 peer-focus-visible:ring-primary peer-focus-visible:ring-inset" />
      <div className={`theme-preview relative overflow-hidden ${compact ? 'h-32' : 'h-44'}`} style={{ '--art-primary': item.colors[0], '--art-blue': item.colors[1], '--art-gold': item.colors[2], '--art-paper': item.paper, '--art-ink': item.ink, '--art-soft': `${item.colors[0]}12`, backgroundColor: item.paper, color: item.ink } as CSSProperties}>
        <span className="absolute left-4 top-3 font-sans text-xl opacity-50">{item.number}</span>
        <ThemeArtwork theme={item.id} className="mx-auto h-full w-full max-w-64" />
        <span className="absolute bottom-3 right-3 flex gap-1">{item.colors.map(color => <span key={color} className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ background: color }} />)}</span>
        {siteTheme === item.id && <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"><Icon name="check" className="text-[16px]" /></span>}
      </div>
      <div className="bg-surface-card p-4"><span className="flex items-center justify-between gap-2"><strong className="font-sans text-xl text-on-surface">{item.name}</strong><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-outline-variant">{siteTheme === item.id && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}</span></span><span className="mt-1.5 block text-xs leading-5 text-on-surface-variant">{item.subtitle}</span></div>
    </label>)}
  </div>;
}

export function ThemePicker() {
  const { siteTheme, theme, setTheme, canCustomize, backgroundMotion, setBackgroundMotion } = useTheme();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const activeTheme = siteThemes.find(item => item.id === siteTheme)!;
  useEffect(() => {
    if (!open || !canCustomize) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.showModal();
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open, canCustomize]);
  useEffect(() => { if (!canCustomize) setOpen(false); }, [canCustomize]);

  if (!canCustomize) return null;

  return <>
    <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={`Chọn giao diện. Đang dùng ${activeTheme.name}`} title="Chọn giao diện" className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-surface-border bg-surface-card px-3 text-sm font-semibold text-on-surface transition hover:border-primary hover:text-primary">
      <Icon name="palette" className="text-[20px] text-primary" /><span className="hidden sm:inline">Giao diện</span>
    </button>
    {open && createPortal(<dialog ref={dialog} aria-labelledby={titleId} onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }} className="theme-dialog m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-[760px] overflow-y-auto rounded-3xl border border-surface-border bg-surface-card p-0 text-on-surface shadow-modal backdrop:bg-black/55 backdrop:backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4 border-b border-surface-border px-5 py-5 sm:px-7"><div><p className="theme-eyebrow">BỘ SƯU TẬP GIAO DIỆN</p><h2 id={titleId} className="mt-2 font-sans text-3xl">Một chút Việt, theo cách bạn.</h2><p className="mt-2 text-sm leading-6 text-on-surface-variant">Chọn sắc màu cho toàn bộ không gian học của bạn.</p></div><button type="button" onClick={() => dialog.current?.close()} aria-label="Đóng bộ chọn giao diện" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-elevated hover:text-primary"><Icon name="close" /></button></div>
      <div className="p-5 sm:px-7"><ThemeChoices compact /><div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface-elevated p-3"><span className="text-sm font-semibold">Chế độ hiển thị</span><div className="flex gap-1" role="group" aria-label="Chế độ sáng tối">{(['light', 'dark'] as const).map(mode => <button key={mode} type="button" aria-pressed={theme === mode} onClick={() => setTheme(mode)} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${theme === mode ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-card'}`}><Icon name={mode === 'light' ? 'light_mode' : 'dark_mode'} className="text-[18px]" />{mode === 'light' ? 'Sáng' : 'Tối'}</button>)}</div></div></div>
      <label className="mx-5 mb-5 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-surface-border p-4 sm:mx-7"><span><span className="block text-sm font-semibold">Chuyển động nền</span><span className="mt-1 block text-xs leading-6 text-on-surface-variant">Họa tiết và sắc màu chuyển động nhẹ theo chủ đề.</span></span><input type="checkbox" checked={backgroundMotion} onChange={event => setBackgroundMotion(event.target.checked)} className="h-5 w-5 shrink-0 accent-[var(--theme-accent)]" /></label>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-border px-5 py-4 sm:px-7"><p aria-live="polite" role="status" className="text-xs text-on-surface-variant">Đã chọn {activeTheme.name} · Tự động lưu trên trình duyệt này</p><button type="button" onClick={() => dialog.current?.close()} className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-container">Hoàn tất</button></div>
    </dialog>, document.body)}
  </>;
}
