import { Block, Board, Cell, DIR_VEC } from './types';

export function inBounds(board: Board, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < board.width && y < board.height;
}

export function blockAt(board: Board, x: number, y: number): Block | undefined {
  return board.blocks.find((b) => b.x === x && b.y === y);
}

/** 블록 바로 앞 칸부터 판 끝까지, 블록이 지나가야 하는 칸 목록 */
export function pathCells(board: Board, block: Block): Cell[] {
  const { dx, dy } = DIR_VEC[block.dir];
  const cells: Cell[] = [];
  let x = block.x + dx;
  let y = block.y + dy;
  while (inBounds(board, x, y)) {
    cells.push({ x, y });
    x += dx;
    y += dy;
  }
  return cells;
}

/** 경로가 판 끝까지 비어 있으면 탈출 가능 */
export function canEscape(board: Board, block: Block): boolean {
  return pathCells(board, block).every((c) => !blockAt(board, c.x, c.y));
}

export function removeBlock(board: Board, id: number): Board {
  return { ...board, blocks: board.blocks.filter((b) => b.id !== id) };
}

export function freeBlocks(board: Board): Block[] {
  return board.blocks.filter((b) => canEscape(board, b));
}

export function isCleared(board: Board): boolean {
  return board.blocks.length === 0;
}
