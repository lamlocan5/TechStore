/**
 * Supabase Storage Configuration for Avatar Upload
 * Using REST API approach (no Supabase client library needed)
 */

// Supabase Configuration
export const SUPABASE_CONFIG = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key',
    storageBucket: 'images', // Bucket name in Supabase Storage
};

/**
 * Upload avatar image to Supabase Storage
 * @param file - Image file to upload
 * @param userId - User ID for unique filename
 * @returns Public URL of uploaded image
 */
export async function uploadAvatarToSupabase(file: File, userId: string): Promise<string> {
    try {
        // Generate unique filename
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}_${timestamp}.${fileExt}`;
        const filePath = `${fileName}`; // Remove nested folder to avoid confusion

        // Upload using REST API
        const uploadUrl = `${SUPABASE_CONFIG.url}/storage/v1/object/${SUPABASE_CONFIG.storageBucket}/${filePath}`;

        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
                'Content-Type': file.type,
                'x-upsert': 'true', // Allow overwrite if file exists
            },
            body: file,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Supabase upload error:', errorText);

            // Provide helpful error message
            if (errorText.includes('Bucket not found')) {
                throw new Error(
                    'Bucket "avatars" chưa được tạo trong Supabase. ' +
                    'Vui lòng:\n' +
                    '1. Vào https://supabase.com/dashboard\n' +
                    '2. Chọn project của bạn\n' +
                    '3. Vào Storage -> Create bucket\n' +
                    '4. Tạo bucket tên "avatars" và BẬT "Public bucket"'
                );
            }

            throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }

        // Get public URL
        const publicUrl = `${SUPABASE_CONFIG.url}/storage/v1/object/public/${SUPABASE_CONFIG.storageBucket}/${filePath}`;

        return publicUrl;
    } catch (error) {
        console.error('Error uploading avatar to Supabase:', error);
        throw error;
    }
}

/**
 * Delete avatar from Supabase Storage
 * @param imageUrl - Full URL of image to delete
 */
export async function deleteAvatarFromSupabase(imageUrl: string): Promise<void> {
    try {
        // Extract file path from URL
        const urlParts = imageUrl.split(`/object/public/${SUPABASE_CONFIG.storageBucket}/`);
        if (urlParts.length < 2) {
            throw new Error('Invalid image URL');
        }

        const filePath = urlParts[1];

        // Delete using REST API
        const deleteUrl = `${SUPABASE_CONFIG.url}/storage/v1/object/${SUPABASE_CONFIG.storageBucket}/${filePath}`;

        const response = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Supabase delete error:', errorText);
            throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error deleting avatar from Supabase:', error);
        throw error;
    }
}
