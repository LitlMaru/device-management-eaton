// electron-api.js
/*
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
    }*/

      // custom-modal.js
// custom-modal.js

function injectModalStyles() {
  if (document.getElementById('custom-modal-styles')) return;

  const style = document.createElement('style');
  style.id = 'custom-modal-styles';
  style.textContent = `
    .custom-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .custom-modal {
      background: white;
      border: 1px solid #888;
      border-radius: 6px;
      width: 320px;
      max-width: 90%;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      font-family: sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .custom-modal-header {
      background-color: #1976d2;
      color: white;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: bold;
      font-size: 14px;
    }

    .custom-modal-header button {
      background: none;
      border: none;
      color: white;
      font-size: 16px;
      cursor: pointer;
      padding: 0 4px;
    }

    .custom-modal-message {
      padding: 16px;
      font-size: 14px;
      color: black;
    }

    .custom-modal-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 8px 16px 12px;
    }

    .custom-modal-buttons button {
      padding: 4px 12px;
      min-width: 64px;
      font-size: 14px;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
}

function createModal({ title = "Dialog", message = "", buttons = [], onClose = null }) {
  injectModalStyles();
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'custom-modal';

    // Header
    const header = document.createElement('div');
    header.className = 'custom-modal-header';

    const titleDiv = document.createElement('div');
    titleDiv.textContent = title;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '✕';
    closeButton.onclick = () => {
      document.body.removeChild(overlay);
      if (onClose) onClose();
      resolve(null);
    };

    header.appendChild(titleDiv);
    header.appendChild(closeButton);

    // Message
    const msg = document.createElement('div');
    msg.className = 'custom-modal-message';
    msg.textContent = message;

    // Buttons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'custom-modal-buttons';

    buttons.forEach(btn => {
      const b = document.createElement('button');
      b.textContent = btn.label;
      b.onclick = () => {
        document.body.removeChild(overlay);
        resolve(btn.value);
      };
      buttonsDiv.appendChild(b);
    });

    // Assemble
    modal.appendChild(header);
    modal.appendChild(msg);
    modal.appendChild(buttonsDiv);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  });
}

function customAlert(message) {
  return createModal({
    title: 'Alert',
    message,
    buttons: [{ label: 'OK', value: true }]
  });
}

function customConfirm(message) {
  return createModal({
    title: 'Confirm',
    message,
    buttons: [
      { label: 'Cancelar', value: false },
      { label: 'OK', value: true }
    ]
  });
}
