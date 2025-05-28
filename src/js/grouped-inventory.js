 let currentModel = null;

  async function loadTypes() {
    
    const types = await ipcRenderer.invoke("get-device-types");
    const select = document.getElementById("deviceType");
    types.forEach((t) => {
      const option = document.createElement("option");
      option.value = t.Tipo;
      option.textContent = t.Tipo;
      select.appendChild(option);
    });
  }

  async function loadInventory(type = "") {
    const data = await ipcRenderer.invoke("get-grouped-inventory", type);
    renderTable(data);
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

    const success = await ipcRenderer.invoke(
      "update-limit",
      currentModel,
      nuevoLimite
    );
    if (success) {
      toggleModal(false);
      loadInventory(document.getElementById("deviceType").value);
    } else {
      alert("Error al guardar");
    }
  });

  document.getElementById("deviceType").addEventListener("change", function () {
    loadInventory(this.value);
  });

  loadTypes();
  loadInventory();

  function exportarExcel() {
  const table = document.getElementById("inventoryTable");
  const wb = XLSX.utils.book_new();


  const ws = XLSX.utils.table_to_sheet(table);


  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "4F81BD" } }, 
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
    alignment: { horizontal: "center" }
  };

  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell_address = { c: C, r: 0 }; // Fila 0 (encabezado)
    const cell_ref = XLSX.utils.encode_cell(cell_address);
    if (!ws[cell_ref]) continue;
    ws[cell_ref].s = headerStyle;
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
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Inventario");

  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Inventario_EATON_${fecha}.xlsx`);
}

