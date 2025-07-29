const { ipcRenderer } = window.electron;

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  const result = await ipcRenderer.invoke("login-user", { username, password });

  if (result.success) {
    sessionStorage.setItem("jwt", result.token);
    sessionStorage.setItem("user", JSON.stringify(result.user));

    if (result.user.Rol === 'HR') {
      window.location.href = '../src/hr-menu.html';
    } else {
      window.location.href = '../src/it-menu.html';
    }
  } else {
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = result.message;
  }
});

const togglePassword = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');
const toggleImage = document.getElementById('toggle-image');
let isPasswordVisible = false;

togglePassword.addEventListener('click', () => {
  isPasswordVisible = !isPasswordVisible;
  passwordInput.type = isPasswordVisible ? 'text' : 'password';
  toggleImage.src = isPasswordVisible ? '../assets/hide.png' : '../assets/show.png';
});



function minimizeWindow() {
  window.electronAPI.minimize();
}

fullScreenImage = document.getElementById("img-full-screen");
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
  window.location.href = "login.html";
}
