// Keeps the page shell available offline. The API (answers, timing) is never cached.
const C = 'mt-standalone-v1';
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(['./', 'index.html'].map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.hostname === 'cdn.jsdelivr.net') { // KaTeX: cache-first
    e.respondWith(caches.open(C).then(async c => { const hit = await c.match(req); if (hit) return hit; const res = await fetch(req); c.put(req, res.clone()); return res; }));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(C);
    try { const res = await withTimeout(fetch(req), 4000); if (res.ok) c.put(req, res.clone()); return res; }
    catch { return (await c.match(req, { ignoreSearch: true })) || (await c.match('index.html')) || Response.error(); }
  })());
});
