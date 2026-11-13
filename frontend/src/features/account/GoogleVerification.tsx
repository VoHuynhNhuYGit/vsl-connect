import { useEffect, useState, type FormEvent } from 'react';
import { apiRequest, verifyGoogle, type AuthSession } from '../../services/adminApi';
import { Icon } from '../../components/ui/Icon';
import './account.css';

type Pending = { purpose: string; email: string; google_email: string | null; csrf_token: string; expires_in: number; resend_after: number };
export function clearGooglePending() {
  const url = new URL(window.location.href); url.searchParams.delete('google_pending');
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
}

export function GoogleVerification({ onVerified, onCancel }: { onVerified: (session: AuthSession) => void; onCancel: () => void }) {
  const [pending, setPending] = useState<Pending | null>(null); const [loading, setLoading] = useState(true);
  const [code, setCode] = useState(''); const [googleCode, setGoogleCode] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true;
    apiRequest<Pending>('/auth/google/pending').then(result => { if (active) setPending(result); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Không thể tải yêu cầu xác thực.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setPending(value => value ? { ...value, expires_in: Math.max(0, value.expires_in - 1), resend_after: Math.max(0, value.resend_after - 1) } : value), 1000);
    return () => clearInterval(timer);
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!pending) return;
    setBusy(true); setError(''); setNotice('');
    try { const session = await verifyGoogle({ code, ...(pending.google_email ? { google_code: googleCode } : {}) }, pending.csrf_token); clearGooglePending(); onVerified(session); }
    catch (err) { setError(err instanceof Error ? err.message : 'Không thể xác thực.'); } finally { setBusy(false); }
  }
  async function resend() {
    if (!pending) return; setBusy(true); setError(''); setNotice('');
    try { const result = await apiRequest<{ detail: string }>('/auth/google/resend', { method: 'POST', csrfToken: pending.csrf_token }); setCode(''); setGoogleCode(''); setNotice(result.detail); setPending(await apiRequest<Pending>('/auth/google/pending')); }
    catch (err) { setError(err instanceof Error ? err.message : 'Không thể gửi lại mã.'); } finally { setBusy(false); }
  }
  async function cancel() {
    setBusy(true);
    try { if (pending) await apiRequest('/auth/google/cancel', { method: 'POST', csrfToken: pending.csrf_token }); }
    catch { /* Expired requests are already unusable. */ }
    finally { clearGooglePending(); onCancel(); setBusy(false); }
  }
  return <section className="account-card" aria-labelledby="google-verify-title">
    <div className="account-card-heading"><span><Icon name="verified_user" /></span><div><h2 id="google-verify-title">Xác thực tài khoản Google</h2><p>Nhập mã nhận qua email để hoàn tất yêu cầu.</p></div></div>
    {loading && <p role="status" className="account-field-hint">Đang tải yêu cầu xác thực…</p>}
    {pending && <form onSubmit={submit} className="account-form"><fieldset disabled={busy || pending.expires_in === 0}>
      <p className="account-field-hint">Mã đã được gửi đến <strong>{pending.email}</strong>. Kiểm tra cả thư rác. Còn {Math.floor(pending.expires_in / 60)}:{String(pending.expires_in % 60).padStart(2, '0')} phút.</p>
      <label>Mã xác thực email tài khoản<input required autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ''))} /></label>
      {pending.google_email && <><p className="account-field-hint">Nhập thêm mã được gửi riêng đến email Google mới: <strong>{pending.google_email}</strong>.</p><label>Mã xác thực email Google mới<input required inputMode="numeric" autoComplete="off" pattern="[0-9]{6}" maxLength={6} value={googleCode} onChange={event => setGoogleCode(event.target.value.replace(/\D/g, ''))} /></label></>}
      <button className="account-button" type="submit">{busy ? 'Đang xác thực…' : 'Xác nhận mã'}</button>
    </fieldset><button className="account-text-button" type="button" onClick={resend} disabled={busy || pending.resend_after > 0 || pending.expires_in === 0}>{pending.resend_after > 0 ? `Gửi lại sau ${pending.resend_after}s` : 'Gửi lại mã'}</button></form>}
    {pending?.expires_in === 0 && <p role="alert" className="account-message account-message--error">Yêu cầu đã hết hạn. Hãy đóng và bắt đầu lại.</p>}
    {error && <p role="alert" className="account-message account-message--error">{error}</p>}{notice && <p role="status" className="account-message">{notice}</p>}
    <button type="button" onClick={cancel} disabled={busy} className="account-text-button">Hủy xác thực</button>
  </section>;
}
