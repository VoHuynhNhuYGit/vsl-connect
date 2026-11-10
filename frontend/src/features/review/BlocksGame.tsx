import { useMemo, useRef, useState } from 'react';
import type { Sign } from '../../services/api';
import { Icon } from '../../components/ui/Icon';
import { answerOptions, BOARD_SIZE, canPlace, formatTime, hasMove, PIECES, placePiece, shuffle, type Piece, type RoundResult } from './gameLogic';
import { AnswerButtons, Feedback, GameFrame, GameStat, RoundSummary } from './GameShared';
import { SignVideo } from './SignVideo';
import { useGameClock, useGamePause, useReportResult } from './useGameClock';

type BlockPiece = { shape: Piece; color: number };
type State = { board: number[]; pieces: BlockPiece[]; selected: number; question: number; score: number; correct: number; mistakes: number; lines: number; placing: boolean; review: Sign[]; rejected: number[]; message: string; success: boolean; cleared: number[] };

export function PiecePreview({ piece }: { piece: Piece }) {
  const width = Math.max(...piece.map(point => point[1])) + 1;
  const height = Math.max(...piece.map(point => point[0])) + 1;
  return <span className="block-piece-preview" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${width}, 16px)`, gridTemplateRows: `repeat(${height}, 16px)` }}>{piece.map(([row, column]) => <span key={`${row}-${column}`} style={{ gridRow: row + 1, gridColumn: column + 1 }} />)}</span>;
}

export function BlocksGame({ deck, onComplete, onReplay, onExit }: { deck: Sign[]; onComplete: (result: RoundResult) => void; onReplay: () => void; onExit: () => void }) {
  const [order] = useState(() => shuffle(deck));
  const [state, setState] = useState<State>(() => ({ board: Array(36).fill(0) as number[], pieces: [], selected: 0, question: 0, score: 0, correct: 0, mistakes: 0, lines: 0, placing: false, review: [], rejected: [], message: '', success: true, cleared: [] }));
  const [ready, setReady] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  const answerLock = useRef(false);
  const { paused, setPaused } = useGamePause();
  const seconds = useGameClock(!paused && !result);
  useReportResult(result, onComplete);
  const sign = order[state.question % order.length];
  const options = useMemo(() => answerOptions(deck, sign), [deck, sign, state.question]);

  function finish(next = state) {
    setResult({ mode: 'blocks', score: next.score, correct: next.correct, mistakes: next.mistakes, seconds, review: next.review });
  }
  function answer(chosen: Sign) {
    if (!ready || paused || state.placing || answerLock.current || state.rejected.includes(chosen.id)) return;
    if (chosen.id !== sign.id) {
      setState({ ...state, mistakes: state.mistakes + 1, rejected: [...state.rejected, chosen.id], review: state.review.some(item => item.id === sign.id) ? state.review : [...state.review, sign], message: 'Chưa đúng. Xem lại video và thử một đáp án khác nhé.', success: false });
      return;
    }
    answerLock.current = true;
    const pieces = Array.from({ length: 3 }, (_, index) => ({ shape: PIECES[Math.floor(Math.random() * PIECES.length)], color: index + 1 }));
    const next = { ...state, pieces, selected: 0, correct: state.correct + 1, score: state.score + 50, placing: true, message: 'Đúng rồi! Bạn nhận được 3 khối. Hãy đặt chúng lên bảng.', success: true };
    setState(next);
    if (!hasMove(next.board, pieces.map(piece => piece.shape))) finish(next);
  }
  function place(index: number) {
    if (paused || !state.placing) return;
    const piece = state.pieces[state.selected];
    if (!piece) return;
    const placed = placePiece(state.board, piece.shape, Math.floor(index / BOARD_SIZE), index % BOARD_SIZE, piece.color);
    if (!placed) { setState({ ...state, message: 'Khối chưa vừa ở ô này. Hãy chọn một vị trí trống khác.', success: false }); return; }
    const pieces = state.pieces.filter((_, pieceIndex) => pieceIndex !== state.selected);
    const next = { ...state, board: placed.board, pieces, selected: 0, cleared: placed.cleared, score: state.score + piece.shape.length * 10 + placed.lines * 100, lines: state.lines + placed.lines,
      message: placed.lines ? `Tuyệt! Bạn vừa xóa ${placed.lines} hàng / cột.` : 'Đã đặt khối. Tiếp tục nhé!', success: true };
    setHover(null);
    if (pieces.length === 0) {
      next.placing = false; next.question += 1; next.rejected = [];
      next.message = placed.lines ? `${next.message} Xem video tiếp theo để nhận thêm khối.` : 'Xem video tiếp theo để nhận thêm 3 khối.';
      setReady(false); answerLock.current = false;
    }
    setState(next);
    if (pieces.length > 0 && !hasMove(placed.board, pieces.map(item => item.shape))) finish(next);
  }

  if (result) return <RoundSummary result={result} onReplay={onReplay} onExit={onExit} />;
  const selected = state.pieces[state.selected];
  const preview = hover !== null && selected ? selected.shape.map(([dy, dx]) => (Math.floor(hover / 6) + dy) * 6 + hover % 6 + dx) : [];
  const valid = hover !== null && selected ? canPlace(state.board, selected.shape, Math.floor(hover / 6), hover % 6) : false;
  return <GameFrame title="Khối hộp" instruction="Xem video, trả lời đúng để nhận 3 khối. Lấp đầy một hàng hoặc cột để xóa và ghi điểm." paused={paused} onPause={() => setPaused(!paused)} onExit={onExit}
    stats={<><GameStat label="Điểm" value={state.score} /><GameStat label="Hàng / cột đã xóa" value={state.lines} /><GameStat label="Trả lời đúng" value={state.correct} /><GameStat label="Thời gian" value={formatTime(seconds)} /></>}>
    <div className="blocks-layout"><div className="review-question"><p className="review-step">Câu hỏi {state.question + 1} · Ký hiệu này có nghĩa là gì?</p><SignVideo key={`${sign.id}-${state.question}`} sign={sign} paused={paused || state.placing} onReady={setReady} /><AnswerButtons options={options} onAnswer={answer} disabled={!ready || state.placing || paused} rejected={state.rejected} />{state.message && <Feedback success={state.success}>{state.message}</Feedback>}</div>
      <div className="blocks-puzzle"><div className="blocks-board" role="group" aria-label="Bảng khối hộp 6 hàng 6 cột">{state.board.map((color, index) => <button key={index} type="button" aria-label={`Ô hàng ${Math.floor(index / 6) + 1} cột ${index % 6 + 1}${color ? ', đã có khối' : ', trống'}`} disabled={paused || !state.placing || !!color} data-color={color} className={`${preview.includes(index) ? valid ? 'block-preview-valid' : 'block-preview-invalid' : ''} ${state.cleared.includes(index) ? 'block-cleared' : ''}`} onClick={() => place(index)} onMouseEnter={() => setHover(index)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(index)} onBlur={() => setHover(null)} />)}</div>
        <p className="blocks-hint">{state.placing ? 'Chọn khối, rồi chọn ô đặt góc trên bên trái.' : 'Trả lời câu hỏi để mở khay khối.'}</p>
        <div className="blocks-tray" role="group" aria-label="Khay khối">{state.pieces.length ? state.pieces.map((piece, index) => <button type="button" key={index} aria-label={`Chọn khối ${index + 1}, ${piece.shape.length} ô`} aria-pressed={state.selected === index} onClick={() => { setState({ ...state, selected: index }); setHover(null); }} data-color={piece.color}><PiecePreview piece={piece.shape} /></button>) : <span><Icon name="lock_open" />Khay đang chờ 3 khối mới</span>}</div>
        <button type="button" className="review-button review-button--quiet blocks-finish" onClick={() => finish()}>Kết thúc lượt<Icon name="flag" /></button>
      </div></div>
  </GameFrame>;
}
