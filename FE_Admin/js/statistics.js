// Statistics Page
let statisticsData = {
    variants: [], // Only current page variants
    variantsCache: new Map(), // Cache variants by page
    productsCache: new Map(), // Cache products by id
    brandsCache: new Map(), // Cache brands by id
    soldData: {}, // { variantId: quantity }
    filters: {
        search: '',
        categoryId: '',
        brandId: '',
        stockStatus: '',
        dateFrom: '',
        dateTo: '',
        sortBy: 'stock-desc'
    },
    pagination: {
        stock: { page: 1, limit: 12, total: 0 },
        sold: { page: 1, limit: 12, total: 0 }
    },
    currentTab: 'stock',
    totalVariants: 0, // Total count from server
    initialized: false // Track if page has been loaded
};

async function loadStatisticsPage() {
    // Load categories and brands for filters (only if not already loaded)
    if (categories.length === 0) {
        await loadCategories();
    }
    if (brands.length === 0) {
        await loadBrands();
    }

    // Populate filter dropdowns (only once)
    if (!statisticsData.initialized) {
        populateFilterDropdowns();
        statisticsData.initialized = true;
    }

    // Always load data when page is opened
    await loadAllStatisticsData();

    // Render current tab
    renderCurrentTab();
}

function populateFilterDropdowns() {
    // Categories
    const categorySelect = document.getElementById('stat-category');
    if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Tất cả</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            categorySelect.appendChild(option);
        });
    }

    // Brands
    const brandSelect = document.getElementById('stat-brand');
    if (brandSelect) {
        brandSelect.innerHTML = '<option value="">Tất cả</option>';
        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand.id;
            option.textContent = brand.name;
            brandSelect.appendChild(option);
        });
    }
}

async function loadAllStatisticsData() {
    // Load sold data from orders (only once, doesn't change often)
    await loadSoldData();

    // Load current page variants
    await loadVariantsPage(statisticsData.pagination[statisticsData.currentTab].page);

    // Update summary (will need to be calculated differently)
    updateSummary();
}

async function loadVariantsPage(page) {
    try {
        // Check cache first
        const cacheKey = `${page}_${statisticsData.pagination[statisticsData.currentTab].limit}`;
        if (statisticsData.variantsCache.has(cacheKey)) {
            statisticsData.variants = statisticsData.variantsCache.get(cacheKey);
            renderCurrentTab();
            return;
        }

        const limit = statisticsData.pagination[statisticsData.currentTab].limit;
        const res = await fetchAPI(`/variants?page=${page}&limit=${limit}`);

        if (res?.result) {
            let variants = [];
            if (res.result && typeof res.result === 'object' && res.result.result) {
                variants = res.result.result || [];
                statisticsData.pagination[statisticsData.currentTab].total = res.result.total || 0;
                statisticsData.totalVariants = res.result.total || 0;
            } else if (Array.isArray(res.result)) {
                variants = res.result;
                statisticsData.pagination[statisticsData.currentTab].total = variants.length;
            } else {
                variants = [];
            }

            // Product info đã có sẵn trong variant response rồi, không cần gọi thêm API!
            // Chỉ cần format lại cho đúng structure nếu cần
            variants.forEach(variant => {
                if (variant.product) {
                    // Variant đã có product info với brand name từ backend
                    // Cache lại để filter và search hoạt động
                    if (!statisticsData.productsCache.has(variant.productId)) {
                        statisticsData.productsCache.set(variant.productId, {
                            id: variant.product.id,
                            name: variant.product.name,
                            brandId: variant.product.brandId,
                            brand: variant.product.brandName ? {
                                id: variant.product.brandId,
                                name: variant.product.brandName
                            } : null
                        });
                    }

                    // Format product để component khác có thể dùng
                    if (variant.product.brandName) {
                        variant.product.brand = {
                            id: variant.product.brandId,
                            name: variant.product.brandName
                        };
                    }
                }
            });

            // Cache this page
            statisticsData.variantsCache.set(cacheKey, variants);
            statisticsData.variants = variants;
        } else {
            statisticsData.variants = [];
        }
    } catch (error) {
        console.error('Error loading variants page:', error);
        statisticsData.variants = [];
    }
}

async function loadSoldData() {
    try {
        // Use optimized API endpoint to get sold data grouped by variantId
        const res = await fetchOrderAPI('/statistics/variant-sold');

        if (res?.result?.soldData) {
            // Convert the map to the format we need
            statisticsData.soldData = res.result.soldData;
        } else {
            statisticsData.soldData = {};
        }
    } catch (error) {
        console.error('Error loading sold data:', error);
        statisticsData.soldData = {};
    }
}

