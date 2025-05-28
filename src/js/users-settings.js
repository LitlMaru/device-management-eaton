let usuarios = [];

function abrirModal() {
  document.getElementById("modal").style.display = "flex";
}

function cerrarModal() {
  document.getElementById("modal").style.display = "none";
  document.querySelectorAll("#modal input, #modal select").forEach(el => el.value = "");
}

function guardarUsuario() {
  const idEmpleado = document.getElementById("idEmpleado").value.trim();
  const nombre = document.getElementById("nombre").value.trim();
  const departamento = document.getElementById("departamento").value.trim();
  const posicion = document.getElementById("posicion").value.trim();
  const email = document.getElementById("email").value.trim();
  const fechaEntrada = document.getElementById("fechaEntrada").value;
  const ubicacion = document.getElementById("ubicacion").value;

  if (!idEmpleado || !nombre || !email) {
    alert("ID, Nombre y Email son obligatorios.");
    return;
  }

  const existente = usuarios.findIndex(u => u.idEmpleado === idEmpleado);
  const datos = { idEmpleado, nombre, departamento, posicion, email, fechaEntrada, ubicacion };

  if (existente !== -1) {
    usuarios[existente] = datos;
  } else {
    usuarios.push(datos);
  }

  actualizarTabla();
  cerrarModal();
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

function eliminarUsuario(idEmpleado) {
  usuarios = usuarios.filter(u => u.idEmpleado !== idEmpleado);
  actualizarTabla();
}

function filtrarUsuarios() {
  const filtro = document.getElementById("buscador").value.toLowerCase();
  const filas = document.querySelectorAll("#cuerpoTablaUsuarios tr");

  filas.forEach(fila => {
    const id = fila.children[0].textContent.toLowerCase();
    fila.style.display = id.includes(filtro) ? "" : "none";
  });
}