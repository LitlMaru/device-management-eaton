  function abrirModal() {
      document.getElementById("modal").style.display = "block";
    }

    function cerrarModal() {
      document.getElementById("modal").style.display = "none";
      limpiarCampos();
    }

    function limpiarCampos() {
      document.getElementById("username").value = "";
      document.getElementById("clave").value = "";
      document.getElementById("rol").value = "IT";
      document.getElementById("ubicacion").value = "MCB";
    }

    function agregarUsuario() {
      const username = document.getElementById("username").value.trim();
      const clave = document.getElementById("clave").value.trim();
      const rol = document.getElementById("rol").value;
      const planta = document.getElementById("ubicacion").value;

      if (!username || !clave || !rol || !planta) {
        alert("Por favor, complete todos los campos.");
        return;
    }

      const nuevaFila = document.createElement("tr");
      nuevaFila.innerHTML = `
        <td>${username}</td>
        <td contenteditable="true">${clave}</td>
        <td contenteditable="true">${rol}</td>
        <td contenteditable="true">${planta}</td>
        <td>
          <div class="actions-container">
            <button onclick="eliminarFila(this)">Eliminar usuario</button>
          </div>
        </td>
      `;

      document.getElementById("cuerpoTablaUsuarios").appendChild(nuevaFila);
      cerrarModal();
    }

    function eliminarFila(boton) {
      const fila = boton.closest("tr");
      if (fila) fila.remove();
    }