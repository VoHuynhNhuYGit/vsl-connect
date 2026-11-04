type PaginationProps = { offset: number; pageSize: number; count: number; onChange: (offset: number) => void };

export function Pagination({ offset, pageSize, count, onChange }: PaginationProps) {
  if (offset === 0 && count < pageSize) return null;
  return (
    <nav aria-label="Phân trang" className="mt-6 flex items-center justify-center gap-3">
      <button type="button" disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - pageSize))} className="min-h-11 rounded-lg border border-surface-border bg-surface-container-lowest px-4 py-2 text-label-md text-primary shadow-sm transition hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100">Trang trước</button>
      <span className="text-body-sm text-on-surface-variant">Trang {Math.floor(offset / pageSize) + 1}</span>
      <button type="button" disabled={count < pageSize} onClick={() => onChange(offset + pageSize)} className="min-h-11 rounded-lg border border-surface-border bg-surface-container-lowest px-4 py-2 text-label-md text-primary shadow-sm transition hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100">Trang sau</button>
    </nav>
  );
}
