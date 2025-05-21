

function mostrarContenido(seccion) {
    alert(seccion);
    document.getElementById('contenido').innerHTML = `
    <h1>${seccion}</h1>
    <p style="text-align:center; font-size:18px;">Contenido de la sección <strong>${seccion}</strong> pronto estará disponible.</p>
    `;
}

function showContent(section) {
const content = document.getElementById('contenido');
fetch(`${section.toLowerCase()}.html`)
.then(res => {
    if (!res.ok) throw new Error("No se puedo cargar la seccion");
    return res.text();
})
.then(html => {
    content.innerHTML = html;

    switch(section){
        case "assign":
            initAssign();
            break;
        case "buscar":
            initBuscar();
            break;
        case "quantities":
            initInventario();
            break;
        case "devices":
            initDevices();
            break;
        case "configurar":
            initConfigurar();
            break;
    }
})
.catch(err => {
    content.innerHTML = `<div class="welcome-card"><h1>Error</h1><p>${err.message}</p></div>`;
})
}
function minimizarVentana() {
    window.electronAPI.minimize();
}

fullScreenImage = document.getElementById("img-full-screen");
function maximizarVentana() {
    window.electronAPI.maximize();
    if(fullScreenImage.src == "../assets/fullscreenmode.svg") fullScreenImage.src = "../assets/windowmode.svg"
    else fullScreenImage.src = "../assets/fullscreenmode.svg"
}

function cerrarVentana() {
    window.electronAPI.close();
}

function closeSession(){
    window.location.href = "login.html"
}


