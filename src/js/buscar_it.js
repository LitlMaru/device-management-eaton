 const asignaciones = [
      { idEmpleado: "001", empleado: "Ana López", ubicacion: "ICD", dispositivo: "Laptop Dell", fechaAsignacion: "2023-05-30" },
      { idEmpleado: "002", empleado: "Carlos Ruiz", ubicacion: "MCB", dispositivo: "Tablet Samsung", fechaAsignacion: "2022-04-10" },
      { idEmpleado: "003", empleado: "Luis Pérez", ubicacion: "MCCB", dispositivo: "Laptop HP", fechaAsignacion: "2024-06-01" },
      { idEmpleado: "004", empleado: "Marta Gómez", ubicacion: "ICD", dispositivo: "Monitor LG", fechaAsignacion: "2023-11-15" },
      { idEmpleado: "005", empleado: "Juan Ramírez", ubicacion: "MCB", dispositivo: "Teclado Logitech", fechaAsignacion: "2023-01-20" }
    ];

    const historial = [
      { dispositivo: "Laptop Dell", empleadoAnterior: "Ana López", empleadoNuevo: "José Martínez", fechaCambio: "2023-12-01" },
      { dispositivo: "Tablet Samsung", empleadoAnterior: "Carlos Ruiz", empleadoNuevo: "María Fernández", fechaCambio: "2024-01-15" }
    ];

    let dispositivoReasignar = null;
    let ordenActual = {}; 

    function showTab(tabId) {
      document.querySelectorAll(".tab").forEach(btn => btn.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));

      document.getElementById(tabId).classList.add("active");
      document.querySelector(`.tab[onclick="showTab('${tabId}')"]`).classList.add("active");
    }

    function exportarExcel(tablaID) {
      const table = document.getElementById(tablaID);
      const wb = XLSX.utils.table_to_book(table, { sheet: "Hoja1" });
      XLSX.writeFile(wb, tablaID + ".xlsx");
    }

    function cargarAsignaciones() {
      const tbody = document.querySelector("#tablaAsignados tbody");
      tbody.innerHTML = "";

      asignaciones.forEach((item, index) => {
        const tr = document.createElement("tr");

        const fechaAsignacion = new Date(item.fechaAsignacion);
        const unAñoDespues = new Date(fechaAsignacion);
        unAñoDespues.setFullYear(unAñoDespues.getFullYear() + 1);
        const fechaActual = new Date();

        let cambioTexto = "";
        let clase = "";

        if (fechaActual >= unAñoDespues) {
          cambioTexto = "Pendiente";
          clase = "rojo";
        } else {
          cambioTexto = unAñoDespues.toISOString().split("T")[0];
        }

        tr.innerHTML = `
          <td>${item.idEmpleado}</td>
          <td>${item.empleado}</td>
          <td>${item.ubicacion}</td>
          <td>${item.dispositivo}</td>
          <td>${item.fechaAsignacion}</td>
          <td class="${clase}">${cambioTexto}</td>
          <td><button class="accion-btn" onclick="abrirModal(${index})">Reasignar</button></td>
        `;
        tbody.appendChild(tr);
      });

      cargarPendientes();
    }

    function cargarPendientes() {
      const tbody = document.querySelector("#tablaPendientes tbody");
      tbody.innerHTML = "";

      asignaciones.forEach(item => {
        const fechaAsignacion = new Date(item.fechaAsignacion);
        const unAñoDespues = new Date(fechaAsignacion);
        unAñoDespues.setFullYear(unAñoDespues.getFullYear() + 1);
        const fechaActual = new Date();

        if (fechaActual >= unAñoDespues) {
          tbody.innerHTML += `
            <tr>
              <td>${item.idEmpleado}</td>
              <td>${item.empleado}</td>
              <td>${item.dispositivo}</td>
              <td>${item.fechaAsignacion}</td>
              <td class="rojo">Pendiente</td>
            </tr>
          `;
        }
      });
    }

    function cargarHistorial() {
      const tbody = document.querySelector("#tablaHistorial tbody");
      tbody.innerHTML = "";
      historial.forEach(h => {
        tbody.innerHTML += `
          <tr>
            <td>${h.dispositivo}</td>
            <td>${h.empleadoAnterior}</td>
            <td>${h.empleadoNuevo}</td>
            <td>${h.fechaCambio}</td>
          </tr>
        `;
      });
    }

 
    function filtrarTabla() {
      const texto = document.getElementById("busqueda").value.toLowerCase();
      document.querySelectorAll("#tablaAsignados tbody tr").forEach(fila => {
        const contenido = fila.textContent.toLowerCase();
        fila.style.display = contenido.includes(texto) ? "" : "none";
      });
    }

    function abrirModal(index) {
      dispositivoReasignar = index;
     
      document.getElementById("nuevoEmpleado").value = "";
      document.getElementById("nuevaFecha").value = "";
      document.getElementById("modalReasignar").style.display = "flex";
    }

    function cerrarModal() {
      dispositivoReasignar = null;
      document.getElementById("modalReasignar").style.display = "none";
    }

    function confirmarReasignacion() {
      const nuevoEmpleado = document.getElementById("nuevoEmpleado").value.trim();
      const nuevaFecha = document.getElementById("nuevaFecha").value;

      if (!nuevoEmpleado) {
        alert("Por favor ingresa el nombre del nuevo empleado.");
        return;
      }
      if (!nuevaFecha) {
        alert("Por favor ingresa la fecha de reasignación.");
        return;
      }

     
      const item = asignaciones[dispositivoReasignar];

    
      historial.push({
        dispositivo: item.dispositivo,
        empleadoAnterior: item.empleado,
        empleadoNuevo: nuevoEmpleado,
        fechaCambio: nuevaFecha
      });

     
      item.empleado = nuevoEmpleado;
      item.fechaAsignacion = nuevaFecha;

      cargarAsignaciones();
      cargarHistorial();
      cerrarModal();
    }

   
    function sortTable(colIndex, tablaID) {
      const table = document.getElementById(tablaID);
      const tbody = table.tBodies[0];
      const filas = Array.from(tbody.rows);

    
      if (!ordenActual[tablaID]) ordenActual[tablaID] = {};
      const direccionActual = ordenActual[tablaID][colIndex] || "desc";
      const nuevaDireccion = direccionActual === "asc" ? "desc" : "asc";
      ordenActual[tablaID][colIndex] = nuevaDireccion;

     
      table.querySelectorAll("th.sortable").forEach(th => {
        th.classList.remove("asc", "desc");
      });

      
      table.querySelectorAll("th")[colIndex].classList.add(nuevaDireccion);

      filas.sort((a, b) => {
        let aTexto = a.cells[colIndex].textContent.trim().toLowerCase();
        let bTexto = b.cells[colIndex].textContent.trim().toLowerCase();

       
        const aNum = Date.parse(aTexto);
        const bNum = Date.parse(bTexto);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return nuevaDireccion === "asc" ? aNum - bNum : bNum - aNum;
        }

        const aNumSimple = parseFloat(aTexto.replace(/[^0-9.-]+/g, ""));
        const bNumSimple = parseFloat(bTexto.replace(/[^0-9.-]+/g, ""));
        if (!isNaN(aNumSimple) && !isNaN(bNumSimple)) {
          return nuevaDireccion === "asc" ? aNumSimple - bNumSimple : bNumSimple - aNumSimple;
        }

        if (aTexto < bTexto) return nuevaDireccion === "asc" ? -1 : 1;
        if (aTexto > bTexto) return nuevaDireccion === "asc" ? 1 : -1;
        return 0;
      });

     
      tbody.innerHTML = "";
      filas.forEach(fila => tbody.appendChild(fila));
    }

  
    window.onload = () => {
      cargarAsignaciones();
      cargarHistorial();
    };
