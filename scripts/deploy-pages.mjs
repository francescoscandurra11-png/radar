import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const dist = join(root, 'dist');

function copy(src, dest) {
  cpSync(src, dest, { recursive: true, force: true });
}

// HTML: GitHub Pages entry points
const builtHtml = readFileSync(join(dist, 'app.html'), 'utf8')
  .replace(/app\.html/g, 'the_final_radar.html');

// Vite may emit app.html when using custom input
const htmlSource = existsSync(join(dist, 'app.html'))
  ? join(dist, 'app.html')
  : join(dist, 'index.html');

const html = readFileSync(htmlSource, 'utf8');
writeFileSync(join(root, 'the_final_radar.html'), html);
writeFileSync(join(root, 'index.html'), html);

if (existsSync(join(root, 'assets'))) rmSync(join(root, 'assets'), { recursive: true, force: true });
copy(join(dist, 'assets'), join(root, 'assets'));

for (const f of ['favicon.svg', 'manifest.json', 'sw.js', 'robots.txt']) {
  const p = join(dist, f);
  if (existsSync(p)) copy(p, join(root, f));
}

if (existsSync(join(dist, 'icons'))) {
  if (existsSync(join(root, 'icons'))) rmSync(join(root, 'icons'), { recursive: true, force: true });
  copy(join(dist, 'icons'), join(root, 'icons'));
}

console.log('GitHub Pages files updated: the_final_radar.html, index.html, assets/');
