import type { ReactNode } from 'react';
import { Icon } from './Icon';

type EmptyStateProps = { icon: string; title: string; description?: string; children?: ReactNode };

export function EmptyState({ icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container"><Icon name={icon} className="text-[28px]" /></div>
      <h2 className="mt-5 text-headline-md">{title}</h2>
      {description && <p className="mt-2 max-w-md text-body-sm text-on-surface-variant">{description}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function LoadState({ loading, retry }: { loading: boolean; retry: () => void }) {
  if (loading) return (
    <div role="status" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Đang tải nội dung">
      <span className="sr-only">Đang tải nội dung...</span>
      {[0, 1, 2].map((item) => <div key={item} aria-hidden="true" className="animate-pulse rounded-2xl border border-surface-border bg-surface-card p-5">
        <div className="flex items-center gap-3"><div className="h-11 w-11 rounded-xl bg-surface-elevated" /><div className="h-4 flex-1 rounded bg-surface-elevated" /></div>
        <div className="mt-5 h-4 w-3/4 rounded bg-surface-elevated" /><div className="mt-3 h-3 w-full rounded bg-surface-elevated" /><div className="mt-2 h-3 w-2/3 rounded bg-surface-elevated" />
      </div>)}
    </div>
  );
  return <EmptyState icon="wifi_off" title="Không thể tải dữ liệu" description="Kiểm tra kết nối rồi thử lại."><button type="button" onClick={retry} className="min-h-11 rounded-lg bg-primary px-4 py-2 text-label-md text-on-primary transition hover:bg-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-95">Thử lại</button></EmptyState>;
}
