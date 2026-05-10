// Orders Page
let orders = [];
let ordersPagination = {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
};
let orderFilters = {
    search: '',
    status: '',
    paymentStatus: ''
};

async function loadOrdersPage() {
    ordersPagination.page = 1;
    populateStatusFilter();
    await loadOrders(1, ordersPagination.limit);
    setupOrderSearch();
    setupOrderPagination();
}

async function loadOrders(page = 1, limit = 20) {
    let url = `?page=${page}&limit=${limit}`;

    if (orderFilters.status) {
        url += `&status=${orderFilters.status}`;
    }

    const data = await fetchOrderAPI(url);
    if (data?.result) {
        if (data.result && typeof data.result === 'object' && data.result.result) {
            orders = data.result.result || [];
            ordersPagination.total = data.result.total || 0;
            ordersPagination.totalPages = data.result.totalPages || 1;
        } else if (Array.isArray(data.result)) {
            orders = data.result;
            ordersPagination.total = orders.length;
            ordersPagination.totalPages = 1;
        } else {
            orders = [];
            ordersPagination.total = 0;
            ordersPagination.totalPages = 0;
        }
        ordersPagination.page = page;
        ordersPagination.limit = limit;

        // Apply filters
        if (orderFilters.search) {
            orders = orders.filter(order =>
                order.id.toString().includes(orderFilters.search) ||
                order.userId.includes(orderFilters.search)
            );
        }

        if (orderFilters.paymentStatus) {
            orders = orders.filter(order => order.paymentStatus === orderFilters.paymentStatus);
        }

        await renderOrders(orders);
        updateOrderPaginationUI();
    }
}

async function renderOrders(ordersToRender) {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;

    if (ordersToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">Không có dữ liệu</td></tr>';
        return;
    }

    tbody.innerHTML = ordersToRender.map(order => {
        const statusColor = getStatusColor(order.status);
        const paymentStatusText = getPaymentStatusText(order.paymentStatus);
        const itemCount = order.items ? order.items.length : 0;
        const createdDate = order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '-';

        return `
            <tr>
                <td>#${order.id}</td>
                <td>${order.userId || '-'}</td>
                <td>
                    <span class="status-badge" style="background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                        ${order.status || '-'}
                    </span>
                </td>
                <td>${paymentStatusText}</td>
                <td><strong>${formatCurrency(order.total || 0)}</strong></td>
                <td>${itemCount}</td>
                <td>${createdDate}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewOrderDetail(${order.id})" style="padding: 4px 8px; font-size: 12px; margin-right: 5px;">Chi tiết</button>
                    <button class="btn btn-sm btn-primary" onclick="openChangeStatusModal(${order.id}, '${order.status}')" style="padding: 4px 8px; font-size: 12px; margin-right: 5px;">Đổi trạng thái đơn</button>
                    <button class="btn btn-sm btn-info" onclick="openChangePaymentStatusModal(${order.id}, '${order.paymentStatus}')" style="padding: 4px 8px; font-size: 12px; margin-right: 5px; background: #17a2b8; border-color: #17a2b8; color: white;">Đổi trạng thái thanh toán</button>
                    ${order.status !== 'CANCELLED' && order.status !== 'COMPLETED' ?
                `<button class="btn btn-sm btn-danger" onclick="cancelOrder(${order.id})" style="padding: 4px 8px; font-size: 12px;">Hủy</button>` :
                '<span style="color: #999; font-size: 12px;">-</span>'
            }
                </td>
            </tr>
        `;
    }).join('');
}

function getStatusColor(status) {
    const statusMap = {
        'PENDING': '#ff9800',
        'PAID': '#2196f3',
        'SHIPPING': '#9c27b0',
        'COMPLETED': '#4caf50',
        'CANCELLED': '#f44336'
    };
    // Try to find color from orderStatuses array
    const statusEntity = orderStatuses.find(s => s.code === status);
    return statusEntity?.color || statusMap[status] || '#666';
}

function getPaymentStatusText(paymentStatus) {
    const statusMap = {
        'UNPAID': 'Chưa thanh toán',
        'PAID': 'Đã thanh toán',
        'REFUNDED': 'Đã hoàn tiền'
    };
    return statusMap[paymentStatus] || paymentStatus || '-';
}

