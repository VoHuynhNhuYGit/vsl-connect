import { useEffect, useMemo, useRef, useState } from 'react';
import type { Sign } from '../../services/api';
import { Icon } from '../../components/ui/Icon';
import { answerOptions, shuffle, type RoundResult } from './gameLogic';
import { Feedback, GameFrame, GameStat, RoundSummary } from './GameShared';
import { SignVideo } from './SignVideo';
import { useGameClock, useGamePause, useReportResult } from './useGameClock';

function BlastQuestion({ sign, deck, paused, timed, resolved, onAnswer }: { sign: Sign; deck: Sign[]; paused: boolean; timed: boolean; resolved: boolean; onAnswer: (correct: boolean, timeout: boolean) => void }) {
  const [options] = useState(() => answerOptions(deck, sign));
  const [ready, setReady] = useState(false);
  const [viewed, setViewed] = useState(false);
  const [remaining, setRemaining] = useState(20);
  const lock = useRef(false);
  useEffect(() => {
    if (!timed || !viewed || !ready || paused || resolved || remaining <= 0) return;
    const timer = window.setInterval(() => setRemaining(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [timed, viewed, ready, paused, resolved, remaining]);
  useEffect(() => {
    if (remaining === 0 && !paused && !resolved && !lock.current) { lock.current = true; onAnswer(false, true); }
  }, [remaining, paused, resolved, onAnswer]);

  return <div className="blast-layout"><div className="review-question"><p className="review-step">Quan sát đôi tay. Chọn đúng từ để phá thiên thạch!</p><SignVideo sign={sign} paused={paused || resolved} onReady={setReady} onViewed={() => setViewed(true)} /><div className="blast-timer"><Icon name="timer" /><span>{!timed ? 'Nhịp thoải mái · Không giới hạn thời gian' : !viewed ? 'Xem hết video lần đầu, rồi bắt đầu tính giờ.' : `${remaining} giây để chọn đáp án`}</span></div>{timed && <div className="review-round-progress" role="progressbar" aria-label="Thời gian trả lời còn lại" aria-valuemin={0} aria-valuemax={20} aria-valuenow={remaining}><span style={{ width: `${remaining / 20 * 100}%` }} /></div>}</div>
    <div className={`blast-space ${resolved ? 'blast-space--resolved' : ''}`}><span className="blast-space-orbit" aria-hidden="true" /><p className="blast-space-caption">CHỌN MỤC TIÊU</p><div className="blast-targets" role="group" aria-label="Thiên thạch đáp án">{options.map((option, index) => <button key={option.id} type="button" className={`blast-target blast-target--${index}`} disabled={paused || resolved || !ready} onClick={() => { if (!lock.current) { lock.current = true; onAnswer(option.id === sign.id, false); } }}><span className="blast-target-number">0{index + 1}</span><strong>{option.label}</strong><Icon name="my_location" /></button>)}</div><div className="blast-launcher" aria-hidden="true"><Icon name={resolved ? 'flare' : 'rocket_launch'} className="text-[36px]" /><span>{resolved ? 'Đã nhận kết quả' : 'Sẵn sàng kết nối'}</span></div></div>
  </div>;
}

export function BlastGame({ deck, timed, onComplete, onReplay, onExit }: { deck: Sign[]; timed: boolean; onComplete: (result: RoundResult) => void; onReplay: () => void; onExit: () => void }) {
  const [order] = useState(() => shuffle(deck));
  const rounds = useMemo(() => Array.from({ length: 10 }, (_, index) => order[index % order.length]), [order]);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [review, setReview] = useState<Sign[]>([]);
  const [feedback, setFeedback] = useState<{ correct: boolean; timeout: boolean } | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  const { paused, setPaused } = useGamePause();
  const seconds = useGameClock(!paused && !result);
  const responseLock = useRef(false);
  useReportResult(result, onComplete);
  const sign = rounds[index];

  function answer(isCorrect: boolean, timeout: boolean) {
    if (responseLock.current || paused) return;
    responseLock.current = true;
    setFeedback({ correct: isCorrect, timeout });
    if (isCorrect) { setCorrect(value => value + 1); setScore(value => value + 100 + Math.min(combo, 5) * 20); setCombo(value => value + 1); }
    else { setMistakes(value => value + 1); setCombo(0); setReview(value => value.some(item => item.id === sign.id) ? value : [...value, sign]); }
  }
  function next() {
    if (!feedback || paused) return;
    if (index === rounds.length - 1 || mistakes >= 3) setResult({ mode: 'blast', score, correct, mistakes, seconds, review });
    else { responseLock.current = false; setIndex(value => value + 1); setFeedback(null); }
  }
  if (result) return <RoundSummary result={result} onReplay={onReplay} onExit={onExit} />;
  return <GameFrame title="Blast" instruction="Chọn thiên thạch có nghĩa đúng với video. Hoàn thành 10 câu trước khi dùng hết 3 lượt bảo vệ." paused={paused} onPause={() => setPaused(!paused)} onExit={onExit}
    stats={<><GameStat label="Điểm" value={score} /><GameStat label="Câu hỏi" value={`${index + 1} / ${rounds.length}`} /><GameStat label="Lượt bảo vệ" value={`${Math.max(0, 3 - mistakes)} / 3`} /><GameStat label="Chuỗi trả lời đúng" value={combo} /></>}>
    <BlastQuestion key={index} sign={sign} deck={deck} paused={paused} timed={timed} resolved={!!feedback} onAnswer={answer} />
    {feedback && <div className="blast-response"><Feedback success={feedback.correct}>{feedback.correct ? `Chính xác! “${sign.label}”. Tiếp tục giữ nhịp nhé.` : `${feedback.timeout ? 'Hết giờ.' : 'Chưa đúng.'} Ký hiệu vừa rồi là “${sign.label}”.`}</Feedback><button type="button" className="review-button" onClick={next}>{index === rounds.length - 1 || mistakes >= 3 ? 'Xem kết quả' : 'Câu tiếp theo'}<Icon name="arrow_forward" /></button></div>}
  </GameFrame>;
}
