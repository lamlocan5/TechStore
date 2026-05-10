// Products Page
let variants = [];
let expandedProducts = new Set();
let productsPagination = {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
};
let selectedProductId = null;
let currentProductTab = 'info';

async function loadProductsPage() {
    // Reset expanded products and pagination
    expandedProducts.clear();
    productsPagination.page = 1;

    // Only load products - categories, brands, attributes will be loaded when needed (e.g., opening modals)
    await loadProducts(1, productsPagination.limit);
    setupProductSearch();
    setupProductPagination();
}

async function loadProducts(page = 1, limit = 12) {
    const data = await fetchAPI(`/products?page=${page}&limit=${limit}`);
    if (data?.result) {
        // Handle both paginated and non-paginated responses
        if (Array.isArray(data.result)) {
            // Non-paginated response (backward compatibility)
            products = data.result;
            productsPagination.total = products.length;
            productsPagination.totalPages = 1;
        } else if (data.result && typeof data.result === 'object' && data.result.result) {
            // Paginated response: { result: { result: [...], total: 100, ... } }
            products = data.result.result || [];
            productsPagination.total = data.result.total || 0;
            productsPagination.totalPages = data.result.totalPages || Math.ceil(productsPagination.total / limit);
        } else {
            products = [];
            productsPagination.total = 0;
            productsPagination.totalPages = 0;
        }
        productsPagination.page = page;
        productsPagination.limit = limit;

        // Render products without loading variants (lazy load when needed)
        await renderProducts(products);
        updateProductPaginationUI();
    }
}

async function loadVariantsForProducts(productIds) {
    // Load variants only for products on current page
    const variantPromises = productIds.map(productId =>
        fetchAPI(`/variants/product/${productId}`)
    );
    const variantResults = await Promise.all(variantPromises);

    // Filter out existing variants for these products and add new ones
    variants = variants.filter(v => !productIds.includes(v.productId));
    variantResults.forEach((data) => {
        if (data?.result && Array.isArray(data.result)) {
            variants.push(...data.result);
        }
    });
}

// Removed loadAllVariants - now using loadVariantsForProducts for optimization

async function loadProductVariants(productId) {
    const data = await fetchAPI(`/variants/product/${productId}`);
    if (data?.result) {
        // Update variants array
        variants = variants.filter(v => v.productId !== productId);
        // Load specs for each variant
        for (const variant of data.result) {
            variant.specs = await loadVariantSpecs(variant.id);
        }
        variants.push(...data.result);
        return data.result;
    }
    return [];
}

async function loadVariantSpecs(variantId) {
    const data = await fetchAPI(`/variant-specs/variant/${variantId}`);
    if (data?.result) {
        return data.result;
    }
    return [];
}

async function renderProducts(productsToRender) {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;

    if (!productsToRender || productsToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Không tìm thấy sản phẩm</td></tr>';
        return;
    }

    // Don't load variants here - will load on demand when user clicks
    tbody.innerHTML = productsToRender.map(product => {
        const categoryId = product.categoryIds?.[0] || product.categoryId;
        const category = categories.find(c => c.id === categoryId);
        const brand = brands.find(b => b.id === product.brandId);

        // Use new fields from backend: brandName, categoryNames, minPrice, maxPrice, totalStock
        const displayBrand = product.brandName || (brand ? brand.name : '-');
        const displayCategory = product.categoryNames?.[0] || (category ? category.name : '-');
        const minPrice = product.minPrice;
        const maxPrice = product.maxPrice;
        const totalStock = product.totalStock || 0;
        const variantCount = product.variantCount || 0;

        return `
            <tr style="cursor: pointer;" onclick="selectProduct(${product.id})">
                <td>#${product.id}</td>
                <td>
                    <strong>${product.name || '-'}</strong>
                    <div style="font-size: 11px; color: #666; margin-top: 2px;">
                        ${product.slug || ''}
                    </div>
                </td>
                <td>
                    <div style="font-size: 12px;">
                        ${displayCategory}
                        ${displayBrand ? ` / ${displayBrand}` : ''}
                    </div>
                </td>
                <td>
                    ${minPrice ? `
                        <strong style="color: #2196f3;">${formatCurrency(minPrice)}</strong>
                        ${maxPrice && maxPrice !== minPrice ? `
                            <div style="font-size: 11px; color: #999;">~ ${formatCurrency(maxPrice)}</div>
                        ` : ''}
                    ` : '<span style="color: #999;">-</span>'}
                </td>
                <td>
                    <strong style="color: ${totalStock < 10 ? '#f44336' : totalStock < 50 ? '#ff9800' : '#4caf50'};">
                        ${totalStock.toLocaleString('vi-VN')}
                    </strong>
                </td>
                <td>
                    <span style="padding: 4px 8px; background: #e3f2fd; color: #1976d2; border-radius: 4px; font-size: 12px;">
                        ${variantCount} biến thể
                    </span>
                </td>
                <td>
                    <span class="status-badge ${product.status ? 'active' : 'inactive'}" style="padding: 4px 8px; font-size: 11px;">
                        ${product.status ? 'Kích hoạt' : 'Tắt'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-edit" onclick="event.stopPropagation(); editProduct(${product.id})" style="padding: 4px 8px; font-size: 11px; margin-right: 3px;">Sửa</button>
                    <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteProduct(${product.id})" style="padding: 4px 8px; font-size: 11px;">Xóa</button>
                </td>
            </tr>
        `;
    }).join('');
}

// New Layout Functions: Select Product and Show Detail View
async function selectProduct(productId) {
    selectedProductId = productId;

    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Hide list view and show detail view
    const listView = document.getElementById('products-list-view');
    const detailView = document.getElementById('product-detail-view');

    if (listView) listView.style.display = 'none';
    if (detailView) detailView.style.display = 'block';

    // Update header
    const categoryId = product.categoryIds?.[0] || product.categoryId;
    const category = categories.find(c => c.id === categoryId);
    const brand = brands.find(b => b.id === product.brandId);

    const nameEl = document.getElementById('selected-product-name-view');
    const infoEl = document.getElementById('selected-product-info-view');
    const countEl = document.getElementById('variants-count-view');

    if (!nameEl || !infoEl || !countEl) {
        console.error('Product detail view elements not found');
        return;
    }

    nameEl.textContent = product.name || '-';
    infoEl.innerHTML = `
        ${category ? category.name : ''} ${brand ? ' • ' + brand.name : ''}
        <span class="status-badge ${product.status ? 'active' : 'inactive'}" style="margin-left: 10px; padding: 2px 6px; font-size: 11px;">
            ${product.status ? 'Kích hoạt' : 'Tắt'}
        </span>
    `;

    // Load variants for this product
    await loadProductVariants(productId);
    const productVariants = variants.filter(v => v.productId === productId);
    countEl.textContent = productVariants.length;

    // Show info tab by default
    switchProductTab('info');
}

