# User Journey: Client — Tattoo Idea → Booked Artist

## Journey Stage 1: Intent
**Doing**: Has tattoo idea, doesn't know where to start
**Thinking**: "How do I find an artist who does THIS style in my city?"
**Feeling**: 😊 Excited about the idea, 😕 overwhelmed by options
**Pain points**:
- Google returns generic lists; no style filtering
- Instagram discovery is algorithmic, not intentional
**Opportunities**:
- AI-powered artist finder (`/artist-finder`) as homepage hero CTA
- Style-first browsing vs. location-first browsing options

---

## Journey Stage 2: Discovery (`/artists` or `/artist-finder`)
**Doing**: Browsing profiles, filtering by style/location
**Thinking**: "Is this person legit? Are they taking clients?"
**Feeling**: 😌 Cautiously optimistic
**Pain points**:
- Unverified artists feel risky (no credential signal)
- Profiles without portfolio feel abandoned
- Price range not visible before clicking into a profile
**Opportunities**:
- Verified badge prominently on card
- Style tags as visual chips (not buried in text)
- Average price range on card from booking history

---

## Journey Stage 3: Artist Profile (`/artist/:id`)
**Doing**: Reviewing portfolio, reading bio, checking reviews
**Thinking**: "Can this person execute my specific idea?"
**Feeling**: 😍 Excited if portfolio matches; 😐 Neutral if doesn't
**Pain points**:
- No way to ask a quick question before committing to a full booking
- Portfolio not filterable by style within the profile
- Review count too low on new artists to trust
**Opportunities**:
- Portfolio filter by AI-detected style within the profile
- "Send a quick note" → lightweight pre-booking message
- "New artist — be their first review" social proof framing

---

## Journey Stage 4: Booking or Request Decision
**Doing**: Deciding between direct booking or posting a request
**Thinking**: "Should I go direct or see who bids?"
**Feeling**: 😕 Uncertain about process
**Pain points**:
- "Post a request" concept unfamiliar to most tattoo clients
- No clear guidance on when to use each path
**Opportunities**:
- Decision guide: "Know who you want? → Book directly. Open to options? → Post a Request"
- Homepage `/request-flow` route explains the bid model clearly

---

## Journey Stage 5: Posting a Request (`/client/new-request`)
**Doing**: Filling in tattoo description, style, budget, location
**Thinking**: "Am I describing this clearly enough for artists to bid?"
**Feeling**: 😟 Worried about vague request getting bad bids
**Pain points**:
- Free text description difficult — most people aren't design-literate
- Budget range field feels exposing
- Image upload for reference images is unclear (how many? what formats?)
**Opportunities**:
- AI description refinement (`requests.refineDescription`) surfaces before submit
- Budget helper: "Most [Realism] tattoos of this size run $X–$Y in your area"
- Reference image tip: "Upload 1–3 images that show the style or subject"

---

## Journey Stage 6: Reviewing Bids (`/requests/:id`)
**Doing**: Comparing artist bids, reviewing portfolio links in bids
**Thinking**: "Is the cheapest bid the worst? How do I compare these?"
**Feeling**: 😵 Overwhelmed by choice if many bids
**Pain points**:
- Bids lack visual differentiation (wall of text)
- No easy way to see the bidding artist's full portfolio without leaving the page
- Price + timeline info inconsistent across bids
**Opportunities**:
- Bid card with artist thumbnail, rating, price, and available date at a glance
- Inline portfolio preview (lightbox) without leaving request
- "Most similar to your reference image" AI ranking

---

## Journey Stage 7: Accepting a Bid → Booking Confirmed
**Doing**: Clicking accept, paying deposit (Elite tier)
**Thinking**: "What happens now? Do I hear from the artist?"
**Feeling**: 😊 Satisfied but uncertain about next steps
**Pain points**:
- No clear handoff — what do artist and client do after acceptance?
- Deposit UX (if applicable) feels abrupt
**Opportunities**:
- Post-acceptance screen: "What happens next" timeline (artist will contact you within X hours)
- Auto-notification to artist with client contact info
- Option to message artist directly within platform

---

## Journey Stage 8: Post-Tattoo
**Doing**: Tattoo appointment complete, prompted to leave review
**Thinking**: "Was this easier than my last booking process?"
**Feeling**: 😄 Happy if experience was smooth
**Pain points**:
- Review prompt timing (immediately after booking vs. after appointment)
- No platform to share the finished tattoo photo
**Opportunities**:
- Review request email 48h after appointment date
- "Upload your tattoo" to review — builds client portfolio + social proof
