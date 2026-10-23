// Service worker de Kayros: hace que la app abra rápido con mala conexión y que siga abriendo
// sin conexión. Solo cachea peticiones GET del mismo origen:
//   - /_next/static/*  (JS/CSS/fuentes con hash en el nombre, nunca cambian): primero el caché.
//   - Páginas del dashboard (navegación): primero la red, pero si tarda más de NAV_TIMEOUT_MS o
//     falla, se sirve la última copia guardada de esa página.
// Los datos (alumnos, pagos, ...) NO pasan por aquí: los guarda el QueryProvider en IndexedDB.
// Las Server Actions son POST y nunca se cachean. Fotos de alumnos (/uploads) tampoco.

const VERSION = "v1";
const STATIC_CACHE = `kyros-static-${VERSION}`;
// El prefijo "kyros-pages-" lo borra clearPersistedClientCache (src/lib/query/client-cache.ts)
// al cerrar sesión: estas páginas contienen el nombre del usuario.
const PAGE_CACHE = `kyros-pages-${VERSION}`;
const NAV_TIMEOUT_MS = 3000;
const MAX_STATIC_ENTRIES = 300;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("kyros-") && name !== STATIC_CACHE && name !== PAGE_CACHE)
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === "navigate" && url.pathname.startsWith("/dashboard")) {
    event.respondWith(networkFirstPage(event));
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    void trimCache(cache, MAX_STATIC_ENTRIES);
  }
  return response;
}

/** Cada despliegue genera archivos con hash nuevo: se descartan los más viejos para que el caché
 *  no crezca sin límite. */
async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  const excess = keys.length - maxEntries;
  for (let i = 0; i < excess; i++) {
    await cache.delete(keys[i]);
  }
}

async function networkFirstPage(event) {
  const { request } = event;
  const cache = await caches.open(PAGE_CACHE);

  const network = fetch(request).then(async (response) => {
    if (response.redirected) {
      // El servidor mandó a /login (sesión vencida): las páginas guardadas ya no deben mostrarse.
      await caches.delete(PAGE_CACHE);
    } else if (response.ok && response.type === "basic") {
      await cache.put(request, response.clone());
    }
    return response;
  });
  // Aunque se responda con la copia guardada por tardanza, la petición sigue y actualiza el caché.
  event.waitUntil(network.catch(() => undefined));

  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), NAV_TIMEOUT_MS));
  const fastest = await Promise.race([network.catch(() => null), timeout]);
  if (fastest) return fastest;

  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;

  // Sin copia guardada: esperar a la red de todos modos, y si de plano no hay, avisar.
  try {
    return await network;
  } catch {
    return offlineResponse();
  }
}

function offlineResponse() {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sin conexión · Kayros</title>
<style>body{font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;background:#fafafa;color:#18181b;padding:16px}div{max-width:24rem;text-align:center}button{margin-top:16px;padding:8px 16px;border:0;border-radius:8px;background:#4f46e5;color:#fff;font-size:14px;cursor:pointer}@media (prefers-color-scheme:dark){body{background:#09090b;color:#f4f4f5}}</style></head>
<body><div><h1 style="font-size:1.25rem">Sin conexión</h1><p style="color:#71717a;font-size:.875rem">Esta página todavía no se había abierto en este equipo, así que no hay una copia guardada. Las páginas que ya visitaste sí funcionan sin conexión.</p><button onclick="location.reload()">Reintentar</button></div></body></html>`;
  return new Response(html, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
