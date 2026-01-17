import { Request, Response } from "express";
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
        const session = event.data.object as any;
        const bookingId = parseInt(session.metadata?.bookingId || "0");

        if (bookingId) {
          console.log(`[Webhook] Payment successful for booking ${bookingId}`);
          
          // Update booking with payment information
          await db.updateBooking(bookingId, {
            stripePaymentIntentId: session.payment_intent as string,
            depositAmount: session.amount_total,
            depositPaid: 1,
            status: "confirmed",
          });

          console.log(`[Webhook] Booking ${bookingId} updated successfully`);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as any;
        console.log(`[Webhook] Payment intent succeeded: ${paymentIntent.id}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as any;
        console.error(`[Webhook] Payment failed: ${paymentIntent.id}`);
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
