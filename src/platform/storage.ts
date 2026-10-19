import { Progress, emptyProgress, parseProgress } from '../core/progress';

const PROGRESS_KEY = 'arrow-escape:progress';
const MUTED_KEY = 'arrow-escape:muted';
/** v0.1에서 쓰던 키. 현재 레벨만 저장했다 */
const LEGACY_LEVEL_KEY = 'arrow-escape:level';

// 사생활 보호 모드 등 저장소를 쓸 수 없는 환경에서도 게임은 동작해야 하므로 모든 접근을 감싼다
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 저장하지 못해도 이번 플레이는 계속된다
  }
}

export function loadProgress(): Progress {
  const raw = read(PROGRESS_KEY);
  if (raw) {
    try {
      return parseProgress(JSON.parse(raw));
    } catch {
      return emptyProgress();
    }
  }
  const legacy = Number(read(LEGACY_LEVEL_KEY));
  return Number.isInteger(legacy) && legacy > 1 ? { unlocked: legacy, stars: {} } : emptyProgress();
}

export function saveProgress(progress: Progress): void {
  write(PROGRESS_KEY, JSON.stringify(progress));
}

export function loadMuted(): boolean {
  return read(MUTED_KEY) === '1';
}

export function saveMuted(muted: boolean): void {
  write(MUTED_KEY, muted ? '1' : '0');
}
