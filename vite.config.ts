import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  base: './',
  test: {
    // `npm run report:levels`는 레벨 난이도 표만 출력한다
    include: mode === 'report' ? ['scripts/**/*.test.ts'] : ['tests/**/*.test.ts'],
  },
}));
