import { useState } from 'react';
import { GoogleAction, GoogleIcon } from '../../components/auth/GoogleActions';
import { unlinkGoogle, type AuthSession } from '../../services/adminApi';
import { GoogleVerification } from './GoogleVerification';

export function GoogleAccountSettings({ session, onSaved }: { session: AuthSession; onSaved: (session: AuthSession) => void }) {
  const [pending, setPending] = useState(false); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [password, setPassword] = useState('');
  if (pending) return <GoogleVerification onVerified={updated => { onSaved(updated); setPending(false); setNotice('Đã xác thực và cập nhật liên kết Google.'); }} onCancel={() => setPending(false)} />;
  async function unlink() {
    if (session.user.password_enabled === false) { setError('Hãy đặt mật khẩu bằng mã email trước khi hủy liên kết Google.'); return; }
    if (!password) { setError('Nhập mật khẩu hiện tại để hủy liên kết Google.'); return; }
    setBusy(true); setError(''); setNotice('');
    try { await unlinkGoogle(session.csrf_token, password); setPassword(''); setPending(true); }
    catch (err) { setError(err instanceof Error ? err.message : 'Không thể yêu cầu hủy liên kết.'); } finally { setBusy(false); }
  }
  return <section className="account-card" aria-labelledby="account-google-title">
    <div className="account-card-heading"><span><GoogleIcon /></span><div><h2 id="account-google-title">Tài khoản Google</h2><p>{session.user.is_google_linked ? session.user.google_email || 'Đã liên kết Google' : 'Chưa liên kết Google'}</p></div></div>
    <p className="account-field-hint">Đăng nhập nhanh qua Google. Liên kết, thay đổi hoặc hủy liên kết đều cần mã xác thực qua email.</p>
    <GoogleAction mode="link" csrfToken={session.csrf_token} label={session.user.is_google_linked ? 'Đổi tài khoản Google liên kết' : undefined} />
    {session.user.is_google_linked && <><div className="account-form"><label>Mật khẩu hiện tại để hủy liên kết<input type="password" autoComplete="current-password" maxLength={128} value={password} onChange={event => setPassword(event.target.value)} /></label></div><p className="account-field-hint">Khi hủy Google, cần có mật khẩu để tiếp tục đăng nhập. Nếu chưa đặt mật khẩu, hãy xác thực bằng mã email trong mục mật khẩu.</p><button type="button" className="account-text-button" onClick={unlink} disabled={busy}>{busy ? 'Đang gửi mã…' : 'Hủy liên kết bằng mã xác thực'}</button></>}
    {notice && <p role="status" className="account-message">{notice}</p>}{error && <p role="alert" className="account-message account-message--error">{error}</p>}
  </section>;
}
