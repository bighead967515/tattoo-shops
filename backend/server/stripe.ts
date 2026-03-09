import Stripe from "stripe";
import { ENV } from "./_core/env";
import { stripeCircuit } from "./_core/circuitBreaker";

if (!ENV.stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

export const stripe = new Stripe(ENV.stripeSecretKey, {
  apiVersion: "2025-10-29.clover",
  timeout: 30000, // 30 second timeout
  maxNetworkRetries: 2, // Stripe's built-in retry
});

export async function createCheckoutSession({
  priceInCents,
  productName,
  productDescription,
  customerEmail,
  metadata,
  successUrl,
  cancelUrl,
}: {
  priceInCents: number;
  productName: string;
  productDescription: string;
  customerEmail: string;
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripeCircuit.execute(async () => {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productName,
              description: productDescription,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: customerEmail,
      metadata,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });

    return session;
  });
}

/**
 * Create a Stripe Checkout Session for a client subscription upgrade.
 * Uses `mode: "subscription"` with the Stripe Price ID for the chosen tier.
 */
export async function createSubscriptionCheckout({
  priceId,
  customerEmail,
  stripeCustomerId,
  metadata,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  customerEmail: string;
  stripeCustomerId?: string;
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripeCircuit.execute(async () => {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      ...(stripeCustomerId
        ? { customer: stripeCustomerId }
        : { customer_email: customerEmail }),
      metadata,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });

    return session;
  });
}

/**
 * Map a Stripe Price ID to a client subscription tier.
 * Returns null if the Price ID doesn't match a known client tier.
 */
export function stripePriceToClientTier(
  priceId: string
): "client_plus" | "client_elite" | null {
  if (priceId === ENV.stripeClientPlusPriceId) return "client_plus";
  if (priceId === ENV.stripeClientElitePriceId) return "client_elite";
  return null;
}

export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event> {
  if (!ENV.stripeWebhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is required");
  }

  return stripe.webhooks.constructEvent(
    payload,
    signature,
    ENV.stripeWebhookSecret
  );
}
