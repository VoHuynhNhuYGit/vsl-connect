import { useState, type FormEvent } from 'react';
import { apiRequest, changePassword, type AuthSession } from '../../services/adminApi';
import { Icon } from '../../components/ui/Icon';

export function PasswordSettings({ session, onSaved }: { session: AuthSession; onSaved: (session: AuthSession) => void }) {
  const [emailMode, setEmailMode] = useState(session.user.password_enabled === false);
  const [current, setCurrent] = useState(''); const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState('');
  const [code, setCode] = useState(''); const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  async function sendCode() {
    setBusy(true); setError(''); setNotice('');
    try { const result = await apiRequest<{ detail: string }>('/profile/password/code', { method: 'POST', csrfToken: session.csrf_token }); setSent(true); setCode(''); setNotice(result.detail); }
    catch (err) { setError(err instanceof Error ? err.message : 'Không thể gửi mã.'); } finally { setBusy(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setNotice('');
    if (password !== confirmation) { setError('Mật khẩu xác nhận không khớp.'); return; }
    setBusy(true);
    try {
      const updated = await changePassword({ new_password: password, ...(emailMode ? { code } : { current_password: current }) }, session.csrf_token);
      onSaved(updated); setCurrent(''); setPassword(''); setConfirmation(''); setCode(''); setSent(false); setEmailMode(false);
      setNotice('Đã cập nhật mật khẩu. Các phiên đăng nhập cũ đã hết hiệu lực.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Không thể đổi mật khẩu.'); } finally { setBusy(false); }
  }
  return <section className="account-card" aria-labelledby="account-password-title">
    <div className="account-card-heading"><span><Icon name="lock" /></span><div><h2 id="account-password-title">{session.user.password_enabled === false ? 'Đặt mật khẩu' : 'Đổi mật khẩu'}</h2><p>Xác thực trước khi cập nhật mật khẩu của bạn.</p></div></div>
    <form className="account-form" onSubmit={submit}><fieldset disabled={busy}>
      {session.user.password_enabled !== false && <label className="account-check"><input type="checkbox" checked={emailMode} onChange={event => { setEmailMode(event.target.checked); setCode(''); setSent(false); setError(''); setNotice(''); }} />Xác thực bằng mã email thay cho mật khẩu hiện tại</label>}
      {emailMode ? <><p className="account-field-hint">Mã sẽ được gửi đến email tài khoản. Có hiệu lực 10 phút, tối đa 5 lần thử.</p><button type="button" className="account-button account-button--quiet" onClick={sendCode}>{sent ? 'Yêu cầu mã mới' : 'Gửi mã xác thực'}</button>{sent && <label>Mã xác thực đổi mật khẩu<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ''))} /></label>}</>
        : <label>Mật khẩu hiện tại<input required type="password" autoComplete="current-password" maxLength={128} value={current} onChange={event => setCurrent(event.target.value)} /></label>}
      <label>Mật khẩu mới<input required type="password" autoComplete="new-password" minLength={12} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} /></label>
      <label>Xác nhận mật khẩu mới<input required type="password" autoComplete="new-password" minLength={12} maxLength={128} value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>
      <button type="submit" disabled={emailMode && (!sent || code.length !== 6)} className="account-button">{busy ? 'Đang cập nhật…' : 'Lưu mật khẩu'}</button>
    </fieldset>{error && <p role="alert" className="account-message account-message--error">{error}</p>}{notice && <p role="status" className="account-message">{notice}</p>}</form>
  </section>;
}