function updateSummary() {
    // For summary, we can only calculate from current page variants
    // Or we could make a separate API call for summary stats
    // For now, calculate from current page (note: this is approximate)
    const variants = statisticsData.variants;
    let totalStock = 0;
    let totalSold = 0;

    variants.forEach(variant => {
        totalStock += variant.stock || 0;
        totalSold += statisticsData.soldData[variant.id] || 0;
    });

    const uniqueProducts = new Set(variants.map(v => v.productId));

    const summaryTotalStock = document.getElementById('summary-total-stock');
    const summaryTotalSold = document.getElementById('summary-total-sold');
    const summaryTotalProducts = document.getElementById('summary-total-products');
    const summaryTotalVariants = document.getElementById('summary-total-variants');

    if (summaryTotalStock) summaryTotalStock.textContent = totalStock.toLocaleString('vi-VN');
    if (summaryTotalSold) summaryTotalSold.textContent = Object.values(statisticsData.soldData).reduce((sum, qty) => sum + qty, 0).toLocaleString('vi-VN');
    if (summaryTotalProducts) summaryTotalProducts.textContent = uniqueProducts.size.toLocaleString('vi-VN');
    if (summaryTotalVariants) summaryTotalVariants.textContent = statisticsData.totalVariants.toLocaleString('vi-VN');
}

function getFilteredVariants() {
    let filtered = [...statisticsData.variants];
    const filters = statisticsData.filters;

    // Note: Stock = 0 variants are already filtered at API level

    // Search filter
    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(v => {
            const productName = v.product?.name || '';
            const sku = v.sku || '';
            return productName.toLowerCase().includes(searchLower) ||
                sku.toLowerCase().includes(searchLower);
        });
    }

    // Category filter
    if (filters.categoryId) {
        filtered = filtered.filter(v => {
            const product = v.product;
            if (!product) return false;
            const categoryIds = product.categoryIds || [];
            return categoryIds.includes(Number(filters.categoryId));
        });
    }

    // Brand filter
    if (filters.brandId) {
        filtered = filtered.filter(v => {
            const product = v.product;
            return product && product.brandId === Number(filters.brandId);
        });
    }

    // Stock status filter
    if (filters.stockStatus) {
        filtered = filtered.filter(v => {
            const stock = v.stock || 0;
            switch (filters.stockStatus) {
                case 'in-stock':
                    return stock > 10;
                case 'low-stock':
                    return stock > 0 && stock <= 10;
                case 'out-of-stock':
                    return stock === 0;
                default:
                    return true;
            }
        });
    }

    // Sort
    filtered.sort((a, b) => {
        const sortBy = filters.sortBy;
        switch (sortBy) {
            case 'stock-desc':
                return (b.stock || 0) - (a.stock || 0);
            case 'stock-asc':
                return (a.stock || 0) - (b.stock || 0);
            case 'sold-desc':
                return (statisticsData.soldData[b.id] || 0) - (statisticsData.soldData[a.id] || 0);
            case 'sold-asc':
                return (statisticsData.soldData[a.id] || 0) - (statisticsData.soldData[b.id] || 0);
            case 'name-asc':
                const nameA = (a.product?.name || '').toLowerCase();
                const nameB = (b.product?.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            case 'name-desc':
                const nameA2 = (a.product?.name || '').toLowerCase();
                const nameB2 = (b.product?.name || '').toLowerCase();
                return nameB2.localeCompare(nameA2);
            default:
                return 0;
        }
    });

    return filtered;
}

function renderCurrentTab() {
    if (statisticsData.currentTab === 'stock') {
        renderStockTab();
    } else {
        renderSoldTab();
    }
}

