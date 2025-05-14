document.getElementById("employee-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const id = document.getElementById("employee-id").value.trim();
  const dept = document.getElementById("department").value.trim();
  const position = document.getElementById("position").value.trim();

  if (!name || !id || !dept || !position) {
    alert("Por favor, complete todos los campos.");
    return;
  }

  // Here you would save to localStorage, database, or send to backend
  console.log("Empleado registrado:", { name, id, dept, position });

  // Show success message
  document.getElementById("success-message").style.display = "block";

  // Optionally, clear the form
  this.reset();
});
