// 레벨별 난이도 지표 표. 실행: npm run report:levels
import { it } from 'vitest';
import { getLevel, isRestLevel, levelConfig } from '../src/core/levels';
import { solve } from '../src/core/solver';

const LAST_LEVEL = 40;

it('레벨 난이도 표', () => {
  const rows = ['레벨\t크기\t블록\t연쇄(목표)\t시작 탈출 비율(목표)'];
  for (let n = 1; n <= LAST_LEVEL; n++) {
    const board = getLevel(n);
    const cfg = levelConfig(n);
    const r = solve(board);
    const ratio = r.initialFree / board.blocks.length;
    rows.push(
      [
        `${n}${isRestLevel(n) ? ' (휴식)' : ''}`,
        `${board.width}x${board.height}`,
        board.blocks.length,
        `${r.rounds} (${cfg.targetRounds})`,
        `${ratio.toFixed(2)} (${cfg.targetFreeRatio.toFixed(2)})`,
      ].join('\t'),
    );
  }
  console.log(rows.join('\n'));
});
