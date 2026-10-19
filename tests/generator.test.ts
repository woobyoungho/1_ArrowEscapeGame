import { describe, expect, it } from 'vitest';
import { generateBoard } from '../src/core/generator';
import { getLevel } from '../src/core/levels';
import { solve } from '../src/core/solver';
import { Board } from '../src/core/types';

describe('레벨 생성', () => {
  it('같은 시드는 같은 판을 만든다', () => {
    const a = generateBoard({ width: 6, height: 6, fill: 0.8, seed: 42 });
    const b = generateBoard({ width: 6, height: 6, fill: 0.8, seed: 42 });
    expect(a).toEqual(b);
  });

  it('생성된 판은 항상 풀 수 있다', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const board = generateBoard({ width: 7, height: 8, fill: 0.85, seed });
      expect(solve(board).solvable).toBe(true);
    }
  });

  it('블록이 겹치지 않는다', () => {
    const board = generateBoard({ width: 8, height: 10, fill: 0.85, seed: 7 });
    const keys = board.blocks.map((b) => `${b.x},${b.y}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('레벨 1~30을 모두 만들 수 있다', () => {
    for (let level = 1; level <= 30; level++) {
      const board = getLevel(level);
      expect(board.blocks.length).toBeGreaterThan(0);
      expect(solve(board).solvable).toBe(true);
    }
  });
});

describe('솔버', () => {
  it('서로 막고 있는 판은 풀 수 없다', () => {
    const board: Board = {
      width: 2,
      height: 1,
      blocks: [
        { id: 1, x: 0, y: 0, dir: 'right' },
        { id: 2, x: 1, y: 0, dir: 'left' },
      ],
    };
    expect(solve(board).solvable).toBe(false);
  });

  it('연쇄 깊이를 라운드로 센다', () => {
    const board: Board = {
      width: 3,
      height: 1,
      blocks: [
        { id: 1, x: 0, y: 0, dir: 'right' },
        { id: 2, x: 1, y: 0, dir: 'right' },
        { id: 3, x: 2, y: 0, dir: 'right' },
      ],
    };
    expect(solve(board)).toEqual({ solvable: true, rounds: 3, initialFree: 1 });
  });
});
