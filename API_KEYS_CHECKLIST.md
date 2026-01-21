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
   - `SUPABASE_ANON_KEY` - anon/public key (safe for frontend)
   - `SUPABASE_SERVICE_KEY` - service_role key (backend only, SECRET!)
   - `VITE_SUPABASE_URL` - Same as SUPABASE_URL
   - `VITE_SUPABASE_ANON_KEY` - Same as SUPABASE_ANON_KEY

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
7. Select events: `checkout.session.completed`, `payment_intent.payment_failed`
8. Copy webhook signing secret to `.env`:
   - `STRIPE_WEBHOOK_SECRET` - (starts with `whsec_`)

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

### 4. Maptiler (Maps & Geocoding)
**Priority**: 🟡 HIGH - Required for artist location search

**Steps**:
1. Go to https://cloud.maptiler.com/
2. Sign up for free account
3. Go to "Account" > "API Keys"
4. Copy your default API key (or create new one)
5. Optional: Restrict key by HTTP referrer in key settings
   - Add your domains: `localhost:5173`, `yourdomain.com`
6. Copy to `.env`:
   - `MAPTILER_API_KEY` - For backend geocoding
   - `VITE_MAPTILER_API_KEY` - For frontend maps

**Cost**: Free tier includes 100,000 map loads/month + geocoding (vs Google's ~28,000)

**Bonus**: Includes beautiful map styles, works with MapLibre/Mapbox code

---

### 5. AI Service (Choose ONE)

#### Option A: OpenAI (Recommended - All-in-One)
**Priority**: 🟢 MEDIUM - For AI features

**Provides**: Chat (GPT-4), Image Generation (DALL-E), Voice Transcription (Whisper)

**Steps**:
1. Go to https://platform.openai.com/signup
2. Add payment method (required)
3. Go to API keys
4. Create new secret key
5. Copy to `.env`:
   - `OPENAI_API_KEY` - (starts with `sk-proj-`)

**Cost**: 
- GPT-4: ~$0.01-0.03 per request
- DALL-E 3: $0.04-0.12 per image
- Whisper: $0.006 per minute

---

#### Option B: Google Gemini (Alternative)
**Priority**: 🟢 MEDIUM

**Provides**: Chat (Gemini), Image Generation (Imagen)

**Steps**:
1. Go to https://aistudio.google.com/app/apikey
2. Create API key
3. Copy to `.env`:
   - `GOOGLE_AI_API_KEY`

**Cost**: Free tier: 60 requests/minute

---

#### Option C: Anthropic Claude (Chat Only)
**Priority**: 🟢 MEDIUM

**Provides**: Chat only (Claude 3.5 Sonnet)

**Steps**:
1. Go to https://console.anthropic.com/account/keys
2. Create API key
3. Copy to `.env`:
   - `ANTHROPIC_API_KEY`

**Cost**: ~$0.003-0.015 per request

---

## 🎯 Setup Order (Recommended)

1. **Supabase** (30 min) - Core infrastructure
2. **Stripe** (15 min) - Payment processing
3. **Maptiler** (10 min) - Maps and location features
4. **Resend** (10 min) - Email notifications
5. **OpenAI** (5 min) - AI features

**Total Setup Time**: ~1.25 hours

---

## 🔒 Security Checklist

- [ ] Never commit `.env` file to git
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
   - [ ] Can search locations (Maptiler Maps)
   - [ ] Can create test booking (Stripe)
   - [ ] Receive confirmation email (Resend)
   - [ ] AI features work (OpenAI/Gemini)

---

## 💡 Pro Tips

- **Stripe**: Use test mode during development
- **Maptiler**: 100k free loads/month is generous - monitor usage in dashboard
- **OpenAI**: Start with GPT-3.5-turbo (cheaper) before upgrading to GPT-4
- **Supabase**: Enable Row Level Security (RLS) policies immediately
- **Resend**: Verify your domain to avoid spam filters

---

## 🆘 Need Help?

- Supabase: https://supabase.com/docs
- Stripe: https://stripe.com/docs
- Resend: https://resend.com/docs
- Maptiler: https://docs.maptiler.com/
- OpenAI: https://platform.openai.com/docs

---

## 📊 Monthly Cost Estimate (Small Scale)

| Service | Free Tier | Paid (if exceeded) |
|---------|-----------|-------------------|
| Supabase | Up to 500MB DB | $25/month (Pro) |
| Stripe | No fee | 2.9% + 30¢/transaction |
| Resend | 3,000 emails | $20/month (50k emails) |
| Maptiler | 100k map loads | $49/month (500k loads) |
| OpenAI | No free tier | ~$30-100/month (usage) |
| **Total** | **~$0-10/month** | **~$80-200/month** |

*Costs scale with usage. Most apps stay in free tier during development.*
