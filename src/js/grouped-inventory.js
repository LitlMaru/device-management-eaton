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

    document.getElementById("saveLimit").addEventListener("click", () => {
      const newLimit = parseInt(document.getElementById("newLimit").value);
      if (!isNaN(newLimit) && currentRow) {
        currentRow.cells[3].textContent = newLimit;
        checkAlerts();
        closePanel();
      } else {
        alert("Ingrese un número válido para el límite.");
      }
    });

    function checkAlerts() {
      const alertList = document.getElementById("alert-list");
      alertList.innerHTML = "";
      const rows = document.querySelectorAll("#inventoryTable tbody tr");
      let showAlert = false;

      rows.forEach(row => {
        const type = row.cells[0].textContent;
        const model = row.cells[1].textContent;
        const cantidad = parseInt(row.cells[2].textContent);
        const limite = parseInt(row.cells[3].textContent);

        if (cantidad <= limite) {
          const li = document.createElement("li");
          li.innerHTML = `<strong>${type} (${model})</strong> – ${cantidad} dispositivos restantes (Límite: ${limite})`;
          alertList.appendChild(li);
          showAlert = true;
        }
      });

      document.querySelector(".alert-box").style.display = showAlert ? "block" : "none";
    }

    function exportarExcel() {
      const table = document.getElementById("inventoryTable");
      const wb = XLSX.utils.table_to_book(table, { sheet: "Inventario" });
      XLSX.writeFile(wb, "Inventario_Dispositivos.xlsx");
    }

    function filtrarTabla() {
      const filtro = document.getElementById("deviceType").value.toLowerCase();
      const filas = document.querySelectorAll("#inventoryTable tbody tr");

      filas.forEach(fila => {
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