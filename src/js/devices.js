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
  showDevices();
}

init();

const dispositivos = [];

function abrirModalAgregar() {
  const template = document.getElementById("modalAgregar");
  const content = template.content.cloneNode(true);

  const modalContent = document.getElementById("modal-content");
  modalContent.innerHTML = "";
  modalContent.appendChild(content);
  document.getElementById("modalOverlay").classList.add("active");
}

function mostrarInputNuevoTipo() {
  document
    .getElementById("nombreSelectContainerAgregar")
    .classList.add("hidden");
  document
    .getElementById("nombreInputContainerAgregar")
    .classList.remove("hidden");
}

function cancelarNuevoTipo() {
  document
    .getElementById("nombreSelectContainerAgregar")
    .classList.remove("hidden");
  document
    .getElementById("nombreInputContainerAgregar")
    .classList.add("hidden");
  document.getElementById("nombreAgregarNuevo").value = "";
}

function mostrarInputNuevoModelo() {
  document
    .getElementById("modeloSelectContainerAgregar")
    .classList.add("hidden");
  document
    .getElementById("modeloInputContainerAgregar")
    .classList.remove("hidden");
}

function cancelarNuevoModelo() {
  document
    .getElementById("modeloSelectContainerAgregar")
    .classList.remove("hidden");
  document
    .getElementById("modeloInputContainerAgregar")
    .classList.add("hidden");
  document.getElementById("modeloAgregarNuevo").value = "";
}

function cerrarModal() {
  const overlay = document.getElementById("modalOverlay");
  overlay.classList.remove("active");

  // Optional: clear modal content to avoid stale event listeners or data
  const modalContent = document.getElementById("modal-content");
  modalContent.innerHTML = "";
}

async function openDeleteModal() {
  const template = document.getElementById("modalEliminar");
  const content = template.content.cloneNode(true);

  const modalContent = document.getElementById("modal-content");
  modalContent.innerHTML = "";
  modalContent.appendChild(content);
  document.getElementById("modalOverlay").classList.add("active");

  let typeSelect = document.getElementById("eliminarTipo");
  const modelSelect = document.getElementById("eliminarModelo");

  typeSelect.replaceWith(typeSelect.cloneNode(true));
  typeSelect = document.getElementById("eliminarTipo");

  await fillTypeSelect(typeSelect);
  await fillModelSelect(modelSelect, 1);

  typeSelect.addEventListener("change", async () => {
    await fillModelSelect(modelSelect, typeSelect.value);
  });
}
async function fillTypeSelect(selectElement) {
  const types = await getDeviceTypes();
  selectElement.innerHTML = "";
  types.forEach((type) => {
    const option = document.createElement("option");
    option.value = type.ID_Tipo;
    option.textContent = type.Tipo;
    selectElement.appendChild(option);
  });
}

async function fillModelSelect(selectElement, typeID) {
  const models = await getModels(typeID);
  selectElement.innerHTML = "";
  models.forEach((model) => {
    const option = document.createElement("option");
    option.value = model.ID_Modelo;
    option.textContent = model.Modelo;
    selectElement.appendChild(option);
  });
}

async function openEditModal(deviceID, typeID, modelID) {
  const template = document.getElementById("modalEditar");
  const content = template.content.cloneNode(true);

  const modalContent = document.getElementById("modal-content");
  modalContent.innerHTML = "";
  modalContent.appendChild(content);
  document.getElementById("modalOverlay").classList.add("active");

  modalContent.dataset.deviceID = deviceID;

  let deviceTypeSelect = document.getElementById("editarTipoDispositivo");
  const modelSelect = document.getElementById("editarModelo");

  deviceTypeSelect.replaceWith(deviceTypeSelect.cloneNode(true));
  deviceTypeSelect = document.getElementById("editarTipoDispositivo");

  await fillTypeSelect(deviceTypeSelect);

  deviceTypeSelect.value = typeID;

  deviceTypeSelect.addEventListener("change", async () => {
    await fillModelSelect(modelSelect, deviceTypeSelect.value);
  });

  fillModelSelect(modelSelect, typeID);
}

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

  cerrarModal();
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
              <button onclick="openEditModal(${i})">Editar</button>
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
  cerrarModal();
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