function backToProductsList() {
    const listView = document.getElementById('products-list-view');
    const detailView = document.getElementById('product-detail-view');

    if (listView) listView.style.display = 'block';
    if (detailView) detailView.style.display = 'none';

    selectedProductId = null;
}

// Product Edit View Functions
async function openProductEditView(id = null) {
    // Hide all other views
    const listView = document.getElementById('products-list-view');
    const detailView = document.getElementById('product-detail-view');
    const editView = document.getElementById('product-edit-view');

    if (listView) listView.style.display = 'none';
    if (detailView) detailView.style.display = 'none';
    if (editView) editView.style.display = 'block';

    const editTitle = document.getElementById('product-edit-title');
    const productId = document.getElementById('product-id');

    if (editTitle) {
        editTitle.textContent = id ? 'Sửa sản phẩm' : 'Thêm sản phẩm';
    }
    if (productId) {
        productId.value = id || '';
    }

    // Load categories and brands only if not already loaded
    if (categories.length === 0) {
        await loadCategories();
    }
    if (brands.length === 0) {
        await loadBrands();
    }

    loadSelectOptions('product-category-id', categories, 'name');
    loadSelectOptions('product-brand-id', brands, 'name');

    // Initialize/Reset image manager
    productImageManager.reset();
    productImageManager.init();

    if (id) {
        const product = products.find(p => p.id === id);
        if (product) {
            document.getElementById('product-name').value = product.name || '';
            document.getElementById('product-slug').value = product.slug || '';
            document.getElementById('product-short-desc').value = product.shortDescription || '';
            document.getElementById('product-desc').value = product.description || '';
            const categoryId = product.categoryIds?.[0] || product.categoryId;
            document.getElementById('product-category-id').value = categoryId || '';
            document.getElementById('product-brand-id').value = product.brandId || '';
            document.getElementById('product-price-list').value = product.priceList || '';
            document.getElementById('product-price-sale').value = product.priceSale || '';
            document.getElementById('product-status').checked = product.status !== false;

            // Load existing images
            if (product.avatar || product.images) {
                productImageManager.loadExistingImages(product);
            }
        }
    } else {
        const form = document.getElementById('product-form');
        if (form) {
            form.reset();
            document.getElementById('product-status').checked = true;
        }
    }
}

function backFromProductEdit() {
    const editView = document.getElementById('product-edit-view');
    const listView = document.getElementById('products-list-view');
    const detailView = document.getElementById('product-detail-view');

    if (editView) editView.style.display = 'none';

    // Show previous view
    if (selectedProductId && detailView) {
        detailView.style.display = 'block';
    } else if (listView) {
        listView.style.display = 'block';
    }
}

async function saveProduct() {
    const idEl = document.getElementById('product-id');
    const id = idEl ? idEl.value : null;
    const form = document.getElementById('product-form');

    if (!form || !form.checkValidity()) {
        if (form) form.reportValidity();
        return;
    }

    try {
        // Show loading state
        const saveBtnElement = document.querySelector('[onclick="saveProduct()"]');
        if (saveBtnElement) {
            saveBtnElement.disabled = true;
            saveBtnElement.textContent = '⏳ Đang xử lý...';
        }

        // Upload images to Supabase (chỉ nếu có ảnh mới)
        let finalImages = {
            avatar: null,
            gallery: []
        };

        if (productImageManager.avatarFile || productImageManager.galleryFiles.length > 0) {
            finalImages = await productImageManager.uploadImages();
        } else {
            // Giữ ảnh cũ từ hidden input
            const oldAvatar = document.getElementById('product-avatar-hidden')?.value;
            const oldGallery = document.getElementById('product-gallery-hidden')?.value;

            if (oldAvatar) finalImages.avatar = oldAvatar;
            if (oldGallery) finalImages.gallery = oldGallery.split(',').filter(url => url.trim());
        }

        const categoryIdValue = document.getElementById('product-category-id').value;
        const data = {
            name: document.getElementById('product-name').value,
            slug: document.getElementById('product-slug').value,
            shortDescription: document.getElementById('product-short-desc').value,
            description: document.getElementById('product-desc').value,
            categoryIds: categoryIdValue ? [Number(categoryIdValue)] : [],
            brandId: Number(document.getElementById('product-brand-id').value),
            priceList: document.getElementById('product-price-list').value ? Number(document.getElementById('product-price-list').value) : null,
            priceSale: document.getElementById('product-price-sale').value ? Number(document.getElementById('product-price-sale').value) : null,
            avatar: finalImages.avatar,
            // ✅ Fix: Gửi JSON array thay vì comma-separated string
            images: finalImages.gallery && finalImages.gallery.length > 0
                ? JSON.stringify(finalImages.gallery)
                : null,
            firstImage: finalImages.gallery[0] || finalImages.avatar || null,
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
            const savedProductId = id || (result.result ? result.result.id : null);
            await loadProducts(productsPagination.page, productsPagination.limit);

            // Go back from edit view
            backFromProductEdit();

            // If we were editing, select the product to show detail
            if (savedProductId) {
                await selectProduct(savedProductId);
            } else {
                // If creating new, show list
                const listView = document.getElementById('products-list-view');
                if (listView) listView.style.display = 'block';
            }

            // Reload products to show updated data
            await renderProducts(products);

            alert(result.message || '✅ Lưu sản phẩm thành công');
        }
    } catch (error) {
        console.error('Save product error:', error);
        alert(`❌ Lỗi: ${error.message}`);
    } finally {
        // Restore button state
        const saveBtn = document.querySelector('[onclick="saveProduct()"]');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 Lưu sản phẩm';
        }
    }
}

async function editProduct(id) {
    await openProductEditView(id);
}

