import { FormEvent, useEffect, useState } from 'react';
import { GoogleAction, GoogleAccountCard, GoogleError, GoogleSuccess } from '../components/auth/GoogleActions';
import { ApiError, type AuthSession, getSession, login, logout, register } from '../services/adminApi';

export function LoginPage() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registering, setRegistering] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSession()
      .then(setSession)
      .catch((err: unknown) => {
        if (!(err instanceof ApiError && err.status === 401)) {
          setError('Không thể kiểm tra phiên đăng nhập.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (registering) {
        if (!displayName.trim()) {
          setError('Vui lòng nhập tên hiển thị.');
          return;
        }
        if (password !== confirmPassword) {
          setError('Mật khẩu xác nhận không khớp.');
          return;
        }
        const result = await register(displayName.trim(), email, password);
        setSuccess(result.detail);
        setRegistering(false);
        setConfirmPassword('');
      } else {
        setSession(await login(email, password));
        setSuccess('');
      }
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đăng nhập.');
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!session) return;
    try {
      await logout(session.csrf_token);
      setSession(null);
    } catch {
      setError('Không thể đăng xuất. Vui lòng thử lại.');
    }
  }

  if (loading) {
    return (
      <div role="status" className="mx-auto max-w-md p-12 text-center text-body-md text-on-surface-variant">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <section className="rounded-3xl border border-surface-container bg-surface-container-lowest p-6 shadow-lift sm:p-8">
        <h1 className="text-headline-xl">{session ? 'Tài khoản của bạn' : registering ? 'Đăng ký tài khoản' : 'Đăng nhập'}</h1>
        <GoogleSuccess />
        <GoogleError />
        {error && <p role="alert" className="mt-4 rounded-xl bg-error-container p-3 text-body-sm text-error">{error}</p>}
        {success && <p role="status" className="mt-4 rounded-xl bg-secondary-container p-3 text-body-sm text-on-secondary-container">{success}</p>}

        {session ? (
          <>
            <div className="mt-5 rounded-2xl bg-surface-container-low p-4">
              <p className="text-headline-sm text-on-surface">{session.user.display_name}</p>
              <p className="mt-1 text-body-sm text-on-surface-variant">{session.user.email}</p>
              <span className="mt-2 inline-block rounded-md bg-secondary-container px-2.5 py-0.5 text-label-sm text-on-secondary-container">
                {session.user.role === 'admin' ? 'Quản trị viên' : 'Học viên'}
              </span>
            </div>

            <GoogleAccountCard
              isGoogleLinked={Boolean(session.user.is_google_linked)}
              csrfToken={session.csrf_token}
              onStatusChange={(linked) => {
                setSession((prev) => (prev ? { ...prev, user: { ...prev.user, is_google_linked: linked } } : null));
              }}
            />

            <button
              type="button"
              onClick={signOut}
              className="mt-6 w-full rounded-xl bg-primary p-3 text-label-md text-on-primary shadow-card transition-colors hover:bg-primary-container"
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <form onSubmit={submit}>
            {registering && (
              <label className="mt-6 block text-label-md">
                Tên hiển thị
                <input required maxLength={120} autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md transition-colors focus:border-primary" />
              </label>
            )}
            <label className="mt-6 block text-label-md">
              Email
              <input
                required
                type="email"
                maxLength={320}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md transition-colors focus:border-primary"
              />
            </label>
            <label className="mt-4 block text-label-md">
              Mật khẩu
              <input
                required
                type="password"
                autoComplete={registering ? 'new-password' : 'current-password'}
                minLength={registering ? 12 : 1}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md transition-colors focus:border-primary"
              />
            </label>
            {registering && (
              <>
                <p className="mt-2 text-body-sm text-on-surface-variant">Mật khẩu cần từ 12 đến 128 ký tự.</p>
                <label className="mt-4 block text-label-md">
                  Xác nhận mật khẩu
                  <input required type="password" autoComplete="new-password" minLength={12} maxLength={128} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md transition-colors focus:border-primary" />
                </label>
              </>
            )}
            <button
              disabled={busy}
              type="submit"
              className="mt-6 w-full rounded-xl bg-primary p-3 text-label-md text-on-primary transition-colors hover:bg-primary-container disabled:opacity-60"
            >
              {busy ? (registering ? 'Đang đăng ký...' : 'Đang đăng nhập...') : (registering ? 'Đăng ký' : 'Đăng nhập')}
            </button>

            <p className="mt-4 text-center text-body-sm text-on-surface-variant">
              {registering ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
              <button type="button" disabled={busy} onClick={() => { setRegistering(!registering); setError(''); setSuccess(''); setPassword(''); setConfirmPassword(''); }} className="text-primary underline disabled:opacity-60">
                {registering ? 'Đăng nhập' : 'Đăng ký'}
              </button>
            </p>

            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-container" />
              </div>
              <span className="relative bg-surface-container-lowest px-3 text-label-sm text-on-surface-variant">hoặc</span>
            </div>

            <GoogleAction mode="login" />
          </form>
        )}
      </section>
    </div>
  );
}
