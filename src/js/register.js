document.getElementById("employee-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const id = document.getElementById("employee-id").value.trim();
  const dept = document.getElementById("department").value.trim();
  const position = document.getElementById("position").value.trim();

  if (!name || !id || !dept || !position) {
    showMessage("Por favor, complete todos los campos.", "error");
    return;
  }

  console.log("Empleado registrado:", { name, id, dept, position });

  showMessage("Empleado agregado con éxito.", "success");

  this.reset();
});

function showMessage(message, type) {
  const messageBox = document.getElementById("formMessage"); // ID corregido
  messageBox.textContent = message;
  messageBox.className = ""; // Resetear clases
  messageBox.classList.add(type);
  messageBox.style.display = "block";

  setTimeout(() => {
    messageBox.style.display = "none";
  }, 4000);
}
