// Production build: bundles index.html + TSX + CSS into dist/ (Bun's built-in bundler; no network needed).
import { rmSync } from 'fs';
rmSync('dist', { recursive: true, force: true });
const res = await Bun.build({ entrypoints: ['./index.html'], outdir: './dist', minify: true, sourcemap: 'linked', target: 'browser' });
if (!res.success) { for (const l of res.logs) console.error(l); process.exit(1); }
for (const o of res.outputs) console.log(`${o.path.replace(process.cwd() + '/', '')}  ${(o.size / 1024).toFixed(1)} KB`);
