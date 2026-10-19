/** 플레이어 진행 상황. 화면이나 저장소와 무관한 순수 데이터 */
export interface Progress {
  /** 플레이할 수 있는 가장 높은 레벨 */
  unlocked: number;
  /** 레벨별 최고 별 개수 (1~3) */
  stars: Record<number, number>;
}

export function emptyProgress(): Progress {
  return { unlocked: 1, stars: {} };
}

export function recordClear(progress: Progress, level: number, stars: number): Progress {
  return {
    unlocked: Math.max(progress.unlocked, level + 1),
    stars: { ...progress.stars, [level]: Math.max(progress.stars[level] ?? 0, stars) },
  };
}

export function totalStars(progress: Progress): number {
  return Object.values(progress.stars).reduce((sum, s) => sum + s, 0);
}

/** 저장소에서 읽은 값을 검증한다. 형식이 틀리면 빈 진행 상황 */
export function parseProgress(raw: unknown): Progress {
  if (typeof raw !== 'object' || raw === null) return emptyProgress();
  const { unlocked, stars } = raw as Partial<Progress>;
  if (!Number.isInteger(unlocked) || (unlocked as number) < 1) return emptyProgress();
  const clean: Record<number, number> = {};
  if (typeof stars === 'object' && stars !== null) {
    for (const [k, v] of Object.entries(stars)) {
      const level = Number(k);
      if (Number.isInteger(level) && level >= 1 && Number.isInteger(v) && v >= 1 && v <= 3) clean[level] = v;
    }
  }
  return { unlocked: unlocked as number, stars: clean };
}
