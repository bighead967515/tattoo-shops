import { supabaseAdmin } from './supabase';

const BUCKET_NAME = 'portfolio-images';

/**
 * Supabase Storage helpers
 * Replaces Manus Forge storage with Supabase Storage
 */

/**
 * Upload a file to Supabase Storage
 * @param path - Relative path in bucket (e.g., "artists/123/image.jpg")
 * @param data - File buffer, Uint8Array, or Blob
 * @param contentType - MIME type (e.g., "image/jpeg")
 * @returns Public URL of uploaded file
 */
export async function uploadFile(
  path: string,
  data: Buffer | Uint8Array | Blob,
  contentType: string
): Promise<string> {
  const { data: uploadData, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(path, data, {
      contentType,
      upsert: true, // Overwrite if exists
    });

  if (error) {
    console.error('[Storage] Upload failed:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(uploadData.path);

  return urlData.publicUrl;
}

/**
 * Delete a file from Supabase Storage
 * @param path - Relative path in bucket
 */
export async function deleteFile(path: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    console.error('[Storage] Delete failed:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Delete multiple files from Supabase Storage
 * @param paths - Array of relative paths in bucket
 */
export async function deleteFiles(paths: string[]): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .remove(paths);

  if (error) {
    console.error('[Storage] Batch delete failed:', error);
    throw new Error(`Failed to delete files: ${error.message}`);
  }
}

/**
 * Get public URL for a file
 * @param path - Relative path in bucket
 * @returns Public URL
 */
export function getPublicUrl(path: string): string {
  const { data } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Create a signed URL for temporary access
 * @param path - Relative path in bucket
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL
 */
export async function createSignedUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('[Storage] Create signed URL failed:', error);
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * List files in a directory
 * @param path - Directory path (e.g., "artists/123")
 * @returns Array of file objects
 */
export async function listFiles(path: string) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .list(path);

  if (error) {
    console.error('[Storage] List files failed:', error);
    throw new Error(`Failed to list files: ${error.message}`);
  }

  return data;
}

/**
 * Initialize storage bucket (run once on setup)
 * Creates the bucket if it doesn't exist and sets it to public
 */
export async function initializeBucket() {
  // Check if bucket exists
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

  if (!bucketExists) {
    // Create bucket
    const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
      public: true, // Make bucket public for direct image access
      fileSizeLimit: 5242880, // 5MB limit
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
    });

    if (createError) {
      console.error('[Storage] Failed to create bucket:', createError);
      throw new Error(`Failed to create storage bucket: ${createError.message}`);
    }

    console.log('[Storage] Bucket created successfully');
  }
}
