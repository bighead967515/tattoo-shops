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
| **Pro** | $49/mo | $490/yr | **5%** on accepted bids | Working artists, small studios |
| **Founding Artist** | $19/mo (locked) | $190/yr | **5%** on accepted bids | First 50 early adopters |

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
- **Bidding:** **Cap of 3 bids per month**
- **Booking Calendar:** No
- **Payment Processing:** No
- **Verified Badge:** No
- **Analytics:** No

### Pro Subscription
*Purpose: The core recurring revenue engine.*

- **Pricing:** $49/month (or $490/year)
- **Transaction Fee:** **5%** on accepted bids (Reduced rate)
- **Portfolio Limit:** Unlimited
- **Bidding:** **Unlimited**
- **Booking Calendar:** Yes (Integrated with deposit collection)
- **Payment Processing:** Yes (Stripe-powered)
- **Verified Badge:** Yes (After ID + credential check)
- **Client Messaging:** Yes
- **Analytics:** Yes (Profile views, conversion rate)

### Founding Artist (Launch Special)
*Purpose: Cold-start solution to get the first 50 artists emotionally invested and active.*

- **Pricing:** **$19/month locked for life** (vs. $49 future price)
- **Special Offer:** First 3 months FREE
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
4. **Collection:** The transaction fee applies exclusively to the upfront digital booking deposit processed through the platform. When a client pays the deposit, the entire platform fee (calculated as a percentage of the total bid price) is deducted directly from that deposit payment using Stripe Connect's application fee/transfer split capability. This ensures the platform's cut is collected immediately and securely. The remaining deposit portion is routed directly to the artist. Escrowed shop fees settled inside a studio (the final cash/card payment following the appointment) remain fully disintermediated from the core software framework, eliminating the need to chase artists for cash cuts.
