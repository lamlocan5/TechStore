// Vouchers Page
let vouchers = [];
let vouchersPagination = {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
};

// RANK_OPTIONS is defined in common.js

const DISCOUNT_TYPE_OPTIONS = [
    { value: 'PERCENT', label: 'Phần trăm (%)' },
    { value: 'AMOUNT', label: 'Số tiền (VNĐ)' }
];

async function loadVouchersPage() {
    vouchersPagination.page = 1;
    await loadVouchers(1, vouchersPagination.limit);
    setupVoucherSearch();
    setupVoucherPagination();
}

async function loadVouchers(page = 1, limit = 20) {
    const data = await fetchVoucherAPI(`?page=${page}&limit=${limit}`);
    if (data?.result) {
        if (data.result && typeof data.result === 'object' && data.result.result) {
            vouchers = data.result.result || [];
            vouchersPagination.total = data.result.total || 0;
            vouchersPagination.totalPages = data.result.totalPages || 1;
        } else if (Array.isArray(data.result)) {
            vouchers = data.result;
            vouchersPagination.total = vouchers.length;
            vouchersPagination.totalPages = 1;
        } else {
            vouchers = [];
            vouchersPagination.total = 0;
            vouchersPagination.totalPages = 0;
        }
        vouchersPagination.page = page;
        vouchersPagination.limit = limit;

        await renderVouchers(vouchers);
        updateVoucherPaginationUI();
    }
}

async function renderVouchers(vouchersToRender) {
    const tbody = document.getElementById('vouchers-table-body');
    if (!tbody) return;

    if (vouchersToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 40px;">Không có dữ liệu</td></tr>';
        return;
    }

    tbody.innerHTML = vouchersToRender.map(voucher => {
        const statusBadge = voucher.status === 1
            ? '<span class="status-badge" style="background: #4caf50; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Hoạt động</span>'
            : '<span class="status-badge" style="background: #999; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">Tắt</span>';

        const discountText = voucher.discountType === 'PERCENT'
            ? `${voucher.discountValue}%${voucher.discountMaxValue ? ` (tối đa ${formatCurrency(voucher.discountMaxValue)})` : ''}`
            : formatCurrency(voucher.discountValue);

        const rankLabel = RANK_OPTIONS.find(r => r.value === voucher.minRankRequired)?.label || voucher.minRankRequired;

        const startDate = voucher.startAt ? new Date(voucher.startAt).toLocaleString('vi-VN') : '-';
        const endDate = voucher.endAt ? new Date(voucher.endAt).toLocaleString('vi-VN') : '-';

        const isValid = voucher.status === 1 &&
            new Date(voucher.startAt) <= new Date() &&
            new Date(voucher.endAt) >= new Date();

        return `
            <tr>
                <td>#${voucher.id}</td>
                <td><strong>${voucher.code || '-'}</strong></td>
                <td>${voucher.name || '-'}</td>
                <td>${discountText}</td>
                <td>${formatCurrency(voucher.minOrderTotal || 0)}</td>
                <td>${rankLabel}</td>
                <td>${voucher.maxUsage || 'Không giới hạn'}</td>
                <td>${voucher.maxPerUser || 'Không giới hạn'}</td>
                <td>
                    ${statusBadge}
                    ${isValid ? '<span style="color: #4caf50; font-size: 11px; margin-left: 5px;">✓ Hiệu lực</span>' : ''}
                </td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewVoucherDetail(${voucher.id})" style="padding: 4px 8px; font-size: 12px; margin-right: 5px;">Chi tiết</button>
                    <button class="btn btn-sm btn-primary" onclick="openVoucherModal(${voucher.id})" style="padding: 4px 8px; font-size: 12px; margin-right: 5px;">Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteVoucher(${voucher.id})" style="padding: 4px 8px; font-size: 12px;">Xóa</button>
                </td>
            </tr>
        `;
    }).join('');
}

function setupVoucherSearch() {
    const searchInput = document.getElementById('voucher-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (!searchTerm) {
            renderVouchers(vouchers);
            return;
        }
        const filtered = vouchers.filter(v =>
            v.code?.toLowerCase().includes(searchTerm) ||
            v.name?.toLowerCase().includes(searchTerm)
        );
        renderVouchers(filtered);
    });
}

function setupVoucherPagination() {
    const paginationDiv = document.getElementById('vouchers-pagination');
    if (!paginationDiv) return;

    paginationDiv.addEventListener('click', async (e) => {
        if (e.target.classList.contains('page-btn')) {
            const page = parseInt(e.target.dataset.page);
            if (page >= 1 && page <= vouchersPagination.totalPages) {
                await loadVouchers(page, vouchersPagination.limit);
            }
        }
    });
}

