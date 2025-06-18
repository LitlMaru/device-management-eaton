 const currentUser = {
      nombre: "Admin123",
      rol: "Master" 
    };

    const logs = [
      { fecha: "2024-06-01T10:00", usuario: "Carlos Matos", accion: "Asignar", detalles: "Asignó Laptop Dell a María" },
      { fecha: "2024-06-02T15:30", usuario: "Admin123", accion: "Eliminar", detalles: "Eliminó usuario Pedro" },
      { fecha: "2024-06-03T09:00", usuario: "Yefri Garcia", accion: "Agregar", detalles: "Agregó dispositivo nuevo HP" },
      { fecha: "2024-06-05T11:45", usuario: "Johnny", accion: "Editar", detalles: "Editó datos de dispositivo Lenovo" },
      { fecha: "2024-06-06T08:15", usuario: "Francisco Ruiz", accion: "Asignar", detalles: "Asignó Monitor a Luis" },
    ];

    function verificarAcceso() {
      if (currentUser.rol !== "Master") {
        document.getElementById("titulo").classList.add("oculto");
        document.getElementById("contenido").classList.add("oculto");
        document.getElementById("accesoDenegado").classList.remove("oculto");
      } else {
        document.getElementById("contenido").classList.remove("oculto");
        cargarUsuarios();
        cargarLogs();
      }
    }

    function cargarUsuarios() {
      const select = document.getElementById("filtroUsuario");
      const usuariosUnicos = [...new Set(logs.map(log => log.usuario))];
      usuariosUnicos.forEach(user => {
        const option = document.createElement("option");
        option.value = user;
        option.textContent = user;
        select.appendChild(option);
      });
    }

    function cargarLogs() {
      const tbody = document.querySelector("#tablaLogs tbody");
      tbody.innerHTML = "";

      const desde = document.getElementById("desde").value;
      const hasta = document.getElementById("hasta").value;
      const usuario = document.getElementById("filtroUsuario").value.toLowerCase();
      const detalles = document.getElementById("filtroDetalles").value.toLowerCase();

      logs.forEach(log => {
        const logFecha = log.fecha.split("T")[0];

        const cumpleDesde = !desde || logFecha >= desde;
        const cumpleHasta = !hasta || logFecha <= hasta;
        const cumpleUsuario = !usuario || log.usuario.toLowerCase().includes(usuario);
        const cumpleDetalles = !detalles || log.detalles.toLowerCase().includes(detalles);

        if (cumpleDesde && cumpleHasta && cumpleUsuario && cumpleDetalles) {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${log.fecha.replace("T", " ")}</td>
            <td>${log.usuario}</td>
            <td>${log.accion}</td>
            <td>${log.detalles}</td>
          `;
          tbody.appendChild(tr);
        }
      });
    }

    document.addEventListener("DOMContentLoaded", () => {
      verificarAcceso();
      document.getElementById("desde").addEventListener("input", cargarLogs);
      document.getElementById("hasta").addEventListener("input", cargarLogs);
      document.getElementById("filtroUsuario").addEventListener("change", cargarLogs);
      document.getElementById("filtroDetalles").addEventListener("input", cargarLogs);
    });
