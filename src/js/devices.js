

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

async function cargarDispositivos() {
  const filtros = {
    tipoDispositivo: document.getElementById("deviceTypeSelect").value,
    marca: document.getElementById("brandSearch").value,
    modelo: document.getElementById("modelSelect").value,
    serialNumber: document.getElementById("serialNumberSearch").value,
  };

  const dispositivos = await ipcRenderer.invoke("get-devices", filtros);
  const tbody = document.getElementById("deviceTableBody");
  tbody.innerHTML = "";

  dispositivos.forEach((dispositivo) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${dispositivo.Tipo}</td>
      <td>${dispositivo.Marca}</td>
      <td>${dispositivo.Modelo}</td>
      <td>${dispositivo.Serial_Number}</td>
    `;

    const accionesTd = document.createElement("td");

    const btnEditar = document.createElement("button");
    btnEditar.textContent = "Editar SN";
    btnEditar.className = "btn btn-sm btn-warning me-2";
    btnEditar.onclick = () =>
      editarSerial(dispositivo.ID, dispositivo.Serial_Number);

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "Eliminar";
    btnEliminar.className = "btn btn-sm btn-danger";
    btnEliminar.onclick = () => eliminarDispositivo(dispositivo.ID);

    accionesTd.appendChild(btnEditar);
    accionesTd.appendChild(btnEliminar);

    tr.appendChild(accionesTd);
    tbody.appendChild(tr);
  });
}

function openSNModal(id, actualSerialNumber) {
  document.getElementById("modalSN").style.display = "flex";
  document.getElementById("actual-sn").textContent = actualSerialNumber;
  document
    .getElementById("save-sn-btn")
    .addEventListener("click", updateSerialNumber(id, actualSerialNumber));
}

async function updateSerialNumber(id, actualSerialNumber) {
  newSerialNumber = document.getElementById("input-new-sn").value;
  document.getElementById("message-box").textContent = newSerialNumber;
  if (
    newSerialNumber &&
    newSerialNumber.trim() !== "" &&
    newSerialNumber !== actualSerialNumber
  ) {
    try{
      const response = await fetch(`${HOST}:${PORT}/api/devices/serial-number`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({id, newSerialNumber})
      })

      const data = await response.json();
      document.getElementById("message-box").textContent = "Número de serie actualizado"
    }
    catch(err){
      document.getElementById("message-box").textContent = "Error al actualizar: " +  err
    }
    /*const respuesta = await ipcRenderer.invoke("update-serial", {
      id,
      nuevoSerial,
    });
    if (respuesta.success) {
      alert("Número de serie actualizado");
      cargarDispositivos();
    } else {
      alert("Error al actualizar: " + respuesta.error);
    }*/
  }
}

function closeSNModal() {
  document.getElementById("modalSN").style.display = "none";
  document.getElementById("message-box").textContent = "";
}

async function eliminarDispositivo(id) {
  const confirmar = confirm("¿Seguro que deseas eliminar este dispositivo?");
  if (confirmar) {
    const respuesta = await ipcRenderer.invoke("delete-device", id);
    if (respuesta.success) {
      alert("Dispositivo eliminado");
      cargarDispositivos();
    } else {
      alert("Error al eliminar: " + respuesta.error);
    }
  }
}
