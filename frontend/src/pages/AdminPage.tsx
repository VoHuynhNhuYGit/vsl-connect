import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from 'react';
import vslLogo from '../assets/vsl-connect-logo.png';
import { AdminSignIn } from '../components/admin/AdminSignIn';
import { CourseManager } from '../components/admin/CourseManager';
import { LessonManager } from '../components/admin/LessonManager';
import { SignManager } from '../components/admin/SignManager';
import { UserManager } from '../components/admin/UserManager';
import { MediaManager } from '../components/admin/MediaUpload';
import { AdminSettings } from '../components/admin/AdminSettings';
import { SystemLog } from '../components/admin/SystemLog';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { Icon } from '../components/ui/Icon';
import { StatCard } from '../components/ui/StatCard';
import { ApiError, type AdminCourse, type AdminOverview, type AdminUser, type AuthSession, getSession, logout, useAdminResource } from '../services/adminApi';

type Tab = 'overview' | 'courses' | 'lessons' | 'signs' | 'media' | 'users' | 'settings' | 'system';
type CreateTarget = 'courses' | 'lessons' | 'signs' | 'users';
type RecentItem = { id: string; kind: 'course' | 'user'; label: string; createdAt: string };

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Tổng quan', icon: 'home' },
  { id: 'courses', label: 'Khóa học', icon: 'school' },
  { id: 'lessons', label: 'Bài học', icon: 'play_circle' },
  { id: 'signs', label: 'Ký hiệu', icon: 'sign_language' },
  { id: 'media', label: 'Hình ảnh & video', icon: 'perm_media' },
  { id: 'users', label: 'Người dùng', icon: 'group' },
  { id: 'settings', label: 'Cài đặt', icon: 'settings' },
  { id: 'system', label: 'Hệ thống', icon: 'monitoring' },
];

const quickActions: { tab: Tab; label: string; icon: string }[] = [
  { tab: 'courses', label: 'Thêm khóa', icon: 'add' },
  { tab: 'lessons', label: 'Thêm bài', icon: 'play_circle' },
  { tab: 'signs', label: 'Thêm ký hiệu', icon: 'sign_language' },
  { tab: 'media', label: 'Tải lên', icon: 'upload_file' },
  { tab: 'users', label: 'Thêm người dùng', icon: 'person_add' },
];

type SearchItem = { id: string; label: string; description: string; icon: string; tab: Tab; openCreate?: boolean; keywords: string };

const searchItems: SearchItem[] = [
  { id: 'overview', label: 'Tổng quan', description: 'Xem bảng điều khiển', icon: 'home', tab: 'overview', keywords: 'trang chu dashboard tong quan' },
  { id: 'courses', label: 'Khóa học', description: 'Quản lý khóa học', icon: 'school', tab: 'courses', keywords: 'khoa hoc quan ly course' },
  { id: 'create-course', label: 'Thêm khóa học', description: 'Mở biểu mẫu tạo khóa học', icon: 'add', tab: 'courses', openCreate: true, keywords: 'them tao khoa hoc moi course' },
  { id: 'lessons', label: 'Bài học', description: 'Quản lý bài học', icon: 'play_circle', tab: 'lessons', keywords: 'bai hoc quan ly lesson' },
  { id: 'create-lesson', label: 'Thêm bài học', description: 'Mở biểu mẫu tạo bài học', icon: 'add', tab: 'lessons', openCreate: true, keywords: 'them tao bai hoc moi lesson' },
  { id: 'signs', label: 'Ký hiệu', description: 'Quản lý ký hiệu', icon: 'sign_language', tab: 'signs', keywords: 'ky hieu quan ly tu dien sign' },
  { id: 'create-sign', label: 'Thêm ký hiệu', description: 'Mở biểu mẫu tạo ký hiệu', icon: 'add', tab: 'signs', openCreate: true, keywords: 'them tao ky hieu moi sign' },
  { id: 'media', label: 'Hình ảnh & video', description: 'Tải lên và quản lý media', icon: 'perm_media', tab: 'media', keywords: 'hinh anh video tai len media upload' },
  { id: 'users', label: 'Người dùng', description: 'Quản lý tài khoản', icon: 'group', tab: 'users', keywords: 'nguoi dung tai khoan user' },
  { id: 'create-user', label: 'Thêm người dùng', description: 'Mở biểu mẫu tạo tài khoản', icon: 'person_add', tab: 'users', openCreate: true, keywords: 'them tao nguoi dung tai khoan user' },
  { id: 'settings', label: 'Cài đặt', description: 'Tùy chỉnh giao diện quản trị', icon: 'settings', tab: 'settings', keywords: 'cai dat giao dien tuy chinh setting' },
  { id: 'system', label: 'Hệ thống', description: 'Xem nhật ký thay đổi', icon: 'monitoring', tab: 'system', keywords: 'he thong nhat ky log thay doi audit' },
];

