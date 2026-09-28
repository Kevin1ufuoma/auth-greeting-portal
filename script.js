// ==========================================
// 1. SELECT DOM ELEMENTS
// ==========================================
const wrapper = document.querySelector('.wrapper');
const loginLink = document.querySelector('.register-link'); // Clicking this shows registration
const registerLink = document.querySelector('.login-link'); // Clicking this shows login
const btnPopup = document.querySelector('.btnLogin-popup');
const iconClose = document.querySelector('.icon-close');

const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');

// Local Backend Server Endpoint
const BACKEND_URL = 'https://log-form-greetingqwenai-app.streamlit.app/';

// ==========================================
// 2. UI SLIDING ANIMATIONS
// ==========================================
loginLink.addEventListener('click', (e) => {
    e.preventDefault();
    wrapper.classList.add('active'); // Slides to Register Form view
});

registerLink.addEventListener('click', (e) => {
    e.preventDefault();
    wrapper.classList.remove('active'); // Slides back to Login Form view
});

btnPopup.addEventListener('click', () => {
    wrapper.classList.remove('active'); // Default to Login view when popping up
});

iconClose.addEventListener('click', () => {
    wrapper.classList.remove('active');
});

// ==========================================
// 3. SECURE AUTHENTICATION FLOWS (BACKEND COMM)
// ==========================================

// --- REGISTRATION ---
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Stop standard form reload

    // Grab input values dynamically
    const username = document.getElementById('register-username').value;
    const gender = document.getElementById('register-gender').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    // Provide immediate user feedback
    const regBtn = registerForm.querySelector('.btn');
    regBtn.innerText = 'Creating Account...';
    regBtn.disabled = true;

    try {
        const response = await fetch(`${BACKEND_URL}/api/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, gender, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message); // "Registration successful! Check email..."
            registerForm.reset();
            wrapper.classList.remove('active'); // Slide them back to login view
        } else {
            alert(`Registration Failed: ${data.error}`);
        }
    } catch (error) {
        console.error('Connection Error:', error);
        alert('Could not reach backend server. Make sure your Python Flask app is running!');
    } finally {
        regBtn.innerText = 'Register';
        regBtn.disabled = false;
    }
});

// --- LOGIN ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const loginBtn = loginForm.querySelector('.btn');
    loginBtn.innerText = 'Logging in...';
    loginBtn.disabled = true;

    try {
        const response = await fetch(`${BACKEND_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Login successful!');
            
            // Securely cache user credentials for the Greeting Dashboard page
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('username', data.user.username);
            localStorage.setItem('gender', data.user.gender);
            localStorage.setItem('email', data.user.email);

            // TODO: Redirect user to the dashboard page next
            window.location.href = 'dashboard.html';
        } else {
            alert(`Login Failed: ${data.error}`);
        }
    } catch (error) {
        console.error('Connection Error:', error);
        alert('Could not reach backend server.');
    } finally {
        loginBtn.innerText = 'Login';
        loginBtn.disabled = false;
    }
});
