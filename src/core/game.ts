import { blockAt, canEscape, isCleared, removeBlock } from './board';
import { Block, Board } from './types';

export const START_HEARTS = 3;

export type GameStatus = 'playing' | 'cleared' | 'failed';

export interface GameState {
  board: Board;
  hearts: number;
  moves: number;
  status: GameStatus;
}

export type TapResult =
  | { kind: 'escaped'; block: Block }
  | { kind: 'blocked'; block: Block }
  | { kind: 'ignored' };

export function newGame(board: Board): GameState {
  return { board, hearts: START_HEARTS, moves: 0, status: 'playing' };
}

/** 칸을 탭했을 때의 결과. 상태는 바꾸지 않고 새 상태를 돌려준다 */
export function tap(state: GameState, x: number, y: number): { state: GameState; result: TapResult } {
  if (state.status !== 'playing') return { state, result: { kind: 'ignored' } };

  const block = blockAt(state.board, x, y);
  if (!block) return { state, result: { kind: 'ignored' } };

  if (canEscape(state.board, block)) {
    const board = removeBlock(state.board, block.id);
    const next: GameState = {
      ...state,
      board,
      moves: state.moves + 1,
      status: isCleared(board) ? 'cleared' : 'playing',
    };
    return { state: next, result: { kind: 'escaped', block } };
  }

  const hearts = state.hearts - 1;
  const next: GameState = {
    ...state,
    hearts,
    moves: state.moves + 1,
    status: hearts <= 0 ? 'failed' : 'playing',
  };
  return { state: next, result: { kind: 'blocked', block } };
}

/** 남은 하트 수가 곧 별 개수 (3, 2, 1) */
export function starsFor(state: GameState): number {
  return Math.max(1, Math.min(3, state.hearts));
}
