# API Keys Setup Checklist

Complete this checklist to get all required API keys for your tattoo artist directory platform.

## ✅ Required Services

### 1. Supabase (Database + Auth + Storage)

**Priority**: 🔴 CRITICAL - Start here first

**Steps**:

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose organization and set project name: `tattoo-shops`
4. Set strong database password (save it!)
5. Choose region closest to your users
6. Wait for project to provision (~2 minutes)
7. Go to Project Settings > API
8. Copy these values to `.env`:
   - `SUPABASE_URL` - Project URL
   - `SUPABASE_ANON_KEY` - anon/public key (safe for frontend and browser-visible)
   - `SUPABASE_SERVICE_KEY` - service_role key (backend only, SECRET!)
   - `VITE_SUPABASE_URL` - Same as SUPABASE_URL
   - `VITE_SUPABASE_ANON_KEY` - Same as SUPABASE_ANON_KEY
9. Important note:
   - `SUPABASE_ANON_KEY` is intentionally public and does not need to be hidden
   - Protect data using Supabase RLS policies; never expose `SUPABASE_SERVICE_KEY`
10. If you are using the **Application Preset: Vite**:
      - Frontend-only keys must be prefixed with `VITE_`
      - Keep these two values identical:
         - `SUPABASE_URL` = `VITE_SUPABASE_URL`
         - `SUPABASE_ANON_KEY` = `VITE_SUPABASE_ANON_KEY`
      - Restart dev server after editing `.env`

**Cost**: Free tier includes:

- 500 MB database
- 1 GB file storage
- 50k monthly active users
- Unlimited API requests

---

### 2. Stripe (Payment Processing)

**Priority**: 🔴 CRITICAL - Required for bookings

**Steps**:

1. Go to https://dashboard.stripe.com/register
2. Complete account setup
3. Go to Developers > API keys
4. Copy these to `.env`:
   - `STRIPE_SECRET_KEY` - Secret key (starts with `sk_test_` for testing)
5. Go to Developers > Webhooks
6. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
7. Select events: `checkout.session.completed`, `payment_intent.payment_failed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
8. Copy webhook signing secret to `.env`:
   - `STRIPE_WEBHOOK_SECRET` - (starts with `whsec_`)

#### Client Subscription Products (Enthusiast & Elite)

9. Go to Products in the Stripe Dashboard
10. **Create "Enthusiast" product** ($9/mo):
    - Name: `Enthusiast`
    - Price: `$9.00 / month` (recurring)
    - Copy the **Price ID** (starts with `price_`) to `.env`:
      - `STRIPE_CLIENT_PLUS_PRICE_ID`
11. **Create "Elite Ink" product** ($19/mo):
    - Name: `Elite Ink`
    - Price: `$19.00 / month` (recurring)
    - Copy the **Price ID** to `.env`:
      - `STRIPE_CLIENT_ELITE_PRICE_ID`

**Cost**: 2.9% + 30¢ per successful transaction

**Test Cards**:

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

---

### 3. Resend (Email Service)

**Priority**: 🟡 HIGH - Needed for booking confirmations

**Steps**:

1. Go to https://resend.com/signup
2. Verify your email
3. Go to API Keys
4. Click "Create API Key"
5. Name it: `Tattoo Shops Production`
6. Copy to `.env`:
   - `RESEND_API_KEY` - (starts with `re_`)
7. Add domain: Go to Domains > Add Domain
8. Add your domain and verify DNS records

**Cost**: Free tier includes 3,000 emails/month

---

### 4. AI Services (Groq + Hugging Face)

#### 4A. Groq (Structured Text AI)

**Priority**: 🟢 MEDIUM - Required for discovery, prompt refinement, bid drafting, and moderation

**Provides**: Fast chat completions for structured JSON outputs

**Steps**:

1. Go to https://console.groq.com/
2. Create/sign in to your account
3. Open API Keys
4. Create a new key
5. Copy to `.env`:
   - `GROQ_API_KEY` - (starts with `gsk_`)

**Optional**:

- `GROQ_MODEL` — override default model
- `GROQ_BASE_URL` — override base URL if needed

**Cost**: Usage-based (see Groq pricing dashboard)

---

#### 4B. Hugging Face (Image Generation + Vision/OCR)

**Priority**: 🟢 MEDIUM - Required for design generation and image understanding flows

**Provides**: Image generation, captioning, and OCR via Inference API

**Steps**:

1. Go to https://huggingface.co/settings/tokens
2. Create a token with Inference API access
3. Copy to `.env`:
   - `HUGGINGFACE_API_KEY` - (starts with `hf_`)

**Optional model overrides**:

- `HUGGINGFACE_IMAGE_MODEL`
- `HUGGINGFACE_CAPTION_MODEL`
- `HUGGINGFACE_OCR_MODEL`

**Cost**: Usage-based (see Hugging Face Inference API pricing)

---

## 🎯 Setup Order (Recommended)

1. **Supabase** (30 min) - Core infrastructure
2. **Stripe** (15 min) - Payment processing
3. **Resend** (10 min) - Email notifications
4. **Groq + Hugging Face** (10 min) - AI features

**Total Setup Time**: ~1.1 hours

---

## 🔒 Security Checklist

- [ ] Never commit `.env` file to git
- [ ] Keep `SUPABASE_SERVICE_KEY` backend-only (never expose it in frontend code)
- [ ] Enable and verify Supabase RLS policies (anon key is public)
- [ ] Use different keys for development and production
- [ ] Restrict API keys by domain/IP when possible
- [ ] Store production keys in hosting platform's environment variables
- [ ] Rotate keys every 90 days
- [ ] Monitor API usage for unusual activity
- [ ] Set up billing alerts on all services

---

## 📝 After Getting All Keys

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Fill in all your API keys in `.env`

3. Test the setup:

   ```bash
   pnpm install
   pnpm dev
   ```

4. Verify each integration:
   - [ ] Can sign up/login (Supabase Auth)
   - [ ] Can upload images (Supabase Storage)
   - [ ] Can create test booking (Stripe)
   - [ ] Receive confirmation email (Resend)
   - [ ] AI features work (Groq/Hugging Face)

---

## 💡 Pro Tips

- **Stripe**: Use test mode during development
- **Groq**: Use a stable production model in `GROQ_MODEL` and keep temperature low for JSON-heavy tasks
- **Hugging Face**: Keep model overrides in `.env` so you can swap models without code changes
- **Supabase**: Enable Row Level Security (RLS) policies immediately
- **Resend**: Verify your domain to avoid spam filters

---

## 🆘 Need Help?

- Supabase: https://supabase.com/docs
- Stripe: https://stripe.com/docs
- Resend: https://resend.com/docs
- Groq: https://console.groq.com/docs
- Hugging Face: https://huggingface.co/docs/api-inference

---

## 📊 Monthly Cost Estimate (Small Scale)

| Service   | Free Tier         | Paid (if exceeded)     |
| --------- | ----------------- | ---------------------- |
| Supabase  | Up to 500MB DB    | $25/month (Pro)        |
| Stripe    | No fee            | 2.9% + 30¢/transaction |
| Resend    | 3,000 emails      | $20/month (50k emails) |
| Groq + HF | Usage-based tiers | ~$20-120/month (usage) |
| **Total** | **~$0-10/month**  | **~$45-165/month**     |

_Costs scale with usage. Most apps stay in free tier during development._
