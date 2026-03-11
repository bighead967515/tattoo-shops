import { Request, Response } from "express";
import Stripe from "stripe";
import { constructWebhookEvent, stripePriceToClientTier } from "./stripe";
import * as db from "./db";
import { getDb } from "./db";
import { clients, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { logger } from "./_core/logger";
import {
  queueWebhookForRetry,
  startQueueProcessor,
  getQueueStats,
} from "./webhookQueue";
import { CLIENT_TIER_LIMITS } from "../shared/tierLimits";

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
    // CLIENT SUBSCRIPTION LIFECYCLE
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

  const priceId = subscription.items.data[0]?.plan?.id;
  if (!priceId) {
    logger.warn("Subscription event missing plan price ID", {
      eventType,
      subscriptionId: subscription.id,
    });
    return;
  }

  const tier = stripePriceToClientTier(priceId);
  if (!tier) {
    logger.debug(
      "Subscription price does not match a client tier — may be an artist subscription",
      {
        priceId,
        subscriptionId: subscription.id,
      },
    );
    return;
  }

  const database = await getDb();
  if (!database) {
    throw new Error("Database not available for subscription webhook");
  }

  // Find the user by stripeCustomerId
  const [user] = await database
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, stripeCustomerId))
    .limit(1);

  if (!user) {
    logger.warn(
      "No user found for stripeCustomerId during subscription change",
      {
        stripeCustomerId,
        subscriptionId: subscription.id,
      },
    );
    return;
  }

  const tierLimits = CLIENT_TIER_LIMITS[tier];
  const aiCredits =
    tierLimits.aiGenerationsPerMonth === Number.MAX_SAFE_INTEGER
      ? 999
      : tierLimits.aiGenerationsPerMonth;

  // Atomically update users (source of truth) and clients (legacy copy)
  await database.transaction(async (tx) => {
    // Update canonical tier on users table
    await tx
      .update(users)
      .set({
        subscriptionTier: tier,
        stripeSubscriptionId: subscription.id,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Propagate to clients table (legacy sync)
    await tx
      .update(clients)
      .set({
        subscriptionTier: tier,
        aiCredits,
        stripeSubscriptionId: subscription.id,
        updatedAt: new Date(),
      })
      .where(eq(clients.userId, user.id));
  });

  logger.info("Client subscription changed", {
    userId: user.id,
    tier,
    aiCredits,
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

  const [user] = await database
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, stripeCustomerId))
    .limit(1);

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

  await database.transaction(async (tx) => {
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
  });

  logger.info("Client subscription cancelled — downgraded to free", {
    userId: user.id,
    subscriptionId: subscription.id,
  });
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
