# Ink Connect Monetization Plan: Artist Tiers & Billing Report

This document outlines the detailed feature sets, pricing structure, billing capabilities, and transaction fees for the Ink Connect artist monetization system. The system employs a 3-layer monetization model designed to remove barriers to entry while aligning platform revenue with artist success.

---

## 1. The 3-Layer Monetization Model

The monetization strategy is built on three core pillars:

1. **Layer 1: Free Tier (The Funnel)** — Removes all barriers to joining and fills the supply side fast. Free artists make the platform look alive to clients.
2. **Layer 2: Pro Subscription (The Workhorse)** — Generates recurring revenue from serious artists who want tools that save them time and bring them clients.
3. **Layer 3: Transaction Fee on Bids** — Aligns revenue with artist success. The platform earns a percentage of accepted bids. Artists who hate subscriptions can use the Pay-as-you-go path (higher fee, no monthly cost), while Pro subscribers get a reduced fee as a reward for their commitment.

---

## 2. Tier Breakdown & Pricing

| Tier | Monthly Fee | Annual Fee | Transaction Fee | Who It's For |
| :--- | :--- | :--- | :--- | :--- |
| **Free** | $0 | $0 | N/A (no bidding) | New artists, hobbyists, exposure seekers |
| **Pay-as-you-go** | $0 | $0 | **10%** on accepted bids | Artists who prefer pure success-fee models |
| **Pro** | $29/mo | $232/yr | **5%** on accepted bids | Working artists, small studios |
| **Founding Artist** | $19/mo (locked) | $190/yr | **5%** on accepted bids | First 100 early adopters |

*Note: Annual billing for Pro and Founding Artist tiers includes a built-in "2 months free" discount.*

---

## 3. Detailed Tier Features

### Free Tier
*Purpose: Artist acquisition engine. Never charge for it.*

- **Portfolio Limit:** 10 photos
- **Directory Listing:** Yes (appears in search results)
- **Client Inquiries:** Yes (manual, no automation)
- **Profile:** Basic (style tags and location)
- **Bidding:** **Blocked.** (Must upgrade to Pay-as-you-go or Pro to bid)
- **Booking Calendar:** No
- **Payment Processing:** No
- **Verified Badge:** No
- **Analytics:** No

### Pay-as-you-go (No Subscription)
*Purpose: Provide a pure transaction path for artists who are skeptical of subscriptions.*

- **Pricing:** $0/month
- **Transaction Fee:** **10%** on accepted bids
- **Portfolio Limit:** 10 photos
- **Bidding:** **Unlimited**
- **Booking Calendar:** No
- **Payment Processing:** No
- **Verified Badge:** No
- **Analytics:** No

### Pro Subscription
*Purpose: The core recurring revenue engine.*

- **Pricing:** $29/month (or $232/year)
- **Transaction Fee:** **5%** on accepted bids (Reduced rate)
- **Portfolio Limit:** Unlimited
- **Bidding:** **Unlimited**
- **Booking Calendar:** Yes (Integrated with deposit collection)
- **Payment Processing:** Yes (Stripe-powered)
- **Verified Badge:** Yes (After ID + credential check)
- **Client Messaging:** Yes
- **Analytics:** Yes (Profile views, conversion rate)

### Founding Artist (Launch Special)
*Purpose: Cold-start solution to get the first 50-100 artists emotionally invested and active.*

- **Pricing:** **$19/month locked for life** (vs. $29 future price)
- **Special Offer:** First 6 months FREE (using promo code `FOUNDING_ARTIST_6MO`)
- **Transaction Fee:** **5%** on accepted bids
- **Features:** Everything in Pro
- **Exclusives:** "Founding Artist" badge on profile, Homepage carousel placement
- **Requirement:** Must set up full portfolio and respond to 3+ client bids in first 60 days

---

## 4. Transaction Fee Implementation

The transaction fee system is built directly into the bidding engine:

1. **Fee Calculation:** When an artist submits a bid, the backend checks their current tier and calculates the `platformFeeRateBps` (basis points: 500 for 5%, 1000 for 10%). This rate is stored permanently on the bid record.
2. **Fee Lock-in:** Storing the rate at the time of bidding ensures that if an artist changes tiers later, the fee applied to already-submitted bids remains fair and predictable.
3. **Amount Calculation:** When a client accepts a bid, the backend calculates the exact `platformFeeAmountCents` based on the agreed bid price and the locked-in fee rate.
4. **Collection:** This fee amount is then passed to Stripe during the final checkout/payment process, automatically routing the platform's cut to the Ink Connect connected account.
