const { ipcRenderer } = window.electron;

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  const response = await ipcRenderer.invoke('login-user', { username, password });

  const errorMessage = document.getElementById('error-message');
  if (response.success) {
    if (response.user.Rol === 'HR') {
      window.location.href = '../src/hr.html';
    } else {
      window.location.href = '../src/it.html';
    }
  } else {
    errorMessage.textContent = response.message;
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
