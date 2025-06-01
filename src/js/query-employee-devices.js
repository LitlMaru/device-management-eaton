let filaSeleccionada = null;

    function abrirModal(boton) {

      filaSeleccionada = boton.closest('tr');
      const userId = filaSeleccionada.cells[1].innerText;

      document.getElementById("userModal").innerText = userId;

      document.getElementById("modalAsignacion").style.display = "block";
    }

    function cerrarModal() {
      document.getElementById("modalAsignacion").style.display = "none";

      document.querySelectorAll('#formDispositivos input[type="checkbox"]').forEach(chk => chk.checked = false);
    }

    function filtrarTabla() {
      const filtro = document.getElementById('busqueda').value.toLowerCase();
      const filas = document.querySelectorAll('#tablaAsignados tbody tr');
      filas.forEach(fila => {
        const textoFila = fila.innerText.toLowerCase();
        fila.style.display = textoFila.includes(filtro) ? '' : 'none';
      });
    }

    async function generarAcuerdo() {
      if (!filaSeleccionada) {
        alert('No se ha seleccionado ninguna fila.');
        return;
      }

      const dispositivos = Array.from(document.querySelectorAll('input[name="dispositivo"]:checked')).map(el => el.value);
      if (dispositivos.length === 0) {
        alert('Selecciona al menos un dispositivo.');
        return;
      }


      const fechaActual = new Date();
      const fechaFormato = fechaActual.toLocaleDateString('es-ES');

      const numeroE = filaSeleccionada.cells[0].innerText;
      const nombreEmpleado = filaSeleccionada.cells[1].innerText; 
      const modelo = filaSeleccionada.cells[2].innerText;
      const numeroSerie = "N/A"; 
      const equipo = modelo; 
      const marca = "Eaton"; 
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor("#004e92");
      doc.text("Eaton Corporation", 105, 20, null, null, "center");

      doc.setFontSize(14);
      doc.text("Carta de entrega de equipo de trabajo", 105, 30, null, null, "center");

      doc.setDrawColor("#004e92");
      doc.setLineWidth(0.8);
      doc.line(15, 35, 195, 35);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor("#333");


      const textoCarta = `Por medio de la presente recibo en fecha ${fechaFormato} de mi empleador Eaton con carácter de herramienta de trabajo, el cual debo usar para el desempeño de mis funciones.

Datos generales del equipo:

Fecha: ${fechaFormato}
Número E.: ${numeroE}
Nombre: ${nombreEmpleado}
Modelo: ${modelo}
Número de serie: ${numeroSerie}
Equipo: ${equipo}
Marca: ${marca}

A partir de este momento me hago responsable del mismo y acepto cuidarlo siguiendo las recomendaciones de la política de uso de equipos electrónicos, me comprometo a utilizarlo para el desempeño de mis labores, a usarlo con apego a las disposiciones vigentes en esta empresa, a mantenerlo en buen estado y a no proporcionar a terceras personas ni el equipo ni las claves o contraseñas necesarias para su uso.`;


      const splitTexto = doc.splitTextToSize(textoCarta, 180);
      doc.text(splitTexto, 15, 45);


      const yFirmas = 45 + splitTexto.length * 7 + 15;
      doc.setDrawColor("#004e92");
      doc.setLineWidth(0.5);


      doc.text("Firma de quien entrega:", 30, yFirmas);
      doc.line(30, yFirmas + 2, 80, yFirmas + 2);

      doc.text("Firma de quien recibe:", 130, yFirmas);
      doc.line(130, yFirmas + 2, 180, yFirmas + 2);


      doc.save(`Carta_Entrega_${nombreEmpleado}_${fechaFormato.replace(/\//g, '-')}.pdf`);
      cerrarModal();
    }

   
    function exportarExcel() {
      let table = document.getElementById("tablaAsignados");
      let html = table.outerHTML;

      let uri = 'data:application/vnd.ms-excel;base64,';
      let template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="UTF-8"></head><body>${html}</body></html>`;
      let base64 = (s) => window.btoa(unescape(encodeURIComponent(s)));

      let link = document.createElement('a');
      link.href = uri + base64(template);
      link.download = 'DispositivosAsignados.xls';
      link.click();
    }

   
    window.onclick = function (event) {
      let modal = document.getElementById("modalAsignacion");
      if (event.target == modal) {
        cerrarModal();
      }
    };

    const input = document.getElementById("busqueda");

input.addEventListener("input", async function () {
    const filtro = this.value.trim();

    try{
        const response = await fetch(`${HOST}:${PORT}/api/employees/devices`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-ubicacion": sessionStorage.getItem("userLocation"),
        },
        body: JSON.stringify({employeeInfo: filtro})
    });
      const data = await response.json;
      actualizarTablaBusqueda(data);
    }
    catch(error){
        alert("Error al consultar dispositivos del empleado.")
        console.log(error);
    }
});

/*ipcRenderer
    .invoke("query-employee-devices", { employeeInfo: filtro })
    .then((resultado) => {
        actualizarTablaBusqueda(resultado);
    })
    .catch((error) => {
        console.error("Error en consulta:", error);
    });*/