---
name: "Client Onboarding 6-Email Sequence"
description: "One-click generation of the exact Ink Connect client onboarding sequence (6 emails over 14 days) with placeholders prefilled and action-ready CTAs."
agent: "Email Writer"
argument-hint: "Optional overrides: token syntax, sender name, URL base, request-count claim"
---
Generate the exact Ink Connect client onboarding sequence for new client signups.

Use these defaults unless the user explicitly overrides them in their prompt:
- Brand: Ink Connect
- Platform: Render
- Audience: New client signups
- Goal: signup to first request posted
- Token syntax for first name: {{first_name}}
- Sender for email 1 to 5: The Ink Connect Team
- Sender for email 6: Maya, Ink Connect
- Request-count claim for email 3: 3 artists typically bid when the brief is clear
- CTA URLs:
  - Complete My Profile: /client/onboarding
  - Start My Request: /client/new-request
  - Browse Artists: /artists
  - Try the AI Design Lab: /client/design-lab
  - Review My Dashboard: /dashboard

Sequence timing:
1. Email 1: Immediately on signup
2. Email 2: Day 2
3. Email 3: Day 4
4. Email 4: Day 7
5. Email 5: Day 10
6. Email 6: Day 14

Canonical subject and preview lines (lock these unless the user asks for variants):
1. Subject: Welcome in. Let's get your first tattoo request live.
  Preview: Your profile takes a minute. Your request can be live right after.
2. Subject: The fastest way to get better artist matches
  Preview: A clearer request gets stronger bids and fewer back-and-forth messages.
3. Subject: Not sure what to write? Use the AI Design Lab.
  Preview: Turn rough ideas into a brief artists can quote confidently.
4. Subject: What happens after artists start bidding
  Preview: Here's how to compare offers without getting overwhelmed.
5. Subject: Before you book, do these 3 things
  Preview: A little prep now makes the consult and deposit step smoother.
6. Subject: Your first request is still waiting
  Preview: Post it now and start hearing from artists.

Canonical CTA labels (use exactly as written):
1. Complete My Profile
2. Start My Request
3. Try the AI Design Lab
4. Review My Dashboard
5. Browse Artists
6. Post My First Request

Output requirements:
- Return all 6 emails in order.
- Include for each email:
  - Send timing
  - Subject
  - Preview text
  - Body copy
  - Primary CTA as markdown link with final URL
- Keep the provided narrative and intent of this campaign:
  - Welcome and first-action momentum
  - Better request quality and artist matching
  - AI-assisted brief creation confidence
  - Bid review clarity and trust
  - Booking readiness and expectation setting
  - Final activation push for first request posted
- Preserve the canonical campaign messaging and section intent; do not rewrite the sequence from scratch.
- Ensure no square-bracket placeholders remain in final output.
- Keep copy practical, reassuring, and conversion focused without hype or guaranteed outcomes.
- Keep the language client-friendly and beginner-safe; assume some readers are planning their first tattoo.

Campaign content guidance:
- Email 1 should make the path feel simple: finish onboarding, then post a request.
- Email 2 should explain what makes a strong request: style, placement, size, budget, and timeline.
- Email 3 should position the AI Design Lab as a helpful optional shortcut, not a requirement.
- Email 4 should explain how clients can use the dashboard to review bids, compare fit, and move a project forward.
- Email 5 should set expectations around consults, deposits, and how to choose the right artist rather than the cheapest bid.
- Email 6 should create gentle urgency around posting the first request, while reinforcing that clear details help artists respond faster.

After the sequence, include:
1. Reach automation setup checklist (trigger, delays, segment tag, merge token)
2. A/B test ideas (one subject-line variant per email)
3. Any assumptions made
