const ADMIN_PASSWORD = 'admin123'; 

const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('errorMessage');
const togglePassword = document.getElementById('togglePassword');

togglePassword.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    togglePassword.classList.toggle('fa-eye');
    togglePassword.classList.toggle('fa-eye-slash');
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const enteredPassword = passwordInput.value;

    if (enteredPassword === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminAuthenticated', 'true');
        window.location.href = 'admin.html';
    } else {
        errorMessage.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
        
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }
});