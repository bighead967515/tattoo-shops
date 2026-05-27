# User Journey: Artist Onboarding → First Booking

## Journey Stage 1: Discovery
**Doing**: Hears about Ink Connect from another artist or sees ad
**Thinking**: "Is this another subscription that won't pay off?"
**Feeling**: 😒 Skeptical, protecting their time
**Pain points**:
- Unclear what tier gives what benefit before signing up
- Fear of being locked into a subscription with no bookings to show for it
**Opportunities**:
- Free tier with real value (10 portfolio images, visible profile)
- Show social proof: "Artists on Ink Connect average X bookings/month"
- Founding Artist offer: urgency + low locked-in price

---

## Journey Stage 2: Registration (`/artist/register`)
**Doing**: Creating account via email or OAuth
**Thinking**: "This better not take 30 minutes to set up"
**Feeling**: 😐 Neutral, testing trust
**Pain points**:
- Long forms kill momentum
- Unclear what info is required vs optional
**Opportunities**:
- Progressive onboarding: collect minimum info first (name, email, city, style)
- "You can add more later" framing for optional fields
- Inline progress indicator

---

## Journey Stage 3: Profile Setup (`/artist-dashboard`)
**Doing**: Adding bio, styles, location, social links
**Thinking**: "What do clients actually look for? Am I filling this in right?"
**Feeling**: 😕 Uncertain about what good looks like
**Pain points**:
- No benchmark (e.g., "Profiles with 3+ styles get 2× more views")
- Style tags unclear — are these search keywords?
**Opportunities**:
- Tip cards per field: "Artists with Instagram linked get 40% more profile visits"
- Live preview of how profile looks to a client
- Completion checklist with percentage bar

---

## Journey Stage 4: Portfolio Upload (`/artist-dashboard → portfolio`)
**Doing**: Uploading portfolio images, adding captions
**Thinking**: "Does the AI actually help here or is it gimmicky?"
**Feeling**: 😊 Excited if AI tags are accurate; 😤 Frustrated if wrong
**Pain points**:
- Upload limit of 10 images on free tier feels restrictive if artist has 50+ pieces
- AI processing async — no feedback that it's working
**Opportunities**:
- Immediately show AI-generated style tags after upload (even before fully saved)
- "Upgrade for unlimited portfolio" nudge at image 9/10
- Show quality score inline with improvement tips

---

## Journey Stage 5: Verification (`/license-upload`)
**Doing**: Uploading license/permit document
**Thinking**: "Is this safe? Why do you need my license?"
**Feeling**: 😰 Vulnerable (uploading government ID)
**Pain points**:
- No explanation of WHY verification matters to clients
- Unclear how long review takes
- OCR errors on expiration date feel like a system failure
**Opportunities**:
- Trust copy: "Your document is encrypted and never shown to clients — we only display a verified badge"
- Timeline: "Most reviews complete within 24 hours"
- Show OCR-extracted data for artist to confirm before submission

---

## Journey Stage 6: Receiving First Bid Opportunity
**Doing**: Seeing a client request in `/requests` or dashboard
**Thinking**: "Is this person serious? Will my bid be competitive?"
**Feeling**: 😬 Nervous about wasting a bid
**Pain points**:
- Free tier has only 5 bids/month — each feels high-stakes
- No visibility into how many other artists already bid
- Free tier can't see the full request detail
**Opportunities**:
- AI bid assistant draft (Pro/Icon) reduces blank-page anxiety
- Show bid count and budget range on request card
- "Request matches your top style: Realism" smart matching nudge

---

## Journey Stage 7: First Booking Received
**Doing**: Getting booking notification, confirming appointment
**Thinking**: "OK, this actually works"
**Feeling**: 😄 Validated, relieved
**Pain points**:
- No summary of deposit collected (if applicable)
- Status change from "pending" to "confirmed" not clearly celebrated
**Opportunities**:
- Confirmation screen with booking details + deposit receipt
- Prompt to reply with prep instructions (SMS/email template)
- "Share your profile" CTA at peak satisfaction moment
