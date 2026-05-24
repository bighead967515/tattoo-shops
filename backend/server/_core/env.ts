import { z } from "zod";

const envSchema = z.object({
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  OWNER_OPEN_ID: z.string().min(1, "OWNER_OPEN_ID is required"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),
  // Artist subscription Stripe Price IDs — REQUIRED. Must be set explicitly per environment.
  // Create in Stripe Dashboard and set as env vars. Hardcoded defaults risk wrong-environment billing.
  STRIPE_ARTIST_AMATEUR_PRICE_ID_MONTH: z.string().min(1, "STRIPE_ARTIST_AMATEUR_PRICE_ID_MONTH is required"),
  STRIPE_ARTIST_AMATEUR_PRICE_ID_YEAR:  z.string().min(1, "STRIPE_ARTIST_AMATEUR_PRICE_ID_YEAR is required"),
  STRIPE_ARTIST_PRO_PRICE_ID_MONTH:     z.string().min(1, "STRIPE_ARTIST_PRO_PRICE_ID_MONTH is required"),
  STRIPE_ARTIST_PRO_PRICE_ID_YEAR:      z.string().min(1, "STRIPE_ARTIST_PRO_PRICE_ID_YEAR is required"),
  STRIPE_ARTIST_ICON_PRICE_ID_MONTH:    z.string().min(1, "STRIPE_ARTIST_ICON_PRICE_ID_MONTH is required"),
  STRIPE_ARTIST_ICON_PRICE_ID_YEAR:     z.string().min(1, "STRIPE_ARTIST_ICON_PRICE_ID_YEAR is required"),
  // Founding Artist offer — same base price as amateur ($19/mo) but with 180-day free trial
  STRIPE_FOUNDING_ARTIST_PRICE_ID:      z.string().min(1, "STRIPE_FOUNDING_ARTIST_PRICE_ID is required"),
  // Client subscription Stripe Price IDs — optional until client checkout is enabled.
  STRIPE_CLIENT_PLUS_PRICE_ID: z.string().optional(),
  STRIPE_CLIENT_ELITE_PRICE_ID: z.string().optional(),
  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_SERVICE_KEY: z.string().min(1, "SUPABASE_SERVICE_KEY is required"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
  HUGGINGFACE_API_KEY: z.string().min(1, "HUGGINGFACE_API_KEY is required"),
  GROQ_BASE_URL: z.string().url().optional(),
  GROQ_MODEL: z.string().optional(),
  HUGGINGFACE_IMAGE_MODEL: z.string().optional(),
  HUGGINGFACE_CAPTION_MODEL: z.string().optional(),
  HUGGINGFACE_OCR_MODEL: z.string().optional(),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  PUBLIC_BASE_URL: z.string().url().optional(),
  PORT: z.string().default("3000"),
  // P1-3: n8n workflow integration
  N8N_WEBHOOK_URL: z.string().url().optional().describe("n8n instance webhook base URL (e.g., https://n8n.example.com)"),
  N8N_WEBHOOK_SECRET: z.string().optional().describe("Bearer token for n8n webhook authentication"),
  // Onboarding and verification webhook URLs
  N8N_ONBOARDING_WEBHOOK_URL: z.string().url().optional().describe("n8n onboarding webhook base URL (e.g., https://n8n.example.com)"),
  N8N_VERIFICATION_WEBHOOK_URL: z.string().url().optional().describe("n8n verification webhook base URL (e.g., https://n8n.example.com)"),
});

// Validate env vars at startup - fail fast on missing required values
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  parsed.error.issues.forEach((issue) => {
    console.error(`   ${issue.path.join(".")} - ${issue.message}`);
  });
  process.exit(1);
}

