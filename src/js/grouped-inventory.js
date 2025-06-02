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
  const url = `${HOST}:${PORT}/api/inventory/grouped-inventory${type ? `?deviceType=${encodeURIComponent(type)}` : ""}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "x-ubicacion": currentUser.Ubicacion,
      }
    });

    const data = await response.json();
    renderTable(data);
  } catch (err) {
    alert("Error al cargar el inventario agrupado.");
    console.error(err);
  }
}

// Renderizar tabla
function renderTable(data) {
  const tbody = document.querySelector("#inventoryTable tbody");
  tbody.innerHTML = "";

  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.TipoDispositivo}</td>
      <td>${row.Modelo}</td>
      <td>${row.Marca}</td>
      <td>${row.Cantidad}</td>
      <td>${row.Limite}</td>
      <td><button class="edit-btn" onclick='openEdit("${row.Modelo}", ${row.Limite})'>Cambiar límite</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// Abrir modal
function openEdit(modelo, limite) {
  currentModel = modelo;
  document.getElementById("editTitle").textContent = `Modelo: ${modelo}`;
  document.getElementById("newLimit").value = limite;
  toggleModal(true);
}

// Guardar nuevo límite
document.getElementById("saveLimit").addEventListener("click", async () => {
  const nuevoLimite = parseInt(document.getElementById("newLimit").value);
  if (isNaN(nuevoLimite)) return alert("Ingrese un número válido.");

  try {
    const response = await fetch(`${HOST}:${PORT}/api/inventory/limit`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-ubicacion": currentUser.Ubicacion
      },
      body: JSON.stringify({ currentModel, nuevoLimite })
    });

    const result = await response.json();
    if (result.success) {
      toggleModal(false);
      loadInventory(document.getElementById("deviceType").value);
    } else {
      alert("No se pudo guardar el nuevo límite.");
    }
  } catch (err) {
    alert("Error al guardar.");
    console.error(err);
  }
});

// Filtrar por tipo
document.getElementById("deviceType").addEventListener("change", function () {
  loadInventory(this.value);
});

// Exportar a Excel
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