function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLocaleLowerCase('vi-VN').trim();
}

function findSearchItems(value: string) {
  const query = normalizeSearch(value);
  if (!query) return [];
  return searchItems.filter((item) => normalizeSearch(`${item.label} ${item.description} ${item.keywords}`).includes(query)).slice(0, 7);
}

function tabFromUrl(): Tab {
  const candidate = new URLSearchParams(window.location.search).get('tab');
  return tabs.some((item) => item.id === candidate) ? candidate as Tab : 'overview';
}

function createTargetFromUrl(): CreateTarget | null {
  const candidate = new URLSearchParams(window.location.search).get('create');
  return candidate === 'courses' || candidate === 'lessons' || candidate === 'signs' || candidate === 'users' ? candidate : null;
}

function isCreateTarget(tab: Tab): tab is CreateTarget {
  return tab === 'courses' || tab === 'lessons' || tab === 'signs' || tab === 'users';
}

export function AdminPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState<Tab>(tabFromUrl);
  const [createTarget, setCreateTarget] = useState<CreateTarget | null>(createTargetFromUrl);
  const [query, setQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    getSession().then(setSession).catch((error: unknown) => {
      if (!(error instanceof ApiError && error.status === 401)) setMessage(error instanceof Error ? error.message : 'Không thể kiểm tra phiên đăng nhập.');
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const syncTabWithUrl = () => { setTab(tabFromUrl()); setCreateTarget(createTargetFromUrl()); };
    window.addEventListener('popstate', syncTabWithUrl);
    return () => window.removeEventListener('popstate', syncTabWithUrl);
  }, []);

  function selectTab(nextTab: Tab, options: { openCreate?: boolean } = {}) {
    const url = new URL(window.location.href);
    if (nextTab === 'overview') url.searchParams.delete('tab');
    else url.searchParams.set('tab', nextTab);
    const nextCreateTarget = options.openCreate && isCreateTarget(nextTab) ? nextTab : null;
    if (nextCreateTarget) url.searchParams.set('create', nextCreateTarget);
    else url.searchParams.delete('create');
    window.history.pushState({}, '', url);
    setTab(nextTab);
    setCreateTarget(nextCreateTarget);
    setMessage('');
  }

  function closeCreateDialog() {
    const url = new URL(window.location.href);
    url.searchParams.delete('create');
    window.history.replaceState({}, '', url);
    setCreateTarget(null);
  }

  async function signOut(csrfToken: string) {
    try { await logout(csrfToken); } finally { setSession(null); setTab('overview'); }
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const match = findSearchItems(query)[0];
    if (match) { selectTab(match.tab, { openCreate: match.openCreate }); setQuery(''); return; }
    setMessage('Không tìm thấy mục phù hợp.');
  }

  function selectSearchItem(item: SearchItem) {
    selectTab(item.tab, { openCreate: item.openCreate });
    setQuery('');
  }

  if (loading) return <div role="status" className="mx-auto max-w-[1600px] px-5 py-16 text-body-md text-on-surface-variant sm:px-8">Đang tải...</div>;
  if (!session) return <AdminSignIn onSuccess={setSession} />;
  if (session.user.role !== 'admin') return <div className="mx-auto max-w-xl px-4 py-14 sm:px-6"><section className="rounded-3xl border border-surface-container bg-surface-container-lowest p-8 text-center shadow-card"><span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-error-container text-error"><Icon name="lock" className="text-[28px]" /></span><h1 className="mt-5 text-headline-lg">Chưa có quyền quản trị</h1><button type="button" onClick={() => signOut(session.csrf_token)} className="mt-6 rounded-lg bg-primary px-4 py-2.5 text-label-md text-on-primary">Đăng xuất</button></section></div>;

  return <div className="admin-app min-h-screen">
    <AdminHeader
      displayName={session.user.display_name}
      query={query}
      onQueryChange={setQuery}
      onSearch={search}
      onSelectSuggestion={selectSearchItem}
      onGoHome={() => selectTab('overview')}
      onSignOut={() => signOut(session.csrf_token)}
    />
    <div className="admin-workspace mx-auto max-w-[1680px] px-4 py-5 sm:px-6 lg:px-7 lg:py-6">
      {message && <p role="alert" className="mb-4 rounded-xl bg-error-container px-4 py-3 text-body-sm text-error">{message}</p>}
      <div className={`grid gap-5 ${sidebarCollapsed ? 'lg:grid-cols-[5.25rem_minmax(0,1fr)]' : 'lg:grid-cols-[15.75rem_minmax(0,1fr)]'}`}>
        <aside className="h-fit lg:sticky lg:top-5">
          <div className={`mb-4 flex h-20 items-center gap-3 rounded-[26px] bg-surface-container-lowest px-5 shadow-card ${sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`}>
            <button type="button" onClick={() => setSidebarCollapsed((collapsed) => !collapsed)} aria-expanded={!sidebarCollapsed} aria-label={sidebarCollapsed ? 'Mở rộng danh sách chức năng' : 'Thu gọn danh sách chức năng'} className="rounded-lg p-1 text-on-surface outline-none transition-colors hover:bg-surface-container focus-visible:ring-2 focus-visible:ring-primary"><Icon name="menu" className="text-[27px]" /></button>
            <span className={`bg-gradient-to-r from-primary via-primary to-primary/75 bg-clip-text text-headline-lg text-transparent ${sidebarCollapsed ? 'lg:hidden' : ''}`}>Quản trị</span>
          </div>
          <nav className="admin-sidebar relative rounded-[24px] bg-transparent p-1" aria-label="Điều hướng quản trị">
            <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible">
              {tabs.map((item) => <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item.id)}
                aria-current={tab === item.id ? 'page' : undefined}
                className={`relative flex h-14 shrink-0 items-center gap-3 rounded-xl px-4 pr-12 text-left text-label-md transition-all duration-300 ${sidebarCollapsed ? 'lg:w-14 lg:justify-center lg:px-0 lg:pr-0' : 'lg:w-full'} ${tab === item.id ? 'bg-primary text-white shadow-glow' : 'bg-surface-container-lowest text-on-surface hover:bg-secondary-container hover:text-on-secondary-container'}`}
              ><span className={`flex h-8 w-8 items-center justify-center rounded-full border ${tab === item.id ? 'border-white/70 bg-white/15' : 'border-primary/50 text-primary'}`}><Icon name={item.icon} className="text-[20px]" /></span><span className={sidebarCollapsed ? 'lg:sr-only' : ''}>{item.label}</span><span aria-hidden="true" className={`absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-surface-app bg-secondary transition-colors duration-300 lg:-right-3 ${tab === item.id ? 'bg-primary lg:opacity-0' : ''}`} /></button>)}
            </div>
            <span
              aria-hidden="true"
              className="admin-sidebar-active-dot hidden lg:block"
              style={{ transform: `translateY(${tabs.findIndex((item) => item.id === tab) * 4}rem)` }}
            />
          </nav>
        </aside>

        <main className="min-w-0">
          <div key={tab} className="admin-view-panel">
            {tab === 'overview' && <Overview userName={session.user.display_name} onSelect={selectTab} onQuickAction={(nextTab) => selectTab(nextTab, { openCreate: isCreateTarget(nextTab) })} />}
            {tab === 'courses' && <CourseManager csrfToken={session.csrf_token} openCreate={createTarget === 'courses'} onDialogClosed={closeCreateDialog} />}
            {tab === 'lessons' && <LessonManager csrfToken={session.csrf_token} openCreate={createTarget === 'lessons'} onDialogClosed={closeCreateDialog} />}
            {tab === 'signs' && <SignManager csrfToken={session.csrf_token} openCreate={createTarget === 'signs'} onDialogClosed={closeCreateDialog} />}
            {tab === 'media' && <MediaManager csrfToken={session.csrf_token} />}
            {tab === 'users' && <UserManager csrfToken={session.csrf_token} currentUserId={session.user.id} openCreate={createTarget === 'users'} onDialogClosed={closeCreateDialog} />}
            {tab === 'settings' && <AdminSettings />}
            {tab === 'system' && <SystemLog />}
          </div>
        </main>
      </div>
    </div>
  </div>;
}

