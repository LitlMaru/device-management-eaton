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
const input = document.getElementById("busqueda");

async function init() {
  currentUser = await ElectronAPI.invoke("get-current-user");
  env = await ElectronAPI.getEnv();
  HOST = env.HOST;
  PORT = env.PORT;
}

init();

const dispositivos = [];

function abrirModalAgregar() {
  document.getElementById("modalAgregar").style.display = "flex";
}

function cerrarModal(id) {
  document.getElementById(id).style.display = "none";
}

document
  .getElementById("esNuevoCheckbox")
  .addEventListener("change", function () {
    const esNuevo = this.checked;
    document.getElementById("nuevoDispositivoInputs").style.display = esNuevo
      ? "block"
      : "none";
    document.getElementById("selectExistenteInputs").style.display = esNuevo
      ? "none"
      : "block";
  });

function agregarDispositivo() {
  const nombre = document.getElementById("nombreAgregar").value.trim();
  const marca = document.getElementById("marcaAgregar").value.trim();
  const modelo = document.getElementById("modeloAgregar").value.trim();
  const cantidad = parseInt(document.getElementById("cantidadAgregar").value);
  const seriales = document
    .getElementById("serialesAgregar")
    .value.trim()
    .split(",");

  for (let i = 0; i < cantidad; i++) {
    const serial = seriales[i] ? seriales[i].trim() : `AUTO-${Date.now()}-${i}`;
    dispositivos.push({ serial, nombre, marca, modelo });
  }

  cerrarModal("modalAgregar");
  renderTabla();
  document.getElementById("serialesAgregar").value = "";
}

function renderTabla() {
  const tbody = document.querySelector("#tablaDispositivos tbody");
  tbody.innerHTML = "";

  const nombreFiltro = document
    .getElementById("buscarNombre")
    .value.toLowerCase();
  const marcaFiltro = document
    .getElementById("buscarMarca")
    .value.toLowerCase();
  const modeloFiltro = document
    .getElementById("buscarModelo")
    .value.toLowerCase();

  dispositivos.forEach((d, i) => {
    if (
      d.nombre.toLowerCase().includes(nombreFiltro) &&
      d.marca.toLowerCase().includes(marcaFiltro) &&
      d.modelo.toLowerCase().includes(modeloFiltro)
    ) {
      const fila = document.createElement("tr");
      fila.innerHTML = `
            <td>${d.serial}</td>
            <td>${d.nombre}</td>
            <td>${d.marca}</td>
            <td>${d.modelo}</td>
            <td>
              <button onclick="editarDispositivo(${i})">Editar</button>
              <button onclick="eliminarDispositivo(${i})">Eliminar</button>
            </td>`;
      tbody.appendChild(fila);
    }
  });
}

function editarDispositivo(index) {
  const d = dispositivos[index];
  document.getElementById("editarIndex").value = index;
  document.getElementById("editarSerial").value = d.serial;
  document.getElementById("editarNombre").value = d.nombre;
  document.getElementById("editarMarca").value = d.marca;
  document.getElementById("editarModelo").value = d.modelo;
  document.getElementById("modalEditar").style.display = "flex";
}

function guardarEdicion() {
  const i = parseInt(document.getElementById("editarIndex").value);
  dispositivos[i].serial = document.getElementById("editarSerial").value.trim();
  dispositivos[i].nombre = document.getElementById("editarNombre").value.trim();
  dispositivos[i].marca = document.getElementById("editarMarca").value.trim();
  dispositivos[i].modelo = document.getElementById("editarModelo").value.trim();
  cerrarModal("modalEditar");
  renderTabla();
}

function eliminarDispositivo(index) {
  if (confirm("¿Estás seguro de eliminar este dispositivo?")) {
    dispositivos.splice(index, 1);
    renderTabla();
  }
}

function exportarExcel() {
  let tabla = document.getElementById("tablaDispositivos");
  let wb = XLSX.utils.table_to_book(tabla, { sheet: "Inventario" });
  XLSX.writeFile(wb, "InventarioDispositivos.xlsx");
}

document.getElementById("buscarNombre").addEventListener("input", renderTabla);
document.getElementById("buscarMarca").addEventListener("input", renderTabla);
document.getElementById("buscarModelo").addEventListener("input", renderTabla);

async function getDevices() {
  tipoDispositivo = document.getElementById("buscarNombre").value;
  marca = document.getElementById("buscarMarca").value;
  modelo = document.getElementById("buscarModelo").value;
  serialNumber = document.getElementById("buscarSerial").value;

  try {
    const response = await fetch(`${HOST}:${PORT}/api/devices/`, {
      method: "GET",
      headers: {
        "x-ubicacion": currentUser.Ubicacion,
      },
      body: JSON.stringify({ tipoDispositivo, marca, modelo, serialNumber }),
    });

    const data = await result.json();
    return data;
  } catch (error) {
    alert("Error al cargar dispositivos: ", error.message);
  }
}

async function addDevice(){

}

async function deleteDevice(id) {
  try{
    await fetch(`${HOST}:${PORT}/api/devices/${id}`, {
      method: "DELETE"
    })
  } catch(err){
    console.log(err);
    alert("Error al eliminar dispositivos: ", err.messge)
  }
}

async function updateDevice(){

}

async function showDevices(data){

}

async function addType(){

}

async function addModel(){

}