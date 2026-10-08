import { SurfaceCard } from '../ui/SurfaceCard';

const bars = [
  { label: 'Th 2', value: 35, height: 105, color: '#36807d' },
  { label: 'Th 3', value: 45, height: 135, color: '#36807d' },
  { label: 'Th 4', value: 25, height: 75, color: '#acebe7' },
  { label: 'Th 5', value: 50, height: 150, color: '#166664' },
  { label: 'Th 6', value: 40, height: 120, color: '#36807d' },
  { label: 'Hôm nay', value: 20, height: 60, color: '#166664' },
  { label: 'CN', value: 0, height: 8, color: '#6f7978' },
];

export function WeeklyPracticeChart() {
  return (
    <SurfaceCard className="flex flex-col gap-4 p-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-headline-md">Thời gian luyện tập trong tuần</h3>
          <p className="text-body-sm text-on-surface-variant">Mục tiêu: 30 phút/ngày · Trung bình: 35 phút/ngày</p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded bg-secondary-container px-2.5 py-1 text-label-sm text-on-secondary-container"><span className="h-2 w-2 rounded-full bg-secondary" />Đạt chỉ tiêu: 5/7 ngày</span>
      </div>
      <div className="relative h-56 pt-5">
        <div className="pointer-events-none absolute inset-x-10 top-10 border-t border-dashed border-surface-container" />
        <div className="pointer-events-none absolute inset-x-10 top-[92px] border-t border-dashed border-secondary-container" />
        <div className="pointer-events-none absolute inset-x-10 top-[155px] border-t border-dashed border-surface-container" />
        <div className="absolute inset-x-0 bottom-0 top-2 flex items-end justify-around gap-2 border-b border-outline-variant px-6">
          {bars.map((bar) => (
            <div key={bar.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
              <span className={`text-code-sm font-bold ${bar.label === 'Hôm nay' ? 'text-primary' : 'text-on-surface'}`}>{bar.value}p</span>
              <button className="w-full max-w-12 rounded-t-md transition hover:brightness-90" style={{ height: `${Math.max(bar.height * 0.85, 8)}px`, backgroundColor: bar.color }} type="button" aria-label={`${bar.label}: ${bar.value} phút`} />
              <span className={`whitespace-nowrap text-body-sm ${bar.label === 'Hôm nay' ? 'font-semibold text-primary' : 'text-on-surface-variant'}`}>{bar.label}</span>
              {bar.label === 'Hôm nay' && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
            </div>
          ))}
        </div>
        <span className="absolute right-10 top-[78px] text-[10px] text-primary">Mục tiêu ngày</span>
      </div>
    </SurfaceCard>
  );
}
