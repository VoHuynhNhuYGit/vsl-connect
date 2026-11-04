import { useState } from 'react';
import { apiRequest, unlinkGoogle, useAdminResource } from '../../services/adminApi';
import { Icon } from '../ui/Icon';

export function GoogleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.86c2.26-2.09 3.685-5.17 3.685-9.09z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.34 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
    </svg>
  );
}

export function GoogleSuccess() {
  const [visible, setVisible] = useState(() => {
    return new URLSearchParams(window.location.search).get('google_success') === '1';
  });

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('google_success');
    window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
  }

  return (
    <div role="status" className="mt-4 flex items-center justify-between rounded-2xl bg-secondary-container/40 p-3.5 text-on-secondary-container border border-secondary-container">
      <div className="flex items-center gap-2.5">
        <Icon name="check_circle" className="text-[20px] text-primary shrink-0" />
        <span className="text-body-sm font-medium">Đăng nhập / liên kết tài khoản Google thành công!</span>
      </div>
      <button type="button" onClick={dismiss} className="rounded-lg p-1 text-on-secondary-container/70 hover:bg-secondary-container hover:text-on-secondary-container transition-colors" aria-label="Đóng thông báo">
        <Icon name="close" className="text-[18px]" />
      </button>
    </div>
  );
}

export function GoogleError() {
  const [errorParam, setErrorParam] = useState(() => {
    return new URLSearchParams(window.location.search).get('google_error');
  });

  if (!errorParam) return null;

  function dismiss() {
    setErrorParam(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('google_error');
    window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
  }

  const message = errorParam === 'conflict'
    ? 'Email này đã có tài khoản hoặc tài khoản Google đã được liên kết với người dùng khác. Hãy đăng nhập bằng mật khẩu rồi liên kết Google trong mục tài khoản.'
    : errorParam === 'invalid'
      ? 'Phiên đăng nhập Google đã hết hạn hoặc không hợp lệ. Vui lòng thử lại.'
      : 'Đăng nhập Google không thành công hoặc đã bị hủy. Vui lòng thử lại.';

  return (
    <div role="alert" className="mt-4 flex items-start justify-between rounded-2xl bg-error-container p-3.5 text-error border border-error/20">
      <div className="flex items-start gap-2.5">
        <Icon name="error" className="text-[20px] shrink-0 mt-0.5" />
        <span className="text-body-sm">{message}</span>
      </div>
      <button type="button" onClick={dismiss} className="rounded-lg p-1 text-error/70 hover:bg-error-container hover:text-error shrink-0 transition-colors" aria-label="Đóng thông báo lỗi">
        <Icon name="close" className="text-[18px]" />
      </button>
    </div>
  );
}

export function GoogleAction({ mode, csrfToken, className = '' }: { mode: 'login' | 'admin' | 'link'; csrfToken?: string; className?: string }) {
  const { data, loading, error } = useAdminResource<{ configured: boolean }>('/auth/google/status');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    setMessage('');
    try {
      const result = mode === 'link'
        ? await apiRequest<{ url: string }>('/auth/google/link', { method: 'POST', csrfToken })
        : await apiRequest<{ url: string }>(`/auth/google/start?return_to=${mode}`);
      window.location.assign(result.url);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Không thể bắt đầu đăng nhập Google.');
      setBusy(false);
    }
  }

  const configured = data?.configured === true;
  const label = mode === 'link'
    ? 'Liên kết tài khoản Google'
    : mode === 'admin'
      ? 'Đăng nhập quản trị bằng Google'
      : 'Đăng nhập bằng Google';

  return (
    <div className={`mt-4 ${className}`}>
      <button
        type="button"
        onClick={start}
        disabled={busy || loading || !configured}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-label-md shadow-card transition-all hover:bg-surface-container-low hover:shadow-lift active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleIcon className="h-5 w-5 shrink-0" />
        <span>{busy ? 'Đang chuyển đến Google...' : label}</span>
      </button>
      {loading && <p className="mt-2 text-center text-body-sm text-on-surface-variant">Đang kiểm tra cấu hình Google...</p>}
      {!loading && !configured && <p className="mt-2 text-center text-body-sm text-on-surface-variant">Đăng nhập Google chưa được cấu hình trên máy chủ.</p>}
      {error && <p role="alert" className="mt-2 text-center text-body-sm text-error">Không thể kiểm tra cấu hình Google.</p>}
      {message && <p role="alert" className="mt-2 text-center text-body-sm text-error">{message}</p>}
    </div>
  );
}

export function GoogleAccountCard({
  isGoogleLinked,
  csrfToken,
  onStatusChange,
}: {
  isGoogleLinked: boolean;
  csrfToken: string;
  onStatusChange?: (linked: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function handleUnlink() {
    if (!window.confirm('Bạn có chắc chắn muốn huỷ liên kết tài khoản Google không?')) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await unlinkGoogle(csrfToken);
      setNotice(res.detail || 'Đã huỷ liên kết Google.');
      onStatusChange?.(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể huỷ liên kết Google.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-surface-container bg-surface-container-lowest p-4 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-low border border-outline-variant/30">
            <GoogleIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-label-md text-on-surface">Tài khoản Google</p>
            <p className="text-body-sm text-on-surface-variant flex items-center gap-1.5 mt-0.5">
              {isGoogleLinked ? (
                <>
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span className="text-primary font-medium">Đã liên kết</span>
                </>
              ) : (
                <>
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-500"></span>
                  <span>Chưa liên kết</span>
                </>
              )}
            </p>
          </div>
        </div>
        {isGoogleLinked && (
          <button
            type="button"
            disabled={busy}
            onClick={handleUnlink}
            className="rounded-lg border border-outline-variant px-3 py-1.5 text-label-sm text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-60"
          >
            {busy ? 'Đang huỷ...' : 'Huỷ liên kết'}
          </button>
        )}
      </div>

      {!isGoogleLinked && (
        <GoogleAction mode="link" csrfToken={csrfToken} />
      )}

      {notice && <p className="mt-3 text-body-sm text-primary">{notice}</p>}
      {error && <p role="alert" className="mt-3 text-body-sm text-error">{error}</p>}
    </div>
  );
}
