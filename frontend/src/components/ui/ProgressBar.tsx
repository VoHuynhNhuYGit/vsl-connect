type ProgressBarProps = { value: number; className?: string; fillClassName?: string };

export function ProgressBar({ value, className = '', fillClassName = 'bg-primary' }: ProgressBarProps) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-surface-container ${className}`}>
      <div className={`h-full rounded-full transition-[width] duration-500 ${fillClassName}`} style={{ width: `${value}%` }} />
    </div>
  );
}
