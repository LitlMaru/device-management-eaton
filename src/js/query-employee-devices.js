
console.log("Hola")
const input = document.getElementById("busqueda");

input.addEventListener("input", function () {
    const filtro = this.value.trim();

    ipcRenderer
    .invoke("query-employee-devices", { employeeInfo: filtro })
    .then((resultado) => {
        actualizarTablaBusqueda(resultado);
    })
    .catch((error) => {
        console.error("Error en consulta:", error);
    });
});

/*function exportarExcel() {
    alert("Función de exportar a Excel en desarrollo.");
}*/

function formatearFecha(fechaISO) {
    if (!fechaISO) return "";
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
}

function actualizarTablaBusqueda(datos) {
    const tbody = document.querySelector("#tablaAsignados tbody");
    tbody.innerHTML = "";

    datos.forEach((fila) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td>${fila.ID_Asignacion || ""}</td>
        <td>${fila.ID_Empleado || ""}</td>
        <td>${fila.ID_Dispositivo || ""}</td>
        <td>${formatearFecha(fila.Fecha_asignacion) || ""}</td>
        <td>${formatearFecha(fila.Fecha_cambio) || ""}</td>
    `;
        tbody.appendChild(tr);
    })
}