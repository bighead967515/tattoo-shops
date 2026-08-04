import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { TRPCError } from "@trpc/server";

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockCreateSignedUploadUrl = vi.fn(async (bucket: string, path: string) => {
  return { signedUrl: `https://supabase.example/upload/${bucket}/${path}`, path };
});

vi.mock("../../backend/server/_core/supabaseStorage", () => ({
  createSignedUploadUrl: mockCreateSignedUploadUrl,
  BUCKETS: {
    PORTFOLIO_IMAGES: "portfolio-images",
    REQUEST_IMAGES: "request-images",
    ID_DOCUMENTS: "id-documents",
  },
}));

const {
  mockGetDb,
  mockGetArtistByUserId,
  mockGetPortfolioCountByArtistId,
  queryResults,
} = vi.hoisted(() => {
  const queryResults = { results: [] as any[] };
  const mockBuilder: any = {
    from: vi.fn(() => mockBuilder),
    where: vi.fn(() => mockBuilder),
    limit: vi.fn(() => mockBuilder),
    then: vi.fn((resolve) => resolve(queryResults.results.shift() ?? [])),
  };

  const mockDb = {
    select: vi.fn(() => mockBuilder),
  };

  return {
    mockGetDb: vi.fn(async () => mockDb),
    mockGetArtistByUserId: vi.fn(),
    mockGetPortfolioCountByArtistId: vi.fn(),
    queryResults,
  };
});

vi.mock("../../backend/server/db", () => ({
  getDb: mockGetDb,
  getArtistByUserId: mockGetArtistByUserId,
  getPortfolioCountByArtistId: mockGetPortfolioCountByArtistId,
  isAiEnabled: () => false,
}));

// ─── Environment Seeding ─────────────────────────────────────────────────────

function seedRequiredEnv() {
  process.env.JWT_SECRET = "12345678901234567890123456789012";
  process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/testdb";
  process.env.OWNER_OPEN_ID = "owner-open-id";
  process.env.NODE_ENV = "test";
  process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_placeholder";
  process.env.RESEND_API_KEY = "re_test_placeholder";
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_KEY = "service_role_key";
  process.env.SUPABASE_ANON_KEY = "anon_key";
  process.env.GROQ_API_KEY = "groq_api_key";
  process.env.HUGGINGFACE_API_KEY = "hf_api_key";

  process.env.STRIPE_ARTIST_AMATEUR_PRICE_ID_MONTH = "price_amateur_mo";
  process.env.STRIPE_ARTIST_AMATEUR_PRICE_ID_YEAR = "price_amateur_yr";
  process.env.STRIPE_ARTIST_PRO_PRICE_ID_MONTH = "price_pro_mo";
  process.env.STRIPE_ARTIST_PRO_PRICE_ID_YEAR = "price_pro_yr";
  process.env.STRIPE_ARTIST_ICON_PRICE_ID_MONTH = "price_icon_mo";
  process.env.STRIPE_ARTIST_ICON_PRICE_ID_YEAR = "price_icon_yr";
  process.env.STRIPE_FOUNDING_ARTIST_PRICE_ID = "price_founding";
}

let appRouter: (typeof import("../../backend/server/routers"))["appRouter"];

beforeAll(async () => {
  seedRequiredEnv();
  ({ appRouter } = await import("../../backend/server/routers"));
});

