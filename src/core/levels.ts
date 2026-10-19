import { generateBoard } from './generator';
import { solve } from './solver';
import { Board } from './types';

interface LevelConfig {
  width: number;
  height: number;
  fill: number;
}

export function levelConfig(level: number): LevelConfig {
  if (level <= 2) return { width: 4, height: 4, fill: 0.7 };
  if (level <= 5) return { width: 5, height: 5, fill: 0.75 };
  if (level <= 10) return { width: 6, height: 6, fill: 0.8 };
  if (level <= 20) return { width: 7, height: 8, fill: 0.82 };
  return { width: 8, height: 10, fill: 0.85 };
}

/** 레벨 번호를 시드로 여러 후보를 만들고, 블록이 많고 연쇄가 깊은 판을 고른다 */
export function getLevel(level: number): Board {
  const cfg = levelConfig(level);
  let best: Board | null = null;
  let bestScore = -1;
  for (let attempt = 0; attempt < 12; attempt++) {
    const board = generateBoard({ ...cfg, seed: level * 7919 + attempt * 104729 });
    const result = solve(board);
    if (!result.solvable) continue;
    const score = board.blocks.length * 10 + result.rounds;
    if (score > bestScore) {
      best = board;
      bestScore = score;
    }
  }
  return best!;
}