async function deleteProduct(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Tất cả các biến thể sẽ bị xóa.')) return;

    const result = await fetchAPI(`/products/${id}`, { method: 'DELETE' });
    if (result) {
        // If deleted product was selected, clear selection
        if (selectedProductId === id) {
            selectedProductId = null;
            const emptyView = document.getElementById('product-detail-empty');
            const detailView = document.getElementById('product-detail-content');
            if (emptyView) emptyView.style.display = 'flex';
            if (detailView) detailView.style.display = 'none';
        }

        await loadProducts(productsPagination.page, productsPagination.limit);
        alert(result.message || 'Xóa sản phẩm thành công');
    }
}

// Variant Modal Functions
async function openVariantModal(id = null, productId = null) {
    const modalTitle = document.getElementById('variant-modal-title');
    const variantId = document.getElementById('variant-id');
    const variantProductId = document.getElementById('variant-product-id');

    if (modalTitle) {
        modalTitle.textContent = id ? 'Sửa biến thể sản phẩm' : 'Thêm biến thể sản phẩm';
    }
    if (variantId) {
        variantId.value = id || '';
    }
    if (variantProductId) {
        variantProductId.value = productId || '';
    }

    // Load products for dropdown (if adding new variant without productId)
    // Only load if we don't have products or need more items
    if (!productId) {
        // If we already have products loaded (from products page), use them
        // Otherwise, load from API
        if (products.length > 0) {
            loadSelectOptions('variant-product-select', products, 'name');
        } else {
            // Load products for dropdown (100 items should be enough)
            const dropdownData = await fetchAPI('/products?page=1&limit=100');
            if (dropdownData?.result) {
                let productsList = [];
                if (Array.isArray(dropdownData.result)) {
                    productsList = dropdownData.result;
                } else if (dropdownData.result && typeof dropdownData.result === 'object' && dropdownData.result.result) {
                    productsList = dropdownData.result.result || [];
                }
                loadSelectOptions('variant-product-select', productsList, 'name');
            }
        }
        document.getElementById('variant-product-select').disabled = false;
        document.getElementById('variant-product-select').required = true;
    } else {
        const product = products.find(p => p.id === productId);
        if (product) {
            document.getElementById('variant-product-select').innerHTML = `<option value="${product.id}">${product.name}</option>`;
            document.getElementById('variant-product-select').value = productId;
            document.getElementById('variant-product-select').disabled = true;
        }
    }

    // Load attributes for selection only if not already loaded
    if (attributes.length === 0) {
        await loadAttributes();
    }

    if (id) {
        const variant = variants.find(v => v.id === id);
        if (variant) {
            // Load variant specs if not loaded
            if (!variant.specs || variant.specs.length === 0) {
                variant.specs = await loadVariantSpecs(id);
            }

            document.getElementById('variant-sku').value = variant.sku || '';
            document.getElementById('variant-color').value = variant.color || '';
            document.getElementById('variant-ram').value = variant.ramGb || '';
            document.getElementById('variant-storage').value = variant.storageGb || '';
            document.getElementById('variant-cpu').value = variant.cpuModel || '';
            document.getElementById('variant-igpu').value = variant.igpu || '';
            document.getElementById('variant-gpu').value = variant.gpuModel || '';
            document.getElementById('variant-chipset').value = variant.chipsetModel || '';
            document.getElementById('variant-os').value = variant.os || '';
            document.getElementById('variant-price-list').value = variant.priceList || '';
            document.getElementById('variant-price-sale').value = variant.priceSale || '';
            document.getElementById('variant-stock').value = variant.stock || '';
            document.getElementById('variant-weight').value = variant.weightG || '';
            document.getElementById('variant-product-id').value = variant.productId || '';

            // Render attributes with existing specs
            renderVariantAttributes(attributes, variant.specs || []);
        }
    } else {
        const form = document.getElementById('variant-form');
        if (form) {
            form.reset();
            if (productId) {
                document.getElementById('variant-product-id').value = productId;
            }
        }
        // Render empty attributes
        renderVariantAttributes(attributes, []);
    }

    openModal('variant-modal');
}

function renderVariantAttributes(attributesList, existingSpecs = []) {
    const container = document.getElementById('variant-attributes-list');
    if (!container) return;

    if (!attributesList || attributesList.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Chưa có thuộc tính nào. Vui lòng thêm thuộc tính trong màn "Thuộc tính hệ thống".</p>';
        return;
    }

    container.innerHTML = attributesList.map(attr => {
        // Find existing spec for this attribute
        const existingSpec = existingSpecs.find(s => s.specAttributeId === attr.id);
        const isChecked = !!existingSpec;
        const existingValue = existingSpec ? existingSpec.value : '';

        const isBool = attr.dataType === 'BOOL';
        const inputType = getAttributeInputType(attr.dataType);
        const stepAttr = (attr.dataType === 'DECIMAL') ? 'step="0.01"' : '';

        return `
            <div style="margin-bottom: 15px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #e0e0e0;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <input type="checkbox" 
                           id="variant-attr-check-${attr.id}" 
                           class="variant-attr-checkbox" 
                           data-attribute-id="${attr.id}"
                           ${isChecked ? 'checked' : ''}
                           style="margin-right: 10px;">
                    <label for="variant-attr-check-${attr.id}" style="font-weight: 500; cursor: pointer; flex: 1;">
                        ${attr.label} <span style="color: #999; font-size: 12px;">(${attr.keyName})</span>
                    </label>
                </div>
                <div class="attribute-value-container" id="variant-attr-value-${attr.id}" style="display: ${isChecked ? 'block' : 'none'}; margin-top: 8px;">
                    ${isBool ? `
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" 
                                   class="variant-attribute-value-input" 
                                   data-attribute-id="${attr.id}"
                                   data-attribute-type="${attr.dataType}"
                                   ${existingValue === 'true' ? 'checked' : ''}
                                   style="margin-right: 8px;">
                            <span>${attr.label}</span>
                        </label>
                    ` : `
                        <input type="${inputType}" 
                               class="variant-attribute-value-input" 
                               data-attribute-id="${attr.id}"
                               data-attribute-type="${attr.dataType}"
                               placeholder="Nhập giá trị cho ${attr.label}"
                               value="${existingValue}"
                               ${stepAttr}
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    `}
                </div>
            </div>
        `;
    }).join('');

    // Add event listeners for checkboxes
    container.querySelectorAll('.variant-attr-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const attrId = this.dataset.attributeId;
            const valueContainer = document.getElementById(`variant-attr-value-${attrId}`);
            if (valueContainer) {
                if (this.checked) {
                    valueContainer.style.display = 'block';
                } else {
                    valueContainer.style.display = 'none';
                    const valueInput = valueContainer.querySelector('.variant-attribute-value-input');
                    if (valueInput) {
                        if (valueInput.type === 'checkbox') {
                            valueInput.checked = false;
                        } else {
                            valueInput.value = '';
                        }
                    }
                }
            }
        });
    });
}

