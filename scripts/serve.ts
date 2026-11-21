// `bun run dev` serves the source with on-the-fly bundling; `bun run preview` serves dist/.
// Default port 4317 (avoids clashing with Vite's 5173). Override with PORT=xxxx.
import index from '../index.html';
const port = Number(process.env.PORT ?? 4317);
const dev = process.argv.includes('--dev');
try {
  if (dev) {
    Bun.serve({ port, development: true, routes: { '/': index } });
  } else {
    Bun.serve({
      port,
      async fetch(req) {
        const p = new URL(req.url).pathname;
        const f = Bun.file('dist' + (p === '/' ? '/index.html' : p));
        return (await f.exists()) ? new Response(f) : new Response(Bun.file('dist/index.html'));
      },
    });
  }
} catch (e: any) {
  if (e?.code === 'EADDRINUSE' || /in use/i.test(String(e?.message))) {
    console.error(`Port ${port} is already in use by another app. Try: PORT=4318 bun run ${dev ? 'dev' : 'preview'}`);
    process.exit(1);
  }
  throw e;
}
console.log(`CCAR-F Prep running at http://localhost:${port}/ ${dev ? '(dev)' : '(dist)'}`);
