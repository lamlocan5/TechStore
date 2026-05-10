// Revenue Statistics Page
let revenueData = {
    period: 'month',
    year: new Date().getFullYear(),
    month: null,
    initialized: false
};

async function loadRevenuePage() {
    // Always initialize the tab to populate dropdowns
    await initRevenueTab();

    if (!revenueData.initialized) {
        revenueData.initialized = true;
    }
}

async function initRevenueTab() {
    // Populate year select
    const currentYear = new Date().getFullYear();
    const yearSelect = document.getElementById('revenue-year');
    const periodSelect = document.getElementById('revenue-period');

    // Always populate year select
    yearSelect.innerHTML = '';
    for (let year = currentYear - 5; year <= currentYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }

    // Set default year to current year
    if (!revenueData.year) {
        revenueData.year = currentYear;
    }
    yearSelect.value = revenueData.year;

    // Set period select
    if (!revenueData.period) {
        revenueData.period = 'month';
    }
    periodSelect.value = revenueData.period;

    // Populate months
    const monthSelect = document.getElementById('revenue-month');
    monthSelect.innerHTML = '<option value="">Tất cả tháng</option>';
    for (let month = 1; month <= 12; month++) {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = `Tháng ${month}`;
        monthSelect.appendChild(option);
    }

    // Restore month selection if exists
    if (revenueData.month) {
        monthSelect.value = revenueData.month;
    }

    // Update filter visibility
    updateRevenueFilter();

    // Load initial data
    await loadRevenueStatistics();
}

function updateRevenueFilter() {
    const periodSelect = document.getElementById('revenue-period');
    const monthGroup = document.getElementById('month-select-group');
    const monthSelect = document.getElementById('revenue-month');

    if (!periodSelect) return;

    const period = periodSelect.value;
    revenueData.period = period;

    if (monthGroup) {
        if (period === 'month') {
            monthGroup.style.display = 'block';
        } else {
            monthGroup.style.display = 'none';
            if (monthSelect) {
                monthSelect.value = '';
            }
            revenueData.month = null;
        }
    }
}

async function loadRevenueStatistics() {
    try {
        const periodSelect = document.getElementById('revenue-period');
        const yearSelect = document.getElementById('revenue-year');
        const monthSelect = document.getElementById('revenue-month');

        if (!periodSelect || !yearSelect) {
            console.error('Revenue filter elements not found');
            return;
        }

        const period = periodSelect.value;
        let year = yearSelect.value;
        const month = monthSelect ? monthSelect.value : '';

        // Lưu lại selections vào revenueData
        revenueData.period = period;
        revenueData.year = year;
        revenueData.month = month || null;

        // Show loading state
        const revenueTotal = document.getElementById('revenue-total');
        const revenueTableBody = document.getElementById('revenue-table-body');
        const topProductsBody = document.getElementById('top-products-body');

        if (revenueTotal) revenueTotal.textContent = '⏳ Đang tải...';
        if (revenueTableBody) revenueTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Đang tải dữ liệu...</td></tr>';
        if (topProductsBody) topProductsBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Đang tải dữ liệu...</td></tr>';

        // Call API to get revenue stats
        const params = new URLSearchParams({
            period: period,
            year: year,
            ...(month && { month: month })
        });

        const result = await fetchOrderAPI(`/revenue-statistics?${params}`);

        if (result && result.result) {
            displayRevenueStatistics(result.result, period);
        }
    } catch (error) {
        console.error('Error loading revenue statistics:', error);
        alert(`❌ Lỗi: ${error.message}`);

        const revenueTotal = document.getElementById('revenue-total');
        const revenueTableBody = document.getElementById('revenue-table-body');
        const topProductsBody = document.getElementById('top-products-body');

        if (revenueTotal) revenueTotal.textContent = '❌ Lỗi';
        if (revenueTableBody) revenueTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Lỗi tải dữ liệu</td></tr>';
        if (topProductsBody) topProductsBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Lỗi tải dữ liệu</td></tr>';
    }
}

