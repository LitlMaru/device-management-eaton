/*
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
    if(section == 'register'){
      register();
    }
    else if (section=="buscar"){
      initBuscar();
    }
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

fullScreenImage = document.getElementById("img-full-screen");
function maximizarVentana() {
    window.electronAPI.maximize();
    if(fullScreenImage.src == "../assets/fullscreenmode.svg") fullScreenImage.src = "../assets/windowmode.svg"
    else fullScreenImage.src = "../assets/fullscreenmode.svg"
}
function cerrarVentana() {
    window.electronAPI.close();
}


function closeSession(){
    window.location.href = "login.html"
}

let usuarios = [];

    function abrirModal() {
      document.getElementById("modal").style.display = "flex";
    }
    function cerrarModal() {
      document.getElementById("modal").style.display = "none";

      document.getElementById("idEmpleado").value = "";
      document.getElementById("nombre").value = "";
      document.getElementById("departamento").value = "";
      document.getElementById("posicion").value = "";
      document.getElementById("email").value = "";
      document.getElementById("fechaEntrada").value = "";
      document.getElementById("ubicacion").value = "MCB";
    }


    function actualizarTabla() {
      const tbody = document.getElementById("cuerpoTablaUsuarios");
      tbody.innerHTML = "";
      usuarios.forEach(usuario => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${usuario.idEmpleado}</td>
          <td>${usuario.nombre}</td>
          <td>${usuario.departamento}</td>
          <td>${usuario.posicion}</td>
          <td>${usuario.email}</td>
          <td>${usuario.fechaEntrada}</td>
          <td>${usuario.ubicacion}</td>
          <td><button class="btn-danger" onclick="eliminarUsuario('${usuario.idEmpleado}')">Eliminar</button></td>
        `;
        tbody.appendChild(tr);
      });
    }
 
    function enviarCorreo(usuario) {
      alert(
        `Correo enviado a ${usuario.email} con los datos:\n` +
          `ID: ${usuario.idEmpleado}\n` +
          `Nombre: ${usuario.nombre}\n` +
          `Departamento: ${usuario.departamento}\n` +
          `Posición: ${usuario.posicion}\n` +
          `Fecha Entrada: ${usuario.fechaEntrada}\n`
      );
    }

  function registrar(event){
    
  event.preventDefault();
  const name = document.getElementById("name").value.trim();
  const id = document.getElementById("employee-id").value.trim();
  const dept = document.getElementById("department").value.trim();
  const position = document.getElementById("position").value.trim();
  const email = document.getElementById("email").value.trim();

 if (!name || !id || !dept || !position) {
    showMessage("Por favor, complete todos los campos.", "error");
    return;
  }

  const currentDate = new Date().toISOString().split("T")[0];
  ipcRenderer.send("register-employee", () => {id, name, dept, position, email, currentDate})

 ipcRenderer.on("employee-added", () => {
  showMessage("Empleado agregado con éxito.", "success");
  document.getElementById("employee-form").reset();
});

ipcRenderer.on("employee-error", (event, message) => {
  showMessage(`Error: ${message}`, "error");
});

function showMessage(message, type) {
  const messageBox = document.getElementById("formMessage"); 
  messageBox.textContent = message;
  messageBox.className = ""; 
  messageBox.classList.add(type);
  messageBox.style.display = "block";


  setTimeout(() => {
    messageBox.style.display = "none";
  }, 4000);
  }

  const usuario = { id, name, dept, position, email, fechaEntrada};
      
  enviarCorreo(usuario);
}

 async function cargarUsuarios() {
  const cuerpo = document.getElementById('cuerpoTablaUsuarios');
  cuerpo.innerHTML = ''; // Limpiar tabla

  const usuarios = await ipcRenderer.invoke('get-users');

  if (usuarios.error) {
    alert('Error al obtener usuarios: ' + usuarios.error);
    return;
  }

  usuarios.forEach(user => {
    const tr = document.createElement('tr');

    // Username (NO editable)
    const tdUsername = document.createElement('td');
    tdUsername.textContent = user.Username;
    tdUsername.contentEditable = false;
    tr.appendChild(tdUsername);

    // Clave, Rol y Ubicación (editables)
    const camposEditables = ['Clave', 'Rol', 'Ubicacion'];
    camposEditables.forEach((campo, index) => {
      const td = document.createElement('td');
      td.contentEditable = true;
      td.textContent = user[campo];

      // Guardar automáticamente al salir del campo
      td.addEventListener('blur', () => {
        const nuevoUsuario = {
          username: tdUsername.textContent,
          clave: tr.children[1].textContent,
          rol: tr.children[2].textContent,
          ubicacion: tr.children[3].textContent
        };
        actualizarUsuario(nuevoUsuario);
      });

      tr.appendChild(td);
    });

    // Botón Eliminar
    const accionesTd = document.createElement('td');
    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.onclick = () => eliminarUsuario(user.Username);
    accionesTd.appendChild(btnEliminar);

    tr.appendChild(accionesTd);
    cuerpo.appendChild(tr);
  });
}


  async function eliminarUsuario(username) {
    const confirmacion = confirm(`¿Eliminar usuario ${username}?`);
    if (!confirmacion) return;

    const res = await ipcRenderer.invoke('delete-user', username);
    if (res.error) {
      alert('Error al eliminar: ' + res.error);
    } else {
      cargarUsuarios();
    }
  }

 async function actualizarUsuario(user) {
  const res = await ipcRenderer.invoke('update-user', user);
  if (res.error) {
    alert('Error al actualizar usuario: ' + res.error);
  }
}


   async function agregarUsuario() {
    const user = {
      username: document.getElementById('username').value,
      clave: document.getElementById('clave').value,
      rol: document.getElementById('rol').value,
      ubicacion: document.getElementById('ubicacion').value
    };

    const res = await ipcRenderer.invoke('add-user', user);
    if (res.error) {
      alert('Error al agregar: ' + res.error);
    } else {
      alert('Usuario agregado');
      cerrarModal();
      cargarUsuarios();
    }
  }


   function initBuscar(){
 const input = document.getElementById('busqueda');
  
  input.addEventListener('input', function () {
    const filtro = this.value.trim();

    ipcRenderer.invoke('query-employee-devices', { employeeInfo: filtro })
      .then(resultado => {
        actualizarTablaBusqueda(resultado);
      })
      .catch(error => {
        console.error('Error en consulta:', error);
      });
  });

    function exportarExcel() {
      alert("Función de exportar a Excel en desarrollo.");
    }
    }

  function formatearFecha(fechaISO) {
  if (!fechaISO) return '';
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

  function actualizarTablaBusqueda(datos){
 const tbody = document.querySelector('#tablaAsignados tbody');
  tbody.innerHTML = '';

  datos.forEach(fila => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${fila.ID_Asignacion || ''}</td>
      <td>${fila.ID_Empleado || ''}</td>
      <td>${fila.ID_Dispositivo || ''}</td>
      <td>${formatearFecha(fila.Fecha_asignacion) || ''}</td>
      <td>${formatearFecha(fila.Fecha_cambio) || ''}</td>
    `;
    tbody.appendChild(tr);
  }
)};*/

