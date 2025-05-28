 let currentModel = null;

  async function loadTypes() {
    alert("WORKING")
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
