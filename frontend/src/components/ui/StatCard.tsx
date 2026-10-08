import { Icon } from './Icon';
import { SurfaceCard } from './SurfaceCard';

type StatCardProps = {
  label: string;
  value: string;
  suffix?: string;
  detail: string;
  icon: string;
  detailIcon?: string;
  detailTone?: 'primary' | 'error' | 'muted';
};

export function StatCard({ label, value, suffix, detail, icon, detailIcon, detailTone = 'primary' }: StatCardProps) {
  const detailClass = detailTone === 'error' ? 'text-error' : detailTone === 'muted' ? 'text-on-surface-variant' : 'text-primary';
  return (
    <SurfaceCard className="flex items-start justify-between p-5">
      <div className="space-y-1">
        <span className="text-body-sm text-on-surface-variant">{label}</span>
        <div className="text-headline-xl text-on-surface">
          {value} {suffix && <span className="text-body-md font-normal text-on-surface-variant">{suffix}</span>}
        </div>
        <div className={`inline-flex items-center gap-1 text-label-sm ${detailClass}`}>
          {detailIcon && <Icon name={detailIcon} className="text-[14px]" />}
          <span>{detail}</span>
        </div>
      </div>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${detailTone === 'error' ? 'bg-error-container/40 text-error' : 'bg-surface-container text-primary'}`}>
        <Icon name={icon} className="text-[22px]" />
      </div>
    </SurfaceCard>
  );
}
