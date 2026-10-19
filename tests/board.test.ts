import { describe, expect, it } from 'vitest';
import { canEscape, freeBlocks, pathCells } from '../src/core/board';
import { newGame, tap } from '../src/core/game';
import { Board } from '../src/core/types';

const board: Board = {
  width: 3,
  height: 3,
  blocks: [
    { id: 1, x: 0, y: 1, dir: 'right' }, // 2번에 막힘
    { id: 2, x: 1, y: 1, dir: 'up' }, // 위로 바로 탈출 가능
    { id: 3, x: 2, y: 2, dir: 'down' }, // 아래로 바로 탈출 가능
  ],
};

describe('이동 규칙', () => {
  it('경로는 블록 앞 칸부터 판 끝까지다', () => {
    expect(pathCells(board, board.blocks[0])).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 1 },
    ]);
  });

  it('경로에 블록이 있으면 탈출할 수 없다', () => {
    expect(canEscape(board, board.blocks[0])).toBe(false);
  });

  it('판 가장자리에서 바깥을 향한 블록은 바로 탈출한다', () => {
    expect(canEscape(board, board.blocks[2])).toBe(true);
  });

  it('지금 탈출 가능한 블록을 찾는다', () => {
    expect(freeBlocks(board).map((b) => b.id)).toEqual([2, 3]);
  });
});

describe('탭', () => {
  it('탈출 가능한 블록을 탭하면 사라진다', () => {
    const { state, result } = tap(newGame(board), 1, 1);
    expect(result.kind).toBe('escaped');
    expect(state.board.blocks.map((b) => b.id)).toEqual([1, 3]);
  });

  it('막힌 블록을 탭하면 하트가 줄고 블록은 남는다', () => {
    const { state, result } = tap(newGame(board), 0, 1);
    expect(result.kind).toBe('blocked');
    expect(state.hearts).toBe(2);
    expect(state.board.blocks).toHaveLength(3);
  });

  it('빈 칸을 탭하면 아무 일도 없다', () => {
    const start = newGame(board);
    const { state, result } = tap(start, 0, 0);
    expect(result.kind).toBe('ignored');
    expect(state).toBe(start);
  });

  it('하트를 모두 잃으면 실패한다', () => {
    let s = newGame(board);
    for (let i = 0; i < 3; i++) s = tap(s, 0, 1).state;
    expect(s.status).toBe('failed');
  });

  it('블록을 모두 빼면 클리어한다', () => {
    let s = newGame(board);
    s = tap(s, 1, 1).state;
    s = tap(s, 0, 1).state;
    s = tap(s, 2, 2).state;
    expect(s.status).toBe('cleared');
    expect(s.hearts).toBe(3);
  });
});
