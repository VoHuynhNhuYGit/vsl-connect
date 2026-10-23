import { FormEvent, useState } from 'react';
import { Icon } from '../ui/Icon';
import { GoogleAction, GoogleError } from '../auth/GoogleActions';
import { type AuthSession, login } from '../../services/adminApi';

type Props = { onSuccess: (session: AuthSession) => void };

export function AdminSignIn({ onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      onSuccess(await login(email, password));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể đăng nhập.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-md items-center px-4 py-10">
      <form onSubmit={submit} className="w-full rounded-3xl border border-surface-container bg-surface-container-lowest p-6 shadow-lift sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-container text-on-secondary-container"><Icon name="admin_panel_settings" className="text-[26px]" /></div>
        <p className="mt-5 text-label-sm uppercase tracking-[0.14em] text-primary">VSL Connect</p>
        <h1 className="mt-2 text-headline-xl">Đăng nhập quản trị</h1>
        <p className="mt-2 text-body-sm text-on-surface-variant">Sử dụng tài khoản đã được cấp quyền quản trị để tiếp tục.</p>
        <GoogleError />
        {error && <p role="alert" className="mt-5 rounded-xl bg-error-container px-4 py-3 text-body-sm text-error">{error}</p>}
        <label className="mt-6 block text-label-md">Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md" /></label>
        <label className="mt-4 block text-label-md">Mật khẩu<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md" /></label>
        <button disabled={submitting} type="submit" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-label-md text-on-primary disabled:cursor-not-allowed disabled:opacity-60"><Icon name="login" className="text-[18px]" />{submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
        <GoogleAction mode="admin" />
      </form>
    </div>
  );
}
