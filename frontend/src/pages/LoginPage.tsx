import { FormEvent, useEffect, useState } from 'react';
import { GoogleAction, GoogleError } from '../components/auth/GoogleActions';
import { ApiError, type AuthSession, getSession, login, logout } from '../services/adminApi';

export function LoginPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { getSession().then(setSession).catch((err: unknown) => { if (!(err instanceof ApiError && err.status === 401)) setError('Không thể kiểm tra phiên đăng nhập.'); }).finally(() => setLoading(false)); }, []);

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
  if (loading) return <p role="status" className="mx-auto max-w-md p-8">Đang kiểm tra phiên đăng nhập...</p>;
  return <div className="mx-auto max-w-md px-4 py-12"><section className="rounded-3xl border border-surface-container bg-surface-container-lowest p-6 shadow-lift sm:p-8"><h1 className="text-headline-xl">{session ? 'Tài khoản của bạn' : 'Đăng nhập'}</h1><GoogleError />{error && <p role="alert" className="mt-4 rounded-xl bg-error-container p-3 text-error">{error}</p>}{session ? <><p className="mt-4 text-body-md">{session.user.display_name}</p><p className="mt-1 text-body-sm text-on-surface-variant">{session.user.email}</p><GoogleAction mode="link" csrfToken={session.csrf_token} /><button type="button" onClick={signOut} className="mt-4 w-full rounded-xl bg-primary p-3 text-label-md text-on-primary">Đăng xuất</button></> : <form onSubmit={submit}><label className="mt-6 block text-label-md">Email<input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-outline-variant px-3 py-2.5" /></label><label className="mt-4 block text-label-md">Mật khẩu<input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-outline-variant px-3 py-2.5" /></label><button disabled={busy} type="submit" className="mt-6 w-full rounded-xl bg-primary p-3 text-label-md text-on-primary disabled:opacity-60">{busy ? 'Đang đăng nhập...' : 'Đăng nhập'}</button><GoogleAction mode="login" /></form>}</section></div>;
}
