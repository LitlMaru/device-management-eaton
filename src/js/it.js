
window.addEventListener("message", async (event) => {
  const { action, data, requestId } = event.data || {};

  if (!requestId) return; 

  try {
    if (action === "invoke-ipc") {
      const result = await window.electron.ipcRenderer.invoke(...data.args);
      event.source.postMessage({ requestId, success: true, result }, event.origin);
    } else if (action === "get-env") {
      event.source.postMessage({ requestId, success: true, env: window.env }, event.origin);
    } else {
      event.source.postMessage({ requestId, success: false, error: "Unknown action" }, event.origin);
    }
  } catch (error) {
    event.source.postMessage({ requestId, success: false, error: error.message }, event.origin);
  }
});


const iframe = document.getElementById("content");

iframe.onload = () => {
  iframe.contentWindow.electron = window.electron;
};

function loadPage(page) {
  iframe.src = `pages/${page}`;
}

function minimizeWindow() {
  window.electronAPI.minimize();
}

const fullScreenImage = document.getElementById("img-full-screen");
function fullScreen() {
  window.electronAPI.maximize();
  if (fullScreenImage.src.includes("fullscreenmode.svg"))
    fullScreenImage.src = "../assets/windowmode.svg";
  else fullScreenImage.src = "../assets/fullscreenmode.svg";
}

function closeWindow() {
  window.electronAPI.close();
}

function closeSession() {
   //window.location.href = "login.html";
  electron.ipcRenderer.invoke("logout")
}
