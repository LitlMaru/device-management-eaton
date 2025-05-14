
const toggleBtn = document.getElementById('toggle-filters');
const filtersContainer = document.getElementById('filters-container');

toggleBtn.addEventListener('click', () => {
  filtersContainer.classList.toggle('hidden');
  toggleBtn.textContent = filtersContainer.classList.contains('hidden')
    ? '🔽 Mostrar filtros'
    : '🔼 Ocultar filtros';
});


document.getElementById('query-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const employeeId = document.getElementById('employee-id').value.trim().toLowerCase();
  const employeeName = document.getElementById('employee-name').value.trim().toLowerCase();

  const serialNumber = document.getElementById('serial-number').value.trim().toLowerCase();
  const deviceType = document.getElementById('device-type').value;
  const brand = document.getElementById('brand').value;
  const model = document.getElementById('model').value.trim().toLowerCase();

  const dummyData = [
    {
      employeeId: "1234",
      employeeName: "Juan Pérez",
      deviceType: "Laptop",
      serial: "SN123",
      brand: "Dell",
      model: "Latitude 5500"
    },
    {
      employeeId: "5678",
      employeeName: "Ana Gómez",
      deviceType: "Monitor",
      serial: "SN456",
      brand: "HP",
      model: "EliteDisplay"
    }
  ];

  const filtered = dummyData.filter(entry => {
    return (
      (!employeeId || entry.employeeId.toLowerCase().includes(employeeId)) &&
      (!employeeName || entry.employeeName.toLowerCase().includes(employeeName)) &&
      (!serialNumber || entry.serial.toLowerCase().includes(serialNumber)) &&
      (!deviceType || entry.deviceType === deviceType) &&
      (!brand || entry.brand === brand) &&
      (!model || entry.model.toLowerCase().includes(model))
    );
  });

  const resultDiv = document.getElementById('results');
  resultDiv.innerHTML = '';

  if (filtered.length === 0) {
    resultDiv.textContent = '❌ No se encontraron resultados.';
  } else {
    const table = document.createElement('table');
    const header = `
      <thead>
        <tr>
          <th>ID Empleado</th>
          <th>Nombre</th>
          <th>Dispositivo</th>
          <th>Marca</th>
          <th>Modelo</th>
          <th>Serie</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map(item => `
          <tr>
            <td>${item.employeeId}</td>
            <td>${item.employeeName}</td>
            <td>${item.deviceType}</td>
            <td>${item.brand}</td>
            <td>${item.model}</td>
            <td>${item.serial}</td>
          </tr>
        `).join('')}
      </tbody>
    `;
    table.innerHTML = header;
    resultDiv.appendChild(table);
  }
});
rial-number').value.trim();

ipcRenderer.send("query-employee-devices", () => {employee_id, employee_name, serial_number})


const {ipcRenderer} = require('electron')

document.getElementById("query-form").addEventListener("submit", function (e) {e.preventDefault()})

const employee_id = document.getElementById('employee-id').value.trim();
const employee_name = document.getElementById('employee-name').value.trim();
const serial_number = document.getElementById('serial-number').value.trim();

