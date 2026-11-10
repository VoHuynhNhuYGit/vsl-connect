import test from 'node:test';
import assert from 'node:assert/strict';
import { answerOptions, canPlace, hasMove, placePiece, playableSigns, shuffle } from '../src/features/review/gameLogic.ts';

const sign = (id, label, video_url = '/test-only.mp4') => ({ id, label, video_url, topic: 'Test only', region: 'Test only', description: '', source: null });

test('review deck requires a video and distinct normalized Vietnamese labels', () => {
  const deck = playableSigns([sign(1, 'Xin chào'), sign(2, ' XIN CHÀO '), sign(3, 'Cảm ơn'), sign(4, 'Cảm ơn'), sign(5, 'Thiếu video', null), sign(6, '  ')]);
  assert.deepEqual(deck.map(item => item.id), [1, 3]);
});

test('answer options include the correct sign exactly once without changing the source deck', () => {
  const deck = Array.from({ length: 8 }, (_, id) => sign(id, `Test ${id}`));
  const snapshot = [...deck];
  for (let i = 0; i < 20; i++) {
    const options = answerOptions(deck, deck[3]);
    assert.equal(options.length, 4);
    assert.equal(options.filter(item => item.id === 3).length, 1);
    assert.equal(new Set(options.map(item => item.id)).size, 4);
  }
  assert.deepEqual(deck, snapshot);
  assert.deepEqual(shuffle([1, 2, 3], () => 0), [2, 3, 1]);
});

test('pieces cannot wrap across grid edges or overlap occupied cells', () => {
  const board = Array(36).fill(0);
  assert.equal(canPlace(board, [[0, 0], [0, 1]], 0, 5), false);
  assert.equal(canPlace(board, [[0, 0]], -1, 0), false);
  board[0] = 1;
  assert.equal(canPlace(board, [[0, 0]], 0, 0), false);
  assert.equal(placePiece(board, [[0, 0]], 0, 0, 2), null);
});

test('crossing row and column clear simultaneously and keep the source board unchanged', () => {
  const board = Array(36).fill(0);
  for (let i = 1; i < 6; i++) { board[i] = 1; board[i * 6] = 2; }
  const snapshot = [...board];
  const result = placePiece(board, [[0, 0]], 0, 0, 3);
  assert.equal(result.lines, 2);
  assert.equal(result.cleared.length, 11);
  assert.ok(result.board.every(value => value === 0));
  assert.deepEqual(board, snapshot);
});

test('game over checks every piece and every anchor', () => {
  const board = Array(36).fill(1); board[35] = 0;
  assert.equal(hasMove(board, [[[0, 0], [0, 1]]]), false);
  assert.equal(hasMove(board, [[[0, 0], [0, 1]], [[0, 0]]]), true);
  assert.equal(hasMove(Array(36).fill(1), [[[0, 0]]]), false);
});
