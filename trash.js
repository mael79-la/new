// ============================================================
// trash.js — Papelera con localStorage para APKMod Community
// Añade al final de tu index.html: <script src="/new/trash.js"></script>
// ============================================================

const TRASH_KEY = 'apkmod_trash'; // clave en localStorage

// ── Cargar lista de eliminados ────────────────────────────
function getTrash() {
  return JSON.parse(localStorage.getItem(TRASH_KEY) || '[]');
}

function saveTrash(arr) {
  localStorage.setItem(TRASH_KEY, JSON.stringify(arr));
}

// ── Añadir ícono 🗑️ a cada tarjeta ───────────────────────
function initTrash() {
  // ⚠️ Ajusta el selector si tus tarjetas usan otra clase
  const cards = document.querySelectorAll('.app-card, .card, [data-id]');

  cards.forEach((card) => {
    // ID único: usa data-id, o el nombre del texto, o el índice
    const id =
      card.dataset.id ||
      card.querySelector('h2,h3,strong,.app-name')?.textContent?.trim() ||
      card.innerText.slice(0, 30);

    if (!id) return;
    card.dataset.trashId = id;

    // Si ya estaba en la papelera, ocultarlo
    if (getTrash().includes(id)) {
      card.style.display = 'none';
      return;
    }

    // Crear botón de papelera
    const btn = document.createElement('button');
    btn.className = 'trash-btn';
    btn.innerHTML = '🗑️';
    btn.title = 'Eliminar';
    btn.setAttribute('aria-label', 'Eliminar');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      eliminarCard(card, id);
    });

    // Asegurarse de que la tarjeta tenga position relativa
    card.style.position = 'relative';
    card.appendChild(btn);
  });
}

// ── Eliminar con animación ────────────────────────────────
function eliminarCard(card, id) {
  // Guardar en localStorage
  const trash = getTrash();
  if (!trash.includes(id)) {
    trash.push(id);
    saveTrash(trash);
  }

  // Animación de desaparición
  card.style.transition = 'opacity 0.3s, transform 0.3s';
  card.style.opacity = '0';
  card.style.transform = 'scale(0.92)';

  setTimeout(() => {
    card.style.display = 'none';
    actualizarContadorPapelera();
  }, 300);
}

// ── Restaurar todos los eliminados ───────────────────────
function vaciarPapelera() {
  localStorage.removeItem(TRASH_KEY);
  document.querySelectorAll('[data-trash-id]').forEach((card) => {
    card.style.display = '';
    card.style.opacity = '1';
    card.style.transform = '';
  });
  actualizarContadorPapelera();
  alert('✅ Todos los elementos restaurados');
}

// ── Botón flotante de papelera + contador ─────────────────
function crearBotonPapelera() {
  const fab = document.createElement('div');
  fab.id = 'trash-fab';
  fab.innerHTML = `
    <span id="trash-count" class="trash-count">0</span>
    <span class="trash-icon">🗑️</span>
  `;
  fab.title = 'Ver papelera';
  fab.addEventListener('click', mostrarPapelera);
  document.body.appendChild(fab);
}

// ── Modal de papelera ─────────────────────────────────────
function mostrarPapelera() {
  const trash = getTrash();
  const existing = document.getElementById('trash-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'trash-modal';
  modal.innerHTML = `
    <div class="trash-overlay" id="trash-overlay"></div>
    <div class="trash-panel">
      <div class="trash-header">
        <h3>🗑️ Papelera (${trash.length})</h3>
        <button class="trash-close" id="trash-close">✕</button>
      </div>
      <div class="trash-list">
        ${trash.length === 0
          ? '<p class="trash-empty">La papelera está vacía</p>'
          : trash.map(id => `
              <div class="trash-item">
                <span>${id}</span>
                <button class="restore-btn" data-restore="${id}">↩️ Restaurar</button>
              </div>`).join('')
        }
      </div>
      ${trash.length > 0 ? `
        <div class="trash-footer">
          <button class="vaciar-btn" id="vaciar-btn">↩️ Restaurar todo</button>
        </div>` : ''}
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('trash-close').onclick = () => modal.remove();
  document.getElementById('trash-overlay').onclick = () => modal.remove();
  document.getElementById('vaciar-btn')?.addEventListener('click', () => {
    vaciarPapelera();
    modal.remove();
  });

  // Restaurar uno por uno
  modal.querySelectorAll('.restore-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.restore;
      restaurarItem(id);
      modal.remove();
      mostrarPapelera(); // reabrir actualizado
    });
  });
}

// ── Restaurar un ítem individual ──────────────────────────
function restaurarItem(id) {
  const trash = getTrash().filter(i => i !== id);
  saveTrash(trash);

  const card = document.querySelector(`[data-trash-id="${CSS.escape(id)}"]`);
  if (card) {
    card.style.display = '';
    card.style.opacity = '1';
    card.style.transform = '';
  }
  actualizarContadorPapelera();
}

// ── Actualizar el contador del FAB ────────────────────────
function actualizarContadorPapelera() {
  const count = getTrash().length;
  const el = document.getElementById('trash-count');
  if (el) {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  }
}

// ── Estilos ───────────────────────────────────────────────
function inyectarEstilos() {
  const style = document.createElement('style');
  style.textContent = `
    /* Botón 🗑️ en cada tarjeta */
    .trash-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(0,0,0,0.55);
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      font-size: 15px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s, background 0.2s;
      z-index: 10;
    }
    .app-card:hover .trash-btn,
    .card:hover .trash-btn,
    [data-id]:hover .trash-btn { opacity: 1; }
    /* En móvil siempre visible */
    @media (pointer: coarse) { .trash-btn { opacity: 1; } }
    .trash-btn:hover { background: rgba(220,53,69,0.85); }

    /* FAB flotante */
    #trash-fab {
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 52px;
      height: 52px;
      background: #1e1e2e;
      border: 2px solid #4CAF50;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      z-index: 999;
      transition: transform 0.2s;
    }
    #trash-fab:hover { transform: scale(1.1); }

    .trash-count {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #e74c3c;
      color: #fff;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      font-size: 11px;
      font-weight: 700;
      align-items: center;
      justify-content: center;
      display: none;
    }

    /* Modal papelera */
    .trash-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 1000;
    }
    .trash-panel {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      background: #1a1a2e;
      border-radius: 20px 20px 0 0;
      padding: 1.2rem;
      z-index: 1001;
      max-height: 60vh;
      overflow-y: auto;
      color: #eee;
      font-family: sans-serif;
    }
    .trash-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .trash-header h3 { font-size: 1.1rem; }
    .trash-close {
      background: none; border: none; color: #aaa;
      font-size: 1.2rem; cursor: pointer;
    }
    .trash-item {
      display: flex; justify-content: space-between;
      align-items: center; padding: 0.6rem 0;
      border-bottom: 1px solid #2a2a3e;
      font-size: 0.9rem;
    }
    .restore-btn {
      background: #2a2a3e; border: none; color: #4CAF50;
      padding: 0.4rem 0.8rem; border-radius: 1rem;
      cursor: pointer; font-size: 0.8rem;
    }
    .vaciar-btn {
      width: 100%; margin-top: 1rem; padding: 0.8rem;
      background: #4CAF50; color: #fff; border: none;
      border-radius: 1rem; font-size: 1rem; cursor: pointer;
    }
    .trash-empty { color: #666; text-align: center; padding: 1rem; }
  `;
  document.head.appendChild(style);
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  inyectarEstilos();
  crearBotonPapelera();
  initTrash();
  actualizarContadorPapelera();
});
