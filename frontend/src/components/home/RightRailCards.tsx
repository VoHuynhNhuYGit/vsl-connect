import { Icon } from '../ui/Icon';
import { SurfaceCard } from '../ui/SurfaceCard';

export function SrsCard() {
  return (
    <SurfaceCard className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Icon name="psychology" className="text-[22px] text-primary" /><h3 className="text-headline-md">Cần ôn tập hôm nay</h3></div><span className="rounded bg-surface-container px-2 py-0.5 text-code-sm font-semibold text-primary">SRS v2.1</span></div>
      <p className="text-body-sm text-on-surface-variant">Thuật toán nhắc nhở thông minh: Có <span className="text-headline-sm text-error">8 ký hiệu</span> bắt đầu suy giảm trí nhớ nếu không ôn lại.</p>
      <div className="flex flex-wrap gap-2">
        {['Xin chào', 'Tạm biệt', 'Cảm ơn', 'Xin lỗi', 'Gia đình'].map((word, index) => <span key={word} className="flex items-center gap-1.5 rounded-lg bg-surface-container-low px-3 py-1.5 text-label-md text-on-surface"><span className={`h-1.5 w-1.5 rounded-full ${index === 2 || index === 4 ? 'bg-secondary' : 'bg-error'}`} />{word}</span>)}
        <span className="rounded-lg bg-surface-container px-3 py-1.5 text-code-sm text-on-surface-variant">+3 từ nữa</span>
      </div>
      <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-headline-sm text-on-primary shadow-sm transition hover:bg-primary-container" type="button"><Icon name="flash_on" className="text-[18px]" />Bắt đầu ôn tập (8 từ)</button>
    </SurfaceCard>
  );
}

const learners = [
  ['1', 'TH', 'Trần Hoàng', '14 ngày liên tiếp', '1,120 EXP'],
  ['2', 'LH', 'Lê Hương', '11 ngày liên tiếp', '940 EXP'],
  ['3', 'MA', 'Minh Anh', 'Hạng 3 · Nhận huy hiệu Đồng', '860 EXP'],
  ['4', 'VT', 'Văn Toàn', '8 ngày liên tiếp', '790 EXP'],
  ['5', 'NT', 'Ngọc Thảo', '6 ngày liên tiếp', '720 EXP'],
];

export function LeaderboardCard() {
  return (
    <SurfaceCard className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between"><div><h3 className="text-headline-md">Bảng xếp hạng tuần</h3><p className="text-label-sm text-on-surface-variant">Phân nhóm: Lớp Sơ cấp II · Bảng A</p></div><Icon name="military_tech" className="text-[20px] text-on-surface-variant" /></div>
      <div className="space-y-3">
        {learners.map(([rank, initials, name, meta, exp]) => <div key={rank} className={`flex items-center justify-between rounded-lg p-2.5 ${rank === '3' ? 'bg-secondary-container/40' : 'hover:bg-surface-container-low'}`}><div className="flex min-w-0 items-center gap-3"><span className={`w-5 text-center text-code-sm font-bold ${rank === '3' ? 'text-primary' : 'text-on-surface'}`}>{rank}</span><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-headline-sm ${rank === '3' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'}`}>{initials}</div><div className="min-w-0"><p className="truncate text-headline-sm">{name} {rank === '3' && <span className="rounded bg-primary px-1.5 py-0.5 text-code-sm text-on-primary">Bạn</span>}</p><p className={`truncate text-label-sm ${rank === '3' ? 'text-primary' : 'text-on-surface-variant'}`}>{meta}</p></div></div><span className="shrink-0 text-code-sm font-bold text-primary">{exp}</span></div>)}
      </div>
      <a className="inline-flex items-center justify-center gap-1 pt-1 text-label-md text-primary transition-colors hover:text-primary-container" href="#bang-xep-hang">Xem đầy đủ bảng xếp hạng <Icon name="arrow_forward" className="text-[16px]" /></a>
    </SurfaceCard>
  );
}

export function CulturalTip() {
  return (
    <SurfaceCard className="relative flex flex-col gap-3 overflow-hidden p-6">
      <div className="flex items-center gap-2 text-primary"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container"><Icon name="lightbulb" className="text-[18px]" /></div><span className="text-label-md uppercase tracking-wide">Mẹo văn hóa người Điếc</span></div>
      <blockquote className="pt-1 text-body-md italic leading-relaxed">“Trong Ngôn ngữ Ký hiệu Việt Nam (VSL), biểu cảm khuôn mặt và ánh mắt chiếm hơn <strong className="font-semibold not-italic text-primary">50% sắc thái ngữ nghĩa</strong>. Hãy giữ ánh mắt tự nhiên và không ngần ngại biểu đạt cảm xúc!”</blockquote>
      <div className="flex items-center justify-between gap-3 pt-2"><span className="text-label-sm text-on-surface-variant">Nguồn: Ban Văn hóa Khiếm thính VN</span><button className="inline-flex items-center gap-1 text-code-sm text-primary hover:text-primary-container" type="button"><Icon name="bookmark" className="text-[14px]" />Lưu mẹo</button></div>
    </SurfaceCard>
  );
}