function updateVoucherPaginationUI() {
    const paginationDiv = document.getElementById('vouchers-pagination');
    if (!paginationDiv) return;

    if (vouchersPagination.totalPages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }

    let html = '<div style="display: flex; gap: 5px; justify-content: center; align-items: center; margin-top: 20px;">';

    // Previous button
    html += `<button class="page-btn" data-page="${vouchersPagination.page - 1}" ${vouchersPagination.page === 1 ? 'disabled' : ''} style="padding: 8px 12px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;">Trước</button>`;

    // Page numbers
    for (let i = 1; i <= vouchersPagination.totalPages; i++) {
        if (i === 1 || i === vouchersPagination.totalPages || (i >= vouchersPagination.page - 1 && i <= vouchersPagination.page + 1)) {
            html += `<button class="page-btn" data-page="${i}" ${i === vouchersPagination.page ? 'style="padding: 8px 12px; border: 1px solid #007bff; background: #007bff; color: white; cursor: pointer; border-radius: 4px;"' : 'style="padding: 8px 12px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;"'}>${i}</button>`;
        } else if (i === vouchersPagination.page - 2 || i === vouchersPagination.page + 2) {
            html += '<span style="padding: 8px;">...</span>';
        }
    }

    // Next button
    html += `<button class="page-btn" data-page="${vouchersPagination.page + 1}" ${vouchersPagination.page === vouchersPagination.totalPages ? 'disabled' : ''} style="padding: 8px 12px; border: 1px solid #ddd; background: white; cursor: pointer; border-radius: 4px;">Sau</button>`;

    html += `</div><div style="text-align: center; margin-top: 10px; color: #666; font-size: 14px;">Trang ${vouchersPagination.page} / ${vouchersPagination.totalPages} (Tổng: ${vouchersPagination.total})</div>`;

    paginationDiv.innerHTML = html;
}

async function openVoucherModal(id = null) {
    const modalTitle = document.getElementById('voucher-modal-title');
    if (modalTitle) {
        modalTitle.textContent = id ? 'Sửa Voucher' : 'Thêm Voucher';
    }

    const voucherId = document.getElementById('voucher-id');
    if (voucherId) {
        voucherId.value = id || '';
    }

    // Load rank options
    const rankSelect = document.getElementById('voucher-min-rank');
    if (rankSelect) {
        rankSelect.innerHTML = RANK_OPTIONS.map(r =>
            `<option value="${r.value}">${r.label}</option>`
        ).join('');
    }

    // Load discount type options
    const discountTypeSelect = document.getElementById('voucher-discount-type');
    if (discountTypeSelect) {
        discountTypeSelect.innerHTML = DISCOUNT_TYPE_OPTIONS.map(d =>
            `<option value="${d.value}">${d.label}</option>`
        ).join('');
    }

    if (id) {
        const voucher = vouchers.find(v => v.id === id);
        if (voucher) {
            document.getElementById('voucher-code').value = voucher.code || '';
            document.getElementById('voucher-name').value = voucher.name || '';
            document.getElementById('voucher-discount-type').value = voucher.discountType || 'PERCENT';
            document.getElementById('voucher-discount-value').value = voucher.discountValue || '';
            document.getElementById('voucher-discount-max-value').value = voucher.discountMaxValue || '';
            document.getElementById('voucher-min-order-total').value = voucher.minOrderTotal || '';
            document.getElementById('voucher-start-at').value = voucher.startAt ? voucher.startAt.substring(0, 16) : '';
            document.getElementById('voucher-end-at').value = voucher.endAt ? voucher.endAt.substring(0, 16) : '';
            document.getElementById('voucher-max-usage').value = voucher.maxUsage || '';
            document.getElementById('voucher-max-per-user').value = voucher.maxPerUser || '';
            document.getElementById('voucher-status').checked = voucher.status === 1;
            document.getElementById('voucher-min-rank').value = voucher.minRankRequired || 'BRONZE';
        }
    } else {
        document.getElementById('voucher-form').reset();
        document.getElementById('voucher-min-rank').value = 'BRONZE';
        document.getElementById('voucher-discount-type').value = 'PERCENT';
    }

    openModal('voucher-modal');
}

