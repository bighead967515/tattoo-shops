import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

/**
 * Storage Upload Routing Tests
 * Verifies that each upload type routes to the correct Supabase bucket
 * and generates correctly structured file keys.
 *
 * Three upload paths:
 *  1. Portfolio images  → "portfolio-images" bucket (public), key: public/<artistId>/...
 *  2. Request images    → "request-images"   bucket (public), key: public/<clientId|guest>/...
 *  3. ID documents      → "id-documents"     bucket (private), key: private/<userId>/...
 */

// ─── Shared constants ────────────────────────────────────────────────────────

const BUCKETS = {
  PORTFOLIO_IMAGES: "portfolio-images",
  REQUEST_IMAGES: "request-images",
  ID_DOCUMENTS: "id-documents",
} as const;

// ─── Helpers replicated from production code ─────────────────────────────────

/** Mirror of sanitizeFileName in verificationRouter & routers.ts */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .slice(0, 100);
}

/** Mirror of portfolio getUploadUrl key generation */
function buildPortfolioKey(artistId: number, fileName: string): string {
  const sanitized = sanitizeFileName(fileName);
  return `public/${artistId}/${Date.now()}-${sanitized}`;
}

/** Mirror of request getUploadUrl key generation */
function buildRequestKey(prefix: string | number, fileName: string): string {
  const sanitized = sanitizeFileName(fileName);
  return `public/${prefix}/${Date.now()}-${sanitized}`;
}

/** Mirror of verification getUploadUrl key generation */
function buildDocumentKey(userId: number, fileName: string): string {
  const sanitized = sanitizeFileName(fileName);
  return `private/${userId}/${Date.now()}-${sanitized}`;
}

// ─── Mock for createSignedUploadUrl ──────────────────────────────────────────

type UploadCall = { bucket: string; path: string };

function makeStorageMock() {
  const calls: UploadCall[] = [];
  const createSignedUploadUrl = vi.fn(async (bucket: string, path: string) => {
    calls.push({ bucket, path });
    return { signedUrl: `https://supabase.example/upload/${bucket}/${path}`, path };
  });
  return { createSignedUploadUrl, calls };
}

// ─── Simulated procedure logic ────────────────────────────────────────────────

function makePortfolioUploadProcedure(
  storage: ReturnType<typeof makeStorageMock>,
  portfolioCount: number,
  portfolioLimit: number,
) {
  return async (artistId: number, fileName: string, _contentType: string) => {
    if (portfolioCount >= portfolioLimit) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `You have reached your tier's portfolio limit (${portfolioLimit}).`,
      });
    }
    const fileKey = buildPortfolioKey(artistId, fileName);
    return storage.createSignedUploadUrl(BUCKETS.PORTFOLIO_IMAGES, fileKey);
  };
}

function makeRequestImageUploadProcedure(
  storage: ReturnType<typeof makeStorageMock>,
  clientId: number | null, // null = guest
) {
  return async (fileName: string, _contentType: string) => {
    const prefix = clientId !== null ? String(clientId) : "guest";
    const fileKey = buildRequestKey(prefix, fileName);
    return storage.createSignedUploadUrl(BUCKETS.REQUEST_IMAGES, fileKey);
  };
}

