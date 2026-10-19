// dist/ 빌드 결과를 Claude 아티팩트용 단일 HTML(preview/index.html)로 합친다.
// 아티팩트는 문서 골격(<html>, <head>, <body>)을 자동으로 씌우므로 본문 내용만 남긴다.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
let html = readFileSync(join(dist, 'index.html'), 'utf8');

const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '화살표 탈출';

const css = [...html.matchAll(/<link[^>]+href="\.?\/?([^"]+\.css)"[^>]*>/g)]
  .map((m) => readFileSync(join(dist, m[1]), 'utf8'))
  .join('\n');

const js = [...html.matchAll(/<script[^>]+src="\.?\/?([^"]+\.js)"[^>]*><\/script>/g)]
  .map((m) => readFileSync(join(dist, m[1]), 'utf8'))
  .join('\n');

const body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? '';
const bodyWithoutScripts = body.replace(/<script[\s\S]*?<\/script>/g, '').trim();

const out = `<title>${title}</title>
<style>
${css}
</style>
${bodyWithoutScripts}
<script type="module">
${js}
</script>
`;

mkdirSync('preview', { recursive: true });
writeFileSync(join('preview', 'index.html'), out);
console.log('preview/index.html 생성 완료');
