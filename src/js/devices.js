const ElectronAPI = (() => {
  function sendMessage(action, data) {
    return new Promise((resolve, reject) => {
      const requestId = Math.random().toString(36).slice(2);

      function handler(event) {
        if (event.data && event.data.requestId === requestId) {
          window.removeEventListener("message", handler);
          if (event.data.success) {
            resolve(event.data.result || event.data.env);
          } else {
            reject(new Error(event.data.error));
          }
        }
      }

      window.addEventListener("message", handler);

      window.parent.postMessage({ action, data, requestId }, "*");
    });
  }

  return {
    invoke: (...args) => sendMessage("invoke-ipc", { args }),
    getEnv: () => sendMessage("get-env"),
  };
})();

let currentUser, HOST, PORT;
const input = document.getElementById("busqueda");

async function init() {
  currentUser = await ElectronAPI.invoke("get-current-user");
  env = await ElectronAPI.getEnv();
  HOST = env.HOST;
  PORT = env.PORT;
}

init();

let dispositivos = [
  {
    id: 1,
    tipo: "Laptop",
    modelo: "Toshiba X200",
    marca: "Toshiba",
    serial: "123456",
    estado: "Disponible",
  },
  {
    id: 2,
    tipo: "Monitor",
    modelo: "ViewSonic VX2458",
    marca: "ViewSonic",
    serial: "654321",
    estado: "Dañado",
  },
  {
    id: 3,
    tipo: "Mouse",
    modelo: "Logitech M220",
    marca: "Logitech",
    serial: "A1122",
    estado: "Disponible",
  },
  {
    id: 4,
    tipo: "Laptop",
    modelo: "Dell Inspiron",
    marca: "Dell",
    serial: "789123",
    estado: "Disponible",
  },
];

const modelosPorTipo = {
  Laptop: ["Toshiba X200", "Dell Inspiron", "HP Pavilion", "Lenovo ThinkPad"],
  Monitor: ["17in", "22in", "24in"],
  Mouse: ["Ergonomico", "Estandar", "Innalambrico"],
  Teclado: ["Ergonomico", "Estandar", "Innalambrico"],
  Cargador: ["Tipo C", "Punta Fina", "Punta Ancha"],
  Cable: ["VGA", "DVI", "HDMI", "Red", "HDMI"],
  Charger: ["Broad Tip"],
  Toner: ["MP C6003", "SP8400A", "MP 6054", "M. C6000"],
  USB: ["A-B"],
};

let editarId = null;

function actualizarModelos() {
  const tipoSeleccionado = document.getElementById("tipo").value;
  const modeloSelect = document.getElementById("modelo");
  modeloSelect.innerHTML = "";

  if (modelosPorTipo[tipoSeleccionado]) {
    modelosPorTipo[tipoSeleccionado].forEach((modelo) => {
      const option = document.createElement("option");
      option.value = modelo;
      option.textContent = modelo;
      modeloSelect.appendChild(option);
    });
  }
}

document.getElementById("tipo").addEventListener("change", actualizarModelos);

function abrirModal() {
  document.getElementById("modal").style.display = "block";
  document.getElementById("overlay").style.display = "block";

  document.getElementById("modalTitle").textContent = "Agregar Dispositivo";

  document.getElementById("tipo").value = "Laptop";
  actualizarModelos();
  document.getElementById("modelo").selectedIndex = 0;
  document.getElementById("marca").value = "";
  document.getElementById("serial").value = "";
  document.getElementById("estado").value = "Disponible";

  editarId = null;
}

function cerrarModal() {
  document.getElementById("modal").style.display = "none";
  document.getElementById("overlay").style.display = "none";
}

function guardarDispositivo() {
  const tipo = document.getElementById("tipo").value.trim();
  const modelo = document.getElementById("modelo").value.trim();
  const marca = document.getElementById("marca").value.trim();
  const serial = document.getElementById("serial").value.trim();
  const estado = document.getElementById("estado").value;

  if (!tipo || !modelo || !marca) {
    alert(
      "Por favor, complete todos los campos excepto el número de serial que puede estar vacío."
    );
    return;
  }

  if (editarId) {
    const index = dispositivos.findIndex((d) => d.id === editarId);
    if (index !== -1) {
      dispositivos[index] = {
        id: editarId,
        tipo,
        modelo,
        marca,
        serial,
        estado,
      };
    }
  } else {
    const nuevoId =
      dispositivos.length > 0
        ? dispositivos[dispositivos.length - 1].id + 1
        : 1;
    dispositivos.push({ id: nuevoId, tipo, modelo, marca, serial, estado });
  }

  cerrarModal();
  aplicarFiltros();
}

