// electron-api.js
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

export async function initializeApp() {
  const currentUser = await ElectronAPI.invoke("get-current-user");
  const env = await ElectronAPI.getEnv();
  const HOST = env.HOST;
  const PORT = env.PORT;
  return { currentUser, HOST, PORT };
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
    
export default ElectronAPI;
