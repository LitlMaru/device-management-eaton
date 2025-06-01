function mostrarContenido(seccion) {
  alert(seccion);
  document.getElementById("contenido").innerHTML = `
    <h1>${seccion}</h1>
    <p style="text-align:center; font-size:18px;">Contenido de la sección <strong>${seccion}</strong> pronto estará disponible.</p>
    `;
}

function showContent(section) {
  const content = document.getElementById("contenido");
  fetch(`${section.toLowerCase()}.html`)
    .then((res) => {
      if (!res.ok) throw new Error("No se puedo cargar la seccion");
      return res.text();
    })
    .then((html) => {
      content.innerHTML = html;

      switch (section) {
        case "assign":
          initAssign();
          break;
        case "buscar":
     
          break;
        case "quantities":

          break;
        case "devices":

          break;
        case "configurarDisp":
          initConfigurarDisp();
          break;
      }
    })
    .catch((err) => {
      content.innerHTML = `<div class="welcome-card"><h1>Error</h1><p>${err.message}</p></div>`;
    });
}
function minimizarVentana() {
  window.electronAPI.minimize();
}

fullScreenImage = document.getElementById("img-full-screen");
function maximizarVentana() {
  window.electronAPI.maximize();
  if (fullScreenImage.src == "../assets/fullscreenmode.svg")
    fullScreenImage.src = "../assets/windowmode.svg";
  else fullScreenImage.src = "../assets/fullscreenmode.svg";
}

function cerrarVentana() {
  window.electronAPI.close();
}

function closeSession() {
  window.location.href = "login.html";
}


