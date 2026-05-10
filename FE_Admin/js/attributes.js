// Attributes Page
let attributesPagination = {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
};

async function loadAttributesPage() {
    attributesPagination.page = 1;
    await loadAttributesData();
    setupAttributeSearch();
    setupAttributePagination();
}

async function loadAttributesData(page = 1, limit = 12) {
    const data = await fetchAPI(`/spec-attributes?page=${page}&limit=${limit}`);
    if (data?.result) {
        if (Array.isArray(data.result)) {
            // Non-paginated response (backward compatibility)
            attributes = data.result;
            attributesPagination.total = attributes.length;
            attributesPagination.totalPages = 1;
        } else if (data.result && typeof data.result === 'object' && data.result.result) {
            // Paginated response: { result: { result: [...], total: 100, ... } }
            attributes = data.result.result || [];
            attributesPagination.total = data.result.total || 0;
            attributesPagination.totalPages = data.result.totalPages || Math.ceil(attributesPagination.total / limit);
        } else {
            attributes = [];
            attributesPagination.total = 0;
            attributesPagination.totalPages = 0;
        }
        attributesPagination.page = page;
        attributesPagination.limit = limit;
        renderAttributes(attributes);
        updateAttributePaginationUI();
    }
}

function renderAttributes(attributesToRender) {
    const tbody = document.getElementById('attributes-table-body');
    if (!tbody) return;
    
    if (!attributesToRender || attributesToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Không tìm thấy thuộc tính</td></tr>';
        return;
    }

    tbody.innerHTML = attributesToRender.map(attr => `
        <tr>
            <td>${attr.id}</td>
            <td>${attr.keyName || '-'}</td>
            <td>${attr.label || '-'}</td>
            <td>${attr.dataType || '-'}</td>
            <td>${attr.searchable ? 'Có' : 'Không'}</td>
            <td>${attr.facetable ? 'Có' : 'Không'}</td>
            <td>
                <button class="btn btn-edit" onclick="editAttribute(${attr.id})">Sửa</button>
                <button class="btn btn-danger" onclick="deleteAttribute(${attr.id})" style="padding: 6px 12px; font-size: 12px;">Xóa</button>
            </td>
        </tr>
    `).join('');
}

function openAttributeModal(id = null) {
    const modalTitle = document.getElementById('attribute-modal-title');
    const attributeId = document.getElementById('attribute-id');
    
    if (modalTitle) {
        modalTitle.textContent = id ? 'Sửa thuộc tính' : 'Thêm thuộc tính';
    }
    if (attributeId) {
        attributeId.value = id || '';
    }
    
    if (id) {
        const attr = attributes.find(a => a.id === id);
        if (attr) {
            document.getElementById('attribute-key').value = attr.keyName || '';
            document.getElementById('attribute-label').value = attr.label || '';
            document.getElementById('attribute-datatype').value = attr.dataType || '';
            document.getElementById('attribute-searchable').checked = attr.searchable || false;
            document.getElementById('attribute-facetable').checked = attr.facetable || false;
        }
    } else {
        const form = document.getElementById('attribute-form');
        if (form) {
            form.reset();
        }
    }
    
    openModal('attribute-modal');
}

async function saveAttribute() {
    const idEl = document.getElementById('attribute-id');
    const id = idEl ? idEl.value : null;
    const form = document.getElementById('attribute-form');
    
    if (!form || !form.checkValidity()) {
        if (form) form.reportValidity();
        return;
    }

    const data = {
        keyName: document.getElementById('attribute-key').value,
        label: document.getElementById('attribute-label').value,
        dataType: document.getElementById('attribute-datatype').value || 'TEXT',
        searchable: document.getElementById('attribute-searchable').checked,
        facetable: document.getElementById('attribute-facetable').checked
    };

    let result;
    if (id) {
        result = await fetchAPI(`/spec-attributes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    } else {
        result = await fetchAPI('/spec-attributes', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    if (result) {
        closeModal('attribute-modal');
        await loadAttributesData(attributesPagination.page, attributesPagination.limit);
        alert(result.message || 'Lưu thuộc tính thành công');
    }
}

async function editAttribute(id) {
    openAttributeModal(id);
}

async function deleteAttribute(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa thuộc tính này?')) return;
    
    const result = await fetchAPI(`/spec-attributes/${id}`, { method: 'DELETE' });
    if (result) {
        await loadAttributesData(attributesPagination.page, attributesPagination.limit);
        alert(result.message || 'Xóa thuộc tính thành công');
    }
}

function setupAttributeSearch() {
    const searchInput = document.getElementById('attribute-search');
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
                attributesPagination.page = 1;
                await loadAttributesData(1, attributesPagination.limit);
                return;
            }
            
            // Search with pagination - reset to page 1
            attributesPagination.page = 1;
            const data = await fetchAPI(`/spec-attributes?page=1&limit=${attributesPagination.limit}&search=${encodeURIComponent(searchTerm)}`);
            if (data?.result) {
                if (Array.isArray(data.result)) {
                    // Non-paginated response
                    attributes = data.result;
                    attributesPagination.total = attributes.length;
                    attributesPagination.totalPages = 1;
                } else if (data.result && typeof data.result === 'object' && data.result.result) {
                    // Paginated response
                    attributes = data.result.result || [];
                    attributesPagination.total = data.result.total || 0;
                    attributesPagination.totalPages = data.result.totalPages || Math.ceil(attributesPagination.total / attributesPagination.limit);
                } else {
                    attributes = [];
                    attributesPagination.total = 0;
                    attributesPagination.totalPages = 0;
                }
                renderAttributes(attributes);
                updateAttributePaginationUI();
            }
        }, 300); // 300ms debounce
    });
}

function setupAttributePagination() {
    // Pagination controls will be added to the page
}

function updateAttributePaginationUI() {
    const paginationContainer = document.getElementById('attributes-pagination');
    if (!paginationContainer) return;
    
    const { page, totalPages, total, limit } = attributesPagination;
    const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
    const endItem = Math.min(page * limit, total);
    
    paginationContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0;">
            <div style="color: #666; font-size: 14px;">
                Hiển thị ${startItem}-${endItem} trong tổng số ${total} thuộc tính
            </div>
            <div style="display: flex; gap: 5px; align-items: center;">
                <button class="btn btn-secondary" 
                        onclick="changeAttributePage(${page - 1})" 
                        ${page <= 1 ? 'disabled' : ''}
                        style="padding: 6px 12px; font-size: 12px;">
                    ‹ Trước
                </button>
                <span style="padding: 0 10px; color: #666;">
                    Trang ${page} / ${totalPages || 1}
                </span>
                <button class="btn btn-secondary" 
                        onclick="changeAttributePage(${page + 1})" 
                        ${page >= totalPages ? 'disabled' : ''}
                        style="padding: 6px 12px; font-size: 12px;">
                    Sau ›
                </button>
            </div>
        </div>
    `;
}

async function changeAttributePage(newPage) {
    if (newPage < 1 || newPage > attributesPagination.totalPages) return;
    attributesPagination.page = newPage;
    await loadAttributesData(newPage, attributesPagination.limit);
}

// Expose to window
window.loadAttributesPage = loadAttributesPage;
window.openAttributeModal = openAttributeModal;
window.saveAttribute = saveAttribute;
window.editAttribute = editAttribute;
window.deleteAttribute = deleteAttribute;
window.changeAttributePage = changeAttributePage;

