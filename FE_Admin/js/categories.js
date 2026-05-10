// Categories Page
let categoriesPagination = {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
};

async function loadCategoriesPage() {
    categoriesPagination.page = 1;
    await loadCategoriesData();
    setupCategorySearch();
    setupCategoryPagination();
}

async function loadCategoriesData(page = 1, limit = 12) {
    const data = await fetchAPI(`/categories?page=${page}&limit=${limit}`);
    if (data?.result) {
        if (Array.isArray(data.result)) {
            // Non-paginated response (backward compatibility)
            categories = data.result;
            categoriesPagination.total = categories.length;
            categoriesPagination.totalPages = 1;
        } else if (data.result && typeof data.result === 'object' && data.result.result) {
            // Paginated response: { result: { result: [...], total: 100, ... } }
            categories = data.result.result || [];
            categoriesPagination.total = data.result.total || 0;
            categoriesPagination.totalPages = data.result.totalPages || Math.ceil(categoriesPagination.total / limit);
        } else {
            categories = [];
            categoriesPagination.total = 0;
            categoriesPagination.totalPages = 0;
        }
        categoriesPagination.page = page;
        categoriesPagination.limit = limit;
        renderCategories(categories);
        updateCategoryPaginationUI();
    }
}

function renderCategories(categoriesToRender) {
    const tbody = document.getElementById('categories-table-body');
    if (!tbody) return;
    
    if (!categoriesToRender || categoriesToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Không tìm thấy danh mục</td></tr>';
        return;
    }

    tbody.innerHTML = categoriesToRender.map(cat => {
        const parent = categoriesToRender.find(c => c.id === cat.parentId);
        return `
        <tr>
            <td>${cat.id}</td>
            <td>${cat.name || '-'}</td>
            <td>${parent ? parent.name : (cat.parentId || '-')}</td>
            <td>
                <button class="btn btn-edit" onclick="editCategory(${cat.id})">Sửa</button>
                <button class="btn btn-danger" onclick="deleteCategory(${cat.id})" style="padding: 6px 12px; font-size: 12px;">Xóa</button>
            </td>
        </tr>
    `;
    }).join('');
}

function openCategoryModal(id = null) {
    const modalTitle = document.getElementById('category-modal-title');
    const categoryId = document.getElementById('category-id');
    
    if (modalTitle) {
        modalTitle.textContent = id ? 'Sửa danh mục' : 'Thêm danh mục';
    }
    if (categoryId) {
        categoryId.value = id || '';
    }
    
    loadSelectOptions('category-parent-id', categories.filter(c => c.id !== id), 'name', true);
    
    if (id) {
        const category = categories.find(c => c.id === id);
        if (category) {
            document.getElementById('category-name').value = category.name || '';
            document.getElementById('category-parent-id').value = category.parentId || '';
        }
    } else {
        const form = document.getElementById('category-form');
        if (form) {
            form.reset();
        }
    }
    
    openModal('category-modal');
}

async function saveCategory() {
    const idEl = document.getElementById('category-id');
    const id = idEl ? idEl.value : null;
    const form = document.getElementById('category-form');
    
    if (!form || !form.checkValidity()) {
        if (form) form.reportValidity();
        return;
    }

    const data = {
        name: document.getElementById('category-name').value,
        parentId: document.getElementById('category-parent-id').value || null
    };

    let result;
    if (id) {
        result = await fetchAPI(`/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    } else {
        result = await fetchAPI('/categories', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    if (result) {
        closeModal('category-modal');
        await loadCategoriesData(categoriesPagination.page, categoriesPagination.limit);
        // Reload dashboard if on dashboard
        if (currentPage === 'dashboard' && window.loadDashboardPage) {
            await window.loadDashboardPage();
        }
        alert(result.message || 'Lưu danh mục thành công');
    }
}

async function editCategory(id) {
    openCategoryModal(id);
}

async function deleteCategory(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    
    const result = await fetchAPI(`/categories/${id}`, { method: 'DELETE' });
    if (result) {
        await loadCategoriesData(categoriesPagination.page, categoriesPagination.limit);
        alert(result.message || 'Xóa danh mục thành công');
    }
}

function setupCategorySearch() {
    const searchInput = document.getElementById('category-search');
    if (!searchInput) return;
    
    // Remove existing event listeners by cloning
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    
    let searchTimeout;
    newSearchInput.addEventListener('input', async (e) => {
        const searchTerm = e.target.value.trim();
        
        // Debounce search
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            if (!searchTerm) {
                // Reset to first page when clearing search
                categoriesPagination.page = 1;
                await loadCategoriesData(1, categoriesPagination.limit);
                return;
            }
            
            // Search with pagination - reset to page 1
            categoriesPagination.page = 1;
            const data = await fetchAPI(`/categories?page=1&limit=${categoriesPagination.limit}&search=${encodeURIComponent(searchTerm)}`);
            if (data?.result) {
                if (Array.isArray(data.result)) {
                    // Non-paginated response
                    categories = data.result;
                    categoriesPagination.total = categories.length;
                    categoriesPagination.totalPages = 1;
                } else if (data.result && typeof data.result === 'object' && data.result.result) {
                    // Paginated response
                    categories = data.result.result || [];
                    categoriesPagination.total = data.result.total || 0;
                    categoriesPagination.totalPages = data.result.totalPages || Math.ceil(categoriesPagination.total / categoriesPagination.limit);
                } else {
                    categories = [];
                    categoriesPagination.total = 0;
                    categoriesPagination.totalPages = 0;
                }
                renderCategories(categories);
                updateCategoryPaginationUI();
            }
        }, 300); // 300ms debounce
    });
}

function setupCategoryPagination() {
    // Pagination controls will be added to the page
}

function updateCategoryPaginationUI() {
    const paginationContainer = document.getElementById('categories-pagination');
    if (!paginationContainer) return;
    
    const { page, totalPages, total, limit } = categoriesPagination;
    const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
    const endItem = Math.min(page * limit, total);
    
    paginationContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0;">
            <div style="color: #666; font-size: 14px;">
                Hiển thị ${startItem}-${endItem} trong tổng số ${total} danh mục
            </div>
            <div style="display: flex; gap: 5px; align-items: center;">
                <button class="btn btn-secondary" 
                        onclick="changeCategoryPage(${page - 1})" 
                        ${page <= 1 ? 'disabled' : ''}
                        style="padding: 6px 12px; font-size: 12px;">
                    ‹ Trước
                </button>
                <span style="padding: 0 10px; color: #666;">
                    Trang ${page} / ${totalPages || 1}
                </span>
                <button class="btn btn-secondary" 
                        onclick="changeCategoryPage(${page + 1})" 
                        ${page >= totalPages ? 'disabled' : ''}
                        style="padding: 6px 12px; font-size: 12px;">
                    Sau ›
                </button>
            </div>
        </div>
    `;
}

async function changeCategoryPage(newPage) {
    if (newPage < 1 || newPage > categoriesPagination.totalPages) return;
    categoriesPagination.page = newPage;
    await loadCategoriesData(newPage, categoriesPagination.limit);
}

// Expose to window
window.loadCategoriesPage = loadCategoriesPage;
window.openCategoryModal = openCategoryModal;
window.saveCategory = saveCategory;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.changeCategoryPage = changeCategoryPage;

