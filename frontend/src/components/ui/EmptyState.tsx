import type { ReactNode } from 'react';
import { Icon } from './Icon';

type EmptyStateProps = { icon: string; title: string; description?: string; children?: ReactNode };

export function EmptyState({ icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-12 text-center dark:border-emerald-400/20 dark:bg-emerald-400/[0.04]">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Icon name={icon} className="text-[28px]" /></div>
      <h2 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">{title}</h2>
      {description && <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function LoadState({ loading, retry }: { loading: boolean; retry: () => void }) {
  if (loading) return <p role="status" className="rounded-xl border border-slate-200 bg-surface-card p-8 text-center text-sm text-slate-500 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Đang tải...</p>;
  return <EmptyState icon="wifi_off" title="Không thể tải dữ liệu" description="Kiểm tra kết nối rồi thử lại."><button type="button" onClick={retry} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">Thử lại</button></EmptyState>;
}
