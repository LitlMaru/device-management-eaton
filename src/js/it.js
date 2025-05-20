

function mostrarContenido(seccion) {
    alert(seccion);
    document.getElementById('contenido').innerHTML = `
    <h1>${seccion}</h1>
    <p style="text-align:center; font-size:18px;">Contenido de la sección <strong>${seccion}</strong> pronto estará disponible.</p>
    `;
}

function showContent(section) {
const content = document.getElementById('contenido');
fetch(`${section.toLowerCase()}.html`)
.then(res => {
    if (!res.ok) throw new Error("No se puedo cargar la seccion");
    return res.text();
})
.then(html => {
    content.innerHTML = html;
})
.catch(err => {
    content.innerHTML = `<div class="welcome-card"><h1>Error</h1><p>${err.message}</p></div>`;
})
}
function minimizarVentana() {
    window.electronAPI.minimize();
}

function maximizarVentana() {
    window.electronAPI.maximize();
}

function cerrarVentana() {
    window.electronAPI.close();
}