function createCaller(user: any) {
  return appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user,
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Storage upload routing (via tRPC Router)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Portfolio images ────────────────────────────────────────────────────────

  describe("Portfolio images → portfolio-images bucket", () => {
    it("routes to the portfolio-images bucket and enforces tier limit", async () => {
      mockGetArtistByUserId.mockResolvedValue({ id: 42, userId: 1 });
      mockGetPortfolioCountByArtistId.mockResolvedValue(0);

      const caller = createCaller({ id: 1, role: "artist", subscriptionTier: "artist_free" });
      const result = await caller.portfolio.getUploadUrl({
        artistId: 42,
        fileName: "sleeve.jpg",
        contentType: "image/jpeg",
      });

      expect(mockCreateSignedUploadUrl).toHaveBeenCalledTimes(1);
      expect(mockCreateSignedUploadUrl).toHaveBeenCalledWith(
        "portfolio-images",
        expect.stringMatching(/^public\/42\//),
      );
      expect(result.path).toContain("sleeve.jpg");
    });

    it("throws FORBIDDEN when portfolio limit is reached", async () => {
      mockGetArtistByUserId.mockResolvedValue({ id: 42, userId: 1 });
      mockGetPortfolioCountByArtistId.mockResolvedValue(10); // free tier limit is 10

      const caller = createCaller({ id: 1, role: "artist", subscriptionTier: "artist_free" });
      await expect(
        caller.portfolio.getUploadUrl({
          artistId: 42,
          fileName: "sleeve.jpg",
          contentType: "image/jpeg",
        }),
      ).rejects.toThrow(/portfolio limit/);
    });
  });

  // ── Request images ──────────────────────────────────────────────────────────

  describe("Request images → request-images bucket", () => {
    it("generates a public/<clientId>/<requestId>/... key for logged-in clients", async () => {
      queryResults.results = [
        [{ count: 0 }], // count images
        [{ id: 7 }], // client
        [{ id: 100, clientId: 7 }] // request
      ];

      const caller = createCaller({ id: 1, role: "client" });
      const result = await caller.requests.getUploadUrl({
        fileName: "reference.png",
        contentType: "image/png",
        requestId: 100,
      });

      expect(mockCreateSignedUploadUrl).toHaveBeenCalledWith(
        "request-images",
        expect.stringMatching(/^public\/7\/100\//),
      );
      expect(result.path).toContain("reference.png");
    });

    it("generates a public/guest/<requestId>/... key for guests with a valid token", async () => {
      queryResults.results = [
        [{ count: 0 }], // count images
        [{ id: 100, clientId: null, guestToken: "valid-token" }] // request
      ];

      const caller = createCaller(null);
      const result = await caller.requests.getUploadUrl({
        fileName: "reference.png",
        contentType: "image/png",
        requestId: 100,
        guestToken: "valid-token",
      });

      expect(mockCreateSignedUploadUrl).toHaveBeenCalledWith(
        "request-images",
        expect.stringMatching(/^public\/guest\/100\//),
      );
    });

    it("throws FORBIDDEN for guest uploads without a token", async () => {
      queryResults.results = [
        [{ count: 0 }] // count images
      ];

      const caller = createCaller(null);
      await expect(
        caller.requests.getUploadUrl({
          fileName: "reference.png",
          contentType: "image/png",
          requestId: 100,
        }),
      ).rejects.toThrow(/Guest request ownership token is required/);
    });

    it("throws FORBIDDEN for guest uploads with an invalid token", async () => {
      queryResults.results = [
        [{ count: 0 }], // count images
        [] // request not found
      ];

      const caller = createCaller(null);
      await expect(
        caller.requests.getUploadUrl({
          fileName: "reference.png",
          contentType: "image/png",
          requestId: 100,
          guestToken: "wrong-token",
        }),
      ).rejects.toThrow(/Invalid request ID or guest token/);
    });

    it("throws FORBIDDEN if the request already has 10 or more images", async () => {
      queryResults.results = [
        [{ count: 10 }] // count images limit reached
      ];

      const caller = createCaller({ id: 1, role: "client" });
      await expect(
        caller.requests.getUploadUrl({
          fileName: "reference.png",
          contentType: "image/png",
          requestId: 100,
        }),
      ).rejects.toThrow(/Maximum image limit reached for this request/);
    });
  });

  // ── ID / verification documents ────────────────────────────────────────────

  describe("ID documents → id-documents bucket (private)", () => {
    it("routes to the private id-documents bucket with user ID path prefix", async () => {
      const caller = createCaller({ id: 5, role: "artist" });
      const result = await caller.verification.getUploadUrl({
        fileName: "license.pdf",
        contentType: "application/pdf",
        fileSize: 1024,
      });

      expect(mockCreateSignedUploadUrl).toHaveBeenCalledWith(
        "id-documents",
        expect.stringMatching(/^private\/5\//),
      );
      expect(result.path).toContain("license.pdf");
    });

    it("throws BAD_REQUEST for oversized files (> 10 MB)", async () => {
      const caller = createCaller({ id: 5, role: "artist" });
      const oversized = 11 * 1024 * 1024;
      await expect(
        caller.verification.getUploadUrl({
          fileName: "big.pdf",
          contentType: "application/pdf",
          fileSize: oversized,
        }),
      ).rejects.toThrow(/File size cannot exceed 10MB/);
    });
  });

  // ── Filename sanitization ──────────────────────────────────────────────────

  describe("Filename sanitization (path traversal prevention)", () => {
    it("sanitizes filenames via request upload path", async () => {
      queryResults.results = [
        [{ count: 0 }],
        [{ id: 100, clientId: null, guestToken: "valid-token" }]
      ];

      const caller = createCaller(null);
      const result = await caller.requests.getUploadUrl({
        fileName: "../../etc/passwd",
        contentType: "image/png",
        requestId: 100,
        guestToken: "valid-token",
      });

      expect(result.path).not.toContain("..");
      expect(result.path).not.toContain("etc");
      expect(result.path.endsWith("-passwd")).toBe(true);
    });
  });
});
