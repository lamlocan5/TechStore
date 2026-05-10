// Login Configuration
const AUTH_API_URL = 'http://localhost:8888/api/v1/identity';

// Show alert message
function showAlert(message, type = 'error') {
    const alertDiv = document.getElementById('alert');
    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type} show`;

    if (type === 'success') {
        setTimeout(() => {
            alertDiv.classList.remove('show');
        }, 2000);
    }
}

// Hide alert
function hideAlert() {
    const alertDiv = document.getElementById('alert');
    alertDiv.classList.remove('show');
}

// Check if already logged in
function checkExistingAuth() {
    const token = localStorage.getItem('adminToken');
    const userInfo = localStorage.getItem('adminUser');

    if (token && userInfo) {
        try {
            const user = JSON.parse(userInfo);
            // Check if token is expired (basic check)
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                const exp = payload.exp * 1000; // Convert to milliseconds

                if (exp > Date.now()) {
                    // Token still valid, redirect to admin
                    if (user.roles && user.roles.includes('ADMIN')) {
                        window.location.href = 'index.html';
                        return true;
                    }
                }
            }
        } catch (e) {
            console.error('Invalid stored auth data', e);
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
        }
    }
    return false;
}

// Login function
async function login(username, password) {
    const btnLogin = document.getElementById('btnLogin');

    try {
        // Show loading state
        btnLogin.disabled = true;
        btnLogin.innerHTML = '<span class="loading"></span>Đang đăng nhập...';
        hideAlert();

        // Call authentication API
        const response = await fetch(`${AUTH_API_URL}/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Hiển thị message từ backend
            throw new Error(data.message || 'Đăng nhập thất bại');
        }

        if (!data.result) {
            throw new Error('Đăng nhập thất bại. Không nhận được thông tin xác thực.');
        }

        const authResult = data.result;

        // Check if user has ADMIN role
        if (!authResult.roles || !authResult.roles.includes('ADMIN')) {
            showAlert('❌ Bạn không có quyền truy cập Admin Panel. Vui lòng đăng nhập với tài khoản ADMIN.', 'error');
            btnLogin.disabled = false;
            btnLogin.textContent = 'Đăng nhập';
            return;
        }

        // Store authentication data
        localStorage.setItem('adminToken', authResult.token);
        localStorage.setItem('adminUser', JSON.stringify({
            userId: authResult.userId,
            username: authResult.username,
            firstName: authResult.firstName,
            lastName: authResult.lastName,
            roles: authResult.roles
        }));

        // Check remember me
        const rememberMe = document.getElementById('rememberMe').checked;
        if (rememberMe) {
            localStorage.setItem('rememberAdmin', 'true');
        } else {
            localStorage.removeItem('rememberAdmin');
        }

        // Show success message
        showAlert('✅ Đăng nhập thành công! Đang chuyển hướng...', 'success');

        // Redirect to admin dashboard
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);

    } catch (error) {
        console.error('Login error:', error);
        showAlert(error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tên đăng nhập và mật khẩu.', 'error');
        btnLogin.disabled = false;
        btnLogin.textContent = 'Đăng nhập';
    }
}

// Handle form submission
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showAlert('Vui lòng nhập đầy đủ thông tin đăng nhập', 'error');
        return;
    }

    login(username, password);
});

// Auto-fill if remembered
window.addEventListener('DOMContentLoaded', function () {
    // Check if already logged in
    if (checkExistingAuth()) {
        return;
    }

    // Auto-fill username if remembered
    const rememberAdmin = localStorage.getItem('rememberAdmin');
    const adminUser = localStorage.getItem('adminUser');

    if (rememberAdmin === 'true' && adminUser) {
        try {
            const user = JSON.parse(adminUser);
            document.getElementById('username').value = user.username;
            document.getElementById('rememberMe').checked = true;
            document.getElementById('password').focus();
        } catch (e) {
            console.error('Error loading remembered user', e);
        }
    } else {
        document.getElementById('username').focus();
    }
});

// Handle Enter key
document.getElementById('password').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    }
});

