import { freeBlocks } from './board';
import { Board } from './types';

export interface SolveResult {
  solvable: boolean;
  /** 지금 빠질 수 있는 블록을 한꺼번에 빼는 라운드 수. 연쇄 의존의 깊이 */
  rounds: number;
  /** 시작 시점에 탈출 가능한 블록 수 */
  initialFree: number;
}

/**
 * 블록을 빼면 길이 열리기만 하고 막히지는 않으므로,
 * 빠질 수 있는 블록을 반복해서 모두 빼는 것만으로 정확히 풀 수 있다.
 */
export function solve(board: Board): SolveResult {
  let blocks = board.blocks;
  const initialFree = freeBlocks(board).length;
  let rounds = 0;
  while (blocks.length > 0) {
    const free = freeBlocks({ ...board, blocks });
    if (free.length === 0) return { solvable: false, rounds, initialFree };
    const freeIds = new Set(free.map((b) => b.id));
    blocks = blocks.filter((b) => !freeIds.has(b.id));
    rounds++;
  }
  return { solvable: true, rounds, initialFree };
}