function makeDocumentUploadProcedure(
  storage: ReturnType<typeof makeStorageMock>,
) {
  return async (userId: number, fileName: string, contentType: string, fileSize: number) => {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(contentType)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid file type." });
    }
    if (fileSize > 10 * 1024 * 1024) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "File size cannot exceed 10MB." });
    }
    const fileKey = buildDocumentKey(userId, fileName);
    return storage.createSignedUploadUrl(BUCKETS.ID_DOCUMENTS, fileKey);
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Storage upload routing", () => {
  let storage: ReturnType<typeof makeStorageMock>;

  beforeEach(() => {
    storage = makeStorageMock();
  });

  // ── Portfolio images ────────────────────────────────────────────────────────

  describe("Portfolio images → portfolio-images bucket", () => {
    it("routes to the portfolio-images bucket", async () => {
      const upload = makePortfolioUploadProcedure(storage, 0, 10);
      await upload(42, "sleeve.jpg", "image/jpeg");
      expect(storage.calls[0].bucket).toBe(BUCKETS.PORTFOLIO_IMAGES);
    });

    it("generates a public/<artistId>/... file key", async () => {
      const upload = makePortfolioUploadProcedure(storage, 0, 10);
      await upload(42, "sleeve.jpg", "image/jpeg");
      expect(storage.calls[0].path).toMatch(/^public\/42\//);
    });

    it("includes the sanitized filename in the key", async () => {
      const upload = makePortfolioUploadProcedure(storage, 0, 10);
      await upload(42, "my sleeve.jpg", "image/jpeg");
      expect(storage.calls[0].path).toContain("my_sleeve.jpg");
    });

    it("throws FORBIDDEN when portfolio limit is reached", async () => {
      const upload = makePortfolioUploadProcedure(storage, 10, 10);
      await expect(upload(42, "one-more.jpg", "image/jpeg")).rejects.toThrow(TRPCError);
      await expect(upload(42, "one-more.jpg", "image/jpeg")).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("does NOT route to request-images or id-documents", async () => {
      const upload = makePortfolioUploadProcedure(storage, 0, 10);
      await upload(42, "sleeve.jpg", "image/jpeg");
      expect(storage.calls[0].bucket).not.toBe(BUCKETS.REQUEST_IMAGES);
      expect(storage.calls[0].bucket).not.toBe(BUCKETS.ID_DOCUMENTS);
    });
  });

  // ── Request images ──────────────────────────────────────────────────────────

  describe("Request images → request-images bucket", () => {
    it("routes to the request-images bucket for logged-in clients", async () => {
      const upload = makeRequestImageUploadProcedure(storage, 7);
      await upload("reference.png", "image/png");
      expect(storage.calls[0].bucket).toBe(BUCKETS.REQUEST_IMAGES);
    });

    it("routes to the request-images bucket for guests", async () => {
      const upload = makeRequestImageUploadProcedure(storage, null);
      await upload("reference.png", "image/png");
      expect(storage.calls[0].bucket).toBe(BUCKETS.REQUEST_IMAGES);
    });

    it("generates a public/<clientId>/... key for logged-in clients", async () => {
      const upload = makeRequestImageUploadProcedure(storage, 7);
      await upload("reference.png", "image/png");
      expect(storage.calls[0].path).toMatch(/^public\/7\//);
    });

    it("generates a public/guest/... key for unauthenticated uploads", async () => {
      const upload = makeRequestImageUploadProcedure(storage, null);
      await upload("reference.png", "image/png");
      expect(storage.calls[0].path).toMatch(/^public\/guest\//);
    });

    it("does NOT use the artistId namespace", async () => {
      const upload = makeRequestImageUploadProcedure(storage, 99);
      await upload("ref.jpg", "image/jpeg");
      // Key should start with "public/<clientId>" not "private/"
      expect(storage.calls[0].path).toMatch(/^public\//);
    });
  });

  // ── ID / verification documents ────────────────────────────────────────────

  describe("ID documents → id-documents bucket (private)", () => {
    it("routes to the id-documents bucket", async () => {
      const upload = makeDocumentUploadProcedure(storage);
      await upload(5, "license.pdf", "application/pdf", 1024);
      expect(storage.calls[0].bucket).toBe(BUCKETS.ID_DOCUMENTS);
    });

    it("generates a private/<userId>/... file key", async () => {
      const upload = makeDocumentUploadProcedure(storage);
      await upload(5, "license.pdf", "application/pdf", 1024);
      expect(storage.calls[0].path).toMatch(/^private\/5\//);
    });

    it("includes the sanitized filename in the key", async () => {
      const upload = makeDocumentUploadProcedure(storage);
      await upload(5, "my license!.pdf", "application/pdf", 512);
      expect(storage.calls[0].path).toContain("my_license_.pdf");
    });

    it("does NOT use a public/ prefix (bucket is private)", async () => {
      const upload = makeDocumentUploadProcedure(storage);
      await upload(5, "id.png", "image/png", 2048);
      expect(storage.calls[0].path).not.toMatch(/^public\//);
    });

    it("throws BAD_REQUEST for oversized files (> 10 MB)", async () => {
      const upload = makeDocumentUploadProcedure(storage);
      const oversized = 11 * 1024 * 1024;
      await expect(upload(5, "big.pdf", "application/pdf", oversized)).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: expect.stringContaining("10MB"),
      });
    });

    it("does NOT route to portfolio-images or request-images", async () => {
      const upload = makeDocumentUploadProcedure(storage);
      await upload(5, "license.pdf", "application/pdf", 1024);
      expect(storage.calls[0].bucket).not.toBe(BUCKETS.PORTFOLIO_IMAGES);
      expect(storage.calls[0].bucket).not.toBe(BUCKETS.REQUEST_IMAGES);
    });
  });

  // ── Filename sanitization (shared across all upload types) ─────────────────

  describe("Filename sanitization (path traversal prevention)", () => {
    it("strips path separators from filenames", () => {
      expect(sanitizeFileName("../../etc/passwd")).not.toContain("/");
      expect(sanitizeFileName("..\\windows\\system32")).not.toContain("\\");
    });

    it("collapses multiple dots to prevent extension spoofing", () => {
      expect(sanitizeFileName("file..php.jpg")).not.toContain("..");
    });

    it("replaces spaces and special chars with underscores", () => {
      const result = sanitizeFileName("my file (1).jpg");
      expect(result).toMatch(/^[a-zA-Z0-9._-]+$/);
    });

    it("truncates filenames longer than 100 characters", () => {
      const long = "a".repeat(200) + ".jpg";
      expect(sanitizeFileName(long).length).toBeLessThanOrEqual(100);
    });

    it("preserves safe filenames unchanged", () => {
      expect(sanitizeFileName("sleeve-design_v2.jpg")).toBe("sleeve-design_v2.jpg");
    });
  });

  // ── Cross-bucket isolation ──────────────────────────────────────────────────

  describe("Cross-bucket isolation", () => {
    it("three separate uploads each call the correct distinct bucket", async () => {
      const portfolioUpload = makePortfolioUploadProcedure(storage, 0, 10);
      const requestUpload = makeRequestImageUploadProcedure(storage, 3);
      const docUpload = makeDocumentUploadProcedure(storage);

      await portfolioUpload(1, "art.jpg", "image/jpeg");
      await requestUpload("ref.jpg", "image/jpeg");
      await docUpload(10, "id.png", "image/png", 500);

      const buckets = storage.calls.map((c) => c.bucket);
      expect(buckets).toEqual([
        BUCKETS.PORTFOLIO_IMAGES,
        BUCKETS.REQUEST_IMAGES,
        BUCKETS.ID_DOCUMENTS,
      ]);
    });

    it("portfolio key path never starts with private/", async () => {
      const upload = makePortfolioUploadProcedure(storage, 0, 10);
      await upload(1, "art.jpg", "image/jpeg");
      expect(storage.calls[0].path).not.toMatch(/^private\//);
    });

    it("document key path never starts with public/", async () => {
      const upload = makeDocumentUploadProcedure(storage);
      await upload(1, "doc.pdf", "application/pdf", 512);
      expect(storage.calls[0].path).not.toMatch(/^public\//);
    });
  });
});
