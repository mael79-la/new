// ============================================================
// pwa-helper.js — Registro del SW + API de sincronización
// Incluye este archivo en tu index.html antes de cerrar </body>
// ============================================================

const DB_NAME = 'sync-db';
const DB_STORE = 'outbox';
const SYNC_TAG = 'outbox-sync';

// ============================================================
// 1. Registrar el Service Worker
// ============================================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/new/service-worker.js', {
        scope: '/new/'
      });
      console.log('[PWA] Service Worker registrado:', registration.scope);

      // Escuchar mensajes del SW (sincronización completada)
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_SUCCESS') {
          console.log('[PWA] Datos sincronizados exitosamente:', event.data.url);
          // ✅ Aquí puedes actualizar la UI: mostrar un toast, refrescar datos, etc.
          mostrarNotificacion('Datos sincronizados correctamente ✅');
        }
      });

    } catch (error) {
      console.error('[PWA] Error al registrar Service Worker:', error);
    }
  });
}

// ============================================================
// 2. Abrir IndexedDB (cola offline)
// ============================================================
function abrirDB() {
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

// ============================================================
// 3. Guardar petición en la cola offline (IndexedDB)
// ============================================================
async function guardarEnCola(url, method, headers, body) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    const item = {
      url,
      method: method || 'POST',
      headers: headers || { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
      timestamp: Date.now()
    };
    const request = store.add(item);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ============================================================
// 4. fetchConSync — Úsalo en lugar de fetch() normal
//    Si hay red: envía directamente.
//    Si no hay red: guarda en cola y programa Background Sync.
// ============================================================
async function fetchConSync(url, options = {}) {
  try {
    // Intentar enviar con red
    const response = await fetch(url, options);
    return response;

  } catch (error) {
    // Sin red → guardar en IndexedDB + registrar sync
    console.warn('[PWA] Sin conexión, guardando en cola offline:', url);

    await guardarEnCola(
      url,
      options.method || 'POST',
      options.headers || { 'Content-Type': 'application/json' },
      options.body || ''
    );

    // Registrar Background Sync si el navegador lo soporta
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const sw = await navigator.serviceWorker.ready;
      await sw.sync.register(SYNC_TAG);
      console.log('[PWA] Background Sync registrado — se enviará al recuperar conexión');
    } else {
      // Fallback: escuchar el evento online manualmente
      console.warn('[PWA] Background Sync no soportado, usando fallback de evento "online"');
      window.addEventListener('online', intentarSincronizarManual, { once: true });
    }

    // Lanzar error para que el código que llama sepa que fue offline
    throw new Error('OFFLINE');
  }
}

// ============================================================
// 5. Fallback manual para navegadores sin SyncManager
// ============================================================
async function intentarSincronizarManual() {
  const db = await abrirDB();
  const tx = db.transaction(DB_STORE, 'readonly');
  const store = tx.objectStore(DB_STORE);
  const items = await new Promise((res, rej) => {
    const r = store.getAll();
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });

  for (const item of items) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body
      });

      if (response.ok) {
        const delTx = db.transaction(DB_STORE, 'readwrite');
        delTx.objectStore(DB_STORE).delete(item.id);
        mostrarNotificacion('Datos sincronizados ✅');
      }
    } catch (e) {
      console.error('[PWA] Error en sync manual:', e);
    }
  }
}

// ============================================================
// 6. Utilidad: mostrar notificación/toast en pantalla
//    Personaliza esto según el diseño de tu app
// ============================================================
function mostrarNotificacion(mensaje) {
  const toast = document.createElement('div');
  toast.textContent = mensaje;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '1.5rem',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#1a73e8',
    color: '#fff',
    padding: '0.75rem 1.5rem',
    borderRadius: '2rem',
    fontFamily: 'sans-serif',
    fontSize: '0.95rem',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    zIndex: 9999,
    opacity: '0',
    transition: 'opacity 0.3s'
  });
  document.body.appendChild(toast);
  setTimeout(() => (toast.style.opacity = '1'), 50);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ============================================================
// EJEMPLO DE USO:
//
// En lugar de:
//   fetch('/api/guardar', { method: 'POST', body: JSON.stringify(datos) })
//
// Usa:
//   fetchConSync('/api/guardar', { method: 'POST', body: JSON.stringify(datos) })
//     .then(res => console.log('Enviado!'))
//     .catch(err => {
//       if (err.message === 'OFFLINE') {
//         console.log('Sin conexión — se enviará automáticamente al reconectar');
//       }
//     });
// ============================================================