async function cargarDispositivos() {
  try {
    const serialNumber = document.getElementById("serialNumberSearch").value;
    const tipoDispositivo = document.getElementById("deviceTypeSelect").value;
    const modelo = document.getElementById("modelSelect").value;
    const estado = document.getElementById("statusSelect").value;

    const response = await fetch(`${HOST}:${PORT}/api/devices/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-ubicacion": currentUser.Ubicacion,
      },
      body: JSON.stringify({ tipoDispositivo, modelo, serialNumber, estado }),
    });

    const data = await response.json();
    if(!Array.isArray(data)){
      console.error("Respuesta inesperada: ", data);
      alert("Error al cargar dispositivos.");
      return;
    }

    mostrarDispositivos(data);
  } catch (err) {
    console.log(err.message);
    alert("Error al cargar dispositivos: " + err.message);
  }
}

function mostrarDispositivos(dispositivos) {
  const tbody = document.querySelector("#deviceTable tbody");
  tbody.innerHTML = "";

  dispositivos.forEach((dispositivo) =>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
    <td>${dispositivo.ID_Dispositivo}</td>
    <td>${dispositivo.TipoDispositivo}</td>
    <td>${dispositivo.Modelo}</td>
    <td>${dispositivo.Marca}</td>
    <td>${dispositivo.Serial_Number}</td>
    <td>${dispositivo.Estado}</td>
    <td>
      <div class="action-buttons">
          <button class="btn-edit" onclick="editarDispositivo(${dispositivo.ID_Dispositivo})">Editar</button>
          <button class="btn-delete" onclick="eliminarDispositivo(${dispositivo.ID_Dispositivo})">Eliminar</button>
        </div>
    </td>`;

    if (dispositivo.Estado === "Dañado"){
      tr.classList.add("row-alert");
    }

    if (dispositivo.Estado === "Asignado"){
      tr.classList.add("row-asignado")
    }
    tbody.appendChild('tr');
  })
}

function editarDispositivo(id) {

  const dispositivo = dispositivos.find((d) => d.id === id);
  if (!dispositivo) return;

  editarId = id;
  document.getElementById("modalTitle").textContent = "Editar Dispositivo";
  document.getElementById("tipo").value = dispositivo.tipo;
  actualizarModelos();

  setTimeout(() => {
    const modeloSelect = document.getElementById("modelo");
    for (let i = 0; i < modeloSelect.options.length; i++) {
      if (modeloSelect.options[i].value === dispositivo.modelo) {
        modeloSelect.selectedIndex = i;
        break;
      }
    }
  }, 0);
  document.getElementById("marca").value = dispositivo.marca;
  document.getElementById("serial").value = dispositivo.serial;
  document.getElementById("estado").value = dispositivo.estado;

  abrirModal();
}

function eliminarDispositivo(id) {
  if (confirm("¿Está seguro de eliminar este dispositivo?")) {
    dispositivos = dispositivos.filter((d) => d.id !== id);
    aplicarFiltros();
  }
}

function aplicarFiltros() {
  const textoFiltro = document
    .getElementById("serialNumberSearch")
    .value.toLowerCase();
  const tipoFiltro = document.getElementById("deviceTypeSelect").value;
  const estadoFiltro = document.getElementById("statusSelect").value;

  let filtrados = dispositivos.filter((d) => {
    const matchSerial = d.serial.toLowerCase().includes(textoFiltro);
    const matchModelo = d.modelo.toLowerCase().includes(textoFiltro);
    const matchTipo = tipoFiltro === "" || d.tipo === tipoFiltro;
    const matchEstado = estadoFiltro === "" || d.estado === estadoFiltro;

    return (matchSerial || matchModelo) && matchTipo && matchEstado;
  });

  mostrarDispositivos(filtrados);
}

mostrarDispositivos(dispositivos);
