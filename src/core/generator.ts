import { canEscape } from './board';
import { createRandom, shuffle } from './random';
import { Block, Board, Cell, DIRS } from './types';

export interface GenOptions {
  width: number;
  height: number;
  /** 판을 채울 비율 0~1 */
  fill: number;
  seed: number;
}

/**
 * 역방향 생성: 블록을 탈출의 역순으로 하나씩 놓는다.
 * 놓는 순간 경로가 비어 있는 블록만 놓으므로, 나중에 놓은 블록부터 빼면 항상 풀린다.
 */
export function generateBoard(opts: GenOptions): Board {
  const rand = createRandom(opts.seed);
  const board: Board = { width: opts.width, height: opts.height, blocks: [] };
  const target = Math.round(opts.width * opts.height * opts.fill);

  const cells: Cell[] = [];
  for (let y = 0; y < opts.height; y++) {
    for (let x = 0; x < opts.width; x++) cells.push({ x, y });
  }

  let nextId = 1;
  // 한 바퀴 돌 때마다 놓을 수 있는 칸에 놓고, 더 놓을 수 없을 때까지 반복
  let placed = true;
  while (placed && board.blocks.length < target) {
    placed = false;
    for (const cell of shuffle(cells, rand)) {
      if (board.blocks.length >= target) break;
      if (board.blocks.some((b) => b.x === cell.x && b.y === cell.y)) continue;
      for (const dir of shuffle([...DIRS], rand)) {
        const block: Block = { id: nextId, x: cell.x, y: cell.y, dir };
        if (canEscape(board, block)) {
          board.blocks.push(block);
          nextId++;
          placed = true;
          break;
        }
      }
    }
  }
  return board;
}
