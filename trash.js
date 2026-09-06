// ============================================================
// trash.js — Papelera con localStorage para APKMod Community
// ============================================================

const TRASH_KEY = 'apkmod_trash';

function getTrash() {
  return JSON.parse(localStorage.getItem(TRASH_KEY) || '[]');
}
function saveTrash(arr) {
  localStorage.setItem(TRASH_KEY, JSON.stringify(arr));
}

// Obtener ID único de cada tarjeta
function getCardId(card) {
  return (
    card.dataset.id ||
    card.dataset.name ||
    card.querySelector('h3,h2,strong,.app-name,.card-title')?.textContent?.trim() ||
    card.innerText.slice(0, 40).trim()
  );
}

// Añadir botón 🗑️ a una tarjeta
function agregarBotonTrash(card) {
  if (card.querySelector('.trash-btn')) return; // ya tiene botón

  const id = getCardId(card);
  if (!id) return;

  card.dataset.trashId = id;
  card.style.position = 'relative';

  // Ocultar si ya estaba en papelera
  if (getTrash().includes(id)) {
    card.style.display = 'none';
    return;
  }

  const btn = document.createElement('button');
  btn.className = 'trash-btn';
  btn.innerHTML = '🗑️';
  btn.title = 'Eliminar';
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    eliminarCard(card, id);
  });
  card.appendChild(btn);
}

// Eliminar con animación
function eliminarCard(card, id) {
  const trash = getTrash();
  if (!trash.includes(id)) { trash.push(id); saveTrash(trash); }

  card.style.transition = 'opacity 0.3s, transform 0.3s';
  card.style.opacity = '0';
  card.style.transform = 'scale(0.9)';
  setTimeout(() => {
    card.style.display = 'none';
    actualizarContador();
  }, 300);
}

// Restaurar un ítem
function restaurarItem(id) {
  saveTrash(getTrash().filter(i => i !== id));
  const card = document.querySelector(`[data-trash-id="${CSS.escape(id)}"]`);
  if (card) {
    card.style.display = '';
    setTimeout(() => { card.style.opacity = '1'; card.style.transform = ''; }, 10);
  }
  actualizarContador();
}

// Restaurar todo
function restaurarTodo() {
  localStorage.removeItem(TRASH_KEY);
  document.querySelectorAll('[data-trash-id]').forEach(c => {
    c.style.display = '';
    setTimeout(() => { c.style.opacity = '1'; c.style.transform = ''; }, 10);
  });
  actualizarContador();
}

// FAB flotante
function crearFAB() {
  const fab = document.createElement('div');
  fab.id = 'trash-fab';
  fab.innerHTML = `<span id="trash-count" class="trash-count">0</span><span>🗑️</span>`;
  fab.addEventListener('click', mostrarModal);
  document.body.appendChild(fab);
}

// Actualizar contador
function actualizarContador() {
  const n = getTrash().length;
  const el = document.getElementById('trash-count');
  if (el) { el.textContent = n; el.style.display = n > 0 ? 'flex' : 'none'; }
}

// Modal de papelera
function mostrarModal() {
  document.getElementById('trash-modal')?.remove();
  const trash = getTrash();
  const modal = document.createElement('div');
  modal.id = 'trash-modal';
  modal.innerHTML = `
    <div class="trash-overlay"></div>
    <div class="trash-panel">
      <div class="trash-header">
        <h3>🗑️ Papelera (${trash.length})</h3>
        <button class="trash-close">✕</button>
      </div>
      <div class="trash-list">
        ${trash.length === 0
          ? '<p class="trash-empty">La papelera está vacía</p>'
          : trash.map(id => `
              <div class="trash-item">
                <span>${id}</span>
                <button class="restore-btn" data-id="${id}">↩️ Restaurar</button>
              </div>`).join('')}
      </div>
      ${trash.length > 0 ? `<button class="vaciar-btn">↩️ Restaurar todo</button>` : ''}
    </div>`;
  document.body.appendChild(modal);

  modal.querySelector('.trash-overlay').onclick = () => modal.remove();
  modal.querySelector('.trash-close').onclick = () => modal.remove();
  modal.querySelector('.vaciar-btn')?.addEventListener('click', () => {
    restaurarTodo(); modal.remove();
  });
  modal.querySelectorAll('.restore-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      restaurarItem(btn.dataset.id);
      modal.remove(); mostrarModal();
    });
  });
}

// MutationObserver: detecta tarjetas añadidas dinámicamente por script.js
function observarGrid() {
  const grid = document.getElementById('grid-apps');
  if (!grid) return;

  // Procesar tarjetas que ya existen
  grid.querySelectorAll(':scope > *').forEach(agregarBotonTrash);

  // Observar nuevas tarjetas
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1) agregarBotonTrash(node);
      });
    });
    actualizarContador();
  });
  observer.observe(grid, { childList: true });
}

// Estilos
function inyectarEstilos() {
  const s = document.createElement('style');
  s.textContent = `
    .trash-btn {
      position: absolute; top: 8px; right: 8px;
      background: rgba(0,0,0,0.6); border: none; border-radius: 50%;
      width: 34px; height: 34px; font-size: 16px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.2s, background 0.2s; z-index: 10;
    }
    @media (pointer: coarse) { .trash-btn { opacity: 1; } }
    *:hover > .trash-btn { opacity: 1; }
    .trash-btn:hover { background: rgba(220,53,69,0.9); }

    #trash-fab {
      position: fixed; bottom: 80px; right: 18px;
      width: 54px; height: 54px; background: #1a1a2e;
      border: 2px solid #4CAF50; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.5); z-index: 998;
      transition: transform 0.2s;
    }
    #trash-fab:hover { transform: scale(1.1); }
    .trash-count {
      position: absolute; top: -5px; right: -5px;
      background: #e74c3c; color: #fff; border-radius: 50%;
      width: 20px; height: 20px; font-size: 11px; font-weight: 700;
      align-items: center; justify-content: center; display: none;
    }
    .trash-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 999;
    }
    .trash-panel {
      position: fixed; bottom: 0; left: 0; right: 0;
      background: #1a1a2e; border-radius: 20px 20px 0 0;
      padding: 1.2rem 1rem; z-index: 1000;
      max-height: 60vh; overflow-y: auto; color: #eee;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .trash-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 0.8rem;
    }
    .trash-header h3 { font-size: 1.05rem; }
    .trash-close {
      background: none; border: none; color: #aaa; font-size: 1.2rem; cursor: pointer;
    }
    .trash-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.6rem 0; border-bottom: 1px solid #2a2a3e; font-size: 0.88rem;
    }
    .trash-item span { flex: 1; margin-right: 0.5rem; word-break: break-all; }
    .restore-btn {
      background: #2a2a3e; border: none; color: #4CAF50;
      padding: 0.35rem 0.75rem; border-radius: 1rem; cursor: pointer; font-size: 0.8rem;
      white-space: nowrap;
    }
    .vaciar-btn {
      width: 100%; margin-top: 0.8rem; padding: 0.8rem;
      background: #4CAF50; color: #fff; border: none;
      border-radius: 1rem; font-size: 1rem; cursor: pointer; font-weight: 600;
    }
    .trash-empty { color: #555; text-align: center; padding: 1rem; }
  `;
  document.head.appendChild(s);
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  inyectarEstilos();
  crearFAB();
  observarGrid();
  actualizarContador();
});