function renderStockTab() {
    // Apply filters to current page variants only
    const filtered = getFilteredVariants();
    const pagination = statisticsData.pagination.stock;

    // Note: Since we're loading by page, filtering is done on current page only
    // For full filtering, we'd need server-side filtering
    const paginated = filtered;

    const tbody = document.getElementById('stock-table-body');
    if (!tbody) return;

    if (paginated.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px;">Không có dữ liệu</td></tr>';
    } else {
        tbody.innerHTML = paginated.map(variant => {
            const product = variant.product || {};
            const sold = statisticsData.soldData[variant.id] || 0;
            const stock = variant.stock || 0;
            const price = variant.priceSale || 0;
            const stockValue = stock * price;
            const stockStatus = getStockStatus(stock);

            const variantInfo = [];
            if (variant.color) variantInfo.push(`Màu: ${variant.color}`);
            if (variant.ramGb) variantInfo.push(`RAM: ${variant.ramGb}GB`);
            if (variant.storageGb) variantInfo.push(`SSD: ${variant.storageGb}GB`);

            return `
                <tr>
                    <td>${variant.id}</td>
                    <td>
                        <strong>${product.name || '-'}</strong>
                        ${product.brand ? `<div style="font-size: 11px; color: #666;">${product.brand.name || ''}</div>` : ''}
                    </td>
                    <td>${variant.sku || '-'}</td>
                    <td>
                        ${variantInfo.length > 0 ? variantInfo.join('<br>') : '-'}
                    </td>
                    <td><strong style="color: ${stockStatus.color};">${stock.toLocaleString('vi-VN')}</strong></td>
                    <td>${sold.toLocaleString('vi-VN')}</td>
                    <td>${price > 0 ? formatCurrency(price) : '-'}</td>
                    <td>${stockValue > 0 ? formatCurrency(stockValue) : '-'}</td>
                    <td>
                        <span class="status-badge ${stockStatus.class}" style="padding: 4px 8px; font-size: 11px;">
                            ${stockStatus.text}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    const stockDisplayCount = document.getElementById('stock-display-count');
    const stockTotalCount = document.getElementById('stock-total-count');

    if (stockDisplayCount) stockDisplayCount.textContent = paginated.length;
    if (stockTotalCount) stockTotalCount.textContent = pagination.total;

    renderPagination('stock', pagination);
}

function renderSoldTab() {
    // Apply filters to current page variants only
    const filtered = getFilteredVariants();
    const pagination = statisticsData.pagination.sold;

    // Filter variants that have been sold (from current page)
    const soldVariants = filtered.filter(v => (statisticsData.soldData[v.id] || 0) > 0);
    const paginated = soldVariants;

    const tbody = document.getElementById('sold-table-body');
    if (!tbody) return;

    if (paginated.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px;">Không có dữ liệu</td></tr>';
    } else {
        tbody.innerHTML = paginated.map(variant => {
            const product = variant.product || {};
            const sold = statisticsData.soldData[variant.id] || 0;
            const stock = variant.stock || 0;
            const price = variant.priceSale || 0;
            const revenue = sold * price;
            const total = stock + sold;
            const sellRate = total > 0 ? ((sold / total) * 100).toFixed(1) : 0;

            const variantInfo = [];
            if (variant.color) variantInfo.push(`Màu: ${variant.color}`);
            if (variant.ramGb) variantInfo.push(`RAM: ${variant.ramGb}GB`);
            if (variant.storageGb) variantInfo.push(`SSD: ${variant.storageGb}GB`);

            return `
                <tr>
                    <td>${variant.id}</td>
                    <td>
                        <strong>${product.name || '-'}</strong>
                        ${product.brand ? `<div style="font-size: 11px; color: #666;">${product.brand.name || ''}</div>` : ''}
                    </td>
                    <td>${variant.sku || '-'}</td>
                    <td>
                        ${variantInfo.length > 0 ? variantInfo.join('<br>') : '-'}
                    </td>
                    <td><strong style="color: #f5576c;">${sold.toLocaleString('vi-VN')}</strong></td>
                    <td>${stock.toLocaleString('vi-VN')}</td>
                    <td>${price > 0 ? formatCurrency(price) : '-'}</td>
                    <td><strong style="color: #4facfe;">${revenue > 0 ? formatCurrency(revenue) : '-'}</strong></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <div style="flex: 1; background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden;">
                                <div style="background: #4facfe; height: 100%; width: ${sellRate}%;"></div>
                            </div>
                            <span style="font-size: 11px; color: #666; min-width: 40px;">${sellRate}%</span>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    const soldDisplayCount = document.getElementById('sold-display-count');
    const soldTotalCount = document.getElementById('sold-total-count');

    if (soldDisplayCount) soldDisplayCount.textContent = paginated.length;
    // For sold tab, we can't know total without loading all, so show current page count
    if (soldTotalCount) soldTotalCount.textContent = paginated.length;

    renderPagination('sold', pagination);
}

function getStockStatus(stock) {
    if (stock === 0) {
        return { text: 'Hết hàng', class: 'inactive', color: '#f44336' };
    } else if (stock <= 10) {
        return { text: 'Sắp hết', class: 'warning', color: '#ff9800' };
    } else {
        return { text: 'Còn hàng', class: 'active', color: '#4caf50' };
    }
}

function renderPagination(type, pagination) {
    const container = document.getElementById(`${type}-pagination`);
    if (!container) return;

    const totalPages = Math.ceil(pagination.total / pagination.limit);
    const page = pagination.page;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="color: #666; font-size: 14px;">
                Trang ${page} / ${totalPages} (${pagination.total} mục)
            </div>
            <div style="display: flex; gap: 5px;">
                <button class="btn btn-secondary" 
                        onclick="changeStatisticsPage('${type}', ${page - 1})" 
                        ${page <= 1 ? 'disabled' : ''}
                        style="padding: 6px 12px; font-size: 12px;">
                    ‹ Trước
                </button>
                <button class="btn btn-secondary" 
                        onclick="changeStatisticsPage('${type}', ${page + 1})" 
                        ${page >= totalPages ? 'disabled' : ''}
                        style="padding: 6px 12px; font-size: 12px;">
                    Sau ›
                </button>
            </div>
        </div>
    `;
}

async function changeStatisticsPage(type, newPage) {
    const pagination = statisticsData.pagination[type];
    const totalPages = Math.ceil(pagination.total / pagination.limit);

    if (newPage < 1 || newPage > totalPages) return;

    pagination.page = newPage;

    // Load new page data
    await loadVariantsPage(newPage);

    // Render after data is loaded
    renderCurrentTab();
}

async function switchTab(tab) {
    statisticsData.currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    const activeContent = document.getElementById(`content-${tab}`);
    activeContent.classList.add('active');
    activeContent.style.display = 'block';

    // Initialize revenue tab if switching to it
    if (tab === 'revenue') {
        await initRevenueTab();
    }
    activeContent.style.display = 'block';

    // Reset pagination for new tab
    statisticsData.pagination[tab].page = 1;

    // Load first page of new tab
    await loadVariantsPage(1);

    // Render
    renderCurrentTab();
}

async function applyFilters() {
    // Get filter values
    statisticsData.filters.search = document.getElementById('stat-search')?.value || '';
    statisticsData.filters.categoryId = document.getElementById('stat-category')?.value || '';
    statisticsData.filters.brandId = document.getElementById('stat-brand')?.value || '';
    statisticsData.filters.stockStatus = document.getElementById('stat-stock-status')?.value || '';
    statisticsData.filters.dateFrom = document.getElementById('stat-date-from')?.value || '';
    statisticsData.filters.dateTo = document.getElementById('stat-date-to')?.value || '';
    statisticsData.filters.sortBy = document.getElementById('stat-sort-by')?.value || 'stock-desc';

    // Clear cache when filters change (since filtered results may differ)
    statisticsData.variantsCache.clear();

    // Reset to page 1
    statisticsData.pagination[statisticsData.currentTab].page = 1;

    // Reload sold data if date filters changed
    if (statisticsData.filters.dateFrom || statisticsData.filters.dateTo) {
        await loadSoldData();
    }

    // Reload current page with filters
    await loadVariantsPage(1);
    updateSummary();
    renderCurrentTab();
}

async function refreshStatistics() {
    // Reset filters
    document.getElementById('stat-search').value = '';
    document.getElementById('stat-category').value = '';
    document.getElementById('stat-brand').value = '';
    document.getElementById('stat-stock-status').value = '';
    document.getElementById('stat-date-from').value = '';
    document.getElementById('stat-date-to').value = '';
    document.getElementById('stat-sort-by').value = 'stock-desc';

    statisticsData.filters = {
        search: '',
        categoryId: '',
        brandId: '',
        stockStatus: '',
        dateFrom: '',
        dateTo: '',
        sortBy: 'stock-desc'
    };

    // Clear cache
    statisticsData.variantsCache.clear();
    statisticsData.productsCache.clear();
    statisticsData.brandsCache.clear();

    // Reset pagination
    statisticsData.pagination.stock.page = 1;
    statisticsData.pagination.sold.page = 1;

    // Reload data
    await loadAllStatisticsData();
    renderCurrentTab();
}

function exportStatistics() {
    const filtered = getFilteredVariants();
    const currentTab = statisticsData.currentTab;

    // Create CSV content
    let csv = '';

    if (currentTab === 'stock') {
        csv = 'ID,Sản phẩm,SKU,Biến thể,Tồn kho,Đã bán,Giá bán,Giá trị tồn kho,Trạng thái\n';
        filtered.forEach(variant => {
            const product = variant.product || {};
            const sold = statisticsData.soldData[variant.id] || 0;
            const stock = variant.stock || 0;
            const price = variant.priceSale || 0;
            const stockValue = stock * price;
            const stockStatus = getStockStatus(stock);

            const variantInfo = [];
            if (variant.color) variantInfo.push(`Màu: ${variant.color}`);
            if (variant.ramGb) variantInfo.push(`RAM: ${variant.ramGb}GB`);
            if (variant.storageGb) variantInfo.push(`SSD: ${variant.storageGb}GB`);

            csv += `${variant.id},"${product.name || '-'}","${variant.sku || '-'}","${variantInfo.join(', ')}",${stock},${sold},${price},${stockValue},"${stockStatus.text}"\n`;
        });
    } else {
        csv = 'ID,Sản phẩm,SKU,Biến thể,Đã bán,Tồn kho,Giá bán,Doanh thu,Tỷ lệ bán (%)\n';
        const soldVariants = filtered.filter(v => (statisticsData.soldData[v.id] || 0) > 0);
        soldVariants.forEach(variant => {
            const product = variant.product || {};
            const sold = statisticsData.soldData[variant.id] || 0;
            const stock = variant.stock || 0;
            const price = variant.priceSale || 0;
            const revenue = sold * price;
            const total = stock + sold;
            const sellRate = total > 0 ? ((sold / total) * 100).toFixed(1) : 0;

            const variantInfo = [];
            if (variant.color) variantInfo.push(`Màu: ${variant.color}`);
            if (variant.ramGb) variantInfo.push(`RAM: ${variant.ramGb}GB`);
            if (variant.storageGb) variantInfo.push(`SSD: ${variant.storageGb}GB`);

            csv += `${variant.id},"${product.name || '-'}","${variant.sku || '-'}","${variantInfo.join(', ')}",${sold},${stock},${price},${revenue},${sellRate}\n`;
        });
    }

    // Download CSV
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `thong-ke-${currentTab}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Revenue Statistics
async function initRevenueTab() {
    // Populate year select
    const currentYear = new Date().getFullYear();
    const yearSelect = document.getElementById('revenue-year');

    yearSelect.innerHTML = '<option value="">Chọn năm</option>';
    for (let year = currentYear - 5; year <= currentYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
    yearSelect.value = currentYear;

    // Populate months
    const monthSelect = document.getElementById('revenue-month');
    monthSelect.innerHTML = '<option value="">Tất cả tháng</option>';
    for (let month = 1; month <= 12; month++) {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = `Tháng ${month}`;
        monthSelect.appendChild(option);
    }

    // Hide/show month select based on period
    updateRevenueFilter();

    // Load initial data
    await loadRevenueStatistics();
}

function updateRevenueFilter() {
    const period = document.getElementById('revenue-period').value;
    const monthGroup = document.getElementById('month-select-group');
    const monthSelect = document.getElementById('revenue-month');

    if (period === 'month') {
        monthGroup.style.display = 'block';
    } else {
        monthGroup.style.display = 'none';
        monthSelect.value = '';
    }
}

async function loadRevenueStatistics() {
    try {
        const period = document.getElementById('revenue-period').value;
        const year = document.getElementById('revenue-year').value;
        const month = document.getElementById('revenue-month').value;

        if (!year) {
            alert('Vui lòng chọn năm');
            return;
        }

        // Call API to get revenue stats
        const params = new URLSearchParams({
            period: period,
            year: year,
            ...(month && { month: month })
        });

        const result = await fetchAPI(`/orders/revenue-statistics?${params}`);

        if (result && result.result) {
            displayRevenueStatistics(result.result, period);
        }
    } catch (error) {
        console.error('Error loading revenue statistics:', error);
        alert(`❌ Lỗi: ${error.message}`);
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
                <td>${((product.revenue / totalRevenue) * 100).toFixed(2)}%</td>
            </tr>
        `).join('');
    }
}

// Expose revenue functions to window
window.loadRevenueStatistics = loadRevenueStatistics;
window.initRevenueTab = initRevenueTab;
window.updateRevenueFilter = updateRevenueFilter;

