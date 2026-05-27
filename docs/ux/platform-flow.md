# Platform Flow Specification — Ink Connect

## Two Core User Paths

### Path A: Artist — Profile → Bookings

```
/artist/register
  └─ Email/OAuth signup
  └─ Role assignment: "artist"
  └─ Redirect → /artist-dashboard

/artist-dashboard
  └─ Profile completion checklist (progressive)
  └─ Portfolio upload (10 free / unlimited paid)
  └─ License upload → /license-upload (optional but badged)
  └─ Subscription upgrade CTA (Founding Artist offer if eligible)

/requests (browse)
  └─ Free: locked/blurred (upgrade nudge)
  └─ Paid: full access, AI style matching

/requests/:id (bid)
  └─ Draft bid (AI assist: Pro/Icon only)
  └─ Submit bid → counter tracked against monthly limit

/artist-dashboard (bids won)
  └─ Accepted bid → booking notification
  └─ Booking management (confirm/cancel/complete)
```

### Path B: Client — Idea → Booked

```
/ (Home)
  └─ "Find an Artist" → /artist-finder (AI search)
  └─ "Post a Request" → /client/onboarding (if no profile)
  └─ Browse → /artists (filter by style/location)

/client/onboarding
  └─ Create client profile (displayName, city, preferredStyles)
  └─ Redirect → /client/dashboard

/client/new-request
  └─ Describe tattoo (AI refinement available)
  └─ Upload reference images
  └─ Set budget range + location
  └─ Submit → status: "open"

/requests/:id (receive bids)
  └─ View artist bids (price, message, availability)
  └─ Accept bid → status: "in_progress"
  └─ Other bids auto-rejected

/client/dashboard
  └─ Active requests + bid status
  └─ Booking history
  └─ AI credits (design lab: /client/design-lab)
```

## Design Principles

1. **Free tier must feel useful, not punished**
   - Artists: 10 portfolio images + visible profile is real value
   - Clients: 1 request/month is enough to test the platform

2. **Verification = trust currency**
   - Verified badge must be visible on every surface: search card, profile header, bid card

3. **AI is an assistant, not the product**
   - AI suggestions (bid drafts, description refinement, style tags) appear as editable suggestions, not final outputs

4. **Progressive disclosure for complexity**
   - Don't show bid limits, platform fees, or advanced settings during onboarding
   - Surface constraints contextually (at the moment they're relevant)

## Accessibility Requirements

- [ ] All form inputs: label above input (not placeholder-only)
- [ ] Portfolio image upload: keyboard accessible drag-zone with Enter/Space trigger
- [ ] Review stars: `role="radiogroup"` with `aria-label="Rating: X of 5"`
- [ ] Bid accept/reject: confirmation dialog before irreversible action
- [ ] Skeleton screens: `aria-busy="true"` while loading
- [ ] Minimum touch target: 44×44px on all interactive elements
- [ ] Color not used as sole indicator (verified badge = icon + text + color)
