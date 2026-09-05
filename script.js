let aplicaciones = [];

// 1. Cargar datos iniciales de prueba y guardados previos
document.addEventListener("DOMContentLoaded", () => {
    const datosGuardados = localStorage.getItem('mis_apks');
    
    if (datosGuardados) {
        // Si ya hay APKs guardados en el navegador, los cargamos
        aplicaciones = JSON.parse(datosGuardados);
        mostrarApps(aplicaciones);
    } else {
        // Si está vacío, creamos unos datos de prueba por defecto
        aplicaciones = [
          {
            "id": 1,
            "nombre": "Spotify Premium Mod",
            "version": "v8.9.22",
            "tamano": "65 MB",
            "imagen": "https://unsplash.com",
            "mod_info": "Skips ilimitados, Sin anuncios, Audio de alta calidad.",
            "link": "https://mediafire.com"
          },
          {
            "id": 2,
            "nombre": "Subway Surfers Hack",
            "version": "v3.25.0",
            "tamano": "145 MB",
            "imagen": "https://unsplash.com",
            "mod_info": "Monedas infinitas, Llaves ilimitadas, Todo desbloqueado.",
            "link": "https://mega.nz"
          }
        ];
        // Guardamos los datos de prueba en el almacenamiento local
        guardarEnNavegador();
        mostrarApps(aplicaciones);
    }
});

// Función auxiliar para guardar el estado actual en el almacenamiento local
function guardarEnNavegador() {
    localStorage.setItem('mis_apks', JSON.stringify(aplicaciones));
}

// 2. Función para renderizar las apps en el HTML
function mostrarApps(listaApps) {
    const grid = document.getElementById("grid-apps");
    grid.innerHTML = ""; 

    if(listaApps.length === 0) {
        grid.innerHTML = `<p style="color: #94a3b8; width: 100%; text-align: center;">No se encontraron aplicaciones.</p>`;
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

function abrirModal(app) {
    document.getElementById("modal-img").src = app.imagen;
    document.getElementById("modal-title").innerText = app.nombre;
    document.getElementById("modal-version").innerText = app.version;
    document.getElementById("modal-size").innerText = app.tamano;
    document.getElementById("modal-mod-info").innerText = app.mod_info;
    document.getElementById("modal-link").href = app.link;
    downloadModal.style.display = "flex";
}

openUploadBtn.addEventListener("click", () => uploadModal.style.display = "flex");

closeDownloadBtn.addEventListener("click", () => downloadModal.style.display = "none");
closeUploadBtn.addEventListener("click", () => uploadModal.style.display = "none");

window.addEventListener("click", (e) => {
    if (e.target === downloadModal) downloadModal.style.display = "none";
    if (e.target === uploadModal) uploadModal.style.display = "none";
});

// 5. Capturar datos del Formulario e insertarlos de verdad
const uploadForm = document.getElementById("upload-form");
uploadForm.addEventListener("submit", (e) => {
    e.preventDefault(); 

    const nuevaApp = {
        id: Date.now(), // Genera un ID único basado en el tiempo
        nombre: document.getElementById("app-name").value,
        version: document.getElementById("app-version").value,
        tamano: document.getElementById("app-size").value,
        imagen: document.getElementById("app-image").value,
        mod_info: document.getElementById("app-features").value,
        link: document.getElementById("app-link").value
    };

    // Agregar al inicio de la lista
    aplicaciones.unshift(nuevaApp);

    // Guardar los datos actualizados en el almacenamiento local
    guardarEnNavegador();

    // Actualizar la vista
    mostrarApps(aplicaciones);

    // Limpiar campos y cerrar cuadro emergente
    uploadForm.reset();
    uploadModal.style.display = "none";
});
