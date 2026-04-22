# Ink Connect Monetization Plan: Artist Tiers & Billing Report

This document outlines the detailed feature sets, pricing structure, billing capabilities, and bidding quotas for the Ink Connect artist monetization system. The system employs a "freemium" model with one free tier and three paid tiers.

---

## 1. Annual Billing

Annual billing is fully wired and operational across the entire stack. Artists can toggle between monthly and yearly billing on the `/artist/billing` page. Choosing yearly billing saves the equivalent of two months' cost compared to paying monthly.

| Tier | Monthly Price | Annual Price | Annual Savings |
| :--- | :--- | :--- | :--- |
| Apprentice | $0 | $0 | — |
| Artist | $9.00/mo | $90.00/yr | $18 |
| Professional | $19.00/mo | $190.00/yr | $38 |
| Icon | $39.00/mo | $390.00/yr | $78 |

---

## 2. Bidding on Client Posts

Artists can browse and bid on client tattoo idea posts from the Request Board. Bidding is a core monetization gate — the free tier cannot bid at all, and paid tiers receive a monthly quota that resets automatically on the 1st of each calendar month.

### Bid Quota by Tier

| Tier | Monthly Bid Quota | Notes |
| :--- | :---: | :--- |
| Apprentice (Free) | **0** | Bidding is completely blocked. An upgrade prompt is shown in place of the bid form. |
| Artist ($9/mo) | **15 bids/month** | Counter resets on the 1st. An upgrade prompt appears when the quota is exhausted. |
| Professional ($19/mo) | **50 bids/month** | Counter resets on the 1st. An upgrade prompt appears when the quota is exhausted. |
| Icon ($39/mo) | **Unlimited** | No monthly cap. The bid form always remains open. |

### How Monthly Reset Works

The system tracks two fields per artist profile: `bidsThisMonth` (the running counter) and `bidsMonthYear` (the calendar month the counter belongs to, stored as `YYYY-MM`). On every bid submission attempt, the backend compares `bidsMonthYear` to the current calendar month. If they differ, the counter is automatically reset to zero before the new bid is counted. This means no scheduled job or cron task is required — the reset happens lazily and precisely on the first bid attempt of a new month.

---

## 3. Detailed Tier Breakdown

### Apprentice (Free Tier)

The Apprentice tier allows new artists to establish a basic presence on the platform without any financial commitment.

- **Pricing:** $0.00 (Free forever)
- **Portfolio Limit:** 3 photos maximum.
- **Bidding:** Blocked. An upgrade prompt is shown instead of the bid form.
- **Booking Capabilities:** Disabled.
- **Direct Contact:** Hidden.
- **Review Management:** Disabled.
- **Analytics:** Disabled.
- **Verified Badge:** Not included.
- **Homepage Feature:** No.

### Artist (Amateur Tier)

The Artist tier is the first paid step, designed for working professionals who want to actively acquire clients through the platform.

- **Pricing:** $9.00/month or $90.00/year
- **Portfolio Limit:** 15 photos.
- **Bidding:** **15 bids per month.** Counter resets on the 1st of each month.
- **Booking Capabilities:** Enabled.
- **Direct Contact:** Visible (social links, email).
- **Verified Badge:** Included.
- **Review Management:** Disabled.
- **Analytics:** Disabled.
- **Homepage Feature:** No.

### Professional (Pro Tier)

The Professional tier is the most popular option, providing a comprehensive suite of tools for established artists.

- **Pricing:** $19.00/month or $190.00/year
- **Portfolio Limit:** Unlimited.
- **Bidding:** **50 bids per month.** Counter resets on the 1st of each month.
- **Booking Capabilities:** Enabled.
- **Direct Contact:** Visible.
- **Verified Badge:** Included.
- **Review Management:** Enabled (can respond to client reviews publicly).
- **Analytics:** Enabled (profile views, booking conversion metrics).
- **Homepage Feature:** No.

### Icon (Front Page Tier)

The Icon tier is the premium offering, designed for top-tier artists who want maximum exposure and an unrestricted bidding pipeline.

- **Pricing:** $39.00/month or $390.00/year
- **Portfolio Limit:** Unlimited.
- **Bidding:** **Unlimited.** No monthly cap.
- **Booking Capabilities:** Enabled.
- **Direct Contact:** Visible.
- **Verified Badge:** Included.
- **Review Management:** Enabled.
- **Analytics:** Enabled.
- **Homepage Feature:** Yes — featured in the Homepage Carousel.

---

## 4. Full Feature Comparison Matrix

| Feature | Apprentice (Free) | Artist ($9/mo) | Professional ($19/mo) | Icon ($39/mo) |
| :--- | :---: | :---: | :---: | :---: |
| **Annual Price** | $0 | $90/yr | $190/yr | $390/yr |
| **Annual Savings** | — | $18 | $38 | $78 |
| **Portfolio Photos** | 3 | 15 | Unlimited | Unlimited |
| **Monthly Bid Quota** | 0 (blocked) | 15 | 50 | Unlimited |
| **Accept Bookings** | No | Yes | Yes | Yes |
| **Direct Contact Info** | No | Yes | Yes | Yes |
| **Verified Badge** | No | Yes | Yes | Yes |
| **Respond to Reviews** | No | No | Yes | Yes |
| **Profile Analytics** | No | No | Yes | Yes |
| **Homepage Feature** | No | No | No | Yes |
