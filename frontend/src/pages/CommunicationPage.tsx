import { useState } from 'react';
import { Icon } from '../components/ui/Icon';
import { SurfaceCard } from '../components/ui/SurfaceCard';
import { GroupChatTTS } from '../features/communication/GroupChatTTS';

const rooms = [
  { title: 'Giao tiếp cơ bản', meta: '34 học viên đang luyện', level: 'Sơ cấp II', color: 'bg-secondary-container' },
  { title: 'Kể chuyện bằng VSL', meta: '18 học viên đang luyện', level: 'Trung cấp', color: 'bg-surface-container-high' },
  { title: 'Luyện phỏng vấn', meta: '12 học viên đang luyện', level: 'Thực hành', color: 'bg-primary-fixed' },
];

export function CommunicationPage() {
  const [room, setRoom] = useState(0);
  const [joined, setJoined] = useState(false);
  const [mic, setMic] = useState(false);

  // Đã xóa các state message và messages vì GroupChatTTS tự quản lý

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-2xl bg-gradient-to-br from-surface-container-low via-surface-container to-secondary-container/70 p-7 md:p-9">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary-container px-3 py-1 text-label-sm text-on-secondary-container">
              <Icon name="forum" className="text-[16px]" />
              Kết nối cộng đồng VSL
            </span>
            <h1 className="mt-4 text-headline-xl">Giao tiếp tự nhiên hơn mỗi ngày</h1>
            <p className="mt-2 max-w-2xl text-body-lg text-on-surface-variant">
              Luyện ghép câu, biểu cảm và phản xạ với học viên cùng cấp độ trong những phòng thực hành an toàn.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl bg-surface-container-lowest p-4 text-center shadow-sm">
              <p className="text-headline-lg text-primary">64</p>
              <p className="text-label-sm text-on-surface-variant">phòng đang mở</p>
            </div>
            <div className="rounded-xl bg-surface-container-lowest p-4 text-center shadow-sm">
              <p className="text-headline-lg text-primary">318</p>
              <p className="text-label-sm text-on-surface-variant">người đang học</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="flex flex-col gap-6 lg:col-span-8">
          <SurfaceCard className="overflow-hidden">
            <div className="flex flex-col justify-between gap-3 border-b border-surface-container p-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-headline-lg">Phòng luyện tập</h2>
                <p className="text-body-sm text-on-surface-variant">Chọn một chủ đề phù hợp với nhịp độ của bạn.</p>
              </div>
              <button className="rounded-lg bg-primary px-4 py-2.5 text-label-md text-on-primary" type="button">
                <Icon name="add" className="mr-1 align-middle text-[18px]" />
                Tạo phòng mới
              </button>
            </div>
            <div className="space-y-2 p-3">
              {rooms.map((item, index) => (
                <button 
                  key={item.title} 
                  onClick={() => setRoom(index)} 
                  className={`flex w-full items-center gap-4 rounded-xl p-4 text-left transition ${room === index ? 'bg-secondary-container/60 ring-1 ring-primary/30' : 'hover:bg-surface-container-low'}`} 
                  type="button"
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.color} text-primary`}>
                    <Icon name={index === 0 ? 'groups' : index === 1 ? 'auto_stories' : 'work'} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-headline-sm">{item.title}</h3>
                      <span className="rounded-full bg-surface-container px-2 py-0.5 text-label-sm text-on-surface-variant">{item.level}</span>
                    </div>
                    <p className="mt-1 text-body-sm text-on-surface-variant">{item.meta}</p>
                  </div>
                  <Icon name={room === index ? 'radio_button_checked' : 'chevron_right'} className={room === index ? 'text-primary' : 'text-on-surface-variant'} />
                </button>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-surface-container p-5">
              <div>
                <h2 className="text-headline-lg">{rooms[room].title}</h2>
                <p className="mt-1 text-body-sm text-on-surface-variant">Phòng {rooms[room].level} · Đang có 4 người tham gia</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1 text-label-sm text-on-secondary-container">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                Trực tuyến
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 bg-surface-container-low p-5 sm:grid-cols-4">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-primary to-inverse-surface p-3 text-on-primary">
                <span className="absolute right-2 top-2 rounded bg-inverse-surface/60 px-1.5 py-0.5 text-code-sm">MA</span>
                <div className="flex h-full items-end"><span className="text-label-md">Minh Anh</span></div>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-secondary-container to-surface-container-high p-3 text-on-surface">
                <span className="absolute right-2 top-2 rounded bg-surface-container-lowest/70 px-1.5 py-0.5 text-code-sm">TH</span>
                <div className="flex h-full items-end"><span className="text-label-md">Trần Hoàng</span></div>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-surface-container-high to-surface-container p-3 text-on-surface">
                <span className="absolute right-2 top-2 rounded bg-surface-container-lowest/70 px-1.5 py-0.5 text-code-sm">LH</span>
                <div className="flex h-full items-end"><span className="text-label-md">Lê Hương</span></div>
              </div>
              <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-primary-fixed to-surface-container-high p-3 text-on-surface">
                <span className="absolute right-2 top-2 rounded bg-surface-container-lowest/70 px-1.5 py-0.5 text-code-sm">VT</span>
                <div className="flex h-full items-end"><span className="text-label-md">Văn Toàn</span></div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-container p-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setMic((value) => !value)} className={`flex h-10 w-10 items-center justify-center rounded-lg ${mic ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface'}`} type="button" aria-label={mic ? 'Tắt micro' : 'Bật micro'}>
                  <Icon name={mic ? 'mic' : 'mic_off'} />
                </button>
                <button onClick={() => setJoined((value) => !value)} className={`flex h-10 w-10 items-center justify-center rounded-lg ${joined ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface'}`} type="button" aria-label="Bật camera">
                  <Icon name="videocam" />
                </button>
                <span className="text-body-sm text-on-surface-variant">
                  {joined ? 'Bạn đã tham gia phòng · mô phỏng giao diện' : 'Chế độ xem trước phòng'}
                </span>
              </div>
              <button onClick={() => setJoined((value) => !value)} className="rounded-lg bg-primary px-5 py-2.5 text-headline-sm text-on-primary" type="button">
                {joined ? 'Rời phòng' : 'Tham gia phòng'}
              </button>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-headline-md">Gợi ý chủ đề hôm nay</h2>
              <button className="text-label-md text-primary" type="button">Xem tất cả</button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {['Giới thiệu bản thân', 'Đi chợ cuối tuần', 'Hỏi đường bằng VSL'].map((topic, index) => (
                <button key={topic} className="rounded-xl bg-surface-container-low p-4 text-left transition hover:bg-surface-container" type="button">
                  <Icon name={index === 0 ? 'person' : index === 1 ? 'shopping_basket' : 'explore'} className="text-primary" />
                  <p className="mt-3 text-label-md">{topic}</p>
                  <p className="mt-1 text-body-sm text-on-surface-variant">12 câu mẫu</p>
                </button>
              ))}
            </div>
          </SurfaceCard>
        </section>

        <aside className="flex flex-col gap-6 lg:col-span-4">
          {/* Nhúng GroupChatTTS vào thay thế cho toàn bộ khối chat tĩnh */}
          <div className="flex min-h-[520px] flex-col">
            <GroupChatTTS />
          </div>

          <SurfaceCard className="p-5">
            <h2 className="text-headline-md">Quy tắc cộng đồng</h2>
            <div className="mt-4 space-y-3">
              {[
                ['handshake', 'Tôn trọng lẫn nhau'], 
                ['visibility', 'Giao tiếp rõ ràng'], 
                ['shield', 'Giữ an toàn thông tin']
              ].map(([icon, text]) => (
                <div key={text} className="flex items-center gap-3 text-label-md">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-container text-primary">
                    <Icon name={icon} className="text-[18px]" />
                  </div>
                  {text}
                </div>
              ))}
            </div>
            <p className="mt-4 text-body-sm text-on-surface-variant">
              Tính năng gọi video/WebRTC thật sẽ được bổ sung ở giai đoạn sau.
            </p>
          </SurfaceCard>
        </aside>
      </div>
    </div>
  );
}
