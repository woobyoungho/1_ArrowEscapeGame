import { freeBlocks } from './core/board';
import { GameState, START_HEARTS, newGame, starsFor, tap } from './core/game';
import { getLevel } from './core/levels';
import { Renderer } from './render/renderer';

const SAVE_KEY = 'arrow-escape:level';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <div class="game">
    <header class="hud">
      <span class="level" id="level"></span>
      <span class="hearts" id="hearts" aria-label="남은 하트"></span>
    </header>
    <canvas id="board" aria-label="게임 판"></canvas>
    <footer class="controls">
      <button type="button" id="restart">다시하기</button>
      <button type="button" id="hint">힌트</button>
    </footer>
    <div class="overlay" id="overlay" hidden>
      <div class="panel">
        <h2 id="ov-title"></h2>
        <p id="ov-text"></p>
        <button type="button" id="ov-btn"></button>
      </div>
    </div>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#board')!;
const levelEl = document.querySelector<HTMLSpanElement>('#level')!;
const heartsEl = document.querySelector<HTMLSpanElement>('#hearts')!;
const overlay = document.querySelector<HTMLDivElement>('#overlay')!;
const ovTitle = document.querySelector<HTMLHeadingElement>('#ov-title')!;
const ovText = document.querySelector<HTMLParagraphElement>('#ov-text')!;
const ovBtn = document.querySelector<HTMLButtonElement>('#ov-btn')!;
const renderer = new Renderer(canvas);

let level = loadLevel();
let state: GameState;
let onOverlay: () => void = () => {};

function loadLevel(): number {
  try {
    const n = Number(localStorage.getItem(SAVE_KEY));
    return Number.isInteger(n) && n > 0 ? n : 1;
  } catch {
    return 1;
  }
}

function saveLevel(n: number): void {
  try {
    localStorage.setItem(SAVE_KEY, String(n));
  } catch {
    // 저장소를 쓸 수 없는 환경에서는 진행만 저장하지 않는다
  }
}

function startLevel(n: number): void {
  level = n;
  saveLevel(n);
  state = newGame(getLevel(n));
  canvas.style.aspectRatio = `${state.board.width} / ${state.board.height}`;
  renderer.clearAnims();
  overlay.hidden = true;
  updateHud();
  requestAnimationFrame(() => renderer.layout(state.board));
}

function updateHud(): void {
  levelEl.textContent = `레벨 ${level}`;
  heartsEl.innerHTML = Array.from({ length: START_HEARTS }, (_, i) =>
    `<span class="${i < state.hearts ? 'on' : 'off'}">♥</span>`,
  ).join('');
}

function showOverlay(title: string, text: string, button: string, action: () => void, stars = false): void {
  ovTitle.textContent = title;
  ovText.textContent = text;
  ovText.className = stars ? 'stars' : '';
  ovBtn.textContent = button;
  onOverlay = action;
  overlay.hidden = false;
  ovBtn.focus();
}

canvas.addEventListener('pointerdown', (e) => {
  if (state.status !== 'playing') return;
  const cell = renderer.cellFromPoint(state.board, e.clientX, e.clientY);
  if (!cell) return;
  const before = state.board;
  const { state: next, result } = tap(state, cell.x, cell.y);
  state = next;
  const now = performance.now();

  if (result.kind === 'escaped') {
    const duration = renderer.playEscape(before, result.block, now);
    if (state.status === 'cleared') {
      const stars = starsFor(state);
      setTimeout(() => {
        showOverlay(
          `레벨 ${level} 클리어!`,
          '★'.repeat(stars) + '☆'.repeat(3 - stars),
          '다음 레벨',
          () => startLevel(level + 1),
          true,
        );
      }, duration + 150);
    }
  } else if (result.kind === 'blocked') {
    renderer.playShake(result.block.id, now);
    updateHud();
    if (state.status === 'failed') {
      setTimeout(() => {
        showOverlay('하트를 모두 잃었습니다', '막힌 블록을 3번 눌렀어요. 다시 도전해 보세요.', '다시하기', () =>
          startLevel(level),
        );
      }, 450);
    }
  }
});

document.querySelector('#restart')!.addEventListener('click', () => startLevel(level));

document.querySelector('#hint')!.addEventListener('click', () => {
  if (state.status !== 'playing') return;
  const free = freeBlocks(state.board);
  if (free.length > 0) renderer.playHint(free[0].id, performance.now());
});

ovBtn.addEventListener('click', () => onOverlay());

new ResizeObserver(() => renderer.layout(state.board)).observe(canvas);

function frame(now: number): void {
  renderer.draw(state.board, now);
  requestAnimationFrame(frame);
}

startLevel(level);
requestAnimationFrame(frame);
