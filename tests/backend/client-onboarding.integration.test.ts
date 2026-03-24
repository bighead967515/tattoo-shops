import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetDb,
  mockCreateSubscriptionCheckout,
  mockGetArtistByUserId,
  envRef,
} = vi.hoisted(() => ({
  mockGetDb: vi.fn(),
  mockCreateSubscriptionCheckout: vi.fn(),
  mockGetArtistByUserId: vi.fn(),
  envRef: {
    ENV: {
      stripeClientPlusPriceId: "price_plus",
      stripeClientElitePriceId: "price_elite",
      isProduction: false,
    },
  },
}));

vi.mock("../../backend/server/db", () => ({
  getDb: mockGetDb,
  getArtistByUserId: mockGetArtistByUserId,
}));

vi.mock("../../backend/server/stripe", () => ({
  createSubscriptionCheckout: mockCreateSubscriptionCheckout,
}));

vi.mock("../../backend/server/geminiBidOptimizer", () => ({
  refineRequestPrompt: vi.fn(),
  draftBidResponse: vi.fn(),
}));

vi.mock("../../backend/server/_core/supabaseStorage", () => ({
  BUCKETS: {
    REQUEST_IMAGES: "request-images",
  },
  createSignedUploadUrl: vi.fn(),
  getPublicUrl: vi.fn((bucket: string, key: string) =>
    `https://example.com/${bucket}/${key}`,
  ),
}));

vi.mock("../../backend/server/_core/env", () => envRef);

type LimitResult = unknown[];

type TxContext = {
  update: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  updateSetSpy: ReturnType<typeof vi.fn>;
  insertValuesSpy: ReturnType<typeof vi.fn>;
};

function createDbWithQueuedSelects(selectQueue: LimitResult[]) {
  const limit = vi.fn(async () => selectQueue.shift() ?? []);
  const select = vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        limit,
      })),
    })),
  }));

  return {
    select,
    limit,
  };
}

function createTransactionContext(
  returningValue: unknown,
  options?: { throwOnReturning?: Error },
): TxContext {
  const updateWhereSpy = vi.fn(async () => undefined);
  const updateSetSpy = vi.fn(() => ({ where: updateWhereSpy }));
  const update = vi.fn(() => ({ set: updateSetSpy }));

  const insertReturningSpy = options?.throwOnReturning
    ? vi.fn(async () => {
        throw options.throwOnReturning;
      })
    : vi.fn(async () => returningValue);

  const insertValuesSpy = vi.fn(() => ({ returning: insertReturningSpy }));
  const insert = vi.fn(() => ({ values: insertValuesSpy }));

  return {
    update,
    insert,
    updateSetSpy,
    insertValuesSpy,
  };
}

let clientsRouter: (typeof import("../../backend/server/clientRouters"))["clientsRouter"];

function createCaller(user: unknown) {
  return clientsRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: user as any,
  });
}

describe("client onboarding integration", () => {
  beforeAll(async () => {
    ({ clientsRouter } = await import("../../backend/server/clientRouters"));
  }, 30000);

  beforeEach(() => {
    vi.clearAllMocks();
    envRef.ENV.stripeClientPlusPriceId = "price_plus";
    envRef.ENV.stripeClientElitePriceId = "price_elite";
  });

  it("creates profile transactionally with role/tier update and onboarding flag", async () => {
    const selectQueue: LimitResult[] = [[]];
    const selectDb = createDbWithQueuedSelects(selectQueue);

    const createdProfile = {
      id: 91,
      userId: 7,
      displayName: "Client Seven",
      onboardingCompleted: true,
    };

    const tx = createTransactionContext([createdProfile]);

    const db = {
      select: selectDb.select,
      transaction: vi.fn(async (callback: (tx: any) => Promise<unknown>) =>
        callback(tx),
      ),
    };

    mockGetDb.mockResolvedValue(db);

    const caller = createCaller({ id: 7, role: "user" });

    const result = await caller.createProfile({
      displayName: "Client Seven",
      city: "New Orleans",
      state: "LA",
      preferredStyles: "Realism",
    });

    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(tx.updateSetSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "client",
        subscriptionTier: "client_free",
      }),
    );
    expect(tx.insertValuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 7,
        onboardingCompleted: true,
        displayName: "Client Seven",
      }),
    );
    expect(result).toEqual(createdProfile);
  });

  it("rejects onboarding when client profile already exists", async () => {
    const selectDb = createDbWithQueuedSelects([[{ id: 1, userId: 7 }]]);

    const db = {
      select: selectDb.select,
      transaction: vi.fn(),
    };

    mockGetDb.mockResolvedValue(db);

    const caller = createCaller({ id: 7, role: "user" });

    await expect(
      caller.createProfile({
        displayName: "Existing",
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });

    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("propagates transaction failure during onboarding insert", async () => {
    const selectDb = createDbWithQueuedSelects([[]]);

    const tx = createTransactionContext([], {
      throwOnReturning: new Error("insert failure"),
    });

    const db = {
      select: selectDb.select,
      transaction: vi.fn(async (callback: (tx: any) => Promise<unknown>) =>
        callback(tx),
      ),
    };

    mockGetDb.mockResolvedValue(db);

    const caller = createCaller({ id: 7, role: "user" });

    await expect(
      caller.createProfile({
        displayName: "Fails",
      }),
    ).rejects.toThrow("insert failure");

    expect(tx.updateSetSpy).toHaveBeenCalledTimes(1);
    expect(tx.insertValuesSpy).toHaveBeenCalledTimes(1);
  });

  it("builds stripe checkout metadata from onboarded client profile", async () => {
    const selectDb = createDbWithQueuedSelects([
      [{ id: 88, userId: 7 }],
      [{ id: 7, email: "client7@example.com", stripeCustomerId: "cus_777" }],
    ]);

    const db = {
      select: selectDb.select,
    };

    mockGetDb.mockResolvedValue(db);
    mockCreateSubscriptionCheckout.mockResolvedValue({
      url: "https://checkout.stripe.com/test-session",
    });

    const caller = createCaller({ id: 7, role: "client" });

    const result = await caller.createSubscriptionCheckout({
      tier: "client_plus",
      successUrl: "https://app.example/success",
      cancelUrl: "https://app.example/cancel",
    });

    expect(mockCreateSubscriptionCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        priceId: "price_plus",
        customerEmail: "client7@example.com",
        stripeCustomerId: "cus_777",
        metadata: {
          userId: "7",
          clientId: "88",
          tier: "client_plus",
        },
      }),
    );

    expect(result.checkoutUrl).toContain("checkout.stripe.com");
  });

  it("fails fast when stripe price is not configured", async () => {
    envRef.ENV.stripeClientPlusPriceId = undefined as unknown as string;

    const selectDb = createDbWithQueuedSelects([
      [{ id: 88, userId: 7 }],
      [{ id: 7, email: "client7@example.com" }],
    ]);

    const db = {
      select: selectDb.select,
    };

    mockGetDb.mockResolvedValue(db);

    const caller = createCaller({ id: 7, role: "client" });

    await expect(
      caller.createSubscriptionCheckout({
        tier: "client_plus",
        successUrl: "https://app.example/success",
        cancelUrl: "https://app.example/cancel",
      }),
    ).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });

    expect(mockCreateSubscriptionCheckout).not.toHaveBeenCalled();
  });
});
