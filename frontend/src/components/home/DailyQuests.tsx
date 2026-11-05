import { useState } from 'react';
import { Icon } from '../ui/Icon';
import { SurfaceCard } from '../ui/SurfaceCard';

export function DailyQuests() {
  const [reviewDone, setReviewDone] = useState(false);
  const [cameraMessage, setCameraMessage] = useState(false);
  return (
    <SurfaceCard className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-headline-md">Nhiệm vụ hằng ngày</h3>
          <p className="text-body-sm text-on-surface-variant">Hoàn thành để nhận thêm điểm kinh nghiệm và duy trì chuỗi</p>
        </div>
        <span className="shrink-0 rounded-full bg-secondary-container px-3 py-1 text-label-md text-on-secondary-container">{reviewDone ? '2 / 3' : '1 / 3'} hoàn thành</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4 rounded-lg bg-surface-container-low p-4">
          <div className="flex min-w-0 items-center gap-3.5"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary"><Icon name="check" className="text-[18px]" /></div><div className="min-w-0"><div className="truncate text-headline-sm text-on-surface line-through">Đăng nhập và hoàn thành 1 lượt học cơ bản</div><div className="text-body-sm text-primary">Đã hoàn thành lúc 08:15</div></div></div>
          <span className="shrink-0 rounded bg-secondary-container px-2.5 py-1 text-label-md text-on-secondary-container">+20 EXP</span>
        </div>
        <div className="flex flex-col justify-between gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3.5"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${reviewDone ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}><Icon name={reviewDone ? 'check' : 'repeat'} className="text-[18px]" /></div><div className="min-w-0"><div className={`truncate text-headline-sm ${reviewDone ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>Ôn tập 8 ký hiệu trong danh sách SRS</div><div className="text-body-sm text-on-surface-variant">{reviewDone ? 'Đã hoàn thành lúc 09:20' : 'Tiến độ: 0/8 ký hiệu'}</div></div></div>
          <div className="flex shrink-0 items-center gap-3 self-end sm:self-auto"><span className="rounded bg-secondary-container px-2.5 py-1 text-label-md text-on-secondary-container">+30 EXP</span><button onClick={() => setReviewDone(true)} className={`rounded-lg px-3 py-1.5 text-label-md transition-colors ${reviewDone ? 'bg-surface-container text-on-surface' : 'bg-primary text-on-primary hover:bg-primary-container'}`} type="button">{reviewDone ? 'Đã hoàn thành' : 'Thực hiện'}</button></div>
        </div>
        <div className="flex flex-col justify-between gap-3 rounded-lg bg-surface-container-lowest p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3.5"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant"><Icon name="center_focus_strong" className="text-[18px]" /></div><div className="min-w-0"><div className="truncate text-headline-sm text-on-surface">Kiểm tra phản xạ tay qua Camera AI đạt ≥ 90%</div><div className="text-body-sm text-on-surface-variant">Luyện tập tư thế tay và khẩu hình mặt</div></div></div>
          <div className="flex shrink-0 items-center gap-3 self-end sm:self-auto"><span className="rounded bg-secondary-container px-2.5 py-1 text-label-md text-on-secondary-container">+50 EXP</span><button onClick={() => setCameraMessage(true)} className="rounded-lg bg-surface-container px-3 py-1.5 text-label-md text-on-surface transition-colors hover:bg-surface-container-high" type="button">Mở camera</button></div>
        </div>
      </div>
      {cameraMessage && <p className="rounded-lg bg-surface-container-low px-3 py-2 text-body-sm text-on-surface-variant">AI Camera sẽ được tích hợp ở giai đoạn sau. Đây mới là điểm vào giao diện luyện tập.</p>}
    </SurfaceCard>
  );
}
