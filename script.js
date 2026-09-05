let aplicaciones = [];
let appSeleccionadaActual = null;
let contadorTiempo = null; // Guardará el temporizador activo

// 1. Cargar datos iniciales
document.addEventListener("DOMContentLoaded", () => {
    const datosGuardados = localStorage.getItem('mis_apks');
    
    if (datosGuardados) {
        aplicaciones = JSON.parse(datosGuardados);
        mostrarApps(aplicaciones);
    } else {
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
        guardarEnNavegador();
        mostrarApps(aplicaciones);
    }
});

function guardarEnNavegador() {
    localStorage.setItem('mis_apks', JSON.stringify(aplicaciones));
}

// 2. Renderizar Apps
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

// 3. Buscador
const searchInput = document.getElementById("search-input");
searchInput.addEventListener("input", (e) => {
    const texto = e.target.value.toLowerCase();
    const filtradas = aplicaciones.filter(app => 
        app.nombre.toLowerCase().includes(texto) || 
        app.mod_info.toLowerCase().includes(texto)
    );
    mostrarApps(filtradas);
});

// 4. Lógica de Modales y Contador de Anuncios
const downloadModal = document.getElementById("download-modal");
const uploadModal = document.getElementById("upload-modal");

const closeDownloadBtn = document.getElementById("close-modal");
const closeUploadBtn = document.getElementById("close-upload");
const openUploadBtn = document.getElementById("open-upload-btn");
const btnDescargar = document.getElementById("modal-download-action");

function abrirModal(app) {
    appSeleccionadaActual = app; 
    document.getElementById("modal-img").src = app.imagen;
    document.getElementById("modal-title").innerText = app.nombre;
    document.getElementById("modal-version").innerText = app.version;
    document.getElementById("modal-size").innerText = app.tamano;
    document.getElementById("modal-mod-info").innerText = app.mod_info;
    
    downloadModal.style.display = "flex";

    // INICIAR EL CONTADOR DE ANUNCIOS (10 Segundos)
    let segundosRestantes = 10;
    btnDescargar.classList.add("btn-bloqueado");
    btnDescargar.innerText = `Espera ${segundosRestantes}s para descargar...`;
    btnDescargar.disabled = true;

    // Limpiar cualquier contador viejo por seguridad
    clearInterval(contadorTiempo);

    contadorTiempo = setInterval(() => {
        segundosRestantes--;
        if (segundosRestantes > 0) {
            btnDescargar.innerText = `Espera ${segundosRestantes}s para descargar...`;
        } else {
            // El tiempo termina: Liberamos el botón
            clearInterval(contadorTiempo);
            btnDescargar.classList.remove("btn-bloqueado");
            btnDescargar.innerText = "⬇️ Descargar APK Mod Directa";
            btnDescargar.disabled = false;
        }
    }, 1000);
}

// Detener el contador si el usuario cierra la ventana antes de tiempo
function cerrarModalDescarga() {
    downloadModal.style.display = "none";
    clearInterval(contadorTiempo);
}

openUploadBtn.addEventListener("click", () => uploadModal.style.display = "flex");
closeDownloadBtn.addEventListener("click", cerrarModalDescarga);
closeUploadBtn.addEventListener("click", () => uploadModal.style.display = "none");

window.addEventListener("click", (e) => {
    if (e.target === downloadModal) cerrarModalDescarga();
    if (e.target === uploadModal) uploadModal.style.display = "none";
});

// Acción Final del Botón de Descarga
btnDescargar.addEventListener("click", () => {
    if (btnDescargar.disabled || !appSeleccionadaActual) return;

    if (appSeleccionadaActual.link && appSeleccionadaActual.link.trim() !== "") {
        window.open(appSeleccionadaActual.link, '_blank');
    } else {
        alert("Esta APK no tiene un enlace web válido configurado.");
    }
});

// Al hacer clic en un anuncio simulado, abre una pestaña (Simula conversión de clics)
document.querySelectorAll('.anuncio-box').forEach(anuncio => {
    anuncio.addEventListener('click', () => {
        window.open('https://google.com', '_blank');
    });
});

// 5. Capturar datos del Formulario
const uploadForm = document.getElementById("upload-form");
uploadForm.addEventListener("submit", (e) => {
    e.preventDefault(); 

    const archivosImagen = document.getElementById("app-image").files;
    if (archivosImagen.length === 0) return;

    const lector = new FileReader();
    lector.onloadend = function() {
        const imagenBase64 = lector.result; 

        const nuevaApp = {
            id: Date.now(), 
            nombre: document.getElementById("app-name").value,
            version: document.getElementById("app-version").value,
            tamano: document.getElementById("app-size").value,
            imagen: imagenBase64, 
            mod_info: document.getElementById("app-features").value,
            link: document.getElementById("app-link").value
        };

        aplicaciones.unshift(nuevaApp);
        guardarEnNavegador();
        mostrarApps(aplicaciones);

        uploadForm.reset();
        uploadModal.style.display = "none";
    };

    lector.readAsDataURL(archivosImagen);
});
