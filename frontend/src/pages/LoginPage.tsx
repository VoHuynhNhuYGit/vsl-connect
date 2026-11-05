import { FormEvent, useEffect, useState } from 'react';
import { GoogleAction, GoogleError } from '../components/auth/GoogleActions';
import { ApiError, type AuthSession, getSession, login, logout } from '../services/adminApi';

const inputClass = 'mt-2.5 min-h-12 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-[15px] leading-6 text-gray-900 caret-emerald-700 placeholder:text-gray-500 shadow-inner shadow-black/5 transition-all placeholder:opacity-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700/80 dark:bg-slate-800/60 dark:text-white dark:caret-emerald-300 dark:placeholder:text-slate-400 dark:shadow-black/10';

export function LoginPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSession()
      .then(setSession)
      .catch((err: unknown) => { if (!(err instanceof ApiError && err.status === 401)) setError('Không thể kiểm tra phiên đăng nhập.'); })
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try { setSession(await login(email, password)); setPassword(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'Không thể đăng nhập.'); }
    finally { setBusy(false); }
  }

  async function signOut() {
    if (!session) return;
    try { await logout(session.csrf_token); setSession(null); }
    catch { setError('Không thể đăng xuất. Vui lòng thử lại.'); }
  }

  if (loading) return <div role="status" className="mx-auto flex min-h-[60vh] max-w-md items-center px-4"><div className="w-full animate-pulse rounded-3xl border border-gray-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/80"><span className="sr-only">Đang kiểm tra phiên đăng nhập...</span><div className="h-7 w-2/3 rounded bg-gray-200 dark:bg-slate-800" /><div className="mt-6 h-12 rounded-xl bg-gray-200 dark:bg-slate-800" /><div className="mt-4 h-12 rounded-xl bg-gray-200 dark:bg-slate-800" /><div className="mt-6 h-12 rounded-xl bg-gray-200 dark:bg-slate-800" /></div></div>;

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-surface-app px-4 py-10 font-sans sm:py-14">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.08] blur-[110px]" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-teal-500/[0.05] blur-[90px]" />
      </div>
      <section className="w-full max-w-md rounded-3xl border border-gray-200 bg-white/95 p-6 shadow-[0_28px_90px_-36px_rgba(15,23,42,0.22)] backdrop-blur-xl dark:border-slate-800/90 dark:bg-slate-900/90 dark:shadow-[0_28px_90px_-36px_rgba(0,0,0,0.9)] sm:p-8">
        <div className="mb-7">
          <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20"><span aria-hidden="true" className="material-symbols-outlined text-[25px]">sign_language</span></span>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-800 dark:text-emerald-300">VSL Connect</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-[28px]">{session ? 'Tài khoản của bạn' : 'Chào mừng trở lại'}</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-300">{session ? 'Quản lý kết nối và thông tin tài khoản.' : 'Đăng nhập để tiếp tục hành trình học ngôn ngữ ký hiệu.'}</p>
        </div>

        <GoogleError />
        {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-relaxed text-red-800 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">{error}</p>}

        {session ? <div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-800 dark:bg-slate-800/40"><p className="font-semibold text-gray-900 dark:text-white">{session.user.display_name}</p><p className="mt-1 text-sm text-gray-600 dark:text-slate-300">{session.user.email}</p></div>
          <GoogleAction mode="link" csrfToken={session.csrf_token} />
          <button type="button" onClick={signOut} className="mt-4 min-h-12 w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-800 transition-all hover:border-gray-400 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800">Đăng xuất</button>
        </div> : <form onSubmit={submit}>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ban@example.com" className={inputClass} /></label>
          <label className="mt-5 block text-sm font-medium text-gray-700 dark:text-slate-200">Mật khẩu<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu" className={inputClass} /></label>
          <button disabled={busy} type="submit" className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/25 transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 dark:focus-visible:ring-offset-slate-900">{busy ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
          <GoogleAction mode="login" />
        </form>}
      </section>
    </main>
  );
}
