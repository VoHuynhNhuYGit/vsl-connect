import { useEffect, useRef, type ReactNode } from 'react';
import type { Sign } from '../../services/api';
import { Icon } from '../../components/ui/Icon';
import { formatTime, type RoundResult } from './gameLogic';

export const gameNames = { blocks: 'Khối hộp', match: 'Ghép thẻ', blast: 'Blast' };

export function GameFrame({ title, instruction, paused, onPause, onExit, children, stats }: { title: string; instruction: string; paused: boolean; onPause: () => void; onExit: () => void; children: ReactNode; stats: ReactNode }) {
  return <section className="review-game" aria-label={`Trò chơi ${title}`}>
    <div className="review-game-heading"><div><p className="theme-eyebrow">VỪA CHƠI · VỪA GHI NHỚ</p><h2 tabIndex={-1}>{title}</h2><p>{instruction}</p></div><div className="review-game-actions"><button type="button" className="review-button review-button--quiet" onClick={onPause} aria-pressed={paused}><Icon name={paused ? 'play_arrow' : 'pause'} />{paused ? 'Tiếp tục' : 'Tạm dừng'}</button><button type="button" className="review-button review-button--quiet" onClick={onExit}><Icon name="close" />Rời trò chơi</button></div></div>
    <div className="review-game-stats">{stats}</div>
    <div className="review-play-area"><fieldset disabled={paused} className="review-interaction" aria-label="Khu vực chơi">{children}</fieldset>{paused && <div className="review-pause"><Icon name="pause_circle" className="text-[40px]" /><h3>Thư giãn một chút</h3><p>Trò chơi và thời gian đã tạm dừng.</p><button type="button" className="review-button" onClick={onPause}>Tiếp tục chơi</button></div>}</div>
  </section>;
}

export function GameStat({ label, value }: { label: string; value: ReactNode }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

export function AnswerButtons({ options, onAnswer, disabled, rejected = [] }: { options: Sign[]; onAnswer: (sign: Sign) => void; disabled: boolean; rejected?: number[] }) {
  return <div className="review-answers" role="group" aria-label="Chọn nghĩa của ký hiệu">{options.map((sign, index) => <button key={sign.id} type="button" disabled={disabled || rejected.includes(sign.id)} onClick={() => onAnswer(sign)} className={`review-answer ${rejected.includes(sign.id) ? 'review-answer--wrong' : ''}`}><span>{index + 1}</span>{sign.label}</button>)}</div>;
}

export function Feedback({ success, children }: { success: boolean; children: ReactNode }) {
  return <p className={`review-feedback ${success ? 'review-feedback--success' : 'review-feedback--error'}`} role="status"><Icon name={success ? 'check_circle' : 'info'} />{children}</p>;
}

export function RoundSummary({ result, onReplay, onExit }: { result: RoundResult; onReplay: () => void; onExit: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return <section className="review-summary" aria-label="Kết quả lượt chơi"><div className="review-summary-medal"><Icon name="emoji_events" className="text-[40px]" /></div><p className="theme-eyebrow">HOÀN THÀNH LƯỢT {gameNames[result.mode].toLocaleUpperCase('vi-VN')}</p><h2 ref={heading} tabIndex={-1}>Thêm một bước tiến nhỏ!</h2><p>Mỗi lần nhớ lại là một lần ghi nhớ sâu hơn.</p><div className="review-game-stats"><GameStat label="Điểm trò chơi" value={result.score} /><GameStat label="Trả lời đúng" value={result.correct} /><GameStat label="Lượt sai / bỏ lỡ" value={result.mistakes} /><GameStat label="Thời gian" value={formatTime(result.seconds)} /></div>
    {result.review.length > 0 && <div className="review-summary-words"><h3>Dành thêm một chút thời gian cho</h3><div>{result.review.map(sign => <span key={sign.id}>{sign.label}<small>{sign.region}</small></span>)}</div><p>Bạn có thể xem lại video của các từ này trong Từ điển.</p></div>}
    <div className="review-summary-actions"><button type="button" className="review-button" onClick={onReplay}><Icon name="replay" />Chơi lại</button><button type="button" className="review-button review-button--quiet" onClick={onExit}>Chọn trò khác<Icon name="arrow_forward" /></button></div><p className="review-session-note">Kết quả trong phiên này, chưa đồng bộ vào tiến độ tài khoản.</p>
  </section>;
}
