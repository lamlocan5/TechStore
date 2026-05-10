// Configuration
const API_BASE_URL = 'http://localhost:8888/api/v1/product';
const ORDER_API_BASE_URL = 'http://localhost:8888/api/v1/orders';
const VOUCHER_API_BASE_URL = 'http://localhost:8888/api/v1/vouchers';
const IDENTITY_API_BASE_URL = 'http://localhost:8888/api/v1/identity';

// Rank Options - Shared constants
const RANK_OPTIONS = [
    { value: 'BRONZE', label: 'Đồng (BRONZE)', color: '#cd7f32', threshold: '0 - 10 triệu' },
    { value: 'SILVER', label: 'Bạc (SILVER)', color: '#c0c0c0', threshold: '> 10 triệu' },
    { value: 'GOLD', label: 'Vàng (GOLD)', color: '#ffd700', threshold: '> 40 triệu' },
    { value: 'DIAMOND', label: 'Kim Cương (DIAMOND)', color: '#b9f2ff', threshold: '> 100 triệu' }
];

// Global state
let currentPage = 'dashboard';
let categories = [];
let brands = [];
let products = [];
let attributes = [];

// Navigation
async function showPage(page) {
    // fetch() tới pages/*.html không hoạt động với giao thức file:// — bắt buộc phục vụ qua http(s)
    if (window.location.protocol === 'file:') {
        const pageContainer = document.getElementById('page-container');
        if (pageContainer) {
            pageContainer.innerHTML =
                '<div style="padding:16px;max-width:520px;line-height:1.6">' +
                '<strong>Không thể tải trang khi mở file trực tiếp (file://).</strong><br><br>' +
                'Trong thư mục <code>FE_Admin</code> chạy lệnh: <code>npm start</code><br>' +
                'Sau đó mở trình duyệt tại: <a href="http://localhost:5500/login.html">http://localhost:5500/login.html</a>' +
                '</div>';
        }
        return;
    }

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });

    // Update title
    const titles = {
        dashboard: 'Dashboard',
        products: 'Quản lý Sản phẩm',
        categories: 'Quản lý Danh mục',
        attributes: 'Quản lý Thuộc tính hệ thống',
        statistics: 'Thống kê hàng hóa',
        revenue: 'Thống kê doanh thu',
        orders: 'Quản lý Đơn hàng',
        vouchers: 'Quản lý Voucher',
        ranks: 'Quản lý Rank & Thành viên'
    };
    const pageTitleElement = document.getElementById('page-title');
    if (pageTitleElement) {
        pageTitleElement.textContent = titles[page] || page;
    }
    currentPage = page;

    // Load page content dynamically
    const pageContainer = document.getElementById('page-container');
    if (pageContainer) {
        try {
            // Load HTML
            const response = await fetch(`pages/${page}.html`);
            if (response.ok) {
                const html = await response.text();
                // Create a temporary container to parse HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;

                // Separate page content and modals
                const modals = tempDiv.querySelectorAll('.modal');
                const pageContent = Array.from(tempDiv.children).filter(el => !el.classList.contains('modal'));

                // Clear page container and add content
                pageContainer.innerHTML = '';
                pageContent.forEach(el => pageContainer.appendChild(el));

                // Move modals to body (if not already there)
                modals.forEach(modal => {
                    const existingModal = document.getElementById(modal.id);
                    if (existingModal && existingModal.parentNode === document.body) {
                        // Modal already exists in body, just update content
                        existingModal.innerHTML = modal.innerHTML;
                    } else {
                        // Remove old modal if exists elsewhere
                        if (existingModal) {
                            existingModal.remove();
                        }
                        // Append new modal to body
                        document.body.appendChild(modal);
                    }
                });

                // Load and execute page script
                const pageFuncName = `load${page.charAt(0).toUpperCase() + page.slice(1)}Page`;
                if (window[pageFuncName]) {
                    await window[pageFuncName]();
                }
            } else {
                pageContainer.innerHTML = '<p>Page not found</p>';
            }
        } catch (error) {
            console.error('Error loading page:', error);
            console.error('Error details:', {
                page: page,
                message: error.message,
                stack: error.stack
            });
            pageContainer.innerHTML = `<p>Error loading page: ${error.message}</p>`;
        }
    }
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        const form = document.getElementById(modalId.replace('-modal', '-form'));
        if (form) {
            form.reset();
        }
    }
}

// Expose to window
window.openModal = openModal;
window.closeModal = closeModal;
window.showPage = showPage;

