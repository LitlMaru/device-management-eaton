document.getElementById('assign-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const employeeId = document.getElementById('employee-id').value.trim();
  const employeeName = document.getElementById('employee-name').value.trim();
  const deviceType = document.getElementById('device-type').value;
  const serialNumber = document.getElementById('serial-number').value.trim();

  // Aquí podrías validar si el dispositivo ya está asignado o si el empleado existe
  // Y luego guardar en la base de datos o backend

  // Simulación de resultado
  const resultMsg = document.getElementById('result-message');
  resultMsg.textContent = `✅ Dispositivo ${deviceType} (${serialNumber}) asignado a ${employeeName} (ID: ${employeeId}).`;

  // Limpiar el formulario
  e.target.reset();
});
