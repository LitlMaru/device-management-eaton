const ElectronAPI = (() => {
  function sendMessage(action, data) {
    return new Promise((resolve, reject) => {
      const requestId = Math.random().toString(36).slice(2);

      function handler(event) {
        if (event.data && event.data.requestId === requestId) {
          window.removeEventListener("message", handler);
          if (event.data.success) {
            resolve(event.data.result || event.data.env);
          } else {
            reject(new Error(event.data.error));
          }
        }
      }

      window.addEventListener("message", handler);

      window.parent.postMessage({ action, data, requestId }, "*");
    });
  }

  return {
    invoke: (...args) => sendMessage("invoke-ipc", { args }),
    getEnv: () => sendMessage("get-env"),
  };
})();

let currentUser, HOST, PORT;

async function init() {
  currentUser = await ElectronAPI.invoke("get-current-user");
  env = await ElectronAPI.getEnv();
  HOST = env.HOST;
  PORT = env.PORT;
  cargarUsuarios();
  }
init();

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
    
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.warn("Respuesta inesperada del servidor:", data);
      return [];
    }

    return data;

  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    return [];  
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
      <td contenteditable="true" data-id="${usuario.Rol}" data-campo="Rol">${usuario.Rol}</td>
      <td contenteditable="true" data-id="${usuario.Ubicacion}" data-campo="Ubicacion">${usuario.Ubicacion}</td>
      <td>
        <div class="actions-container">
          <button onclick="eliminarUsuario('${usuario.Username}')">Eliminar usuario</button>
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
    await customAlert("Por favor completa todos los campos obligatorios.");
    return;
  }

  try {
    const usuarios = await obtenerUsuarios();
    console.log(usuarios)

    const existeUsuario = usuarios.some(u => u.Username.toLowerCase() === username.toLowerCase());

    if (existeUsuario) {
      await customAlert("Este nombre de usuario ya existe. Por favor elige otro.");
      return;
    }

    const response = await fetch(`${HOST}:${PORT}/api/users`, {
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
    await customAlert("Error al agregar usuario: " + err.message);
    console.error(err);
  }
}


async function eliminarUsuario(username) {
  confirmation = await customConfirm(`¿Estás seguro de que deseas eliminar al usuario "${username}"?`);
  if (!confirmation) {
    return;
  }

  try {
    const response = await fetch(`${HOST}:${PORT}/api/users/${encodeURIComponent(username)}`, {
      method: "DELETE"
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "No se pudo eliminar el usuario.");
    }

    await cargarUsuarios();

    document.querySelector("td[contenteditable='true']")[0].focus()
  } catch (err) {
    await customAlert("Error al eliminar usuario: " + err.message);
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
        const response = await fetch(`${HOST}:${PORT}/api/users`, {
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
        await customAlert("Error actualizando campo: " + err.message);
        console.error(err);
      }
    });
  });
}


/*async function agregarUsuario() {
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

*/