// Configuration
const API_BASE_URL = 'http://localhost:8083/api';

// Get auth headers (defined in auth.js)
function getHeaders() {
    return getAuthHeaders();
}

// Global state
let currentPage = 'dashboard';
let categories = [];
let brands = [];
let products = [];
let attributes = [];

// Navigation
function showPage(page) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === page) {
            item.classList.add('active');
        }
    });

    // Update page content
    document.querySelectorAll('.page-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(page).classList.add('active');

    // Update title
    const titles = {
        dashboard: 'Dashboard',
        products: 'Quản lý Sản phẩm',
        categories: 'Quản lý Danh mục',
        attributes: 'Quản lý Thuộc tính hệ thống'
    };
    document.getElementById('page-title').textContent = titles[page];
    currentPage = page;

    // Load data
    switch(page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'products':
            loadProducts();
            setupProductSearch();
            break;
        case 'categories':
            loadCategories();
            setupCategorySearch();
            break;
        case 'attributes':
            loadAttributes();
            setupAttributeSearch();
            break;
    }
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    document.getElementById(modalId.replace('-modal', '-form')).reset();
}

window.closeModal = closeModal;

// Fetch API
async function fetchAPI(url, options = {}) {
    try {
        const response = await fetch(API_BASE_URL + url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        alert('Error: ' + error.message);
        return null;
    }
}

// Dashboard
async function loadDashboard() {
    const [productsRes, categoriesRes, attributesRes] = await Promise.all([
        fetchAPI('/products'),
        fetchAPI('/categories'),
        fetchAPI('/spec-attributes')
    ]);

    if (productsRes?.result) {
        document.getElementById('total-products').textContent = productsRes.result.length;
    }
    if (categoriesRes?.result) {
        document.getElementById('total-categories').textContent = categoriesRes.result.length;
    }
    if (attributesRes?.result) {
        document.getElementById('total-attributes').textContent = attributesRes.result.length;
    }
}

// Products
async function loadProducts() {
    // Load brands if not already loaded (needed for display)
    if (brands.length === 0) {
        await loadBrands();
    }
    if (categories.length === 0) {
        await loadCategories();
    }
    
    const data = await fetchAPI('/products');
    if (data?.result) {
        products = data.result;
        renderProducts(products);
    }
}

function renderProducts(productsToRender) {
    const tbody = document.getElementById('products-table-body');
    if (!productsToRender || productsToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Không tìm thấy sản phẩm</td></tr>';
        return;
    }

    tbody.innerHTML = productsToRender.map(product => {
        // Support both categoryId (old) and categoryIds (new)
        const categoryId = product.categoryIds?.[0] || product.categoryId;
        const category = categories.find(c => c.id === categoryId);
        const brand = brands.find(b => b.id === product.brandId);
        return `
        <tr>
            <td>${product.id}</td>
            <td>${product.name || '-'}</td>
            <td>${product.slug || '-'}</td>
            <td>${category ? category.name : (product.categoryIds?.[0] || product.categoryId || '-')}</td>
            <td>${brand ? brand.name : product.brandId || '-'}</td>
            <td><span class="status-badge ${product.status ? 'active' : 'inactive'}">${product.status ? 'Kích hoạt' : 'Tắt'}</span></td>
            <td>${product.createdAt ? new Date(product.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
            <td>
                <button class="btn btn-edit" onclick="editProduct(${product.id})">Sửa</button>
                <button class="btn btn-danger" onclick="deleteProduct(${product.id})" style="padding: 6px 12px; font-size: 12px;">Xóa</button>
            </td>
        </tr>
    `;
    }).join('');
}

async function openProductModal(id = null) {
    document.getElementById('product-modal-title').textContent = id ? 'Sửa sản phẩm' : 'Thêm sản phẩm';
    document.getElementById('product-id').value = id || '';
    
    // Load categories and brands
    await Promise.all([
        loadCategories(),
        loadBrands()
    ]);
    
    loadSelectOptions('product-category-id', categories, 'name');
    loadSelectOptions('product-brand-id', brands, 'name');
    
    // Load attributes for selection
    await loadAttributes();
    renderProductAttributes(attributes);
    
    if (id) {
        const product = products.find(p => p.id === id);
        if (product) {
            document.getElementById('product-name').value = product.name || '';
            document.getElementById('product-slug').value = product.slug || '';
            document.getElementById('product-short-desc').value = product.shortDescription || '';
            document.getElementById('product-desc').value = product.description || '';
            // Support both categoryId (old) and categoryIds (new)
            const categoryId = product.categoryIds?.[0] || product.categoryId;
            document.getElementById('product-category-id').value = categoryId || '';
            document.getElementById('product-brand-id').value = product.brandId || '';
            document.getElementById('product-avatar').value = product.avatar || '';
            document.getElementById('product-images').value = product.images || '';
            document.getElementById('product-status').checked = product.status !== false;
            
            // Load selected attributes for this product (if any)
            // Note: This would require backend support to get product attributes
            // For now, we'll just show all available attributes
        }
    } else {
        document.getElementById('product-form').reset();
    }
    
    openModal('product-modal');
}

function renderProductAttributes(attributesList) {
    const container = document.getElementById('product-attributes-list');
    if (!container) return;
    
    if (!attributesList || attributesList.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Chưa có thuộc tính nào. Vui lòng thêm thuộc tính trong màn "Thuộc tính hệ thống".</p>';
        return;
    }
    
    container.innerHTML = attributesList.map(attr => {
        const isBool = attr.dataType === 'BOOL';
        const inputType = getAttributeInputType(attr.dataType);
        const stepAttr = (attr.dataType === 'DECIMAL') ? 'step="0.01"' : '';
        
        return `
            <div style="margin-bottom: 15px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #e0e0e0;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <input type="checkbox" 
                           id="attr-check-${attr.id}" 
                           class="attribute-checkbox" 
                           data-attribute-id="${attr.id}"
                           style="margin-right: 10px;">
                    <label for="attr-check-${attr.id}" style="font-weight: 500; cursor: pointer; flex: 1;">
                        ${attr.label} <span style="color: #999; font-size: 12px;">(${attr.keyName})</span>
                    </label>
                </div>
                <div class="attribute-value-container" id="attr-value-${attr.id}" style="display: none; margin-top: 8px;">
                    ${isBool ? `
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" 
                                   class="attribute-value-input" 
                                   data-attribute-id="${attr.id}"
                                   data-attribute-type="${attr.dataType}"
                                   style="margin-right: 8px;">
                            <span>${attr.label}</span>
                        </label>
                    ` : `
                        <input type="${inputType}" 
                               class="attribute-value-input" 
                               data-attribute-id="${attr.id}"
                               data-attribute-type="${attr.dataType}"
                               placeholder="Nhập giá trị cho ${attr.label}"
                               ${stepAttr}
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    `}
                </div>
            </div>
        `;
    }).join('');
    
    // Add event listeners for checkboxes
    container.querySelectorAll('.attribute-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const attrId = this.dataset.attributeId;
            const valueContainer = document.getElementById(`attr-value-${attrId}`);
            if (this.checked) {
                valueContainer.style.display = 'block';
            } else {
                valueContainer.style.display = 'none';
                const valueInput = valueContainer.querySelector('.attribute-value-input');
                if (valueInput) {
                    if (valueInput.type === 'checkbox') {
                        valueInput.checked = false;
                    } else {
                        valueInput.value = '';
                    }
                }
            }
        });
    });
}

