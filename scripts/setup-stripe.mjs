import 'dotenv/config';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function main() {
  console.log('Starting Stripe setup...');
  
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in your .env file!');
  }

  // 1. Artist Pro
  console.log('Creating Artist Pro tier...');
  const proProduct = await stripe.products.create({
    name: 'Artist Pro',
    description: 'The full toolkit for artists. Unlimited portfolio, booking calendar, and 5% transaction fee.',
  });
  const proMonth = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 2900,
    currency: 'usd',
    recurring: { interval: 'month' },
  });
  const proYear = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 23200,
    currency: 'usd',
    recurring: { interval: 'year' },
  });

  // 2. Artist Pay-as-you-go
  console.log('Creating Artist Pay-as-you-go tier...');
  const paygProduct = await stripe.products.create({
    name: 'Artist Pay-as-you-go',
    description: 'No subscription. 10% transaction fee on accepted bids.',
  });
  const paygMonth = await stripe.prices.create({
    product: paygProduct.id,
    unit_amount: 0,
    currency: 'usd',
    recurring: { interval: 'month' },
  });
  const paygYear = await stripe.prices.create({
    product: paygProduct.id,
    unit_amount: 0,
    currency: 'usd',
    recurring: { interval: 'year' },
  });

  // 3. Founding Artist
  console.log('Creating Founding Artist tier...');
  const iconProduct = await stripe.products.create({
    name: 'Founding Artist',
    description: 'Locked-in rate for life. 6 months free.',
  });
  const iconMonth = await stripe.prices.create({
    product: iconProduct.id,
    unit_amount: 1900,
    currency: 'usd',
    recurring: { interval: 'month' },
  });
  const iconYear = await stripe.prices.create({
    product: iconProduct.id,
    unit_amount: 19000,
    currency: 'usd',
    recurring: { interval: 'year' },
  });

  // 4. Client Enthusiast
  console.log('Creating Client Enthusiast tier...');
  const plusProduct = await stripe.products.create({
    name: 'Client Enthusiast',
    description: '10 AI generations, 10 tattoo requests, priority board access.',
  });
  const plusMonth = await stripe.prices.create({
    product: plusProduct.id,
    unit_amount: 900,
    currency: 'usd',
    recurring: { interval: 'month' },
  });

  // 5. Client Elite Ink
  console.log('Creating Client Elite Ink tier...');
  const eliteProduct = await stripe.products.create({
    name: 'Client Elite Ink',
    description: 'Unlimited AI, unlimited requests, direct chat, deposit fee waived.',
  });
  const eliteMonth = await stripe.prices.create({
    product: eliteProduct.id,
    unit_amount: 1900,
    currency: 'usd',
    recurring: { interval: 'month' },
  });

  // 6. Webhook Endpoint
  console.log('Creating Webhook Endpoint...');
  const webhook = await stripe.webhookEndpoints.create({
    url: 'https://your-render-app-url.onrender.com/api/stripe/webhook',
    enabled_events: [
      'checkout.session.completed',
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
    ],
  });

  console.log('\n=============================================');
  console.log('🎉 SETUP COMPLETE! 🎉');
  console.log('=============================================\n');
  console.log('Copy and paste the following directly into your Render environment variables (or your local .env file):\n');
  
  console.log(`STRIPE_ARTIST_AMATEUR_PRICE_ID_MONTH=${proMonth.id}`);
  console.log(`STRIPE_ARTIST_AMATEUR_PRICE_ID_YEAR=${proYear.id}`);
  console.log(`STRIPE_ARTIST_PRO_PRICE_ID_MONTH=${paygMonth.id}`);
  console.log(`STRIPE_ARTIST_PRO_PRICE_ID_YEAR=${paygYear.id}`);
  console.log(`STRIPE_ARTIST_ICON_PRICE_ID_MONTH=${iconMonth.id}`);
  console.log(`STRIPE_ARTIST_ICON_PRICE_ID_YEAR=${iconYear.id}`);
  console.log(`STRIPE_CLIENT_PLUS_PRICE_ID=${plusMonth.id}`);
  console.log(`STRIPE_CLIENT_ELITE_PRICE_ID=${eliteMonth.id}`);
  console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
  
  console.log('\n⚠️ IMPORTANT NEXT STEP:');
  console.log('When you deploy to Render, you MUST go to your Stripe Dashboard -> Developers -> Webhooks, and update the URL from "your-render-app-url.onrender.com" to your actual live URL.');
  console.log('=============================================\n');
}

main().catch(err => {
  console.error('\n❌ ERROR: Failed to configure Stripe.');
  console.error('Make sure your STRIPE_SECRET_KEY is correct in your .env file, and that it has Write permissions for Products, Prices, and Webhook Endpoints.');
  console.error('Error Details:', err.message);
});
