import { Request, Response } from "express";
import Stripe from "stripe";
import { constructWebhookEvent, stripePriceToArtistTier } from "./stripe";
import * as db from "./db";
import { getDb } from "./db";
import { clients, users, tattooRequests, artists } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { logger } from "./_core/logger";
import {
  queueWebhookForRetry,
  startQueueProcessor,
  getQueueStats,
} from "./webhookQueue";

import { REQUEST_ADDON_PAYMENT_STATUSES } from "@shared/requestAddons";

// Flag to track if processor is started
let processorStarted = false;

/**
 * Start the webhook retry queue processor
 * Call this on server startup
 */
export function initWebhookProcessor(): void {
  if (processorStarted) return;

  startQueueProcessor(async (eventType, payload) => {
    // Re-process the webhook event
    await processWebhookEvent(eventType, payload as Stripe.Event);
  }, 60000); // Check every minute

  processorStarted = true;
  logger.info("Webhook retry processor initialized");
}

/**
 * Process a webhook event (used by both direct handler and retry queue)
 */
async function processWebhookEvent(
  eventType: string,
  event: Stripe.Event,
): Promise<void> {
  switch (eventType) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.metadata?.type === "addon_purchase" || session.metadata?.paymentType === "request_addons") {
        await handleRequestAddonCheckoutCompleted(session);
        break;
      }

      if (session.metadata?.type === "token_pack") {
        await handleTokenPackCheckoutCompleted(session);
        break;
      }

      // Subscription checkout completion path
      if (session.mode === "subscription") {
        await handleSubscriptionCheckoutCompleted(session);
        break;
      }

      const bookingId = parseInt(session.metadata?.bookingId || "0", 10);

      if (!bookingId || isNaN(bookingId) || bookingId <= 0) {
        logger.warn(
          "Webhook received checkout.session.completed with invalid bookingId",
          {
            sessionId: session.id,
            hasPaymentIntent: !!session.payment_intent,
          },
        );
        return; // Don't retry for invalid data
      }

      // Check if already processed (idempotency)
      const existingBooking = await db.getBookingById(bookingId);
      if (
        existingBooking &&
        (Boolean(existingBooking.depositPaid) ||
          existingBooking.status === "confirmed")
      ) {
        logger.debug("Webhook duplicate detected - booking already processed", {
          bookingId,
        });
        return;
      }

      // Guard against null amount_total
      const depositAmount = session.amount_total
        ? Number(session.amount_total)
        : 0;

      // Update booking with payment information - use transaction for atomicity
      await db.withTransaction(async () => {
        await db.updateBooking(bookingId, {
          stripePaymentIntentId: session.payment_intent as string,
          depositAmount,
          depositPaid: true,
          status: "confirmed",
        });
      });

      logger.info("Payment confirmed for booking", { bookingId });
      break;
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      logger.debug("Payment intent succeeded", { stripeId: paymentIntent.id });
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      logger.warn("Payment intent failed", {
        stripeId: paymentIntent.id,
        amount: paymentIntent.amount,
      });

      // Try to find and update the booking
      const bookingId = paymentIntent.metadata?.bookingId
        ? parseInt(paymentIntent.metadata.bookingId, 10)
        : null;

      if (bookingId && !isNaN(bookingId) && bookingId > 0) {
        await db.updateBooking(bookingId, {
          status: "cancelled",
          stripePaymentIntentId: paymentIntent.id,
        });
      } else {
        logger.warn(
          "Could not update booking for failed payment - missing or invalid bookingId",
        );
      }
      break;
    }

    // ============================================
    // SUBSCRIPTION LIFECYCLE
    // ============================================

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(subscription, eventType);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionCancelled(subscription);
      break;
    }

    default:
      logger.debug("Received unhandled webhook event type", { eventType });
  }
}

