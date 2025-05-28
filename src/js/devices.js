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