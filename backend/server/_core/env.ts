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
  // Client subscription Stripe Price IDs — set after creating Products in the Stripe Dashboard
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
  PORT: z.string().default("3000"),
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
  stripeClientPlusPriceId: parsed.data.STRIPE_CLIENT_PLUS_PRICE_ID,
  stripeClientElitePriceId: parsed.data.STRIPE_CLIENT_ELITE_PRICE_ID,
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
  nodeEnv: parsed.data.NODE_ENV,
  port: parseInt(parsed.data.PORT, 10),
};
