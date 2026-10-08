import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SurfaceCard } from '../components/ui/SurfaceCard';

const nodes = [
  { id: 1, title: 'Chữ cái & Số đếm', meta: 'Hoàn thành xuất sắc · 3 sao', icon: 'check_circle', state: 'done' },
  { id: 2, title: 'Đại từ & Chào hỏi', meta: 'Đã tình thông 16 ký hiệu', icon: 'check_circle', state: 'done' },
  { id: 3, title: 'Kiểm tra phản xạ', meta: 'Huy chương bạc · 94 điểm', icon: 'military_tech', state: 'score' },
  { id: 4, title: 'Ký hiệu Cha Mẹ, Anh Chị Em', meta: 'Đang học · 12 ký hiệu', icon: 'family_restroom', state: 'active' },
  { id: 5, title: 'Thời gian & Lịch trình', meta: 'Sẵn sàng sau bài 04', icon: 'event_available', state: 'next' },
  { id: 6, title: 'Đối thoại mô phỏng 2 phút', meta: 'Kiểm tra camera nhận diện tay', icon: 'videocam', state: 'locked' },
  { id: 7, title: 'Rương danh hiệu', meta: 'Người kết nối thân thiện', icon: 'workspace_premium', state: 'locked' },
  { id: 8, title: 'Cảm xúc & Biểu cảm', meta: 'Khóa sau bài kiểm tra phản xạ', icon: 'mood', state: 'locked' },
];

