let currentModel = null;

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
  let env = await ElectronAPI.getEnv(); 

  console.log("Environment Variables:", env); // Debugging log

  HOST = env?.HOST || "http://localhost"; // Fallback to localhost if undefined
  PORT = env?.PORT || "3000"; // Default port
}



async function loadTypes() {
  const response = await fetch(`${HOST}:${PORT}/api/inventory/types`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const types = await response.json();
  if (types.sucess) {
    const select = document.getElementById("deviceType");
    types.forEach((t) => {
      const option = document.createElement("option");
      option.value = t.Tipo;
      option.textContent = t.Tipo;
      select.appendChild(option);
    });
  }
  //const types = await ipcRenderer.invoke("get-device-types");
}

async function loadInventory(type = "") {
  if (!currentUser || !currentUser.Ubicacion) {
    console.error("Error: currentUser or Ubicacion is undefined.");
    return;
  }

  let url = `${HOST}:${PORT}/api/inventory/grouped-inventory`;

  if (type !== "") {
    url += `?deviceType=${encodeURIComponent(type)}`;
  }

  console.log("API URL:", url); // Debugging log

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-ubicacion": currentUser.Ubicacion,
      },
    });

    const data = await response.json();
    renderTable(data);
  } catch (err) {
    console.error("Error loading inventory:", err);
    alert("Error al cargar inventario agrupado.");
  }
}

function renderTable(data) {
  const tbody = document.querySelector("#inventoryTable tbody");
  tbody.innerHTML = "";

  data.forEach((row) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
          <td>${row.TipoDispositivo}</td>
          <td>${row.Modelo}</td>
          <td>${row.Marca}</td>
          <td>${row.Cantidad}</td>
          <td>${row.Limite}</td>
          <td><button class='edit-btn' onclick='openEdit("${row.Modelo}", ${row.Limite})'>Editar</button></td>
        `;

    tbody.appendChild(tr);
  });
}

function openEdit(modelo, limite) {
  currentModel = modelo;
  document.getElementById("editTitle").textContent = `Modelo: ${modelo}`;
  document.getElementById("newLimit").value = limite;
  toggleModal(true);
}

function toggleModal(show) {
  document.getElementById("editModal").classList.toggle("hidden", !show);
}

document.getElementById("saveLimit").addEventListener("click", async () => {
  const nuevoLimite = parseInt(document.getElementById("newLimit").value);
  if (isNaN(nuevoLimite)) return alert("Ingrese un número válido");

  try{
    const response = fetch(`${HOST}:${PORT}/api/inventory/limit`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-ubicacion": currentUser.Ubicacion
      },
      body: JSON.stringify({currentModel, nuevoLimite})
    })

    const data = response.json();
    toggleModal(false);
    loadInventory(document.getElementById("deviceType").value);
  }
  catch(err){
    alert("Error al guardar: ", err)
  }
});

document.getElementById("deviceType").addEventListener("change", function () {
  loadInventory(this.value);
});


function exportarExcel() {
  const originalTable = document.getElementById("inventoryTable");

  const clonedTable = originalTable.cloneNode(true);

  const theadRow = clonedTable.querySelector("thead tr");
  if (theadRow) theadRow.removeChild(theadRow.lastElementChild);

  const rows = clonedTable.querySelectorAll("tbody tr");
  rows.forEach(row => row.removeChild(row.lastElementChild));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(clonedTable);

  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "4F81BD" } },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
    alignment: { horizontal: "center" },
  };

  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell_address = { c: C, r: 0 }; 
    const cell_ref = XLSX.utils.encode_cell(cell_address);
    if (ws[cell_ref]) ws[cell_ref].s = headerStyle;
  }

  const colWidths = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxWidth = 10;
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
      if (cell && cell.v) {
        const len = cell.v.toString().length;
        if (len > maxWidth) maxWidth = len;
      }
    }
    colWidths.push({ wch: maxWidth + 2 });
  }
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Inventario");

  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Inventario_EATON_${fecha}.xlsx`, { cellStyles: true });
}

(async function main() {
  await init(); // Ensure initialization is done
  await loadTypes(); // Then proceed to fetch data
  await loadInventory(); // Ensure currentUser is ready before executing
})();