// Fetch API with Auth
async function fetchAPI(url, options = {}) {
    try {
        // Get auth headers if available
        const authHeaders = typeof getAuthHeaders === 'function' ? getAuthHeaders() : {};

        const response = await fetch(API_BASE_URL + url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
                ...options.headers
            }
        });

        // Handle auth errors
        if (response.status === 401) {
            console.log('401 Unauthorized');
            if (typeof logout === 'function') {
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                logout();
            }
            return null;
        }

        if (response.status === 403) {
            alert('Bạn không có quyền thực hiện thao tác này');
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

// Fetch Order API with Auth
async function fetchOrderAPI(url, options = {}) {
    try {
        // Get auth headers if available
        const authHeaders = typeof getAuthHeaders === 'function' ? getAuthHeaders() : {};

        const fetchOptions = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
                ...options.headers
            }
        };

        // Handle body if it's an object
        if (options.body && typeof options.body === 'object') {
            fetchOptions.body = JSON.stringify(options.body);
        }

        const response = await fetch(ORDER_API_BASE_URL + url, fetchOptions);

        // Handle auth errors
        if (response.status === 401) {
            console.log('401 Unauthorized');
            if (typeof logout === 'function') {
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                logout();
            }
            return null;
        }

        if (response.status === 403) {
            alert('Bạn không có quyền thực hiện thao tác này');
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Order API Error:', error);
        return null; // Don't show alert for order API errors (might not be available)
    }
}

// Fetch Voucher API with Auth
async function fetchVoucherAPI(url, options = {}) {
    try {
        const authHeaders = typeof getAuthHeaders === 'function' ? getAuthHeaders() : {};

        const fetchOptions = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
                ...options.headers
            }
        };

        if (options.body && typeof options.body === 'object') {
            fetchOptions.body = JSON.stringify(options.body);
        }

        const response = await fetch(VOUCHER_API_BASE_URL + url, fetchOptions);

        if (response.status === 401) {
            if (typeof logout === 'function') {
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                logout();
            }
            return null;
        }

        if (response.status === 403) {
            alert('Bạn không có quyền thực hiện thao tác này');
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Voucher API Error:', error);
        return null;
    }
}

// Fetch Identity API with Auth
async function fetchIdentityAPI(url, options = {}) {
    try {
        const authHeaders = typeof getAuthHeaders === 'function' ? getAuthHeaders() : {};

        const fetchOptions = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
                ...options.headers
            }
        };

        if (options.body && typeof options.body === 'object') {
            fetchOptions.body = JSON.stringify(options.body);
        }

        const response = await fetch(IDENTITY_API_BASE_URL + url, fetchOptions);

        if (response.status === 401) {
            if (typeof logout === 'function') {
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                logout();
            }
            return null;
        }

        if (response.status === 403) {
            alert('Bạn không có quyền thực hiện thao tác này');
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Identity API Error:', error);
        return null;
    }
}

// Common data loading functions
async function loadBrands(page = 1, limit = 12) {
    const data = await fetchAPI(`/brands?page=${page}&limit=${limit}`);
    if (data?.result) {
        // Handle paginated response
        if (data.result && typeof data.result === 'object' && data.result.result) {
            brands = data.result.result || [];
        } else if (Array.isArray(data.result)) {
            brands = data.result;
        } else {
            brands = [];
        }
    }
    return brands;
}

async function loadCategories(page = 1, limit = 12) {
    const data = await fetchAPI(`/categories?page=${page}&limit=${limit}`);
    if (data?.result) {
        // Handle paginated response
        if (data.result && typeof data.result === 'object' && data.result.result) {
            categories = data.result.result || [];
        } else if (Array.isArray(data.result)) {
            categories = data.result;
        } else {
            categories = [];
        }
    }
    return categories;
}

async function loadAttributes(page = 1, limit = 12) {
    const data = await fetchAPI(`/spec-attributes?page=${page}&limit=${limit}`);
    if (data?.result) {
        // Handle paginated response
        if (data.result && typeof data.result === 'object' && data.result.result) {
            attributes = data.result.result || [];
        } else if (Array.isArray(data.result)) {
            attributes = data.result;
        } else {
            attributes = [];
        }
    }
    return attributes;
}

// Utility functions
function loadSelectOptions(selectId, options, displayField, includeEmpty = false) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '';

    if (includeEmpty) {
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Không có';
        select.appendChild(emptyOption);
    }

    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.id;
        opt.textContent = option[displayField];
        select.appendChild(opt);
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Load initial page - data will be loaded when needed
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page') || 'dashboard';
    await showPage(page);
});

