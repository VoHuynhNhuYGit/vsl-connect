import { Icon } from '../ui/Icon';
import { AdminPagination } from './AdminPagination';
import { type AdminAuditLog, usePagedAdminResource } from '../../services/adminApi';

const actionMeta = {
  created: { label: 'Đã tạo', icon: 'add_circle', tone: 'bg-secondary-container text-on-secondary-container' },
  updated: { label: 'Đã cập nhật', icon: 'edit', tone: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200' },
  deleted: { label: 'Đã xóa', icon: 'delete', tone: 'bg-error-container text-error' },
} as const;

const resourceLabels: Record<string, string> = { course: 'Khóa học', lesson: 'Bài học', sign: 'Ký hiệu', user: 'Người dùng' };

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Không rõ thời gian' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

export function SystemLog() {
  const { data: logs, loading, error, refresh, offset, setOffset, pageSize } = usePagedAdminResource<AdminAuditLog>('/admin/audit-logs');

  return <section aria-labelledby="system-title">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><p className="text-label-sm uppercase tracking-[0.14em] text-primary">Quản trị &amp; theo dõi</p><h2 id="system-title" className="mt-1 text-headline-lg">Hệ thống</h2><p className="mt-1 text-body-sm text-on-surface-variant">Lịch sử tạo, cập nhật và xóa nội dung trong trang quản trị.</p></div><button type="button" onClick={refresh} className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2 text-label-md text-on-surface transition-colors hover:bg-surface-container-low"><Icon name="refresh" className="text-[18px]" />Làm mới</button></div>
    <div className="overflow-hidden rounded-2xl border border-surface-container bg-surface-container-lowest shadow-card">
      {loading ? <p role="status" className="p-6 text-body-sm text-on-surface-variant">Đang tải nhật ký hệ thống...</p> : error ? <div className="p-6"><p role="alert" className="text-body-sm text-error">{error}</p><button type="button" onClick={refresh} className="mt-3 rounded-lg bg-surface-container px-3 py-2 text-label-md text-primary">Thử lại</button></div> : logs?.length ? <div className="overflow-x-auto"><table className="w-full min-w-[48rem] text-left"><thead className="bg-surface-container-low text-label-sm text-on-surface-variant"><tr><th className="px-5 py-3">Thao tác</th><th className="px-4 py-3">Đối tượng</th><th className="px-4 py-3">Thực hiện bởi</th><th className="px-5 py-3 text-right">Thời gian</th></tr></thead><tbody>{logs.map((log) => <LogRow key={log.id} log={log} />)}</tbody></table></div> : <div className="p-8 text-center"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container"><Icon name="history" className="text-[23px]" /></span><p className="mt-3 text-label-md">Chưa có thay đổi nào được ghi nhận.</p><p className="mt-1 text-body-sm text-on-surface-variant">Nhật ký sẽ xuất hiện sau khi quản trị viên tạo, sửa hoặc xóa dữ liệu.</p></div>}
    </div>
    {!loading && !error && <AdminPagination offset={offset} pageSize={pageSize} count={logs?.length ?? 0} onChange={setOffset} />}
  </section>;
}

function LogRow({ log }: { log: AdminAuditLog }) {
  const action = actionMeta[log.action];
  const resource = resourceLabels[log.resource_type] ?? log.resource_type;
  return <tr className="border-t border-surface-container"><td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-sm ${action.tone}`}><Icon name={action.icon} className="text-[15px]" />{action.label}</span></td><td className="px-4 py-4"><p className="text-label-md">{resource}</p><p className="mt-1 max-w-[22rem] truncate text-body-sm text-on-surface-variant" title={log.resource_label}>{log.resource_label}</p></td><td className="px-4 py-4 text-body-sm">{log.actor_name}</td><td className="px-5 py-4 text-right text-body-sm text-on-surface-variant"><time dateTime={log.created_at}>{formatDate(log.created_at)}</time></td></tr>;
}
