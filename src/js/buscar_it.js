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

function filtrarTabla() {
  const filtro = document.getElementById("busqueda").value.toLowerCase();
  const filas = document.querySelectorAll("#tablaAsignados tbody tr");
  filas.forEach((fila) => {
    const textoFila = fila.innerText.toLowerCase();
    fila.style.display = textoFila.includes(filtro) ? "" : "none";
  });
}

input.addEventListener("input", async function () {
  const filtro = this.value.trim();
  try {
    const response = await fetch(`${HOST}:${PORT}/api/employees/devices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ubicacion": currentUser.Ubicacion,
      },
      body: JSON.stringify({ employeeInfo: filtro }),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error("Consulta fallida");
    }
    actualizarTablaBusqueda(data.data);
  } catch (error) {
    alert("Error al consultar dispositivos del empleado: "+ error.message);
    console.log(error.message);
  }
});

function actualizarTablaBusqueda(data) {
  const tbody = document.querySelector("#tablaAsignados tbody");
  tbody.innerHTML = ""; 

  data.forEach((item) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.ID_Empleado}</td>
      <td>${item.Nombre}</td>
      <td>${item.TipoDispositivo}</td>
      <td>${item.Fecha_asignacion || ""}</td>
      <td>${item.Fecha_cambio || ""}</td>
    `;
    tbody.appendChild(tr);
  });
}

function exportarExcel() {
  const tabla = document.getElementById("tablaAsignados");
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(tabla, {
    raw: true,
    cellStyles: true,
  });

  XLSX.utils.book_append_sheet(wb, ws, "Dispositivos Asignados");

  XLSX.writeFile(wb, "Dispositivos_Asignados.xlsx");
}

actualizarTablaBusqueda;

async function generarAcuerdo() {
  if (!filaSeleccionada) {
    alert("No se ha seleccionado ninguna fila.");
    return;
  }

  const fechaActual = new Date();
  const fechaFormato = fechaActual.toLocaleDateString("es-ES");
  const horaFormato = fechaActual.toLocaleTimeString("es-ES");

  const numeroE = filaSeleccionada.cells[0].innerText;
  const nombreEmpleado = filaSeleccionada.cells[1].innerText;

  
  const dispositivos = Array.from(
    filaSeleccionada.cells[3].querySelectorAll("li")
  ).map(li => li.textContent);

  if (dispositivos.length === 0) {
    alert("Este empleado no tiene dispositivos asignados.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor("#004e92");
  doc.text("Eaton Corporation", 105, 20, null, null, "center");

  doc.setFontSize(14);
  doc.text("Carta de entrega de equipo de trabajo", 105, 30, null, null, "center");

  doc.setDrawColor("#004e92");
  doc.setLineWidth(0.8);
  doc.line(15, 35, 195, 35);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor("#333");

  let textoCarta = `Por medio de la presente recibo en fecha ${fechaFormato} a las ${horaFormato} de mi empleador Eaton con carácter de herramienta de trabajo, el cual debo usar para el desempeño de mis funciones.

Datos generales del equipo:

Fecha: ${fechaFormato}
Hora: ${horaFormato}
Número E.: ${numeroE}
Nombre: ${nombreEmpleado}

Dispositivos asignados:\n`;

  dispositivos.forEach((item, index) => {
    textoCarta += `- ${item}\n`;
  });

  textoCarta += `

A partir de este momento me hago responsable del mismo y acepto cuidarlo siguiendo las recomendaciones de la política de uso de equipos electrónicos, me comprometo a utilizarlo para el desempeño de mis labores, a usarlo con apego a las disposiciones vigentes en esta empresa, a mantenerlo en buen estado y a no proporcionar a terceras personas ni el equipo ni las claves o contraseñas necesarias para su uso.`;

  const splitTexto = doc.splitTextToSize(textoCarta, 180);
  doc.text(splitTexto, 15, 45);

  const yFirmas = 45 + splitTexto.length * 6 + 10;

  doc.setDrawColor("#004e92");
  doc.setLineWidth(0.5);
  doc.text("Firma de quien entrega:", 30, yFirmas);
  doc.line(30, yFirmas + 2, 80, yFirmas + 2);
  doc.text("Firma de quien recibe:", 130, yFirmas);
  doc.line(130, yFirmas + 2, 180, yFirmas + 2);


  doc.setFontSize(9);
  doc.setTextColor("#999");
  doc.text("EATON - Confidencial", 105, 290, null, null, "center");

  doc.save(`Carta_Entrega_${nombreEmpleado}_${fechaFormato.replace(/\//g, "-")}.pdf`);
}

let filaSeleccionada = null;
document.querySelectorAll("#tablaAsignados tbody tr").forEach(row => {
  row.addEventListener("click", () => {
    filaSeleccionada = row;
    row.classList.add("seleccionada");
  });
});

function verificarDispositivosACambiar() {
  const hoy = new Date();
  const tabla = document.getElementById("tablaAsignados").getElementsByTagName("tbody")[0];
  const filas = tabla.getElementsByTagName("tr");

  let alertas = [];

  for (let fila of filas) {
    const empleado = fila.cells[1].textContent;
    const dispositivo = fila.cells[3].textContent;
    const fechaCambioTexto = fila.cells[5].textContent;


    const fechaCambio = new Date(fechaCambioTexto);

  
    if (
      !isNaN(fechaCambio) &&
      fechaCambio.toDateString() === hoy.toDateString()
    ) {
      alertas.push(`⚠️ El dispositivo "${dispositivo}" asignado a ${empleado} debe ser cambiado hoy.`);
    }
  }


  if (alertas.length > 0) {
    const contenedor = document.createElement("div");
    contenedor.classList.add("alerta-fecha");

    contenedor.innerHTML = `
      <div class="alerta-cambio">
        <strong>🔔 Dispositivos que deben cambiarse hoy:</strong><br>
        ${alertas.join("<br>")}
      </div>
    `;

    document.querySelector(".contenedor-principal").prepend(contenedor);
  }
}


window.addEventListener("DOMContentLoaded", verificarDispositivosACambiar);
