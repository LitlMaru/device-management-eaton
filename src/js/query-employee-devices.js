   const entregas = {}; 

    function filtrarTabla() {
      const filtro = document.getElementById("busqueda").value.toLowerCase();
      const filas = document.querySelectorAll("#tablaAsignados tbody tr");
      filas.forEach((fila) => {
        const textoFila = fila.innerText.toLowerCase();
        fila.style.display = textoFila.includes(filtro) ? "" : "none";
      });
    }
      function eliminarFila(boton) {
  const fila = boton.closest("tr");
  const empleadoId = fila.cells[0].innerText;

  if (confirm(`¿Seguro que deseas eliminar al empleado con ID ${empleadoId}?`)) {
    fila.remove();
    delete entregas[empleadoId]; 
    alert("Empleado eliminado correctamente.");
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

    function guardarEntrega() {
      const checkboxes = document.querySelectorAll('#formDispositivos input[name="dispositivo"]');
      const entregados = [];

      checkboxes.forEach(chk => {
        if (chk.checked) {
          entregados.push(chk.value);
        }
      });

      entregas[currentEmpleadoId] = entregados;

      alert("Dispositivos marcados como entregados.");
      cerrarModal();
    }

    function cerrarModal() {
      document.getElementById("modalAsignacion").style.display = "none";
    }