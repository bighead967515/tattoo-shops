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
 * Map a Stripe Price ID to an artist subscription tier.
 * Covers both monthly and yearly prices for all paid artist tiers.
 * Returns null if the Price ID doesn't match a known artist tier.
 */
export function stripePriceToArtistTier(
  priceId: string,
): "artist_paygo" | "artist_pro" | "artist_elite" | null {
  const { 
    stripeArtistAmateurPriceIdMonth, stripeArtistAmateurPriceIdYear,
    stripeArtistProPriceIdMonth,     stripeArtistProPriceIdYear,
    stripeArtistIconPriceIdMonth,    stripeArtistIconPriceIdYear,
  } = ENV;

  if (priceId === stripeArtistProPriceIdMonth || priceId === stripeArtistProPriceIdYear)
    return "artist_pro";
  if (priceId === stripeArtistIconPriceIdMonth || priceId === stripeArtistIconPriceIdYear)
    return "artist_elite";
  if (priceId === stripeArtistAmateurPriceIdMonth || priceId === stripeArtistAmateurPriceIdYear)
    return "artist_paygo";

  return null;
}

/**
 * Create a Stripe Checkout Session for an artist subscription upgrade.
 */
export async function createArtistSubscriptionCheckout({
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
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      ...(stripeCustomerId
        ? { customer: stripeCustomerId }
        : { customer_email: customerEmail }),
      metadata,
      subscription_data: { metadata },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });
    return session;
  });
}

/**
 * Create a Stripe Checkout Session for the Founding Artist offer.
 * - Uses the artist_amateur price ID at $19/mo
 * - Adds a 180-day (6-month) free trial via trial_period_days
 * - Stores isFoundingArtist: "true" in metadata so the webhook can mark the artist
 */
export async function createFoundingArtistCheckout({
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
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      ...(stripeCustomerId
        ? { customer: stripeCustomerId }
        : { customer_email: customerEmail }),
      metadata: { ...metadata, isFoundingArtist: "true" },
      subscription_data: {
        trial_period_days: 180,
        metadata: { ...metadata, isFoundingArtist: "true" },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: false, // Founding offer IS the promo — no stacking
    });
    return session;
  });
}

export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
): Promise<Stripe.Event> {
  if (!ENV.stripeWebhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is required");
  }

  return stripe.webhooks.constructEvent(
    payload,
    signature,
    ENV.stripeWebhookSecret,
  );
}

export async function refundPaymentIntent(
  paymentIntentId: string,
  amount?: number,
): Promise<Stripe.Refund> {
  return stripeCircuit.execute(async () => {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...(amount ? { amount } : {}),
    });
    return refund;
  });
}
