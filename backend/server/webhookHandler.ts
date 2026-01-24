import { Request, Response } from "express";
import Stripe from "stripe";
import { constructWebhookEvent } from "./stripe";
import * as db from "./db";
import { logger } from "./_core/logger";

export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"];

  if (!signature || typeof signature !== "string") {
    logger.warn("Webhook request missing stripe-signature header");
    return res.status(400).send("Missing signature");
  }

  try {
    const event = await constructWebhookEvent(req.body, signature);

    logger.debug("Processing webhook event", { eventType: event.type, eventId: event.id });

    // Handle test events
    if (event.id.startsWith("evt_test_")) {
      logger.info("Test event received and verified");
      return res.json({
        verified: true,
      });
    }

    // Handle real events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = parseInt(session.metadata?.bookingId || "0", 10);

        if (!bookingId || isNaN(bookingId) || bookingId <= 0) {
          logger.warn("Webhook received checkout.session.completed with invalid bookingId", {
            sessionId: session.id,
            hasPaymentIntent: !!session.payment_intent,
          });
          // Don't fail the webhook - return success so Stripe doesn't retry
          return res.json({ received: true, warning: "Invalid bookingId" });
        }
        
        // Check if already processed (idempotency)
        const existingBooking = await db.getBookingById(bookingId);
        if (existingBooking && (Boolean(existingBooking.depositPaid) || existingBooking.status === "confirmed")) {
          logger.debug("Webhook duplicate detected - booking already processed", { bookingId });
          return res.json({ received: true, duplicate: true });
        }

        // Guard against null amount_total
        const depositAmount = session.amount_total ? Number(session.amount_total) : 0;
        
        // Update booking with payment information - use transaction for atomicity
        try {
          await db.withTransaction(async (tx) => {
            await db.updateBooking(bookingId, {
              stripePaymentIntentId: session.payment_intent as string,
              depositAmount,
              depositPaid: true,
              status: "confirmed",
            });
          });

          logger.info("Payment confirmed for booking", { bookingId });
        } catch (error) {
          logger.error("Failed to update booking in transaction", {
            bookingId,
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as any;
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
          }).catch(err => {
            logger.error("Failed to update booking status on payment failure", { 
              bookingId, 
              error: err instanceof Error ? err.message : String(err) 
            });
          });
        } else {
          logger.warn("Could not update booking for failed payment - missing or invalid bookingId");
        }
        break;
      }

      default:
        logger.debug("Received unhandled webhook event type", { eventType: event.type });
    }

    res.json({ received: true });
  } catch (error) {
    logger.error("Webhook processing failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