function initAssign(){

document.getElementById('assign-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const employeeInfo = document.getElementById('employee-id').value.trim();
  const deviceType = document.getElementById('device-type').value;

  // Aquí podrías validar si el dispositivo ya está asignado o si el empleado existe
  // Y luego guardar en la base de datos o backend

  // Simulación de resultado
  const resultMsg = document.getElementById('result-message');
  resultMsg.textContent = `✅ Dispositivo ${deviceType} asignado a ${employeeInfo}.`;

  // Limpiar el formulario
  e.target.reset();
});

  const deviceSelect = document.getElementById("device-type");
  const tableContainer = document.getElementById("device-table-container");
  const tableBody = document.querySelector("#device-table tbody");

  const mockDevices = {
   "Laptop": [
  { serial: "LAP-001", model: "XPS 13", brand: "Dell" },
  { serial: "LAP-002", model: "Elitebook 840", brand: "HP" },
  { serial: "LAP-003", model: "MacBook Pro 16", brand: "Apple" },
  { serial: "LAP-004", model: "ThinkPad X1 Carbon", brand: "Lenovo" },
  { serial: "LAP-005", model: "Spectre x360", brand: "HP" },
  { serial: "LAP-006", model: "Latitude 7420", brand: "Dell" },
  { serial: "LAP-007", model: "ZenBook 14", brand: "ASUS" },
  { serial: "LAP-008", model: "ROG Strix G15", brand: "ASUS" },
  { serial: "LAP-009", model: "MacBook Air M2", brand: "Apple" },
  { serial: "LAP-010", model: "ThinkPad T14", brand: "Lenovo" },
  { serial: "LAP-011", model: "Pavilion 15", brand: "HP" },
  { serial: "LAP-012", model: "Inspiron 15", brand: "Dell" },
  { serial: "LAP-013", model: "VivoBook S14", brand: "ASUS" },
  { serial: "LAP-014", model: "Surface Laptop 4", brand: "Microsoft" },
  { serial: "LAP-015", model: "IdeaPad 5", brand: "Lenovo" },
  { serial: "LAP-016", model: "MacBook Pro 14", brand: "Apple" },
  { serial: "LAP-017", model: "Nitro 5", brand: "Acer" },
  { serial: "LAP-018", model: "Swift 3", brand: "Acer" },
  { serial: "LAP-019", model: "ZenBook Duo", brand: "ASUS" },
  { serial: "LAP-020", model: "Latitude 9520", brand: "Dell" },
  { serial: "LAP-021", model: "ThinkBook 14s", brand: "Lenovo" },
  { serial: "LAP-022", model: "ProBook 450", brand: "HP" },
  { serial: "LAP-023", model: "ROG Zephyrus G14", brand: "ASUS" },
  { serial: "LAP-024", model: "MacBook Air 13", brand: "Apple" },
  { serial: "LAP-025", model: "IdeaPad Flex 5", brand: "Lenovo" },
  { serial: "LAP-026", model: "Aspire 5", brand: "Acer" },
  { serial: "LAP-027", model: "Surface Pro 8", brand: "Microsoft" },
  { serial: "LAP-028", model: "ThinkPad X13", brand: "Lenovo" },
  { serial: "LAP-029", model: "Pavilion Gaming 15", brand: "HP" },
  { serial: "LAP-030", model: "XPS 15", brand: "Dell" }
],
    "Monitor": [
      { serial: "MON-001", model: "24", brand: "LG" },
      { serial: "MON-002", model: "27", brand: "LG" }
    ],
    "Mouse": [
      { serial: "MOU-001", model: "M185", brand: "Logitech" }
    ],
    "Teclado": [],
    "Auriculares": [
      { serial: "AUD-001", model: "WH1000", brand: "Sony" }
    ]
  };

  deviceSelect.addEventListener("change", () => {
    const type = deviceSelect.value;
    tableBody.innerHTML = "";

    if (type && mockDevices[type] && mockDevices[type].length > 0) {
      tableContainer.style.display = "block";

      mockDevices[type].forEach(device => {
        const row = document.createElement("tr");
        row.style.cursor = "pointer";
        row.innerHTML = `
          <td style="padding: 0.5rem;">${device.brand}</td>
          <td style="padding: 0.5rem;">${device.model}</td>
          <td style="padding: 0.5rem;">${device.serial}</td>
        `;

        row.addEventListener("click", () => {
          // Highlight selected
          document.querySelectorAll("#device-table tbody tr").forEach(r => {
            r.style.backgroundColor = "";
          });
          row.style.backgroundColor = "#cce5ff";

        });

        tableBody.appendChild(row);
      });
    } else {
      tableContainer.style.display = "none";
    }
  });

}

  function initBuscar(){
 const input = document.getElementById('busqueda');
  
  input.addEventListener('input', function () {
    const filtro = this.value.trim();

    ipcRenderer.invoke('query-employee-devices', { employeeInfo: filtro })
      .then(resultado => {
        actualizarTabla(resultado);
      })
      .catch(error => {
        console.error('Error en consulta:', error);
      });
  });

    function exportarExcel() {
      alert("Función de exportar a Excel en desarrollo.");
    }
    }

    function actualizarTablaBusqueda(datos){
 const tbody = document.querySelector('#tablaAsignados tbody');
  tbody.innerHTML = '';

  datos.forEach(fila => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${fila.ID_Asignacion || ''}</td>
      <td>${fila.ID_Empleado || ''}</td>
      <td>${fila.ID_Dispositivo || ''}</td>
      <td>${fila.Fecha_asignacion || ''}</td>
      <td>${fila.Fecha_cambio || ''}</td>
    `;
    tbody.appendChild(tr);
  });
    }
function initInventario(){
 window.addEventListener('DOMContentLoaded', async () => {
  const data = await ipcRenderer.invoke('get-grouped-inventory');
  renderTable(data);
});

function renderTable(data) {
  const tbody = document.querySelector("#inventoryTable tbody");
  tbody.innerHTML = "";

  data.forEach(row => {
    const tr = document.createElement("tr");

    if (row.Quantity < row.Threshold) {
      tr.classList.add("low-stock");
    }

    tr.innerHTML = `
      <td>${row.DeviceType}</td>
      <td>${row.Brand}</td>
      <td>${row.Model}</td>
      <td>${row.Quantity}</td>
      <td>${row.Threshold}</td>
      <td>${row.Quantity < row.Threshold ? '<strong>Debajo de la cantidad mínima</strong>' : 'Cantidad apropiada'}</td>
      <td>
        <div class="action-buttons">
          <button class="edit-btn">Editar cantidad mínima</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}
    function exportarExcel() {
      let table = document.getElementById("inventoryTable").outerHTML;
      const data = 'data:application/vnd.ms-excel,' + encodeURIComponent(table);
      const a = document.createElement('a');
      a.href = data;
      a.download = 'inventario_dispositivos.xls';
      a.click();
    }
  }
   

