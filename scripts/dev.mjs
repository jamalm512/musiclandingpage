import http from 'node:http';
import { createServer, loadEnv } from 'vite';

Object.assign(process.env, loadEnv('development', process.cwd(), ''));
const routes = new Set(['subscribe', 'preview', 'links', 'platforms', 'location', 'visitors', 'now-playing', 'callback']);
const vite = await createServer({ server: { middlewareMode: true, watch: { usePolling: true, interval: 300 } }, appType: 'spa' });
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/__responsive') {
    const width = Math.max(320, Math.min(1600, Number(url.searchParams.get('width')) || 390));
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(`<!doctype html><html><head><meta charset="UTF-8"><title>JXXMAL responsive check</title><style>body{margin:0;background:#282b25;color:#ccc;font:12px sans-serif}header{padding:8px 16px}iframe{display:block;border:0;width:${width}px;height:1100px;transform-origin:top left}#frame{margin:0 auto;width:${width}px}</style></head><body><header>${width}px layout preview</header><div id=frame><iframe title="JXXMAL ${width}px" src="/"></iframe></div><script>const scale=Math.min(1,(innerWidth-24)/${width});document.querySelector('iframe').style.transform='scale('+scale+')';document.querySelector('#frame').style.width=(${width}*scale)+'px';document.querySelector('iframe').addEventListener('load',async(event)=>{const doc=event.target.contentDocument;await doc.fonts.ready;document.querySelector('header').textContent='${width}px layout · content '+doc.documentElement.clientWidth+'px · scroll '+doc.documentElement.scrollWidth+'px · '+(doc.documentElement.scrollWidth>doc.documentElement.clientWidth?'OVERFLOW':'No page overflow')+' / '+Array.from(doc.querySelectorAll('body *')).filter(el=>{const r=el.getBoundingClientRect();return r.width>0 && r.right>doc.documentElement.clientWidth+1 && !el.closest('.journey-track')}).slice(0,12).map(el=>el.className?.baseVal||el.className||el.tagName).join(', ');});<\/script></body></html>`);
  }
  const route = url.pathname.match(/^\/api\/([a-z-]+)$/)?.[1];
  if (!route || !routes.has(route)) return vite.middlewares(req, res);
  try {
    req.query = Object.fromEntries(url.searchParams);
    if (req.method === 'POST') {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 8192) { res.writeHead(413).end(); return; }
      }
      try { req.body = JSON.parse(body || '{}'); }
      catch { res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Invalid request.' })); return; }
    }
    res.status = (status) => { res.statusCode = status; return res; };
    res.json = (body) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); return res; };
    const { default: handler } = await import(`../api/${route}.js`);
    await handler(req, res);
  } catch (error) {
    console.error(`Local ${route} route failed:`, error.message);
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'The service is unavailable right now.' }));
  }
});
const port = Number(process.env.PORT) || 5173;
server.listen(port, '127.0.0.1', () => console.log(`JXXMAL preview: http://127.0.0.1:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { await vite.close(); server.close(); process.exit(0); });
