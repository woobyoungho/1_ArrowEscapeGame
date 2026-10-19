import { Sound } from './audio/sound';
import { freeBlocks } from './core/board';
import { GameState, START_HEARTS, newGame, starsFor, tap } from './core/game';
import { getLevel } from './core/levels';
import { Progress, recordClear, totalStars } from './core/progress';
import { loadMuted, loadProgress, saveMuted, saveProgress } from './platform/storage';
import { Renderer } from './render/renderer';

/** 이 시간(ms) 안에 다음 블록을 빼면 콤보가 이어진다 */
const COMBO_WINDOW = 800;

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <div class="game">
    <header class="hud">
      <button type="button" class="icon-btn" id="open-levels" aria-label="레벨 선택">☰</button>
      <span class="level" id="level"></span>
      <span class="hearts" id="hearts" aria-label="남은 하트"></span>
      <button type="button" class="icon-btn" id="mute" aria-label="소리 켜기/끄기"></button>
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
    <div class="overlay" id="levels" hidden>
      <div class="panel levels-panel">
        <h2>레벨 선택</h2>
        <p class="total-stars" id="total-stars"></p>
        <div class="level-grid" id="level-grid"></div>
        <button type="button" id="close-levels">닫기</button>
      </div>
    </div>
  </div>
`;

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const canvas = $<HTMLCanvasElement>('#board');
const levelEl = $('#level');
const heartsEl = $('#hearts');
const muteBtn = $<HTMLButtonElement>('#mute');
const overlay = $('#overlay');
const ovTitle = $('#ov-title');
const ovText = $('#ov-text');
const ovBtn = $<HTMLButtonElement>('#ov-btn');
const levelsOverlay = $('#levels');
const levelGrid = $('#level-grid');
const renderer = new Renderer(canvas);
const sound = new Sound(loadMuted());

let progress: Progress = loadProgress();
let level = progress.unlocked;
let state: GameState;
let combo = 0;
let lastEscapeAt = -Infinity;
let onOverlay: () => void = () => {};

function startLevel(n: number): void {
  level = n;
  state = newGame(getLevel(n));
  combo = 0;
  canvas.style.aspectRatio = `${state.board.width} / ${state.board.height}`;
  renderer.clearAnims();
  overlay.hidden = true;
  levelsOverlay.hidden = true;
  updateHud();
  requestAnimationFrame(() => renderer.layout(state.board));
}

function updateHud(): void {
  levelEl.textContent = `레벨 ${level}`;
  heartsEl.innerHTML = Array.from(
    { length: START_HEARTS },
    (_, i) => `<span class="${i < state.hearts ? 'on' : 'off'}">♥</span>`,
  ).join('');
  muteBtn.textContent = sound.muted ? '🔇' : '🔊';
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

function openLevels(): void {
  $('#total-stars').textContent = `★ ${totalStars(progress)}`;
  // 열린 레벨까지 보여 주고, 다음 목표가 보이도록 잠긴 레벨도 5칸 단위로 채운다
  const count = Math.max(20, Math.ceil((progress.unlocked + 1) / 5) * 5);
  levelGrid.innerHTML = '';
  for (let n = 1; n <= count; n++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'level-cell';
    const locked = n > progress.unlocked;
    btn.disabled = locked;
    if (n === level) btn.classList.add('current');
    const stars = progress.stars[n] ?? 0;
    btn.innerHTML = locked
      ? `<span class="num">🔒</span>`
      : `<span class="num">${n}</span><span class="mini-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>`;
    btn.setAttribute('aria-label', locked ? `레벨 ${n} 잠김` : `레벨 ${n}, 별 ${stars}개`);
    btn.addEventListener('click', () => startLevel(n));
    levelGrid.appendChild(btn);
  }
  levelsOverlay.hidden = false;
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
    combo = now - lastEscapeAt <= COMBO_WINDOW ? combo + 1 : 1;
    lastEscapeAt = now;
    sound.escape(combo);
    const duration = renderer.playEscape(before, result.block, now);

    if (state.status === 'cleared') {
      const stars = starsFor(state);
      progress = recordClear(progress, level, stars);
      saveProgress(progress);
      setTimeout(() => {
        sound.clear();
        const confetti = renderer.playConfetti(performance.now());
        setTimeout(() => {
          showOverlay(
            `레벨 ${level} 클리어!`,
            '★'.repeat(stars) + '☆'.repeat(3 - stars),
            '다음 레벨',
            () => startLevel(level + 1),
            true,
          );
        }, confetti * 0.45);
      }, duration);
    }
  } else if (result.kind === 'blocked') {
    combo = 0;
    sound.blocked();
    renderer.playShake(result.block.id, now);
    updateHud();
    if (state.status === 'failed') {
      setTimeout(() => {
        sound.fail();
        showOverlay('하트를 모두 잃었습니다', '막힌 블록을 3번 눌렀어요. 다시 도전해 보세요.', '다시하기', () =>
          startLevel(level),
        );
      }, 450);
    }
  }
});

$('#restart').addEventListener('click', () => startLevel(level));

$('#hint').addEventListener('click', () => {
  if (state.status !== 'playing') return;
  const free = freeBlocks(state.board);
  if (free.length > 0) renderer.playHint(free[0].id, performance.now());
});

muteBtn.addEventListener('click', () => {
  sound.muted = !sound.muted;
  saveMuted(sound.muted);
  updateHud();
});

$('#open-levels').addEventListener('click', openLevels);
$('#close-levels').addEventListener('click', () => (levelsOverlay.hidden = true));
ovBtn.addEventListener('click', () => onOverlay());

new ResizeObserver(() => renderer.layout(state.board)).observe(canvas);

function frame(now: number): void {
  renderer.draw(state.board, now);
  requestAnimationFrame(frame);
}

startLevel(level);
requestAnimationFrame(frame);
