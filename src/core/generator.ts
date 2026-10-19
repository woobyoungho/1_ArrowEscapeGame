import { canEscape, pathCells } from './board';
import { createRandom, shuffle } from './random';
import { Block, Board, Cell, DIRS } from './types';

export interface GenOptions {
  width: number;
  height: number;
  /** 판을 채울 비율 0~1 */
  fill: number;
  seed: number;
  /**
   * 0~1. 새 블록을 기존 블록의 경로 위(= 기존 블록을 막는 자리)에 놓을 확률.
   * 높을수록 연쇄가 깊어지고, 처음부터 빠질 수 있는 블록이 줄어든다.
   */
  chain?: number;
}

const key = (c: Cell) => `${c.x},${c.y}`;

/**
 * 역방향 생성: 블록을 탈출의 역순으로 하나씩 놓는다.
 * 놓는 순간 경로가 비어 있는 블록만 놓으므로, 나중에 놓은 블록부터 빼면 항상 풀린다.
 */
export function generateBoard(opts: GenOptions): Board {
  const rand = createRandom(opts.seed);
  const chain = opts.chain ?? 0;
  const board: Board = { width: opts.width, height: opts.height, blocks: [] };
  const target = Math.round(opts.width * opts.height * opts.fill);

  const cells: Cell[] = [];
  for (let y = 0; y < opts.height; y++) {
    for (let x = 0; x < opts.width; x++) cells.push({ x, y });
  }

  const occupied = new Set<string>();
  // 블록이 늘수록 경로는 막히기만 하므로, 지금 놓을 수 없는 칸은 앞으로도 놓을 수 없다
  const dead = new Set<string>();
  let nextId = 1;

  while (board.blocks.length < target) {
    const empty = cells.filter((c) => !occupied.has(key(c)) && !dead.has(key(c)));
    if (empty.length === 0) break;

    let pool = empty;
    if (chain > 0 && rand() < chain) {
      const onPath = new Set(board.blocks.flatMap((b) => pathCells(board, b)).map(key));
      const blocking = empty.filter((c) => onPath.has(key(c)));
      if (blocking.length > 0) pool = blocking;
    }

    const cell = pool[Math.floor(rand() * pool.length)];
    let placed = false;
    for (const dir of shuffle([...DIRS], rand)) {
      const block: Block = { id: nextId, x: cell.x, y: cell.y, dir };
      if (canEscape(board, block)) {
        board.blocks.push(block);
        occupied.add(key(cell));
        nextId++;
        placed = true;
        break;
      }
    }
    if (!placed) dead.add(key(cell));
  }
  return board;
}
