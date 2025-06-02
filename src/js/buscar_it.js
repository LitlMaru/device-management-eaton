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
}

init();

function filtrarTabla() {
  const filtro = document.getElementById("busqueda").value.toLowerCase();
  const filas = document.querySelectorAll("#tablaAsignados tbody tr");
  filas.forEach((fila) => {
    const textoFila = fila.innerText.toLowerCase();
    fila.style.display = textoFila.includes(filtro) ? "" : "none";
  });
}

input.addEventListener("input", async function () {
  const filtro = this.value.trim();
console.log("🔍 Fetching from:", `${HOST}:${PORT}/api/employees/devices`);
console.log("🔍 currentUser.Ubicacion:", currentUser.Ubicacion);
  try {
    const response = await fetch(`${HOST}:${PORT}/api/employees/devices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ubicacion": currentUser.Ubicacion,
      },
      body: JSON.stringify({ employeeInfo: filtro }),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error("Consulta fallida");
    }
    actualizarTablaBusqueda(data.data);
  } catch (error) {
    alert("Error al consultar dispositivos del empleado: "+ error.message);
    console.log(error.message);
  }
});

function actualizarTablaBusqueda(data) {
  const tbody = document.querySelector("#tablaAsignados tbody");
  tbody.innerHTML = ""; // Clear existing rows

  data.forEach((item) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.ID_Empleado}</td>
      <td>${item.Nombre}</td>
      <td>${item.TipoDispositivo}</td>
      <td>${item.Fecha_asignacion || ""}</td>
      <td>${item.Fecha_cambio || ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

function exportarExcel() {
  const tabla = document.getElementById("tablaAsignados");
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(tabla, {
    raw: true,
    cellStyles: true,
  });

  XLSX.utils.book_append_sheet(wb, ws, "Dispositivos Asignados");

  XLSX.writeFile(wb, "Dispositivos_Asignados.xlsx");
}

actualizarTablaBusqueda;
