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
  if (loading) return <p role="status" className="rounded-2xl bg-surface-container-lowest p-8 text-center text-on-surface-variant">Đang tải...</p>;
  return <EmptyState icon="wifi_off" title="Không thể tải dữ liệu" description="Kiểm tra kết nối rồi thử lại."><button type="button" onClick={retry} className="rounded-lg bg-primary px-4 py-2 text-label-md text-on-primary">Thử lại</button></EmptyState>;
}
