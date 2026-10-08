import { useEffect, useState } from 'react';
import { Icon } from '../components/ui/Icon';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SurfaceCard } from '../components/ui/SurfaceCard';

const cards = [
  { word: 'Xin lỗi', hint: 'Giao tiếp hằng ngày', detail: 'Nắm tay xoay nhẹ trên vùng ngực trái, kết hợp ánh mắt chân thành.' },
  { word: 'Gia đình', hint: 'Gia đình & Xã hội', detail: 'Hai bàn tay tạo vòng tròn kết nối, biểu đạt các mối quan hệ thân thuộc.' },
  { word: 'Cảm ơn', hint: 'Giao tiếp hằng ngày', detail: 'Bàn tay mở chạm cằm rồi đưa nhẹ ra phía trước.' },
];

export function ReviewPage() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [remembered, setRemembered] = useState(3);
  const [notice, setNotice] = useState('');
  const card = cards[index];

  const moveNext = (good: boolean) => {
    setRemembered((value) => (good ? Math.min(value + 1, 8) : value));
    setNotice(good ? 'Đã ghi nhận: Nhớ tốt' : 'Đã đưa ký hiệu về nhóm cần ôn lại');
    setFlipped(false);
    setIndex((value) => (value + 1) % cards.length);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target !== document.body) return;
      if (event.code === 'Space') { event.preventDefault(); setFlipped((value) => !value); }
      if (event.key === '1') moveNext(false);
      if (event.key === '2') moveNext(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><span className="text-label-sm uppercase tracking-[0.18em] text-primary">Ôn tập cách quãng · SRS v2.1</span><h1 className="mt-2 text-headline-xl">Ôn tập nhanh</h1><p className="mt-2 text-body-lg text-on-surface-variant">Củng cố những ký hiệu đang bắt đầu phai trí nhớ bằng các lượt ôn ngắn và tập trung.</p></div><div className="flex items-center gap-3"><div className="rounded-xl bg-surface-container-lowest px-4 py-3 shadow-card"><span className="text-label-sm text-on-surface-variant">Chuỗi hôm nay</span><p className="text-headline-md text-primary">14 ngày <Icon name="local_fire_department" className="align-middle text-error" /></p></div><div className="rounded-xl bg-secondary-container px-4 py-3"><span className="text-label-sm text-on-secondary-container">Đã nhớ tốt</span><p className="text-headline-md text-on-secondary-container">{remembered} / 8</p></div></div></div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="flex flex-col gap-6 lg:col-span-8"><SurfaceCard className="p-6"><div className="flex items-center justify-between"><div><p className="text-label-md text-on-surface-variant">Ký hiệu {index + 1} / 8</p><ProgressBar value={(index + 1) * 12.5} className="mt-2 w-48" /></div><span className="rounded-full bg-error-container px-3 py-1 text-label-sm text-error">Cần ôn lại</span></div><button onClick={() => setFlipped((value) => !value)} className="group mt-6 flex min-h-[420px] w-full flex-col items-center justify-center rounded-2xl border border-surface-container bg-gradient-to-br from-white via-surface-container-low to-secondary-container/40 p-8 text-center transition hover:shadow-lift" type="button" aria-label="Lật thẻ ôn tập"><div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-secondary-container text-primary shadow-sm"><Icon name={flipped ? 'sign_language' : 'touch_app'} className="text-[46px] transition group-hover:scale-110" /></div>{flipped ? <><span className="text-label-sm uppercase tracking-[0.2em] text-primary">Hướng dẫn thực hiện</span><h2 className="mt-3 text-headline-lg">{card.detail}</h2><p className="mt-4 max-w-xl text-body-lg text-on-surface-variant">Quan sát khẩu hình và giữ ánh mắt tự nhiên. Hãy thử thực hiện lại trước khi chấm mức độ ghi nhớ.</p></> : <><span className="text-label-sm uppercase tracking-[0.2em] text-primary">Mặt trước · {card.hint}</span><h2 className="mt-3 text-[42px] font-bold tracking-tight text-on-surface">{card.word}</h2><p className="mt-4 text-body-md text-on-surface-variant">Nhấn Space hoặc chạm vào thẻ để xem hướng dẫn</p></>}</button><div className="mt-5 flex flex-col gap-3 sm:flex-row"><button onClick={() => moveNext(false)} className="flex-1 rounded-xl bg-error-container px-4 py-3 text-headline-sm text-error transition hover:brightness-95" type="button"><Icon name="close" className="mr-2 align-middle" />1 · Chưa nhớ</button><button onClick={() => moveNext(true)} className="flex-1 rounded-xl bg-primary px-4 py-3 text-headline-sm text-on-primary transition hover:bg-primary-container" type="button"><Icon name="check" className="mr-2 align-middle" />2 · Nhớ tốt</button></div>{notice && <p className="mt-3 text-center text-body-sm text-primary" role="status">{notice}</p>}</SurfaceCard><SurfaceCard className="p-6"><div className="flex items-center justify-between"><div><h2 className="text-headline-md">Lịch sử phiên ôn</h2><p className="text-body-sm text-on-surface-variant">Bạn đã hoàn thành 4 phiên trong tuần này.</p></div><button className="rounded-lg bg-surface-container-low px-3 py-2 text-label-md text-on-surface" type="button">Xem lịch sử</button></div><div className="mt-5 flex h-20 items-end gap-3">{[35, 52, 28, 75, 58, 82, 44].map((value, day) => <div key={day} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-lg bg-secondary-container" style={{ height: `${value}%` }} /><span className="text-label-sm text-on-surface-variant">T{day + 2}</span></div>)}</div></SurfaceCard></section>
        <aside className="flex flex-col gap-6 lg:col-span-4"><SurfaceCard className="p-6"><div className="flex items-center justify-between"><h2 className="text-headline-md"><Icon name="psychology" className="mr-2 align-middle text-primary" />Hôm nay cần ôn</h2><span className="text-code-sm text-primary">8 từ</span></div><p className="mt-3 text-body-sm text-on-surface-variant">Ưu tiên những ký hiệu bạn chưa gặp lại trong 3 ngày gần đây.</p><div className="mt-5 space-y-2">{['Xin chào', 'Tạm biệt', 'Cảm ơn', 'Xin lỗi', 'Gia đình'].map((word, itemIndex) => <button key={word} onClick={() => setIndex(itemIndex % cards.length)} className={`flex w-full items-center justify-between rounded-lg p-3 text-left transition ${itemIndex === index ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-low hover:bg-surface-container'}`} type="button"><span className="flex items-center gap-2 text-label-md"><span className={`h-2 w-2 rounded-full ${itemIndex < 2 ? 'bg-error' : 'bg-secondary'}`} />{word}</span><Icon name={itemIndex === index ? 'play_arrow' : 'chevron_right'} className="text-[18px]" /></button>)}</div></SurfaceCard><SurfaceCard className="p-6"><h2 className="text-headline-md">Mẹo ghi nhớ</h2><div className="mt-4 space-y-3">{[['visibility', 'Nhìn kỹ khẩu hình', 'Biểu cảm khuôn mặt giúp nhớ ngữ cảnh.'], ['replay', 'Ôn lại sau 10 phút', 'Khoảng nghỉ ngắn giúp củng cố trí nhớ.'], ['edit_note', 'Tự đặt câu', 'Liên hệ ký hiệu với một câu chuyện quen thuộc.']].map(([icon, title, text]) => <div key={title} className="flex gap-3 rounded-xl bg-surface-container-low p-3"><Icon name={icon} className="text-primary" /><div><p className="text-label-md">{title}</p><p className="mt-1 text-body-sm text-on-surface-variant">{text}</p></div></div>)}</div></SurfaceCard><div className="rounded-2xl bg-primary p-6 text-on-primary"><Icon name="emoji_events" className="text-[28px] text-secondary-fixed" /><h2 className="mt-3 text-headline-md">Hoàn thành thêm 4 từ</h2><p className="mt-1 text-body-sm text-on-primary/80">Nhận +50 EXP và duy trì chuỗi học tập hôm nay.</p><ProgressBar value={50} className="mt-4 bg-primary-container" fillClassName="bg-secondary-fixed" /></div></aside>
      </div>
    </div>
  );
}
