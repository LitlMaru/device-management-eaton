
let usuarios = [];

    /*function abrirModal() {
      document.getElementById("modal").style.display = "flex";
    }
    function cerrarModal() {
      document.getElementById("modal").style.display = "none";

      document.getElementById("idEmpleado").value = "";
      document.getElementById("nombre").value = "";
      document.getElementById("departamento").value = "";
      document.getElementById("posicion").value = "";
      document.getElementById("email").value = "";
      document.getElementById("fechaEntrada").value = "";
      document.getElementById("ubicacion").value = "MCB";
    }


    function actualizarTabla() {
      const tbody = document.getElementById("cuerpoTablaUsuarios");
      tbody.innerHTML = "";
      usuarios.forEach(usuario => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${usuario.idEmpleado}</td>
          <td>${usuario.nombre}</td>
          <td>${usuario.departamento}</td>
          <td>${usuario.posicion}</td>
          <td>${usuario.email}</td>
          <td>${usuario.fechaEntrada}</td>
          <td>${usuario.ubicacion}</td>
          <td><button class="btn-danger" onclick="eliminarUsuario('${usuario.idEmpleado}')">Eliminar</button></td>
        `;
        tbody.appendChild(tr);
      });
    }
 
function enviarCorreo(usuario) {
    alert(
    `Correo enviado a ${usuario.email} con los datos:\n` +
        `ID: ${usuario.idEmpleado}\n` +
        `Nombre: ${usuario.nombre}\n` +
        `Departamento: ${usuario.departamento}\n` +
        `Posición: ${usuario.posicion}\n` +
        `Fecha Entrada: ${usuario.fechaEntrada}\n`
    );
}*/

  function registrar(event){
    
    event.preventDefault();
    const name = document.getElementById("name").value.trim();
    const id = document.getElementById("employee-id").value.trim();
    const dept = document.getElementById("department").value.trim();
    const position = document.getElementById("position").value.trim();
    const email = document.getElementById("email").value.trim();

    if (!name || !id || !dept || !position) {
        showMessage("Por favor, complete todos los campos.", "error");
        return;
    }

    const currentDate = new Date().toISOString().split("T")[0];
    ipcRenderer.send("register-employee", () => {id, name, dept, position, email, currentDate})

    ipcRenderer.on("employee-added", () => {
    showMessage("Empleado agregado con éxito.", "success");
    document.getElementById("employee-form").reset();
    });

    ipcRenderer.on("employee-error", (event, message) => {
    showMessage(`Error: ${message}`, "error");
    });
}

function showMessage(message, type) {
  const messageBox = document.getElementById("formMessage"); 
  messageBox.textContent = message;
  messageBox.className = ""; 
  messageBox.classList.add(type);
  messageBox.style.display = "block";


  setTimeout(() => {
    messageBox.style.display = "none";
  }, 4000);
}

 // const usuario = { id, name, dept, position, email, fechaEntrada};
      
  //enviarCorreo(usuario);
