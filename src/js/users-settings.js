function abrirModal() {
  document.getElementById("modal").style.display = "flex";
}

function cerrarModal() {
  document.getElementById("modal").style.display = "none";
  limpiarCampos();
}

function limpiarCampos() {
  document.getElementById("username").value = "";
  document.getElementById("clave").value = "";
  document.getElementById("rol").value = "IT";
  document.getElementById("ubicacion").value = "MCB";
}

async function obtenerUsuarios() {
  try {
    const response = await fetch(`${HOST}:${PORT}/api/users/`);
    const data = await response.json();
    return data.usuarios;
    } catch (err) {
    }
  }

async function cargarUsuarios(){
   const usuarios = await obtenerUsuarios();
  const tbody = document.getElementById("cuerpoTablaUsuarios");
  tbody.innerHTML = ""; 

  usuarios.forEach((usuario) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${usuario.Username}</td>
      <td contenteditable="true" data-id="${usuario.ID_Usuario}" data-campo="Clave">${usuario.Clave}</td>
      <td contenteditable="true" data-id="${usuario.ID_Usuario}" data-campo="Rol">${usuario.Rol}</td>
      <td contenteditable="true" data-id="${usuario.ID_Usuario}" data-campo="Ubicacion">${usuario.Ubicacion}</td>
      <td>
        <div class="actions-container">
          <button onclick="eliminarUsuario(${usuario.Username})">Eliminar usuario</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  agregarListenersEdicion();
}

async function agregarUsuario() {
  const username = document.getElementById("username").value.trim();
  const clave = document.getElementById("clave").value.trim();
  const rol = document.getElementById("rol").value;
  const ubicacion = document.getElementById("ubicacion").value;

  if (!username || !clave) {
    alert("Por favor completa todos los campos obligatorios.");
    return;
  }

  try {
    const usuariosResponse = await fetch(`${HOST}:${PORT}/api/usuarios`);
    const usuarios = await usuariosResponse.json();

    const existeUsuario = usuarios.some(u => u.Username.toLowerCase() === username.toLowerCase());

    if (existeUsuario) {
      alert("Este nombre de usuario ya existe. Por favor elige otro.");
      return;
    }

    const response = await fetch(`${HOST}:${PORT}/api/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, clave, rol, ubicacion })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "No se pudo agregar el usuario.");
    }

    cerrarModal();
    await cargarUsuarios();
  } catch (err) {
    alert("Error al agregar usuario: " + err.message);
    console.error(err);
  }
}


async function eliminarUsuario(username) {
  if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${username}"?`)) {
    return;
  }

  try {
    const response = await fetch(`${HOST}:${PORT}/api/usuarios/${encodeURIComponent(username)}`, {
      method: "DELETE"
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "No se pudo eliminar el usuario.");
    }

    await cargarUsuarios();
  } catch (err) {
    alert("Error al eliminar usuario: " + err.message);
    console.error(err);
  }
}


function agregarListenersEdicion() {
  const celdasEditables = document.querySelectorAll('[contenteditable="true"]');
  
  celdasEditables.forEach((celda) => {
    celda.addEventListener("blur", async () => {
      const nuevoValor = celda.innerText.trim();
      const idUsuario = parseInt(celda.dataset.id, 10);
      const campo = celda.dataset.campo;

      try {
        const response = await fetch(`${HOST}:${PORT}/api/usuarios`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            idUsuario,
            campo,
            valor: nuevoValor
          })
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "No se pudo actualizar");
        }

        console.log(`✅ ${campo} actualizado correctamente`);
      } catch (err) {
        alert("Error actualizando campo: " + err.message);
        console.error(err);
      }
    });
  });
}


async function agregarUsuario() {
  const username = document.getElementById("username").value.trim();
  const clave = document.getElementById("clave").value.trim();
  const rol = document.getElementById("rol").value;
  const planta = document.getElementById("ubicacion").value;

  if (!username || !clave || !rol || !planta) {
    alert("Por favor, complete todos los campos.");
    return;
  }

  const nuevaFila = document.createElement("tr");
  nuevaFila.innerHTML = `
        <td>${username}</td>
        <td contenteditable="true">${clave}</td>
        <td contenteditable="true">${rol}</td>
        <td contenteditable="true">${planta}</td>
        <td>
          <div class="actions-container">
            <button onclick="eliminarFila(this)">Eliminar usuario</button>
          </div>
        </td>
      `;

  document.getElementById("cuerpoTablaUsuarios").appendChild(nuevaFila);
  cerrarModal();
}

async function eliminarUsuario(boton) {
  const fila = boton.closest("tr");
  if (fila) fila.remove();
}

cargarUsuarios();