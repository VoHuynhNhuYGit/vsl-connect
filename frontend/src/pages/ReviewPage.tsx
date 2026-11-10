import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, LoadState } from '../components/ui/EmptyState';
import { FeaturePageBanner } from '../components/ui/FeaturePageBanner';
import { Icon } from '../components/ui/Icon';
import { BlastGame } from '../features/review/BlastGame';
import { BlocksGame } from '../features/review/BlocksGame';
import { GameArt } from '../features/review/GameArt';
import { MatchGame } from '../features/review/MatchGame';
import { playableSigns, type GameMode, type RoundResult } from '../features/review/gameLogic';
import { useReviewSigns } from '../features/review/useReviewSigns';
import type { Sign } from '../services/api';
import '../features/review/review.css';

const games: { id: GameMode; name: string; icon: string; tag: string; description: string; details: string; minimum: number; number: string }[] = [
  { id: 'blocks', name: 'Khối hộp', icon: 'view_in_ar', tag: 'THƯ GIÃN & TƯ DUY', description: 'Nhớ đúng ký hiệu, mở thêm khối mới.', details: 'Trả lời câu hỏi video, đặt khối lên bảng và lấp đầy hàng hoặc cột để ghi điểm.', minimum: 4, number: '01' },
  { id: 'match', name: 'Ghép thẻ', icon: 'extension', tag: 'QUAN SÁT & KẾT NỐI', description: 'Tìm một cặp, nhớ thêm một từ.', details: 'Ghép từng video với từ tương ứng. Hoàn thành tối đa 6 cặp trong thời gian ngắn nhất.', minimum: 2, number: '02' },
  { id: 'blast', name: 'Blast', icon: 'rocket_launch', tag: 'PHẢN XẠ & CHINH PHỤC', description: 'Chọn đáp án, phá tan thiên thạch.', details: 'Vượt qua 10 câu hỏi video, giữ chuỗi trả lời đúng và bảo vệ 3 lượt chơi của bạn.', minimum: 4, number: '03' },
];
type Session = { mode: GameMode; deck: Sign[]; timed: boolean; topic: string };

