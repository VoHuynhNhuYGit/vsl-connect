import { Icon } from './Icon';
import { SurfaceCard } from './SurfaceCard';

type StatCardProps = {
  label: string;
  value: string;
  suffix?: string;
  detail?: string;
  icon: string;
  detailIcon?: string;
  detailTone?: 'primary' | 'error' | 'muted';
  onClick?: () => void;
};

export function StatCard({ label, value, suffix, detail, icon, detailIcon, detailTone = 'primary', onClick }: StatCardProps) {
  const detailClass = detailTone === 'error' ? 'text-error' : detailTone === 'muted' ? 'text-on-surface-variant' : 'text-primary';
  const content = <>
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${detailTone === 'error' ? 'bg-error-container/40 text-error' : 'bg-secondary-container text-on-secondary-container'}`}>
      <Icon name={icon} className="text-[24px]" />
    </div>
    <div className="min-w-0 space-y-1.5 text-left">
      <span className="text-body-sm text-on-surface-variant">{label}</span>
      <div className="text-[38px] font-bold leading-none tracking-[-0.04em] text-on-surface">
        {value} {suffix && <span className="text-body-md font-normal text-on-surface-variant">{suffix}</span>}
      </div>
      {detail && <div className={`inline-flex items-center gap-1 text-label-sm ${detailClass}`}>
        {detailIcon && <Icon name={detailIcon} className="text-[14px]" />}
        <span>{detail}</span>
      </div>}
    </div>
  </>;

  if (onClick) {
    return <button type="button" onClick={onClick} className="flex min-h-32 w-full items-center gap-4 rounded-2xl bg-surface-container-lowest p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{content}</button>;
  }

  return (
    <SurfaceCard className="flex min-h-32 items-center gap-4 p-5">{content}</SurfaceCard>
  );
}
