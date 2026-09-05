let aplicaciones = [];

// 1. Cargar datos desde el archivo JSON
document.addEventListener("DOMContentLoaded", () => {
    fetch('apps.json')
        .then(response => response.json())
        .then(data => {
            aplicaciones = data;
            mostrarApps(aplicaciones);
        })
        .catch(error => console.error("Error cargando los APKs:", error));
});

// 2. Función para renderizar las apps en el HTML
function mostrarApps(listaApps) {
    const grid = document.getElementById("grid-apps");
    grid.innerHTML = ""; // Limpiar contenedor

    if(listaApps.length === 0) {
        grid.innerHTML = `<p style="color: #94a3b8;">No se encontraron aplicaciones.</p>`;
        return;
    }

    listaApps.forEach(app => {
        const card = document.createElement("div");
        card.classList.add("app-card");
        card.innerHTML = `
            <img src="${app.imagen}" alt="${app.nombre}">
            <h3>${app.nombre}</h3>
            <p>${app.version} • ${app.tamano}</p>
        `;
        
        card.addEventListener("click", () => abrirModal(app));
        grid.appendChild(card);
    });
}

// 3. Buscador en tiempo real
const searchInput = document.getElementById("search-input");
searchInput.addEventListener("input", (e) => {
    const texto = e.target.value.toLowerCase();
    const filtradas = aplicaciones.filter(app => 
        app.nombre.toLowerCase().includes(texto) || 
        app.mod_info.toLowerCase().includes(texto)
    );
    mostrarApps(filtradas);
});

// 4. Lógica de la Ventana Emergente (Modal)
const modal = document.getElementById("download-modal");
const closeBtn = document.getElementById("close-modal");

function abrirModal(app) {
    document.getElementById("modal-img").src = app.imagen;
    document.getElementById("modal-title").innerText = app.nombre;
    document.getElementById("modal-version").innerText = app.version;
    document.getElementById("modal-size").innerText = app.tamano;
    document.getElementById("modal-mod-info").innerText = app.mod_info;
    document.getElementById("modal-link").href = app.link;

    modal.style.display = "flex";
}

closeBtn.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
});
