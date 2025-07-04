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


  let ordenActual = {}; 
   function sortTable(colIndex, tablaID) {
      const table = document.getElementById(tablaID);
      const tbody = table.querySelector("tbody");
      const filas = Array.from(tbody.rows);

    
      if (!ordenActual[tablaID]) ordenActual[tablaID] = {};
      const direccionActual = ordenActual[tablaID][colIndex] || "desc";
      const nuevaDireccion = direccionActual === "asc" ? "desc" : "asc";
      ordenActual[tablaID][colIndex] = nuevaDireccion;

     
      table.querySelectorAll("th.sortable").forEach(th => {
        th.classList.remove("asc", "desc");
      });

      
      table.querySelectorAll("th")[colIndex].classList.add(nuevaDireccion);

      filas.sort((a, b) => {
        let aTexto = a.cells[colIndex].textContent.trim().toLowerCase();
        let bTexto = b.cells[colIndex].textContent.trim().toLowerCase();

       
        const aNum = Date.parse(aTexto);
        const bNum = Date.parse(bTexto);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return nuevaDireccion === "asc" ? aNum - bNum : bNum - aNum;
        }

        const aNumSimple = parseFloat(aTexto.replace(/[^0-9.-]+/g, ""));
        const bNumSimple = parseFloat(bTexto.replace(/[^0-9.-]+/g, ""));
        if (!isNaN(aNumSimple) && !isNaN(bNumSimple)) {
          return nuevaDireccion === "asc" ? aNumSimple - bNumSimple : bNumSimple - aNumSimple;
        }

        if (aTexto < bTexto) return nuevaDireccion === "asc" ? -1 : 1;
        if (aTexto > bTexto) return nuevaDireccion === "asc" ? 1 : -1;
        return 0;
      });

     
      tbody.innerHTML = "";
      filas.forEach(fila => tbody.appendChild(fila));
    }
    
async function abrirModalAgregar() {
  const template = document.getElementById("modalAgregar");
  const content = template.content.cloneNode(true);

  const modalContent = document.getElementById("modal-content");
  modalContent.innerHTML = "";
  modalContent.appendChild(content);
  document.getElementById("modalOverlay").classList.add("active");

  let typeSelect = document.getElementById("tipoDispositivo");
  const modelSelect = document.getElementById("Modelo");

  typeSelect.replaceWith(typeSelect.cloneNode(true));
  typeSelect = document.getElementById("tipoDispositivo");

  await fillTypeSelect(typeSelect);
  await fillModelSelect(modelSelect, 1);

  typeSelect.addEventListener("change", async () => {
    await fillModelSelect(modelSelect, typeSelect.value);
  });
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
  const def = document.createElement('option');
  def.value = "";
  def.disabled = true;
  def.textContent = "Seleccione un tipo";
  selectElement.appendChild(def);
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
const def = document.createElement('option');
  def.value = "";
  def.disabled = true;
  def.textContent = "Seleccione un modelo";
  selectElement.appendChild(def);
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
  window.focus();
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
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ubicacion": currentUser.Ubicacion,
      },
      body: JSON.stringify({ tipoDispositivo, marca, modelo, serialNumber }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.log(error);
    alert("Error al cargar dispositivos: " + error.message);
  }
}

async function addDevice() {}

async function deleteDevice(id) {
  try {
    await fetch(`${HOST}:${PORT}/api/devices/${id}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.log(err);
    alert("Error al eliminar dispositivos: ", err.messge);
  }
}

async function updateDevice() {
  const deviceID = document.getElementById("modalEditar").dataset.deviceID;
  const newSerial = document.getElementById("editarSerial").value;
  const newDeviceType = document.getElementById("editarTipoDispositivo").value;
  const newBrand = document.getElementById("editarMarca").value;
  const newModel = document.getElementById("editarModelo").value;

  try {
    await fetch(`${HOST}:${PORT}/api/devices/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        IDDispositivo: deviceID,
        tipoDispositivo: newDeviceType,
        marca: newBrand,
        modelo: newModel,
        serialNumber: newSerial,
      }),
    });
    showDevices();
  } catch (err) {
    console.log(err);
    alert("Error al actualizar dispositivo: " + err.message);
  }

  cerrarModal();
}

