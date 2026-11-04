import { useEffect, useState } from 'react';
import { AdminSignIn } from '../components/admin/AdminSignIn';
import { CourseManager } from '../components/admin/CourseManager';
import { LessonManager } from '../components/admin/LessonManager';
import { SignManager } from '../components/admin/SignManager';
import { UserManager } from '../components/admin/UserManager';
import { MediaManager } from '../components/admin/MediaUpload';
import { Icon } from '../components/ui/Icon';
import { StatCard } from '../components/ui/StatCard';
import { ApiError, type AdminOverview, type AuthSession, getSession, logout, useAdminResource } from '../services/adminApi';

type Tab = 'overview' | 'courses' | 'lessons' | 'signs' | 'media' | 'users';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Tổng quan', icon: 'dashboard' },
  { id: 'courses', label: 'Khóa học', icon: 'school' },
  { id: 'lessons', label: 'Bài học', icon: 'play_lesson' },
  { id: 'signs', label: 'Ký hiệu', icon: 'sign_language' },
  { id: 'media', label: 'Hình ảnh & video', icon: 'perm_media' },
  { id: 'users', label: 'Người dùng', icon: 'group' },
];

export function AdminPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    getSession().then(setSession).catch((error: unknown) => {
      if (!(error instanceof ApiError && error.status === 401)) setMessage(error instanceof Error ? error.message : 'Không thể kiểm tra phiên đăng nhập.');
    }).finally(() => setLoading(false));
  }, []);

  async function signOut(csrfToken: string) {
    try { await logout(csrfToken); } finally { setSession(null); setTab('overview'); }
  }

  if (loading) return <div role="status" className="mx-auto max-w-7xl px-4 py-16 text-body-md text-on-surface-variant sm:px-6 lg:px-8">Đang kiểm tra quyền truy cập...</div>;
  if (!session) return <AdminSignIn onSuccess={setSession} />;
  if (session.user.role !== 'admin') return <div className="mx-auto max-w-xl px-4 py-14 sm:px-6"><section className="rounded-3xl border border-surface-container bg-surface-container-lowest p-8 text-center shadow-card"><span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-error-container text-error"><Icon name="lock" className="text-[28px]" /></span><h1 className="mt-5 text-headline-lg">Chưa có quyền quản trị</h1><p className="mt-2 text-body-sm text-on-surface-variant">Tài khoản này đã đăng nhập nhưng chưa được cấp quyền quản trị viên.</p><button type="button" onClick={() => signOut(session.csrf_token)} className="mt-6 rounded-lg bg-primary px-4 py-2.5 text-label-md text-on-primary">Đăng xuất</button></section></div>;

  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-label-sm uppercase tracking-[0.16em] text-primary">Không gian quản trị</p><h1 className="mt-2 text-headline-xl">Quản lý VSL Connect</h1><p className="mt-2 text-body-sm text-on-surface-variant">Xin chào, {session.user.display_name}. Thay đổi nội dung sẽ hiển thị theo trạng thái xuất bản.</p></div><button type="button" onClick={() => signOut(session.csrf_token)} className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-label-md text-on-surface"><Icon name="logout" className="text-[18px]" />Đăng xuất</button></div>{message && <p role="alert" className="mb-6 rounded-xl bg-error-container px-4 py-3 text-body-sm text-error">{message}</p>}<div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]"><nav className="h-fit rounded-2xl border border-surface-container bg-surface-container-lowest p-2 shadow-card" aria-label="Điều hướng quản trị"><div className="flex gap-1 overflow-x-auto lg:block">{tabs.map((item) => <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-label-md lg:mb-1 lg:w-full ${tab === item.id ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'}`}><Icon name={item.icon} className="text-[20px]" />{item.label}</button>)}</div></nav><div className="min-w-0">{tab === 'overview' && <Overview />}{tab === 'courses' && <CourseManager csrfToken={session.csrf_token} />}{tab === 'lessons' && <LessonManager csrfToken={session.csrf_token} />}{tab === 'signs' && <SignManager csrfToken={session.csrf_token} />}{tab === 'media' && <MediaManager csrfToken={session.csrf_token} />}{tab === 'users' && <UserManager csrfToken={session.csrf_token} currentUserId={session.user.id} />}</div></div></div>;
}

function Overview() {
  const { data, loading, error, refresh } = useAdminResource<AdminOverview>('/admin/overview');
  if (loading) return <p role="status" className="rounded-2xl bg-surface-container-lowest p-8 text-body-sm text-on-surface-variant">Đang tải tổng quan...</p>;
  if (error || !data) return <section className="rounded-2xl border border-surface-container bg-surface-container-lowest p-7"><p role="alert" className="text-body-sm text-error">{error || 'Không thể tải tổng quan.'}</p><button type="button" onClick={refresh} className="mt-4 rounded-lg bg-primary px-4 py-2 text-label-md text-on-primary">Thử lại</button></section>;
  return <section aria-labelledby="overview-title"><h2 id="overview-title" className="text-headline-lg">Tổng quan nội dung</h2><p className="mt-1 text-body-sm text-on-surface-variant">Số lượng hiện có trong hệ thống.</p><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Khóa học" value={String(data.courses)} detail="Đang quản lý" icon="school" /><StatCard label="Bài học" value={String(data.lessons)} detail="Đang quản lý" icon="play_lesson" /><StatCard label="Ký hiệu" value={String(data.signs)} detail="Trong từ điển" icon="sign_language" /><StatCard label="Người dùng" value={String(data.users)} detail="Tài khoản" icon="group" /></div><div className="mt-6 rounded-2xl border border-surface-container bg-surface-container-lowest p-5 shadow-card"><h3 className="text-headline-sm">Bắt đầu quản lý</h3><p className="mt-2 text-body-sm text-on-surface-variant">Dùng thanh điều hướng để tạo nội dung trước, sau đó xuất bản khi đã kiểm tra video, nguồn và mô tả.</p></div></section>;
}
