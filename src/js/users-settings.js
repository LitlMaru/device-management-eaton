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
}

init();

function abrirModal() {
  document.getElementById("modal").style.display = "flex";
}

function cerrarModal() {
  document.getElementById("modal").style.display = "none";
  document
    .querySelectorAll("#modal input, #modal select")
    .forEach((el) => (el.value = ""));
}

async function agregarUsuario() {
  const username = document.getElementById("username").value;
  const clave = document.getElementById("clave").value;
  const rol = document.getElementById("rol").value;
  const ubicacion = document.getElementById("ubicacion").value;

  if (!username || !clave || !rol || !ubicacion) {
    alert("Rellene todos los campos para crear el nuevo usuario");
  } else {
    const filas = document.querySelectorAll("#cuerpoTablaUsuarios tr");
    let existente = false;
    for (let fila of filas) {
      const name = fila.cells[0].textContent.trim();
      if (username == name) {
        existente = true;
      }
    }
    if (!existente) {
      try {
        const respuesta = await fetch(`${HOST}:${PORT}/api/users/`, {
          method: "POST",
          body: JSON.stringify({ username, clave, rol, ubicacion }),
        });

        const data = await respuesta.json();
        cargarUsuarios();
      } catch (err) {
        alert("Error al agregar usuario: ", err);
      }
    }
  }

  cerrarModal();
}

async function cargarUsuarios() {
  const response = await fetch(`${HOST}}:${PORT}/api/users/`, {
    method: "GET",
  });
  const usuarios = await response.json();
  const cuerpo = document.getElementById("cuerpoTablaUsuarios");
  cuerpo.innerHTML = "";

  usuarios.forEach((usuario) => {
    const tr = document.createElement("tr");

    const tdNombre = document.createElement("td");
    tdNombre.textContent = usuario.Username;
    tr.appendChild(tdNombre);

    const tdClave = document.createElement("td");
    tdClave.textContent = usuario.Clave;
    tdClave.contentEditable = "true";
    tdClave.addEventListener("blur", () => {
      actualizarUsuarioCampo(usuario.ID_Usuario, "Clave", tdClave.textContent);
    });
    tr.appendChild(tdClave);

    const tdRol = document.createElement("td");
    tdRol.textContent = usuario.Rol;
    tdRol.contentEditable = "true";
    tdRol.addEventListener("blur", () => {
      actualizarUsuarioCampo(usuario.ID_Usuario, "Rol", tdRol.textContent);
    });
    tr.appendChild(tdRol);

    const tdUbicacion = document.createElement("td");
    tdUbicacion.textContent = usuario.Ubicacion;
    tdUbicacion.contentEditable = "true";
    tdUbicacion.addEventListener("blur", () => {
      actualizarUsuarioCampo(
        usuario.ID_Usuario,
        "Ubicacion",
        tdUbicacion.textContent
      );
    });
    tr.appendChild(tdUbicacion);

    const tdAcciones = document.createElement("td");
    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "Eliminar";
    btnEliminar.classList.add("eliminar-btn");
    btnEliminar.onclick = () => eliminarUsuario(usuario.ID_Usuario);
    tdAcciones.appendChild(btnEliminar);
    tr.appendChild(tdAcciones);

    cuerpo.appendChild(tr);
  });
}

async function actualizarUsuarioCampo(idUsuario, campo, valor) {
  try{
    const response = await fetch(`${HOST}:${PORT}/api/users/`, {
      method: "PUT",
      body: JSON.stringify({idUsuario, campo, valor})
    })
  }
  catch(err){
    alert("Error al actualizar campo: ", err)
  }
  //console.log( `Actualizar usuario ${idUsuario}, campo ${campo}, nuevo valor: ${valor}`);
}

async function eliminarUsuario(idUsuario) {
  try{
    const response = await fetch(`${HOST}:${PORT}/api/users/${idUsuario}`, {
      method: "DELETE"
  })
  } catch(err){
    alert("Error al eliminar usuario: ", err)
  }
  //console.log(`Eliminar usuario ${idUsuario}`);
}

document.addEventListener("DOMContentLoaded", cargarUsuarios);