async function handleRequestAddonCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const rawRequestId = session.metadata?.requestId;
  const requestId = rawRequestId ? parseInt(rawRequestId, 10) : 0;

  if (!requestId || isNaN(requestId) || requestId <= 0) {
    logger.warn("Request add-on checkout missing valid requestId", {
      sessionId: session.id,
    });
    return;
  }

  // Parse the purchased addons list if present
  const rawAddons = session.metadata?.addons;
  let purchasedAddons: string[] = [];
  if (rawAddons) {
    try {
      const parsed = JSON.parse(rawAddons) as unknown;
      if (Array.isArray(parsed)) {
        purchasedAddons = parsed.filter((a): a is string => typeof a === "string");
      }
    } catch {
      logger.warn("Failed to parse addons JSON from webhook metadata", { rawAddons, sessionId: session.id });
    }
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const database = await getDb();
  if (!database) {
    throw new Error("Database not available for request add-on webhook");
  }

  // Build the update payload
  const updatePayload: {
    addOnPaymentStatus: typeof REQUEST_ADDON_PAYMENT_STATUSES[keyof typeof REQUEST_ADDON_PAYMENT_STATUSES];
    addOnStripePaymentIntentId: string | null;
    addOnPaidAt: Date;
    selectedAddons?: string[];
    priorityExpiresAt?: Date | null;
    blindBids?: boolean;
    updatedAt: Date;
  } = {
    addOnPaymentStatus: REQUEST_ADDON_PAYMENT_STATUSES.PAID,
    addOnStripePaymentIntentId: paymentIntentId ?? null,
    addOnPaidAt: new Date(),
    updatedAt: new Date(),
  };

  if (purchasedAddons.length > 0) {
    updatePayload.selectedAddons = purchasedAddons;
  }

  if (purchasedAddons.includes("priorityListing")) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    updatePayload.priorityExpiresAt = expiresAt;
  }

  if (purchasedAddons.includes("blindBids")) {
    updatePayload.blindBids = true;
  }

  await database
    .update(tattooRequests)
    .set(updatePayload)
    .where(eq(tattooRequests.id, requestId));

  logger.info("Request add-on payment marked paid", {
    requestId,
    sessionId: session.id,
    paymentIntentId,
    addons: purchasedAddons,
  });
}

/**
 * Handle artist token pack checkout completion.
 * Increments bidTokens or chatTokens on the artist record atomically.
 */
async function handleTokenPackCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const packType = session.metadata?.packType as "bid" | "chat" | undefined;
  const rawPackSize = session.metadata?.packSize;
  const rawArtistId = session.metadata?.artistId;

  if (!packType || !rawPackSize || !rawArtistId) {
    logger.warn("Token pack checkout missing required metadata", {
      sessionId: session.id,
      packType,
      rawPackSize,
      rawArtistId,
    });
    return;
  }

  const packSize = parseInt(rawPackSize, 10);
  const artistId = parseInt(rawArtistId, 10);

  if (isNaN(packSize) || packSize <= 0 || isNaN(artistId) || artistId <= 0) {
    logger.warn("Token pack checkout has invalid packSize or artistId", {
      sessionId: session.id,
      packSize,
      artistId,
    });
    return;
  }

  const database = await getDb();
  if (!database) {
    throw new Error("Database not available for token pack webhook");
  }

  if (packType === "bid") {
    await database
      .update(artists)
      .set({ bidTokens: sql`${artists.bidTokens} + ${packSize}`, updatedAt: new Date() })
      .where(eq(artists.id, artistId));
    logger.info("Artist bid tokens incremented", { artistId, packSize });
  } else if (packType === "chat") {
    await database
      .update(artists)
      .set({ chatTokens: sql`${artists.chatTokens} + ${packSize}`, updatedAt: new Date() })
      .where(eq(artists.id, artistId));
    logger.info("Artist chat tokens incremented", { artistId, packSize });
  } else {
    logger.warn("Unknown token pack type", { packType, sessionId: session.id });
  }
}

function parseUserIdFromMetadata(
  metadata?: Record<string, string | undefined> | null,
): number | null {
  const raw = metadata?.userId;
  if (!raw) return null;

  const userId = parseInt(raw, 10);
  if (isNaN(userId) || userId <= 0) return null;
  return userId;
}