function AdminHeader({ displayName, query, onQueryChange, onSearch, onSelectSuggestion, onGoHome, onSignOut }: { displayName: string; query: string; onQueryChange: (value: string) => void; onSearch: (event: FormEvent<HTMLFormElement>) => void; onSelectSuggestion: (item: SearchItem) => void; onGoHome: () => void; onSignOut: () => void }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const suggestions = findSearchItems(query);

  function selectSuggestion(item: SearchItem) {
    onSelectSuggestion(item);
    setShowSuggestions(false);
    setActiveIndex(0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!suggestions.length) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setShowSuggestions(true); setActiveIndex((value) => (value + 1) % suggestions.length); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setShowSuggestions(true); setActiveIndex((value) => (value - 1 + suggestions.length) % suggestions.length); }
    if (event.key === 'Escape') { setShowSuggestions(false); }
    if (event.key === 'Enter' && showSuggestions) { event.preventDefault(); selectSuggestion(suggestions[activeIndex] ?? suggestions[0]); }
  }

  return <header className="sticky top-0 z-40 border-b border-white/80 bg-surface-container-lowest/90 shadow-[0_1px_16px_rgba(5,150,105,0.06)] backdrop-blur-xl">
    <div className="mx-auto flex h-20 max-w-[1680px] items-center gap-4 px-4 sm:px-6 lg:px-7">
      <button type="button" onClick={onGoHome} className="flex shrink-0 items-center gap-2.5 rounded-xl text-left outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary" aria-label="Về trang tổng quan quản trị"><img src={vslLogo} alt="VSL Connect" className="h-12 w-12 object-contain" /><span className="hidden leading-tight sm:block"><strong className="block text-[19px] tracking-[-0.035em]">VSL Connect</strong><small className="text-label-sm text-on-surface-variant">Quản trị</small></span></button>
      <form onSubmit={onSearch} className="relative z-50 hidden max-w-[27rem] flex-1 md:block"><Icon name="search" className="pointer-events-none absolute left-4 top-[1.4rem] -translate-y-1/2 text-[24px] text-on-surface" /><input type="search" role="combobox" aria-autocomplete="list" aria-expanded={showSuggestions && suggestions.length > 0} aria-controls="admin-search-suggestions" aria-activedescendant={showSuggestions && suggestions[activeIndex] ? `admin-search-${suggestions[activeIndex].id}` : undefined} value={query} onFocus={() => { if (suggestions.length) setShowSuggestions(true); }} onBlur={() => setShowSuggestions(false)} onKeyDown={handleKeyDown} onChange={(event) => { onQueryChange(event.target.value); setShowSuggestions(true); setActiveIndex(0); }} placeholder="Tìm chức năng hoặc nhập “thêm...”" className="h-11 w-full rounded-full border-0 bg-secondary-container/50 py-2 pl-12 pr-4 text-body-md text-on-surface outline-none placeholder:text-on-surface-variant focus:ring-2 focus:ring-primary" />{showSuggestions && suggestions.length > 0 && <ul id="admin-search-suggestions" role="listbox" className="absolute left-0 right-0 top-[calc(100%+0.5rem)] overflow-hidden rounded-2xl border border-surface-container bg-surface-container-lowest p-1.5 shadow-modal">{suggestions.map((item, index) => <li key={item.id} id={`admin-search-${item.id}`} role="option" aria-selected={index === activeIndex}><button type="button" onMouseDown={(event) => { event.preventDefault(); selectSuggestion(item); }} className={`flex min-h-0 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${index === activeIndex ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface hover:bg-surface-container-low'}`}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary"><Icon name={item.icon} className="text-[18px]" /></span><span className="min-w-0"><span className="block text-label-md">{item.label}</span><span className="block truncate text-label-sm font-normal text-on-surface-variant">{item.description}</span></span>{item.openCreate && <span className="ml-auto rounded-full bg-surface-container px-2 py-1 text-label-sm text-on-surface-variant">Tạo mới</span>}</button></li>)}</ul>}</form>
      <div className="ml-auto flex items-center gap-2.5"><span title="Thông báo" className="relative hidden h-11 w-11 items-center justify-center rounded-full bg-surface-container text-on-surface sm:inline-flex"><Icon name="notifications" className="text-[23px]" /><span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-surface-container-lowest" /></span><ThemeToggle /><div className="relative"><button type="button" onClick={() => setUserMenuOpen((open) => !open)} aria-haspopup="menu" aria-expanded={userMenuOpen} aria-controls="admin-user-menu" className="flex items-center gap-2 rounded-xl px-1.5 py-1 text-left outline-none transition-colors hover:bg-surface-container-low focus-visible:ring-2 focus-visible:ring-primary"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary-container text-primary"><Icon name="person" className="text-[25px]" /></span><span className="hidden max-w-32 truncate text-label-md sm:block">{displayName}</span><Icon name="keyboard_arrow_down" className={`hidden text-[20px] transition-transform sm:block ${userMenuOpen ? 'rotate-180' : ''}`} /></button>{userMenuOpen && <div id="admin-user-menu" role="menu" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-48 overflow-hidden rounded-2xl border border-surface-container bg-surface-container-lowest p-1.5 shadow-modal"><button type="button" role="menuitem" onClick={() => { setUserMenuOpen(false); onSignOut(); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-label-md text-error transition-colors hover:bg-error-container"><Icon name="logout" className="text-[19px]" />Đăng xuất</button></div>}</div></div>
    </div>
  </header>;
}

function Overview({ userName, onSelect, onQuickAction }: { userName: string; onSelect: (tab: Tab) => void; onQuickAction: (tab: Tab) => void }) {
  const overview = useAdminResource<AdminOverview>('/admin/overview');
  const courses = useAdminResource<AdminCourse[]>('/admin/courses?limit=5&offset=0');
  const users = useAdminResource<AdminUser[]>('/admin/users?limit=5&offset=0');
  const recent = useMemo(() => latestItems(courses.data, users.data), [courses.data, users.data]);

  if (overview.loading) return <p role="status" className="rounded-3xl bg-surface-container-lowest p-8 text-body-sm text-on-surface-variant">Đang tải...</p>;
  if (overview.error || !overview.data) return <section className="rounded-3xl border border-surface-container bg-surface-container-lowest p-7"><p role="alert" className="text-body-sm text-error">{overview.error || 'Không thể tải dữ liệu.'}</p><button type="button" onClick={overview.refresh} className="mt-4 rounded-xl bg-primary px-4 py-2 text-label-md text-on-primary">Thử lại</button></section>;

  return <section aria-labelledby="overview-title">
    <h2 id="overview-title" className="sr-only">Tổng quan</h2>
    <div className="admin-hero relative mb-4 min-h-[8.5rem] overflow-hidden rounded-[24px] border border-white/70 px-6 py-5 shadow-lift sm:min-h-[10rem] sm:px-7">
      <h3 className="max-w-none text-[28px] font-bold tracking-[-0.04em] sm:max-w-[58%] sm:text-[38px]">Chào mừng trở lại, {userName}!</h3>
      <p className="mt-2 max-w-none text-body-md text-on-surface-variant sm:max-w-[54%] sm:text-[16px] sm:leading-6">Quản trị nội dung học tập trên VSL Connect</p>
      <HeroArtwork />
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Khóa học" value={String(overview.data.courses)} icon="school" onClick={() => onSelect('courses')} />
      <StatCard label="Bài học" value={String(overview.data.lessons)} icon="play_lesson" onClick={() => onSelect('lessons')} />
      <StatCard label="Ký hiệu" value={String(overview.data.signs)} icon="sign_language" onClick={() => onSelect('signs')} />
      <StatCard label="Người dùng" value={String(overview.data.users)} icon="group" onClick={() => onSelect('users')} />
    </div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.85fr)]">
      <OverviewChart overview={overview.data} />
      <RecentActivity entries={recent} loading={courses.loading || users.loading} />
    </div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.85fr)]">
      <section className="rounded-[24px] border border-white/80 bg-surface-container-lowest p-3 shadow-card"><h3 className="mb-2 px-1 text-headline-sm">Thao tác nhanh</h3><div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{quickActions.map((item) => <button key={item.tab} type="button" onClick={() => onQuickAction(item.tab)} className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl bg-surface-container-low px-2 text-label-sm text-on-surface transition hover:bg-secondary-container hover:text-on-secondary-container"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container"><Icon name={item.icon} className="text-[20px]" /></span><span className="text-center">{item.label}</span></button>)}</div></section>
      <LatestUpdate entry={recent[0]} loading={courses.loading || users.loading} />
    </div>
  </section>;
}

