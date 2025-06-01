
function exportarExcel() {
  const tabla = document.getElementById('tablaAsignados');
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(tabla, {
    raw: true,
    cellStyles: true
  });

  XLSX.utils.book_append_sheet(wb, ws, 'Dispositivos Asignados');

  
  XLSX.writeFile(wb, 'Dispositivos_Asignados.xlsx');
}