function getAttributeInputType(dataType) {
    switch (dataType) {
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

function getSelectedVariantAttributes() {
    const selectedAttributes = [];
    const container = document.getElementById('variant-attributes-list');
    if (!container) return selectedAttributes;

    container.querySelectorAll('.variant-attr-checkbox:checked').forEach(checkbox => {
        const attrId = checkbox.dataset.attributeId;
        const valueInput = container.querySelector(`.variant-attribute-value-input[data-attribute-id="${attrId}"]`);
        if (valueInput) {
            let value;
            if (valueInput.type === 'checkbox') {
                value = valueInput.checked ? 'true' : 'false';
            } else {
                value = valueInput.value.trim();
            }
            if (value !== '' && (valueInput.type !== 'checkbox' || value === 'true')) {
                selectedAttributes.push({
                    specAttributeId: parseInt(attrId),
                    value: value
                });
            }
        }
    });
    return selectedAttributes;
}

async function saveVariant() {
    const idEl = document.getElementById('variant-id');
    const id = idEl ? idEl.value : null;
    const form = document.getElementById('variant-form');

    if (!form || !form.checkValidity()) {
        if (form) form.reportValidity();
        return;
    }

    const productId = document.getElementById('variant-product-id').value ||
        document.getElementById('variant-product-select').value;

    if (!productId) {
        alert('Vui lòng chọn sản phẩm');
        return;
    }

    const data = {
        productId: Number(productId),
        sku: document.getElementById('variant-sku').value,
        color: document.getElementById('variant-color').value || null,
        ramGb: document.getElementById('variant-ram').value ? Number(document.getElementById('variant-ram').value) : null,
        storageGb: document.getElementById('variant-storage').value ? Number(document.getElementById('variant-storage').value) : null,
        cpuModel: document.getElementById('variant-cpu').value || null,
        igpu: document.getElementById('variant-igpu').value || null,
        gpuModel: document.getElementById('variant-gpu').value || null,
        chipsetModel: document.getElementById('variant-chipset').value || null,
        os: document.getElementById('variant-os').value || null,
        priceList: document.getElementById('variant-price-list').value ? Number(document.getElementById('variant-price-list').value) : null,
        priceSale: Number(document.getElementById('variant-price-sale').value),
        stock: Number(document.getElementById('variant-stock').value),
        weightG: document.getElementById('variant-weight').value ? Number(document.getElementById('variant-weight').value) : null,
        allowPreorder: document.getElementById('variant-allow-preorder')?.checked || false
    };

    let result;
    if (id) {
        result = await fetchAPI(`/variants/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    } else {
        result = await fetchAPI('/variants', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    if (result && result.result) {
        const variantId = result.result.id;
        const selectedAttributes = getSelectedVariantAttributes();

        try {
            // Load existing specs to delete old ones (only for update)
            if (id) {
                const existingSpecs = await fetchAPI(`/variant-specs/variant/${variantId}`);
                if (existingSpecs?.result) {
                    // Delete old specs
                    for (const spec of existingSpecs.result) {
                        await fetchAPI(`/variant-specs/${spec.id}`, { method: 'DELETE' });
                    }
                }
            }

            // Create new specs
            for (const attr of selectedAttributes) {
                await fetchAPI('/variant-specs', {
                    method: 'POST',
                    body: JSON.stringify({
                        productVariantId: variantId,
                        specAttributeId: attr.specAttributeId,
                        value: attr.value
                    })
                });
            }

            closeModal('variant-modal');

            // Reload variants to get updated data
            await loadVariantsForProducts(products.map(p => p.id));
            // Reload product variants to refresh display
            const savedProductId = document.getElementById('variant-product-id').value ||
                document.getElementById('variant-product-select').value;
            if (savedProductId) {
                await loadProductVariants(Number(savedProductId));
                // Expand product if not expanded
                if (!expandedProducts.has(Number(savedProductId))) {
                    expandedProducts.add(Number(savedProductId));
                }
            }

            await loadProducts(productsPagination.page, productsPagination.limit);
            alert(result.message || 'Lưu biến thể thành công');
        } catch (error) {
            console.error('Error saving variant specs:', error);
            alert('Lưu biến thể thành công nhưng có lỗi khi lưu thuộc tính. Vui lòng kiểm tra lại.');
        }
    } else {
        alert('Có lỗi xảy ra khi lưu biến thể');
    }
}

async function editVariant(id) {
    // Expand product if not expanded
    const variant = variants.find(v => v.id === id);
    if (variant) {
        if (!expandedProducts.has(variant.productId)) {
            expandedProducts.add(variant.productId);
            await loadProductVariants(variant.productId);
        }

        // Load variant specs if not loaded
        if (!variant.specs || variant.specs.length === 0) {
            variant.specs = await loadVariantSpecs(id);
        }

        await openVariantModal(id, variant.productId);
    }
}

async function deleteVariant(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa biến thể này?')) return;

    // Get variant to know productId
    const variant = variants.find(v => v.id === id);
    const productId = variant ? variant.productId : null;

    // Delete variant specs first
    const specsData = await fetchAPI(`/variant-specs/variant/${id}`);
    if (specsData?.result) {
        for (const spec of specsData.result) {
            await fetchAPI(`/variant-specs/${spec.id}`, { method: 'DELETE' });
        }
    }

    const result = await fetchAPI(`/variants/${id}`, { method: 'DELETE' });
    if (result) {
        // Remove from variants array
        variants = variants.filter(v => v.id !== id);
        // Reload product variants if productId exists
        if (productId) {
            await loadProductVariants(productId);
        }
        await loadProducts(productsPagination.page, productsPagination.limit);
        alert(result.message || 'Xóa biến thể thành công');
    }
}

function setupProductSearch() {
    const searchInput = document.getElementById('product-search');
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
                productsPagination.page = 1;
                await loadProducts(1, productsPagination.limit);
                return;
            }

            // Search with pagination - reset to page 1
            productsPagination.page = 1;
            const data = await fetchAPI(`/products?page=1&limit=${productsPagination.limit}&search=${encodeURIComponent(searchTerm)}`);
            if (data?.result) {
                if (Array.isArray(data.result)) {
                    // Non-paginated response
                    products = data.result;
                    productsPagination.total = products.length;
                    productsPagination.totalPages = 1;
                } else if (data.result && typeof data.result === 'object' && data.result.result) {
                    // Paginated response
                    products = data.result.result || [];
                    productsPagination.total = data.result.total || 0;
                    productsPagination.totalPages = data.result.totalPages || Math.ceil(productsPagination.total / productsPagination.limit);
                } else {
                    products = [];
                    productsPagination.total = 0;
                    productsPagination.totalPages = 0;
                }
                // Load variants for all products on current page to show price, stock, specs in list
                const productIds = products.map(p => p.id);
                if (productIds.length > 0) {
                    await loadVariantsForProducts(productIds);
                }
                await renderProducts(products);
                updateProductPaginationUI();
            }
        }, 300); // 300ms debounce
    });
}

function setupProductPagination() {
    // Pagination controls will be added to the page
}

function updateProductPaginationUI() {
    const paginationContainer = document.getElementById('products-pagination');
    if (!paginationContainer) return;

    const { page, totalPages, total, limit } = productsPagination;
    const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
    const endItem = Math.min(page * limit, total);

    paginationContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0;">
            <div style="color: #666; font-size: 14px;">
                Hiển thị ${startItem}-${endItem} trong tổng số ${total} sản phẩm
            </div>
            <div style="display: flex; gap: 5px; align-items: center;">
                <button class="btn btn-secondary" 
                        onclick="changeProductPage(${page - 1})" 
                        ${page <= 1 ? 'disabled' : ''}
                        style="padding: 6px 12px; font-size: 12px;">
                    ‹ Trước
                </button>
                <span style="padding: 0 10px; color: #666;">
                    Trang ${page} / ${totalPages || 1}
                </span>
                <button class="btn btn-secondary" 
                        onclick="changeProductPage(${page + 1})" 
                        ${page >= totalPages ? 'disabled' : ''}
                        style="padding: 6px 12px; font-size: 12px;">
                    Sau ›
                </button>
            </div>
        </div>
    `;
}

async function changeProductPage(newPage) {
    if (newPage < 1 || newPage > productsPagination.totalPages) return;
    productsPagination.page = newPage;
    await loadProducts(newPage, productsPagination.limit);
}

// Stock Management Functions
async function openStockEditView(variantId, action) {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) {
        alert('Không tìm thấy biến thể');
        return;
    }

    // Hide all other views
    const listView = document.getElementById('products-list-view');
    const detailView = document.getElementById('product-detail-view');
    const editView = document.getElementById('product-edit-view');
    const stockView = document.getElementById('stock-edit-view');

    if (listView) listView.style.display = 'none';
    if (detailView) detailView.style.display = 'none';
    if (editView) editView.style.display = 'none';
    if (stockView) stockView.style.display = 'block';

    const stockTitle = document.getElementById('stock-edit-title');
    const stockVariantId = document.getElementById('stock-variant-id');
    const stockAction = document.getElementById('stock-action');
    const stockCurrentStock = document.getElementById('stock-current-stock');
    const stockVariantInfo = document.getElementById('stock-variant-info');
    const stockActionText = document.getElementById('stock-action-text');

    if (stockTitle) {
        stockTitle.textContent = action === 'add' ? 'Nhập thêm hàng vào kho' : 'Giảm bớt hàng khỏi kho';
    }
    if (stockVariantId) {
        stockVariantId.value = variantId;
    }
    if (stockAction) {
        stockAction.value = action;
    }
    if (stockCurrentStock) {
        stockCurrentStock.textContent = (variant.stock || 0).toLocaleString('vi-VN');
    }
    if (stockVariantInfo) {
        stockVariantInfo.textContent = `${variant.sku || 'N/A'}${variant.color ? ' - ' + variant.color : ''}`;
    }
    if (stockActionText) {
        stockActionText.textContent = action === 'add' ? 'nhập thêm' : 'giảm bớt';
    }

    // Reset quantity input
    const stockQuantity = document.getElementById('stock-quantity');
    if (stockQuantity) {
        stockQuantity.value = '';
        stockQuantity.focus();
    }
}

function backFromStockEdit() {
    const stockView = document.getElementById('stock-edit-view');
    const listView = document.getElementById('products-list-view');
    const detailView = document.getElementById('product-detail-view');

    if (stockView) stockView.style.display = 'none';

    // Show previous view
    if (selectedProductId && detailView) {
        detailView.style.display = 'block';
    } else if (listView) {
        listView.style.display = 'block';
    }
}


async function saveStock() {
    const variantId = document.getElementById('stock-variant-id')?.value;
    const action = document.getElementById('stock-action')?.value;
    const quantity = document.getElementById('stock-quantity')?.value;

    if (!variantId || !action || !quantity || quantity <= 0) {
        alert('Vui lòng nhập số lượng hợp lệ');
        return;
    }

    const endpoint = action === 'add'
        ? `/variants/${variantId}/stock/add`
        : `/variants/${variantId}/stock/reduce`;

    const result = await fetchAPI(endpoint, {
        method: 'POST',
        body: JSON.stringify({ quantity: Number(quantity) })
    });

    if (result) {
        // Reload variant data
        const variant = variants.find(v => v.id === Number(variantId));
        if (variant) {
            await loadProductVariants(variant.productId);
            if (selectedProductId === variant.productId) {
                await renderVariantsTab();
            }
        }

        backFromStockEdit();
        alert(result.message || 'Cập nhật số lượng thành công');
    }
}


function switchProductTab(tabName) {
    currentProductTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const tab = btn.dataset.tab;
        if (tab === tabName) {
            btn.classList.add('active');
            btn.style.borderBottomColor = '#007bff';
            btn.style.color = '#007bff';
        } else {
            btn.classList.remove('active');
            btn.style.borderBottomColor = 'transparent';
            btn.style.color = '#666';
        }
    });

    // Show/hide tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        if (content.id === `tab-${tabName}`) {
            content.style.display = 'block';
            content.classList.add('active');
        } else {
            content.style.display = 'none';
            content.classList.remove('active');
        }
    });

    // Load content for active tab
    if (tabName === 'info') {
        renderProductInfo();
    } else if (tabName === 'variants') {
        renderVariantsTab();
    } else if (tabName === 'add-variant') {
        prepareVariantForm();
    }
}

