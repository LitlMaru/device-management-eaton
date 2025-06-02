


    let dispositivos = [
      { id: 1, tipo: "Laptop", modelo: "Toshiba X200", marca: "Toshiba", serial: "123456", estado: "Disponible" },
      { id: 2, tipo: "Monitor", modelo: "ViewSonic VX2458", marca: "ViewSonic", serial: "654321", estado: "Dañado" },
      { id: 3, tipo: "Mouse", modelo: "Logitech M220", marca: "Logitech", serial: "A1122", estado: "Disponible" },
      { id: 4, tipo: "Laptop", modelo: "Dell Inspiron", marca: "Dell", serial: "789123", estado: "Disponible" }
    ];

    const modelosPorTipo = 
    {
      Laptop: ["Toshiba X200", "Dell Inspiron", "HP Pavilion", "Lenovo ThinkPad"],
      Monitor: ["17in","22in", "24in"],
      Mouse: ["Ergonomico","Estandar","Innalambrico"],
      Teclado: ["Ergonomico","Estandar","Innalambrico"], 
       Cargador: ["Tipo C","Punta Fina","Punta Ancha"],
        Cable: ["VGA","DVI","HDMI","Red","HDMI"],
         Charger: ["Broad Tip"],
          Toner: ["MP C6003", "SP8400A","MP 6054", "M. C6000"],
            USB: ["A-B"]

    };
    

    let editarId = null; 


    function actualizarModelos() {
      const tipoSeleccionado = document.getElementById('tipo').value;
      const modeloSelect = document.getElementById('modelo');
      modeloSelect.innerHTML = "";

      if (modelosPorTipo[tipoSeleccionado]) {
        modelosPorTipo[tipoSeleccionado].forEach(modelo => {
          const option = document.createElement('option');
          option.value = modelo;
          option.textContent = modelo;
          modeloSelect.appendChild(option);
        });
      }
    }

   
    document.getElementById('tipo').addEventListener('change', actualizarModelos);


    function abrirModal() {
      document.getElementById('modal').style.display = 'block';
      document.getElementById('overlay').style.display = 'block';

      document.getElementById('modalTitle').textContent = 'Agregar Dispositivo';

   
      document.getElementById('tipo').value = "Laptop";
      actualizarModelos();
      document.getElementById('modelo').selectedIndex = 0;
      document.getElementById('marca').value = "";
      document.getElementById('serial').value = "";
      document.getElementById('estado').value = "Disponible";

      editarId = null;
    }


    function cerrarModal() {
      document.getElementById('modal').style.display = 'none';
      document.getElementById('overlay').style.display = 'none';
    }

    function guardarDispositivo() {
      const tipo = document.getElementById('tipo').value.trim();
      const modelo = document.getElementById('modelo').value.trim();
      const marca = document.getElementById('marca').value.trim();
      const serial = document.getElementById('serial').value.trim();
      const estado = document.getElementById('estado').value;

      if (!tipo || !modelo || !marca) {
        alert("Por favor, complete todos los campos excepto el número de serial que puede estar vacío.");
        return;
      }

      if (editarId) {
  
        const index = dispositivos.findIndex(d => d.id === editarId);
        if (index !== -1) {
          dispositivos[index] = { id: editarId, tipo, modelo, marca, serial, estado };
        }
      } else {
     
        const nuevoId = dispositivos.length > 0 ? dispositivos[dispositivos.length - 1].id + 1 : 1;
        dispositivos.push({ id: nuevoId, tipo, modelo, marca, serial, estado });
      }

      cerrarModal();
      aplicarFiltros();
    }

   function mostrarDispositivos(lista) {
  const tbody = document.querySelector("#deviceTable tbody");
  tbody.innerHTML = "";

  lista.forEach(d => {
    const tr = document.createElement("tr");

    // Asigna color según el estado
    if (d.estado === "Dañado") {
      tr.classList.add("row-alert"); // fondo rojo claro
    } else if (d.estado === "Asignado") {
      tr.classList.add("row-asignado"); // fondo amarillo claro
    }

    tr.innerHTML = `
      <td>${d.id}</td>
      <td>${d.tipo}</td>
      <td>${d.modelo}</td>
      <td>${d.marca}</td>
      <td>${d.serial || "-"}</td>
      <td>${d.estado}</td>
      <td>
        <button class="btn-edit" onclick="editarDispositivo(${d.id})">Editar</button>
        <button class="btn-delete" onclick="eliminarDispositivo(${d.id})">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}
  
    function editarDispositivo(id) {
      const dispositivo = dispositivos.find(d => d.id === id);
      if (!dispositivo) return;

      editarId = id;
      document.getElementById('modalTitle').textContent = 'Editar Dispositivo';
      document.getElementById('tipo').value = dispositivo.tipo;
      actualizarModelos();
    
      setTimeout(() => {
        const modeloSelect = document.getElementById('modelo');
        for(let i=0; i < modeloSelect.options.length; i++) {
          if(modeloSelect.options[i].value === dispositivo.modelo) {
            modeloSelect.selectedIndex = i;
            break;
          }
        }
      }, 0);
      document.getElementById('marca').value = dispositivo.marca;
      document.getElementById('serial').value = dispositivo.serial;
      document.getElementById('estado').value = dispositivo.estado;

      abrirModal();
    }

  
    function eliminarDispositivo(id) {
      if (confirm("¿Está seguro de eliminar este dispositivo?")) {
        dispositivos = dispositivos.filter(d => d.id !== id);
        aplicarFiltros();
      }
    }

    function aplicarFiltros() {
      const textoFiltro = document.getElementById('serialNumberSearch').value.toLowerCase();
      const tipoFiltro = document.getElementById('deviceTypeSelect').value;
      const estadoFiltro = document.getElementById('statusSelect').value;

      let filtrados = dispositivos.filter(d => {
        const matchSerial = d.serial.toLowerCase().includes(textoFiltro);
        const matchModelo = d.modelo.toLowerCase().includes(textoFiltro);
        const matchTipo = tipoFiltro === "" || d.tipo === tipoFiltro;
        const matchEstado = estadoFiltro === "" || d.estado === estadoFiltro;

        return (matchSerial || matchModelo) && matchTipo && matchEstado;
      });

      mostrarDispositivos(filtrados);
    }


    mostrarDispositivos(dispositivos);