import type { Sign } from '../../services/api';

export type GameMode = 'blocks' | 'match' | 'blast';
export type RoundResult = { mode: GameMode; score: number; correct: number; mistakes: number; seconds: number; review: Sign[] };
export type Piece = readonly (readonly [number, number])[];
export const BOARD_SIZE = 6;
export const PIECES: readonly Piece[] = [
  [[0, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 0]],
  [[0, 0], [0, 1], [0, 2]], [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [1, 0], [1, 1]], [[0, 0], [0, 1], [1, 0]],
  [[0, 0], [0, 1], [1, 0], [1, 1]],
];

export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

export function playableSigns(signs: Sign[]): Sign[] {
  const labels = new Set<string>();
  return signs.filter(sign => {
    const key = sign.label.trim().normalize('NFC').toLocaleLowerCase('vi-VN');
    if (!key || !sign.video_url?.trim() || labels.has(key)) return false;
    labels.add(key);
    return true;
  });
}

export function answerOptions(deck: Sign[], current: Sign): Sign[] {
  return shuffle([current, ...shuffle(deck.filter(sign => sign.id !== current.id)).slice(0, 3)]);
}

export function canPlace(board: number[], piece: Piece, row: number, column: number): boolean {
  return piece.every(([dy, dx]) => row + dy >= 0 && column + dx >= 0
    && row + dy < BOARD_SIZE && column + dx < BOARD_SIZE
    && board[(row + dy) * BOARD_SIZE + column + dx] === 0);
}

export function hasMove(board: number[], pieces: Piece[]): boolean {
  return pieces.some(piece => board.some((_, index) => canPlace(board, piece, Math.floor(index / BOARD_SIZE), index % BOARD_SIZE)));
}

export function placePiece(board: number[], piece: Piece, row: number, column: number, color: number) {
  if (!canPlace(board, piece, row, column)) return null;
  const next = [...board];
  piece.forEach(([dy, dx]) => { next[(row + dy) * BOARD_SIZE + column + dx] = color; });
  const rows = Array.from({ length: BOARD_SIZE }, (_, y) => y).filter(y => next.slice(y * BOARD_SIZE, (y + 1) * BOARD_SIZE).every(Boolean));
  const columns = Array.from({ length: BOARD_SIZE }, (_, x) => x).filter(x => Array.from({ length: BOARD_SIZE }, (_, y) => next[y * BOARD_SIZE + x]).every(Boolean));
  // Find all completed lines before clearing so intersections count correctly.
  const cleared = next.map((_, index) => index).filter(index => rows.includes(Math.floor(index / BOARD_SIZE)) || columns.includes(index % BOARD_SIZE));
  cleared.forEach(index => { next[index] = 0; });
  return { board: next, lines: rows.length + columns.length, cleared };
}

export function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
}