async function viewOrderDetail(orderId) {
    const data = await fetchOrderAPI(`/${orderId}`);
    if (data?.result) {
        const order = data.result;
        const orderDetailIdElement = document.getElementById('order-detail-id');
        if (!orderDetailIdElement) {
            console.error('order-detail-id element not found');
            return;
        }
        orderDetailIdElement.textContent = order.id;

        const statusColor = getStatusColor(order.status);
        const totalItems = order.items ? order.items.length : 0;
        const totalQuantity = order.items ? order.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;

        const itemsHtml = order.items && order.items.length > 0 ? order.items.map((item, index) => `
            <tr>
                <td style="text-align: center; font-weight: bold;">${index + 1}</td>
                <td>
                    <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${item.productName || '-'}</div>
                    ${item.attributesName ? `<div style="color: #666; font-size: 13px; margin-top: 4px;">
                        <span style="background: #f0f0f0; padding: 2px 8px; border-radius: 4px; display: inline-block;">${item.attributesName}</span>
                    </div>` : ''}
                    <div style="color: #999; font-size: 12px; margin-top: 4px;">
                        <span>ID: ${item.productId || '-'}</span>
                        ${item.variantId ? ` | Variant: ${item.variantId}` : ''}
                    </div>
                </td>
                <td>
                    <code style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${item.sku || '-'}</code>
                </td>
                <td style="text-align: center; font-weight: 600;">${item.quantity || 0}</td>
                <td style="text-align: right;">${formatCurrency(item.price || 0)}</td>
                <td style="text-align: right; font-weight: 600; color: #4caf50;">${formatCurrency(item.total || 0)}</td>
            </tr>
        `).join('') : '<tr><td colspan="6" style="text-align: center; padding: 40px;">Không có sản phẩm</td></tr>';

        document.getElementById('order-detail-content').innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
                    <h4 style="margin-top: 0; margin-bottom: 15px; color: #333;">Thông tin đơn hàng</h4>
                    <div style="display: grid; gap: 10px;">
                        <div><strong>User ID:</strong> <span style="font-family: monospace;">${order.userId || '-'}</span></div>
                        <div>
                            <strong>Trạng thái:</strong> 
                            <span class="status-badge" style="background: ${statusColor}; color: white; padding: 4px 10px; border-radius: 4px; font-size: 13px; margin-left: 8px;">
                                ${order.status || '-'}
                            </span>
                        </div>
                        <div><strong>Thanh toán:</strong> ${getPaymentStatusText(order.paymentStatus)}</div>
                        <div><strong>Phương thức:</strong> ${order.paymentMethod || '-'}</div>
                        <div><strong>Ngày tạo:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '-'}</div>
                        ${order.note ? `<div><strong>Ghi chú:</strong> <span style="color: #666;">${order.note}</span></div>` : ''}
                    </div>
                </div>
                <div style="background: #f0f7ff; padding: 15px; border-radius: 8px;">
                    <h4 style="margin-top: 0; margin-bottom: 15px; color: #333;">Tổng tiền</h4>
                    <div style="display: grid; gap: 10px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>Tạm tính:</span>
                            <strong>${formatCurrency(order.subtotal || 0)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Giảm giá:</span>
                            <strong style="color: #f44336;">-${formatCurrency(order.discount || 0)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Phí vận chuyển:</span>
                            <strong>${formatCurrency(order.shippingFee || 0)}</strong>
                        </div>
                        <div style="border-top: 2px solid #2196f3; padding-top: 10px; margin-top: 5px; display: flex; justify-content: space-between;">
                            <span style="font-size: 16px; font-weight: 600;">Tổng cộng:</span>
                            <strong style="font-size: 20px; color: #2196f3;">${formatCurrency(order.total || 0)}</strong>
                        </div>
                    </div>
                </div>
            </div>
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h4 style="margin: 0; color: #333;">Danh sách sản phẩm</h4>
                    <div style="background: #e3f2fd; padding: 8px 15px; border-radius: 6px; font-size: 14px; color: #1976d2;">
                        <strong>${totalItems}</strong> sản phẩm | <strong>${totalQuantity}</strong> đơn vị
                    </div>
                </div>
                <div style="overflow-x: auto;">
                    <table class="data-table" style="width: 100%; margin-top: 10px;">
                        <thead>
                            <tr style="background: #f5f5f5;">
                                <th style="text-align: center; width: 50px;">STT</th>
                                <th style="min-width: 250px;">Tên sản phẩm</th>
                                <th style="min-width: 120px;">SKU</th>
                                <th style="text-align: center; width: 100px;">Số lượng</th>
                                <th style="text-align: right; width: 130px;">Đơn giá</th>
                                <th style="text-align: right; width: 130px;">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                        <tfoot style="background: #f9f9f9; font-weight: 600;">
                            <tr>
                                <td colspan="4" style="text-align: right; padding: 12px;">
                                    <strong>Tổng cộng:</strong>
                                </td>
                                <td colspan="2" style="text-align: right; padding: 12px; color: #2196f3; font-size: 16px;">
                                    ${formatCurrency(order.subtotal || 0)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
        openModal('order-detail-modal');
    }
}

async function openChangeStatusModal(orderId, currentStatus) {
    const orderIdInput = document.getElementById('change-status-order-id');
    const currentStatusInput = document.getElementById('current-status');
    const statusSelect = document.getElementById('new-status');
    const hintEl = document.getElementById('status-transition-hint');

    if (!orderIdInput || !currentStatusInput || !statusSelect) {
        console.error('Change status modal elements not found');
        return;
    }

    orderIdInput.value = orderId;
    currentStatusInput.value = currentStatus;

    // Load allowed transitions only
    const allowed = allowedStatusTransitions[currentStatus] || [];
    statusSelect.innerHTML = '';

    if (allowed.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Không thể đổi trạng thái từ đây';
        statusSelect.appendChild(option);
        statusSelect.disabled = true;
    } else {
        statusSelect.disabled = false;
        statusSelect.innerHTML = '<option value="">Chọn trạng thái...</option>';
        allowed.forEach(code => {
            const status = orderStatuses.find(s => s.code === code);
            const option = document.createElement('option');
            option.value = code;
            option.textContent = status?.name || code;
            statusSelect.appendChild(option);
        });
    }

    if (hintEl) {
        hintEl.textContent = allowed.length
            ? 'Lộ trình: PENDING → PAID → SHIPPING → COMPLETED, hoặc CANCELLED ở mỗi bước.'
            : 'Không có bước chuyển hợp lệ từ trạng thái hiện tại.';
    }

    openModal('change-status-modal');
}

async function saveStatusChange() {
    const orderIdElement = document.getElementById('change-status-order-id');
    const newStatusElement = document.getElementById('new-status');

    if (!orderIdElement || !newStatusElement) {
        console.error('Change status modal elements not found');
        return;
    }

    const orderId = orderIdElement.value;
    const newStatus = newStatusElement.value;

    if (!newStatus) {
        alert('Vui lòng chọn trạng thái mới');
        return;
    }

    try {
        const data = await fetchOrderAPI(`/${orderId}/status?status=${newStatus}`, {
            method: 'PUT'
        });

        if (data?.result) {
            alert('Cập nhật trạng thái đơn hàng thành công');
            closeModal('change-status-modal');
            await loadOrders(ordersPagination.page, ordersPagination.limit);
        } else {
            alert(data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Có lỗi xảy ra: ' + error.message);
    }
}

async function openChangePaymentStatusModal(orderId, currentPaymentStatus) {
    const orderIdInput = document.getElementById('change-payment-status-order-id');
    const currentPaymentStatusInput = document.getElementById('current-payment-status');
    const paymentStatusSelect = document.getElementById('new-payment-status');

    if (!orderIdInput || !currentPaymentStatusInput || !paymentStatusSelect) {
        console.error('Change payment status modal elements not found');
        return;
    }

    orderIdInput.value = orderId;
    currentPaymentStatusInput.value = getPaymentStatusText(currentPaymentStatus);

    // Set current payment status as selected
    paymentStatusSelect.value = ''; // Reset selection

    openModal('change-payment-status-modal');
}

async function savePaymentStatusChange() {
    const orderIdElement = document.getElementById('change-payment-status-order-id');
    const newPaymentStatusElement = document.getElementById('new-payment-status');

    if (!orderIdElement || !newPaymentStatusElement) {
        console.error('Change payment status modal elements not found');
        return;
    }

    const orderId = orderIdElement.value;
    const newPaymentStatus = newPaymentStatusElement.value;

    if (!newPaymentStatus) {
        alert('Vui lòng chọn trạng thái thanh toán mới');
        return;
    }

    try {
        const data = await fetchOrderAPI(`/${orderId}/payment-status?status=${newPaymentStatus}`, {
            method: 'PUT'
        });

        if (data?.result) {
            alert('Cập nhật trạng thái thanh toán thành công');
            closeModal('change-payment-status-modal');
            await loadOrders(ordersPagination.page, ordersPagination.limit);
        } else {
            alert('Có lỗi xảy ra khi cập nhật trạng thái thanh toán');
        }
    } catch (error) {
        console.error('Error updating payment status:', error);
        alert('Có lỗi xảy ra: ' + error.message);
    }
}

async function cancelOrder(orderId) {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
        return;
    }

    try {
        const data = await fetchOrderAPI(`/${orderId}`, {
            method: 'DELETE'
        });

        if (data) {
            alert('Hủy đơn hàng thành công');
            await loadOrders(ordersPagination.page, ordersPagination.limit);
        } else {
            alert('Có lỗi xảy ra khi hủy đơn hàng');
        }
    } catch (error) {
        console.error('Error cancelling order:', error);
        alert('Có lỗi xảy ra: ' + error.message);
    }
}

function applyOrderFilters() {
    orderFilters.search = document.getElementById('order-search')?.value || '';
    orderFilters.status = document.getElementById('order-status-filter')?.value || '';
    orderFilters.paymentStatus = document.getElementById('order-payment-status-filter')?.value || '';

    ordersPagination.page = 1;
    loadOrders(1, ordersPagination.limit);
}

async function refreshOrders() {
    orderFilters = {
        search: '',
        status: '',
        paymentStatus: ''
    };
    const searchInput = document.getElementById('order-search');
    const statusFilter = document.getElementById('order-status-filter');
    const paymentStatusFilter = document.getElementById('order-payment-status-filter');

    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    if (paymentStatusFilter) paymentStatusFilter.value = '';

    await loadOrders(1, ordersPagination.limit);
}

function setupOrderSearch() {
    const searchInput = document.getElementById('order-search');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                orderFilters.search = e.target.value;
                applyOrderFilters();
            }, 500);
        });
    }
}

