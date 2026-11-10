type PaginationProps = { offset: number; pageSize: number; count: number; onChange: (offset: number) => void };

export function Pagination({ offset, pageSize, count, onChange }: PaginationProps) {
  if (offset === 0 && count < pageSize) return null;
  return (
    <nav aria-label="Phân trang" className="mt-7 flex items-center justify-center gap-3">
      <button type="button" disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - pageSize))} className="rounded-lg border border-slate-200 bg-surface-card px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-emerald-400/10">Trang trước</button>
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Trang {Math.floor(offset / pageSize) + 1}</span>
      <button type="button" disabled={count < pageSize} onClick={() => onChange(offset + pageSize)} className="rounded-lg border border-slate-200 bg-surface-card px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-emerald-400/10">Trang sau</button>
    </nav>
  );
}
