import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import * as dbFns from "./db";
import { users, verificationDocuments } from "../drizzle/schema";
import {
  BUCKETS,
  createSignedUploadUrl,
  createSignedUrl,
} from "./_core/supabaseStorage";
import { TRPCError } from "@trpc/server";
import { verifyLicenseDocument } from "./geminiSafety";
import { logger } from "./_core/logger";
import { ENV } from "./_core/env";
import path from "path";

async function requireDb() {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available",
    });
  return db;
}

/**
 * Sanitize a filename to prevent path traversal attacks.
 */
function sanitizeFileName(fileName: string, maxLength = 100): string {
  let sanitized = path.basename(fileName);
  sanitized = sanitized.replace(/[\\\0]/g, "");
  sanitized = sanitized.replace(/\.\./g, "");
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");
  sanitized = sanitized.replace(/_+/g, "_");
  sanitized = sanitized.substring(0, maxLength);
  if (!sanitized || sanitized === "." || sanitized === "..") {
    sanitized = `upload_${Date.now()}`;
  }
  return sanitized;
}

export const verificationRouter = router({
  /**
   * Get a signed URL for uploading a verification document.
   */
  getUploadUrl: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        contentType: z.enum(["image/jpeg", "image/png", "application/pdf"]),
        fileSize: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { fileName, fileSize, contentType } = input;

      if (fileSize > 10 * 1024 * 1024) {
        // 10MB limit
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File size cannot exceed 10MB.",
        });
      }

      // Sanitize filename to prevent path traversal
      const sanitizedFileName = sanitizeFileName(fileName);
      const fileKey = `private/${ctx.user.id}/${Date.now()}-${sanitizedFileName}`;
      return await createSignedUploadUrl(BUCKETS.ID_DOCUMENTS, fileKey);
    }),

  /**
   * Create a record for the uploaded verification document.
   */
  addDocument: protectedProcedure
    .input(
      z.object({
        documentKey: z.string(),
        documentType: z.string(),
        originalFileName: z.string(),
        fileSize: z.number(),
        mimeType: z.enum(["image/jpeg", "image/png", "application/pdf"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const drizzleDb = await requireDb();
      const newDocument = await drizzleDb.transaction(async (tx) => {
        await tx
          .update(users)
          .set({
            verificationStatus: "pending",
            verificationSubmittedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.id, ctx.user.id));

        const [created] = await tx
          .insert(verificationDocuments)
          .values({
            userId: ctx.user.id,
            status: "pending",
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

      if (ENV.n8nVerificationWebhookUrl) {
        fetch(ENV.n8nVerificationWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ENV.n8nWebhookSecret}`,
          },
          body: JSON.stringify({
            documentId: newDocument.id,
            userId: ctx.user.id,
            email: ctx.user.email,
            documentType: input.documentType,
          }),
        }).catch(() => {});
      }

      return newDocument;
    }),

  /**
   * Admin: Get all pending verification documents with OCR results.
   */
  getPending: adminProcedure.query(async () => {
    return await dbFns.getPendingVerificationDocuments();
  }),

  /**
   * Admin: Approve or reject a verification document.
   */
  review: adminProcedure
    .input(
      z.object({
        documentId: z.number(),
        decision: z.enum(["verified", "rejected"]),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await dbFns.reviewVerificationDocument(input.documentId, {
        status: input.decision,
        reviewedBy: ctx.user!.id,
        reviewNotes: input.notes,
      });
    }),

  /**
   * Admin: Get OCR details for a specific document.
   */
  getDocument: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const doc = await dbFns.getVerificationDocumentById(input.id);
      if (!doc) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Verification document not found",
        });
      }
      return doc;
    }),
});