function setupOrderPagination() {
    // Pagination is handled in renderOrders
}

function updateOrderPaginationUI() {
    const container = document.getElementById('orders-pagination');
    if (!container) return;

    const totalPages = ordersPagination.totalPages;
    const page = ordersPagination.page;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="color: #666; font-size: 14px;">
                Trang ${page} / ${totalPages} (${ordersPagination.total} đơn hàng)
            </div>
            <div style="display: flex; gap: 5px;">
                <button class="btn btn-secondary" 
                        onclick="changeOrderPage(${page - 1})" 
                        ${page <= 1 ? 'disabled' : ''}
                        style="padding: 6px 12px; font-size: 12px;">
                    ‹ Trước
                </button>
                <button class="btn btn-secondary" 
                        onclick="changeOrderPage(${page + 1})" 
                        ${page >= totalPages ? 'disabled' : ''}
                        style="padding: 6px 12px; font-size: 12px;">
                    Sau ›
                </button>
            </div>
        </div>
    `;
}

async function changeOrderPage(newPage) {
    if (newPage < 1 || newPage > ordersPagination.totalPages) return;
    await loadOrders(newPage, ordersPagination.limit);
}

// Hardcoded order statuses for filter and status change modal
const orderStatuses = [
    { code: 'PENDING', name: 'Đang chờ', color: '#ff9800' },
    { code: 'PAID', name: 'Đã thanh toán', color: '#2196f3' },
    { code: 'SHIPPING', name: 'Đang giao hàng', color: '#9c27b0' },
    { code: 'COMPLETED', name: 'Hoàn thành', color: '#4caf50' },
    { code: 'CANCELLED', name: 'Đã hủy', color: '#f44336' }
];

// Chỉ cho phép lộ trình hợp lệ, khớp BE: PENDING -> PAID -> SHIPPING -> COMPLETED hoặc CANCELLED ở mỗi bước
const allowedStatusTransitions = {
    PENDING: ['PAID', 'CANCELLED'],
    PAID: ['SHIPPING', 'CANCELLED'],
    SHIPPING: ['COMPLETED', 'CANCELLED'],
};

function populateStatusFilter() {
    const select = document.getElementById('order-status-filter');
    if (!select) return;

    select.innerHTML = '<option value="">Tất cả</option>';
    orderStatuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status.code;
        option.textContent = status.name;
        select.appendChild(option);
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Expose to window
window.loadOrdersPage = loadOrdersPage;
window.viewOrderDetail = viewOrderDetail;
window.openChangeStatusModal = openChangeStatusModal;
window.saveStatusChange = saveStatusChange;
window.openChangePaymentStatusModal = openChangePaymentStatusModal;
window.savePaymentStatusChange = savePaymentStatusChange;
window.cancelOrder = cancelOrder;
window.applyOrderFilters = applyOrderFilters;
window.refreshOrders = refreshOrders;
window.changeOrderPage = changeOrderPage;