function HeroArtwork() {
  return <div aria-hidden="true" className="absolute bottom-0 right-3 hidden h-full w-[43%] overflow-hidden sm:block"><span className="absolute -bottom-16 -right-8 h-52 w-52 rounded-full bg-secondary-container/70" /><span className="absolute bottom-6 right-12 flex h-20 w-32 items-center justify-center rounded-xl border-4 border-primary bg-surface-container-lowest shadow-lift"><Icon name="play_arrow" className="text-[42px] text-primary" /></span><span className="absolute bottom-5 right-44 h-3 w-20 rounded-full bg-primary/80" /><span className="absolute bottom-11 right-44 h-3 w-16 rounded-full bg-secondary" /><span className="absolute right-8 top-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-white shadow-card"><Icon name="sign_language" className="text-[31px]" /></span><Icon name="school" className="absolute bottom-0 right-28 text-[76px] text-primary/90" /></div>;
}

function OverviewChart({ overview }: { overview: AdminOverview }) {
  const values = [overview.courses, overview.lessons, overview.signs, overview.users];
  const max = Math.max(...values, 1);
  const labels = ['Khóa', 'Bài', 'Ký hiệu', 'Người dùng'];
  return <section className="rounded-[24px] border border-white/80 bg-surface-container-lowest p-4 shadow-card" aria-labelledby="chart-title"><div className="mb-3 flex items-center justify-between"><h3 id="chart-title" className="text-headline-sm">Tổng quan nội dung</h3><Icon name="insights" className="text-[21px] text-primary" /></div><div className="flex h-36 items-end justify-around gap-2 border-b border-surface-container px-2 pb-2">{values.map((value, index) => <div key={labels[index]} className="flex h-full flex-1 flex-col justify-end gap-1.5"><div className="mx-auto w-full max-w-10 rounded-t-xl bg-primary" style={{ height: `${Math.max(12, (value / max) * 100)}%`, opacity: 0.46 + index * 0.16 }} /><span className="truncate text-center text-label-sm text-on-surface-variant" title={labels[index]}>{labels[index]}</span></div>)}</div></section>;
}

