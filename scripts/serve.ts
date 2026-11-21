// `bun run dev` serves the source with on-the-fly bundling; `bun run preview` serves dist/.
import index from '../index.html';
const port = Number(process.env.PORT ?? 5173);
const dev = process.argv.includes('--dev');
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
console.log(`CCAR-F Prep running at http://localhost:${port}/ ${dev ? '(dev)' : '(dist)'}`);
