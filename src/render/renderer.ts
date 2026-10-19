import { pathCells } from '../core/board';
import { Block, Board, Cell, DIR_VEC, Dir } from '../core/types';

const COLORS: Record<Dir, string> = {
  up: '#4f7cff',
  right: '#ff8a3d',
  down: '#22b07d',
  left: '#b45cf0',
};

const ANGLE: Record<Dir, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

interface EscapeAnim {
  kind: 'escape';
  block: Block;
  start: number;
  duration: number;
  distance: number;
}

interface ShakeAnim {
  kind: 'shake';
  id: number;
  start: number;
  duration: number;
}

interface HintAnim {
  kind: 'hint';
  id: number;
  start: number;
  duration: number;
}

type Anim = EscapeAnim | ShakeAnim | HintAnim;

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private anims: Anim[] = [];
  private cell = 0;
  private originX = 0;
  private originY = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  /** 캔버스 크기와 칸 크기를 판에 맞춘다 */
  layout(board: Board): void {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pad = 12;
    this.cell = Math.floor(Math.min((w - pad * 2) / board.width, (h - pad * 2) / board.height));
    this.originX = (w - this.cell * board.width) / 2;
    this.originY = (h - this.cell * board.height) / 2;
  }

  cellFromPoint(board: Board, clientX: number, clientY: number): Cell | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left - this.originX) / this.cell);
    const y = Math.floor((clientY - rect.top - this.originY) / this.cell);
    if (x < 0 || y < 0 || x >= board.width || y >= board.height) return null;
    return { x, y };
  }

  playEscape(board: Board, block: Block, now: number): number {
    const distance = pathCells(board, block).length + 2;
    const duration = 140 + distance * 40;
    this.anims.push({ kind: 'escape', block, start: now, duration, distance });
    return duration;
  }

  playShake(id: number, now: number): void {
    this.anims.push({ kind: 'shake', id, start: now, duration: 350 });
  }

  playHint(id: number, now: number): void {
    this.anims.push({ kind: 'hint', id, start: now, duration: 1600 });
  }

  clearAnims(): void {
    this.anims = [];
  }

  isAnimating(now: number): boolean {
    return this.anims.some((a) => now - a.start < a.duration);
  }

  draw(board: Board, now: number): void {
    this.anims = this.anims.filter((a) => now - a.start < a.duration);
    const { ctx, cell } = this;
    ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);

    // 판 바탕
    ctx.fillStyle = '#e4e8f0';
    roundRect(ctx, this.originX - 6, this.originY - 6, cell * board.width + 12, cell * board.height + 12, 14);
    ctx.fill();
    ctx.fillStyle = '#cfd5e1';
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        ctx.beginPath();
        ctx.arc(this.originX + (x + 0.5) * cell, this.originY + (y + 0.5) * cell, cell * 0.06, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (const block of board.blocks) {
      let ox = 0;
      const shake = this.anims.find((a): a is ShakeAnim => a.kind === 'shake' && a.id === block.id);
      if (shake) {
        const t = (now - shake.start) / shake.duration;
        ox = Math.sin(t * Math.PI * 6) * (1 - t) * cell * 0.12;
      }
      const hint = this.anims.find((a): a is HintAnim => a.kind === 'hint' && a.id === block.id);
      this.drawBlock(block, block.x * cell + ox, block.y * cell, 1, !!shake, hint ? (now - hint.start) / hint.duration : -1);
    }

    for (const a of this.anims) {
      if (a.kind !== 'escape') continue;
      const t = Math.min(1, (now - a.start) / a.duration);
      const eased = t * t;
      const { dx, dy } = DIR_VEC[a.block.dir];
      const travel = eased * a.distance * cell;
      this.drawBlock(a.block, a.block.x * cell + dx * travel, a.block.y * cell + dy * travel, 1 - t * 0.6, false, -1);
    }
  }

  private drawBlock(block: Block, px: number, py: number, alpha: number, blocked: boolean, hintT: number): void {
    const { ctx, cell } = this;
    const inset = cell * 0.08;
    const size = cell - inset * 2;
    const x = this.originX + px + inset;
    const y = this.originY + py + inset;

    ctx.save();
    ctx.globalAlpha = alpha;

    // 아래쪽 그림자로 입체감
    ctx.fillStyle = 'rgba(20, 30, 60, 0.18)';
    roundRect(ctx, x, y + cell * 0.05, size, size, cell * 0.2);
    ctx.fill();

    ctx.fillStyle = blocked ? '#e5484d' : COLORS[block.dir];
    roundRect(ctx, x, y, size, size, cell * 0.2);
    ctx.fill();

    if (hintT >= 0) {
      ctx.strokeStyle = '#ffd447';
      ctx.lineWidth = Math.max(3, cell * 0.08);
      ctx.globalAlpha = alpha * (0.5 + 0.5 * Math.abs(Math.sin(hintT * Math.PI * 4)));
      roundRect(ctx, x - 2, y - 2, size + 4, size + 4, cell * 0.22);
      ctx.stroke();
      ctx.globalAlpha = alpha;
    }

    // 화살표
    ctx.translate(x + size / 2, y + size / 2);
    ctx.rotate(ANGLE[block.dir]);
    const s = size * 0.3;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-s, -s * 0.18, s * 1.1, s * 0.36);
    ctx.beginPath();
    ctx.moveTo(s, 0);
    ctx.lineTo(s * 0.1, -s * 0.62);
    ctx.lineTo(s * 0.1, s * 0.62);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
