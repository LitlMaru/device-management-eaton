let ascending = true;

  const employees = [
    {
      id: 1, nombre: "Juan Pérez", departamento: "TI", posicion: "Desarrollador", 
      fecha: "2022-03-15", ubicacion: "Oficina 1"
    },
    {
      id: 2, nombre: "Ana Gómez", departamento: "Recursos Humanos", posicion: "Analista", 
      fecha: "2021-08-10", ubicacion: "Oficina 2"
    },
    {
      id: 3, nombre: "Luis Herrera", departamento: "Ventas", posicion: "Ejecutivo", 
      fecha: "2023-01-05", ubicacion: "Sucursal Norte"
    }
  ];

  function renderTable(data) {
    const tbody = document.getElementById('employee-body');
    tbody.innerHTML = '';
    data.forEach(emp => {
      const row = `
        <tr>
          <td>${emp.id}</td>
          <td>${emp.nombre}</td>
          <td>${emp.departamento}</td>
          <td>${emp.posicion}</td>
          <td>${emp.fecha}</td>
          <td>${emp.ubicacion}</td>
          <td>
            <button class="edit-btn" onclick="editEmployee(${emp.id})">Editar</button>
            <button class="delete-btn" onclick="deleteEmployee(${emp.id})"> Eliminar</button>
          </td>
        </tr>
      `;
      tbody.insertAdjacentHTML('beforeend', row);
    });
  }

  function deleteEmployee(id) {
    const index = employees.findIndex(emp => emp.id === id);
    if (index !== -1) {
      if (confirm("¿Deseas eliminar este empleado?")) {
        employees.splice(index, 1);
        renderTable(employees);
      }
      window.focus();
    }
  }

  function editEmployee(id) {
    const emp = employees.find(e => e.id === id);
    if (emp) {
      const nuevoNombre = prompt("Editar nombre:", emp.nombre);
      if (nuevoNombre) {
        emp.nombre = nuevoNombre;
        renderTable(employees);
      }
    }
  }

  function exportToExcel() {
    let csv = 'ID Empleado,Nombre,Departamento,Posición,Email,Fecha Entrada,Ubicación\n';
    employees.forEach(emp => {
      csv += `${emp.id},"${emp.nombre}","${emp.departamento}","${emp.posicion}","${emp.email}",${emp.fecha},"${emp.ubicacion}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'empleados.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function toggleSort() {
    ascending = !ascending;
    employees.sort((a, b) => ascending ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre));
    renderTable(employees);
  }

  document.getElementById('search').addEventListener('input', function () {
    const query = this.value.toLowerCase();
    const filtered = employees.filter(emp =>
      emp.nombre.toLowerCase().includes(query) ||
      emp.departamento.toLowerCase().includes(query) ||
      emp.posicion.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query) ||
      emp.ubicacion.toLowerCase().includes(query)
    );
    renderTable(filtered);
  });


  renderTable(employees);
