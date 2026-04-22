"""
Create Stripe Products and Prices for Ink Connect's 4-tier artist monetization plan.

Tiers:
  1. Apprentice  — Free ($0)
  2. Artist      — $9/mo  | $90/yr  (save 2 months)
  3. Professional— $19/mo | $190/yr (save 2 months)
  4. Icon        — $39/mo | $390/yr (save 2 months)
"""

import stripe
import json

stripe.api_key = os.environ["STRIPE_SECRET_KEY"]  # set via env var

PLANS = [
    {
        "key": "artist_amateur",
        "name": "Ink Connect — Artist",
        "description": "Unlock bookings, direct contact, and a verified badge. Perfect for artists ready to grow their client base.",
        "monthly_cents": 900,
        "yearly_cents": 9000,
    },
    {
        "key": "artist_pro",
        "name": "Ink Connect — Professional",
        "description": "Full suite: unlimited portfolio, analytics, review management, and exact location listing.",
        "monthly_cents": 1900,
        "yearly_cents": 19000,
    },
    {
        "key": "artist_icon",
        "name": "Ink Connect — Icon",
        "description": "Maximum visibility: everything in Professional plus homepage carousel feature placement.",
        "monthly_cents": 3900,
        "yearly_cents": 39000,
    },
]

results = {}

for plan in PLANS:
    print(f"\n--- Creating product: {plan['name']} ---")

    # Create the Product
    product = stripe.Product.create(
        name=plan["name"],
        description=plan["description"],
        metadata={"tier_key": plan["key"], "app": "ink_connect"},
    )
    print(f"  Product ID: {product.id}")

    # Monthly price
    price_mo = stripe.Price.create(
        product=product.id,
        unit_amount=plan["monthly_cents"],
        currency="usd",
        recurring={"interval": "month"},
        nickname=f"{plan['name']} — Monthly",
        metadata={"tier_key": plan["key"], "billing": "monthly"},
    )
    print(f"  Monthly Price ID: {price_mo.id}  (${plan['monthly_cents']/100:.2f}/mo)")

    # Yearly price
    price_yr = stripe.Price.create(
        product=product.id,
        unit_amount=plan["yearly_cents"],
        currency="usd",
        recurring={"interval": "year"},
        nickname=f"{plan['name']} — Yearly",
        metadata={"tier_key": plan["key"], "billing": "yearly"},
    )
    print(f"  Yearly  Price ID: {price_yr.id}  (${plan['yearly_cents']/100:.2f}/yr)")

    results[plan["key"]] = {
        "product_id": product.id,
        "price_id_monthly": price_mo.id,
        "price_id_yearly": price_yr.id,
        "monthly_cents": plan["monthly_cents"],
        "yearly_cents": plan["yearly_cents"],
    }

print("\n\n=== SUMMARY ===")
print(json.dumps(results, indent=2))

# Write results to a file for easy reference
with open("/home/ubuntu/tattoo-shops/scripts/stripe_price_ids.json", "w") as f:
    json.dump(results, f, indent=2)

print("\nResults saved to scripts/stripe_price_ids.json")
