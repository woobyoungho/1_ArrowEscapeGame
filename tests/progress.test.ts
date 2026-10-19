import { describe, expect, it } from 'vitest';
import { emptyProgress, parseProgress, recordClear, totalStars } from '../src/core/progress';

describe('진행 상황', () => {
  it('레벨을 깨면 다음 레벨이 열린다', () => {
    const p = recordClear(emptyProgress(), 1, 2);
    expect(p.unlocked).toBe(2);
    expect(p.stars[1]).toBe(2);
  });

  it('예전 레벨을 다시 깨도 열린 레벨은 줄지 않는다', () => {
    let p = recordClear(emptyProgress(), 1, 3);
    p = recordClear(p, 2, 3);
    p = recordClear(p, 1, 1);
    expect(p.unlocked).toBe(3);
  });

  it('별은 최고 기록만 남는다', () => {
    let p = recordClear(emptyProgress(), 1, 3);
    p = recordClear(p, 1, 1);
    expect(p.stars[1]).toBe(3);
  });

  it('별 합계를 센다', () => {
    let p = recordClear(emptyProgress(), 1, 3);
    p = recordClear(p, 2, 2);
    expect(totalStars(p)).toBe(5);
  });

  it('잘못된 저장 데이터는 무시한다', () => {
    expect(parseProgress(null)).toEqual(emptyProgress());
    expect(parseProgress({ unlocked: 'x' })).toEqual(emptyProgress());
    expect(parseProgress({ unlocked: 4, stars: { 1: 3, 2: 9, abc: 2 } })).toEqual({ unlocked: 4, stars: { 1: 3 } });
  });
});
