---
name: "Artist Onboarding 6-Email Sequence"
description: "One-click generation of the exact Ink Connect artist onboarding email sequence (6 emails over 14 days) with placeholders prefilled and launch-ready CTAs."
agent: "Email Writer"
argument-hint: "Optional overrides: token syntax, spots-left count, sender name, URL base"
---
Generate the exact Ink Connect artist onboarding sequence for new artist signups.

Use these defaults unless the user explicitly overrides them in their prompt:
- Brand: Ink Connect
- Platform: Render
- Audience: New artist signups
- Goal: signup to first bid placed
- Token syntax for first name: {{first_name}}
- Sender for email 1 to 5: The Ink Connect Team
- Sender for email 6: Maya, Ink Connect
- Founding spots left count for email 5: 14
- CTA URLs:
  - Complete Your Profile: /artist-dashboard
  - Browse Open Requests: /requests
  - Set Up Notifications: /artist/settings/notifications
  - Claim My Founding Spot: /for-artists

Sequence timing:
1. Email 1: Immediately on signup
2. Email 2: Day 2
3. Email 3: Day 4
4. Email 4: Day 7
5. Email 5: Day 10
6. Email 6: Day 14

Canonical subject and preview lines (lock these unless user asks for variants):
1. Subject: You're in. Here's what to do first.
  Preview: Takes about 2 minutes. Seriously.
2. Subject: Clients are looking at your profile right now
  Preview: Here's what they want to see.
3. Subject: 8 open requests match your style
  Preview: Real clients, real budgets, waiting for bids.
4. Subject: What happens after you send a bid
  Preview: The full picture, start to finish.
5. Subject: Your Founding Artist perks expire in 4 days
  Preview: 6 months free. Locked-in pricing. Don't leave it on the table.
6. Subject: One step away from going live
  Preview: Your profile is set up. Now let's get you your first client.

Canonical CTA labels (use exactly as written):
1. Complete Your Profile
2. Browse Open Requests
3. Update My Profile
4. Set Up Notifications
5. Claim My Founding Spot
6. Browse Open Requests Now

Output requirements:
- Return all 6 emails in order.
- Include for each email:
  - Send timing
  - Subject
  - Preview text
  - Body copy
  - Primary CTA as markdown link with final URL
- Keep the provided narrative and intent of this campaign:
  - Welcome and onboarding momentum
  - Profile completeness as storefront
  - Active demand and first-bid confidence
  - Bidding process clarity
  - Founding Artist urgency
  - Final activation push
- Preserve the canonical campaign messaging and section intent; do not rewrite the sequence from scratch.
- Ensure no square-bracket placeholders remain in final output.
- Keep copy practical and conversion focused, without hype or guaranteed outcomes.

After the sequence, include:
1. Reach automation setup checklist (trigger, delays, segment tag, merge token)
2. A/B test ideas (one subject-line variant per email)
3. Any assumptions made