function displayRevenueStatistics(data, period) {
    // Update summary cards
    const totalRevenue = data.totalRevenue || 0;
    const totalOrders = data.totalOrders || 0;
    const totalItems = data.totalItems || 0;
    const avgRevenue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const revenueTotal = document.getElementById('revenue-total');
    const revenueOrders = document.getElementById('revenue-orders');
    const revenueItems = document.getElementById('revenue-items');
    const revenueAvg = document.getElementById('revenue-avg');

    if (revenueTotal) revenueTotal.textContent = formatCurrency(totalRevenue);
    if (revenueOrders) revenueOrders.textContent = totalOrders.toLocaleString('vi-VN');
    if (revenueItems) revenueItems.textContent = totalItems.toLocaleString('vi-VN');
    if (revenueAvg) revenueAvg.textContent = formatCurrency(avgRevenue);

    // Render revenue table
    const revenueTable = document.getElementById('revenue-table-body');
    const revenueDetails = data.details || [];

    if (revenueDetails.length === 0) {
        revenueTable.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Không có dữ liệu</td></tr>';
    } else {
        const periodLabel = {
            'month': 'Tháng',
            'quarter': 'Quý',
            'year': 'Năm'
        };

        revenueTable.innerHTML = revenueDetails.map(item => `
            <tr>
                <td><strong>${periodLabel[period]} ${item.period}</strong></td>
                <td>${formatCurrency(item.revenue)}</td>
                <td>${item.orderCount.toLocaleString('vi-VN')}</td>
                <td>${item.itemCount.toLocaleString('vi-VN')}</td>
                <td>${formatCurrency(item.averageOrderValue)}</td>
            </tr>
        `).join('');
    }

    // Render top products table
    const topProducts = data.topProducts || [];
    const topProductsBody = document.getElementById('top-products-body');

    if (topProducts.length === 0) {
        topProductsBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Không có dữ liệu</td></tr>';
    } else {
        topProductsBody.innerHTML = topProducts.map((product, index) => `
            <tr>
                <td><strong>#${index + 1}</strong></td>
                <td>${product.productName}</td>
                <td>${product.sku}</td>
                <td>${product.quantity.toLocaleString('vi-VN')}</td>
                <td>${formatCurrency(product.revenue)}</td>
                <td>${totalRevenue > 0 ? ((product.revenue / totalRevenue) * 100).toFixed(2) : 0}%</td>
            </tr>
        `).join('');
    }
}

function refreshRevenueStatistics() {
    loadRevenueStatistics();
}

async function exportRevenueStatistics() {
    try {
        const period = document.getElementById('revenue-period').value;
        const year = document.getElementById('revenue-year').value;

        // Get current data to export
        const revenueTable = document.getElementById('revenue-table-body').rows;
        const topProductsTable = document.getElementById('top-products-body').rows;

        let csv = 'CHI TIẾT DOANH THU\n';
        csv += `Loại: ${period === 'month' ? 'Theo tháng' : period === 'quarter' ? 'Theo quý' : 'Theo năm'}\n`;
        csv += `Năm: ${year}\n\n`;

        csv += 'Kỳ,Doanh thu,Số đơn,Số SP bán,TB/đơn\n';
        for (let row of revenueTable) {
            const cells = Array.from(row.cells).map(cell => {
                const text = cell.textContent.trim();
                // Escape quotes in CSV
                return `"${text.replace(/"/g, '""')}"`;
            });
            csv += cells.join(',') + '\n';
        }

        csv += '\n\nSẢN PHẨM BÁN CHẠY NHẤT\n';
        csv += 'Xếp hạng,Sản phẩm,SKU,Số lượng bán,Doanh thu,% tổng doanh thu\n';
        for (let row of topProductsTable) {
            const cells = Array.from(row.cells).map(cell => {
                const text = cell.textContent.trim();
                return `"${text.replace(/"/g, '""')}"`;
            });
            csv += cells.join(',') + '\n';
        }

        // Download
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `thong-ke-doanh-thu-${year}-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert('✅ Xuất dữ liệu thành công');
    } catch (error) {
        console.error('Export error:', error);
        alert(`❌ Lỗi: ${error.message}`);
    }
}

// Expose to window
window.loadRevenuePage = loadRevenuePage;
window.loadRevenueStatistics = loadRevenueStatistics;
window.updateRevenueFilter = updateRevenueFilter;
window.refreshRevenueStatistics = refreshRevenueStatistics;
window.exportRevenueStatistics = exportRevenueStatistics;
