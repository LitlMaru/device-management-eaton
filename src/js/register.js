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

async function init() {
  currentUser = await ElectronAPI.invoke("get-current-user");
  env = await ElectronAPI.getEnv();
  HOST = env.HOST;
  PORT = env.PORT;
  }
init();

function togglePositionFields(type) {
  const isNew = document.getElementById("isNew");
  const isReplacement = document.getElementById("isReplacement");
  const newGroup = document.getElementById("new-position-group");
  const replacementGroup = document.getElementById("replacement-name-group");

  if (type === "new") {
    isNew.checked = true;
    isReplacement.checked = false;
    newGroup.style.display = "block";
    replacementGroup.style.display = "none";
  } else {
    isNew.checked = false;
    isReplacement.checked = true;
    newGroup.style.display = "none";
    replacementGroup.style.display = "block";
  }
}

async function registrar(event) {
  event.preventDefault();
  const name = document.getElementById("name").value.trim();
  const id = document.getElementById("employee-id").value.trim();
  const dept = document.getElementById("department").value.trim();
  const isNew = document.getElementById("isNew").checked;
  const isReplacement = document.getElementById("isReplacement").checked;
  const position = isNew
    ? document.getElementById("new-position").value.trim()
    : document.getElementById("replacement-name").value.trim();

  if (!name || !id || !dept || (!isNew && !isReplacement) || !position) {
    showMessage("Por favor, complete todos los campos requeridos.", "error");
    return;
  }

  const currentDate = new Date().toISOString().split("T")[0];

  const data = {
    id,
    name,
    dept,
    position,
    isNewPosition: isNew,
    isReplacement: isReplacement,
    currentDate
  };

  try {
    await fetch(`${HOST}:${PORT}/api/employees/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ubicacion": currentUser.Ubicacion
      },
      body: JSON.stringify(data)
    });

    showMessage("Empleado agregado con éxito", "success");
    document.getElementById("employee-form").reset();
    document.getElementById("new-position-group").style.display = "none";
    document.getElementById("replacement-name-group").style.display = "none";
  } catch (err) {
    showMessage(`Error: ${err.message}`, "error");
  }
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