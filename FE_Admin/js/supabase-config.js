/**
 * Supabase Configuration
 * Lưu ý: Cần thêm SUPABASE_URL và SUPABASE_ANON_KEY vào environment hoặc config
 * 
 * Cách lấy credentials:
 * 1. Truy cập: https://app.supabase.com
 * 2. Chọn project của bạn
 * 3. Vào Settings → API
 * 4. Copy:
 *    - Project URL (URL)
 *    - anon/public key (Key bắt đầu bằng eyJhbGciOiJIUzI1...)
 */

// Config Supabase - Thay thế với credentials thật của bạn
const SUPABASE_URL = 'https://btplaffjvmwyaszcacqi.supabase.co';
// ⚠️ QUAN TRỌNG: Anon key phải có format JWT (bắt đầu bằng eyJ...)
// VÍ DỤ: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpa2Z4Znhrb2ZlbHFpdnVwanhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODEyMzQ1NjcsImV4cCI6MTk5NjgxMDU2N30...'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0cGxhZmZqdm13eWFzemNhY3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMDE0NDYsImV4cCI6MjA5MTU3NzQ0Nn0.XdbyT6GZJQvOy5cq6HorFvAEHiEE4_GsWk0Ad4wuf4w'; // Replace with your actual anon key
const STORAGE_BUCKET = 'images'; // Tên bucket trong Supabase Storage

/**
 * Upload ảnh lên Supabase Storage
 * @param {File} file - File ảnh cần upload
 * @param {string} folder - Folder trong bucket (vd: 'avatars', 'gallery')
 * @returns {Promise<string>} - URL của ảnh đã upload
 */
async function uploadImageToSupabase(file, folder = 'products') {
    try {
        if (!file || !file.type.startsWith('image/')) {
            throw new Error('Vui lòng chọn file ảnh hợp lệ');
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error('Dung lượng ảnh không được vượt quá 5MB');
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const fileExt = file.name.split('.').pop();
        const filename = `${folder}/${timestamp}-${randomStr}.${fileExt}`;

        // Upload to Supabase Storage using REST API
        const uploadResponse = await fetch(
            `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${filename}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': file.type,
                    'x-upsert': 'false'
                },
                body: file,
            }
        );

        if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}));
            throw new Error(errorData.message || `Upload thất bại: ${uploadResponse.status}`);
        }

        // Return public URL
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${filename}`;
        return publicUrl;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

/**
 * Upload nhiều ảnh cùng lúc
 * @param {FileList|Array} files - Danh sách file ảnh
 * @param {string} folder - Folder trong bucket
 * @returns {Promise<Array>} - Danh sách URL của ảnh đã upload
 */
async function uploadMultipleImages(files, folder = 'products') {
    try {
        const uploadPromises = Array.from(files).map(file =>
            uploadImageToSupabase(file, folder)
        );
        return await Promise.all(uploadPromises);
    } catch (error) {
        console.error('Multi-upload error:', error);
        throw error;
    }
}

/**
 * Xóa ảnh từ Supabase Storage
 * @param {string} imageUrl - URL của ảnh cần xóa
 * @returns {Promise<void>}
 */
async function deleteImageFromSupabase(imageUrl) {
    try {
        // Extract path from URL
        const urlParts = imageUrl.split(`/${STORAGE_BUCKET}/`);
        if (urlParts.length !== 2) {
            throw new Error('Invalid image URL');
        }
        const filePath = urlParts[1];

        const deleteResponse = await fetch(
            `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${filePath}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                },
            }
        );

        if (!deleteResponse.ok) {
            throw new Error('Xóa ảnh thất bại');
        }
    } catch (error) {
        console.error('Delete error:', error);
        throw error;
    }
}
