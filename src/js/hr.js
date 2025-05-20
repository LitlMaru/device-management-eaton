
function mostrarContenido(seccion) {
    let contenido = '';

    switch (seccion) {
    case 'Registrar':
        contenido = `
        <div class="welcome-card">
            <h1>Registrar Usuario</h1>
            <p>Aquí podrás registrar nuevos empleados con sus datos completos para su gestión.</p>
        </div>
        `;
        break;

    case 'Buscador':
        contenido = `
        <div class="welcome-card">
            <h1>Buscador</h1>
            <p>Utiliza los filtros disponibles para buscar y encontrar rápidamente a cualquier empleado registrado.</p>
        </div>
        `;
        break;

    case 'RRHH':
        contenido = `
        <div class="welcome-card">
            <h1>Módulo de Recursos Humanos</h1>
            <p>Administra todo lo relacionado al personal, desde contrataciones hasta historial laboral.</p>
        </div>
        `;
        break;

    default:
        contenido = document.querySelector('.content').innerHTML;
    }

    document.getElementById('contenido').innerHTML = contenido;
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