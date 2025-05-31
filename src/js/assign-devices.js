const { session } = require("electron");

const HOST = process.env.HOST || "http://localhost";
const PORT = process.env.PORT || 3000;

async function assignDevice(employeeData) {
  const response = await fetch(`${HOST}:${PORT}/api/employees/assign-device`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ubicacion": sessionStorage.getItem("userLocation"),
    },
    body: JSON.stringify(employeeData),
  });
  const data = await response.json();
  if (data.sucess) {
    resultMsg.textContent = `✅ Dispositivo ${tipoDispositivo} asignado a ${Info_empleado}.`;
    e.target.reset();
    tableBody.innerHTML = "";
    tableContainer.style.display = "none";
  } else {
    resultMsg.textContent = "❌ Error al asignar dispositivo.";
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
          "x-ubicacion": sessionStorage.getItem("userLocation"),
        },
        body: JSON.stringify(type),
      }
    );
    const data = await response.json();
    return data;
  } catch (err) {
    alert("Error al obtener los dispositivos disponibles: ");
  }
}

document
  .getElementById("assign-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const Info_empleado = document.getElementById("employee-id").value.trim();
    const tipoDispositivo = document.getElementById("device-type").value;

    if (!selectedDeviceSerial) {
      alert("Selecciona un dispositivo de la tabla.");
      return;
    }

    const resultMsg = document.getElementById("result-message");

    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);

    const formatDate = (date) => date.toISOString().split("T")[0];

    const fechaAsignacion = formatDate(today);
    const fechaCambio = formatDate(nextYear);

    assignDevice({
      Info_empleado,
      ID_Dispositivo,
      Fecha_Asignacion,
      Fecha_Cambio,
    });
    /* const assignmentResult = await ipcRenderer.invoke("assign-device", {
        Info_empleado,
        ID_Dispositivo: selectedDeviceSerial,
        Fecha_Asignacion: fechaAsignacion,
        Fecha_Cambio: fechaCambio,
      });

      if (assignmentResult?.error) {
        resultMsg.textContent = "❌ Error al asignar dispositivo.";
      } else {
        resultMsg.textContent = `✅ Dispositivo ${tipoDispositivo} asignado a ${Info_empleado}.`;
        e.target.reset();
        tableBody.innerHTML = "";
        tableContainer.style.display = "none";
      }*/

    deviceSelect.addEventListener("change", async () => {
      const type = deviceSelect.value;
      tableBody.innerHTML = "";
      selectedDeviceSerial = null;

      if (!type) {
        tableContainer.style.display = "none";
        return;
      }

      const devices = getAvailableDevices(type);
      
      if (devices.error || devices.length === 0) {
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
      <td style="padding: 0.5rem;">${device.Numero_Serie}</td>
    `;

        row.addEventListener("click", () => {
          document.querySelectorAll("#device-table tbody tr").forEach((r) => {
            r.style.backgroundColor = "";
          });
          row.style.backgroundColor = "#cce5ff";
          selectedDeviceSerial = device.Numero_Serie;
        });

        tableBody.appendChild(row);
      });
    });
  });
