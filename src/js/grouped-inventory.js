let currentModel = null;
let currentUser, HOST = "http://localhost", PORT = "3000";

// Simulación para desarrollo local (quítalo si estás en Electron)
currentUser = { Ubicacion: "ICD" };

// Modal
function toggleModal(show) {
  document.getElementById("editModal").classList.toggle("hidden", !show);
}

// Cargar inventario
async function loadInventory(type = "") {
  const url = `${HOST}:${PORT}/api/inventory/grouped-inventory${
    type ? `?deviceType=${encodeURIComponent(type)}` : ""
  }`;

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "x-ubicacion": currentUser.Ubicacion,
      },
    });

    const data = await response.json();
    if (!Array.isArray(data)) {
      console.error("Respuesta inesperada:", data);
      alert("Hubo un error al cargar el inventario. Ver consola.");
      return;
    }
    renderTable(data);
  } catch (err) {
    console.error("Error cargando inventario:", err);
  }
}


function renderTable(data) {
  const tbody = document.querySelector("#inventoryTable tbody");
  const alertList = document.getElementById("alert-list");

  tbody.innerHTML = "";
  alertList.innerHTML = "";

  let hasLowStock = false;

  data.forEach((row) => {
    const tr = document.createElement("tr");

    const isLowStock = row.Cantidad < row.Limite;
    if (isLowStock) {
      tr.style.backgroundColor = "#FDFD96 "; 
      hasLowStock = true;

      const alertItem = document.createElement("li");
      alertItem.innerHTML = `<strong>${row.TipoDispositivo} (${row.Modelo})</strong> – ${row.Cantidad} dispositivo${row.Cantidad !== 1 ? 's' : ''} restante${row.Cantidad !== 1 ? 's' : ''} (Límite: ${row.Limite})`;
      alertList.appendChild(alertItem);
    }

    tr.innerHTML = `
      <td>${row.TipoDispositivo}</td>
      <td>${row.Modelo}</td>
      <td>${row.Cantidad}</td>
      <td>${row.Limite}</td>
      <td><button class="edit-btn" onclick='openEdit("${row.Modelo}", ${row.Limite})'>Cambiar límite</button></td>
    `;

    tbody.appendChild(tr);
  });

  const alertBox = document.querySelector(".alert-box");
  if (hasLowStock) {
    alertBox.style.display = "block";
  } else {
    alertBox.style.display = "none";
  }
}


function openEdit(modelo, limite) {
  currentModel = modelo;
  document.getElementById("editTitle").textContent = `Modelo: ${modelo}`;
  document.getElementById("newLimit").value = limite;
  toggleModal(true);
}


document.getElementById("saveLimit").addEventListener("click", async () => {
  const nuevoLimite = parseInt(document.getElementById("newLimit").value);
  if (isNaN(nuevoLimite)) return alert("Ingrese un número válido.");

  try {
    const response = await fetch(`${HOST}:${PORT}/api/inventory/limit`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-ubicacion": currentUser.Ubicacion,
      },
      body: JSON.stringify({ currentModel, nuevoLimite }),
    });

    const result = await response.json();
    if (result.success) {
      toggleModal(false);
      
      const tipo = document.getElementById("deviceType")?.value || "";
      loadInventory(tipo);
    } else {
      alert("No se pudo guardar el nuevo límite.");
    }
  } catch (err) {
    alert("Error al guardar.");
    console.error(err);
  }
});


document.getElementById("cancelEdit").addEventListener("click", () => {
  toggleModal(false);
});


document.getElementById("deviceType").addEventListener("change", function () {
  loadInventory(this.value);
});


function exportarExcel() {
  const table = document.getElementById("inventoryTable");
  const clone = table.cloneNode(true);

  // Remover columna de acciones
  clone.querySelectorAll("thead tr th:last-child").forEach(th => th.remove());
  clone.querySelectorAll("tbody tr").forEach(row => row.lastElementChild.remove());

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(clone);
  XLSX.utils.book_append_sheet(wb, ws, "Inventario");

  XLSX.writeFile(wb, "inventario_dispositivos.xlsx");
}

// Inicializar
window.addEventListener("DOMContentLoaded", () => {
  loadInventory();
});
