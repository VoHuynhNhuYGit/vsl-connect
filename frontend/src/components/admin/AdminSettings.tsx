import { useEffect, useState } from 'react';
import { useTheme, type Theme } from '../../context/ThemeContext';
import { ThemeChoices } from '../common/ThemePicker';
import { Icon } from '../ui/Icon';

type Density = 'compact' | 'comfortable';
const DENSITY_KEY = 'vsl-connect-admin-density';
const MOTION_KEY = 'vsl-connect-admin-reduced-motion';

function readDensity(): Density {
  try {
    return window.localStorage.getItem(DENSITY_KEY) === 'comfortable' ? 'comfortable' : 'compact';
  } catch {
    return 'compact';
  }
}

function readReducedMotion() {
  try {
    return window.localStorage.getItem(MOTION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function AdminSettings() {
  const { theme, setTheme, setSiteTheme } = useTheme();
  const [density, setDensity] = useState<Density>(readDensity);
  const [reducedMotion, setReducedMotion] = useState(readReducedMotion);

  useEffect(() => {
    document.documentElement.dataset.adminDensity = density;
    try { window.localStorage.setItem(DENSITY_KEY, density); } catch { /* Keep the selection for this session. */ }
  }, [density]);

  useEffect(() => {
    document.documentElement.classList.toggle('admin-reduced-motion', reducedMotion);
    try { window.localStorage.setItem(MOTION_KEY, String(reducedMotion)); } catch { /* Keep the selection for this session. */ }
  }, [reducedMotion]);

  function resetSettings() {
    setTheme('light');
    setSiteTheme('default');
    setDensity('compact');
    setReducedMotion(false);
  }

  return <section aria-labelledby="settings-title" className="max-w-4xl">
    <div className="mb-6"><p className="text-label-sm uppercase tracking-[0.14em] text-primary">Không gian quản trị</p><h2 id="settings-title" className="mt-1 text-headline-lg">Cài đặt</h2><p className="mt-1 text-body-sm text-on-surface-variant">Các tùy chọn này chỉ áp dụng cho trình duyệt bạn đang dùng.</p></div>
    <div className="space-y-4">
      <section className="rounded-2xl border border-surface-border bg-surface-card p-5" aria-labelledby="site-theme-title"><h3 id="site-theme-title" className="text-headline-sm">Chủ đề văn hóa Việt</h3><p className="mb-5 mt-2 text-sm text-on-surface-variant">Đồng bộ màu sắc và họa tiết trên toàn bộ website.</p><ThemeChoices compact /></section>
      <section className="rounded-2xl border border-surface-container bg-surface-container-lowest p-5 shadow-card" aria-labelledby="appearance-title">
        <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container"><Icon name="palette" className="text-[22px]" /></span><div><h3 id="appearance-title" className="text-headline-sm">Giao diện</h3><p className="mt-1 text-body-sm text-on-surface-variant">Chọn chế độ màu phù hợp khi quản lý nội dung.</p></div></div>
        <div className="mt-4 flex flex-wrap gap-3" role="group" aria-label="Chế độ màu">{(['light', 'dark'] as Theme[]).map((item) => <button key={item} type="button" onClick={() => setTheme(item)} aria-pressed={theme === item} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-label-md transition-colors ${theme === item ? 'border-primary bg-secondary-container text-on-secondary-container' : 'border-outline-variant text-on-surface hover:bg-surface-container-low'}`}><Icon name={item === 'light' ? 'light_mode' : 'dark_mode'} className="text-[18px]" />{item === 'light' ? 'Sáng' : 'Tối'}</button>)}</div>
      </section>
      <section className="rounded-2xl border border-surface-container bg-surface-container-lowest p-5 shadow-card" aria-labelledby="density-title">
        <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container"><Icon name="density_small" className="text-[22px]" /></span><div><h3 id="density-title" className="text-headline-sm">Mật độ hiển thị</h3><p className="mt-1 text-body-sm text-on-surface-variant">Điều chỉnh khoảng cách trong bảng và biểu mẫu quản trị.</p></div></div>
        <div className="mt-4 flex flex-wrap gap-3" role="group" aria-label="Mật độ hiển thị">{([{ value: 'compact', label: 'Gọn' }, { value: 'comfortable', label: 'Thoáng' }] as const).map((item) => <button key={item.value} type="button" onClick={() => setDensity(item.value)} aria-pressed={density === item.value} className={`rounded-xl border px-4 py-2.5 text-label-md transition-colors ${density === item.value ? 'border-primary bg-secondary-container text-on-secondary-container' : 'border-outline-variant text-on-surface hover:bg-surface-container-low'}`}>{item.label}</button>)}</div>
      </section>
      <section className="rounded-2xl border border-surface-container bg-surface-container-lowest p-5 shadow-card" aria-labelledby="motion-title">
        <div className="flex items-start justify-between gap-5"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container"><Icon name="animation" className="text-[22px]" /></span><div><h3 id="motion-title" className="text-headline-sm">Hiệu ứng chuyển động</h3><p className="mt-1 text-body-sm text-on-surface-variant">Giảm hoạt ảnh khi chuyển mục hoặc rê chuột.</p></div></div><label className="relative mt-1 inline-flex cursor-pointer items-center"><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} className="peer sr-only" /><span className="h-7 w-12 rounded-full bg-surface-container transition peer-checked:bg-primary after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-surface-card after:transition peer-checked:after:translate-x-5" /><span className="sr-only">Giảm hiệu ứng chuyển động</span></label></div>
      </section>
    </div>
    <button type="button" onClick={resetSettings} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-label-md text-on-surface transition-colors hover:bg-surface-container-low"><Icon name="restart_alt" className="text-[18px]" />Khôi phục mặc định</button>
  </section>;
}
