/**
 * Product Image Manager Component
 * Quản lý upload, preview, và xóa ảnh sản phẩm
 */

class ProductImageManager {
    constructor() {
        this.avatarFile = null;
        this.galleryFiles = [];
        this.uploadedImages = {
            avatar: null,
            gallery: []
        };
    }

    /**
     * Khởi tạo event listeners cho form
     */
    init() {
        // Avatar upload
        const avatarInput = document.getElementById('product-avatar-input');
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => this.handleAvatarSelect(e));
        }

        // Gallery upload
        const galleryInput = document.getElementById('product-gallery-input');
        if (galleryInput) {
            galleryInput.addEventListener('change', (e) => this.handleGallerySelect(e));
        }

        // Avatar preview click
        const avatarPreview = document.getElementById('product-avatar-preview');
        if (avatarPreview) {
            avatarPreview.addEventListener('click', () => avatarInput?.click());
        }

        // Gallery add button
        const addGalleryBtn = document.getElementById('add-gallery-image-btn');
        if (addGalleryBtn) {
            addGalleryBtn.addEventListener('click', () => galleryInput?.click());
        }
    }

    /**
     * Xử lý chọn ảnh avatar
     */
    handleAvatarSelect(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate
        if (!this.validateImageFile(file)) return;

        this.avatarFile = file;
        this.showAvatarPreview(file);
    }

    /**
     * Xử lý chọn ảnh gallery
     */
    handleGallerySelect(event) {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        // Validate all files
        const validFiles = files.filter(file => this.validateImageFile(file));
        if (validFiles.length === 0) return;

        this.galleryFiles = [...this.galleryFiles, ...validFiles];
        this.renderGalleryPreviews();
    }

    /**
     * Validate image file
     */
    validateImageFile(file) {
        // Check type
        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file ảnh hợp lệ');
            return false;
        }

        // Check size (5MB max)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('Dung lượng ảnh không được vượt quá 5MB');
            return false;
        }

        return true;
    }

    /**
     * Hiển thị preview avatar
     */
    showAvatarPreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('product-avatar-preview');
            if (preview) {
                preview.innerHTML = `
                    <img src="${e.target?.result}" alt="Avatar preview" style="width: 100%; height: 100%; object-fit: cover;">
                    <div style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; z-index: 10;">
                        Chưa upload
                    </div>
                `;
                preview.style.position = 'relative'; // Fix positioning
            }
        };
        reader.readAsDataURL(file);
    }

    /**
     * Hiển thị preview gallery
     */
    renderGalleryPreviews() {
        const container = document.getElementById('gallery-previews-container');
        if (!container) return;

        // Clear container trước
        container.innerHTML = '';

        // Nếu không có file, return luôn
        if (this.galleryFiles.length === 0) {
            return;
        }

        // Tạo promise array để xử lý FileReader async
        const readerPromises = this.galleryFiles.map((file, index) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    resolve({
                        dataUrl: e.target?.result,
                        index: index
                    });
                };
                reader.readAsDataURL(file);
            });
        });

        // Chờ tất cả FileReader xong rồi render
        Promise.all(readerPromises).then((results) => {
            const html = results.map((result) => `
                <div style="position: relative; width: 100%; padding-bottom: 100%; background: #f0f0f0; border-radius: 4px; overflow: hidden;">
                    <img src="${result.dataUrl}" alt="Gallery preview ${result.index}" 
                         style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
                    <button type="button" onclick="productImageManager.removeGalleryImage(${result.index})"
                            style="position: absolute; top: 5px; right: 5px; background: #ff4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; z-index: 10;">
                        Xóa
                    </button>
                    <div style="position: absolute; bottom: 5px; left: 5px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">
                        Chưa upload
                    </div>
                </div>
            `).join('');

            container.innerHTML = html;
        });
    }

    /**
     * Xóa ảnh khỏi danh sách gallery
     */
    removeGalleryImage(index) {
        this.galleryFiles.splice(index, 1);
        this.renderGalleryPreviews();

        // Cập nhật hidden input
        if (this.galleryFiles.length === 0) {
            document.getElementById('product-gallery-hidden').value = '';
        }
    }

    /**
     * Upload avatar và gallery lên Supabase
     */
    async uploadImages() {
        try {
            // Upload avatar
            if (this.avatarFile) {
                const avatarUrl = await uploadImageToSupabase(this.avatarFile, 'product-avatars');
                this.uploadedImages.avatar = avatarUrl;
            }

            // Upload gallery
            if (this.galleryFiles.length > 0) {
                const galleryUrls = await uploadMultipleImages(this.galleryFiles, 'product-gallery');
                this.uploadedImages.gallery = galleryUrls;
            }

            return this.uploadedImages;
        } catch (error) {
            alert(`Lỗi upload ảnh: ${error.message}`);
            throw error;
        }
    }

    /**
     * Lấy dữ liệu ảnh để lưu
     */
    getImageData() {
        return {
            avatar: this.uploadedImages.avatar || document.getElementById('product-avatar-hidden')?.value || null,
            images: this.uploadedImages.gallery.length > 0
                ? this.uploadedImages.gallery.join(',')
                : document.getElementById('product-gallery-hidden')?.value || null,
            firstImage: this.uploadedImages.gallery[0] || this.uploadedImages.avatar || null
        };
    }

    /**
     * Reset form
     */
    reset() {
        this.avatarFile = null;
        this.galleryFiles = [];
        this.uploadedImages = { avatar: null, gallery: [] };

        // Clear inputs
        const avatarInput = document.getElementById('product-avatar-input');
        const galleryInput = document.getElementById('product-gallery-input');
        if (avatarInput) avatarInput.value = '';
        if (galleryInput) galleryInput.value = '';

        // Clear previews
        const preview = document.getElementById('product-avatar-preview');
        if (preview) preview.innerHTML = '<span style="color: #999;">Chọn ảnh đại diện</span>';

        const container = document.getElementById('gallery-previews-container');
        if (container) container.innerHTML = '';
    }

    /**
     * Load ảnh cũ khi sửa sản phẩm
     */
    loadExistingImages(product) {
        if (product.avatar) {
            document.getElementById('product-avatar-hidden').value = product.avatar;
            this.uploadedImages.avatar = product.avatar;
            this.showAvatarPreviewFromUrl(product.avatar);
        }

        if (product.images) {
            let imageUrls = [];

            // Check if images is JSON array string like ["url1", "url2"]
            if (product.images.trim().startsWith('[')) {
                try {
                    imageUrls = JSON.parse(product.images);
                } catch (e) {
                    // If parse fails, treat as comma-separated
                    imageUrls = product.images.split(',').filter(url => url.trim());
                }
            } else {
                // Comma-separated URLs
                imageUrls = product.images.split(',').filter(url => url.trim());
            }

            document.getElementById('product-gallery-hidden').value = imageUrls.join(',');
            this.uploadedImages.gallery = imageUrls;
            this.showGalleryPreviewsFromUrl(imageUrls);
        }
    }

    /**
     * Hiển thị preview từ URL
     */
    showAvatarPreviewFromUrl(url) {
        const preview = document.getElementById('product-avatar-preview');
        if (preview) {
            preview.innerHTML = `
                <img src="${url}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">
            `;
            preview.style.position = 'relative';
        }
    }

    /**
     * Hiển thị gallery preview từ URL
     */
    showGalleryPreviewsFromUrl(urls) {
        const container = document.getElementById('gallery-previews-container');
        if (!container) return;

        if (urls.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = urls.map((url, index) => `
            <div style="position: relative; width: 100%; padding-bottom: 100%; background: #f0f0f0; border-radius: 4px; overflow: hidden;">
                <img src="${url}" alt="Gallery image ${index}" 
                     style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">
                <button type="button" onclick="productImageManager.removeExistingGalleryImage('${url.replace(/'/g, "\\'")}')"
                        style="position: absolute; top: 5px; right: 5px; background: #ff4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; z-index: 10;">
                    Xóa
                </button>
                <div style="position: absolute; bottom: 5px; left: 5px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">
                    Đã upload
                </div>
            </div>
        `).join('');
    }

    /**
     * Xóa ảnh gallery hiện có
     */
    removeExistingGalleryImage(url) {
        if (confirm('Xác nhận xóa ảnh này?')) {
            this.uploadedImages.gallery = this.uploadedImages.gallery.filter(img => img !== url);
            const container = document.getElementById('gallery-previews-container');
            if (container) {
                this.showGalleryPreviewsFromUrl(this.uploadedImages.gallery);
            }
            document.getElementById('product-gallery-hidden').value = this.uploadedImages.gallery.join(',');
        }
    }
}

// Khởi tạo instance toàn cục
const productImageManager = new ProductImageManager();
