const CACHE = 'cremefc-v3';
const ASSETS = [
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Firebase requests — sempre online
  if (e.request.url.includes('firebase') || e.request.url.includes('googleapis')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => {
      if (cached) return cached;
      return caches.match('/index.html').then(r => r || new Response(
        '<html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:12px;background:#1e3a8a;color:#fff"><div style="font-size:48px">⚽</div><div style="font-size:20px;font-weight:700">CremeFC</div><div style="font-size:14px;opacity:.8">Sem conexão — tente novamente</div><button onclick="location.reload()" style="margin-top:8px;padding:10px 24px;border:2px solid #fff;background:transparent;color:#fff;border-radius:8px;font-size:14px;cursor:pointer">Tentar novamente</button></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      ));
    });
      return cached || fetchPromise;
    })
  );
});
