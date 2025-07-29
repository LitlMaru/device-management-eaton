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
  HOST = env.HOST;
  PORT = env.PORT;
  fetchAssignedDevices();
  fetchPendingDevices();
}

init();
/*
const asignaciones = [
      { idEmpleado: "001", empleado: "Ana López", ubicacion: "ICD", tipo: "Laptop", modelo: "Laptop Dell", fechaAsignacion: "2023-05-30", fechaCambio: "2024-05-30" },
      { idEmpleado: "002", empleado: "Carlos Ruiz", ubicacion: "MCB",tipo: "Tablet", modelo: "Tablet Samsung", fechaAsignacion: "2022-04-10", fechaCambio: "2023-04-10" },
      { idEmpleado: "003", empleado: "Luis Pérez", ubicacion: "MCCB",tipo: "Laptop", modelo: "Laptop HP", fechaAsignacion: "2024-06-01", fechaCambio: "2025-06-01" },
      { idEmpleado: "004", empleado: "Marta Gómez", ubicacion: "ICD", tipo: "Monitor", modelo: "Monitor LG", fechaAsignacion: "2023-11-15", fechaCambio: "2024-11-15"  },
      { idEmpleado: "005", empleado: "Juan Ramírez", ubicacion: "MCB", tipo: "Teclado", modelo: "Teclado Logitech", fechaAsignacion: "2023-01-20", fechaCambio: "2024-01-20" }
    ];

    const historial = [
      { dispositivo: "Laptop Dell", empleadoAnterior: "Ana López", empleadoNuevo: "José Martínez", fechaCambio: "2023-12-01" },
      { dispositivo: "Tablet Samsung", empleadoAnterior: "Carlos Ruiz", empleadoNuevo: "María Fernández", fechaCambio: "2024-01-15" }
    ];

    function cargarAsignaciones() {
      const tbody = document.querySelector("#tablaAsignados tbody");
      tbody.innerHTML = "";

      asignaciones.forEach((item, index) => {
        const tr = document.createElement("tr");

        const fechaAsignacion = new Date(item.fechaAsignacion);
        const unAñoDespues = new Date(fechaAsignacion);
        unAñoDespues.setFullYear(unAñoDespues.getFullYear() + 1);
        const fechaActual = new Date();

        let cambioTexto = "";
        let clase = "";

        if (fechaActual >= unAñoDespues) {
          cambioTexto = "Pendiente";
          clase = "rojo";
        } else {
          cambioTexto = unAñoDespues.toISOString().split("T")[0];
        }

        tr.innerHTML = `
          <td>${item.idEmpleado}</td>
          <td>${item.empleado}</td>
          <td>${item.tipo}</td>
          <td>${item.modelo}</td>
          <td>${item.fechaAsignacion}</td>
          <td style="display:flex;justify-content:center;">
            <button class="accion-btn" onclick=deas></button>
            <button class="accion-btn" onclick="abrirModal(${index})">Reasignar</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      cargarPendientes();
    }

    function cargarPendientes() {
      const tbody = document.querySelector("#tablaPendientes tbody");
      tbody.innerHTML = "";

      asignaciones.forEach(item => {
        const fechaAsignacion = new Date(item.fechaAsignacion);
        const unAñoDespues = new Date(fechaAsignacion);
        unAñoDespues.setFullYear(unAñoDespues.getFullYear() + 1);
        const fechaActual = new Date();

        if (fechaActual >= unAñoDespues) {
          tbody.innerHTML += `
            <tr>
              <td>${item.idEmpleado}</td>
              <td>${item.empleado}</td>
              <td>${item.tipo}</td>
              <td>${item.modelo}</td>
              <td class="rojo">${item.fechaCambio}</td>
            </tr>
          `;
        }
      });
    }

    function cargarHistorial() {
      const tbody = document.querySelector("#tablaHistorial tbody");
      tbody.innerHTML = "";
      historial.forEach(h => {
        tbody.innerHTML += `
          <tr>
            <td>${h.dispositivo}</td>
            <td>${h.empleadoAnterior}</td>
            <td>${h.empleadoNuevo}</td>
            <td>${h.fechaCambio}</td>
          </tr>
        `;
      });
    }
*/

let dispositivoReasignar = null;
let ordenActual = {};

