import { Pagination } from '../ui/Pagination';

export function AdminPagination({ offset, pageSize, count, onChange }: { offset: number; pageSize: number; count: number; onChange: (offset: number) => void }) {
  return <Pagination offset={offset} pageSize={pageSize} count={count} onChange={onChange} />;
}