async function resolveUserForSubscription(
  database: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  stripeCustomerId: string,
  metadata?: Record<string, string | undefined> | null,
) {
  let user:
    | {
        id: number;
        stripeCustomerId: string | null;
      }
    | undefined;

  if (stripeCustomerId) {
    [user] = await database
      .select({ id: users.id, stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.stripeCustomerId, stripeCustomerId))
      .limit(1);
  }

  if (!user) {
    const metadataUserId = parseUserIdFromMetadata(metadata);
    if (metadataUserId) {
      [user] = await database
        .select({ id: users.id, stripeCustomerId: users.stripeCustomerId })
        .from(users)
        .where(eq(users.id, metadataUserId))
        .limit(1);
    }
  }

  return user;
}

async function handleSubscriptionCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;


  const database = await getDb();
  if (!database) {
    throw new Error(
      "Database not available for subscription checkout completion webhook",
    );
  }

  const user = await resolveUserForSubscription(
    database,
    customerId ?? "",
    session.metadata,
  );

  if (!user) {
    logger.warn("No user found for completed subscription checkout", {
      sessionId: session.id,
      stripeCustomerId: customerId,
      subscriptionId,
      metadataUserId: session.metadata?.userId,
    });
    return;
  }

  await database.transaction(async (tx) => {
    const userUpdate: {
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (customerId) userUpdate.stripeCustomerId = customerId;
    if (subscriptionId) userUpdate.stripeSubscriptionId = subscriptionId;

    await tx.update(users).set(userUpdate).where(eq(users.id, user.id));
  });

  logger.info("Subscription checkout completed and customer reconciled", {
    userId: user.id,
    sessionId: session.id,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
  });
}

/**
 * Handle subscription created / updated events.
 * Maps the Stripe Price ID to a client tier, updates both
 * the canonical `users.subscriptionTier` and the legacy
 * `clients.subscriptionTier` + `aiCredits`.
 */
async function handleSubscriptionChange(
  subscription: Stripe.Subscription,
  eventType: string,
): Promise<void> {
  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const priceId =
    subscription.items.data[0]?.price?.id || subscription.items.data[0]?.plan?.id;
  if (!priceId) {
    logger.warn("Subscription event missing plan price ID", {
      eventType,
      subscriptionId: subscription.id,
    });
    return;
  }

  // First check if this is an artist tier subscription
  const artistTier = stripePriceToArtistTier(priceId);
  if (artistTier) {
    await handleArtistSubscriptionChange(subscription, artistTier, eventType);
    return;
  }

  logger.debug(
    "Subscription price does not match any known artist tier",
    {
      priceId,
      subscriptionId: subscription.id,
    },
  );
}

/**
 * Handle artist subscription created / updated events.
 * Updates both users.subscriptionTier and artists.subscriptionTier.
 */
async function handleArtistSubscriptionChange(
  subscription: Stripe.Subscription,
  tier: "artist_paygo" | "artist_pro" | "artist_elite",
  eventType: string,
): Promise<void> {
  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const grantableStatuses = new Set<Stripe.Subscription.Status>(["active", "trialing"]);
  if (!grantableStatuses.has(subscription.status)) {
    logger.info("Skipping artist tier grant for non-grantable subscription status", {
      subscriptionId: subscription.id,
      status: subscription.status,
      eventType,
    });
    return;
  }

  const database = await getDb();
  if (!database) throw new Error("Database not available for artist subscription webhook");

  const user = await resolveUserForSubscription(database, stripeCustomerId, subscription.metadata);
  if (!user) {
    logger.warn("No user found for artist subscription change", {
      stripeCustomerId,
      subscriptionId: subscription.id,
    });
    return;
  }

  await database.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ stripeCustomerId, subscriptionTier: tier, stripeSubscriptionId: subscription.id, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    const isFoundingArtist = subscription.metadata?.isFoundingArtist === "true";
    const artistUpdate: {
      subscriptionTier: typeof tier;
      updatedAt: Date;
      isFoundingArtist?: boolean;
      foundingTrialEndsAt?: Date | null;
    } = { subscriptionTier: tier, updatedAt: new Date() };

    if (isFoundingArtist) {
      artistUpdate.isFoundingArtist = true;
      // trial_end from Stripe is a Unix timestamp in seconds
      const trialEnd = subscription.trial_end;
      artistUpdate.foundingTrialEndsAt = trialEnd ? new Date(trialEnd * 1000) : null;
    }

    await tx
      .update(artists)
      .set(artistUpdate)
      .where(eq(artists.userId, user.id));
  });

  logger.info("Artist subscription changed", {
    userId: user.id,
    tier,
    subscriptionId: subscription.id,
    eventType,
  });
}

