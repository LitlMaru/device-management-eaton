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

let tableBody = document.getElementById("table-body");
let tableContainer = document.getElementById("device-table-container");
const resultMsg = document.getElementById("result-message");

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
  tableBody.innerHTML = "";
  selectedDeviceID = null;

  if (!type) {
    tableContainer.style.display = "none";
    return;
  }

  const result = await getAvailableDevices(type);

  if (!result || !result.success || !Array.isArray(result.devices)) {
    tableContainer.style.display = "none";
    return;
  }
    const devices = result.devices;

  if (!devices || devices.length === 0) {
    tableContainer.style.display = "none";
    return;
  }

  tableContainer.style.display = "block";

  devices.forEach((device) => {
    const row = document.createElement("tr");
    row.style.cursor = "pointer";
    row.innerHTML = `
      <td style="padding: 0.5rem;">${device.Marca}</td>
      <td style="padding: 0.5rem;">${device.Modelo}</td>
      <td style="padding: 0.5rem;">${device.Serial_Number}</td>
    `;
    row.addEventListener("click", () => {
      document.querySelectorAll("#device-table tbody tr").forEach((r) => {
        r.style.backgroundColor = "";
      });
      row.style.backgroundColor = "#cce5ff";
      selectedDeviceID = device.ID_Dispositivo;
    });

    tableBody.appendChild(row);
  });
});

document
  .getElementById("assign-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

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
    }, e.target);
  });
