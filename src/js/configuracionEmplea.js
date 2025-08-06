let ascending = true;

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
  const data = await getEmployees();
  renderTable(data);
}

init();

function abrirModal(templateId) {
  const template = document.getElementById(templateId);
  const clone = template.content.cloneNode(true);
  const overlay = document.createElement("div");
  overlay.className = "modalOverlay active";
  overlay.onclick = (e) => {
    if (e.target === overlay) cerrarModal();
  };

  const content = document.createElement("div");
  content.className = "modal-content";
  content.appendChild(clone);
  overlay.appendChild(content);

  document.body.appendChild(overlay);
}

function cerrarModal() {
  const overlay = document.getElementById("modalOverlay");
  overlay.classList.remove("active");

  const modalContent = document.getElementById("modal-content");
  modalContent.innerHTML = "";
}

function openEditModal(id) {
  const employees = Array.from(
    document.querySelectorAll("#employee-body tr")
  ).map((row) => ({
    ID_Empleado: row.dataset.id,
    Nombre: row.children[1].textContent,
    Departamento: row.children[2].textContent,
    Posicion: row.children[3].textContent,
  }));

  const emp = employees.find((e) => e.ID_Empleado === id);

  if (!emp) {
    console.error("Empleado no encontrado");
    return;
  }

  const template = document.getElementById("modalEditar");
  const content = template.content.cloneNode(true);

  const modalContent = document.getElementById("modal-content");
  modalContent.innerHTML = "";
  modalContent.appendChild(content);
  document.getElementById("modalOverlay").classList.add("active");

  document.getElementById("editarNombre").value = emp.Nombre;
  document.getElementById("editarDepartamento").value = emp.Departamento;
  document.getElementById("editarPosición").value = emp.Posicion;
  document.getElementById("editarID").value = emp.ID_Empleado;
}

async function updateDevice() {
  const ID_Empleado = document.getElementById("editarID").value;
  const Nombre = document.getElementById("editarNombre").value;
  const Departamento = document.getElementById("editarDepartamento").value;
  const Posicion = document.getElementById("editarPosición").value;

  const payload = {
    ID_Empleado,
    Nombre,
    Departamento,
    Posicion,
  };

  try {
    const response = await fetch(`${HOST}:${PORT}/api/employees/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-ubicacion": currentUser.Ubicacion,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok) {
      await customAlert("Empleado actualizado correctamente.");
      cerrarModal();
      const data = await getEmployees();
      renderTable(data);
    } else {
      await customAlert(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error("Error al actualizar:", error);
    await customAlert("Error al actualizar.");
  }
}

/*
async function openEditModal(employeeID) {
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
*/
const employees = [
  {
    id: 1,
    nombre: "Juan Pérez",
    departamento: "TI",
    posicion: "Desarrollador",
    fecha: "2022-03-15",
    ubicacion: "Oficina 1",
  },
  {
    id: 2,
    nombre: "Ana Gómez",
    departamento: "Recursos Humanos",
    posicion: "Analista",
    fecha: "2021-08-10",
    ubicacion: "Oficina 2",
  },
  {
    id: 3,
    nombre: "Luis Herrera",
    departamento: "Ventas",
    posicion: "Ejecutivo",
    fecha: "2023-01-05",
    ubicacion: "Sucursal Norte",
  },
];

function formatDate(dateInput) {
  const date = new Date(dateInput);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function renderTable(data) {
  const tbody = document.getElementById("employee-body");
  tbody.innerHTML = "";
  data.forEach((emp) => {
    const row = `
        <tr data-id="${emp.ID_Empleado}">
          <td>${emp.ID_Empleado}</td>
          <td>${emp.Empleado}</td>
          <td>${emp.Departamento}</td>
          <td>${emp.Posicion}</td>
          <td>${formatDate(emp.Fecha_entrada)}</td>
          <td style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:.2rem;">
            <button class="edit-btn" onclick="openEditModal('${
              emp.ID_Empleado
            }')">Editar</button>
            <button class="delete-btn" onclick="deleteEmployee('${
              emp.ID_Empleado
            }')"> Eliminar</button>
          </td>
        </tr>
      `;
    tbody.insertAdjacentHTML("beforeend", row);
  });
}

async function getEmployees() {
  url = `${HOST}:${PORT}/api/employees/`;
  const filter = document.getElementById("buscarEmpleado").value;
  if (filter.trim() !== "") {
    url += `?filter=${filter}`;
  }

  try {
    const result = await fetch(url, {
      method: "GET",
      headers: {
        "x-ubicacion": currentUser.Ubicacion,
      },
    });

    const data = await result.json();
    return data;
  } catch (err) {
    console.error(err);
    await customAlert(err.message);
  }
}
async function deleteEmployee(id) {
  const confirmation = await customConfirm(
    `¿Desea eliminar al empleado ${id} de la base de datos?`
  );
  if (!confirmation) return;

  const url = `${HOST}:${PORT}/api/employees/${encodeURIComponent(id)}`;
  console.log(`Deleting employee at: ${url}`);

  try {
    const res = await fetch(url, { method: "DELETE" });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Server error ${res.status}: ${errorText}`);
    }

    const data = await getEmployees();
    renderTable(data);
    await customAlert("Empleado eliminado correctamente.");
  } catch (err) {
    console.error(err);
    await customAlert(`Error eliminando empleado: ${err.message}`);
  }
}

async function exportToExcel() {
  const employees = await getEmployees();
  let csv =
    "ID Empleado,Nombre,Departamento,Posición,Fecha Entrada\n";
  employees.forEach((emp) => {
    csv += `${emp.ID_Empleado},"${emp.Empleado}","${emp.Departamento}","${emp.Posicion}",${emp.Fecha_entrada}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "empleados.csv";
  a.click();
  window.URL.revokeObjectURL(url);
}

function toggleSort() {
  ascending = !ascending;
  employees.sort((a, b) =>
    ascending
      ? a.nombre.localeCompare(b.nombre)
      : b.nombre.localeCompare(a.nombre)
  );
  renderTable(employees);
}

document
  .getElementById("buscarEmpleado")
  .addEventListener("input", function () {
    const query = this.value.toLowerCase();
    const filtered = employees.filter(
      (emp) =>
        emp.nombre.toLowerCase().includes(query) ||
        emp.departamento.toLowerCase().includes(query) ||
        emp.posicion.toLowerCase().includes(query) ||
        emp.ubicacion.toLowerCase().includes(query)
    );
    renderTable(filtered);
  });

renderTable(employees);

  function exportarExcel(tablaID) {
  let tabla = document.getElementById(tablaID);
  let tablaHTML = tabla.outerHTML.replace(/ /g, '%20');


  let nombreArchivo = 'empleados.xls';
  let tipoArchivo = 'application/vnd.ms-excel';


  let enlaceDescarga = document.createElement('a');
  enlaceDescarga.href = 'data:' + tipoArchivo + ', ' + tablaHTML;
  enlaceDescarga.download = nombreArchivo;

 
  enlaceDescarga.click();
}

