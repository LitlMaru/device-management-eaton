
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
}

init();

let availableTableBody = document.querySelector("#availableDevicesTable tbody");
let availableTableContainer = document.getElementById("availableDevicesContainer");
let assignTableBody = document.querySelector(".assign-devices-table tbody");
let assignTableContainer = document.getElementById("assignDevicesContainer");
const resultMsg = document.getElementById("result-message");
let empleadoOrigen = document.getElementById("empleadoOrigen");

function showTab(tabId) {
  document.querySelectorAll(".tab").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(tc => tc.style.display = "none");

  document.querySelector(`#${tabId}`).style.display = "block";
  document.querySelector(`[onclick="showTab('${tabId}')"]`).classList.add("active");
  
  empleadoOrigen.value = "";
  document.querySelector(".scrollable").style.display = "none"
}

async function assignDevice(employeeData, formElement) {
  try {
    const response = await fetch(`${HOST}:${PORT}/api/employees/assign-device`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ubicacion": currentUser.Ubicacion,
      },
      body: JSON.stringify(employeeData),
    });

    const data = await response.json();
      resultMsg.textContent = `Dispositivo ${employeeData.tipoDispositivo} asignado a ${employeeData.Info_empleado}.`;
      formElement.reset();  
      tableBody.innerHTML = "";
      tableContainer.style.display = "none";
      selectedDeviceID = null; 

  } catch (error) {
    resultMsg.textContent = "Error de red o del servidor: " + error.message;
  }
}

async function getAvailableDevices(type) {
  try {
    const response = await fetch(
      `${HOST}:${PORT}/api/devices/get-available-devices`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ubicacion": currentUser.Ubicacion,
        },
        body: JSON.stringify({ deviceType: type }),
      }
    );
    const data = await response.json();
    return data;
  } catch (err) {
    alert("Error al obtener los dispositivos disponibles: ", err.message);
  }
}


let deviceSelect = document.getElementById("device-type");
deviceSelect.addEventListener("change", async () => {
  const type = deviceSelect.value;
  availableTableBody.innerHTML = "";
  selectedDeviceID = null;

  if (!type) {
    availableTableContainer.style.display = "none";
    return;
  }

  const devices = await getAvailableDevices(type);
  if (!devices  || !Array.isArray(devices)) {
    availableTableContainer.style.display = "none";
    return;
  }

  if (!devices || devices.length === 0) {
    tableContainer.style.display = "none";
    return;
  }

  availableTableContainer.style.display = "block";
  assignTableContainer.style.display = "block";

  devices.forEach((device) => {
    const row = document.createElement("tr");
    row.style.cursor = "pointer";
    row.innerHTML = `
      <td>${device.Marca}</td>
      <td>${device.Modelo}</td>
      <td>${device.Serial_Number}</td>
      <td class="td-button"><button onclick='addToDestiny(${JSON.stringify(device)})'>+</button></td>
    `;
    /*row.addEventListener("click", () => {
      document.querySelectorAll("#device-table tbody tr").forEach((r) => {
        r.style.backgroundColor = "";
      });
      row.style.backgroundColor = "#cce5ff";
      selectedDeviceID = device.ID_Dispositivo;
    });*/


    availableTableBody.appendChild(row);
  });
});

function addToDestiny(device){

  let repeated;
  assignTableBody.querySelectorAll("tr").forEach((row) => {
    if(row.dataset.ID_Dispositivo == device.ID_Dispositivo) {repeated = true}
  })

  if(!repeated){
 const tr = document.createElement('tr');
  tr.innerHTML = `
   <td>${device.Marca}</td>
   <td>${device.Modelo}</td>
   <td>${device.Serial_Number}</td>
   <td class="td-button"><button class='remove-device-btn'>-</button></td>
  `
  tr.querySelector(".remove-device-btn").addEventListener('click', () => {
    tr.remove();
  })

  tr.dataset.ID_Dispositivo = device.ID_Dispositivo
  assignTableBody.appendChild(tr)

  }
 
}

function resetSelection() {
  assignTableBody.innerHTML = "";
}

async function assignDevices(){
    alert("Klk milocos")
    const Info_empleado = document.getElementById("Info_empleado").value.trim();
    const today = new Date();
    const Fecha_Asignacion = today.toISOString().split("T")[0];
  const ubicacion = currentUser.Ubicacion; 


  const dispositivos = Array.from(document.querySelectorAll(".assign-devices-table tbody tr"))
    .map(row => row.dataset.ID_Dispositivo)
    .filter(id => id); 

  if (!Info_empleado || dispositivos.length === 0) {
    alert("Por favor, completa todos los campos y selecciona al menos un dispositivo.");
    return;
  }

  try {
    const response = await fetch("/assign-devices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Ubicacion": ubicacion
      },
      body: JSON.stringify({ Info_empleado, dispositivos, Fecha_Asignacion })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      alert(`Dispositivos asignados exitosamente (${result.cantidad}).`);
      // Puedes limpiar el formulario o actualizar la UI aquí
    } else {
      alert("Error: " + (result.message || result.error));
    }
  } catch (err) {
    console.error("Error al enviar:", err);
    alert("Error inesperado al asignar dispositivos.");
  }
}

document
  .getElementById("assign-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

/*
    const Info_empleado = document.getElementById("employee-id").value.trim();
    const tipoDispositivo = document.getElementById("device-type").value;

    if (!selectedDeviceID) {
      alert("Selecciona un dispositivo de la tabla.");
      return;
    }

    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);

    const formatDate = (date) => date.toISOString().split("T")[0];

    const Fecha_Asignacion = formatDate(today);
    const Fecha_Cambio = formatDate(nextYear);

    await assignDevice({
      Info_empleado,
      tipoDispositivo, 
      ID_Dispositivo: selectedDeviceID,
      Fecha_Asignacion,
      Fecha_Cambio,
    }, e.target);*/
  });
  const tbody = document.querySelector(".reassign-table-preview tbody");
  console.log(tbody)    


  async function fetchEmployeeDevices() {
  console.log(empleadoOrigen)
  const IDEmpleado = empleadoOrigen ? empleadoOrigen.value.trim() : "";
  document.querySelector(".scrollable").style.display = "flex"

  try {
    const response = await fetch(`${HOST}:${PORT}/api/assignations/devices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Ubicacion": currentUser.Ubicacion,
      },
      body: JSON.stringify({ IDEmpleado }),
    });

    const result = await response.json();
    
    const tbody = document.querySelector(".reassign-table-preview tbody");
  tbody.innerHTML = "";

    if (response.ok && result.success) {
      result.data.forEach((row) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${row.TipoDispositivo}</td>
          <td>${row.Marca}</td>
          <td>${row.Modelo}</td>
          <td>${row.Serial_Number}</td>
        `;

        tbody.appendChild(tr);
      });
    } else {
      console.log("Que")
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">${
        result.message || "No se encontraron resultados"
      }</td></tr>`;
    }
  } catch (err) {
    console.error("Error al obtener dispositivos asignados:", err);
    alert("Hubo un error al obtener los dispositivos asignados: " + err.message);
  }
}

empleadoOrigen.addEventListener('change', () => {
  if(empleadoOrigen.value.trim == "") {empleadoOrigen.style.display = "none";}
  else{
    fetchEmployeeDevices();
  }
})