function initDevices() {
     const devices = [
      { serialNumber: 'SN1234', computerName: 'PC001', deviceType: 'Laptop', brand: 'Dell', model: 'XPS 13' },
      { serialNumber: 'SN5678', computerName: 'PC002', deviceType: 'Desktop', brand: 'HP', model: 'Pavilion 15' },
      { serialNumber: 'SN91011', computerName: 'PC003', deviceType: 'Laptop', brand: 'Apple', model: 'MacBook Pro' },
      { serialNumber: 'SN121314', computerName: 'PC004', deviceType: 'Tablet', brand: 'Samsung', model: 'Galaxy Tab' }
    ];

    function applyFilters() {
      const serialNumberSearch = document.getElementById('serialNumberSearch').value.toLowerCase();
      const computerNameSearch = document.getElementById('computerNameSearch').value.toLowerCase();
      const deviceTypeSelect = document.getElementById('deviceTypeSelect').value;
      const brandSelect = document.getElementById('brandSelect').value;
      const modelSelect = document.getElementById('modelSelect').value;

      const filteredDevices = devices.filter(device => {
        return (
          (serialNumberSearch === '' || device.serialNumber.toLowerCase().includes(serialNumberSearch)) &&
          (computerNameSearch === '' || device.computerName.toLowerCase().includes(computerNameSearch)) &&
          (deviceTypeSelect === '' || device.deviceType === deviceTypeSelect) &&
          (brandSelect === '' || device.brand === brandSelect) &&
          (modelSelect === '' || device.model === modelSelect)
        );
      });

      displayDevices(filteredDevices);
    }

    function displayDevices(devicesList) {
      const tableBody = document.getElementById('devicesTableBody');
      tableBody.innerHTML = '';

      devicesList.forEach(device => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
          <td>${device.serialNumber}</td>
          <td>${device.computerName}</td>
          <td>${device.deviceType}</td>
          <td>${device.brand}</td>
          <td>${device.model}</td>
          <td><button onclick="viewDetails('${device.deviceType}', '${device.brand}', '${device.model}')">View Details</button></td>
        `;
        
        if (device.deviceType === 'Laptop' && device.serialNumber === 'SN1234') {
          row.classList.add('row-alert');
        }

        tableBody.appendChild(row);
      });
    }

    function viewDetails(deviceType, brand, model) {
      const url = `ungrouped.html?type=${encodeURIComponent(deviceType)}&brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`;
      window.location.href = url;
    }

    window.onload = () => {
      displayDevices(devices);
    };
}

function initConfigurar(){
    let filaEditando = null;

    function aplicarFiltros() {
      const filtro = document.getElementById("busqueda").value.toLowerCase();
      const columna = parseInt(document.getElementById("comboFiltro").value);
      const filas = document.querySelectorAll("#tablaConfiguracion tbody tr");
      const hoy = new Date().toISOString().split('T')[0];

      filas.forEach(fila => {
        const texto = fila.children[columna].innerText.toLowerCase();
        fila.style.display = texto.includes(filtro) ? "" : "none";

        const fecha = fila.children[3].innerText;
        if (fecha < hoy) {
          fila.classList.add("vencido");
        } else {
          fila.classList.remove("vencido");
        }
      });
    }

    function exportarExcel() {
      alert("Función de exportar a Excel en desarrollo.");
    }

    function abrirModal() {
      document.getElementById("modalAgregar").style.display = "block";
    }

    function cerrarModal() {
      document.getElementById("modalAgregar").style.display = "none";
      filaEditando = null;
      document.getElementById("modalEmpleado").value = "";
      document.getElementById("modalDispositivo").value = "";
      document.getElementById("modalEstado").value = "Activo";
      document.getElementById("modalFecha").value = "";
    }

    function guardarModal() {
      const emp = document.getElementById("modalEmpleado").value;
      const disp = document.getElementById("modalDispositivo").value;
      const est = document.getElementById("modalEstado").value;
      const fecha = document.getElementById("modalFecha").value;

      if (filaEditando) {
        filaEditando.children[0].innerText = emp;
        filaEditando.children[1].innerText = disp;
        filaEditando.children[2].innerText = est;
        filaEditando.children[3].innerText = fecha;
      } else {
        const tabla = document.getElementById("cuerpoTabla");
        const fila = document.createElement("tr");
        fila.innerHTML = `<td>${emp}</td><td>${disp}</td><td>${est}</td><td>${fecha}</td><td><button onclick="eliminarFila(this)">Eliminar</button> <button onclick="modificarFila(this)">Modificar</button></td>`;
        tabla.appendChild(fila);
      }

      cerrarModal();
      aplicarFiltros();
    }

    function eliminarFila(btn) {
      if (confirm("¿Estás seguro de eliminar esta fila?")) {
        btn.parentElement.parentElement.remove();
      }
    }

    function modificarFila(btn) {
      filaEditando = btn.parentElement.parentElement;
      document.getElementById("modalEmpleado").value = filaEditando.children[0].innerText;
      document.getElementById("modalDispositivo").value = filaEditando.children[1].innerText;
      document.getElementById("modalEstado").value = filaEditando.children[2].innerText;
      document.getElementById("modalFecha").value = filaEditando.children[3].innerText;
      abrirModal();
    }

    aplicarFiltros();
}