export function ReviewPage() {
  const { data: signs, loading, error, retry } = useReviewSigns();
  const [topic, setTopic] = useState('all');

  const [timed, setTimed] = useState(true);
  const [active, setActive] = useState<Session | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const workspace = useRef<HTMLDivElement>(null);
  const topics = useMemo(() => [...new Set(signs.map(sign => sign.topic).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')), [signs]);
  const deck = useMemo(() => playableSigns(signs.filter(sign => topic === 'all' || sign.topic === topic)), [signs, topic]);
  const summary = useMemo(() => results.reduce((total, result) => ({ correct: total.correct + result.correct, mistakes: total.mistakes + result.mistakes }), { correct: 0, mistakes: 0 }), [results]);
  const onComplete = useCallback((result: RoundResult) => {
    if (result.correct + result.mistakes > 0) setResults(previous => [...previous, result]);
  }, []);
  useEffect(() => {
    if (active) workspace.current?.querySelector('h2')?.focus();
  }, [active, sessionKey]);
  const onExit = () => setActive(null);
  const onReplay = () => setSessionKey(value => value + 1);

  if (active) {
    const props = { deck: active.deck, onComplete, onReplay, onExit };
    return <div ref={workspace} className="review-workspace mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12 xl:px-16">
      <p className="review-deck-caption"><Icon name="auto_stories" />{active.topic === 'all' ? 'Tất cả chủ đề' : active.topic}<span>·</span>{active.deck.length} ký hiệu</p>
      {active.mode === 'blocks' ? <BlocksGame key={sessionKey} {...props} /> : active.mode === 'match' ? <MatchGame key={sessionKey} {...props} /> : <BlastGame key={sessionKey} {...props} timed={active.timed} />}
    </div>;
  }

  return <div className="review-page pb-14 sm:pb-20">
    <FeaturePageBanner eyebrow="Một chút mỗi ngày" title="Chơi một chút, nhớ lâu hơn." description="Biến những phút ôn tập thành một chuyến khám phá. Chọn trò chơi yêu thích và kết nối lại với các ký hiệu đã học." icon="sports_esports" />
    <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10 xl:px-16">
      <div className="review-lobby-heading"><div><p className="theme-eyebrow">GÓC ÔN TẬP CỦA BẠN</p><h2>Hôm nay, mình chơi gì?</h2><p>Ba cách chơi, cùng một mục tiêu: ghi nhớ ký hiệu tốt hơn.</p></div><span className="review-content-badge"><Icon name="smart_display" />{loading ? 'Đang chuẩn bị bộ từ…' : error ? 'Chưa tải được bộ từ' : `${deck.length} ký hiệu có video`}</span></div>
      <section className="review-deck-picker" aria-label="Chọn bộ từ ôn tập"><div className="review-deck-intro"><span><Icon name="tune" /></span><div><h3>Bộ từ của lượt chơi</h3><p>Chọn chủ đề và nhịp chơi phù hợp với bạn.</p></div></div><div className="review-deck-fields"><label>Chủ đề<select value={topic} disabled={loading || error} onChange={event => setTopic(event.target.value)}><option value="all">Tất cả chủ đề</option>{topics.map(item => <option key={item} value={item}>{item}</option>)}</select></label><label>Nhịp chơi Blast<select value={timed ? 'timed' : 'relaxed'} onChange={event => setTimed(event.target.value === 'timed')}><option value="timed">Thử thách · 20 giây / câu</option><option value="relaxed">Thoải mái · Không giới hạn</option></select></label></div></section>
      <div className="review-game-cards">{games.map(game => {
        const playable = !loading && !error && deck.length >= game.minimum;
        return <article key={game.id} className={`review-mode-card review-mode-card--${game.id}`}><GameArt mode={game.id} /><div className="review-mode-content"><div className="review-mode-eyebrow"><span>{game.tag}</span><span>{game.number}</span></div><h3>{game.name}</h3><p className="review-mode-description">{game.description}</p><p className="review-mode-details">{game.details}</p><div className="review-mode-meta"><span><Icon name={game.id === 'blocks' ? 'grid_view' : game.id === 'match' ? 'style' : 'favorite'} />{game.id === 'blocks' ? 'Bảng 6 × 6' : game.id === 'match' ? 'Tối đa 6 cặp' : '10 câu · 3 lượt'}</span><span><Icon name="videocam" />Video ký hiệu</span></div><button type="button" className="review-button" disabled={!playable} onClick={() => { setSessionKey(value => value + 1); setActive({ mode: game.id, deck: [...deck], timed, topic }); }}><Icon name={game.icon} />Chơi {game.name === 'Blast' ? 'Blast' : game.name.toLocaleLowerCase('vi-VN')}<Icon name="arrow_forward" /></button><p className="review-mode-requirement">{playable ? 'Sẵn sàng rồi, bắt đầu thôi!' : `Cần ít nhất ${game.minimum} ký hiệu khác nhau có video.`}</p></div></article>;
      })}</div>
      {(loading || error) && <div className="mt-6"><LoadState loading={loading} retry={retry} /></div>}
      {!loading && !error && deck.length < 2 && <div className="mt-6"><EmptyState icon="video_library" title="Bộ từ đang chờ thêm video" description="Các trò chơi dùng ký hiệu có video đã xuất bản. Hãy chọn bộ lọc khác hoặc quay lại khi nội dung đã được bổ sung."><Link to="/tu-dien-ky-hieu" className="review-button review-button--quiet"><Icon name="menu_book" />Khám phá từ điển</Link></EmptyState></div>}
      <section className="review-session" aria-labelledby="review-session-title"><div><p className="theme-eyebrow">TỪNG CHÚT MỘT, MỖI NGÀY</p><h2 id="review-session-title">Nhịp ôn tập hôm nay</h2><p>{results.length ? 'Những lượt chơi bạn vừa hoàn thành trong phiên này.' : 'Hoàn thành một lượt chơi để bắt đầu ghi nhận kết quả trong phiên này.'}</p></div><div className="review-session-stats"><div><Icon name="flag" /><strong>{results.length}</strong><span>Lượt hoàn thành</span></div><div><Icon name="check_circle" /><strong>{summary.correct}</strong><span>Trả lời / ghép đúng</span></div><div><Icon name="track_changes" /><strong>{summary.correct + summary.mistakes > 0 ? `${Math.round(summary.correct / (summary.correct + summary.mistakes) * 100)}%` : '—'}</strong><span>Tỷ lệ đúng</span></div></div><p className="review-session-note">Kết quả trong phiên này, chưa đồng bộ vào tiến độ tài khoản.</p></section>
      <div className="review-learning-note"><Icon name="lightbulb" /><p>Chưa nhớ một ký hiệu? Cứ xem lại video và thử tiếp. Không cần nhanh hơn ai, chỉ cần tiến bộ hơn hôm qua.</p></div>
    </div>
  </div>;
}