function getAttributeInputType(dataType) {
    switch(dataType) {
        case 'INT':
            return 'number';
        case 'DECIMAL':
            return 'number';
        case 'BOOL':
            return 'checkbox';
        default:
            return 'text';
    }
}

function getSelectedProductAttributes() {
    const selectedAttributes = [];
    const container = document.getElementById('product-attributes-list');
    if (!container) return selectedAttributes;
    
    container.querySelectorAll('.attribute-checkbox:checked').forEach(checkbox => {
        const attrId = checkbox.dataset.attributeId;
        const valueInput = container.querySelector(`.attribute-value-input[data-attribute-id="${attrId}"]`);
        if (valueInput) {
            let value;
            if (valueInput.type === 'checkbox') {
                value = valueInput.checked ? 'true' : 'false';
            } else {
                value = valueInput.value.trim();
            }
            if (value !== '' && (valueInput.type !== 'checkbox' || value === 'true')) {
                selectedAttributes.push({
                    attributeId: parseInt(attrId),
                    value: value
                });
            }
        }
    });
    return selectedAttributes;
}

async function saveProduct() {
    const id = document.getElementById('product-id').value;
    const form = document.getElementById('product-form');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const data = {
        name: document.getElementById('product-name').value,
        slug: document.getElementById('product-slug').value,
        shortDescription: document.getElementById('product-short-desc').value,
        description: document.getElementById('product-desc').value,
        categoryIds: [Number(document.getElementById('product-category-id').value)], // Convert to array
        brandId: Number(document.getElementById('product-brand-id').value),
        avatar: document.getElementById('product-avatar').value || null,
        images: document.getElementById('product-images').value || null,
        status: document.getElementById('product-status').checked
    };

    let result;
    if (id) {
        result = await fetchAPI(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    } else {
        result = await fetchAPI('/products', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    if (result) {
        // Note: Selected attributes are stored separately via variant specs
        // For now, we just save the product. Attributes will be used when creating variants
        const selectedAttributes = getSelectedProductAttributes();
        if (selectedAttributes.length > 0) {
            console.log('Selected attributes:', selectedAttributes);
            // TODO: Store these attributes when creating variants for this product
        }
        
        closeModal('product-modal');
        loadProducts();
        alert(result.message || 'Lưu sản phẩm thành công');
    }
}

async function editProduct(id) {
    openProductModal(id);
}

async function deleteProduct(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    
    const result = await fetchAPI(`/products/${id}`, { method: 'DELETE' });
    if (result) {
        loadProducts();
        alert(result.message || 'Xóa sản phẩm thành công');
    }
}

function setupProductSearch() {
    const searchInput = document.getElementById('product-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (!searchTerm) {
            renderProducts(products);
            return;
        }
        const filtered = products.filter(p => 
            p.name?.toLowerCase().includes(searchTerm) ||
            p.slug?.toLowerCase().includes(searchTerm)
        );
        renderProducts(filtered);
    });
}

// Categories
async function loadCategories() {
    const data = await fetchAPI('/categories');
    if (data?.result) {
        categories = data.result;
        renderCategories(categories);
    }
}

function renderCategories(categoriesToRender) {
    const tbody = document.getElementById('categories-table-body');
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
    document.getElementById('category-modal-title').textContent = id ? 'Sửa danh mục' : 'Thêm danh mục';
    document.getElementById('category-id').value = id || '';
    
    loadSelectOptions('category-parent-id', categories.filter(c => c.id !== id), 'name', true);
    
    if (id) {
        const category = categories.find(c => c.id === id);
        if (category) {
            document.getElementById('category-name').value = category.name || '';
            document.getElementById('category-parent-id').value = category.parentId || '';
        }
    } else {
        document.getElementById('category-form').reset();
    }
    
    openModal('category-modal');
}

async function saveCategory() {
    const id = document.getElementById('category-id').value;
    const form = document.getElementById('category-form');
    
    if (!form.checkValidity()) {
        form.reportValidity();
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
        loadCategories();
        // Reload dashboard if on dashboard
        if (currentPage === 'dashboard') loadDashboard();
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
        loadCategories();
        alert(result.message || 'Xóa danh mục thành công');
    }
}

function setupCategorySearch() {
    const searchInput = document.getElementById('category-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (!searchTerm) {
            renderCategories(categories);
            return;
        }
        const filtered = categories.filter(c => c.name?.toLowerCase().includes(searchTerm));
        renderCategories(filtered);
    });
}

