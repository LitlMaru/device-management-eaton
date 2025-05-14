  const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const toggleImage = document.getElementById('toggle-image');
    let isPasswordVisible = false;

    togglePassword.addEventListener('click', () => {
      isPasswordVisible = !isPasswordVisible;
      passwordInput.type = isPasswordVisible ? 'text' : 'password';
      toggleImage.src = isPasswordVisible ? '../assets/hide.png' : '../assets/show.png';
    });