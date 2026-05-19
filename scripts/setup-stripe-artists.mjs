import 'dotenv/config';
import Stripe from 'stripe';

async function main() {
  console.log('Starting Stripe setup for Artists...');
  
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in your .env file!');
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // 1. Artist Pro
  console.log('Creating Artist Pro tier ($49/mo)...');
  const proProduct = await stripe.products.create({
    name: 'Artist Pro Studio',
    description: 'The full toolkit for artists. Unlimited portfolio, 5% transaction fee, unlimited bids, 50 AI credits.',
  });
  const proMonth = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 4900,
    currency: 'usd',
    recurring: { interval: 'month' },
  });
  const proYear = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 49000,
    currency: 'usd',
    recurring: { interval: 'year' },
  });

  // 2. Artist Elite
  console.log('Creating Artist Elite tier ($99/mo)...');
  const eliteProduct = await stripe.products.create({
    name: 'Artist Elite Icon',
    description: 'The ultimate tier. 3% transaction fee, unlimited bids, unlimited AI credits, unlimited free chats, and a Sponsored Listing.',
  });
  const eliteMonth = await stripe.prices.create({
    product: eliteProduct.id,
    unit_amount: 9900,
    currency: 'usd',
    recurring: { interval: 'month' },
  });
  const eliteYear = await stripe.prices.create({
    product: eliteProduct.id,
    unit_amount: 99000,
    currency: 'usd',
    recurring: { interval: 'year' },
  });

  console.log('\n=============================================');
  console.log('🎉 ARTIST SETUP COMPLETE! 🎉');
  console.log('=============================================\n');
  console.log('Copy and paste the following directly into your Render environment variables (or your local .env file):\n');
  
  console.log(`STRIPE_ARTIST_PRO_PRICE_ID_MONTH=${proMonth.id}`);
  console.log(`STRIPE_ARTIST_PRO_PRICE_ID_YEAR=${proYear.id}`);
  console.log(`STRIPE_ARTIST_ELITE_PRICE_ID_MONTH=${eliteMonth.id}`);
  console.log(`STRIPE_ARTIST_ELITE_PRICE_ID_YEAR=${eliteYear.id}`);
  
  console.log('\n=============================================\n');
}

main().catch(err => {
  console.error('\n❌ ERROR: Failed to configure Stripe.');
  console.error('Error Details:', err.message);
});
