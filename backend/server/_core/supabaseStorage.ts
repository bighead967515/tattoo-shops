import { supabaseAdmin } from "./supabase";

export const BUCKETS = {
  PORTFOLIO_IMAGES: "portfolio-images",
  REQUEST_IMAGES: "request-images",
  ID_DOCUMENTS: "id-documents",
};

const BUCKET_CONFIGS = [
  {
    name: BUCKETS.PORTFOLIO_IMAGES,
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/jpg", "image/webp"],
  },
  {
    name: BUCKETS.REQUEST_IMAGES,
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/jpg", "image/webp"],
  },
  {
    name: BUCKETS.ID_DOCUMENTS,
    public: false, // PRIVATE
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ],
  },
];

/**
 * Supabase Storage helpers
 */

/**
 * Upload a file to a specific Supabase Storage bucket
 * @param bucketName - The name of the bucket
 * @param path - Relative path in bucket (e.g., "artists/123/image.jpg")
 * @param data - File buffer, Uint8Array, or Blob
 * @param contentType - MIME type (e.g., "image/jpeg")
 */
export async function uploadFile(
  bucketName: string,
  path: string,
  data: Buffer | Uint8Array | Blob,
  contentType: string,
): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(path, data, {
      contentType,
      upsert: true, // Overwrite if exists
    });

  if (error) {
    console.error(`[Storage] Upload to bucket "${bucketName}" failed:`, error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Delete a file from a specific Supabase Storage bucket
 * @param bucketName - The name of the bucket
 * @param path - Relative path in bucket
 */
export async function deleteFile(
  bucketName: string,
  path: string,
): Promise<void> {
  const { error } = await supabaseAdmin.storage.from(bucketName).remove([path]);

  if (error) {
    console.error(
      `[Storage] Delete from bucket "${bucketName}" failed:`,
      error,
    );
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Delete multiple files from a specific Supabase Storage bucket
 * @param bucketName - The name of the bucket
 * @param paths - Array of relative paths in bucket
 */
export async function deleteFiles(
  bucketName: string,
  paths: string[],
): Promise<void> {
  const { error } = await supabaseAdmin.storage.from(bucketName).remove(paths);

  if (error) {
    console.error(
      `[Storage] Batch delete from bucket "${bucketName}" failed:`,
      error,
    );
    throw new Error(`Failed to delete files: ${error.message}`);
  }
}

/**
 * Get public URL for a file in a PUBLIC bucket
 * @param bucketName - The name of the bucket
 * @param path - Relative path in bucket
 * @returns Public URL
 */
export function getPublicUrl(bucketName: string, path: string): string {
  const { data } = supabaseAdmin.storage.from(bucketName).getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Create a signed URL for temporary access to a file in ANY bucket (public or private)
 * @param bucketName - The name of the bucket
 * @param path - Relative path in bucket
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL
 */
export async function createSignedUrl(
  bucketName: string,
  path: string,
  expiresIn: number = 3600,
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error(
      `[Storage] Create signed URL for bucket "${bucketName}" failed:`,
      error,
    );
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * Create a signed upload URL for client-side uploads to a specific bucket
 * @param bucketName - The name of the bucket
 * @param path - Relative path in bucket
 * @returns Object containing signed URL and path
 */
export async function createSignedUploadUrl(
  bucketName: string,
  path: string,
): Promise<{ signedUrl: string; path: string }> {
  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .createSignedUploadUrl(path);

  if (error) {
    console.error(
      `[Storage] Create signed upload URL for bucket "${bucketName}" failed:`,
      error,
    );
    throw new Error(`Failed to create signed upload URL: ${error.message}`);
  }

  return { signedUrl: data.signedUrl, path };
}

/**
 * List files in a directory within a specific bucket
 * @param bucketName - The name of the bucket
 * @param path - Directory path (e.g., "artists/123")
 * @returns Array of file objects
 */
export async function listFiles(bucketName: string, path: string) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .list(path);

  if (error) {
    console.error(
      `[Storage] List files in bucket "${bucketName}" failed:`,
      error,
    );
    throw new Error(`Failed to list files: ${error.message}`);
  }

  return data;
}

/**
 * Initialize all storage buckets defined in BUCKET_CONFIGS
 * Creates each bucket if it doesn't exist with its specified settings.
 */
export async function initializeBuckets() {
  const { data: existingBuckets, error: listError } =
    await supabaseAdmin.storage.listBuckets();

  if (listError) {
    console.error("[Storage] Failed to list buckets:", listError);
    throw new Error(`Failed to list storage buckets: ${listError.message}`);
  }

  for (const config of BUCKET_CONFIGS) {
    const bucketExists = existingBuckets.some((b) => b.name === config.name);
    if (!bucketExists) {
      console.log(`[Storage] Bucket "${config.name}" not found. Creating...`);
      const { error: createError } = await supabaseAdmin.storage.createBucket(
        config.name,
        {
          public: config.public,
          fileSizeLimit: config.fileSizeLimit,
          allowedMimeTypes: config.allowedMimeTypes,
        },
      );

      if (createError) {
        console.error(
          `[Storage] Failed to create bucket "${config.name}":`,
          createError,
        );
        // Don't throw, just log the error and continue, so one failure doesn't stop others
      } else {
        console.log(`[Storage] Bucket "${config.name}" created successfully.`);
      }
    }
  }
}
