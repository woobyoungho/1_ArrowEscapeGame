import { describe, expect, it } from 'vitest';
import { getLevel, isRestLevel } from '../src/core/levels';
import { solve } from '../src/core/solver';

const rounds = (level: number) => solve(getLevel(level)).rounds;
const average = (levels: number[]) => levels.reduce((sum, n) => sum + rounds(n), 0) / levels.length;
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

describe('난이도 곡선', () => {
  it('레벨 1은 3x3 튜토리얼 판이다', () => {
    const board = getLevel(1);
    expect([board.width, board.height]).toEqual([3, 3]);
  });

  it('같은 레벨은 항상 같은 판이다', () => {
    expect(getLevel(17)).toEqual(getLevel(17));
  });

  it('후반 레벨은 초반보다 연쇄가 훨씬 깊다', () => {
    expect(average(range(21, 30))).toBeGreaterThan(average(range(1, 10)) * 2);
  });

  it('쉬어 가는 레벨은 직전 레벨보다 블록이 적다', () => {
    for (const level of [5, 10, 15, 20, 25, 30, 35, 40]) {
      expect(isRestLevel(level)).toBe(true);
      expect(getLevel(level).blocks.length).toBeLessThan(getLevel(level - 1).blocks.length);
    }
  });
});
