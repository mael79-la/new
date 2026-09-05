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
    grid.innerHTML = ""; 

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

// 4. Lógica de Modales (Descarga y Subida)
const downloadModal = document.getElementById("download-modal");
const uploadModal = document.getElementById("upload-modal");

const closeDownloadBtn = document.getElementById("close-modal");
const closeUploadBtn = document.getElementById("close-upload");
const openUploadBtn = document.getElementById("open-upload-btn");

// Control de Modal de Descarga
function abrirModal(app) {
    document.getElementById("modal-img").src = app.imagen;
    document.getElementById("modal-title").innerText = app.nombre;
    document.getElementById("modal-version").innerText = app.version;
    document.getElementById("modal-size").innerText = app.tamano;
    document.getElementById("modal-mod-info").innerText = app.mod_info;
    document.getElementById("modal-link").href = app.link;
    downloadModal.style.display = "flex";
}

// Control de Modal de Subida
openUploadBtn.addEventListener("click", () => uploadModal.style.display = "flex");

// Eventos de Cierre
closeDownloadBtn.addEventListener("click", () => downloadModal.style.display = "none");
closeUploadBtn.addEventListener("click", () => uploadModal.style.display = "none");

window.addEventListener("click", (e) => {
    if (e.target === downloadModal) downloadModal.style.display = "none";
    if (e.target === uploadModal) uploadModal.style.display = "none";
});

// 5. Capturar datos del Formulario e insertarlos en la interfaz
const uploadForm = document.getElementById("upload-form");
uploadForm.addEventListener("submit", (e) => {
    e.preventDefault(); // Evita que la página se reinicie

    // Crear la nueva aplicación con los valores del formulario
    const nuevaApp = {
        id: aplicaciones.length + 1,
        nombre: document.getElementById("app-name").value,
        version: document.getElementById("app-version").value,
        tamano: document.getElementById("app-size").value,
        imagen: document.getElementById("app-image").value,
        mod_info: document.getElementById("app-features").value,
        link: document.getElementById("app-link").value
    };

    // Añadir el nuevo APK al inicio del array de datos
    aplicaciones.unshift(nuevaApp);

    // Actualizar la lista en pantalla
    mostrarApps(aplicaciones);

    // Limpiar el formulario y cerrar el modal
    uploadForm.reset();
    uploadModal.style.display = "none";
});
