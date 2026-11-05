/* INNRA3D sin conexión: la página siempre se pide primero a la red; texturas, cielos,
   modelos y librerías se guardan al usarse y se sirven desde la caché. */
const V = "innra3d-v1", NUCLEO = ["./", "index.html", "logo.svg", "manifest.webmanifest", "modelos/villa.zip"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(NUCLEO)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
const estatico = u => /\/(texturas|cielos|modelos)\//.test(u.pathname) || /\.(png|svg|jpg|hdr|zip|webmanifest)$/.test(u.pathname) || /cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)\.com/.test(u.host);
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url); if (/supabase\.co$/.test(u.host)) return;
  if (r.mode === "navigate") { e.respondWith(fetch(r).then(x => { const c = x.clone(); caches.open(V).then(k => k.put("index.html", c)); return x; }).catch(() => caches.match("index.html"))); return; }
  if (estatico(u)) e.respondWith(caches.match(r).then(h => h || fetch(r).then(x => { if (x.ok || x.type === "opaque") { const c = x.clone(); caches.open(V).then(k => k.put(r, c)); } return x; })));
});
