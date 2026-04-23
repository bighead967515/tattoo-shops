"""
Create / update Stripe products and prices for the new 3-layer monetization plan.

Layer 1 — Free: no Stripe product needed
Layer 2 — Pro Subscription: $29/mo or $232/yr (≈$19.33/mo, 2 months free)
           Founding Artist: $19/mo or $190/yr (lifetime lock-in)
Layer 3 — Pay-as-you-go: no Stripe subscription, 10% transaction fee on bids

Run:
    python3 scripts/setup_new_plans.py
"""

import os, sys
import stripe

# Load .env
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
if not stripe.api_key:
    sys.exit("STRIPE_SECRET_KEY not set")

def create_product_with_prices(name, description, metadata, prices):
    """Create a product and attach monthly + yearly prices."""
    print(f"\n{'='*60}")
    print(f"Creating product: {name}")

    product = stripe.Product.create(
        name=name,
        description=description,
        metadata=metadata,
    )
    print(f"  Product ID: {product.id}")

    result = {"product_id": product.id}
    for label, amount, interval in prices:
        price = stripe.Price.create(
            product=product.id,
            unit_amount=amount,
            currency="usd",
            recurring={"interval": interval},
            nickname=f"{name} — {label}",
            metadata={**metadata, "interval": interval},
        )
        print(f"  {label} Price ID: {price.id}  (${amount/100:.2f}/{interval})")
        result[f"price_{interval}"] = price.id

    return result


# ── Pro Subscription ──────────────────────────────────────────────────────────
pro = create_product_with_prices(
    name="Ink Connect Pro",
    description=(
        "Full artist toolkit: unlimited portfolio, bidding access, booking calendar, "
        "Stripe payments, verified badge, messaging, analytics. "
        "5% platform fee on accepted bids."
    ),
    metadata={"tier_key": "artist_pro", "platform": "ink_connect"},
    prices=[
        ("Monthly", 2900, "month"),   # $29.00/mo
        ("Annual",  23200, "year"),   # $232.00/yr ($19.33/mo — 2 months free)
    ],
)

# ── Founding Artist ───────────────────────────────────────────────────────────
founding = create_product_with_prices(
    name="Ink Connect Founding Artist",
    description=(
        "Founding member rate — locked in for life. "
        "All Pro features plus Founding Artist badge and homepage carousel placement. "
        "5% platform fee on accepted bids. "
        "First 6 months free via coupon, then $19/mo forever."
    ),
    metadata={"tier_key": "artist_founding", "platform": "ink_connect"},
    prices=[
        ("Monthly (Lifetime $19)", 1900, "month"),  # $19.00/mo locked
        ("Annual (Lifetime)",      19000, "year"),  # $190.00/yr locked
    ],
)

# ── Summary ───────────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("DONE. Add these to your .env / Render env vars:\n")
print(f"STRIPE_ARTIST_PRO_PRICE_ID_MONTH={pro['price_month']}")
print(f"STRIPE_ARTIST_PRO_PRICE_ID_YEAR={pro['price_year']}")
print(f"STRIPE_ARTIST_FOUNDING_PRICE_ID_MONTH={founding['price_month']}")
print(f"STRIPE_ARTIST_FOUNDING_PRICE_ID_YEAR={founding['price_year']}")

# ── Create 6-month free coupon for Founding Artists ───────────────────────────
print("\nCreating Founding Artist 6-month free coupon...")
coupon = stripe.Coupon.create(
    id="FOUNDING_ARTIST_6MO",
    duration="repeating",
    duration_in_months=6,
    percent_off=100,
    name="Founding Artist — 6 Months Free",
    metadata={"platform": "ink_connect", "tier_key": "artist_founding"},
)
print(f"  Coupon ID: {coupon.id}  ({coupon.percent_off}% off for {coupon.duration_in_months} months)")
print(f"\nUse coupon code FOUNDING_ARTIST_6MO at checkout for founding members.")