export const ENV = {
  jwtSecret: parsed.data.JWT_SECRET,
  databaseUrl: parsed.data.DATABASE_URL,
  ownerOpenId: parsed.data.OWNER_OPEN_ID,
  isProduction: parsed.data.NODE_ENV === "production",
  stripeSecretKey: parsed.data.STRIPE_SECRET_KEY,
  stripeWebhookSecret: parsed.data.STRIPE_WEBHOOK_SECRET,
  // Artist tier price IDs
  stripeArtistAmateurPriceIdMonth: parsed.data.STRIPE_ARTIST_AMATEUR_PRICE_ID_MONTH,
  stripeArtistAmateurPriceIdYear:  parsed.data.STRIPE_ARTIST_AMATEUR_PRICE_ID_YEAR,
  stripeArtistProPriceIdMonth:     parsed.data.STRIPE_ARTIST_PRO_PRICE_ID_MONTH,
  stripeArtistProPriceIdYear:      parsed.data.STRIPE_ARTIST_PRO_PRICE_ID_YEAR,
  stripeArtistIconPriceIdMonth:    parsed.data.STRIPE_ARTIST_ICON_PRICE_ID_MONTH,
  stripeArtistIconPriceIdYear:     parsed.data.STRIPE_ARTIST_ICON_PRICE_ID_YEAR,
  stripeFoundingArtistPriceId:     parsed.data.STRIPE_FOUNDING_ARTIST_PRICE_ID,
  // Client tier price IDs (optional — not set until client checkout is enabled)
  stripeClientPlusPriceId: parsed.data.STRIPE_CLIENT_PLUS_PRICE_ID ?? '',
  stripeClientElitePriceId: parsed.data.STRIPE_CLIENT_ELITE_PRICE_ID ?? '',
  resendApiKey: parsed.data.RESEND_API_KEY,
  supabaseUrl: parsed.data.SUPABASE_URL,
  supabaseServiceKey: parsed.data.SUPABASE_SERVICE_KEY,
  supabaseAnonKey: parsed.data.SUPABASE_ANON_KEY,
  groqApiKey: parsed.data.GROQ_API_KEY,
  huggingFaceApiKey: parsed.data.HUGGINGFACE_API_KEY,
  groqBaseUrl: parsed.data.GROQ_BASE_URL,
  groqModel: parsed.data.GROQ_MODEL,
  huggingFaceImageModel: parsed.data.HUGGINGFACE_IMAGE_MODEL,
  huggingFaceCaptionModel: parsed.data.HUGGINGFACE_CAPTION_MODEL,
  huggingFaceOcrModel: parsed.data.HUGGINGFACE_OCR_MODEL,
  corsAllowedOrigins: parsed.data.CORS_ALLOWED_ORIGINS,
  publicBaseUrl: parsed.data.PUBLIC_BASE_URL,
  nodeEnv: parsed.data.NODE_ENV,
  port: parseInt(parsed.data.PORT, 10),
  // P1-3: n8n workflow URLs and authentication
  n8nWebhookUrl: parsed.data.N8N_WEBHOOK_URL,
  n8nWebhookSecret: parsed.data.N8N_WEBHOOK_SECRET,
  n8nOnboardingWebhookUrl: parsed.data.N8N_ONBOARDING_WEBHOOK_URL,
  n8nVerificationWebhookUrl: parsed.data.N8N_VERIFICATION_WEBHOOK_URL,
};

// Additional validation: warn if production has mismatched Stripe config
if (ENV.isProduction) {
  const testModeStripeIds = [
    "price_1TOraXQRJTQEheTOvLHhTihz", // Test IDs from default
    "price_1TOraXQRJTQEheTOVr8zI9O4",
    "price_1TOraYQRJTQEheTO3k4MS3PR",
    "price_1TOraYQRJTQEheTOHNQL82m3",
    "price_1TOraZQRJTQEheTOofBdpJwM",
    "price_1TOraaQRJTQEheTOwDiBtF35",
  ];
  const priceIds = [
    ENV.stripeArtistAmateurPriceIdMonth,
    ENV.stripeArtistAmateurPriceIdYear,
    ENV.stripeArtistProPriceIdMonth,
    ENV.stripeArtistProPriceIdYear,
    ENV.stripeArtistIconPriceIdMonth,
    ENV.stripeArtistIconPriceIdYear,
    ENV.stripeFoundingArtistPriceId,
    ENV.stripeClientPlusPriceId,
    ENV.stripeClientElitePriceId,
  ];
  
  const testIdUsed = priceIds.some((id) => testModeStripeIds.includes(id));
  if (testIdUsed) {
    console.warn("⚠️  WARNING: Production environment contains test Stripe Price IDs. This may cause unexpected billing.");
  }
}
