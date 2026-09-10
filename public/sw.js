// Service worker mínimo: permite que el navegador considere la app "instalable".
// No agrega funcionamiento sin internet (eso sería un paso futuro opcional).
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // Sin caché por ahora: siempre pide todo a internet, como una web normal.
})