async function saveVoucher() {
    const id = document.getElementById('voucher-id').value;
    const form = document.getElementById('voucher-form');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const discountType = document.getElementById('voucher-discount-type').value;
    const discountValue = parseFloat(document.getElementById('voucher-discount-value').value);
    const discountMaxValue = document.getElementById('voucher-discount-max-value').value
        ? parseFloat(document.getElementById('voucher-discount-max-value').value)
        : null;

    if (isNaN(discountValue) || discountValue <= 0) {
        alert('Giá trị giảm giá phải lớn hơn 0');
        return;
    }

    const data = {
        code: document.getElementById('voucher-code').value.trim(),
        name: document.getElementById('voucher-name').value.trim(),
        discountType: discountType,
        discountValue: discountType === 'PERCENT' ? Math.round(discountValue) : Math.round(discountValue),
        discountMaxValue: discountMaxValue ? (discountType === 'PERCENT' ? Math.round(discountMaxValue) : Math.round(discountMaxValue)) : null,
        minOrderTotal: parseFloat(document.getElementById('voucher-min-order-total').value) || 0,
        startAt: document.getElementById('voucher-start-at').value + ':00',
        endAt: document.getElementById('voucher-end-at').value + ':00',
        maxUsage: document.getElementById('voucher-max-usage').value ? parseInt(document.getElementById('voucher-max-usage').value) : null,
        maxPerUser: document.getElementById('voucher-max-per-user').value ? parseInt(document.getElementById('voucher-max-per-user').value) : null,
        status: document.getElementById('voucher-status').checked ? 1 : 0,
        minRankRequired: document.getElementById('voucher-min-rank').value
    };

    let result;
    if (id) {
        result = await fetchVoucherAPI(`/${id}`, {
            method: 'PUT',
            body: data
        });
    } else {
        result = await fetchVoucherAPI('', {
            method: 'POST',
            body: data
        });
    }

    if (result) {
        closeModal('voucher-modal');
        await loadVouchers(vouchersPagination.page, vouchersPagination.limit);
        alert(result.message || 'Lưu voucher thành công');
    }
}

async function deleteVoucher(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa voucher này?')) return;

    const result = await fetchVoucherAPI(`/${id}`, { method: 'DELETE' });
    if (result) {
        await loadVouchers(vouchersPagination.page, vouchersPagination.limit);
        alert(result.message || 'Xóa voucher thành công');
    }
}

async function viewVoucherDetail(id) {
    const voucher = vouchers.find(v => v.id === id);
    if (!voucher) return;

    const rankLabel = RANK_OPTIONS.find(r => r.value === voucher.minRankRequired)?.label || voucher.minRankRequired;
    const discountText = voucher.discountType === 'PERCENT'
        ? `${voucher.discountValue}%${voucher.discountMaxValue ? ` (tối đa ${formatCurrency(voucher.discountMaxValue)})` : ''}`
        : formatCurrency(voucher.discountValue);

    const detailHtml = `
        <div style="padding: 20px;">
            <h3 style="margin-top: 0;">Chi tiết Voucher</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; width: 200px;">ID:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">#${voucher.id}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Mã code:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${voucher.code}</strong></td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Tên:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${voucher.name || '-'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Loại giảm giá:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${voucher.discountType === 'PERCENT' ? 'Phần trăm' : 'Số tiền'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Giá trị giảm:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${discountText}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Đơn tối thiểu:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${formatCurrency(voucher.minOrderTotal || 0)}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Rank yêu cầu:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${rankLabel}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Giới hạn tổng:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${voucher.maxUsage || 'Không giới hạn'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Giới hạn mỗi user:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${voucher.maxPerUser || 'Không giới hạn'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Thời gian bắt đầu:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${voucher.startAt ? new Date(voucher.startAt).toLocaleString('vi-VN') : '-'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Thời gian kết thúc:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${voucher.endAt ? new Date(voucher.endAt).toLocaleString('vi-VN') : '-'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Trạng thái:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${voucher.status === 1 ? 'Hoạt động' : 'Tắt'}</td>
                </tr>
            </table>
        </div>
    `;

    alert(detailHtml.replace(/<[^>]*>/g, '')); // Simple text alert, or you can use a modal
}

async function refreshVouchers() {
    await loadVouchers(vouchersPagination.page, vouchersPagination.limit);
}

// Expose functions to global scope
window.loadVouchersPage = loadVouchersPage;
window.openVoucherModal = openVoucherModal;
window.saveVoucher = saveVoucher;
window.deleteVoucher = deleteVoucher;
window.viewVoucherDetail = viewVoucherDetail;
window.refreshVouchers = refreshVouchers;