// Brands (loaded for product form, but no management page)
async function loadBrands() {
    const data = await fetchAPI('/brands');
    if (data?.result) {
        brands = data.result;
    }
}

// Attributes (Thuộc tính hệ thống)
async function loadAttributes() {
    const data = await fetchAPI('/spec-attributes');
    if (data?.result) {
        attributes = data.result;
        if (currentPage === 'attributes') {
            renderAttributes(attributes);
        }
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
    document.getElementById('attribute-modal-title').textContent = id ? 'Sửa thuộc tính' : 'Thêm thuộc tính';
    document.getElementById('attribute-id').value = id || '';
    
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
        document.getElementById('attribute-form').reset();
    }
    
    openModal('attribute-modal');
}

async function saveAttribute() {
    const id = document.getElementById('attribute-id').value;
    const form = document.getElementById('attribute-form');
    
    if (!form.checkValidity()) {
        form.reportValidity();
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
        loadAttributes();
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
        loadAttributes();
        alert(result.message || 'Xóa thuộc tính thành công');
    }
}

function setupAttributeSearch() {
    const searchInput = document.getElementById('attribute-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (!searchTerm) {
            renderAttributes(attributes);
            return;
        }
        const filtered = attributes.filter(a => 
            a.label?.toLowerCase().includes(searchTerm) ||
            a.keyName?.toLowerCase().includes(searchTerm)
        );
        renderAttributes(filtered);
    });
}

// Utility functions
function loadSelectOptions(selectId, options, displayField, includeEmpty = false) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '';
    
    if (includeEmpty) {
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'None';
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

// Expose functions to global scope
window.showPage = showPage;
window.openProductModal = openProductModal;
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.openCategoryModal = openCategoryModal;
window.saveCategory = saveCategory;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.openAttributeModal = openAttributeModal;
window.saveAttribute = saveAttribute;
window.editAttribute = editAttribute;
window.deleteAttribute = deleteAttribute;

// Load initial data when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadBrands();
    loadAttributes();
    if (currentPage === 'dashboard') {
        loadDashboard();
    }
});

