import { useEffect, useRef, useState } from 'react';
import type { Sign } from '../../services/api';
import { Icon } from '../../components/ui/Icon';
import { formatTime, shuffle, type RoundResult } from './gameLogic';
import { GameFrame, GameStat, RoundSummary } from './GameShared';
import { SignVideo } from './SignVideo';
import { useGameClock, useGamePause, useReportResult } from './useGameClock';

type Tile = { sign: Sign; kind: 'video' | 'word'; number: number; key: string };

function VideoTile({ tile, selected, disabled, paused, onSelect }: { tile: Tile; selected: boolean; disabled: boolean; paused: boolean; onSelect: () => void }) {
  const [ready, setReady] = useState(false);
  return <><SignVideo sign={tile.sign} number={tile.number} compact paused={paused} onReady={setReady} /><button type="button" className="match-video-select" disabled={disabled || !ready} aria-pressed={selected} onClick={onSelect}><Icon name={selected ? 'check_circle' : 'touch_app'} />{selected ? `Đã chọn video ${tile.number}` : `Chọn video ${tile.number}`}</button></>;
}

export function MatchGame({ deck, onComplete, onReplay, onExit }: { deck: Sign[]; onComplete: (result: RoundResult) => void; onReplay: () => void; onExit: () => void }) {
  const [sample] = useState(() => shuffle(deck).slice(0, 6));
  const [tiles] = useState<Tile[]>(() => shuffle(sample.flatMap((sign, index) => ([{ sign, kind: 'video' as const, number: index + 1, key: `video-${sign.id}` }, { sign, kind: 'word' as const, number: index + 1, key: `word-${sign.id}` }]))));
  const [selected, setSelected] = useState<Tile | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [mismatch, setMismatch] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [review, setReview] = useState<Sign[]>([]);
  const [message, setMessage] = useState('Xem một video rồi chọn thẻ video và từ tương ứng.');
  const [result, setResult] = useState<RoundResult | null>(null);
  const resetTimer = useRef<number>();
  const { paused, setPaused } = useGamePause();
  const elapsed = useGameClock(!paused && !result);
  useReportResult(result, onComplete);
  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  function choose(tile: Tile) {
    if (paused || mismatch.length || matched.includes(tile.sign.id)) return;
    if (!selected || selected.kind === tile.kind) {
      setSelected(selected?.key === tile.key ? null : tile);
      setMessage(tile.kind === 'video' ? 'Đã chọn video. Hãy chọn từ tương ứng.' : 'Đã chọn từ. Hãy tìm video tương ứng.');
      return;
    }
    if (selected.sign.id === tile.sign.id) {
      const next = [...matched, tile.sign.id];
      setMatched(next); setSelected(null); setMessage(`Chính xác! Đã ghép ${next.length} / ${sample.length} cặp.`);
      if (next.length === sample.length) setResult({ mode: 'match', score: Math.max(0, next.length * 100 - mistakes * 15), correct: next.length, mistakes, seconds: elapsed + mistakes * 3, review });
    } else {
      const videoSign = tile.kind === 'video' ? tile.sign : selected.sign;
      setMistakes(value => value + 1);
      setReview(value => value.some(sign => sign.id === videoSign.id) ? value : [...value, videoSign]);
      setMismatch([selected.key, tile.key]); setMessage('Chưa khớp. Cộng 3 giây; hãy quan sát lại nhé.');
      resetTimer.current = window.setTimeout(() => { setMismatch([]); setSelected(null); }, 750);
    }
  }

  if (result) return <RoundSummary result={result} onReplay={onReplay} onExit={onExit} />;
  return <GameFrame title="Ghép thẻ" instruction="Xem video và ghép với từ tương ứng. Ghép hết các cặp để hoàn thành; mỗi lượt sai cộng 3 giây." paused={paused} onPause={() => setPaused(!paused)} onExit={onExit}
    stats={<><GameStat label="Đã ghép" value={`${matched.length} / ${sample.length}`} /><GameStat label="Thời gian" value={formatTime(elapsed + mistakes * 3)} /><GameStat label="Ghép sai" value={mistakes} /><GameStat label="Điểm hiện tại" value={Math.max(0, matched.length * 100 - mistakes * 15)} /></>}>
    <p className="match-status" role="status">{message}</p><div className="match-grid">{tiles.map(tile => {
      const found = matched.includes(tile.sign.id);
      return <div key={tile.key} data-kind={tile.kind} className={`match-tile ${selected?.key === tile.key ? 'match-tile--selected' : ''} ${mismatch.includes(tile.key) ? 'match-tile--wrong' : ''} ${found ? 'match-tile--done' : ''}`}>
        {found ? <div className="match-found"><Icon name="check_circle" /><strong>{tile.sign.label}</strong><span>Đã ghép</span></div> : tile.kind === 'video'
          ? <VideoTile tile={tile} selected={selected?.key === tile.key} disabled={paused || !!mismatch.length} paused={paused} onSelect={() => choose(tile)} />
          : <button type="button" className="match-word" disabled={paused || !!mismatch.length} aria-pressed={selected?.key === tile.key} onClick={() => choose(tile)}><span className="theme-eyebrow">TỪ VỰNG</span><strong>{tile.sign.label}</strong><Icon name="link" /></button>}
      </div>;
    })}</div><div className="review-round-progress" role="progressbar" aria-label="Tiến độ ghép thẻ" aria-valuemin={0} aria-valuemax={sample.length} aria-valuenow={matched.length}><span style={{ width: `${matched.length / sample.length * 100}%` }} /></div>
  </GameFrame>;
}
