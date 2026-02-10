import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { users, verificationDocuments } from "../drizzle/schema";
import { BUCKETS, createSignedUploadUrl } from "./_core/supabaseStorage";
import { TRPCError } from "@trpc/server";
import path from "path";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  return db;
}

/**
 * Sanitize a filename to prevent path traversal attacks.
 */
function sanitizeFileName(fileName: string, maxLength = 100): string {
  let sanitized = path.basename(fileName);
  sanitized = sanitized.replace(/[\\\0]/g, '');
  sanitized = sanitized.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  sanitized = sanitized.replace(/_+/g, '_');
  sanitized = sanitized.substring(0, maxLength);
  if (!sanitized || sanitized === '.' || sanitized === '..') {
    sanitized = `upload_${Date.now()}`;
  }
  return sanitized;
}

export const verificationRouter = router({
  /**
   * Get a signed URL for uploading a verification document.
   */
  getUploadUrl: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      contentType: z.string(),
      fileSize: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { fileName, fileSize, contentType } = input;

      if (fileSize > 10 * 1024 * 1024) { // 10MB limit
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'File size cannot exceed 10MB.',
        });
      }

      // Sanitize filename to prevent path traversal
      const sanitizedFileName = sanitizeFileName(fileName);
      const fileKey = `private/${ctx.user.id}/${Date.now()}-${sanitizedFileName}`;
      return await createSignedUploadUrl(BUCKETS.ID_DOCUMENTS, fileKey, contentType);
    }),

  /**
   * Create a record for the uploaded verification document.
   */
  addDocument: protectedProcedure
    .input(z.object({
      documentKey: z.string(),
      documentType: z.string(),
      originalFileName: z.string(),
      fileSize: z.number(),
      mimeType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();

      // Verify ownership: documentKey must start with user's private path
      const expectedPrefix = `private/${ctx.user.id}/`;
      if (!input.documentKey.startsWith(expectedPrefix)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invalid document key: does not belong to this user",
        });
      }

      // Wrap user update and document creation in a transaction
      const newDocument = await db.transaction(async (tx) => {
        // Update user's status to 'pending'
        await tx
          .update(users)
          .set({ 
            verificationStatus: 'pending',
            verificationSubmittedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.id, ctx.user.id));
        
        // Create the document record
        const [created] = await tx
          .insert(verificationDocuments)
          .values({
            userId: ctx.user.id,
            status: 'pending',
            submittedAt: new Date(),
            documentKey: input.documentKey,
            documentType: input.documentType,
            originalFileName: input.originalFileName,
            fileSize: input.fileSize,
            mimeType: input.mimeType,
          })
          .returning();
        
        return created;
      });
      
      return newDocument;
    }),
});
