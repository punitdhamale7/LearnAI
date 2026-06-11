function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}


function checkPasswordStrength(password) {
    let strength = 0;
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    // Update requirement indicators
    updateRequirement('req-length', requirements.length);
    updateRequirement('req-uppercase', requirements.uppercase);
    updateRequirement('req-lowercase', requirements.lowercase);
    updateRequirement('req-number', requirements.number);
    updateRequirement('req-special', requirements.special);
    
    // Calculate strength
    Object.values(requirements).forEach(met => {
        if (met) strength++;
    });
    
    return {
        score: strength,
        level: strength <= 2 ? 'weak' : strength <= 4 ? 'medium' : 'strong',
        requirements
    };
}

function updateRequirement(id, met) {
    const element = document.getElementById(id);
    if (element) {
        if (met) {
            element.classList.add('met');
        } else {
            element.classList.remove('met');
        }
    }
}

// Update Password Strength UI
function updatePasswordStrength(password) {
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    if (!strengthFill || !strengthText) return;
    
    if (password.length === 0) {
        strengthFill.className = 'strength-fill';
        strengthText.textContent = 'Password strength';
        strengthText.className = 'strength-text';
        return;
    }
    
    const result = checkPasswordStrength(password);
    
    strengthFill.className = `strength-fill ${result.level}`;
    strengthText.className = `strength-text ${result.level}`;
    
    const levelText = {
        weak: 'Weak password',
        medium: 'Medium password',
        strong: 'Strong password'
    };
    
    strengthText.textContent = levelText[result.level];
}

// Real-time Password Validation
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('password');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            updatePasswordStrength(e.target.value);
        });
    }
});

// Validate Email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate Username
function validateUsername(username) {
    const re = /^[a-zA-Z0-9_]{4,}$/;
    return re.test(username);
}

// Validate Phone
function validatePhone(phone) {
    if (!phone) return true; // Optional field
    const re = /^[+]?[0-9\s-]{10,}$/;
    return re.test(phone);
}

// Show Error
function showError(inputId, message) {
    const input = document.getElementById(inputId);
    const errorElement = document.getElementById(inputId + 'Error');
    
    if (input) {
        input.classList.add('error');
        input.classList.remove('success');
    }
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

// Clear Error
function clearError(inputId) {
    const input = document.getElementById(inputId);
    const errorElement = document.getElementById(inputId + 'Error');
    
    if (input) {
        input.classList.remove('error');
        input.classList.add('success');
    }
    
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
}

// Handle Register Form
function handleRegister(event) {
    event.preventDefault();
    
    let isValid = true;
    
    // Get form values
    const fullName = document.getElementById('fullName').value.trim();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;
    const newsletter = document.getElementById('newsletter').checked;
    
    // Validate Full Name
    if (fullName.length < 3) {
        showError('fullName', 'Name must be at least 3 characters');
        isValid = false;
    } else {
        clearError('fullName');
    }
    
    // Validate Username
    if (!validateUsername(username)) {
        showError('username', 'Username must be at least 4 characters (letters, numbers, underscore only)');
        isValid = false;
    } else {
        clearError('username');
    }
    
    // Validate Email
    if (!validateEmail(email)) {
        showError('email', 'Please enter a valid email address');
        isValid = false;
    } else {
        clearError('email');
    }
    
    // Validate Phone (optional)
    if (phone && !validatePhone(phone)) {
        showError('phone', 'Please enter a valid phone number');
        isValid = false;
    } else {
        clearError('phone');
    }
    
    // Validate Password
    const passwordStrength = checkPasswordStrength(password);
    if (passwordStrength.score < 5) {
        showError('password', 'Please meet all password requirements');
        isValid = false;
    } else {
        clearError('password');
    }
    
    // Validate Confirm Password
    if (password !== confirmPassword) {
        showError('confirmPassword', 'Passwords do not match');
        isValid = false;
    } else {
        clearError('confirmPassword');
    }
    
    // Validate Terms
    if (!terms) {
        showError('terms', 'You must agree to the terms and conditions');
        isValid = false;
    } else {
        clearError('terms');
    }
    
    if (isValid) {
        // Create user object
        const userData = {
            fullName,
            username,
            email,
            phone,
            password
        };
        
        // Send to backend API
        fetch('https://learnai-backend-yf50.onrender.com/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Registration successful! Redirecting to login...');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            } else {
                alert('Registration failed: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Registration failed. Please make sure the backend server is running.');
        });
    }
}

// Handle Login Form
function handleLogin(event) {
    event.preventDefault();
    
    let isValid = true;
    
    // Get form values
    const emailOrUsername = document.getElementById('emailOrUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Validate Email/Username
    if (emailOrUsername.length < 3) {
        showError('emailOrUsername', 'Please enter your email or username');
        isValid = false;
    } else {
        clearError('emailOrUsername');
    }
    
    // Validate Password
    if (password.length < 8) {
        showError('loginPassword', 'Password must be at least 8 characters');
        isValid = false;
    } else {
        clearError('loginPassword');
    }
    
    if (isValid) {
        // Use the new JWT-based API
        window.API.login(emailOrUsername, password)
            .then(data => {
                if (data.success) {
                    // Store remember me preference
                    if (rememberMe) {
                        localStorage.setItem('rememberMe', 'true');
                    } else {
                        localStorage.removeItem('rememberMe');
                    }
                    
                    window.location.href = 'index.html';
                } else {
                    showError('loginPassword', data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Login failed. Please make sure the backend server is running.');
            });
    }
}

// Social Login
function socialLogin(provider) {
    alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login will be implemented with backend`);
}

// Real-time validation on input
document.addEventListener('DOMContentLoaded', () => {
    // Email validation
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', () => {
            const email = emailInput.value.trim();
            if (email && !validateEmail(email)) {
                showError('email', 'Please enter a valid email address');
            } else if (email) {
                clearError('email');
            }
        });
    }
    
    // Username validation
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
        usernameInput.addEventListener('blur', () => {
            const username = usernameInput.value.trim();
            if (username && !validateUsername(username)) {
                showError('username', 'Username must be at least 4 characters (letters, numbers, underscore only)');
            } else if (username) {
                clearError('username');
            }
        });
    }
    
    // Confirm password validation
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            const password = document.getElementById('password').value;
            const confirmPassword = confirmPasswordInput.value;
            
            if (confirmPassword && password !== confirmPassword) {
                showError('confirmPassword', 'Passwords do not match');
            } else if (confirmPassword) {
                clearError('confirmPassword');
            }
        });
    }
});


// Check if user is already logged in on auth pages
document.addEventListener('DOMContentLoaded', () => {
    // Use the new JWT-based authentication check
    if (window.API && window.API.isAuthenticated()) {
        const currentPage = window.location.pathname;
        
        // If on login or register page and already logged in, redirect to main page
        if (currentPage.includes('login.html') || currentPage.includes('register.html')) {
            window.location.href = 'index.html';
        }
    }
});