function RecentActivity({ entries, loading }: { entries: RecentItem[]; loading: boolean }) {
  return <section className="rounded-[24px] border border-white/80 bg-surface-container-lowest p-4 shadow-card" aria-labelledby="activity-title"><h3 id="activity-title" className="mb-2 text-headline-sm">Hoạt động gần đây</h3>{loading ? <p className="py-4 text-body-sm text-on-surface-variant">Đang tải...</p> : entries.length ? <div className="divide-y divide-surface-container">{entries.map((entry) => <RecentRow key={entry.id} entry={entry} />)}</div> : <p className="py-4 text-body-sm text-on-surface-variant">Chưa có dữ liệu.</p>}</section>;
}

function LatestUpdate({ entry, loading }: { entry: RecentItem | undefined; loading: boolean }) {
  return <section className="rounded-[24px] border border-white/80 bg-surface-container-lowest p-4 shadow-card" aria-labelledby="updates-title"><div className="mb-2 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container"><Icon name="campaign" className="text-[18px]" /></span><h3 id="updates-title" className="text-headline-sm">Cập nhật mới</h3></div>{loading ? <p className="py-2 text-body-sm text-on-surface-variant">Đang tải...</p> : entry ? <RecentRow entry={entry} /> : <p className="py-2 text-body-sm text-on-surface-variant">Chưa có dữ liệu.</p>}</section>;
}

function RecentRow({ entry }: { entry: RecentItem }) {
  const icon = entry.kind === 'course' ? 'school' : 'person_add';
  const label = entry.kind === 'course' ? 'Khóa học' : 'Người dùng';
  return <div className="flex items-center gap-3 py-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container"><Icon name={icon} className="text-[17px]" /></span><p className="min-w-0 flex-1 truncate text-body-sm text-on-surface"><span className="font-semibold">{label}</span> · {entry.label}</p><time className="shrink-0 text-label-sm text-on-surface-variant" dateTime={entry.createdAt}>{relativeTime(entry.createdAt)}</time></div>;
}

function latestItems(courses: AdminCourse[] | null, users: AdminUser[] | null): RecentItem[] {
  return [
    ...(courses ?? []).map((course) => ({ id: `course-${course.id}`, kind: 'course' as const, label: course.title, createdAt: course.created_at })),
    ...(users ?? []).map((user) => ({ id: `user-${user.id}`, kind: 'user' as const, label: user.display_name, createdAt: user.created_at })),
  ].sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()).slice(0, 5);
}

function relativeTime(value: string) {
  const elapsed = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) return 'vừa xong';
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes}p`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}g`;
  return `${Math.floor(hours / 24)}n`;
}
