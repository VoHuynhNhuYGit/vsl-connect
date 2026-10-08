import { Icon } from '../ui/Icon';

export function Footer() {
  return (
    <footer className="bg-surface-container-lowest py-8 shadow-card">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 md:flex-row">
        <div className="flex items-center gap-2 text-center md:text-left">
          <Icon name="sign_language" className="text-[20px] text-primary" />
          <span className="text-label-md text-on-surface">VSL Connect</span>
          <span className="text-body-sm text-on-surface-variant">© 2024 Nền tảng học Ngôn ngữ Ký hiệu Việt Nam.</span>
        </div>
        <div className="flex items-center gap-6">
          <a className="text-body-sm text-on-surface-variant transition-colors hover:text-on-surface" href="#dieu-khoan">Điều khoản</a>
          <a className="text-body-sm text-on-surface-variant transition-colors hover:text-on-surface" href="#quyen-rieng-tu">Quyền riêng tư</a>
          <a className="text-body-sm text-on-surface-variant transition-colors hover:text-on-surface" href="#ho-tro">Hỗ trợ cộng đồng</a>
        </div>
      </div>
    </footer>
  );
}
