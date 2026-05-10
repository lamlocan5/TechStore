// Authentication Module
const AUTH_API_URL = 'http://localhost:8888/api/v1/identity';

// Get authentication data
function getAuthData() {
    const token = localStorage.getItem('adminToken');
    const userStr = localStorage.getItem('adminUser');

    if (!token || !userStr) {
        return null;
    }

    try {
        const user = JSON.parse(userStr);
        return { token, user };
    } catch (e) {
        console.error('Invalid auth data', e);
        return null;
    }
}

// Check if token is expired
function isTokenExpired(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return true;

        const payload = JSON.parse(atob(parts[1]));
        const exp = payload.exp * 1000; // Convert to milliseconds

        return exp <= Date.now();
    } catch (e) {
        console.error('Error checking token expiration', e);
        return true;
    }
}

// Check if user has ADMIN role
function isAdmin(user) {
    return user && user.roles && user.roles.includes('ADMIN');
}

// Logout function
function logout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        const authData = getAuthData();

        // Call logout API if token exists
        if (authData && authData.token) {
            fetch(`${AUTH_API_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: authData.token })
            }).catch(err => console.error('Logout API error:', err));
        }

        // Clear local storage
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');

        // Redirect to login
        window.location.href = 'login.html';
    }
}

// Check authentication on page load
function checkAuth() {
    const authData = getAuthData();

    // No auth data - redirect to login
    if (!authData) {
        console.log('No auth data found, redirecting to login');
        window.location.href = 'login.html';
        return false;
    }

    // Token expired - redirect to login
    if (isTokenExpired(authData.token)) {
        console.log('Token expired, redirecting to login');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = 'login.html';
        return false;
    }

    // Not admin - redirect to login
    if (!isAdmin(authData.user)) {
        console.log('User is not admin, redirecting to login');
        alert('Bạn không có quyền truy cập Admin Panel');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = 'login.html';
        return false;
    }

    // Show user info
    displayUserInfo(authData.user);

    return true;
}

// Display user info in sidebar
function displayUserInfo(user) {

}

// Get auth headers for API calls
function getAuthHeaders() {
    const authData = getAuthData();

    if (!authData) {
        return {};
    }

    return {
        'Authorization': `Bearer ${authData.token}`,
        'Content-Type': 'application/json'
    };
}

// Enhanced fetch with auth
async function authFetch(url, options = {}) {
    const authData = getAuthData();

    if (!authData) {
        window.location.href = 'login.html';
        throw new Error('Not authenticated');
    }

    // Add auth header
    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${authData.token}`
    };

    const response = await fetch(url, options);

    // Handle 401 - token expired or invalid
    if (response.status === 401) {
        console.log('401 Unauthorized - redirecting to login');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = 'login.html';
        throw new Error('Unauthorized');
    }

    // Handle 403 - insufficient permissions
    if (response.status === 403) {
        alert('Bạn không có quyền thực hiện thao tác này');
        throw new Error('Forbidden');
    }

    return response;
}

// Run auth check when page loads
if (!checkAuth()) {
    // Will redirect to login if check fails
    document.body.innerHTML = '<div style="text-align:center;padding:50px;">Đang kiểm tra đăng nhập...</div>';
}

