import { generateBoard } from './generator';
import { solve } from './solver';
import { Board } from './types';

export interface LevelConfig {
  width: number;
  height: number;
  fill: number;
  chain: number;
  inward: number;
  /** 목표 연쇄 깊이 */
  targetRounds: number;
  /** 목표: 시작 시 빠질 수 있는 블록 비율 */
  targetFreeRatio: number;
}

const ATTEMPTS = 30;

/** 5레벨마다 한 번은 쉬어 가는 레벨 (4레벨 전 난이도) */
export function isRestLevel(level: number): boolean {
  return level % 5 === 0;
}

/**
 * 레벨 번호를 실제 난이도 단계로 바꾼다. 쉬어 가는 레벨은 낮아진다.
 * 레벨 1~2만 튜토리얼이고, 그 뒤로는 레벨당 1.5단계씩 빠르게 어려워진다.
 */
export function effectiveDifficulty(level: number): number {
  const n = isRestLevel(level) ? Math.max(1, level - 4) : level;
  return n <= 2 ? n : 2 + (n - 2) * 1.5;
}

export function levelConfig(level: number): LevelConfig {
  const e = effectiveDifficulty(level);
  const rest = isRestLevel(level);
  const width = Math.min(9, 3 + Math.floor(e / 4));
  const height = Math.min(12, width + Math.floor(e / 6));
  // 판 크기가 최대에 도달한 뒤에도 쉬어 가는 레벨이 확실히 쉽도록, 채우는 비율과 연쇄 목표를 따로 낮춘다.
  // 큰 판은 구조상 70%대 이상 채우기 어려워서, 쉬어 가는 레벨은 크게 낮춰야 차이가 난다
  return {
    width,
    height,
    fill: Math.min(0.9, 0.65 + e * 0.012) - (rest ? 0.3 : 0),
    chain: Math.min(0.9, 0.2 + e * 0.04) * (rest ? 0.5 : 1),
    inward: Math.min(0.9, 0.3 + e * 0.04) * (rest ? 0.5 : 1),
    targetRounds: Math.max(2, Math.min(16, 2 + Math.floor(e / 2)) - (rest ? 3 : 0)),
    targetFreeRatio: Math.max(0.12, 0.5 - e * 0.012) + (rest ? 0.1 : 0),
  };
}

/** 레벨 번호를 시드로 여러 후보를 만들고, 목표 난이도에 가장 가까운 판을 고른다 */
export function getLevel(level: number): Board {
  const cfg = levelConfig(level);
  let best: Board | null = null;
  let bestScore = Infinity;
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const board = generateBoard({ ...cfg, seed: level * 7919 + attempt * 104729 });
    if (board.blocks.length === 0) continue;
    const result = solve(board);
    if (!result.solvable) continue;
    const freeRatio = result.initialFree / board.blocks.length;
    const score =
      Math.abs(result.rounds - cfg.targetRounds) * 2 + Math.abs(freeRatio - cfg.targetFreeRatio) * 10;
    if (score < bestScore) {
      best = board;
      bestScore = score;
    }
  }
  return best!;
}
