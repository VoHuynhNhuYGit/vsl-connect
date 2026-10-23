import { useState } from 'react';
import { apiRequest, useAdminResource } from '../../services/adminApi';

export function GoogleError() {
  const error = new URLSearchParams(window.location.search).get('google_error');
  if (!error) return null;
  const message = error === 'conflict' ? 'Email này đã có tài khoản hoặc tài khoản Google đã được liên kết. Hãy đăng nhập bằng mật khẩu và liên kết Google trong tài khoản.' : 'Đăng nhập Google không thành công hoặc đã bị hủy. Vui lòng thử lại.';
  return <p role="alert" className="mt-4 rounded-xl bg-error-container px-4 py-3 text-body-sm text-error">{message}</p>;
}

export function GoogleAction({ mode, csrfToken }: { mode: 'login' | 'admin' | 'link'; csrfToken?: string }) {
  const { data } = useAdminResource<{ configured: boolean }>('/auth/google/status');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true); setMessage('');
    try {
      const result = mode === 'link'
        ? await apiRequest<{ url: string }>('/auth/google/link', { method: 'POST', csrfToken })
        : await apiRequest<{ url: string }>(`/auth/google/start?return_to=${mode}`);
      window.location.assign(result.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể bắt đầu đăng nhập Google.');
      setBusy(false);
    }
  }

  if (!data) return null;
  if (!data.configured) return <p className="mt-4 text-body-sm text-on-surface-variant">Đăng nhập Google chưa được cấu hình.</p>;
  return <div className="mt-4"><button type="button" onClick={start} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-label-md disabled:opacity-60"><span aria-hidden="true" className="font-bold text-primary">G</span>{busy ? 'Đang chuyển đến Google...' : mode === 'link' ? 'Liên kết tài khoản Google' : 'Tiếp tục với Google'}</button>{message && <p role="alert" className="mt-2 text-body-sm text-error">{message}</p>}</div>;
}