function showTab(tabId) {
  document
    .querySelectorAll(".tab")
    .forEach((btn) => btn.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((tc) => tc.classList.remove("active"));

  document.getElementById(tabId).classList.add("active");
  document
    .querySelector(`.tab[onclick="showTab('${tabId}')"]`)
    .classList.add("active");
}

function exportarExcel(tablaID) {
  const table = document.getElementById(tablaID);
  const wb = XLSX.utils.table_to_book(table, { sheet: "Hoja1" });
  XLSX.writeFile(wb, tablaID + ".xlsx");
}

/*
function filtrarTabla() {
  const texto = document.getElementById("busqueda").value.toLowerCase();
  document.querySelectorAll("#tablaAsignados tbody tr").forEach((fila) => {
    const contenido = fila.textContent.toLowerCase();
    fila.style.display = contenido.includes(texto) ? "" : "none";
  });
}*/

function abrirModal(ID_Empleado, ID_Dispositivo) {
  document.getElementById("idNuevoEmpleado").value = "";
  const modalReasignar = document.getElementById("modalReasignar");
  modalReasignar.style.display = "flex";
  modalReasignar.dataset.ID_Empleado = ID_Empleado;
  modalReasignar.dataset.ID_Dispositivo = ID_Dispositivo;
}

function cerrarModal() {
  dispositivoReasignar = null;
  modalReasignar.style.display = "none";
}

document.getElementById("confirmReasignBtn").addEventListener("click", async () => {
  const modalReasignar = document.getElementById("modalReasignar");
  const empleadoOrigen = modalReasignar.dataset.ID_Empleado;
  const ID_Dispositivo = modalReasignar.dataset.ID_Dispositivo;
  const empleadoDestino = document
    .getElementById("idNuevoEmpleado")
    .value.trim();

  if (!empleadoDestino) {
    alert("Por favor ingresa el ID del empleado.");
    return;
  }
  confirmReassign = await customConfirm(`¿Reasignar el dispositivo a ${idNuevoEmpleado}?`);
  if (confirmReassign) {
    try {
      await fetch(`${HOST}:${PORT}/api/assignations/reassign`, {
        method: "POST",
        headers: {
          "x-ubicacion": currentUser.Ubicacion,
        },
        body: JSON.stringify({
          empleadoOrigen,
          empleadoDestino,
          ID_Dispositivo,
        }),
      });
      cerrarModal();
      return;
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }
});

function sortTable(colIndex, tablaID) {
  const table = document.getElementById(tablaID);
  const tbody = table.tBodies[0];
  const filas = Array.from(tbody.rows);

  if (!ordenActual[tablaID]) ordenActual[tablaID] = {};
  const direccionActual = ordenActual[tablaID][colIndex] || "desc";
  const nuevaDireccion = direccionActual === "asc" ? "desc" : "asc";
  ordenActual[tablaID][colIndex] = nuevaDireccion;

  table.querySelectorAll("th.sortable").forEach((th) => {
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
      return nuevaDireccion === "asc"
        ? aNumSimple - bNumSimple
        : bNumSimple - aNumSimple;
    }

    if (aTexto < bTexto) return nuevaDireccion === "asc" ? -1 : 1;
    if (aTexto > bTexto) return nuevaDireccion === "asc" ? 1 : -1;
    return 0;
  });

  tbody.innerHTML = "";
  filas.forEach((fila) => tbody.appendChild(fila));
}

window.onload = () => {
  // cargarAsignaciones();
  //cargarHistorial();
};

async function fetchAssignedDevices() {
  const input = document.getElementById("buscarEmpleado");
  console.log(input);
  const employeeInfo = input ? input.value.trim() : "";

  try {
    const response = await fetch(`${HOST}:${PORT}/api/assignations/filter-devices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Ubicacion": currentUser.Ubicacion,
      },
      body: JSON.stringify({ employeeInfo }),
    });

    const result = await response.json();

    const tbody = document.querySelector("#tablaAsignados tbody");
    tbody.innerHTML = "";

    if (response.ok && result.success) {
      result.data.forEach((row) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${row.ID_Empleado}</td>
          <td>${row.Nombre}</td>
          <td>${row.TipoDispositivo}</td>
          <td>${row.Marca}</td>
          <td>${row.Serial_Number || "—"}</td>
          <td>${row.Fecha_Asignacion || "N/A"}</td>
          <td style="display:flex; gap:8px;">
            <button class="unassign-btn" onclick="unassign('${
              row.Serial_Number
            }')">
              Desasignar
            </button>
            <button class="reassign-btn" onclick="abrirModal(${
              row.ID_Dispositivo
            })">Reasignar</button>
          </td>
        `;

        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">${
        result.message || "No se encontraron resultados"
      }</td></tr>`;
    }
  } catch (err) {
    console.error("Error al obtener dispositivos asignados:", err);
    await customAlert("Hubo un error al consultar los dispositivos asignados.");
  }
}

async function fetchAssignmentHistory(ID_Dispositivo) {
  try {
    const response = await fetch(
      `${HOST}:${PORT}/api/assignations/employees-assigned?ID_Dispositivo=${encodeURIComponent(
        ID_Dispositivo
      )}`
    );
    const data = await response.json();

    const tbody = document.querySelector("#tablaHistorial tbody");
    tbody.innerHTML = ""; // clear previous rows

    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No hay historial de asignaciones.</td></tr>`;
      return;
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return "—";
      const d = new Date(dateStr);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    };

    data.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.Serial_Number || "—"}</td>
        <td>${row.ID_Empleado || "—"}</td>
        <td>${row.Empleado || "—"}</td>
        <td>${row.Departamento || "—"}</td>
        <td>${formatDate(row.Fecha_asignacion)}</td>
        <td>${formatDate(row.Fecha_Fin)}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error al cargar historial de asignaciones:", err);
    await customAlert("Error al obtener historial.");
  }
}

async function fetchPendingDevices() {
  try {
    const response = await fetch(
      `${HOST}:${PORT}/api/assignations/pending-devices`,
      {
        method: "GET",
        headers: {
          "X-Ubicacion": "MiSucursal", // <- Replace with dynamic value if needed
        },
      }
    );

    const result = await response.json();

    const tbody = document.querySelector("#tablaPendientes tbody");
    tbody.innerHTML = ""; // Clear previous rows

    if (response.ok && result.success && result.data.length > 0) {
      result.data.forEach((row) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${row.ID_Empleado}</td>
          <td>${row.Empleado}</td>
          <td>${row.TipoDispositivo}</td>
          <td>${row.Marca} ${row.Modelo || ""}</td>
          <td class="rojo">${row.Fecha_Cambio}</td>
        `;

        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay dispositivos pendientes.</td></tr>`;
    }
  } catch (err) {
    console.error("Error al obtener dispositivos pendientes:", err);
    await customAlert("Ocurrió un error al cargar los dispositivos por cambiar.");
  }
}
/*
document.getElementById("buscarEmpleado").addEventListener('change', fetchAssignedDevices);
document.getElementById("buscarDispositivo").addEventListener('change', fetchAssignmentHistory);*/