async function renderProductInfo() {
    const container = document.getElementById('product-info-detail');
    if (!container || !selectedProductId) return;

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const categoryId = product.categoryIds?.[0] || product.categoryId;
    const category = categories.find(c => c.id === categoryId);
    const brand = brands.find(b => b.id === product.brandId);
    const productVariants = variants.filter(v => v.productId === product.id);

    const minPrice = productVariants.length > 0
        ? Math.min(...productVariants.filter(v => v.priceSale).map(v => v.priceSale))
        : null;
    const maxPrice = productVariants.length > 0
        ? Math.max(...productVariants.filter(v => v.priceSale).map(v => v.priceSale))
        : null;
    const totalStock = productVariants.reduce((sum, v) => sum + (v.stock || 0), 0);

    // Parse images if available
    let imagesList = [];
    try {
        if (product.images) {
            imagesList = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
        }
    } catch (e) {
        console.error('Error parsing images:', e);
    }

    container.innerHTML = `
        <div style="display: grid; grid-template-columns: 300px 1fr; gap: 30px;">
            <div>
                ${product.avatar ? `
                    <img src="${product.avatar}" alt="${product.name}" style="width: 100%; border-radius: 8px; border: 1px solid #eee; margin-bottom: 15px;">
                ` : '<div style="width: 100%; aspect-ratio: 1; background: #f5f5f5; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999; margin-bottom: 15px;">Chưa có ảnh đại diện</div>'}
                
                ${imagesList.length > 0 ? `
                    <div style="margin-top: 15px;">
                        <h4 style="margin-bottom: 10px; font-size: 14px; color: #666;">Ảnh khác:</h4>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
                            ${imagesList.slice(0, 6).map(img => `
                                <img src="${img}" alt="" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 4px; border: 1px solid #eee;">
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
            <div>
                <h3 style="margin-top: 0; margin-bottom: 20px;">Thông tin chi tiết sản phẩm</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 150px; color: #666;">ID:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">#${product.id}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Tên sản phẩm:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>${product.name || '-'}</strong></td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Slug:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${product.slug || '-'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Danh mục:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${category ? category.name : '-'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Thương hiệu:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${brand ? brand.name : '-'}</td>
                            </tr>
                        </table>
                    </div>
                    <div>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 150px; color: #666;">Giá bán:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                                    ${minPrice ? `
                                        <strong style="color: #2196f3; font-size: 18px;">${formatCurrency(minPrice)}</strong>
                                        ${maxPrice && maxPrice !== minPrice ? `<div style="color: #999; font-size: 12px; margin-top: 2px;">~ ${formatCurrency(maxPrice)}</div>` : ''}
                                    ` : '<span style="color: #999;">Chưa có giá</span>'}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Tồn kho:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                                    <strong style="color: ${totalStock < 10 ? '#f44336' : totalStock < 50 ? '#ff9800' : '#4caf50'}; font-size: 16px;">
                                        ${totalStock.toLocaleString('vi-VN')} sản phẩm
                                    </strong>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Số biến thể:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                                    <span style="padding: 4px 8px; background: #e3f2fd; color: #1976d2; border-radius: 4px; font-size: 13px;">
                                        ${productVariants.length} biến thể
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Trạng thái:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                                    <span class="status-badge ${product.status ? 'active' : 'inactive'}" style="padding: 4px 8px;">
                                        ${product.status ? 'Kích hoạt' : 'Tắt'}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #666;">Ngày tạo:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${product.createdAt ? new Date(product.createdAt).toLocaleString('vi-VN') : '-'}</td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                ${product.shortDescription ? `
                    <div style="margin-top: 25px;">
                        <h4 style="margin-bottom: 10px; color: #666;">Mô tả ngắn:</h4>
                        <p style="color: #333; line-height: 1.6;">${product.shortDescription}</p>
                    </div>
                ` : ''}
                
                ${product.description ? `
                    <div style="margin-top: 25px;">
                        <h4 style="margin-bottom: 10px; color: #666;">Mô tả chi tiết:</h4>
                        <div style="color: #333; line-height: 1.6; white-space: pre-wrap;">${product.description}</div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

async function renderVariantsTab() {
    const tbody = document.getElementById('variants-table-body');
    if (!tbody || !selectedProductId) return;

    const productVariants = variants.filter(v => v.productId === selectedProductId);

    if (productVariants.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">Chưa có biến thể nào. Nhấn nút "+ Thêm biến thể mới" để thêm.</td></tr>';
        return;
    }

    // Load specs for all variants
    await Promise.all(productVariants.map(async (variant) => {
        if (!variant.specs || variant.specs.length === 0) {
            variant.specs = await loadVariantSpecs(variant.id);
        }
    }));

    tbody.innerHTML = productVariants.map(variant => {
        const specs = variant.specs || [];
        const specsText = specs.map(s => `${s.attributeLabel}: ${s.value}`).join(', ') || '-';

        return `
            <tr>
                <td>#${variant.id}</td>
                <td><strong>${variant.sku || '-'}</strong></td>
                <td>
                    <strong style="color: #2196f3;">${formatCurrency(variant.priceSale || 0)}</strong>
                    ${variant.priceList && variant.priceList > variant.priceSale ? `
                        <div style="text-decoration: line-through; color: #999; font-size: 11px;">
                            ${formatCurrency(variant.priceList)}
                        </div>
                    ` : ''}
                </td>
                <td>
                    <strong style="color: ${variant.stock < 10 ? '#f44336' : variant.stock < 50 ? '#ff9800' : '#4caf50'};">
                        ${variant.stock || 0}
                    </strong>
                </td>
                <td style="font-size: 12px; color: #666;">
                    ${specsText}
                    ${variant.ramGb ? `<br>RAM: ${variant.ramGb}GB` : ''}
                    ${variant.storageGb ? `<br>SSD: ${variant.storageGb}GB` : ''}
                </td>
                <td>
                    <button class="btn btn-edit" onclick="editVariantFromTab(${variant.id})" style="padding: 4px 8px; font-size: 11px; margin-right: 3px;">Sửa</button>
                    <button class="btn btn-primary" onclick="openStockEditView(${variant.id}, 'add')" style="padding: 4px 8px; font-size: 11px; margin-right: 3px;" title="Nhập thêm">+</button>
                    <button class="btn btn-secondary" onclick="openStockEditView(${variant.id}, 'reduce')" style="padding: 4px 8px; font-size: 11px; margin-right: 3px;" title="Giảm bớt">-</button>
                    <button class="btn btn-danger" onclick="deleteVariantFromTab(${variant.id})" style="padding: 4px 8px; font-size: 11px;">Xóa</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function prepareVariantForm() {
    if (!selectedProductId) {
        alert('Vui lòng chọn sản phẩm trước');
        switchProductTab('variants');
        return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    // Reset form
    document.getElementById('variant-form-tab').reset();
    document.getElementById('variant-id-tab').value = '';
    document.getElementById('variant-product-id-tab').value = selectedProductId;
    document.getElementById('variant-product-name-tab').value = product.name || '';
    const allowPreorderCheckbox = document.getElementById('variant-allow-preorder-tab');
    if (allowPreorderCheckbox) {
        allowPreorderCheckbox.checked = false;
    }

    // Load attributes
    if (attributes.length === 0) {
        await loadAttributes();
    }

    renderVariantAttributesTab(attributes, []);
}

function renderVariantAttributesTab(attributesList, existingSpecs = []) {
    const container = document.getElementById('variant-attributes-list-tab');
    if (!container) return;

    if (!attributesList || attributesList.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Chưa có thuộc tính nào.</p>';
        return;
    }

    container.innerHTML = attributesList.map(attr => {
        const existingSpec = existingSpecs.find(s => s.specAttributeId === attr.id);
        const isChecked = !!existingSpec;
        const existingValue = existingSpec ? existingSpec.value : '';

        const isBool = attr.dataType === 'BOOL';
        const inputType = getAttributeInputType(attr.dataType);
        const stepAttr = (attr.dataType === 'DECIMAL') ? 'step="0.01"' : '';

        return `
            <div style="margin-bottom: 15px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #e0e0e0;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <input type="checkbox" 
                           id="variant-attr-check-tab-${attr.id}" 
                           class="variant-attr-checkbox-tab" 
                           data-attribute-id="${attr.id}"
                           ${isChecked ? 'checked' : ''}
                           style="margin-right: 10px;">
                    <label for="variant-attr-check-tab-${attr.id}" style="font-weight: 500; cursor: pointer; flex: 1;">
                        ${attr.label} <span style="color: #999; font-size: 12px;">(${attr.keyName})</span>
                    </label>
                </div>
                <div class="attribute-value-container" id="variant-attr-value-tab-${attr.id}" style="display: ${isChecked ? 'block' : 'none'}; margin-top: 8px;">
                    ${isBool ? `
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" 
                                   class="variant-attribute-value-input-tab" 
                                   data-attribute-id="${attr.id}"
                                   data-attribute-type="${attr.dataType}"
                                   ${existingValue === 'true' ? 'checked' : ''}
                                   style="margin-right: 8px;">
                            <span>${attr.label}</span>
                        </label>
                    ` : `
                        <input type="${inputType}" 
                               class="variant-attribute-value-input-tab" 
                               data-attribute-id="${attr.id}"
                               data-attribute-type="${attr.dataType}"
                               placeholder="Nhập giá trị cho ${attr.label}"
                               value="${existingValue}"
                               ${stepAttr}
                               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    `}
                </div>
            </div>
        `;
    }).join('');

    // Add event listeners
    container.querySelectorAll('.variant-attr-checkbox-tab').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const attrId = this.dataset.attributeId;
            const valueContainer = document.getElementById(`variant-attr-value-tab-${attrId}`);
            if (valueContainer) {
                valueContainer.style.display = this.checked ? 'block' : 'none';
                if (!this.checked) {
                    const valueInput = valueContainer.querySelector('.variant-attribute-value-input-tab');
                    if (valueInput) {
                        if (valueInput.type === 'checkbox') {
                            valueInput.checked = false;
                        } else {
                            valueInput.value = '';
                        }
                    }
                }
            }
        });
    });
}

function getSelectedVariantAttributesTab() {
    const selectedAttributes = [];
    const container = document.getElementById('variant-attributes-list-tab');
    if (!container) return selectedAttributes;

    container.querySelectorAll('.variant-attr-checkbox-tab:checked').forEach(checkbox => {
        const attrId = checkbox.dataset.attributeId;
        const valueInput = container.querySelector(`.variant-attribute-value-input-tab[data-attribute-id="${attrId}"]`);
        if (valueInput) {
            let value;
            if (valueInput.type === 'checkbox') {
                value = valueInput.checked ? 'true' : 'false';
            } else {
                value = valueInput.value.trim();
            }
            if (value !== '' && (valueInput.type !== 'checkbox' || value === 'true')) {
                selectedAttributes.push({
                    specAttributeId: parseInt(attrId),
                    value: value
                });
            }
        }
    });
    return selectedAttributes;
}

async function saveVariantFromTab() {
    const form = document.getElementById('variant-form-tab');
    if (!form || !form.checkValidity()) {
        if (form) form.reportValidity();
        return;
    }

    const id = document.getElementById('variant-id-tab').value;
    const productId = document.getElementById('variant-product-id-tab').value;

    if (!productId) {
        alert('Vui lòng chọn sản phẩm');
        return;
    }

    const data = {
        productId: Number(productId),
        sku: document.getElementById('variant-sku-tab').value,
        color: document.getElementById('variant-color-tab').value || null,
        ramGb: document.getElementById('variant-ram-tab').value ? Number(document.getElementById('variant-ram-tab').value) : null,
        storageGb: document.getElementById('variant-storage-tab').value ? Number(document.getElementById('variant-storage-tab').value) : null,
        cpuModel: document.getElementById('variant-cpu-tab').value || null,
        igpu: document.getElementById('variant-igpu-tab').value || null,
        gpuModel: document.getElementById('variant-gpu-tab').value || null,
        chipsetModel: document.getElementById('variant-chipset-tab').value || null,
        os: document.getElementById('variant-os-tab').value || null,
        priceList: document.getElementById('variant-price-list-tab').value ? Number(document.getElementById('variant-price-list-tab').value) : null,
        priceSale: Number(document.getElementById('variant-price-sale-tab').value),
        stock: Number(document.getElementById('variant-stock-tab').value),
        weightG: document.getElementById('variant-weight-tab').value ? Number(document.getElementById('variant-weight-tab').value) : null,
        allowPreorder: document.getElementById('variant-allow-preorder-tab')?.checked || false
    };

    let result;
    if (id) {
        result = await fetchAPI(`/variants/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    } else {
        result = await fetchAPI('/variants', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    if (result && result.result) {
        const variantId = result.result.id;
        const selectedAttributes = getSelectedVariantAttributesTab();

        try {
            if (id) {
                const existingSpecs = await fetchAPI(`/variant-specs/variant/${variantId}`);
                if (existingSpecs?.result) {
                    for (const spec of existingSpecs.result) {
                        await fetchAPI(`/variant-specs/${spec.id}`, { method: 'DELETE' });
                    }
                }
            }

            for (const attr of selectedAttributes) {
                await fetchAPI('/variant-specs', {
                    method: 'POST',
                    body: JSON.stringify({
                        productVariantId: variantId,
                        specAttributeId: attr.specAttributeId,
                        value: attr.value
                    })
                });
            }

            // Reload variants
            await loadProductVariants(Number(productId));
            await renderVariantsTab();

            const variantsCountView = document.getElementById('variants-count-view');
            if (variantsCountView) {
                variantsCountView.textContent = variants.filter(v => v.productId === Number(productId)).length;
            }

            // Reset form and switch to variants tab
            document.getElementById('variant-form-tab').reset();
            document.getElementById('variant-id-tab').value = '';
            switchProductTab('variants');

            alert(result.message || 'Lưu biến thể thành công');
        } catch (error) {
            console.error('Error saving variant specs:', error);
            alert('Lưu biến thể thành công nhưng có lỗi khi lưu thuộc tính.');
        }
    } else {
        alert('Có lỗi xảy ra khi lưu biến thể');
    }
}

async function editVariantFromTab(variantId) {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;

    // Load variant specs if not loaded
    if (!variant.specs || variant.specs.length === 0) {
        variant.specs = await loadVariantSpecs(variantId);
    }

    // Fill form
    document.getElementById('variant-id-tab').value = variant.id;
    document.getElementById('variant-product-id-tab').value = variant.productId;
    document.getElementById('variant-sku-tab').value = variant.sku || '';
    document.getElementById('variant-color-tab').value = variant.color || '';
    document.getElementById('variant-ram-tab').value = variant.ramGb || '';
    document.getElementById('variant-storage-tab').value = variant.storageGb || '';
    document.getElementById('variant-cpu-tab').value = variant.cpuModel || '';
    document.getElementById('variant-igpu-tab').value = variant.igpu || '';
    document.getElementById('variant-gpu-tab').value = variant.gpuModel || '';
    document.getElementById('variant-chipset-tab').value = variant.chipsetModel || '';
    document.getElementById('variant-os-tab').value = variant.os || '';
    document.getElementById('variant-price-list-tab').value = variant.priceList || '';
    document.getElementById('variant-price-sale-tab').value = variant.priceSale || '';
    document.getElementById('variant-stock-tab').value = variant.stock || '';
    document.getElementById('variant-weight-tab').value = variant.weightG || '';
    const allowPreorderCheckbox = document.getElementById('variant-allow-preorder-tab');
    if (allowPreorderCheckbox) {
        allowPreorderCheckbox.checked = !!variant.allowPreorder;
    }

    const product = products.find(p => p.id === variant.productId);
    if (product) {
        document.getElementById('variant-product-name-tab').value = product.name || '';
    }

    // Load attributes and render with existing specs
    if (attributes.length === 0) {
        await loadAttributes();
    }
    renderVariantAttributesTab(attributes, variant.specs || []);

    // Switch to add-variant tab
    switchProductTab('add-variant');
}

async function deleteVariantFromTab(variantId) {
    if (!confirm('Bạn có chắc chắn muốn xóa biến thể này?')) return;

    const variant = variants.find(v => v.id === variantId);
    const productId = variant ? variant.productId : null;

    // Delete variant specs first
    const specsData = await fetchAPI(`/variant-specs/variant/${variantId}`);
    if (specsData?.result) {
        for (const spec of specsData.result) {
            await fetchAPI(`/variant-specs/${spec.id}`, { method: 'DELETE' });
        }
    }

    const result = await fetchAPI(`/variants/${variantId}`, { method: 'DELETE' });
    if (result) {
        variants = variants.filter(v => v.id !== variantId);
        if (productId) {
            await loadProductVariants(productId);
        }
        await renderVariantsTab();

        const variantsCountView = document.getElementById('variants-count-view');
        if (variantsCountView) {
            variantsCountView.textContent = variants.filter(v => v.productId === productId).length;
        }

        await renderProducts(products);
        alert(result.message || 'Xóa biến thể thành công');
    }
}

function cancelVariantForm() {
    document.getElementById('variant-form-tab').reset();
    document.getElementById('variant-id-tab').value = '';
    switchProductTab('variants');
}

async function editSelectedProduct() {
    if (!selectedProductId) return;
    await openProductEditView(selectedProductId);
}

async function deleteSelectedProduct() {
    if (!selectedProductId) return;
    await deleteProduct(selectedProductId);
    backToProductsList();
}

// Expose to window
window.loadProductsPage = loadProductsPage;
window.openProductEditView = openProductEditView;
window.backFromProductEdit = backFromProductEdit;
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.openVariantModal = openVariantModal;
window.saveVariant = saveVariant;
window.editVariant = editVariant;
window.deleteVariant = deleteVariant;
window.changeProductPage = changeProductPage;
window.openStockEditView = openStockEditView;
window.backFromStockEdit = backFromStockEdit;
window.saveStock = saveStock;
window.selectProduct = selectProduct;
window.switchProductTab = switchProductTab;
window.editVariantFromTab = editVariantFromTab;
window.deleteVariantFromTab = deleteVariantFromTab;
window.saveVariantFromTab = saveVariantFromTab;
window.cancelVariantForm = cancelVariantForm;
window.editSelectedProduct = editSelectedProduct;
window.deleteSelectedProduct = deleteSelectedProduct;
window.backToProductsList = backToProductsList;

