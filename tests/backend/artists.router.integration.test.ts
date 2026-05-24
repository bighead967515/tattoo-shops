import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCreateArtist,
  mockGetAllArtists,
  mockSearchArtists,
  mockGetArtistByUserId,
} = vi.hoisted(() => ({
  mockCreateArtist: vi.fn(),
  mockGetAllArtists: vi.fn(),
  mockSearchArtists: vi.fn(),
  mockGetArtistByUserId: vi.fn(),
}));

vi.mock("../../backend/server/db", () => {
  return {
    createArtist: mockCreateArtist,
    getAllArtists: mockGetAllArtists,
    searchArtists: mockSearchArtists,
    getArtistByUserId: mockGetArtistByUserId,
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
  process.env.STRIPE_ARTIST_AMATEUR_PRICE_ID_MONTH = "price_amateur_month";
  process.env.STRIPE_ARTIST_AMATEUR_PRICE_ID_YEAR = "price_amateur_year";
  process.env.STRIPE_ARTIST_PRO_PRICE_ID_MONTH = "price_pro_month";
  process.env.STRIPE_ARTIST_PRO_PRICE_ID_YEAR = "price_pro_year";
  process.env.STRIPE_ARTIST_ICON_PRICE_ID_MONTH = "price_icon_month";
  process.env.STRIPE_ARTIST_ICON_PRICE_ID_YEAR = "price_icon_year";
  process.env.STRIPE_FOUNDING_ARTIST_PRICE_ID = "price_founding";
}

let appRouter: (typeof import("../../backend/server/routers"))["appRouter"];

function createCaller(user: unknown) {
  return appRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: user as any,
  });
}

describe("artists router integration", () => {
  beforeAll(async () => {
    seedRequiredEnv();
    ({ appRouter } = await import("../../backend/server/routers"));
  }, 30000);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects artists.create when unauthenticated", async () => {
    const caller = createCaller(null);

    await expect(
      caller.artists.create({
        shopName: "Ink Harbor",
      }),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });

    expect(mockCreateArtist).not.toHaveBeenCalled();
  });

  it("creates artist profile and injects ctx userId", async () => {
    const caller = createCaller({
      id: 42,
      role: "user",
      subscriptionTier: "artist_free",
    });

    const createdArtist = {
      id: 700,
      userId: 42,
      shopName: "Ink Harbor",
      isApproved: false,
    };

    mockCreateArtist.mockResolvedValue(createdArtist);

    const result = await caller.artists.create({
      shopName: "Ink Harbor",
      city: "New Orleans",
      state: "LA",
    });

    expect(mockCreateArtist).toHaveBeenCalledTimes(1);
    expect(mockCreateArtist).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 42,
        shopName: "Ink Harbor",
        city: "New Orleans",
        state: "LA",
      }),
    );
    expect(result).toEqual(createdArtist);
  });

  it("returns approved artists from artists.getAll", async () => {
    const caller = createCaller(null);

    const artists = [
      { id: 1, shopName: "Alpha Ink", isApproved: true },
      { id: 2, shopName: "Bayou Tattoo", isApproved: true },
    ];

    mockGetAllArtists.mockResolvedValue(artists);

    const result = await caller.artists.getAll();

    expect(mockGetAllArtists).toHaveBeenCalledTimes(1);
    expect(result).toEqual(artists);
  });

  it("passes filter payload to artists.search", async () => {
    const caller = createCaller(null);

    const filters = {
      shopName: "Delta",
      styles: ["Realism", "Traditional"],
      minRating: 4,
      minExperience: 3,
      city: "Baton Rouge",
      state: "LA",
    };

    const artists = [{ id: 3, shopName: "Delta Ink", city: "Baton Rouge" }];
    mockSearchArtists.mockResolvedValue(artists);

    const result = await caller.artists.search(filters);

    expect(mockSearchArtists).toHaveBeenCalledTimes(1);
    expect(mockSearchArtists).toHaveBeenCalledWith(filters);
    expect(result).toEqual(artists);
  });

  it("normalizes whitespace-only text filters before artists.search", async () => {
    const caller = createCaller(null);

    mockSearchArtists.mockResolvedValue([]);

    await caller.artists.search({
      shopName: "   ",
      city: "  ",
      state: "   ",
      minRating: 0,
      minExperience: 0,
      styles: [],
    });

    expect(mockSearchArtists).toHaveBeenCalledTimes(1);
    expect(mockSearchArtists).toHaveBeenCalledWith({
      shopName: undefined,
      city: undefined,
      state: undefined,
      minRating: 0,
      minExperience: 0,
      styles: [],
    });
  });

  it("trims text filters before artists.search", async () => {
    const caller = createCaller(null);

    mockSearchArtists.mockResolvedValue([]);

    await caller.artists.search({
      shopName: "  Delta Ink  ",
      city: "  Baton Rouge ",
      state: "  LA  ",
    });

    expect(mockSearchArtists).toHaveBeenCalledTimes(1);
    expect(mockSearchArtists).toHaveBeenCalledWith({
      shopName: "Delta Ink",
      city: "Baton Rouge",
      state: "LA",
    });
  });
});