async function showDevices() {
  data = await getDevices();
  const tbody = document.querySelector("#tablaDispositivos tbody");
  tbody.innerHTML = "";

  data.forEach((device) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${device.ID_Dispositivo}</td>
      <td>${device.TipoDispositivo}</td>
      <td>${device.Marca}</td>
      <td>${device.Modelo}</td>
      <td>${device.Serial_Number}</td>
      <td>
        <div class="action-buttons">
        <button onclick="openEditModal(${device.ID_Dispositivo}, ${device.ID_Tipo}, ${device.ID_Modelo})">Editar</button>
        <button onclick="deleteDevice(${device.ID_Dispositivo})">Eliminar</button>
        </div>
      </td>`;

    tbody.append(tr);
  });
}

async function getDeviceTypes() {
  try {
    const response = await fetch(`${HOST}:${PORT}/api/inventory/device-types`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.log(err);
    alert("Error al obtener tipos de dispositivo: " + err.message);
  }
}

async function getModels(deviceTypeID) {
  let url = `${HOST}:${PORT}/api/inventory/models/`;
  if(deviceTypeID != ""){
    url += `?IDTipo=${encodeURIComponent(deviceTypeID)}`;
  }
  try {
    const response = await fetch(
      url,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-ubicacion": currentUser.Ubicacion,
        },
      }
    );

    const data = await response.json();
    return data;
  } catch (err) {
    console.log(err);
    alert(
      "Error al obtener modelos para el tipo de dispositivo seleccionado: " +
        err.message
    );
  }
}

async function addType(newType) {
  try {
    const response = await fetch(`${HOST}:${PORT}/api/inventory/add-type`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tipoDispositivo: newType }),
    });

    const typeID = response.json();
    return typeID;
  } catch (err) {
    console.log(err);
    alert("Error al agregar nuevo tipo: " + err.message);
    return;
  }
}

async function addModel(newModel, typeID) {
  try {
    const response = await fetch(`${HOST}:${PORT}/api/inventory/add-model`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ubicacion": currentUser.Ubicacion,
      },
      body: JSON.stringify({ modelo: newModel, ID_Tipo: typeID }),
    });

    const typeID = response.json();
    return typeID;
  } catch (err) {
    console.log(err);
    alert("Error al agregar nuevo modelo: " + err.message);
    return;
  }
}

async function addDevice() {
  const tipoSelectVisible = !document
    .getElementById("nombreSelectContainerAgregar")
    .classList.contains("hidden");
  const modeloSelectVisible = !document
    .getElementById("modeloSelectContainerAgregar")
    .classList.contains("hidden");

  let tipoID;
  if (tipoSelectVisible) {
    tipoID = document.getElementById("tipoDispositivo").value;
  } else {
    const nuevoTipo = document
      .getElementById("nombreAgregarNuevo")
      .value.trim();
    tipoID = await addType(nuevoTipo);
  }

  let modeloID;
  if (modeloSelectVisible) {
    modeloID = document.getElementById("Modelo").value;
  } else {
    const nuevoModelo = document
      .getElementById("modeloAgregarNuevo")
      .value.trim();
    modeloID = await addModel(nuevoModelo, tipoID);
  }

  const marca = document.getElementById("marcaAgregar").value;
  const cantidad = parseInt(document.getElementById("cantidadAgregar").value);
  const serialNumbers = document.getElementById("serialesAgregar").value;

  try {
    await fetch(`${HOST}:${PORT}/api/device/add-device`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ubicacion": currentUser.Ubicacion,
      },
      body: JSON.stringify({
        tipoID,
        marca,
        modeloID,
        cantidad,
        serialNumbers,
      }),
    });
  } catch (err) {
    console.log(err);
    alert("Error al agregar dispositivo: " + err.message);
  }
}

async function deleteDevice(deviceID) {
  try {
    await fetch(`${HOST}:${PORT}/api/devices/${deviceID}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.log(err);
    alert("Error al eliminar dispositivos: ");
  }
}