export function LearningPathPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(4);
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl bg-surface-container-lowest p-2 shadow-card md:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-on-primary"><Icon name="check" /></div><div className="min-w-0"><p className="text-label-sm uppercase text-primary">Cấp độ 1</p><p className="truncate text-headline-sm">Làm quen & Bảng chữ...</p></div><span className="ml-auto rounded-full bg-secondary-container px-2 py-1 text-code-sm text-on-secondary-container">100%</span></div>
        <div className="flex items-center gap-3 rounded-xl bg-primary p-3 text-on-primary"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary-container text-on-secondary-container"><Icon name="sign_language" /></div><div className="min-w-0"><p className="text-label-sm uppercase text-secondary-container">Cấp độ 2 · Đang theo học</p><p className="truncate text-headline-sm">Giao tiếp thường nhật & Kết nối...</p></div><span className="ml-auto rounded-full bg-primary-container px-2 py-1 text-code-sm">62% Tiến độ</span></div>
        <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3 opacity-60"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant"><Icon name="lock" /></div><div className="min-w-0"><p className="text-label-sm uppercase text-on-surface-variant">Cấp độ 3</p><p className="truncate text-headline-sm">Sống & Đời sống chuyên sâu</p></div><span className="ml-auto rounded-full bg-surface-container px-2 py-1 text-code-sm text-on-surface-variant">Chưa mở</span></div>
      </div>

      <SurfaceCard className="mb-6 overflow-hidden bg-gradient-to-br from-surface-container-low via-surface-container to-surface-variant p-6 md:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex max-w-3xl items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container"><Icon name="groups" className="text-[24px]" /></div><div><div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-full bg-secondary-container px-3 py-1 text-code-sm uppercase tracking-wider text-on-secondary-container">Giai đoạn hiện tại</span><span className="text-body-sm text-on-surface-variant">• VSL Trực quan & Động tác tay</span></div><h1 className="text-headline-xl">Cấp độ 2 • Giao tiếp thường nhật & Kết nối cộng đồng</h1><p className="mt-1 text-body-sm text-on-surface-variant">Làm chủ các chủ đề giao tiếp cơ bản, khẩu hình tự nhiên kết hợp ký hiệu ngữ cảnh gia đình và xã hội.</p></div></div>
          <div className="flex shrink-0 gap-3"><div className="rounded-xl bg-surface-container-lowest/80 p-4"><p className="text-label-sm text-on-surface-variant">Bài học thành thạo</p><p className="text-headline-lg">18<span className="text-body-sm font-normal text-on-surface-variant"> / 28 bài</span></p><ProgressBar value={64} className="mt-2 w-28" /></div><div className="rounded-xl bg-surface-container-lowest/80 p-4"><p className="text-label-sm text-on-surface-variant">Tích lũy kinh nghiệm</p><p className="text-headline-lg">450<span className="text-body-sm font-normal text-on-surface-variant"> / 700 EXP</span></p><ProgressBar value={64} className="mt-2 w-28" /></div></div>
        </div>
      </SurfaceCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <SurfaceCard className="relative overflow-hidden p-6 lg:col-span-8">
          <div className="flex items-center justify-between"><div><h2 className="text-headline-lg"><span className="mr-2 inline-block h-7 w-2 rounded-full bg-primary align-middle" />Bản đồ kỹ năng VSL</h2><p className="text-body-sm text-on-surface-variant">Nhấp vào từng node để mở bài học hoặc luyện lại phản xạ thị giác.</p></div><span className="rounded bg-surface-container px-3 py-1 text-label-sm text-on-secondary-container">● 8 Chặng cốt lõi</span></div>
          <div className="relative mx-auto mt-8 min-h-[1070px] max-w-xl overflow-hidden rounded-xl bg-gradient-to-b from-white via-white to-surface-container-low px-5 py-8">
            <div className="absolute bottom-24 left-1/2 top-20 w-1 -translate-x-1/2 rounded-full bg-secondary-container" />
            <div className="absolute left-[29%] top-40 h-48 w-48 rotate-[32deg] rounded-[50%] border-b-8 border-l-8 border-secondary-container" />
            <div className="absolute right-[20%] top-[360px] h-52 w-64 rotate-[20deg] rounded-[50%] border-b-8 border-r-8 border-secondary-container" />
            <div className="absolute left-[31%] top-[590px] h-48 w-60 rotate-[58deg] rounded-[50%] border-b-8 border-l-8 border-dashed border-primary" />
            <div className="relative z-10 flex flex-col items-center gap-10">
              {nodes.map((node, index) => {
                const offset = index % 2 === 0 ? '-translate-x-16' : 'translate-x-16';
                const active = node.id === selected;
                return (
                  <div key={node.id} className={`flex w-full flex-col items-center ${offset}`}>
                    {active && <span className="mb-2 rounded-full bg-primary px-3 py-1 text-code-sm text-on-primary shadow-sm">BÀI 03 / 05 · TRỌNG TÂM</span>}
                    <button onClick={() => setSelected(node.id)} className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border-4 transition hover:-translate-y-1 ${node.state === 'done' ? 'border-secondary-container bg-primary text-on-primary' : node.state === 'active' ? 'border-secondary-container bg-primary text-on-primary shadow-[0_0_0_6px_rgba(172,235,231,0.55)]' : node.state === 'score' ? 'border-secondary-container bg-surface-container-lowest text-primary' : 'border-surface-container bg-surface-container-low text-on-surface-variant'}`} type="button" aria-label={node.title}>
                      <Icon name={node.icon} className="text-[24px]" />
                      {node.state === 'done' && <span className="absolute -right-2 -top-2 rounded-full bg-secondary-container px-2 py-0.5 text-code-sm text-on-secondary-container">100%</span>}
                    </button>
                    <p className={`mt-2 text-center text-headline-sm ${active ? 'text-primary' : 'text-on-surface'}`}>{node.id.toString().padStart(2, '0')}. {node.title}</p>
                    <p className="text-center text-body-sm text-on-surface-variant">{node.meta}</p>
                    {active && <div className="mt-3 w-72 rounded-2xl bg-surface-container-lowest p-3 text-left shadow-modal"><div className="relative aspect-video overflow-hidden rounded-xl bg-inverse-surface"><img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBaSGLn28hFmihtFC46fvC1lNZaNIyEEE5m6A8yIpcj2XDll1Hp3r1-Pvm-97zxWFpv397cZNmDFo_OaPPzqklUrUpP5M6VA9xTO50YAddaLiO_5Zpka1ld0cp8y6kPohsfFm_UGMmYQdUAfSRx9c6e1jcb_1RT92jDnVxenrSGWfYcm16dmsMKWGthRdGbEpKOfbBKwQ_-OFfOk7GrvVZUSbbs4J7MPH1AUSyGftt" alt="Giảng viên thực hiện ký hiệu gia đình" className="h-full w-full object-cover" /><div className="absolute inset-x-2 bottom-2 rounded bg-inverse-surface/80 px-2 py-1 text-label-sm text-on-primary">Video mẫu: Khẩu hình & Ngón cái</div></div><p className="mt-3 text-headline-sm">Ký hiệu Cha Mẹ, Anh Chị Em</p><p className="mt-1 text-body-sm text-on-surface-variant">Học 12 ký hiệu xưng hô gia đình, nhận diện cử chỉ chỉ định thứ bậc.</p><button onClick={() => navigate('/luyen-tap')} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-label-md text-on-primary" type="button">Tiếp tục học ngay <Icon name="arrow_forward" className="text-[16px]" /></button></div>}
                  </div>
                );
              })}
            </div>
          </div>
        </SurfaceCard>

        <aside className="flex flex-col gap-6 lg:col-span-4">
          <SurfaceCard className="p-5"><div className="flex items-center justify-between"><h3 className="text-headline-md"><Icon name="track_changes" className="mr-2 align-middle text-primary" />Mục tiêu tuần này</h3><span className="rounded bg-surface-container px-2 py-1 text-label-sm">Tuần 42</span></div><div className="mt-4 flex items-center gap-4 rounded-xl bg-surface-container-low p-4"><div className="flex h-16 w-16 items-center justify-center rounded-full border-8 border-secondary-container border-r-primary text-headline-sm text-primary">25%</div><div><p className="text-label-md">Tiến độ vượt mốc</p><p className="text-body-sm text-on-surface-variant">Cần hoàn thành thêm 3 bài học để nhận thưởng chuỗi 7 ngày.</p></div></div><div className="mt-4 flex gap-1.5">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day, index) => <div key={day} className={`flex-1 rounded-lg p-2 text-center text-code-sm ${index < 3 ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-on-surface-variant'}`}>{day}<br /><Icon name={index < 3 ? 'check_circle' : 'circle'} className="mt-1 text-[14px]" /></div>)}</div></SurfaceCard>
          <SurfaceCard className="p-5"><h3 className="text-headline-md"><Icon name="analytics" className="mr-2 align-middle text-primary" />Năng lực đã tích lũy</h3><div className="mt-4 space-y-3">{[['translate', '142 Ký hiệu từ vựng', '+18 ký hiệu học tuần này'], ['account_tree', '24 Cấu trúc ngữ pháp', 'Quy tắc từ VSL chuẩn'], ['video_library', '8 Video tình huống', 'Đã vượt qua kiểm tra nghe hiểu']].map(([icon, title, meta]) => <div key={title} className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3"><Icon name={icon} className="text-primary" /><div className="min-w-0"><p className="text-label-md">{title}</p><p className="text-body-sm text-on-surface-variant">{meta}</p></div><Icon name="trending_up" className="ml-auto text-[18px] text-primary" /></div>)}<div className="rounded-xl bg-surface-container-low p-3"><div className="flex justify-between text-label-sm"><span>Độ chính xác cử chỉ camera</span><span className="text-primary">92.4%</span></div><div className="mt-3 flex h-8 items-end gap-1">{[40, 48, 56, 44, 65, 70, 90].map((height, i) => <span key={i} className="flex-1 rounded-t bg-primary-fixed" style={{ height: `${height}%` }} />)}</div></div></div></SurfaceCard>
          <SurfaceCard className="p-5"><div className="flex items-center justify-between"><h3 className="text-headline-md"><Icon name="redeem" className="mr-2 align-middle text-primary" />Phần thưởng Cấp độ 2</h3><span className="text-label-sm text-on-secondary-container">Đặc quyền</span></div><div className="mt-4 overflow-hidden rounded-xl bg-surface-container-low"><div className="flex h-28 items-center justify-center bg-gradient-to-br from-secondary-container to-surface-container-high"><Icon name="restaurant" className="text-[44px] text-primary" /></div><p className="p-3 text-body-sm text-on-surface-variant">Mở khóa toàn bộ thư viện video giao tiếp món ăn, văn hóa ba miền.</p><ProgressBar value={70} className="mx-3 mb-2 w-auto" /><p className="px-3 pb-3 text-label-sm text-primary">Còn 10 bài nữa</p></div></SurfaceCard>
          <SurfaceCard className="p-5"><h3 className="text-headline-md"><Icon name="forum" className="mr-2 align-middle text-primary" />Phòng đối thoại phản xạ <span className="text-label-sm text-primary">● Trực tuyến</span></h3><p className="mt-2 text-body-sm text-on-surface-variant">Luyện ghép câu với người khiếm thính và các học viên cùng cấp độ qua kết nối nội bộ.</p><div className="mt-4 rounded-xl bg-surface-container-low p-3 text-center text-label-md">TL · KH · VN +31 <span className="float-right text-code-sm">34 học viên online</span></div><button className="mt-3 w-full rounded-lg bg-surface-container-low py-2.5 text-label-md text-on-surface" type="button">Tham gia phòng luyện tập</button></SurfaceCard>
        </aside>
      </div>
    </div>
  );
}
