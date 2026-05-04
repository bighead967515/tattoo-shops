---
name: "Marketing Voice and Tone"
description: "Use when writing or editing marketing content, lifecycle emails, landing-page copy, and campaign messaging for Ink Connect. Standardizes voice, tone, CTA clarity, and claim safety."
applyTo:
  - .github/prompts/*.prompt.md
  - .github/agents/*.agent.md
  - frontend/client/src/pages/Home.tsx
  - frontend/client/src/pages/ForArtists.tsx
  - frontend/client/src/pages/Pricing.tsx
  - README.md
  - monetization-report.md
---
# Ink Connect Marketing Voice and Tone

## Brand Voice
- Confident, practical, and human.
- Clear over clever.
- Creator-first language for artists and clients.
- Avoid buzzwords and generic startup phrasing.

## Tone by Context
- Onboarding: Encouraging and momentum-driven.
- Reactivation: Respectful, low-pressure, and opportunity-focused.
- Pricing or conversion: Transparent and specific.
- Product explanations: Simple, concrete, and example-led.

## Messaging Rules
- Lead with value, then action.
- Keep paragraphs short and scannable.
- Use concrete nouns and verbs over abstract claims.
- Prefer specific outcomes (for example, "place your first bid") over vague outcomes (for example, "grow your business").
- Every message should have one primary CTA.

## CTA Standards
- Use direct, action-led CTA labels.
- Match CTA text to destination intent.
- Avoid multiple competing primary CTAs in the same section.

## Claim Safety
- Do not guarantee bookings, income, or business outcomes.
- Do not use fabricated stats or unverifiable numbers.
- If urgency is used, make it factual and explain why.
- Do not imply legal, tax, or financial advice.

## Style Preferences
- Use sentence case for body copy.
- Keep punctuation clean and minimal.
- Avoid excessive exclamation points.
- Avoid slang that may date quickly.

## Personalization
- Use consistent merge-tag syntax within a campaign.
- Do not mix token formats in the same document.
- If syntax is unknown, state assumptions explicitly.

## Quality Check Before Finalizing
- Is the audience segment explicit?
- Is the primary action obvious?
- Is there exactly one core message per section/email?
- Are all claims supportable?
- Is tone aligned to onboarding, reactivation, or conversion context?