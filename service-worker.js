// ============================================================
// SERVICE WORKER — Caché offline + Background Sync
// Versión: 1.0.0
// ============================================================

const CACHE_NAME = 'mi-app-v1';
const SYNC_TAG = 'outbox-sync';
const DB_NAME = 'sync-db';
const DB_STORE = 'outbox';

// Archivos que se cachean al instalar el SW
// ⚠️ Ajusta esta lista con tus archivos reales
const ASSETS_TO_CACHE = [
  '/new/',
  '/new/index.html',
  '/new/css/style.css',
  '/new/js/main.js',
  '/new/manifest.json',
  '/new/offline.html'
];

// ============================================================
// 1. INSTALL — Precachear assets estáticos
// ============================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cacheando assets estáticos');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ============================================================
// 2. ACTIVATE — Limpiar cachés antiguas
// ============================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando...');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Eliminando caché antigua:', name);
            return caches.delete(name);
          })
      )
    )
  );
  self.clients.claim();
});

// ============================================================
// 3. FETCH — Estrategia de red
// ============================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticiones que no son GET (manejadas por Background Sync)
  if (request.method !== 'GET') return;

  // Ignorar extensiones de Chrome y otros orígenes
  if (!url.origin.includes('github.io') && !url.origin.includes('localhost')) return;

  // Estrategia: Network First → Caché → Offline fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Guardar copia fresca en caché
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(async () => {
        // Sin red: buscar en caché
        const cached = await caches.match(request);
        if (cached) return cached;

        // Si es navegación HTML, mostrar página offline
        if (request.mode === 'navigate') {
          return caches.match('/new/offline.html');
        }
      })
  );
});

// ============================================================
// 4. BACKGROUND SYNC — Reintentar peticiones fallidas
// ============================================================
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    console.log('[SW] Background Sync disparado — enviando cola de peticiones');
    event.waitUntil(flushOutbox());
  }
});

// Abrir la base de datos IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Obtener todos los elementos en la cola
function getOutboxItems(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const store = tx.objectStore(DB_STORE);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Eliminar un item enviado correctamente
function deleteOutboxItem(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Enviar todos los items en cola
async function flushOutbox() {
  const db = await openDB();
  const items = await getOutboxItems(db);

  if (items.length === 0) {
    console.log('[SW] Cola vacía, nada que sincronizar');
    return;
  }

  console.log(`[SW] Sincronizando ${items.length} petición(es) en cola`);

  for (const item of items) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body
      });

      if (response.ok) {
        console.log('[SW] Petición enviada con éxito:', item.url);
        await deleteOutboxItem(db, item.id);

        // Notificar a la página que el sync fue exitoso
        notifyClients({ type: 'SYNC_SUCCESS', url: item.url, data: item.body });
      } else {
        console.warn('[SW] Error al enviar petición:', response.status);
      }
    } catch (error) {
      console.error('[SW] Error de red al sincronizar:', error);
      // Se reintentará en el próximo sync
    }
  }
}

// Notificar a todas las pestañas abiertas
function notifyClients(message) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => client.postMessage(message));
  });
}
