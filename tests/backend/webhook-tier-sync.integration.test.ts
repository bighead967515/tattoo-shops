import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockConstructWebhookEvent,
  mockStripePriceToClientTier,
  mockGetBookingById,
  mockWithTransaction,
  mockUpdateBooking,
  mockGetDb,
  mockQueueWebhookForRetry,
  mockStartQueueProcessor,
  mockGetQueueStats,
  logger,
} = vi.hoisted(() => ({
  mockConstructWebhookEvent: vi.fn(),
  mockStripePriceToClientTier: vi.fn(),
  mockGetBookingById: vi.fn(),
  mockWithTransaction: vi.fn(),
  mockUpdateBooking: vi.fn(),
  mockGetDb: vi.fn(),
  mockQueueWebhookForRetry: vi.fn(),
  mockStartQueueProcessor: vi.fn(),
  mockGetQueueStats: vi.fn(),
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../../backend/server/stripe", () => ({
  constructWebhookEvent: mockConstructWebhookEvent,
  stripePriceToClientTier: mockStripePriceToClientTier,
}));

vi.mock("../../backend/server/db", () => ({
  getBookingById: mockGetBookingById,
  withTransaction: mockWithTransaction,
  updateBooking: mockUpdateBooking,
  getDb: mockGetDb,
}));

vi.mock("../../backend/server/webhookQueue", () => ({
  queueWebhookForRetry: mockQueueWebhookForRetry,
  startQueueProcessor: mockStartQueueProcessor,
  getQueueStats: mockGetQueueStats,
}));

vi.mock("../../backend/server/_core/logger", () => ({
  logger,
}));

type MockReq = {
  headers: Record<string, string>;
  body: unknown;
};

type MockRes = {
  status: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

function createReq(signature = "sig_test", body: unknown = "{}"): MockReq {
  return {
    headers: {
      "stripe-signature": signature,
    },
    body,
  };
}

function createRes(): MockRes {
  const response: Partial<MockRes> = {};
  response.status = vi.fn(() => response as MockRes);
  response.send = vi.fn(() => response as MockRes);
  response.json = vi.fn(() => response as MockRes);
  return response as MockRes;
}

function createDbForSubscription(user: Record<string, unknown>) {
  const limit = vi.fn(async () => [user]);

  const updateCalls: Array<{ table: unknown; setPayload: unknown }> = [];

  const tx = {
    update: vi.fn((table: unknown) => ({
      set: vi.fn((setPayload: unknown) => ({
        where: vi.fn(async () => {
          updateCalls.push({ table, setPayload });
        }),
      })),
    })),
  };

  const database = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit,
        })),
      })),
    })),
    transaction: vi.fn(async (callback: (tx: unknown) => Promise<void>) =>
      callback(tx),
    ),
  };

  return {
    database,
    updateCalls,
  };
}

let handleStripeWebhook: (typeof import("../../backend/server/webhookHandler"))["handleStripeWebhook"];

