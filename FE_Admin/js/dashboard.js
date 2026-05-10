// Dashboard Page
async function loadDashboardPage() {
    // Use optimized count queries - fetch with limit=1 to get total count without loading all data
    const [productsRes, categoriesRes, attributesRes] = await Promise.all([
        fetchAPI('/products?page=1&limit=1'),
        fetchAPI('/categories?page=1&limit=1'),
        fetchAPI('/spec-attributes?page=1&limit=1')
    ]);

    // Try to get total from pagination response, fallback to array length
    if (productsRes?.result) {
        const totalProductsEl = document.getElementById('total-products');
        if (totalProductsEl) {
            // Check if result is paginated object (has total property)
            if (productsRes.result && typeof productsRes.result === 'object' && !Array.isArray(productsRes.result) && productsRes.result.total !== undefined) {
                totalProductsEl.textContent = productsRes.result.total;
            } else if (Array.isArray(productsRes.result)) {
                // Fallback: if API doesn't support pagination yet, use array length
                totalProductsEl.textContent = productsRes.result.length;
            } else {
                totalProductsEl.textContent = '0';
            }
        }
    }
    if (categoriesRes?.result) {
        const totalCategoriesEl = document.getElementById('total-categories');
        if (totalCategoriesEl) {
            if (categoriesRes.result && typeof categoriesRes.result === 'object' && !Array.isArray(categoriesRes.result) && categoriesRes.result.total !== undefined) {
                totalCategoriesEl.textContent = categoriesRes.result.total;
            } else if (Array.isArray(categoriesRes.result)) {
                totalCategoriesEl.textContent = categoriesRes.result.length;
            } else {
                totalCategoriesEl.textContent = '0';
            }
        }
    }
    if (attributesRes?.result) {
        const totalAttributesEl = document.getElementById('total-attributes');
        if (totalAttributesEl) {
            if (attributesRes.result && typeof attributesRes.result === 'object' && !Array.isArray(attributesRes.result) && attributesRes.result.total !== undefined) {
                totalAttributesEl.textContent = attributesRes.result.total;
            } else if (Array.isArray(attributesRes.result)) {
                totalAttributesEl.textContent = attributesRes.result.length;
            } else {
                totalAttributesEl.textContent = '0';
            }
        }
    }

    // Load stock statistics
    await loadStockStatistics();

    // Load sales statistics
    await loadSalesStatistics();
}

async function loadStockStatistics() {
    try {
        // Gọi endpoint tối ưu để lấy thống kê tổng stock
        const statsRes = await fetchAPI('/variants/stats');

        if (statsRes?.result) {
            const totalStock = statsRes.result.totalStock || 0;
            const totalStockEl = document.getElementById('total-stock');
            if (totalStockEl) {
                totalStockEl.textContent = totalStock.toLocaleString('vi-VN');
            }
        } else {
            const totalStockEl = document.getElementById('total-stock');
            if (totalStockEl) {
                totalStockEl.textContent = 'N/A';
            }
        }
    } catch (error) {
        console.error('Error loading stock statistics:', error);
        const totalStockEl = document.getElementById('total-stock');
        if (totalStockEl) {
            totalStockEl.textContent = 'N/A';
        }
    }
}

async function loadSalesStatistics() {
    try {
        // Use optimized API endpoint to get sales statistics
        const statsRes = await fetchOrderAPI('/statistics/sales');

        if (statsRes?.result) {
            const totalSold = statsRes.result.totalSold || 0;
            const totalOrders = statsRes.result.totalOrders || 0;

            const totalSoldEl = document.getElementById('total-sold');
            if (totalSoldEl) {
                totalSoldEl.textContent = totalSold.toLocaleString('vi-VN');
            }

            const totalOrdersEl = document.getElementById('total-orders');
            if (totalOrdersEl) {
                totalOrdersEl.textContent = totalOrders.toLocaleString('vi-VN');
            }
        } else {
            // Fallback to 0 if API fails
            const totalSoldEl = document.getElementById('total-sold');
            if (totalSoldEl) {
                totalSoldEl.textContent = '0';
            }
            const totalOrdersEl = document.getElementById('total-orders');
            if (totalOrdersEl) {
                totalOrdersEl.textContent = '0';
            }
        }
    } catch (error) {
        console.error('Error loading sales statistics:', error);
        const totalSoldEl = document.getElementById('total-sold');
        if (totalSoldEl) {
            totalSoldEl.textContent = '0';
        }
        const totalOrdersEl = document.getElementById('total-orders');
        if (totalOrdersEl) {
            totalOrdersEl.textContent = '0';
        }
    }
}

// Expose to window
window.loadDashboardPage = loadDashboardPage;

