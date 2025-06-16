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
const typeSelect = document.getElementById("deviceType");

async function init() {
  currentUser = await ElectronAPI.invoke("get-current-user");
  env = await ElectronAPI.getEnv();
  HOST = env.HOST;
  PORT = env.PORT;
  fillTypeSelect(typeSelect);
  updateInventory();
}

init();

let currentRow = null;

function openPanel(row) {
  currentRow = row;
  const limiteActual = row.cells[3].textContent;
  document.getElementById("newLimit").value = limiteActual;

  document.getElementById("editPanel").style.display = "block";
  document.getElementById("modalOverlay").style.display = "block";
}

function closePanel() {
  document.getElementById("editPanel").style.display = "none";
  document.getElementById("modalOverlay").style.display = "none";
  currentRow = null;
}

function toggleAlert() {
  const list = document.getElementById("alert-list");
  const arrow = document.getElementById("arrow-icon");

  if (list.style.display === "none") {
    list.style.display = "block";
    arrow.style.transform = "rotate(180deg)";
  } else {
    list.style.display = "none";
    arrow.style.transform = "rotate(0deg)";
  }
}

async function saveLimitHandler(){
  const newLimit = parseInt(document.getElementById("newLimit").value);
  if (!isNaN(newLimit) && currentRow) {
    try {
      const model = currentRow.dataset.ID_Modelo;
      console.log(currentRow)
      await fetch(`${HOST}:${PORT}/api/inventory/limit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ modelo: model, nuevoLimite: newLimit }),
      });
      await updateInventory();
      closePanel();
    } catch (err) {
      console.log(err);
      alert("Error al actualizar límite: " + err.message);
    }
  } else {
    alert("Ingrese un número válido para el límite.");
  }
}


async function fillTypeSelect(selectElement) {
  const types = await getDeviceTypes();
  types.forEach((type) => {
    const option = document.createElement("option");
    option.value = type.ID_Tipo;
    option.textContent = type.Tipo;
    selectElement.appendChild(option);
  });
}

typeSelect.addEventListener("change", async () => {
  await updateInventory();
});

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

async function getGroupedInventory() {
  const selectedDeviceType = document.getElementById("deviceType").value;

  let url = `${HOST}:${PORT}/api/inventory/grouped-inventory`;
  if (selectedDeviceType) {
    url += `?tipoDispositivo=${encodeURIComponent(selectedDeviceType)}`;
  }
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-ubicacion": currentUser.Ubicacion,
      },
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.log(err);
    alert("Error al obtener inventario: " + err.message);
  }
}

async function updateInventory() {
  data = await getGroupedInventory();
  const tbody = document.querySelector("#inventoryTable tbody");
  tbody.innerHTML = "";
  data.forEach((model) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${model.TipoDispositivo}</td>
      <td>${model.Modelo}</td>
      <td>${model.Cantidad}</td>
      <td>${model.Limite}</td>
      <td>
        <button class="edit-btn" onclick="openPanel(this.closest('tr'))">Cambiar limite </button>
      </td>
      `;
    tr.dataset.ID_Modelo = model.ID_Modelo;
    tbody.appendChild(tr);
  });
  checkAlerts();
  document.querySelector("#saveLimit").addEventListener("click", saveLimitHandler);
}

function checkAlerts() {
  const alertList = document.getElementById("alert-list");
  alertList.innerHTML = "";
  const rows = document.querySelectorAll("#inventoryTable tbody tr");
  let showAlert = false;

  rows.forEach((row) => {
    const type = row.cells[0].textContent;
    const model = row.cells[1].textContent;
    const cantidad = parseInt(row.cells[2].textContent);
    const limite = parseInt(row.cells[3].textContent);

    if (cantidad < limite) {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${type} (${model})</strong> – ${cantidad} dispositivos restantes (Límite: ${limite})`;
      alertList.appendChild(li);
      showAlert = true;
    }
  });

  document.querySelector(".alert-box").style.display = showAlert
    ? "block"
    : "none";
}

function exportarExcel() {
  const table = document.getElementById("inventoryTable");
  const wb = XLSX.utils.table_to_book(table, { sheet: "Inventario" });
  XLSX.writeFile(wb, "Inventario_Dispositivos.xlsx");
}

function filtrarTabla() {
  const filtro = document.getElementById("deviceType").value.toLowerCase();
  const filas = document.querySelectorAll("#inventoryTable tbody tr");

  filas.forEach((fila) => {
    const tipo = fila.cells[0].textContent.toLowerCase();
    if (filtro === "" || tipo === filtro) {
      fila.style.display = "";
    } else {
      fila.style.display = "none";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  checkAlerts();
  filtrarTabla();
});
