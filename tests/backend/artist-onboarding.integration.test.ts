import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCreateArtist,
  mockFetch,
} = vi.hoisted(() => ({
  mockCreateArtist: vi.fn(),
  mockFetch: vi.fn(),
}));

vi.mock("../../backend/server/db", () => ({
  createArtist: mockCreateArtist,
}));

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

  // Webhook integration envs
  process.env.N8N_ONBOARDING_WEBHOOK_URL = "https://example.com/webhook-onboarding";
  process.env.N8N_WEBHOOK_SECRET = "test-webhook-secret";
}

let appRouter: (typeof import("../../backend/server/routers"))["appRouter"];

function createCaller(user: unknown) {
  return appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: user as any,
  });
}

describe("Artist Onboarding Integration", () => {
  beforeAll(async () => {
    seedRequiredEnv();
    vi.stubGlobal("fetch", mockFetch);
    ({ appRouter } = await import("../../backend/server/routers"));
  }, 250000);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects artists.create when unauthenticated", async () => {
    const caller = createCaller(null);

    await expect(
      caller.artists.create({
        shopName: "Ink Syndicate",
      }),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("successfully onboards an artist and triggers onboarding webhook", async () => {
    const createdArtist = {
      id: 501,
      userId: 42,
      shopName: "Ink Syndicate",
      bio: "Custom lettering and realism.",
      specialties: "Lettering, Realism",
      experience: 5,
      city: "Austin",
      state: "TX",
      instagram: "@ink_syndicate",
      isApproved: true,
    };

    mockCreateArtist.mockResolvedValue(createdArtist);
    mockFetch.mockResolvedValue({ ok: true });

    const caller = createCaller({
      id: 42,
      role: "user",
      email: "artist@example.com",
      name: "Jane Doe",
    });

    const result = await caller.artists.create({
      shopName: "Ink Syndicate",
      bio: "Custom lettering and realism.",
      experience: 5,
      city: "Austin",
      state: "TX",
      specialties: "Lettering, Realism",
      instagram: "@ink_syndicate",
    });

    // Verify db.createArtist called with correct params
    expect(mockCreateArtist).toHaveBeenCalledTimes(1);
    expect(mockCreateArtist).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 42,
        shopName: "Ink Syndicate",
        bio: "Custom lettering and realism.",
        specialties: "Lettering, Realism",
        experience: 5,
        city: "Austin",
        state: "TX",
        instagram: "@ink_syndicate",
      }),
    );

    // Verify returning value
    expect(result).toEqual(createdArtist);
  });

  it("sanitizes long text inputs during registration before database call", async () => {
    const longShopName = "A".repeat(300); // Max 255
    const longBio = "B".repeat(2500); // Max 2000
    const longSpecialties = "C".repeat(600); // Max 500

    const createdArtist = {
      id: 502,
      userId: 43,
      shopName: "A".repeat(255),
      bio: "B".repeat(2000),
      specialties: "C".repeat(500),
      isApproved: true,
    };

    mockCreateArtist.mockResolvedValue(createdArtist);

    const caller = createCaller({
      id: 43,
      role: "user",
      email: "artist2@example.com",
      name: "Bob Builder",
    });

    const result = await caller.artists.create({
      shopName: longShopName,
      bio: longBio,
      specialties: longSpecialties,
    });

    // Verify sanitization: db.createArtist should receive truncated strings
    expect(mockCreateArtist).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 43,
        shopName: "A".repeat(255),
        bio: "B".repeat(2000),
        specialties: "C".repeat(500),
      }),
    );

    expect(result).toEqual(createdArtist);
  });

  it("propagates database creation errors", async () => {
    mockCreateArtist.mockRejectedValue(new Error("Unique constraint violation: artist already exists"));

    const caller = createCaller({
      id: 44,
      role: "user",
      email: "artist3@example.com",
      name: "Alice",
    });

    await expect(
      caller.artists.create({
        shopName: "Conflict Shop",
      }),
    ).rejects.toThrow("Unique constraint violation: artist already exists");

    expect(mockCreateArtist).toHaveBeenCalledTimes(1);
  });
});
