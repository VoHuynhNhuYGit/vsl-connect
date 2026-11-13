import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleError, GoogleSuccess } from '../../components/auth/GoogleActions';
import { UserAvatar } from '../../components/common/UserAvatar';
import { Icon } from '../../components/ui/Icon';
import type { AuthSession } from '../../services/adminApi';
import { AvatarEditor } from './AvatarEditor';
import './account.css';
import { ProfileDetails } from './ProfileDetails';
import { PasswordSettings } from './PasswordSettings';
import { GoogleAccountSettings } from './GoogleAccountSettings';

export function AccountProfile({ session, onSessionChange, onSignOut, error }: { session: AuthSession; onSessionChange: (session: AuthSession) => void; onSignOut: () => Promise<void>; error: string }) {
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { user } = session;
  const created = new Date(user.created_at);
  const joined = Number.isNaN(created.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(created);
  return <div className="account-page mx-auto max-w-[1120px] px-5 py-8 sm:px-8 lg:py-12">
    <Link to="/" className="account-back"><Icon name="arrow_back" />Về trang chủ</Link>
    <div className="account-page-heading"><p className="theme-eyebrow">KHÔNG GIAN CÁ NHÂN</p><h1>Tài khoản của bạn</h1><p>Thêm một chút dấu ấn riêng cho hành trình học của mình.</p></div>
    <GoogleSuccess /><GoogleError />
    {error && <p className="account-message account-message--error" role="alert">{error}</p>}
    <section className="account-identity" aria-label="Hồ sơ cá nhân"><UserAvatar name={user.display_name} src={user.avatar_url} className="h-20 w-20 text-2xl sm:h-24 sm:w-24" /><div><span className="account-role"><Icon name={user.role === 'admin' ? 'admin_panel_settings' : 'school'} />{user.role === 'admin' ? 'Quản trị viên' : 'Học viên'}</span><h2>{user.display_name}</h2><p>{user.email}</p></div><span className="account-identity-decoration" aria-hidden="true"><Icon name="sign_language" /></span></section>
    <div className="account-columns"><div className="account-avatar-column"><AvatarEditor user={user} csrfToken={session.csrf_token} onSaved={updated => onSessionChange({ ...session, user: updated })} onBusyChange={setAvatarBusy} /><PasswordSettings session={session} onSaved={onSessionChange} /></div>
      <div className="account-details-column"><div className="account-profile-group"><ProfileDetails session={session} onSaved={onSessionChange} /><p className="account-field-hint account-joined">Ngày tham gia: {joined}</p></div>
        <GoogleAccountSettings session={session} onSaved={onSessionChange} />
        <section className="account-card account-signout"><h2>Phiên đăng nhập</h2><button type="button" disabled={avatarBusy || signingOut} onClick={async () => { setSigningOut(true); try { await onSignOut(); } finally { setSigningOut(false); } }} className="account-button account-button--quiet"><Icon name="logout" />{signingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</button></section>
      </div>
    </div>
  </div>;
}
