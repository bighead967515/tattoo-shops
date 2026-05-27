# Announcement and Feedback Plan

## Goal
Announce that Ink Connect now supports all tattoo projects while keeping cover-up and rework as supported specialties.

## Audience Segments
- Clients browsing for artists
- Existing artists on the platform
- New artists considering signup

## Core Message
Ink Connect is now positioned as a marketplace for all tattoo styles and project types. Cover-up and rework remain available as specialty options.

## Primary CTA by Segment
- Clients: Post a tattoo request
- Existing artists: Update style tags and portfolio highlights
- New artists: Join as a tattoo artist

## Announcement Copy Drafts

### In-app banner (short)
Ink Connect now supports all tattoo projects. Post your idea or join as an artist today.

### Client email / push
Subject: Ink Connect now supports all tattoo styles

Body:
Ink Connect now helps you find artists for any tattoo project, from first tattoos to large custom pieces and reworks. Share your idea, budget, and timeline, then compare responses from artists that match your style.

CTA: Start your tattoo request

### Artist email / push
Subject: Reach more clients across all tattoo styles

Body:
Ink Connect is now positioned for all tattoo projects, giving you more visibility with clients searching across multiple styles and placements. Cover-up and rework remain visible as specialties.

CTA: Update your profile and styles

### Social post
Ink Connect now supports all tattoo projects. Discover artists by style, compare portfolios, and post your tattoo idea in minutes.

## Rollout Schedule
- Day 1: Publish in-app banner and update homepage sections
- Day 2: Send client and artist announcement emails
- Day 3-7: Monitor engagement and collect qualitative feedback

## Launch Readiness Gates (Must Be Complete Before Day 1)

This rollout should not start until the blocking launch items in TODO are complete.

- [ ] Environment and secrets configured for production
	- DATABASE_URL, JWT_SECRET, Supabase, Stripe, Resend, Groq, Hugging Face
- [ ] Domain/cookies/CORS behavior verified on Render
- [ ] Stripe webhook reliability checks complete
	- SSL/proxy validation, webhook retry backlog alerting, replay process tested
- [ ] Health and incident readiness complete
	- /api/health uptime monitor, Sentry on-call alerts, DB backup/recovery runbook
- [ ] Staging e2e validation complete
	- auth regression, booking payment path, request to bid to accept flow, license verification flow

Reference checklist: TODO.md (Critical Before Launch + Launch Day Runbook)

## Unified Execution Sequence

1. Complete Launch Readiness Gates above.
2. Execute Day 1-2 rollout schedule.
3. Monitor Day 3-7 signals and feedback channels.
4. Execute Follow-up Actions based on metric direction.

## Feedback Plan

### Collection channels
- In-app quick poll on request success page
- Support inbox tagging: "positioning-feedback"
- Artist dashboard prompt for profile-update feedback

### Poll questions
- Was the new messaging clear about what projects you can post?
- Did you find artists that match your style faster?
- What was missing from the request flow?

### Success metrics (first 14 days)
- Increase in /client/new-request starts
- Increase in artist registration starts
- Conversion from request start to request submitted
- Click-through rate on "Join as a tattoo artist"

## Follow-up Actions
- If request starts increase but submissions drop: simplify form helper text
- If artist signup clicks increase but completions lag: tighten onboarding steps and trust messaging
- If cover-up users are confused: add specialty badge language in request style selector
