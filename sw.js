// Service worker: precachea la aplicación y sus recursos para uso sin conexión tras la primera carga.
// Estrategia: network-first para código y datos (html/js/css/json: siempre la versión nueva si hay red, caché si no),
// cache-first para assets pesados (imágenes, PDF, librerías). Sin recursos externos.
const VERSION = 'vitalmet-rig-explorer-v7';
const CORE = [
  './', './index.html', './style.css', './app.js', './manifest.webmanifest',
  './vendor/three.module.js', './vendor/three.core.js', './vendor/OrbitControls.js',
  './data/catalog.js', './data/systems.js',
  './src/i18n.js', './src/store.js', './src/ui/list.js', './src/ui/inspector.js', './src/ui/quote.js', './src/ui/admin.js', './src/ui/systems.js',
  './src/scene/materials.js', './src/scene/environment.js', './src/scene/builders.js', './src/scene/parts.js', './src/scene/viewer.js', './src/scene/explorer.js',
  './src/scene/scenes/rig.js', './src/scene/scenes/hpline.js', './src/scene/scenes/mudpump.js', './src/scene/scenes/studio.js',
  './assets/logo.png', './assets/catalogo-vitalmet.pdf',
  ...['loaders/GLTFLoader.js', 'math/SimplexNoise.js', 'postprocessing/EffectComposer.js', 'postprocessing/GTAOPass.js', 'postprocessing/MaskPass.js', 'postprocessing/OutputPass.js', 'postprocessing/Pass.js', 'postprocessing/RenderPass.js', 'postprocessing/SMAAPass.js', 'postprocessing/ShaderPass.js', 'postprocessing/UnrealBloomPass.js', 'shaders/CopyShader.js', 'shaders/GTAOShader.js', 'shaders/LuminosityHighPassShader.js', 'shaders/OutputShader.js', 'shaders/PoissonDenoiseShader.js', 'shaders/SMAAShader.js', 'utils/BufferGeometryUtils.js', 'utils/SkeletonUtils.js'].map((f) => './vendor/addons/' + f),
];
const PAGES = Array.from({ length: 21 }, (_, i) => `./assets/paginas/pagina-${String(i + 1).padStart(2, '0')}.webp`);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(CORE);
    await cache.addAll(PAGES);
    // Fotos: se listan desde el manifiesto de assets (generado) si existe; si no, se cachean bajo demanda.
    try { const r = await fetch('./assets/assets-manifest.json'); if (r.ok) { const list = await r.json(); await cache.addAll(list.map((p) => './' + p)); } } catch { /* opcional */ }
    self.skipWaiting();
  })());
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
    const clients = await self.clients.matchAll();
    clients.forEach((c) => c.postMessage({ type: 'cached' }));
  })());
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;
  const isAsset = url.pathname.includes('/assets/') || url.pathname.includes('/vendor/');
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    if (isAsset) {
      const hit = await cache.match(event.request, { ignoreSearch: true });
      if (hit) return hit;
      try { const res = await fetch(event.request); if (res.ok) cache.put(event.request, res.clone()); return res; }
      catch (err) { throw err; }
    }
    try {
      // Revalida siempre contra el servidor para no servir código viejo desde la caché HTTP del navegador.
      const res = await fetch(event.request.url, { cache: 'no-cache', credentials: 'same-origin' });
      if (res.ok) cache.put(event.request, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(event.request, { ignoreSearch: true });
      if (hit) return hit;
      if (event.request.mode === 'navigate') return cache.match('./index.html');
      throw err;
    }
  })());
});