function initAssign() {
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

      const assignmentResult = await ipcRenderer.invoke("assign-device", {
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
      }

      deviceSelect.addEventListener("change", async () => {
        const type = deviceSelect.value;
        tableBody.innerHTML = "";
        selectedDeviceSerial = null;

        if (!type) {
          tableContainer.style.display = "none";
          return;
        }

        const devices = await ipcRenderer.invoke("get-available-devices", type);

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
  }
 

  function initBuscar() {
    console.log("Hola")
    const input = document.getElementById("busqueda");

    input.addEventListener("input", function () {
      const filtro = this.value.trim();

      ipcRenderer
        .invoke("query-employee-devices", { employeeInfo: filtro })
        .then((resultado) => {
          actualizarTablaBusqueda(resultado);
        })
        .catch((error) => {
          console.error("Error en consulta:", error);
        });
    });

    function exportarExcel() {
      alert("Función de exportar a Excel en desarrollo.");
    }
  }

  function formatearFecha(fechaISO) {
    if (!fechaISO) return "";
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  function actualizarTablaBusqueda(datos) {
    const tbody = document.querySelector("#tablaAsignados tbody");
    tbody.innerHTML = "";

    datos.forEach((fila) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td>${fila.ID_Asignacion || ""}</td>
      <td>${fila.ID_Empleado || ""}</td>
      <td>${fila.ID_Dispositivo || ""}</td>
      <td>${formatearFecha(fila.Fecha_asignacion) || ""}</td>
      <td>${formatearFecha(fila.Fecha_cambio) || ""}</td>
    `;
      tbody.appendChild(tr);
    });
  }


  let currentModel = null;

  async function loadTypes() {
    alert("WORKING")
    const types = await ipcRenderer.invoke("get-device-types");
    const select = document.getElementById("deviceType");
    types.forEach((t) => {
      const option = document.createElement("option");
      option.value = t.Tipo;
      option.textContent = t.Tipo;
      select.appendChild(option);
    });
  }

  async function loadInventory(type = "") {
    const data = await ipcRenderer.invoke("get-grouped-inventory", type);
    renderTable(data);
  }

  function renderTable(data) {
    const tbody = document.querySelector("#inventoryTable tbody");
    tbody.innerHTML = "";

    data.forEach((row) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
          <td>${row.TipoDispositivo}</td>
          <td>${row.Modelo}</td>
          <td>${row.Marca}</td>
          <td>${row.Cantidad}</td>
          <td>${row.Limite}</td>
          <td><button class='edit-btn' onclick='openEdit("${row.Modelo}", ${row.Limite})'>Editar</button></td>
        `;

      tbody.appendChild(tr);
    });
  }

  function openEdit(modelo, limite) {
    currentModel = modelo;
    document.getElementById("editTitle").textContent = `Modelo: ${modelo}`;
    document.getElementById("newLimit").value = limite;
    toggleModal(true);
  }

  function toggleModal(show) {
    document.getElementById("editModal").classList.toggle("hidden", !show);
  }

  document.getElementById("saveLimit").addEventListener("click", async () => {
    const nuevoLimite = parseInt(document.getElementById("newLimit").value);
    if (isNaN(nuevoLimite)) return alert("Ingrese un número válido");

    const success = await ipcRenderer.invoke(
      "update-limit",
      currentModel,
      nuevoLimite
    );
    if (success) {
      toggleModal(false);
      loadInventory(document.getElementById("deviceType").value);
    } else {
      alert("Error al guardar");
    }
  });


  document.getElementById("deviceType").addEventListener("change", function () {
    loadInventory(this.value);
  });


  loadTypes();
  loadInventory();

  
  async function cargarDispositivos() {
    const filtros = {
      tipoDispositivo: document.getElementById("deviceTypeSelect").value,
      marca: document.getElementById("brandSearch").value,
      modelo: document.getElementById("modelSelect").value,
      serialNumber: document.getElementById("serialNumberSearch").value,
    };

    const dispositivos = await ipcRenderer.invoke("get-devices", filtros);
    const tbody = document.getElementById("deviceTableBody");
    tbody.innerHTML = ""; 

    dispositivos.forEach((dispositivo) => {
      const tr = document.createElement("tr");

     
      tr.innerHTML = `
      <td>${dispositivo.Tipo}</td>
      <td>${dispositivo.Marca}</td>
      <td>${dispositivo.Modelo}</td>
      <td>${dispositivo.Serial_Number}</td>
    `;

     
      const accionesTd = document.createElement("td");

     
      const btnEditar = document.createElement("button");
      btnEditar.textContent = "Editar SN";
      btnEditar.className = "btn btn-sm btn-warning me-2";
      btnEditar.onclick = () =>
        editarSerial(dispositivo.ID, dispositivo.Serial_Number);

    
      const btnEliminar = document.createElement("button");
      btnEliminar.textContent = "Eliminar";
      btnEliminar.className = "btn btn-sm btn-danger";
      btnEliminar.onclick = () => eliminarDispositivo(dispositivo.ID);

      
      accionesTd.appendChild(btnEditar);
      accionesTd.appendChild(btnEliminar);

      tr.appendChild(accionesTd);
      tbody.appendChild(tr);
    });
  }

  async function editarSerial(id, serialActual) {
    const nuevoSerial = prompt("Nuevo número de serie:", serialActual);
    if (
      nuevoSerial &&
      nuevoSerial.trim() !== "" &&
      nuevoSerial !== serialActual
    ) {
      const respuesta = await ipcRenderer.invoke("update-serial", {
        id,
        nuevoSerial,
      });
      if (respuesta.success) {
        alert("Número de serie actualizado");
        cargarDispositivos();
      } else {
        alert("Error al actualizar: " + respuesta.error);
      }
    }
  }

  async function eliminarDispositivo(id) {
    const confirmar = confirm("¿Seguro que deseas eliminar este dispositivo?");
    if (confirmar) {
      const respuesta = await ipcRenderer.invoke("delete-device", id);
      if (respuesta.success) {
        alert("Dispositivo eliminado");
        cargarDispositivos();
      } else {
        alert("Error al eliminar: " + respuesta.error);
      }
    }
  }

  
  function initConfigurar() {
    let filaEditando = null;

    function aplicarFiltros() {
      const filtro = document.getElementById("busqueda").value.toLowerCase();
      const columna = parseInt(document.getElementById("comboFiltro").value);
      const filas = document.querySelectorAll("#tablaConfiguracion tbody tr");
      const hoy = new Date().toISOString().split("T")[0];

      filas.forEach((fila) => {
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
      document.getElementById("modalEmpleado").value =
        filaEditando.children[0].innerText;
      document.getElementById("modalDispositivo").value =
        filaEditando.children[1].innerText;
      document.getElementById("modalEstado").value =
        filaEditando.children[2].innerText;
      document.getElementById("modalFecha").value =
        filaEditando.children[3].innerText;
      abrirModal();
    }

    aplicarFiltros();
  }

  function abrirModal(index = null) {
    document.getElementById("modal").style.display = "flex";
    if (index !== null) {
      editarIndex = index;
      const d = dispositivos[index];
      document.getElementById("tipo").value = d.tipo;
      document.getElementById("modelo").value = d.modelo;
      if (d.serial === "Sin Serial") {
        document.getElementById("tieneSerial").checked = false;
        toggleSerialInput();
        document.getElementById("serial").value = "";
      } else {
        document.getElementById("tieneSerial").checked = true;
        toggleSerialInput();
        document.getElementById("serial").value = d.serial;
      }
    } else {
      editarIndex = null;
      document.getElementById("modelo").value = "";
      document.getElementById("serial").value = "";
      document.getElementById("tieneSerial").checked = false;
      toggleSerialInput();
    }
  }

  function cerrarModal() {
    document.getElementById("modal").style.display = "none";
  }

  function toggleSerialInput() {
    document.getElementById("grupoSerial").style.display =
      document.getElementById("tieneSerial").checked ? "block" : "none";
    document.getElementById("cantidad").classList.toggle("inputBloqueado");
  }

  function guardarDispositivo() {
    const tipo = document.getElementById("tipo").value;
    const modelo = document.getElementById("modelo").value.trim();
    let serial = document.getElementById("tieneSerial").checked
      ? document.getElementById("serial").value.trim()
      : "";

    if (!modelo) {
      alert("El modelo es obligatorio.");
      return;
    }

    if (document.getElementById("tieneSerial").checked && !serial) {
      alert("Debe ingresar el serial o desmarcar la opción.");
      return;
    }

    if (!document.getElementById("tieneSerial").checked) {
      serial = generarSerialAutomatico(tipo, modelo);
    }

    if (editarIndex === null) {
      dispositivos.push({ tipo, modelo, serial });
    } else {
      dispositivos[editarIndex] = { tipo, modelo, serial };
    }

    actualizarTabla();
    cerrarModal();
  }

  function actualizarTabla() {
    const tbody = document.getElementById("cuerpoTabla");
    tbody.innerHTML = "";
    dispositivos.forEach((d, index) => {
      const fila = `
          <tr>
            <td>${d.tipo}</td>
            <td>${d.modelo}</td>
            <td>${d.serial}</td>
            <td><button class="btn eliminar" onclick="eliminarDispositivo(${index})">Eliminar</button></td>
          </tr>
        `;
      tbody.innerHTML += fila;
    });
  }

  function exportarExcel() {
    const ws = XLSX.utils.json_to_sheet(dispositivos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dispositivos");
    XLSX.writeFile(wb, "dispositivos.xlsx");
  }

  function initConfigurarDisp() {
    let dispositivos = [];
    let editarIndex = null;
  }
