   const entregas = {}; 

    function filtrarTabla() {
      const filtro = document.getElementById("busqueda").value.toLowerCase();
      const filas = document.querySelectorAll("#tablaAsignados tbody tr");
      filas.forEach((fila) => {
        const textoFila = fila.innerText.toLowerCase();
        fila.style.display = textoFila.includes(filtro) ? "" : "none";
      });
    }
      async function eliminarFila(boton) {
  const fila = boton.closest("tr");
  const empleadoId = fila.cells[0].innerText;

  confirmation = await customConfirmation(`¿Seguro que deseas eliminar al empleado con ID ${empleadoId}?`)
  if (confirmation) {
    fila.remove();
    delete entregas[empleadoId]; 
    await customAlert("Empleado eliminado correctamente.");
  }
}

    let currentEmpleadoId = null;

    function verificarDispositivos(boton) {
      const fila = boton.closest("tr");
      currentEmpleadoId = fila.cells[0].innerText;
      const empleado = fila.cells[1].innerText;
      const dispositivosTexto = fila.cells[2].innerText;
      const dispositivos = dispositivosTexto.split(",").map(d => d.trim());

      document.getElementById("userModal").innerText = empleado;

      const listaDiv = document.getElementById("listaDispositivos");
      listaDiv.innerHTML = "";

      dispositivos.forEach((dispositivo, index) => {
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = dispositivo;
        checkbox.name = "dispositivo";
        
        if (entregas[currentEmpleadoId] && entregas[currentEmpleadoId].includes(dispositivo)) {
          checkbox.checked = true;
        }

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(" " + dispositivo));
        listaDiv.appendChild(label);
      });

      document.getElementById("modalAsignacion").style.display = "flex";
    }

    async function guardarEntrega() {
      const checkboxes = document.querySelectorAll('#formDispositivos input[name="dispositivo"]');
      const entregados = [];

      checkboxes.forEach(chk => {
        if (chk.checked) {
          entregados.push(chk.value);
        }
      });

      entregas[currentEmpleadoId] = entregados;

      await customAlert("Dispositivos marcados como entregados.");
      cerrarModal();
    }

    function cerrarModal() {
      document.getElementById("modalAsignacion").style.display = "none";
    }

    let ordenAscendente = true;

function ordenarPorNombre() {
  const tabla = document.getElementById("tablaAsignados").getElementsByTagName('tbody')[0];
  const filas = Array.from(tabla.rows);

  filas.sort((a, b) => {
    const nombreA = a.cells[1].innerText.toLowerCase();
    const nombreB = b.cells[1].innerText.toLowerCase();

    if (ordenAscendente) {
      return nombreA.localeCompare(nombreB);
    } else {
      return nombreB.localeCompare(nombreA);
    }
  });

  filas.forEach(fila => tabla.appendChild(fila));

  const boton = document.getElementById("btnOrdenarNombre");
  if (ordenAscendente) {
    boton.innerText = "Ordenar Z-A";
  } else {
    boton.innerText = "Ordenar A-Z";
  }

  ordenAscendente = !ordenAscendente; 
}
