type PaginationProps = { offset: number; pageSize: number; count: number; onChange: (offset: number) => void };

export function Pagination({ offset, pageSize, count, onChange }: PaginationProps) {
  if (offset === 0 && count < pageSize) return null;
  return (
    <nav aria-label="Phân trang" className="mt-6 flex items-center justify-center gap-3">
      <button type="button" disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - pageSize))} className="rounded-lg bg-surface-container-lowest px-4 py-2 text-label-md text-primary shadow-sm disabled:cursor-not-allowed disabled:opacity-50">Trang trước</button>
      <span className="text-body-sm text-on-surface-variant">Trang {Math.floor(offset / pageSize) + 1}</span>
      <button type="button" disabled={count < pageSize} onClick={() => onChange(offset + pageSize)} className="rounded-lg bg-surface-container-lowest px-4 py-2 text-label-md text-primary shadow-sm disabled:cursor-not-allowed disabled:opacity-50">Trang sau</button>
    </nav>
  );
}
