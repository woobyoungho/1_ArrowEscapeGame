export type Dir = 'up' | 'down' | 'left' | 'right';

export const DIRS: readonly Dir[] = ['up', 'down', 'left', 'right'];

export const DIR_VEC: Record<Dir, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export interface Block {
  id: number;
  x: number;
  y: number;
  dir: Dir;
}

export interface Board {
  width: number;
  height: number;
  blocks: Block[];
}

export interface Cell {
  x: number;
  y: number;
}
