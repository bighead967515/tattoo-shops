import { Request, Response } from "express";
import Stripe from "stripe";
import { constructWebhookEvent } from "./stripe";
import * as db from "./db";

export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"];

  if (!signature || typeof signature !== "string") {
    console.error("[Webhook] Missing or invalid stripe-signature header");
    return res.status(400).send("Missing signature");
  }

  try {
    const event = await constructWebhookEvent(req.body, signature);

    console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

    // Handle test events
    if (event.id.startsWith("evt_test_")) {
      console.log("[Webhook] Test event detected, returning verification response");
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
          console.warn(
            `[Webhook] Missing or invalid bookingId in checkout.session.completed`,
            {
              sessionId: session.id,
              paymentIntent: session.payment_intent,
              amountTotal: session.amount_total,
              metadata: session.metadata
            }
          );
          // Don't fail the webhook - return success so Stripe doesn't retry
          return res.json({ received: true, warning: "Invalid bookingId" });
        }
        
        // Check if already processed (idempotency)
        const existingBooking = await db.getBookingById(bookingId);
        if (existingBooking && (existingBooking.depositPaid === 1 || existingBooking.status === "confirmed")) {
          console.log(`[Webhook] Booking ${bookingId} already processed, skipping duplicate event ${event.id}`);
          return res.json({ received: true, duplicate: true });
        }

        console.log(`[Webhook] Payment successful for booking ${bookingId}`);
        
        // Guard against null amount_total
        const depositAmount = session.amount_total ? Number(session.amount_total) : 0;
        
        // Update booking with payment information
        await db.updateBooking(bookingId, {
          stripePaymentIntentId: session.payment_intent as string,
          depositAmount,
          depositPaid: 1,
          status: "confirmed",
        });

        console.log(`[Webhook] Booking ${bookingId} updated successfully`);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as any;
        console.log(`[Webhook] Payment intent succeeded: ${paymentIntent.id}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error(`[Webhook] Payment failed: ${paymentIntent.id}`, {
          failureReason: paymentIntent.last_payment_error?.message || paymentIntent.cancellation_reason,
          amount: paymentIntent.amount,
          metadata: paymentIntent.metadata
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
            console.error(`[Webhook] Failed to update booking ${bookingId} on payment failure:`, err);
          });
        } else {
          console.warn(
            `[Webhook] Cannot update booking for failed payment - missing or invalid bookingId`,
            { paymentIntentId: paymentIntent.id, metadata: paymentIntent.metadata }
          );
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