window.addEventListener("message", async (event) => {
  const { action, data, requestId } = event.data || {};

  if (!requestId) return; 

  try {
    if (action === "invoke-ipc") {
      const result = await window.electron.ipcRenderer.invoke(...data.args);
      event.source.postMessage({ requestId, success: true, result }, event.origin);
    } else if (action === "get-env") {
      event.source.postMessage({ requestId, success: true, env: window.env }, event.origin);
    } else {
      event.source.postMessage({ requestId, success: false, error: "Unknown action" }, event.origin);
    }
  } catch (error) {
    event.source.postMessage({ requestId, success: false, error: error.message }, event.origin);
  }
});

const iframe = document.getElementById("content");

iframe.onload = () => {
  iframe.contentWindow.electron = window.electron;
};

function loadPage(page) {
  iframe.src = `pages/${page}`;
}

function minimizeWindow() {
  window.electronAPI.minimize();
}

fullScreenImage = document.getElementById("img-full-screen");
function fullScreen() {
  window.electronAPI.maximize();
  if (fullScreenImage.src.includes("fullscreenmode.svg"))
    fullScreenImage.src = "../assets/windowmode.svg";
  else fullScreenImage.src = "../assets/fullscreenmode.svg";
}

function closeWindow() {
  window.electronAPI.close();
}

function closeSession() {
  window.location.href = "login.html";
}