describe("webhook tier-sync and safety integration", () => {
  beforeAll(async () => {
    ({ handleStripeWebhook } = await import("../../backend/server/webhookHandler"));
  }, 30000);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("syncs client tier upgrade on subscription updated events", async () => {
    const event = {
      id: "evt_live_1",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_123",
          customer: "cus_123",
          items: {
            data: [{ plan: { id: "price_plus" } }],
          },
        },
      },
    };

    const { database, updateCalls } = createDbForSubscription({
      id: 17,
      stripeCustomerId: "cus_123",
    });

    mockConstructWebhookEvent.mockResolvedValue(event);
    mockStripePriceToClientTier.mockReturnValue("client_plus");
    mockGetDb.mockResolvedValue(database);

    const req = createReq();
    const res = createRes();

    await handleStripeWebhook(req as any, res as any);

    expect(res.json).toHaveBeenCalledWith({ received: true });
    expect(database.transaction).toHaveBeenCalledTimes(1);

    expect(updateCalls.some((call) =>
      (call.setPayload as Record<string, unknown>).subscriptionTier === "client_plus",
    )).toBe(true);

    expect(updateCalls.some((call) =>
      (call.setPayload as Record<string, unknown>).aiCredits === 10,
    )).toBe(true);

    expect(mockQueueWebhookForRetry).not.toHaveBeenCalled();
  });

  it("downgrades client tier and credits on subscription deleted events", async () => {
    const event = {
      id: "evt_live_2",
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_456",
          customer: "cus_456",
          items: { data: [] },
        },
      },
    };

    const { database, updateCalls } = createDbForSubscription({
      id: 21,
      stripeCustomerId: "cus_456",
    });

    mockConstructWebhookEvent.mockResolvedValue(event);
    mockGetDb.mockResolvedValue(database);

    const req = createReq();
    const res = createRes();

    await handleStripeWebhook(req as any, res as any);

    expect(res.json).toHaveBeenCalledWith({ received: true });

    expect(updateCalls.some((call) =>
      (call.setPayload as Record<string, unknown>).subscriptionTier === "client_free",
    )).toBe(true);

    expect(updateCalls.some((call) =>
      (call.setPayload as Record<string, unknown>).aiCredits === 0,
    )).toBe(true);
  });

  it("does not reprocess duplicate booking payment webhooks", async () => {
    const event = {
      id: "evt_live_3",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_1",
          metadata: { bookingId: "12" },
          payment_intent: "pi_1",
          amount_total: 5000,
        },
      },
    };

    mockConstructWebhookEvent.mockResolvedValue(event);
    mockGetBookingById.mockResolvedValue({
      id: 12,
      depositPaid: true,
      status: "confirmed",
    });

    const req = createReq();
    const res = createRes();

    await handleStripeWebhook(req as any, res as any);

    expect(mockWithTransaction).not.toHaveBeenCalled();
    expect(mockUpdateBooking).not.toHaveBeenCalled();
    expect(mockQueueWebhookForRetry).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it("ignores invalid booking metadata without queuing retry", async () => {
    const event = {
      id: "evt_live_4",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_invalid",
          metadata: { bookingId: "not-a-number" },
          payment_intent: "pi_invalid",
          amount_total: 5000,
        },
      },
    };

    mockConstructWebhookEvent.mockResolvedValue(event);

    const req = createReq();
    const res = createRes();

    await handleStripeWebhook(req as any, res as any);

    expect(mockGetBookingById).not.toHaveBeenCalled();
    expect(mockUpdateBooking).not.toHaveBeenCalled();
    expect(mockQueueWebhookForRetry).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it("queues webhook retry when subscription processing fails", async () => {
    const event = {
      id: "evt_live_5",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_fail",
          customer: "cus_fail",
          items: {
            data: [{ plan: { id: "price_plus" } }],
          },
        },
      },
    };

    mockConstructWebhookEvent.mockResolvedValue(event);
    mockStripePriceToClientTier.mockReturnValue("client_plus");
    mockGetDb.mockResolvedValue(null);

    const req = createReq();
    const res = createRes();

    await handleStripeWebhook(req as any, res as any);

    expect(mockQueueWebhookForRetry).toHaveBeenCalledTimes(1);
    expect(mockQueueWebhookForRetry).toHaveBeenCalledWith(
      "evt_live_5",
      "customer.subscription.updated",
      event,
      expect.stringContaining("Database not available for subscription webhook"),
    );

    expect(res.json).toHaveBeenCalledWith({ received: true, queued: true });
  });

  it("queues webhook retry when payment update transaction fails", async () => {
    const event = {
      id: "evt_live_6",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_fail",
          metadata: { bookingId: "77" },
          payment_intent: "pi_fail",
          amount_total: 5000,
        },
      },
    };

    mockConstructWebhookEvent.mockResolvedValue(event);
    mockGetBookingById.mockResolvedValue({
      id: 77,
      depositPaid: false,
      status: "pending",
    });
    mockWithTransaction.mockRejectedValue(new Error("transaction failed"));

    const req = createReq();
    const res = createRes();

    await handleStripeWebhook(req as any, res as any);

    expect(mockQueueWebhookForRetry).toHaveBeenCalledWith(
      "evt_live_6",
      "checkout.session.completed",
      event,
      expect.stringContaining("transaction failed"),
    );
    expect(res.json).toHaveBeenCalledWith({ received: true, queued: true });
  });
});
