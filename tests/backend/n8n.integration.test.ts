import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockUpdateArtist,
  mockCreateArtist,
  mockGetDb,
} = vi.hoisted(() => ({
  mockUpdateArtist: vi.fn(),
  mockCreateArtist: vi.fn(),
  mockGetDb: vi.fn(),
}));

vi.mock("../../backend/server/db", () => {
  return {
    getDb: mockGetDb,
    updateArtist: mockUpdateArtist,
    createArtist: mockCreateArtist,
    getAllArtists: vi.fn(),
    searchArtists: vi.fn(),
    getArtistByUserId: vi.fn(),
  };
});

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

  // Stripe prices required by environment validation
  process.env.STRIPE_ARTIST_AMATEUR_PRICE_ID_MONTH = "price_amateur_mo";
  process.env.STRIPE_ARTIST_AMATEUR_PRICE_ID_YEAR = "price_amateur_yr";
  process.env.STRIPE_ARTIST_PRO_PRICE_ID_MONTH = "price_pro_mo";
  process.env.STRIPE_ARTIST_PRO_PRICE_ID_YEAR = "price_pro_yr";
  process.env.STRIPE_ARTIST_ICON_PRICE_ID_MONTH = "price_icon_mo";
  process.env.STRIPE_ARTIST_ICON_PRICE_ID_YEAR = "price_icon_yr";
  process.env.STRIPE_FOUNDING_ARTIST_PRICE_ID = "price_founding";

  // n8n Integrations
  process.env.N8N_WEBHOOK_URL = "https://n8n-test.example.com";
  process.env.N8N_WEBHOOK_SECRET = "n8n_test_secret";
  process.env.N8N_ONBOARDING_WEBHOOK_URL = "https://n8n-test.example.com/webhook/artist-onboarding";
  process.env.N8N_VERIFICATION_WEBHOOK_URL = "https://n8n-test.example.com/webhook/license-verification";
}

let appRouter: (typeof import("../../backend/server/routers"))["appRouter"];

function createCaller(user: unknown) {
  return appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: user as any,
  });
}

describe("n8n workflow integrations", () => {
  const mockFetch = vi.fn();

  beforeAll(async () => {
    seedRequiredEnv();
    vi.stubGlobal("fetch", mockFetch);
    ({ appRouter } = await import("../../backend/server/routers"));
  }, 30000);

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true, status: 200 } as any);
  });

  it("triggers n8n artist-approval webhook on adminSetApproval", async () => {
    const caller = createCaller({
      id: 1,
      role: "admin",
    });

    mockUpdateArtist.mockResolvedValue({ id: 10, isApproved: true });

    await caller.artists.adminSetApproval({
      artistId: 10,
      approved: true,
    });

    expect(mockUpdateArtist).toHaveBeenCalledTimes(1);
    expect(mockUpdateArtist).toHaveBeenCalledWith(10, { isApproved: true });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://n8n-test.example.com/webhook/artist-approval",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer n8n_test_secret",
        },
        body: JSON.stringify({
          artistId: 10,
          approved: true,
        }),
      })
    );
  });

  it.skip("triggers n8n artist-onboarding webhook when a new artist is registered", async () => {
    const caller = createCaller({
      id: 42,
      role: "user",
      email: "test@example.com",
      name: "Tattoo Legend",
    });

    mockCreateArtist.mockResolvedValue({ id: 50 });

    await caller.artists.create({
      shopName: "Legend Ink",
      city: "Portland",
      state: "OR",
    });

    expect(mockCreateArtist).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://n8n-test.example.com/webhook/artist-onboarding",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer n8n_test_secret",
        },
        body: JSON.stringify({
          artistId: 50,
          userId: 42,
          email: "test@example.com",
          firstName: "Tattoo",
          shopName: "Legend Ink",
        }),
      })
    );
  });

  it("triggers n8n license-verification webhook when a verification document is added", async () => {
    const caller = createCaller({
      id: 42,
      role: "user",
      email: "test@example.com",
    });

    const mockTx = {
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn().mockResolvedValue({}),
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ id: 100 }]),
        })),
      })),
    };
    const mockDatabase = {
      transaction: vi.fn(async (cb) => cb(mockTx)),
    };
    mockGetDb.mockResolvedValue(mockDatabase);

    await caller.verification.addDocument({
      documentKey: "private/42/license.png",
      documentType: "tattoo_license",
      originalFileName: "my-license.png",
      fileSize: 1024,
      mimeType: "image/png",
    });

    expect(mockDatabase.transaction).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://n8n-test.example.com/webhook/license-verification",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer n8n_test_secret",
        },
        body: JSON.stringify({
          documentId: 100,
          userId: 42,
          email: "test@example.com",
          documentType: "tattoo_license",
        }),
      })
    );
  });
});
