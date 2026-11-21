// Builds one self-contained HTML file (JS + CSS inlined) at dist-single/index.html.
// Works on any static host (GitHub Pages) and when opened directly from disk — no Bun needed to view it.
import { rmSync, mkdirSync, writeFileSync } from 'fs';
rmSync('dist-single', { recursive: true, force: true });
const res = await Bun.build({ entrypoints: ['./index.html'], outdir: './dist-single/tmp', minify: true, target: 'browser' });
if (!res.success) { for (const l of res.logs) console.error(l); process.exit(1); }
let html = '';
const assets: Record<string, string> = {};
for (const o of res.outputs) {
  const name = o.path.split('/').pop()!;
  if (name.endsWith('.html')) html = await o.text();
  else assets[name] = await o.text();
}
html = html.replace(/<link[^>]+href="\.?\/?([^"]+\.css)"[^>]*>/g, (_m, f) => `<style>${assets[f.split('/').pop()!]}</style>`);
html = html.replace(/<script([^>]*) src="\.?\/?([^"]+\.js)"[^>]*><\/script>/g, (_m, attrs, f) => {
  const js = assets[f.split('/').pop()!].replace(/<\/script/gi, '<\\/script');
  return `<script type="module">${js}</script>`;
});
if (/src="[^"]+\.js"|href="[^"]+\.css"/.test(html)) { console.error('asset not inlined'); process.exit(1); }
rmSync('dist-single/tmp', { recursive: true, force: true });
mkdirSync('dist-single', { recursive: true });
writeFileSync('dist-single/index.html', html);
writeFileSync('dist-single/.nojekyll', '');
console.log(`dist-single/index.html  ${(html.length / 1024).toFixed(0)} KB`);
