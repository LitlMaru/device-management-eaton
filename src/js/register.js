document.getElementById("employee-form").addEventListener("submit", function (e) {
  e.preventDefault();

 const { ipcRenderer } = require("electron");
  const name = document.getElementById("name").value.trim();
  const id = document.getElementById("employee-id").value.trim();
  const dept = document.getElementById("department").value.trim();
  const position = document.getElementById("position").value.trim();
  const email = document.getElementById("email").value.trim();

  if (!name || !id || !dept || !position) {
    showMessage("Por favor, complete todos los campos.", "error");
    return;
  }

  const currentDate = new Date().toISOString().split("T")[0];
  ipcRenderer.send("register-employee", () => {id, name, dept, position, email, currentDate})

 ipcRenderer.on("employee-added", () => {
  showMessage("Empleado agregado con éxito.", "success");
  document.getElementById("employee-form").reset();
});

ipcRenderer.on("employee-error", (event, message) => {
  showMessage(`Error: ${message}`, "error");
});

function showMessage(message, type) {
  const messageBox = document.getElementById("formMessage"); 
  messageBox.textContent = message;
  messageBox.className = ""; 
  messageBox.classList.add(type);
  messageBox.style.display = "block";

  setTimeout(() => {
    messageBox.style.display = "none";
  }, 4000);
}})