/**
 * Handle subscription cancellation / expiration.
 * Downgrades the client back to the free tier.
 */
async function handleSubscriptionCancelled(
  subscription: Stripe.Subscription,
): Promise<void> {
  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const database = await getDb();
  if (!database) {
    throw new Error(
      "Database not available for subscription cancellation webhook",
    );
  }

  const user = await resolveUserForSubscription(
    database,
    stripeCustomerId,
    subscription.metadata,
  );

  if (!user) {
    logger.warn(
      "No user found for stripeCustomerId during subscription cancellation",
      {
        stripeCustomerId,
        subscriptionId: subscription.id,
      },
    );
    return;
  }

  // Determine whether this user is an artist or a client so we downgrade
  // to the correct free tier — artist_free for artists, client_free for clients.
  const [artistRow] = await database
    .select({ id: artists.id })
    .from(artists)
    .where(eq(artists.userId, user.id))
    .limit(1);

  const isArtist = !!artistRow;

  await database.transaction(async (tx) => {
    if (isArtist) {
      await tx
        .update(users)
        .set({
          subscriptionTier: "artist_free",
          stripeSubscriptionId: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Keep deprecated column in sync for backward compat
      await tx
        .update(artists)
        .set({
          subscriptionTier: "artist_free",
          updatedAt: new Date(),
        })
        .where(eq(artists.userId, user.id));
    } else {
      await tx
        .update(users)
        .set({
          subscriptionTier: "client_free",
          stripeSubscriptionId: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      await tx
        .update(clients)
        .set({
          subscriptionTier: "client_free",
          aiCredits: 0,
          stripeSubscriptionId: null,
          updatedAt: new Date(),
        })
        .where(eq(clients.userId, user.id));
    }
  });

  logger.info(
    `${isArtist ? "Artist" : "Client"} subscription cancelled — downgraded to free`,
    {
      userId: user.id,
      subscriptionId: subscription.id,
      isArtist,
    },
  );
}

export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"];

  if (!signature || typeof signature !== "string") {
    logger.warn("Webhook request missing stripe-signature header");
    return res.status(400).send("Missing signature");
  }

  let event: Stripe.Event;

  try {
    event = await constructWebhookEvent(req.body, signature);
    logger.debug("Processing webhook event", {
      eventType: event.type,
      eventId: event.id,
    });
  } catch (error) {
    logger.error("Webhook signature verification failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return res
      .status(400)
      .send(
        `Webhook Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    logger.info("Test event received and verified");
    return res.json({
      verified: true,
    });
  }

  // Process the event, queue for retry on failure
  try {
    await processWebhookEvent(event.type, event);
    res.json({ received: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error("Webhook processing failed, queueing for retry", {
      eventId: event.id,
      eventType: event.type,
      error: errorMessage,
    });

    // Queue for retry instead of failing immediately
    await queueWebhookForRetry(event.id, event.type, event, errorMessage);

    // Return success to Stripe so it doesn't retry immediately
    // We'll handle retries ourselves with exponential backoff
    res.json({ received: true, queued: true });
  }
}

/**
 * Get webhook queue statistics (for health/monitoring endpoints)
 */
export async function getWebhookQueueStats() {
  return getQueueStats();
}
