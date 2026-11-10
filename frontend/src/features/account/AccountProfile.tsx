import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleAccountCard, GoogleError, GoogleSuccess } from '../../components/auth/GoogleActions';
import { UserAvatar } from '../../components/common/UserAvatar';
import { Icon } from '../../components/ui/Icon';
import type { AuthSession } from '../../services/adminApi';
import { AvatarEditor } from './AvatarEditor';
import './account.css';

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
    <div className="account-columns"><AvatarEditor user={user} csrfToken={session.csrf_token} onSaved={updated => onSessionChange({ ...session, user: updated })} onBusyChange={setAvatarBusy} />
      <div className="account-details-column"><section className="account-card" aria-labelledby="account-info-title"><div className="account-card-heading"><span><Icon name="badge" /></span><div><h2 id="account-info-title">Thông tin tài khoản</h2><p>Thông tin giúp nhận diện tài khoản của bạn.</p></div></div><dl className="account-info-list"><div><dt>Tên hiển thị</dt><dd>{user.display_name}</dd></div><div><dt>Email</dt><dd>{user.email}</dd></div><div><dt>Vai trò</dt><dd>{user.role === 'admin' ? 'Quản trị viên' : 'Học viên'}</dd></div><div><dt>Ngày tham gia</dt><dd>{joined}</dd></div></dl></section>
        {user.role !== 'admin' && <div className="account-google"><GoogleAccountCard isGoogleLinked={Boolean(user.is_google_linked)} csrfToken={session.csrf_token} onStatusChange={linked => onSessionChange({ ...session, user: { ...user, is_google_linked: linked } })} /></div>}
        <section className="account-card account-signout"><div><h2>Phiên đăng nhập</h2><p>Đăng xuất khi bạn đã hoàn tất, đặc biệt trên máy dùng chung.</p></div><button type="button" disabled={avatarBusy || signingOut} onClick={async () => { setSigningOut(true); try { await onSignOut(); } finally { setSigningOut(false); } }} className="account-button account-button--quiet"><Icon name="logout" />{signingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</button></section>
      </div>
    </div>
  </div>;
}
