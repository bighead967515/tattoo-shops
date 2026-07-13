var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// backend/server/_core/env.ts
import { z } from "zod";
var envSchema, parsed, ENV;
var init_env = __esm({
  "backend/server/_core/env.ts"() {
    "use strict";
    envSchema = z.object({
      JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
      DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
      OWNER_OPEN_ID: z.string().min(1, "OWNER_OPEN_ID is required"),
      NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
      STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
      STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),
      // Artist subscription Stripe Price IDs — REQUIRED. Must be set explicitly per environment.
      // Create in Stripe Dashboard and set as env vars. Hardcoded defaults risk wrong-environment billing.
      STRIPE_ARTIST_AMATEUR_PRICE_ID_MONTH: z.string().min(1, "STRIPE_ARTIST_AMATEUR_PRICE_ID_MONTH is required"),
      STRIPE_ARTIST_AMATEUR_PRICE_ID_YEAR: z.string().min(1, "STRIPE_ARTIST_AMATEUR_PRICE_ID_YEAR is required"),
      STRIPE_ARTIST_PRO_PRICE_ID_MONTH: z.string().min(1, "STRIPE_ARTIST_PRO_PRICE_ID_MONTH is required"),
      STRIPE_ARTIST_PRO_PRICE_ID_YEAR: z.string().min(1, "STRIPE_ARTIST_PRO_PRICE_ID_YEAR is required"),
      STRIPE_ARTIST_ICON_PRICE_ID_MONTH: z.string().min(1, "STRIPE_ARTIST_ICON_PRICE_ID_MONTH is required"),
      STRIPE_ARTIST_ICON_PRICE_ID_YEAR: z.string().min(1, "STRIPE_ARTIST_ICON_PRICE_ID_YEAR is required"),
      // Founding Artist offer — same base price as amateur ($19/mo) but with 180-day free trial
      STRIPE_FOUNDING_ARTIST_PRICE_ID: z.string().min(1, "STRIPE_FOUNDING_ARTIST_PRICE_ID is required"),
      RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
      SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
      SUPABASE_SERVICE_KEY: z.string().min(1, "SUPABASE_SERVICE_KEY is required"),
      SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
      GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
      HUGGINGFACE_API_KEY: z.string().min(1, "HUGGINGFACE_API_KEY is required"),
      OPENAI_API_KEY: z.string().optional(),
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
      N8N_VERIFICATION_WEBHOOK_URL: z.string().url().optional().describe("n8n verification webhook base URL (e.g., https://n8n.example.com)")
    });
    parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      console.error("\u274C Invalid environment configuration:");
      parsed.error.issues.forEach((issue) => {
        console.error(`   ${issue.path.join(".")} - ${issue.message}`);
      });
      process.exit(1);
    }
    ENV = {
      jwtSecret: parsed.data.JWT_SECRET,
      databaseUrl: parsed.data.DATABASE_URL,
      ownerOpenId: parsed.data.OWNER_OPEN_ID,
      isProduction: parsed.data.NODE_ENV === "production",
      stripeSecretKey: parsed.data.STRIPE_SECRET_KEY,
      stripeWebhookSecret: parsed.data.STRIPE_WEBHOOK_SECRET,
      // Artist tier price IDs
      stripeArtistAmateurPriceIdMonth: parsed.data.STRIPE_ARTIST_AMATEUR_PRICE_ID_MONTH,
      stripeArtistAmateurPriceIdYear: parsed.data.STRIPE_ARTIST_AMATEUR_PRICE_ID_YEAR,
      stripeArtistProPriceIdMonth: parsed.data.STRIPE_ARTIST_PRO_PRICE_ID_MONTH,
      stripeArtistProPriceIdYear: parsed.data.STRIPE_ARTIST_PRO_PRICE_ID_YEAR,
      stripeArtistIconPriceIdMonth: parsed.data.STRIPE_ARTIST_ICON_PRICE_ID_MONTH,
      stripeArtistIconPriceIdYear: parsed.data.STRIPE_ARTIST_ICON_PRICE_ID_YEAR,
      stripeFoundingArtistPriceId: parsed.data.STRIPE_FOUNDING_ARTIST_PRICE_ID,
      resendApiKey: parsed.data.RESEND_API_KEY,
      supabaseUrl: parsed.data.SUPABASE_URL,
      supabaseServiceKey: parsed.data.SUPABASE_SERVICE_KEY,
      supabaseAnonKey: parsed.data.SUPABASE_ANON_KEY,
      groqApiKey: parsed.data.GROQ_API_KEY,
      huggingFaceApiKey: parsed.data.HUGGINGFACE_API_KEY,
      openaiApiKey: parsed.data.OPENAI_API_KEY,
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
      n8nVerificationWebhookUrl: parsed.data.N8N_VERIFICATION_WEBHOOK_URL
    };
    if (ENV.isProduction) {
      const testModeStripeIds = [
        "price_1TOraXQRJTQEheTOvLHhTihz",
        // Test IDs from default
        "price_1TOraXQRJTQEheTOVr8zI9O4",
        "price_1TOraYQRJTQEheTO3k4MS3PR",
        "price_1TOraYQRJTQEheTOHNQL82m3",
        "price_1TOraZQRJTQEheTOofBdpJwM",
        "price_1TOraaQRJTQEheTOwDiBtF35"
      ];
      const priceIds = [
        ENV.stripeArtistAmateurPriceIdMonth,
        ENV.stripeArtistAmateurPriceIdYear,
        ENV.stripeArtistProPriceIdMonth,
        ENV.stripeArtistProPriceIdYear,
        ENV.stripeArtistIconPriceIdMonth,
        ENV.stripeArtistIconPriceIdYear,
        ENV.stripeFoundingArtistPriceId
      ];
      const testIdUsed = priceIds.some((id) => testModeStripeIds.includes(id));
      if (testIdUsed) {
        console.warn("\u26A0\uFE0F  WARNING: Production environment contains test Stripe Price IDs. This may cause unexpected billing.");
      }
    }
  }
});

// backend/server/_core/supabase.ts
var supabase_exports = {};
__export(supabase_exports, {
  createSupabaseClientForUser: () => createSupabaseClientForUser,
  supabaseAdmin: () => supabaseAdmin
});
import { createClient } from "@supabase/supabase-js";
function createSupabaseClientForUser(accessToken) {
  return createClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });
}
var supabaseAdmin;
var init_supabase = __esm({
  "backend/server/_core/supabase.ts"() {
    "use strict";
    init_env();
    supabaseAdmin = createClient(
      ENV.supabaseUrl,
      ENV.supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }
});

// backend/drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  artists: () => artists,
  bidStatusEnum: () => bidStatusEnum,
  bids: () => bids,
  bookingStatusEnum: () => bookingStatusEnum,
  bookings: () => bookings,
  clients: () => clients,
  favorites: () => favorites,
  flashArt: () => flashArt,
  invitations: () => invitations,
  portfolioImages: () => portfolioImages,
  requestImages: () => requestImages,
  requestMessages: () => requestMessages,
  requestStatusEnum: () => requestStatusEnum,
  reviews: () => reviews,
  roleEnum: () => roleEnum,
  shops: () => shops,
  tattooRequests: () => tattooRequests,
  users: () => users,
  verificationDocuments: () => verificationDocuments,
  verificationStatusEnum: () => verificationStatusEnum,
  webhookQueue: () => webhookQueue,
  webhookStatusEnum: () => webhookStatusEnum
});
import {
  bigint,
  serial,
  text,
  timestamp,
  varchar,
  boolean,
  integer,
  pgTable,
  pgEnum,
  foreignKey,
  index,
  unique,
  jsonb
} from "drizzle-orm/pg-core";
var roleEnum, bookingStatusEnum, webhookStatusEnum, verificationStatusEnum, users, artists, shops, portfolioImages, reviews, bookings, favorites, webhookQueue, verificationDocuments, requestStatusEnum, bidStatusEnum, clients, tattooRequests, requestImages, bids, requestMessages, flashArt, invitations;
var init_schema = __esm({
  "backend/drizzle/schema.ts"() {
    "use strict";
    roleEnum = pgEnum("role", ["user", "admin", "artist", "client"]);
    bookingStatusEnum = pgEnum("booking_status", [
      "pending",
      "confirmed",
      "cancelled",
      "completed"
    ]);
    webhookStatusEnum = pgEnum("webhook_status", [
      "pending",
      "processing",
      "completed",
      "failed"
    ]);
    verificationStatusEnum = pgEnum("verification_status", [
      "unverified",
      // Default: Just signed up, can browse but not interact
      "pending",
      // Uploaded license, waiting for admin review
      "verified",
      // Admin approved, can accept payments/messages
      "rejected"
      // License was rejected, needs to re-upload
    ]);
    users = pgTable("users", {
      /**
       * Surrogate primary key. Auto-incremented numeric value managed by the database.
       * Use this for relations between tables.
       */
      id: serial("id").primaryKey(),
      /** Supabase Auth identifier (UUID from auth.users). Unique per user. */
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: roleEnum("role").default("user").notNull(),
      verificationStatus: verificationStatusEnum("verification_status").default("unverified").notNull(),
      licenseDocumentKey: varchar("licenseDocumentKey", { length: 500 }),
      // Supabase Storage key for private license document
      licenseDocumentUrl: varchar("licenseDocumentUrl", { length: 1e3 }),
      // Signed URL for license document
      verificationSubmittedAt: timestamp("verificationSubmittedAt"),
      // When they uploaded license
      verificationReviewedAt: timestamp("verificationReviewedAt"),
      // When admin reviewed
      verificationNotes: text("verificationNotes"),
      // Admin notes about verification
      /**
       * Canonical subscription tier — immutable fact from Stripe. See SubscriptionTier in @shared/const.
       * SOURCE OF TRUTH for billing tier. Nullable: set during onboarding based on role.
       * Onboarding must set: artists → "artist_free", clients → "client_free".
       * artists.subscriptionTier and clients.subscriptionTier are deprecated copies; prefer this column.
       */
      subscriptionTier: varchar("subscriptionTier", { length: 30 }).$type().default(null),
      stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
      stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    artists = pgTable("artists", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
      shopName: varchar("shop_name", { length: 255 }).notNull(),
      bio: text("bio"),
      specialties: text("specialties"),
      // Comma-separated list
      styles: text("styles"),
      // Comma-separated list of tattoo styles (Realism, Traditional, Watercolor, etc.)
      experience: integer("experience"),
      // Years of experience
      address: text("address"),
      city: varchar("city", { length: 100 }),
      state: varchar("state", { length: 50 }),
      zipCode: varchar("zip", { length: 20 }),
      phone: varchar("phone", { length: 50 }),
      website: varchar("website", { length: 500 }),
      instagram: varchar("instagram", { length: 255 }),
      facebook: varchar("facebook", { length: 500 }),
      lat: text("lat"),
      lng: text("lng"),
      averageRating: text("averageRating"),
      totalReviews: integer("totalReviews").default(0),
      isApproved: boolean("isApproved").default(false),
      // artists.subscriptionTier was deprecated in favour of users.subscriptionTier.
      // The column has been removed from this schema; run `pnpm db:push` to drop it from
      // the database (generates: ALTER TABLE artists DROP COLUMN subscriptionTier).
      bidsUsed: integer("bidsUsed").default(0).notNull(),
      /** Number of bids submitted in the current calendar month (resets on 1st of each month) */
      bidsThisMonth: integer("bidsThisMonth").default(0).notNull(),
      /** Tracks which month the bidsThisMonth counter belongs to, format: YYYY-MM */
      bidsMonthYear: varchar("bidsMonthYear", { length: 7 }).default("2000-01").notNull(),
      /** The artist's balance of purchased/granted bid tokens */
      bidTokens: integer("bidTokens").default(0).notNull(),
      /** The artist's balance of purchased/granted chat tokens */
      chatTokens: integer("chatTokens").default(0).notNull(),
      /** The artist's balance of AI generation credits */
      aiCredits: integer("aiCredits").default(0).notNull(),
      /** True if this artist signed up during the Founding Artist offer period */
      isFoundingArtist: boolean("isFoundingArtist").default(false).notNull(),
      /** When the 3-month free trial ends; null for non-founding artists */
      foundingTrialEndsAt: timestamp("foundingTrialEndsAt"),
      /** Number of times this artist profile has been viewed by clients */
      profileViewCount: integer("profileViewCount").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    shops = pgTable(
      "shops",
      {
        id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
        shopName: text("shop_name").notNull(),
        address: text("address"),
        city: text("city"),
        state: text("state"),
        zipCode: text("zip_code"),
        phone: text("phone"),
        email: text("email"),
        isVerified: boolean("is_verified").default(false),
        isClaimed: boolean("is_claimed").default(false),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
      },
      (table) => ({
        shopNameIdx: index("idx_shops_name").on(table.shopName),
        cityIdx: index("idx_shops_city").on(table.city)
      })
    );
    portfolioImages = pgTable("portfolioImages", {
      id: serial("id").primaryKey(),
      artistId: integer("artistId").notNull().references(() => artists.id, { onDelete: "cascade" }),
      imageUrl: varchar("imageUrl", { length: 1e3 }).notNull(),
      imageKey: varchar("imageKey", { length: 500 }).notNull(),
      // Supabase Storage key
      caption: text("caption"),
      style: varchar("style", { length: 100 }),
      // e.g., "Realism", "Traditional"
      // AI-generated fields (Smart Portfolio Tagging via Gemini Vision)
      aiStyles: text("aiStyles"),
      // JSON array of detected tattoo styles
      aiTags: text("aiTags"),
      // JSON array of content tags (subjects, themes)
      aiDescription: text("aiDescription"),
      // AI-generated description for SEO
      qualityScore: integer("qualityScore"),
      // 1-100 image quality score
      qualityIssues: text("qualityIssues"),
      // JSON array of detected issues (blurry, low-res, etc.)
      aiProcessedAt: timestamp("aiProcessedAt"),
      // When AI analysis was completed
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    reviews = pgTable("reviews", {
      id: serial("id").primaryKey(),
      artistId: integer("artistId").notNull().references(() => artists.id, { onDelete: "cascade" }),
      userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
      rating: integer("rating").notNull(),
      // 1-5 stars
      comment: text("comment"),
      helpfulVotes: integer("helpfulVotes").default(0),
      // Number of helpful votes
      verifiedBooking: boolean("verifiedBooking").default(false),
      photos: text("photos"),
      // Comma-separated URLs of review photos
      artistResponse: text("artistResponse"),
      // Artist's response to review
      artistResponseDate: timestamp("artistResponseDate"),
      // When artist responded
      // AI Moderation fields (Review Sentiment Analysis via Gemini)
      moderationStatus: varchar("moderationStatus", { length: 20 }).default(
        "pending"
      ),
      // "pending", "approved", "flagged", "hidden"
      moderationFlags: text("moderationFlags"),
      // JSON array of flag strings from AI analysis
      toxicityScore: integer("toxicityScore"),
      // 0-100
      spamScore: integer("spamScore"),
      // 0-100
      fraudScore: integer("fraudScore"),
      // 0-100
      moderationReason: text("moderationReason"),
      // AI explanation for the moderation decision
      moderatedAt: timestamp("moderatedAt"),
      // When AI moderation was completed
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    bookings = pgTable("bookings", {
      id: serial("id").primaryKey(),
      artistId: integer("artistId").notNull().references(() => artists.id, { onDelete: "cascade" }),
      userId: integer("userId").references(() => users.id, {
        onDelete: "set null"
      }),
      // nullable for guest bookings
      customerName: varchar("customerName", { length: 255 }).notNull(),
      customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
      customerPhone: varchar("customerPhone", { length: 50 }).notNull(),
      preferredDate: timestamp("preferredDate").notNull(),
      tattooDescription: text("tattooDescription").notNull(),
      placement: varchar("placement", { length: 255 }).notNull(),
      size: varchar("size", { length: 100 }).notNull(),
      budget: varchar("budget", { length: 100 }),
      additionalNotes: text("additionalNotes"),
      status: bookingStatusEnum("status").default("pending").notNull(),
      stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
      // For deposit payments
      depositAmount: integer("depositAmount"),
      // Amount in cents
      depositPaid: boolean("depositPaid").default(false),
      cancelledBy: varchar("cancelledBy", { length: 50 }),
      refundStatus: varchar("refundStatus", { length: 50 }).default("not_requested").notNull(),
      refundReason: text("refundReason"),
      refundRequestedAt: timestamp("refundRequestedAt"),
      refundProcessedAt: timestamp("refundProcessedAt"),
      stripeRefundId: varchar("stripeRefundId", { length: 255 }),
      source: varchar("source", { length: 100 }).default("ink_connect").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    favorites = pgTable(
      "favorites",
      {
        id: serial("id").primaryKey(),
        userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
        artistId: integer("artistId").notNull().references(() => artists.id, { onDelete: "cascade" }),
        createdAt: timestamp("createdAt").defaultNow().notNull()
      },
      (table) => ({
        uniqueUserArtist: unique().on(table.userId, table.artistId)
      })
    );
    webhookQueue = pgTable("webhookQueue", {
      id: serial("id").primaryKey(),
      eventId: varchar("eventId", { length: 255 }).notNull().unique(),
      eventType: varchar("eventType", { length: 100 }).notNull(),
      payload: text("payload").notNull(),
      // JSON stringified
      status: webhookStatusEnum("status").notNull().default("pending"),
      retryCount: integer("retryCount").notNull().default(0),
      maxRetries: integer("maxRetries").notNull().default(5),
      nextRetryAt: timestamp("nextRetryAt").notNull(),
      lastError: text("lastError"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    verificationDocuments = pgTable("verificationDocuments", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
      documentType: varchar("documentType", { length: 100 }).notNull(),
      // "state_license", "business_permit", etc.
      documentKey: varchar("documentKey", { length: 500 }).notNull(),
      // Supabase Storage key (private bucket)
      originalFileName: varchar("originalFileName", { length: 255 }).notNull(),
      fileSize: integer("fileSize"),
      // In bytes
      mimeType: varchar("mimeType", { length: 100 }),
      status: verificationStatusEnum("status").default("pending").notNull(),
      reviewedBy: integer("reviewedBy").references(() => users.id, {
        onDelete: "set null"
      }),
      // Admin who reviewed
      reviewNotes: text("reviewNotes"),
      // Admin review notes
      // AI OCR Verification fields (License Verification via Gemini)
      ocrDocumentType: varchar("ocrDocumentType", { length: 50 }),
      // Detected document type
      ocrExtractedName: varchar("ocrExtractedName", { length: 255 }),
      // Name from OCR
      ocrExtractedBusinessName: varchar("ocrExtractedBusinessName", {
        length: 255
      }),
      // Business name from OCR
      ocrLicenseNumber: varchar("ocrLicenseNumber", { length: 100 }),
      // License number from OCR
      ocrExpirationDate: varchar("ocrExpirationDate", { length: 20 }),
      // Expiration date string
      ocrIssuingAuthority: varchar("ocrIssuingAuthority", { length: 255 }),
      // Issuing body
      ocrConfidence: integer("ocrConfidence"),
      // 0-100 confidence score
      ocrNameMatch: varchar("ocrNameMatch", { length: 20 }),
      // "exact", "partial", "mismatch", "unavailable"
      ocrVerdict: varchar("ocrVerdict", { length: 20 }),
      // "verified", "needs_review", "rejected"
      ocrVerdictReason: text("ocrVerdictReason"),
      // AI explanation for verdict
      ocrIssues: text("ocrIssues"),
      // JSON array of detected issues
      ocrProcessedAt: timestamp("ocrProcessedAt"),
      // When OCR analysis was completed
      submittedAt: timestamp("submittedAt").defaultNow().notNull(),
      reviewedAt: timestamp("reviewedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    requestStatusEnum = pgEnum("request_status", [
      "open",
      // Accepting bids
      "in_progress",
      // Artist selected, work in progress
      "completed",
      // Tattoo completed
      "cancelled"
      // Client cancelled
    ]);
    bidStatusEnum = pgEnum("bid_status", [
      "pending",
      // Waiting for client review
      "accepted",
      // Client accepted this bid
      "rejected",
      // Client rejected this bid
      "withdrawn"
      // Artist withdrew bid
    ]);
    clients = pgTable("clients", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
      displayName: varchar("displayName", { length: 255 }).notNull(),
      bio: text("bio"),
      preferredStyles: text("preferredStyles"),
      // Comma-separated list
      city: varchar("city", { length: 100 }),
      state: varchar("state", { length: 50 }),
      phone: varchar("phone", { length: 50 }),
      onboardingCompleted: boolean("onboardingCompleted").default(false),
      // clients.subscriptionTier was deprecated in favour of users.subscriptionTier.
      // The column has been removed from this schema; run `pnpm db:push` to drop it from
      // the database (generates: ALTER TABLE clients DROP COLUMN subscriptionTier).
      aiCredits: integer("aiCredits").default(0).notNull(),
      // Number of AI generation credits remaining
      stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
      // Stripe subscription ID for billing
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    tattooRequests = pgTable(
      "tattooRequests",
      {
        id: serial("id").primaryKey(),
        clientId: integer("clientId").references(() => clients.id, { onDelete: "set null" }),
        // nullable — guests can post without an account
        guestEmail: varchar("guestEmail", { length: 255 }),
        // optional contact email for guests
        title: varchar("title", { length: 255 }).notNull(),
        description: text("description").notNull(),
        style: varchar("style", { length: 100 }),
        // e.g., "Realism", "Traditional", "Watercolor"
        placement: varchar("placement", { length: 100 }).notNull(),
        // e.g., "forearm", "back", "sleeve"
        size: varchar("size", { length: 50 }).notNull(),
        // e.g., "small", "medium", "large", "full sleeve"
        colorPreference: varchar("colorPreference", { length: 50 }),
        // "color", "black_and_grey", "either"
        budgetMin: integer("budgetMin"),
        // In cents
        budgetMax: integer("budgetMax"),
        // In cents
        preferredCity: varchar("preferredCity", { length: 100 }),
        preferredState: varchar("preferredState", { length: 50 }),
        willingToTravel: boolean("willingToTravel").default(false),
        desiredTimeframe: varchar("desiredTimeframe", { length: 100 }),
        // e.g., "ASAP", "Within 1 month", "Flexible"
        selectedAddons: jsonb("selectedAddons").$type().default([]).notNull(),
        addOnTotalCents: integer("addOnTotalCents").default(0).notNull(),
        addOnPaymentStatus: varchar("addOnPaymentStatus", { length: 30 }).$type().default("not_requested").notNull(),
        addOnStripeCheckoutSessionId: varchar("addOnStripeCheckoutSessionId", {
          length: 255
        }),
        addOnStripePaymentIntentId: varchar("addOnStripePaymentIntentId", {
          length: 255
        }),
        addOnPaidAt: timestamp("addOnPaidAt"),
        status: requestStatusEnum("status").default("open").notNull(),
        selectedBidId: integer("selectedBidId"),
        // Will be set when client accepts a bid
        viewCount: integer("viewCount").default(0),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().notNull(),
        expiresAt: timestamp("expiresAt")
        // Optional expiration date
      },
      (table) => ({
        // Table-level FK keeps circular request <-> bid relationship explicit in schema snapshots.
        selectedBidFk: foreignKey({
          name: "tattooRequests_selectedBidId_bids_id_fk",
          columns: [table.selectedBidId],
          foreignColumns: [bids.id]
        }).onDelete("set null").onUpdate("no action")
      })
    );
    requestImages = pgTable("requestImages", {
      id: serial("id").primaryKey(),
      requestId: integer("requestId").notNull().references(() => tattooRequests.id, { onDelete: "cascade" }),
      imageUrl: varchar("imageUrl", { length: 1e3 }).notNull(),
      imageKey: varchar("imageKey", { length: 500 }).notNull(),
      // Supabase Storage key
      caption: text("caption"),
      isMainImage: boolean("isMainImage").default(false),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    bids = pgTable(
      "bids",
      {
        id: serial("id").primaryKey(),
        requestId: integer("requestId").notNull().references(() => tattooRequests.id, {
          onDelete: "cascade"
        }),
        artistId: integer("artistId").notNull().references(() => artists.id, { onDelete: "cascade" }),
        priceEstimate: integer("priceEstimate").notNull(),
        // In cents
        estimatedHours: integer("estimatedHours"),
        message: text("message").notNull(),
        // Artist's pitch to the client
        availableDate: timestamp("availableDate"),
        // When artist can do the work
        portfolioLinks: text("portfolioLinks"),
        // Links to relevant portfolio pieces
        status: bidStatusEnum("status").default("pending").notNull(),
        /**
         * Platform transaction fee rate at bid creation time, stored in basis points.
         * 500 = 5% (Pro subscriber), 1000 = 10% (Pay-as-you-go), 0 = free tier.
         */
        platformFeeRateBps: integer("platformFeeRateBps").default(0).notNull(),
        /**
         * Calculated platform fee in cents. Set when bid is accepted.
         * = priceEstimate * platformFeeRateBps / 10000
         */
        platformFeeAmountCents: integer("platformFeeAmountCents"),
        createdAt: timestamp("createdAt").defaultNow().notNull(),
        updatedAt: timestamp("updatedAt").defaultNow().notNull()
      },
      (table) => ({
        // One bid per artist per request
        uniqueArtistRequest: unique().on(table.artistId, table.requestId)
      })
    );
    requestMessages = pgTable("requestMessages", {
      id: serial("id").primaryKey(),
      requestId: integer("requestId").notNull().references(() => tattooRequests.id, { onDelete: "cascade" }),
      bidId: integer("bidId").references(() => bids.id, { onDelete: "cascade" }),
      // Optional - can be general request message
      senderId: integer("senderId").references(() => users.id, {
        onDelete: "set null"
      }),
      // Nullable - set null if user deleted
      message: text("message").notNull(),
      isRead: boolean("isRead").default(false),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    flashArt = pgTable("flash_art", {
      id: serial("id").primaryKey(),
      artistId: integer("artistId").notNull().references(() => artists.id, { onDelete: "cascade" }),
      imageUrl: varchar("imageUrl", { length: 1e3 }).notNull(),
      imageKey: varchar("imageKey", { length: 500 }).notNull(),
      // Supabase Storage key
      title: varchar("title", { length: 255 }).notNull(),
      description: text("description"),
      price: integer("price").notNull(),
      // In cents
      depositAmount: integer("depositAmount").notNull(),
      // In cents
      isLocked: boolean("isLocked").default(false).notNull(),
      lockedByUserId: integer("lockedByUserId").references(() => users.id, { onDelete: "set null" }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    invitations = pgTable("invitations", {
      id: serial("id").primaryKey(),
      email: varchar("email", { length: 320 }).notNull(),
      shopName: varchar("shopName", { length: 255 }).notNull(),
      state: varchar("state", { length: 100 }),
      // The US state where the artist is located
      inviteCode: varchar("inviteCode", { length: 128 }).notNull().unique(),
      sentAt: timestamp("sentAt").defaultNow().notNull(),
      openedAt: timestamp("openedAt"),
      registeredAt: timestamp("registeredAt"),
      status: varchar("status", { length: 50 }).default("sent").notNull(),
      // 'sent', 'opened', 'registered', 'approved'
      userId: integer("userId").references(() => users.id, { onDelete: "set null" })
    });
  }
});

// backend/server/_core/sentry.ts
var sentry_exports = {};
__export(sentry_exports, {
  addBreadcrumb: () => addBreadcrumb2,
  captureException: () => captureException2,
  captureMessage: () => captureMessage2,
  flushSentry: () => flushSentry,
  initSentry: () => initSentry,
  isSentryInitialized: () => isSentryInitialized,
  sentryErrorHandler: () => sentryErrorHandler,
  sentryRequestHandler: () => sentryRequestHandler,
  setUser: () => setUser2,
  startTransaction: () => startTransaction
});
import * as Sentry from "@sentry/node";
function initSentry() {
  const dsn = process.env.SENTRY_DSN || "https://e2de2529cc60ea38479b53231561460c@o4511500483231744.ingest.us.sentry.io/4511500485066752";
  if (!dsn) {
    logger.warn("SENTRY_DSN not configured - error tracking disabled");
    return;
  }
  if (initialized) {
    logger.debug("Sentry already initialized");
    return;
  }
  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || "development",
      release: process.env.npm_package_version || "unknown",
      // Performance monitoring
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
      // Integrations
      integrations: [
        // Express integration is automatically added
        Sentry.httpIntegration(),
        Sentry.expressIntegration()
      ],
      // Filter out noisy errors
      beforeSend(event, hint) {
        const error = hint.originalException;
        if (error instanceof Error && error.message.includes("401")) {
          return null;
        }
        if (error instanceof Error && error.message.includes("rate limit")) {
          return null;
        }
        return event;
      },
      // Tag important info
      initialScope: {
        tags: {
          component: "backend"
        }
      }
    });
    initialized = true;
    logger.info("Sentry error tracking initialized");
  } catch (err) {
    logger.error("Failed to initialize Sentry", {
      error: err instanceof Error ? err.message : String(err)
    });
  }
}
function captureException2(error, context) {
  if (!initialized) {
    return void 0;
  }
  return Sentry.captureException(error, {
    extra: context
  });
}
function captureMessage2(message, level = "info", context) {
  if (!initialized) {
    return void 0;
  }
  return Sentry.captureMessage(message, {
    level,
    extra: context
  });
}
function setUser2(user) {
  if (!initialized) return;
  Sentry.setUser(user);
}
function addBreadcrumb2(breadcrumb) {
  if (!initialized) return;
  Sentry.addBreadcrumb(breadcrumb);
}
function startTransaction(name, op) {
  if (!initialized) return void 0;
  return Sentry.startSpan({ name, op }, (span) => span);
}
function sentryErrorHandler() {
  return Sentry.expressErrorHandler();
}
function sentryRequestHandler() {
  return Sentry.expressIntegration().setupOnce;
}
async function flushSentry(timeout = 2e3) {
  if (!initialized) return true;
  return Sentry.close(timeout);
}
function isSentryInitialized() {
  return initialized;
}
var initialized;
var init_sentry = __esm({
  "backend/server/_core/sentry.ts"() {
    "use strict";
    init_logger();
    initialized = false;
  }
});

// backend/server/_core/logger.ts
import winston from "winston";
import { AsyncLocalStorage } from "node:async_hooks";
function serializeUnknownError(error) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }
  return {
    value: error
  };
}
var isDev, transports, requestStorage, requestContextFormat, logger;
var init_logger = __esm({
  "backend/server/_core/logger.ts"() {
    "use strict";
    init_env();
    isDev = !ENV.isProduction;
    transports = [
      new winston.transports.Console({
        format: isDev ? winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ) : winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      })
    ];
    if (ENV.isProduction) {
      try {
        transports.push(
          new winston.transports.File({
            // Render and similar hosts may not allow writing to /var/log.
            // Keep the file in app working directory so startup does not crash.
            filename: process.env.LOG_FILE_PATH || "app-error.log",
            level: "error",
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json()
            )
          })
        );
      } catch {
      }
    }
    requestStorage = new AsyncLocalStorage();
    requestContextFormat = winston.format((info) => {
      const store = globalThis.__requestStorageStore || requestStorage.getStore();
      if (store?.requestId) {
        info.requestId = store.requestId;
      }
      return info;
    });
    logger = winston.createLogger({
      level: isDev ? "debug" : "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        requestContextFormat(),
        winston.format.errors({ stack: true })
      ),
      defaultMeta: { service: "tattoo-shops-api" },
      transports
    });
    process.on("unhandledRejection", async (reason, promise) => {
      logger.error("Unhandled Rejection at:", {
        promise,
        reason: serializeUnknownError(reason)
      });
      try {
        const sentry = await Promise.resolve().then(() => (init_sentry(), sentry_exports));
        sentry.captureException(reason, {
          type: "unhandledRejection",
          promise: String(promise)
        });
      } catch (err) {
      }
    });
    process.on("uncaughtException", async (error) => {
      logger.error("Uncaught Exception:", {
        error: serializeUnknownError(error)
      });
      try {
        const sentry = await Promise.resolve().then(() => (init_sentry(), sentry_exports));
        sentry.captureException(error, { type: "uncaughtException" });
        await sentry.flushSentry(2e3);
      } catch (err) {
      } finally {
        process.exit(1);
      }
    });
  }
});

// backend/server/_core/onboarding.ts
function buildArtistOnboardingUserUpdate(updatedAt = /* @__PURE__ */ new Date()) {
  return {
    role: "artist",
    subscriptionTier: ARTIST_ONBOARDING_TIER,
    updatedAt
  };
}
function buildClientOnboardingUserUpdate(updatedAt = /* @__PURE__ */ new Date()) {
  return {
    role: "client",
    subscriptionTier: CLIENT_ONBOARDING_TIER,
    updatedAt
  };
}
var ARTIST_ONBOARDING_TIER, CLIENT_ONBOARDING_TIER;
var init_onboarding = __esm({
  "backend/server/_core/onboarding.ts"() {
    "use strict";
    ARTIST_ONBOARDING_TIER = "artist_free";
    CLIENT_ONBOARDING_TIER = "client_free";
  }
});

// backend/server/db.ts
var db_exports = {};
__export(db_exports, {
  addFavorite: () => addFavorite,
  addPortfolioImage: () => addPortfolioImage,
  artistFields: () => artistFields,
  createArtist: () => createArtist,
  createBooking: () => createBooking,
  createFlashArt: () => createFlashArt,
  createReview: () => createReview,
  deleteFlashArt: () => deleteFlashArt,
  deletePortfolioImage: () => deletePortfolioImage,
  discoverArtists: () => discoverArtists,
  getAllActiveFlashArt: () => getAllActiveFlashArt,
  getAllArtists: () => getAllArtists,
  getAllArtistsAdmin: () => getAllArtistsAdmin,
  getAllShops: () => getAllShops,
  getArtistById: () => getArtistById,
  getArtistByUserId: () => getArtistByUserId,
  getBookingById: () => getBookingById,
  getBookingsByArtistId: () => getBookingsByArtistId,
  getBookingsByUserId: () => getBookingsByUserId,
  getDb: () => getDb,
  getFavoritesByUserId: () => getFavoritesByUserId,
  getFlaggedReviews: () => getFlaggedReviews,
  getFlashArtByArtistId: () => getFlashArtByArtistId,
  getFlashArtById: () => getFlashArtById,
  getPendingVerificationDocuments: () => getPendingVerificationDocuments,
  getPoolStats: () => getPoolStats,
  getPortfolioByArtistId: () => getPortfolioByArtistId,
  getPortfolioCountByArtistId: () => getPortfolioCountByArtistId,
  getPortfolioImageById: () => getPortfolioImageById,
  getRealUserCount: () => getRealUserCount,
  getReviewById: () => getReviewById,
  getReviewsByArtistId: () => getReviewsByArtistId,
  getUserByOpenId: () => getUserByOpenId,
  getVerificationDocumentById: () => getVerificationDocumentById,
  isAiEnabled: () => isAiEnabled,
  isFavorite: () => isFavorite,
  lockFlashArt: () => lockFlashArt,
  logPoolStats: () => logPoolStats,
  removeFavorite: () => removeFavorite,
  reviewVerificationDocument: () => reviewVerificationDocument,
  searchArtists: () => searchArtists,
  searchShops: () => searchShops,
  updateArtist: () => updateArtist,
  updateBooking: () => updateBooking,
  updatePortfolioImageAI: () => updatePortfolioImageAI,
  updateReviewModeration: () => updateReviewModeration,
  updateVerificationDocumentOCR: () => updateVerificationDocumentOCR,
  upsertUser: () => upsertUser,
  withTransaction: () => withTransaction
});
import { eq, desc, and, sql, or, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
function getPoolStats() {
  return { ..._poolStats };
}
function logPoolStats() {
  if (_sqlClient) {
    const stats = {
      ..._poolStats,
      lastChecked: /* @__PURE__ */ new Date()
    };
    _poolStats = stats;
    logger.debug("Database pool stats", stats);
  }
}
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const dbUrl = process.env.DATABASE_URL.replace(/^DATABASE_URL=/, "");
      const maxPoolSize = parseInt(process.env.DATABASE_POOL_SIZE || "3", 10);
      _sqlClient = postgres(dbUrl, {
        max: maxPoolSize,
        // Keep pool small to avoid pool exhaustion in serverless/lambdas
        idle_timeout: 10,
        // Close idle connections faster to free up resources (10s)
        max_lifetime: 60 * 15,
        // Close connections after 15 minutes to refresh connections
        connect_timeout: 10,
        // 10 second connection timeout (Render cold starts are slow)
        prepare: false,
        // MUST be false for Supabase (Supavisor/PgBouncer incompatible)
        ssl: dbUrl.includes("supabase") ? "require" : void 0,
        // Supabase pooler requires SSL
        onnotice: (notice) => {
          logger.debug("Database notice", { message: notice.message });
        },
        onclose: () => {
          logger.debug("Database connection closed");
        }
      });
      _db = drizzle(_sqlClient);
      logger.info("Database connection pool initialized", {
        maxConnections: maxPoolSize
      });
    } catch (error) {
      logger.error("Database connection failed", { error });
      _db = null;
    }
  }
  return _db;
}
async function withTransaction(callback) {
  const db = await getDb();
  if (!db || !_sqlClient) {
    throw new Error("Database not available for transactions");
  }
  return _sqlClient.begin(async (sql5) => {
    const txDb = drizzle(sql5);
    return callback(txDb);
  });
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    logger.warn("Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = [
      "name",
      "email",
      "loginMethod",
      "stripeCustomerId"
    ];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet
    });
  } catch (error) {
    logger.error("Failed to upsert user", { error });
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    logger.warn("Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createArtist(artist) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.transaction(async (tx) => {
    await tx.update(users).set(buildArtistOnboardingUserUpdate()).where(eq(users.id, artist.userId));
    const [created] = await tx.insert(artists).values({ ...artist, isApproved: false }).onConflictDoUpdate({
      target: artists.userId,
      set: {
        shopName: artist.shopName,
        bio: artist.bio ?? null,
        specialties: artist.specialties ?? null,
        experience: artist.experience ?? null,
        city: artist.city ?? null,
        state: artist.state ?? null,
        instagram: artist.instagram ?? null,
        isApproved: false,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return created;
  });
}
async function getArtistByUserId(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select({
    ...artistFields,
    subscriptionTier: users.subscriptionTier
  }).from(artists).innerJoin(users, eq(artists.userId, users.id)).where(eq(artists.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getArtistById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select({
    ...artistFields,
    subscriptionTier: users.subscriptionTier
  }).from(artists).innerJoin(users, eq(artists.userId, users.id)).where(eq(artists.id, id)).limit(1);
  if (result.length > 0) {
    return result[0];
  }
  const fallback = await db.select({
    ...artistFields,
    subscriptionTier: users.subscriptionTier
  }).from(artists).innerJoin(users, eq(artists.userId, users.id)).where(eq(artists.userId, id)).limit(1);
  return fallback.length > 0 ? fallback[0] : void 0;
}
async function getAllArtists() {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    ...artistFields,
    subscriptionTier: users.subscriptionTier
  }).from(artists).innerJoin(users, eq(artists.userId, users.id)).where(eq(artists.isApproved, true)).orderBy(
    // Founding artists appear first
    sql`${artists.isFoundingArtist} DESC`,
    desc(artists.createdAt)
  );
}
async function getAllArtistsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    id: artists.id,
    shopName: artists.shopName,
    city: artists.city,
    state: artists.state,
    isApproved: artists.isApproved,
    createdAt: artists.createdAt,
    userId: artists.userId,
    userName: users.name,
    userEmail: users.email,
    verificationStatus: users.verificationStatus
  }).from(artists).innerJoin(users, eq(artists.userId, users.id)).orderBy(desc(artists.createdAt));
}
async function searchArtists(filters) {
  const db = await getDb();
  if (!db) return [];
  const normalizedShopName = filters.shopName?.trim();
  const normalizedCity = filters.city?.trim();
  const normalizedState = filters.state?.trim();
  const conditions = [eq(artists.isApproved, true)];
  if (normalizedShopName) {
    conditions.push(sql`${artists.shopName} ILIKE ${`%${normalizedShopName}%`}`);
  }
  if (filters.styles && filters.styles.length > 0) {
    const styleConditions = filters.styles.map(
      (style) => sql`${artists.styles} ILIKE ${"%" + style + "%"}`
    );
    conditions.push(or(...styleConditions));
  }
  if (filters.minRating && filters.minRating > 0) {
    conditions.push(
      sql`${artists.averageRating}::numeric >= ${filters.minRating}`
    );
  }
  if (filters.minExperience && filters.minExperience > 0) {
    conditions.push(gte(artists.experience, filters.minExperience));
  }
  if (normalizedCity) {
    conditions.push(sql`${artists.city} ILIKE ${`%${normalizedCity}%`}`);
  }
  if (normalizedState) {
    conditions.push(sql`${artists.state} ILIKE ${`%${normalizedState}%`}`);
  }
  return await db.select({
    ...artistFields,
    subscriptionTier: users.subscriptionTier
  }).from(artists).innerJoin(users, eq(artists.userId, users.id)).where(and(...conditions)).orderBy(
    sql`${artists.isFoundingArtist} DESC`,
    desc(artists.averageRating)
  );
}
async function getAllShops() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(shops).orderBy(shops.shopName);
}
async function searchShops(query) {
  const db = await getDb();
  if (!db) return [];
  if (!query.trim()) return getAllShops();
  const term = `%${query.trim()}%`;
  return await db.select().from(shops).where(
    or(
      sql`${shops.shopName} ILIKE ${term}`,
      sql`${shops.city} ILIKE ${term}`,
      sql`${shops.state} ILIKE ${term}`
    )
  ).orderBy(shops.shopName);
}
async function updateArtist(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(artists).set(data).where(eq(artists.id, id));
}
async function addPortfolioImage(image) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [inserted] = await db.insert(portfolioImages).values(image).returning();
  return inserted;
}
async function getPortfolioByArtistId(artistId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(portfolioImages).where(eq(portfolioImages.artistId, artistId)).orderBy(desc(portfolioImages.createdAt));
}
async function getPortfolioCountByArtistId(artistId) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql`count(*)::int` }).from(portfolioImages).where(eq(portfolioImages.artistId, artistId));
  return result[0]?.count ?? 0;
}
async function getPortfolioImageById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(portfolioImages).where(eq(portfolioImages.id, id)).limit(1);
  return result[0] || null;
}
async function deletePortfolioImage(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(portfolioImages).where(eq(portfolioImages.id, id));
}
async function updatePortfolioImageAI(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(portfolioImages).set(data).where(eq(portfolioImages.id, id));
}
async function createReview(review) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [inserted] = await db.insert(reviews).values(review).returning();
  await updateArtistRating(review.artistId);
  return inserted;
}
async function getReviewsByArtistId(artistId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    id: reviews.id,
    rating: reviews.rating,
    comment: reviews.comment,
    createdAt: reviews.createdAt,
    userName: users.name,
    helpfulVotes: reviews.helpfulVotes,
    verifiedBooking: reviews.verifiedBooking,
    photos: reviews.photos,
    artistResponse: reviews.artistResponse,
    artistResponseDate: reviews.artistResponseDate
  }).from(reviews).leftJoin(users, eq(reviews.userId, users.id)).where(eq(reviews.artistId, artistId)).orderBy(desc(reviews.createdAt));
}
async function updateArtistRating(artistId) {
  const db = await getDb();
  if (!db) return;
  const result = await db.select({
    avgRating: sql`AVG(${reviews.rating})`,
    count: sql`COUNT(*)`
  }).from(reviews).where(eq(reviews.artistId, artistId));
  if (result.length > 0) {
    const avgRating = result[0].avgRating ? parseFloat(result[0].avgRating).toFixed(2) : "0";
    const count = result[0].count || 0;
    await db.update(artists).set({
      averageRating: avgRating,
      totalReviews: count
    }).where(eq(artists.id, artistId));
  }
}
async function createBooking(booking) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bookings).values(booking).returning();
  return result[0];
}
async function getBookingById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getBookingsByUserId(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    booking: bookings,
    artist: artists
  }).from(bookings).leftJoin(artists, eq(bookings.artistId, artists.id)).where(eq(bookings.userId, userId)).orderBy(desc(bookings.createdAt));
}
async function getBookingsByArtistId(artistId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(bookings).where(eq(bookings.artistId, artistId)).orderBy(desc(bookings.createdAt));
}
async function updateBooking(id, data, tx) {
  const client = tx || await getDb();
  if (!client) throw new Error("Database not available");
  return await client.update(bookings).set(data).where(eq(bookings.id, id));
}
async function addFavorite(favorite) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(favorites).values(favorite);
}
async function removeFavorite(userId, artistId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.artistId, artistId)));
}
async function getFavoritesByUserId(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    favorite: favorites,
    artist: artists
  }).from(favorites).leftJoin(artists, eq(favorites.artistId, artists.id)).where(eq(favorites.userId, userId)).orderBy(desc(favorites.createdAt));
}
async function isFavorite(userId, artistId) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.artistId, artistId))).limit(1);
  return result.length > 0;
}
async function discoverArtists(intent) {
  const db = await getDb();
  if (!db) return [];
  const allTerms = [
    ...intent.styles,
    ...intent.tags,
    ...intent.keywords
  ].filter(Boolean);
  if (allTerms.length === 0 && !intent.vibeDescription) {
    return (await db.select({
      ...artistFields,
      subscriptionTier: users.subscriptionTier
    }).from(artists).innerJoin(users, eq(artists.userId, users.id)).where(eq(artists.isApproved, true))).map((a) => ({
      ...a,
      matchedImages: [],
      relevanceScore: 0
    }));
  }
  const imageConditions = [];
  for (const term of allTerms) {
    const likeTerm = `%${term}%`;
    imageConditions.push(sql`${portfolioImages.aiStyles} ILIKE ${likeTerm}`);
    imageConditions.push(sql`${portfolioImages.aiTags} ILIKE ${likeTerm}`);
    imageConditions.push(
      sql`${portfolioImages.aiDescription} ILIKE ${likeTerm}`
    );
    imageConditions.push(sql`${portfolioImages.caption} ILIKE ${likeTerm}`);
    imageConditions.push(sql`${portfolioImages.style} ILIKE ${likeTerm}`);
  }
  if (intent.vibeDescription) {
    const vibeWords = intent.vibeDescription.split(/\s+/).filter((w) => w.length > 3).slice(0, 8);
    for (const word of vibeWords) {
      const likeTerm = `%${word}%`;
      imageConditions.push(
        sql`${portfolioImages.aiDescription} ILIKE ${likeTerm}`
      );
    }
  }
  const matchingImages = await db.select({
    image: portfolioImages,
    artist: {
      ...artistFields,
      subscriptionTier: users.subscriptionTier
    }
  }).from(portfolioImages).innerJoin(artists, eq(portfolioImages.artistId, artists.id)).innerJoin(users, eq(artists.userId, users.id)).where(and(eq(artists.isApproved, true), or(...imageConditions))).orderBy(desc(portfolioImages.qualityScore));
  const artistConditions = [];
  for (const term of allTerms) {
    const likeTerm = `%${term}%`;
    artistConditions.push(sql`${artists.styles} ILIKE ${likeTerm}`);
    artistConditions.push(sql`${artists.specialties} ILIKE ${likeTerm}`);
    artistConditions.push(sql`${artists.bio} ILIKE ${likeTerm}`);
  }
  const matchingArtistsDirect = artistConditions.length > 0 ? await db.select({
    ...artistFields,
    subscriptionTier: users.subscriptionTier
  }).from(artists).innerJoin(users, eq(artists.userId, users.id)).where(and(eq(artists.isApproved, true), or(...artistConditions))) : [];
  const artistMap = /* @__PURE__ */ new Map();
  for (const row of matchingImages) {
    const existing = artistMap.get(row.artist.id);
    if (existing) {
      existing.matchedImages.push(row.image);
      existing.relevanceScore += 3;
    } else {
      artistMap.set(row.artist.id, {
        artist: row.artist,
        matchedImages: [row.image],
        relevanceScore: 3
      });
    }
  }
  for (const artist of matchingArtistsDirect) {
    const existing = artistMap.get(artist.id);
    if (existing) {
      existing.relevanceScore += 2;
    } else {
      artistMap.set(artist.id, {
        artist,
        matchedImages: [],
        relevanceScore: 2
      });
    }
  }
  const results = Array.from(artistMap.values()).sort((a, b) => b.relevanceScore - a.relevanceScore).map((entry) => ({
    ...entry.artist,
    matchedImages: entry.matchedImages.slice(0, 6),
    // Top 6 images per artist
    relevanceScore: entry.relevanceScore
  }));
  return results;
}
async function updateVerificationDocumentOCR(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(verificationDocuments).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(verificationDocuments.id, id));
}
async function getVerificationDocumentById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(verificationDocuments).where(eq(verificationDocuments.id, id)).limit(1);
  return result[0] || null;
}
async function getPendingVerificationDocuments() {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    document: verificationDocuments,
    user: {
      id: users.id,
      name: users.name,
      email: users.email,
      verificationStatus: users.verificationStatus
    },
    artist: {
      id: artists.id,
      shopName: artists.shopName,
      state: artists.state
    }
  }).from(verificationDocuments).innerJoin(users, eq(verificationDocuments.userId, users.id)).leftJoin(artists, eq(users.id, artists.userId)).where(eq(verificationDocuments.status, "pending")).orderBy(desc(verificationDocuments.submittedAt));
}
async function reviewVerificationDocument(documentId, decision) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.transaction(async (tx) => {
    const [doc] = await tx.update(verificationDocuments).set({
      status: decision.status,
      reviewedBy: decision.reviewedBy,
      reviewNotes: decision.reviewNotes || null,
      reviewedAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(verificationDocuments.id, documentId)).returning();
    if (!doc) throw new Error("Verification document not found");
    await tx.update(users).set({
      verificationStatus: decision.status,
      verificationReviewedAt: /* @__PURE__ */ new Date(),
      verificationNotes: decision.reviewNotes || null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, doc.userId));
    return doc;
  });
}
async function updateReviewModeration(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(reviews).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(reviews.id, id));
}
async function getFlaggedReviews() {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    review: reviews,
    userName: users.name,
    artistName: artists.shopName
  }).from(reviews).leftJoin(users, eq(reviews.userId, users.id)).leftJoin(artists, eq(reviews.artistId, artists.id)).where(
    or(
      eq(reviews.moderationStatus, "flagged"),
      eq(reviews.moderationStatus, "hidden")
    )
  ).orderBy(desc(reviews.createdAt));
}
async function getReviewById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
  return result[0] || null;
}
async function createFlashArt(flash) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [created] = await db.insert(flashArt).values(flash).returning();
  return created;
}
async function deleteFlashArt(id, artistId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [deleted] = await db.delete(flashArt).where(and(eq(flashArt.id, id), eq(flashArt.artistId, artistId))).returning();
  return deleted;
}
async function getFlashArtByArtistId(artistId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(flashArt).where(eq(flashArt.artistId, artistId)).orderBy(desc(flashArt.createdAt));
}
async function getAllActiveFlashArt() {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    id: flashArt.id,
    artistId: flashArt.artistId,
    imageUrl: flashArt.imageUrl,
    imageKey: flashArt.imageKey,
    title: flashArt.title,
    description: flashArt.description,
    price: flashArt.price,
    depositAmount: flashArt.depositAmount,
    isLocked: flashArt.isLocked,
    createdAt: flashArt.createdAt,
    artistShopName: artists.shopName,
    artistCity: artists.city,
    artistState: artists.state
  }).from(flashArt).innerJoin(artists, eq(flashArt.artistId, artists.id)).innerJoin(users, eq(artists.userId, users.id)).where(
    and(
      eq(flashArt.isLocked, false),
      eq(artists.isApproved, true),
      eq(users.subscriptionTier, "artist_elite")
    )
  ).orderBy(desc(flashArt.createdAt));
}
async function getFlashArtById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(flashArt).where(eq(flashArt.id, id)).limit(1);
  return result[0] || null;
}
async function lockFlashArt(id, userId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [updated] = await db.update(flashArt).set({ isLocked: true, lockedByUserId: userId, updatedAt: /* @__PURE__ */ new Date() }).where(eq(flashArt.id, id)).returning();
  return updated;
}
async function getRealUserCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql`count(*)::int` }).from(users);
  return result[0]?.count ?? 0;
}
async function isAiEnabled() {
  try {
    const count = await getRealUserCount();
    return count >= 100;
  } catch (error) {
    logger.error("Failed to check user count for AI gating:", error);
    return false;
  }
}
var _db, _sqlClient, _poolStats, artistFields;
var init_db = __esm({
  "backend/server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    init_logger();
    init_onboarding();
    _db = null;
    _sqlClient = null;
    _poolStats = {
      totalConnections: 0,
      idleConnections: 0,
      waitingRequests: 0,
      lastChecked: /* @__PURE__ */ new Date()
    };
    artistFields = {
      id: artists.id,
      userId: artists.userId,
      shopName: artists.shopName,
      bio: artists.bio,
      specialties: artists.specialties,
      styles: artists.styles,
      experience: artists.experience,
      address: artists.address,
      city: artists.city,
      state: artists.state,
      zipCode: artists.zipCode,
      phone: artists.phone,
      website: artists.website,
      instagram: artists.instagram,
      facebook: artists.facebook,
      lat: artists.lat,
      lng: artists.lng,
      averageRating: artists.averageRating,
      totalReviews: artists.totalReviews,
      isApproved: artists.isApproved,
      bidsUsed: artists.bidsUsed,
      bidsThisMonth: artists.bidsThisMonth,
      bidsMonthYear: artists.bidsMonthYear,
      bidTokens: artists.bidTokens,
      chatTokens: artists.chatTokens,
      aiCredits: artists.aiCredits,
      isFoundingArtist: artists.isFoundingArtist,
      foundingTrialEndsAt: artists.foundingTrialEndsAt,
      createdAt: artists.createdAt,
      updatedAt: artists.updatedAt
    };
  }
});

// backend/server/_core/circuitBreaker.ts
function getOrCreateCircuit(name) {
  if (!circuits.has(name)) {
    circuits.set(name, {
      state: "CLOSED" /* CLOSED */,
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      nextAttemptTime: null
    });
  }
  return circuits.get(name);
}
var circuits, CircuitBreaker, stripeCircuit, supabaseCircuit, emailCircuit;
var init_circuitBreaker = __esm({
  "backend/server/_core/circuitBreaker.ts"() {
    "use strict";
    init_logger();
    circuits = /* @__PURE__ */ new Map();
    CircuitBreaker = class {
      name;
      failureThreshold;
      successThreshold;
      timeout;
      constructor(options) {
        this.name = options.name;
        this.failureThreshold = options.failureThreshold ?? 5;
        this.successThreshold = options.successThreshold ?? 2;
        this.timeout = options.timeout ?? 3e4;
      }
      async execute(fn) {
        const circuit = getOrCreateCircuit(this.name);
        if (circuit.state === "OPEN" /* OPEN */) {
          if (Date.now() >= (circuit.nextAttemptTime ?? 0)) {
            circuit.state = "HALF_OPEN" /* HALF_OPEN */;
            circuit.successes = 0;
            logger.info(`Circuit ${this.name} transitioning to HALF_OPEN`);
          } else {
            throw new Error(`Circuit ${this.name} is OPEN. Service unavailable.`);
          }
        }
        try {
          const result = await fn();
          this.onSuccess(circuit);
          return result;
        } catch (error) {
          this.onFailure(circuit);
          throw error;
        }
      }
      onSuccess(circuit) {
        if (circuit.state === "HALF_OPEN" /* HALF_OPEN */) {
          circuit.successes++;
          if (circuit.successes >= this.successThreshold) {
            circuit.state = "CLOSED" /* CLOSED */;
            circuit.failures = 0;
            circuit.successes = 0;
            logger.info(`Circuit ${this.name} CLOSED - service recovered`);
          }
        } else if (circuit.state === "CLOSED" /* CLOSED */) {
          circuit.failures = 0;
        }
      }
      onFailure(circuit) {
        circuit.failures++;
        circuit.lastFailureTime = Date.now();
        if (circuit.state === "HALF_OPEN" /* HALF_OPEN */) {
          circuit.state = "OPEN" /* OPEN */;
          circuit.nextAttemptTime = Date.now() + this.timeout;
          logger.warn(`Circuit ${this.name} OPEN - service still failing`);
        } else if (circuit.failures >= this.failureThreshold) {
          circuit.state = "OPEN" /* OPEN */;
          circuit.nextAttemptTime = Date.now() + this.timeout;
          logger.warn(
            `Circuit ${this.name} OPEN - threshold reached (${circuit.failures} failures)`
          );
        }
      }
      getState() {
        return getOrCreateCircuit(this.name).state;
      }
      getStats() {
        const circuit = getOrCreateCircuit(this.name);
        return {
          state: circuit.state,
          failures: circuit.failures,
          successes: circuit.successes
        };
      }
      // Manual reset for admin/testing
      reset() {
        const circuit = getOrCreateCircuit(this.name);
        circuit.state = "CLOSED" /* CLOSED */;
        circuit.failures = 0;
        circuit.successes = 0;
        circuit.lastFailureTime = null;
        circuit.nextAttemptTime = null;
        logger.info(`Circuit ${this.name} manually reset`);
      }
    };
    stripeCircuit = new CircuitBreaker({
      name: "stripe",
      failureThreshold: 5,
      timeout: 6e4
      // 1 minute
    });
    supabaseCircuit = new CircuitBreaker({
      name: "supabase",
      failureThreshold: 5,
      timeout: 3e4
    });
    emailCircuit = new CircuitBreaker({
      name: "email",
      failureThreshold: 3,
      timeout: 12e4
      // 2 minutes - email services can be slow to recover
    });
  }
});

// backend/server/_core/supabaseStorage.ts
var supabaseStorage_exports = {};
__export(supabaseStorage_exports, {
  BUCKETS: () => BUCKETS,
  createSignedUploadUrl: () => createSignedUploadUrl,
  createSignedUrl: () => createSignedUrl,
  deleteFile: () => deleteFile,
  deleteFiles: () => deleteFiles,
  getPublicUrl: () => getPublicUrl,
  initializeBuckets: () => initializeBuckets,
  listFiles: () => listFiles,
  uploadFile: () => uploadFile
});
async function uploadFile(bucketName, path7, data, contentType) {
  const { error } = await supabaseAdmin.storage.from(bucketName).upload(path7, data, {
    contentType,
    upsert: true
    // Overwrite if exists
  });
  if (error) {
    console.error(`[Storage] Upload to bucket "${bucketName}" failed:`, error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}
async function deleteFile(bucketName, path7) {
  const { error } = await supabaseAdmin.storage.from(bucketName).remove([path7]);
  if (error) {
    console.error(
      `[Storage] Delete from bucket "${bucketName}" failed:`,
      error
    );
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}
async function deleteFiles(bucketName, paths) {
  const { error } = await supabaseAdmin.storage.from(bucketName).remove(paths);
  if (error) {
    console.error(
      `[Storage] Batch delete from bucket "${bucketName}" failed:`,
      error
    );
    throw new Error(`Failed to delete files: ${error.message}`);
  }
}
function getPublicUrl(bucketName, path7) {
  const { data } = supabaseAdmin.storage.from(bucketName).getPublicUrl(path7);
  return data.publicUrl;
}
async function createSignedUrl(bucketName, path7, expiresIn = 3600) {
  const { data, error } = await supabaseAdmin.storage.from(bucketName).createSignedUrl(path7, expiresIn);
  if (error) {
    console.error(
      `[Storage] Create signed URL for bucket "${bucketName}" failed:`,
      error
    );
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }
  return data.signedUrl;
}
async function createSignedUploadUrl(bucketName, path7) {
  const { data, error } = await supabaseAdmin.storage.from(bucketName).createSignedUploadUrl(path7);
  if (error) {
    console.error(
      `[Storage] Create signed upload URL for bucket "${bucketName}" failed:`,
      error
    );
    throw new Error(`Failed to create signed upload URL: ${error.message}`);
  }
  return { signedUrl: data.signedUrl, path: path7 };
}
async function listFiles(bucketName, path7) {
  const { data, error } = await supabaseAdmin.storage.from(bucketName).list(path7);
  if (error) {
    console.error(
      `[Storage] List files in bucket "${bucketName}" failed:`,
      error
    );
    throw new Error(`Failed to list files: ${error.message}`);
  }
  return data;
}
async function initializeBuckets() {
  const { data: existingBuckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) {
    console.error("[Storage] Failed to list buckets:", listError);
    throw new Error(`Failed to list storage buckets: ${listError.message}`);
  }
  const summary = {
    existing: [],
    created: [],
    failed: []
  };
  for (const config of BUCKET_CONFIGS) {
    const bucketExists = existingBuckets.some((b) => b.name === config.name);
    if (!bucketExists) {
      console.log(`[Storage] Bucket "${config.name}" not found. Creating...`);
      const { error: createError } = await supabaseAdmin.storage.createBucket(
        config.name,
        {
          public: config.public,
          fileSizeLimit: config.fileSizeLimit,
          allowedMimeTypes: config.allowedMimeTypes
        }
      );
      if (createError) {
        console.error(
          `[Storage] Failed to create bucket "${config.name}":`,
          createError
        );
        const statusCode = createError.statusCode;
        const permissionHint = statusCode === "403" ? " Check SUPABASE_SERVICE_KEY on this environment; bucket creation requires a service_role key." : "";
        summary.failed.push({
          name: config.name,
          message: `${createError.message}.${permissionHint}`.trim()
        });
      } else {
        console.log(`[Storage] Bucket "${config.name}" created successfully.`);
        summary.created.push(config.name);
      }
    } else {
      summary.existing.push(config.name);
    }
  }
  if (summary.failed.length > 0) {
    const failedBuckets = summary.failed.map((f) => f.name).join(", ");
    throw new Error(`Storage bucket initialization failed for: ${failedBuckets}`);
  }
  return summary;
}
var BUCKETS, BUCKET_CONFIGS;
var init_supabaseStorage = __esm({
  "backend/server/_core/supabaseStorage.ts"() {
    "use strict";
    init_supabase();
    BUCKETS = {
      PORTFOLIO_IMAGES: "portfolio-images",
      REQUEST_IMAGES: "request-images",
      ID_DOCUMENTS: "id-documents"
    };
    BUCKET_CONFIGS = [
      {
        name: BUCKETS.PORTFOLIO_IMAGES,
        public: true,
        fileSizeLimit: 5242880,
        // 5MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/jpg", "image/webp"]
      },
      {
        name: BUCKETS.REQUEST_IMAGES,
        public: true,
        fileSizeLimit: 5242880,
        // 5MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/jpg", "image/webp"]
      },
      {
        name: BUCKETS.ID_DOCUMENTS,
        public: false,
        // PRIVATE
        fileSizeLimit: 10485760,
        // 10MB
        allowedMimeTypes: [
          "image/jpeg",
          "image/png",
          "image/jpg",
          "application/pdf"
        ]
      }
    ];
  }
});

// backend/server/_core/aiProviders.ts
import OpenAI from "openai";
function sleep2(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function stripCodeFences(text2) {
  const trimmed = text2.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}
function parseJsonFromModel(text2) {
  const stripped = stripCodeFences(text2);
  try {
    return JSON.parse(stripped);
  } catch {
    const match = stripped.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("No JSON object found in model response");
    }
    return JSON.parse(match[0]);
  }
}
async function groqGenerateJson(systemPrompt, userPrompt, options) {
  const response = await groqClient.chat.completions.create({
    model: options?.model || DEFAULT_GROQ_MODEL,
    temperature: options?.temperature ?? 0.2,
    max_tokens: options?.maxTokens ?? 2e3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  });
  const content = response.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned an empty response");
  }
  return parseJsonFromModel(content);
}
async function huggingFaceRequest(model, init2, retries = 2) {
  const response = await fetch(`${HF_BASE_URL}/${model}`, {
    ...init2,
    headers: {
      Authorization: `Bearer ${ENV.huggingFaceApiKey}`,
      ...init2.headers || {}
    }
  });
  if (response.status === 503 && retries > 0) {
    try {
      const loading = await response.clone().json();
      const waitMs = Math.min(
        1e4,
        Math.max(1e3, Math.round((loading.estimated_time ?? 1) * 1e3))
      );
      await sleep2(waitMs);
    } catch {
      await sleep2(1500);
    }
    return huggingFaceRequest(model, init2, retries - 1);
  }
  return response;
}
async function generateImageWithHuggingFace(prompt) {
  const response = await huggingFaceRequest(DEFAULT_HF_IMAGE_MODEL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "image/png"
    },
    body: JSON.stringify({
      inputs: prompt,
      options: { wait_for_model: true }
    })
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Hugging Face image generation failed (${response.status}): ${details.slice(0, 400)}`
    );
  }
  const contentType = response.headers.get("content-type") || "image/png";
  if (contentType.includes("application/json")) {
    const details = await response.text();
    throw new Error(
      `Hugging Face image generation returned JSON instead of image: ${details.slice(0, 400)}`
    );
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    buffer,
    mimeType: contentType.split(";")[0]
  };
}
async function imageToTextWithHuggingFace(imageBuffer, mimeType, purpose) {
  const model = purpose === "ocr" ? DEFAULT_HF_OCR_MODEL : DEFAULT_HF_CAPTION_MODEL;
  const response = await huggingFaceRequest(model, {
    method: "POST",
    headers: {
      "Content-Type": mimeType,
      Accept: "application/json"
    },
    body: imageBuffer
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Hugging Face ${purpose} request failed (${response.status}): ${details.slice(0, 400)}`
    );
  }
  const payload = await response.json();
  if (typeof payload === "string") {
    return payload.trim();
  }
  if (Array.isArray(payload)) {
    const first = payload[0];
    if (!first) return "";
    return String(first.generated_text || first.text || "").trim();
  }
  return String(payload.generated_text || payload.text || "").trim();
}
var GROQ_BASE_URL, DEFAULT_GROQ_MODEL, HF_BASE_URL, DEFAULT_HF_IMAGE_MODEL, DEFAULT_HF_CAPTION_MODEL, DEFAULT_HF_OCR_MODEL, groqClient;
var init_aiProviders = __esm({
  "backend/server/_core/aiProviders.ts"() {
    "use strict";
    init_env();
    GROQ_BASE_URL = ENV.groqBaseUrl || "https://api.groq.com/openai/v1";
    DEFAULT_GROQ_MODEL = ENV.groqModel || "llama-3.3-70b-versatile";
    HF_BASE_URL = "https://api-inference.huggingface.co/models";
    DEFAULT_HF_IMAGE_MODEL = ENV.huggingFaceImageModel || "black-forest-labs/FLUX.1-schnell";
    DEFAULT_HF_CAPTION_MODEL = ENV.huggingFaceCaptionModel || "Salesforce/blip-image-captioning-large";
    DEFAULT_HF_OCR_MODEL = ENV.huggingFaceOcrModel || "microsoft/trocr-base-printed";
    groqClient = new OpenAI({
      apiKey: ENV.groqApiKey,
      baseURL: GROQ_BASE_URL
    });
  }
});

// backend/server/stripe.ts
var stripe_exports = {};
__export(stripe_exports, {
  constructWebhookEvent: () => constructWebhookEvent,
  createArtistSubscriptionCheckout: () => createArtistSubscriptionCheckout,
  createCheckoutSession: () => createCheckoutSession,
  createFoundingArtistCheckout: () => createFoundingArtistCheckout,
  refundPaymentIntent: () => refundPaymentIntent,
  stripe: () => stripe,
  stripePriceToArtistTier: () => stripePriceToArtistTier
});
import Stripe from "stripe";
async function createCheckoutSession({
  priceInCents,
  productName,
  productDescription,
  customerEmail,
  metadata,
  successUrl,
  cancelUrl
}) {
  return stripeCircuit.execute(async () => {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productName,
              description: productDescription
            },
            unit_amount: priceInCents
          },
          quantity: 1
        }
      ],
      mode: "payment",
      customer_email: customerEmail,
      metadata,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true
    });
    return session;
  });
}
function stripePriceToArtistTier(priceId) {
  const {
    stripeArtistAmateurPriceIdMonth,
    stripeArtistAmateurPriceIdYear,
    stripeArtistProPriceIdMonth,
    stripeArtistProPriceIdYear,
    stripeArtistIconPriceIdMonth,
    stripeArtistIconPriceIdYear,
    stripeFoundingArtistPriceId
  } = ENV;
  if (priceId === stripeArtistProPriceIdMonth || priceId === stripeArtistProPriceIdYear || priceId === stripeFoundingArtistPriceId)
    return "artist_pro";
  if (priceId === stripeArtistIconPriceIdMonth || priceId === stripeArtistIconPriceIdYear)
    return "artist_elite";
  if (priceId === stripeArtistAmateurPriceIdMonth || priceId === stripeArtistAmateurPriceIdYear)
    return "artist_paygo";
  return null;
}
async function createArtistSubscriptionCheckout({
  priceId,
  customerEmail,
  stripeCustomerId,
  metadata,
  successUrl,
  cancelUrl
}) {
  return stripeCircuit.execute(async () => {
    const isProMonthly = metadata.tier === "artist_pro" && metadata.interval === "month";
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      ...stripeCustomerId ? { customer: stripeCustomerId } : { customer_email: customerEmail },
      metadata,
      subscription_data: {
        metadata,
        ...isProMonthly ? { trial_period_days: 30 } : {}
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true
    });
    return session;
  });
}
async function createFoundingArtistCheckout({
  priceId,
  customerEmail,
  stripeCustomerId,
  metadata,
  successUrl,
  cancelUrl
}) {
  return stripeCircuit.execute(async () => {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      ...stripeCustomerId ? { customer: stripeCustomerId } : { customer_email: customerEmail },
      metadata: { ...metadata, isFoundingArtist: "true" },
      subscription_data: {
        trial_period_days: 90,
        metadata: { ...metadata, isFoundingArtist: "true" }
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: false
      // Founding offer IS the promo — no stacking
    });
    return session;
  });
}
async function constructWebhookEvent(payload, signature) {
  if (!ENV.stripeWebhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is required");
  }
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    ENV.stripeWebhookSecret
  );
}
async function refundPaymentIntent(paymentIntentId, amount) {
  return stripeCircuit.execute(async () => {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...amount ? { amount } : {}
    });
    return refund;
  });
}
var stripe;
var init_stripe = __esm({
  "backend/server/stripe.ts"() {
    "use strict";
    init_env();
    init_circuitBreaker();
    if (!ENV.stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is required");
    }
    stripe = new Stripe(ENV.stripeSecretKey, {
      apiVersion: "2025-10-29.clover",
      timeout: 3e4,
      // 30 second timeout
      maxNetworkRetries: 2
      // Stripe's built-in retry
    });
  }
});

// backend/server/geminiVision.ts
var geminiVision_exports = {};
__export(geminiVision_exports, {
  analyzePortfolioImage: () => analyzePortfolioImage
});
import dns from "dns";
import { isIPv4, isIPv6 } from "net";
function sanitizeUrlForLogging(url) {
  try {
    const parsed2 = new URL(url);
    return `${parsed2.origin}${parsed2.pathname}`;
  } catch {
    return "[invalid-url]";
  }
}
function isPrivateOrReservedIp(ip) {
  const v4Mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (v4Mapped) return isPrivateOrReservedIp(v4Mapped[1]);
  if (isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    if (parts.some((p) => isNaN(p))) return true;
    const [a, b] = parts;
    if (ip === "0.0.0.0") return true;
    if (a === 127) return true;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  if (isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true;
    if (lower === "::") return true;
    if (/^f[cd]/i.test(lower)) return true;
    if (/^fe[89ab]/i.test(lower)) return true;
    if (lower.startsWith("::ffff:")) return true;
    return false;
  }
  return true;
}
async function analyzePortfolioImage(imageUrl) {
  if (!await isAiEnabled()) {
    logger.info("AI features gated (< 100 users). Skipping portfolio image analysis.");
    return DEFAULT_GATED_ANALYSIS;
  }
  try {
    let parsedUrl;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      logger.warn(
        `Invalid image URL for analysis: ${sanitizeUrlForLogging(imageUrl)}`
      );
      return DEFAULT_ANALYSIS;
    }
    if (parsedUrl.protocol !== "https:") {
      logger.warn(`Rejected non-HTTPS image URL: ${parsedUrl.protocol}`);
      return DEFAULT_ANALYSIS;
    }
    const hostname = parsedUrl.hostname.toLowerCase();
    try {
      const resolvedAddresses = await dns.promises.lookup(hostname, {
        all: true
      });
      for (const { address } of resolvedAddresses) {
        if (isPrivateOrReservedIp(address)) {
          logger.warn(
            `Rejected image URL resolving to private/reserved IP: ${hostname} \u2192 ${address}`
          );
          return DEFAULT_ANALYSIS;
        }
      }
    } catch {
      logger.warn(`DNS resolution failed for image URL hostname: ${hostname}`);
      return DEFAULT_ANALYSIS;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15e3);
    let response;
    try {
      response = await fetch(imageUrl, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
    if (!response.ok) {
      logger.warn(
        `Failed to fetch image for analysis: ${response.status} ${sanitizeUrlForLogging(imageUrl)}`
      );
      return DEFAULT_ANALYSIS;
    }
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const caption = await imageToTextWithHuggingFace(
      imageBuffer,
      contentType,
      "caption"
    );
    const parsed2 = await groqGenerateJson(
      ANALYSIS_PROMPT,
      `Image caption: "${caption.slice(0, 1200)}"
Content-Type: ${contentType}
ByteLength: ${imageBuffer.length}

Return the JSON object only.`,
      { maxTokens: 1200 }
    );
    const analysis = {
      styles: Array.isArray(parsed2.styles) ? parsed2.styles.slice(0, 4) : [],
      tags: Array.isArray(parsed2.tags) ? parsed2.tags.slice(0, 8) : [],
      description: typeof parsed2.description === "string" ? parsed2.description.slice(0, 500) : "",
      qualityScore: typeof parsed2.qualityScore === "number" ? Math.max(1, Math.min(100, Math.round(parsed2.qualityScore))) : 65,
      qualityIssues: Array.isArray(parsed2.qualityIssues) ? parsed2.qualityIssues : []
    };
    logger.info(
      `Portfolio image analyzed: ${analysis.styles.join(", ")} | quality=${analysis.qualityScore} | tags=${analysis.tags.length}`
    );
    return analysis;
  } catch (error) {
    logger.error("Hugging Face/Groq portfolio analysis failed:", error);
    return DEFAULT_ANALYSIS;
  }
}
var ANALYSIS_PROMPT, DEFAULT_ANALYSIS, DEFAULT_GATED_ANALYSIS;
var init_geminiVision = __esm({
  "backend/server/geminiVision.ts"() {
    "use strict";
    init_aiProviders();
    init_logger();
    init_db();
    ANALYSIS_PROMPT = `You are a tattoo industry expert and image analyst. You will receive an image caption and technical metadata produced by an upstream vision model. Infer likely tattoo attributes and return a JSON object with the following fields. Be precise and concise.

{
  "styles": string[],         // Detected tattoo styles. Pick from: "Traditional", "Neo-Traditional", "Realism", "Hyperrealism", "Watercolor", "Tribal", "Japanese", "Biomechanical", "Geometric", "Dotwork", "Pointillism", "Fine-line", "Minimalist", "Blackwork", "Trash Polka", "New School", "Old School", "Illustrative", "Surrealism", "Lettering", "Chicano", "Ornamental", "Abstract", "Sketch", "Portrait". Return 1-4 styles max.
  "tags": string[],           // Content/subject tags describing what is depicted. E.g. "floral", "rose", "skull", "dragon", "butterfly", "lion", "clock", "compass", "mandala", "snake", "eagle", "wolf", "heart", "dagger", "anchor", "phoenix", "eye", "tree", "mountain", "moon", "sun", "cross", "angel", "demon", "samurai", "koi fish", "octopus", "waves", "clouds", "fire", "sacred geometry". Return 2-8 tags.
  "description": string,      // A 1-2 sentence SEO-friendly description of the tattoo for search indexing. Mention the style and subject matter.
  "qualityScore": number,     // Image quality from 1-100. Consider: focus/sharpness, lighting, resolution clarity, composition, color accuracy. A well-lit, sharp, properly framed photo of a healed tattoo = 80-100. Slightly soft/uneven lighting = 50-79. Blurry, dark, or very low resolution = below 50.
  "qualityIssues": string[]   // List any issues: "blurry", "low-resolution", "poor-lighting", "overexposed", "underexposed", "out-of-focus", "excessive-glare", "watermark", "heavy-filter", "not-a-tattoo". Empty array if no issues.
}

IMPORTANT:
- Return ONLY the raw JSON object, no markdown code fences, no explanation.
 - If the caption suggests this is not a tattoo, include "not-a-tattoo" in qualityIssues and give qualityScore below 30.
- Be conservative with quality scores \u2014 most phone photos of tattoos score 60-85.`;
    DEFAULT_ANALYSIS = {
      styles: [],
      tags: [],
      description: "",
      qualityScore: 0,
      qualityIssues: ["analysis-failed"]
    };
    DEFAULT_GATED_ANALYSIS = {
      styles: [],
      tags: [],
      description: "Tattoo portfolio design",
      qualityScore: 90,
      qualityIssues: []
    };
  }
});

// backend/server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import { createRequire } from "module";
import path6 from "path";
import cors from "cors";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import helmet from "helmet";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// backend/server/_core/supabaseAuth.ts
init_supabase();

// backend/shared/const.ts
import { z as z2 } from "zod";

// backend/shared/clientConst.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// backend/shared/const.ts
var SubscriptionTiers = z2.enum([
  "artist_free",
  "artist_paygo",
  "artist_pro",
  "artist_elite",
  "client_free"
]);
var TIER_LIMITS = {
  // Free: strictly a directory listing.
  artist_free: { portfolioMax: Number.MAX_SAFE_INTEGER, aiCredits: 0, canBook: true },
  // Pay-as-you-go: booking unlocked, 15% fee, limited free bids.
  artist_paygo: { portfolioMax: 20, aiCredits: 0, canBook: true },
  // Pro: $49/mo, 5% fee, unlimited bids, 50 AI credits.
  artist_pro: {
    portfolioMax: Number.MAX_SAFE_INTEGER,
    aiCredits: 50,
    canBook: true
  },
  // Elite: $99/mo, 3% fee, unlimited bids, high AI allowance, sponsored listing.
  artist_elite: {
    portfolioMax: Number.MAX_SAFE_INTEGER,
    aiCredits: 999,
    canBook: true
  },
  // Clients are always on free tier; AI credits are purchased via microtransactions.
  client_free: { portfolioMax: 0, aiCredits: 0, canBook: true }
};

// backend/server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  const secure = isSecureRequest(req);
  return {
    httpOnly: true,
    path: "/",
    // P1-1 CSRF Fix: Use strict instead of none to prevent SameSite=none CSRF vulnerability
    // strict blocks cross-site cookies entirely, preventing CSRF attacks via <form> + <img>
    sameSite: "strict",
    secure
  };
}

// backend/server/_core/supabaseAuth.ts
init_db();
function registerSupabaseAuthRoutes(app2) {
  app2.post("/api/auth/session", async (req, res) => {
    try {
      const accessToken = req.body?.access_token ?? req.body?.accessToken;
      if (!accessToken) {
        res.status(400).json({ error: "access_token is required" });
        return;
      }
      const {
        data: { user },
        error
      } = await supabaseAdmin.auth.getUser(accessToken);
      if (error || !user) {
        console.error("[Auth] Invalid token:", error);
        res.status(401).json({ error: "Invalid token" });
        return;
      }
      await upsertUser({
        openId: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split("@")[0],
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, accessToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1e3
        // 7 days
      });
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split("@")[0]
        }
      });
    } catch (error) {
      console.error("[Auth] Session creation failed:", error);
      res.status(500).json({ error: "Failed to create session" });
    }
  });
  app2.post("/api/auth/signout", (req, res) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.json({ success: true });
  });
  app2.get("/api/auth/me", async (req, res) => {
    try {
      const token = req.cookies[COOKIE_NAME];
      if (!token) {
        res.status(401).json({ error: "Not authenticated" });
        return;
      }
      const {
        data: { user },
        error
      } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) {
        res.status(401).json({ error: "Invalid session" });
        return;
      }
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split("@")[0]
        }
      });
    } catch (error) {
      console.error("[Auth] Failed to get user:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });
}

// backend/server/_core/csrf.ts
init_logger();
import crypto from "crypto";
var CSRF_COOKIE_NAME = "__csrf_token";
var CSRF_HEADER_NAME = "x-csrf-token";
var TOKEN_LENGTH = 32;
function generateCsrfToken() {
  return crypto.randomBytes(TOKEN_LENGTH).toString("hex");
}
function getCsrfTokenFromRequest(req) {
  const headerToken = req.headers[CSRF_HEADER_NAME];
  if (headerToken) return headerToken;
  const bodyToken = req.body?._csrf;
  if (bodyToken) return bodyToken;
  return null;
}
function csrfProtectionMiddleware(req, res, next) {
  const isStateChanging = req.method === "POST" || req.method === "PUT" || req.method === "PATCH" || req.method === "DELETE";
  let tokenInCookie = req.cookies?.[CSRF_COOKIE_NAME];
  if (!tokenInCookie) {
    tokenInCookie = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, tokenInCookie, {
      httpOnly: true,
      secure: isSecureRequest(req),
      sameSite: "strict",
      // P1-1 fix: use strict instead of none
      path: "/",
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    });
  }
  if (isStateChanging) {
    const tokenInHeader = getCsrfTokenFromRequest(req);
    if (!tokenInHeader) {
      logger.warn("CSRF token missing from request", {
        method: req.method,
        path: req.path,
        ip: req.ip
      });
      return res.status(403).json({
        error: "CSRF_MISSING",
        message: "CSRF token required for this operation"
      });
    }
    if (tokenInHeader !== tokenInCookie) {
      logger.warn("CSRF token mismatch - possible attack", {
        method: req.method,
        path: req.path,
        ip: req.ip
      });
      return res.status(403).json({
        error: "CSRF_INVALID",
        message: "CSRF token invalid"
      });
    }
  }
  next();
}
function csrfTokenMiddleware(req, res, next) {
  const token = req.cookies?.[CSRF_COOKIE_NAME] || generateCsrfToken();
  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isSecureRequest(req),
      sameSite: "strict",
      path: "/",
      maxAge: 24 * 60 * 60 * 1e3
    });
  }
  res.setHeader("X-CSRF-Token", token);
  next();
}

// backend/shared/tierLimits.ts
function readRuntimeEnv(key) {
  if (typeof process !== "undefined" && process.env) {
    if (process.env[key] !== void 0) return process.env[key];
  }
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const viteKey = `VITE_${key}`;
    if (import.meta.env[viteKey] !== void 0) {
      return import.meta.env[viteKey];
    }
  }
  return null;
}
var ARTIST_TIER_LIMITS = {
  artist_free: {
    name: "Directory Profile",
    portfolioPhotos: 10,
    canBid: false,
    freeBidsPerMonth: 0,
    transactionFeePercent: 0,
    aiGenerationsPerMonth: 0,
    chatTokensPerMonth: 0,
    sponsoredListing: false,
    verifiedBadge: false
  },
  artist_paygo: {
    name: "Pay-as-you-go",
    portfolioPhotos: 10,
    canBid: true,
    freeBidsPerMonth: 3,
    transactionFeePercent: 10,
    aiGenerationsPerMonth: 0,
    chatTokensPerMonth: 0,
    sponsoredListing: false,
    verifiedBadge: false
  },
  artist_pro: {
    name: "Pro Studio",
    portfolioPhotos: Number.MAX_SAFE_INTEGER,
    canBid: true,
    freeBidsPerMonth: Number.MAX_SAFE_INTEGER,
    transactionFeePercent: 5,
    aiGenerationsPerMonth: 50,
    chatTokensPerMonth: 0,
    // Still must buy extra if client didn't pay
    sponsoredListing: false,
    verifiedBadge: true
  },
  artist_elite: {
    name: "Elite Icon",
    portfolioPhotos: Number.MAX_SAFE_INTEGER,
    canBid: true,
    freeBidsPerMonth: Number.MAX_SAFE_INTEGER,
    transactionFeePercent: 3,
    aiGenerationsPerMonth: Number.MAX_SAFE_INTEGER,
    chatTokensPerMonth: Number.MAX_SAFE_INTEGER,
    // Unlimited free chats
    sponsoredListing: true,
    verifiedBadge: true
    // "Elite Sponsored" badge applied via UI
  }
};
var ARTIST_TIER_PRICING = {
  artist_free: {
    monthly: 0,
    yearly: 0,
    stripePriceIdMonth: null,
    stripePriceIdYear: null
  },
  artist_paygo: {
    monthly: 0,
    yearly: 0,
    stripePriceIdMonth: null,
    stripePriceIdYear: null
  },
  artist_pro: {
    monthly: 4900,
    // $49.00/mo
    yearly: 49e3,
    // $490.00/yr (2 months free)
    stripePriceIdMonth: readRuntimeEnv("STRIPE_ARTIST_PRO_PRICE_ID_MONTH"),
    stripePriceIdYear: readRuntimeEnv("STRIPE_ARTIST_PRO_PRICE_ID_YEAR")
  },
  artist_elite: {
    monthly: 9900,
    // $99.00/mo
    yearly: 99e3,
    // $990.00/yr (2 months free)
    stripePriceIdMonth: readRuntimeEnv("STRIPE_ARTIST_ELITE_PRICE_ID_MONTH"),
    stripePriceIdYear: readRuntimeEnv("STRIPE_ARTIST_ELITE_PRICE_ID_YEAR")
  }
};
function getArtistTierLimits(tier) {
  return ARTIST_TIER_LIMITS[tier] || ARTIST_TIER_LIMITS.artist_free;
}
var CLIENT_TIER_LIMITS = {
  client_free: {
    name: "Collector",
    requestsPerMonth: Number.MAX_SAFE_INTEGER,
    aiGenerationsPerMonth: 0,
    directChatWithArtists: false,
    priorityRequestBoard: false,
    depositFeeWaived: false
  }
};

// backend/server/routers.ts
import { TRPCError as TRPCError6 } from "@trpc/server";
init_logger();

// backend/server/_core/trpc.ts
init_db();
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return opts.next({
    ctx: {
      ...ctx,
      // user is now guaranteed non-null
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var artistProcedure = protectedProcedure.use(
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    const artist = await getArtistByUserId(ctx.user.id);
    if (!artist && ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You must have an artist profile to perform this action"
      });
    }
    return next({ ctx: { ...ctx, artist } });
  })
);
var artistOwnerProcedure = artistProcedure.use(
  t.middleware(async ({ ctx, next, input }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (ctx.user.role === "admin") return next({ ctx });
    const artist = ctx.artist;
    const parsedInput = input;
    const targetArtistId = parsedInput?.artistId ?? parsedInput?.id;
    if (!artist || targetArtistId && artist.id !== targetArtistId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not authorized to manage this artist profile"
      });
    }
    return next({ ctx });
  })
);
var adminProcedure = protectedProcedure.use(
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({ ctx });
  })
);

// backend/server/_core/sanitize.ts
function sanitizeInput(input, maxLength) {
  let sanitized = input.trim().replace(/\0/g, "");
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }
  return sanitized;
}
function sanitizeEmail(email) {
  const sanitized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized) || sanitized.length > 320) {
    return null;
  }
  return sanitized;
}
function sanitizePhone(phone) {
  return phone.replace(/[^\d\s\-()+ ]/g, "").trim();
}

// backend/server/routers.ts
init_db();
import { z as z7 } from "zod";

// backend/server/email.ts
init_env();
init_circuitBreaker();
init_logger();
import { Resend } from "resend";
var resend = new Resend(ENV.resendApiKey);
var MAX_RETRIES = 3;
var INITIAL_RETRY_DELAY = 1e3;
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function sanitizeErrorForLogging(error) {
  if (!error) return error;
  const sanitized = { ...error };
  const sensitiveKeys = ["to", "from", "email", "recipient", "address"];
  for (const key of sensitiveKeys) {
    if (key in sanitized && typeof sanitized[key] === "string") {
      sanitized[key] = sanitized[key].replace(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        "[REDACTED]"
      );
    }
  }
  if (error.message) {
    sanitized.message = error.message.replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      "[REDACTED]"
    );
  }
  return sanitized;
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function sendEmail(options) {
  const {
    to,
    subject,
    html,
    from = "Ink Connect <noreply@inkedconnect.com>"
  } = options;
  return emailCircuit.execute(async () => {
    let lastError = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { data, error } = await resend.emails.send({
          from,
          to: Array.isArray(to) ? to : [to],
          subject,
          html
        });
        if (error) {
          throw new Error(`Resend API error: ${error.message}`);
        }
        logger.info("Email sent successfully", { id: data?.id, attempt });
        return { success: true, id: data?.id };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMessage = lastError.message.toLowerCase();
        if (errorMessage.includes("invalid") || errorMessage.includes("unauthorized") || errorMessage.includes("forbidden")) {
          logger.error(
            "Email send failed (non-retryable)",
            sanitizeErrorForLogging({ error: lastError.message })
          );
          throw lastError;
        }
        if (attempt < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
          logger.warn(`Email send failed, retrying in ${delay}ms`, {
            attempt,
            maxRetries: MAX_RETRIES,
            error: sanitizeErrorForLogging({ message: lastError.message })
          });
          await sleep(delay);
        }
      }
    }
    logger.error(
      "Email send failed after all retries",
      sanitizeErrorForLogging({ error: lastError?.message })
    );
    throw lastError;
  });
}
async function sendArtistInvitation(to, shopName, inviteCode) {
  const escapedShopName = escapeHtml(shopName);
  const baseUrl = ENV.publicBaseUrl || "https://inkedconnect.com";
  const inviteQuery = inviteCode ? `?invite=${encodeURIComponent(inviteCode)}` : "";
  const inviteUrl = `${baseUrl}/for-artists${inviteQuery}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #10b981 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; }
    .content h2 { color: #8b5cf6; margin-top: 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #10b981); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .features { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .features ul { margin: 10px 0; padding-left: 20px; }
    .features li { margin: 8px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>\u{1F3A8} You're Invited to Join Ink Connect</h1>
    </div>
    
    <div class="content">
      <h2>Hello ${escapedShopName}!</h2>
      
      <p>We're excited to invite you to join <strong>Ink Connect</strong>, the premier platform connecting tattoo artists and shops with clients looking for their perfect artist.</p>
      
      <p>We've noticed your excellent work and reputation in the tattoo community, and we'd love to have you as part of our growing network.</p>
      
      <div class="features">
        <h3>\u2728 What You Get with a FREE Basic Listing:</h3>
        <ul>
          <li>\u{1F4F8} Showcase up to 3 portfolio photos</li>
          <li>\u2B50 Display your shop information and location</li>
          <li>\u{1F4AC} Receive and display customer reviews</li>
          <li>\u{1F50D} Appear in artist search results</li>
          <li>\u{1F4F1} Mobile-optimized profile page</li>
        </ul>
        
        <h3>\u{1F680} Upgrade to Premium ($49/month) for:</h3>
        <ul>
          <li>\u{1F4C5} Real-time booking system with calendar sync</li>
          <li>\u{1F4DE} Display direct contact information</li>
          <li>\u{1F5BC}\uFE0F Unlimited portfolio photos & videos</li>
          <li>\u2B50 Featured artist placement & higher search ranking</li>
          <li>\u{1F4AC} Respond to customer reviews</li>
          <li>\u{1F4CA} Access to analytics and lead reports</li>
        </ul>
      </div>
      
      <p style="text-align: center;">
        <a href="${inviteUrl}" class="cta-button">
          Create Your FREE Profile Now \u2192
        </a>
      </p>
      
      <p>Join hundreds of tattoo artists and shops who are already growing their business with Ink Connect. It takes less than 5 minutes to get started!</p>
      
      <p>Questions? Just reply to this email and we'll be happy to help.</p>
      
      <p>Best regards,<br>
      <strong>The Ink Connect Team</strong></p>
    </div>
    
    <div class="footer">
      <p>Ink Connect &mdash; Find Tattoo Artists &amp; Shops Near You</p>
      <p>This is a one-time invitation. You can unsubscribe by replying to this email.</p>
    </div>
  </div>
 </body>
</html>
  `;
  return sendEmail({
    to,
    subject: `${shopName} - You're Invited to Join Ink Connect! \u{1F3A8}`,
    html
  });
}
async function sendBookingIntakeNotification(to, details) {
  const {
    artistName,
    clientName,
    clientEmail,
    clientPhone,
    tattooDescription,
    preferredDate,
    placement,
    size,
    budget = "N/A",
    additionalNotes = "N/A"
  } = details;
  const escapedArtistName = escapeHtml(artistName);
  const escapedClientName = escapeHtml(clientName);
  const escapedClientEmail = escapeHtml(clientEmail);
  const escapedClientPhone = escapeHtml(clientPhone);
  const escapedTattooDescription = escapeHtml(tattooDescription);
  const escapedPreferredDate = escapeHtml(preferredDate);
  const escapedPlacement = escapeHtml(placement);
  const escapedSize = escapeHtml(size);
  const escapedBudget = escapeHtml(budget);
  const escapedAdditionalNotes = escapeHtml(additionalNotes);
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366f1, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .booking-details { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #f3f4f6; }
    .booking-details h3 { margin-top: 0; color: #1e1b4b; border-bottom: 2px solid #e0e7ff; padding-bottom: 8px; }
    .booking-details p { margin: 12px 0; }
    .brand-stamp { text-align: center; font-size: 13px; color: #6366f1; font-weight: bold; margin-top: 25px; text-transform: uppercase; letter-spacing: 1px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>\u{1F4C5} New Booking Request!</h2>
      <p style="margin: 0; font-size: 15px; opacity: 0.9;">via The Inked Network</p>
    </div>
    <div class="content">
      <p>Hi ${escapedArtistName},</p>
      
      <p>Great news! You have received a new booking inquiry. We've captured the client details for you below:</p>
      
      <div class="booking-details">
        <h3>Client & Tattoo Details:</h3>
        <p><strong>Client Name:</strong> ${escapedClientName}</p>
        <p><strong>Client Email:</strong> <a href="mailto:${escapedClientEmail}">${escapedClientEmail}</a></p>
        <p><strong>Client Phone:</strong> <a href="tel:${escapedClientPhone}">${escapedClientPhone}</a></p>
        <p><strong>Preferred Date & Time:</strong> ${escapedPreferredDate}</p>
        <p><strong>Tattoo Concept:</strong> ${escapedTattooDescription}</p>
        <p><strong>Placement:</strong> ${escapedPlacement}</p>
        <p><strong>Size:</strong> ${escapedSize}</p>
        <p><strong>Budget:</strong> ${escapedBudget}</p>
        <p><strong>Additional Notes:</strong> ${escapedAdditionalNotes}</p>
      </div>

      <p>Please reach out to the client directly via email or phone to confirm the appointment, finalize the design, and set up deposits/calendar bookings as needed.</p>

      <div class="brand-stamp">
        \u26A1 Lead Sent via The Inked Network
      </div>

      <p style="margin-top: 30px; font-size: 13px; text-align: center; color: #9ca3af;">
        Thank you for being a valued member of our platform!
      </p>
    </div>
    <div class="footer">
      <p>The Inked Network &mdash; Helping Tattoo Artists Grow Their Studios</p>
    </div>
  </div>
</body>
</html>
  `;
  return sendEmail({
    to,
    subject: `New booking request from ${clientName} via The Inked Network`,
    html
  });
}
async function sendFreeTierPerformanceInsights(to, details) {
  const { artistName, viewsCount, inquiryReceived } = details;
  const escapedArtistName = escapeHtml(artistName);
  let messageBody = "";
  if (inquiryReceived) {
    messageBody = `You just received a new client inquiry! However, because you are on our Free tier, you can't view detailed client information or respond to them immediately.`;
  } else if (viewsCount) {
    messageBody = `Your profile was viewed ${viewsCount} times recently! Serious clients are looking at your work, but they can't easily contact you on the Free tier.`;
  } else {
    messageBody = `Serious clients are checking out your profile and looking at your work.`;
  }
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981, #06b6d4); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .cta-box { background: #f0fdf4; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #bbf7d0; text-align: center; }
    .cta-button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 15px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>\u{1F4C8} Grow Your Tattoo Studio!</h2>
      <p style="margin: 0; font-size: 15px; opacity: 0.9;">Ink Connect Performance Insights</p>
    </div>
    <div class="content">
      <p>Hi ${escapedArtistName},</p>
      
      <p>${messageBody}</p>
      
      <div class="cta-box">
        <h3>Unlock Your Studio's Full Potential</h3>
        <p style="margin: 5px 0 15px 0;">Upgrade to <strong>Pro Studio</strong> to get unlimited portfolio photos, a verified artist badge, and the ability to view details and respond to client inquiries instantly.</p>
        <a href="https://inkedconnect.com/artist/billing" class="cta-button">Upgrade to Pro Studio</a>
      </div>

      <p>If you have any questions, feel free to reply to this email.</p>
      
      <p>Best regards,<br>
      <strong>Ink Connect Team</strong></p>
    </div>
    <div class="footer">
      <p>Ink Connect &mdash; Your Tattoo Journey Starts Here</p>
    </div>
  </div>
</body>
</html>
  `;
  return sendEmail({
    to,
    subject: `\u{1F4C8} Performance Insights: Grow your tattoo studio on Ink Connect`,
    html
  });
}

// backend/server/routers.ts
init_supabaseStorage();

// backend/server/clientRouters.ts
import { z as z3 } from "zod";
init_db();
init_schema();
init_supabaseStorage();
init_logger();
import { eq as eq2, and as and2, desc as desc2, sql as sql2 } from "drizzle-orm";
import { TRPCError as TRPCError2 } from "@trpc/server";
import path from "path";

// backend/server/geminiBidOptimizer.ts
init_aiProviders();
init_logger();
var REFINER_PROMPT = `You are a tattoo consultation expert helping clients create better tattoo requests. Analyze the client's request and assess if the description provides enough detail for an artist to give an accurate bid.

A COMPLETE request should ideally include: specific subject matter, style preference, size indication, color preference, placement specifics, and any meaningful visual details.

Return ONLY a raw JSON object (no markdown fences, no explanation) with these fields:

{
  "isComplete": boolean,          // true if the description is detailed enough for artists to bid confidently
  "completenessScore": number,    // 1-10 score of how complete the description is
  "missingAspects": string[],     // Aspects that are missing or too vague. Pick from: "style", "subject_detail", "size", "color_preference", "placement_specifics", "visual_references", "mood_or_theme", "elements_to_include", "elements_to_avoid", "background_or_filler"
  "suggestedQuestions": string[],  // 1-5 specific follow-up questions the client should answer. Make these conversational and helpful, NOT generic. Tailor them to what the client has already described. E.g. if they said "I want a sleeve" ask about the theme, not about placement.
  "improvedDescription": string | null,  // If the description is quite vague (score < 5), suggest an improved version that keeps the client's intent but adds helpful placeholders. null if score >= 5.
  "tip": string                   // A short, friendly tip about what makes a great tattoo request (1 sentence max)
}

IMPORTANT:
- If the request is already detailed (score 7+), keep suggestedQuestions to 1-2 minor refinements.
- For very vague requests (score < 4), give 3-5 questions.
- Questions should be specific to their tattoo idea, not generic templates.
- If they mentioned a style already, don't ask about style. If they mentioned placement, don't ask about placement.
- Be encouraging, not critical. Frame suggestions as "to help artists give you the best possible bid..."
- Return ONLY the raw JSON object.`;
async function refineRequestPrompt(description, context) {
  try {
    const contextParts = [];
    if (context?.title) contextParts.push(`Title: "${context.title}"`);
    if (context?.style) contextParts.push(`Style: ${context.style}`);
    if (context?.placement)
      contextParts.push(`Placement: ${context.placement}`);
    if (context?.size) contextParts.push(`Size: ${context.size}`);
    if (context?.colorPreference)
      contextParts.push(`Color: ${context.colorPreference}`);
    const contextStr = contextParts.length > 0 ? `

The client has also filled in these form fields:
${contextParts.join("\n")}` : "";
    const parsed2 = await groqGenerateJson(
      REFINER_PROMPT,
      `Client's description: "${description}"${contextStr}`,
      { maxTokens: 1200 }
    );
    const analysis = {
      isComplete: typeof parsed2.isComplete === "boolean" ? parsed2.isComplete : false,
      completenessScore: typeof parsed2.completenessScore === "number" ? Math.max(1, Math.min(10, Math.round(parsed2.completenessScore))) : 5,
      missingAspects: Array.isArray(parsed2.missingAspects) ? parsed2.missingAspects.slice(0, 10) : [],
      suggestedQuestions: Array.isArray(parsed2.suggestedQuestions) ? parsed2.suggestedQuestions.slice(0, 5) : [],
      improvedDescription: typeof parsed2.improvedDescription === "string" ? parsed2.improvedDescription.slice(0, 2e3) : null,
      tip: typeof parsed2.tip === "string" ? parsed2.tip.slice(0, 200) : ""
    };
    logger.info(
      `Prompt refiner: score=${analysis.completenessScore}/10, questions=${analysis.suggestedQuestions.length}, complete=${analysis.isComplete}`
    );
    return analysis;
  } catch (error) {
    logger.error("Groq prompt refiner failed:", error);
    return {
      isComplete: true,
      // Don't block submission on AI failure
      completenessScore: 5,
      missingAspects: [],
      suggestedQuestions: [],
      improvedDescription: null,
      tip: "Add as much detail as possible to help artists give you an accurate bid."
    };
  }
}
var BID_ASSISTANT_PROMPT = `You are a professional tattoo artist's assistant. Draft a bid response for a tattoo request based on the artist's profile and the client's request details.

The bid should be professional, personable, and confident. Match the tone to a real tattoo artist \u2014 friendly but experienced. Include:
1. A brief acknowledgment of what the client wants
2. Why this artist is a good fit (reference their styles/experience)
3. A price rationale (not just a number \u2014 explain what's included)
4. Availability/timeline info
5. An invitation to discuss further

Return ONLY a raw JSON object (no markdown fences, no explanation) with these fields:

{
  "message": string,              // The drafted bid message (150-400 words). Professional, warm, specific to this request. DO NOT use emojis.
  "suggestedPrice": number,       // Suggested price in whole dollars based on the request details and market rates. Consider: size, complexity, style, placement, color vs B&W.
  "suggestedHours": number,       // Estimated hours for the session(s)
  "pricingRationale": string,     // Brief internal note explaining the price reasoning (for the artist to review, not sent to client)
  "toneNotes": string             // Brief note about the tone/approach used so the artist can adjust
}

PRICING GUIDELINES (USD):
- Tiny (< 2in): $50-150
- Small (2-4in): $100-300
- Medium (4-6in): $200-500
- Large (6-10in): $400-1000
- Extra Large (10+in): $800-2000+
- Half Sleeve: $1000-3000
- Full Sleeve: $2000-5000+
- Back Piece: $3000-8000+
- Realism/Hyperrealism: +30-50% premium
- Color vs B&W: Color typically +20-30%
- Complex detail (geometric, dotwork): +20%

IMPORTANT:
- Personalize to the artist's actual specialties and style
- If the request falls within the artist's styles, emphasize that
- Always be honest \u2014 if the request is outside the artist's listed styles, mention versatility but be transparent
- Stay within the client's stated budget if provided
- Return ONLY the raw JSON object.`;
async function draftBidResponse(request, artist) {
  try {
    const sanitizeForPrompt = (s, maxLen = 500) => s.replace(/[\r\n]+/g, " ").replace(/[^\x20-\x7E]/g, "").slice(0, maxLen).trim();
    const requestContext = [
      `Title: "${sanitizeForPrompt(request.title)}"`,
      `Description: "${sanitizeForPrompt(request.description, 1e3)}"`,
      request.style ? `Style: ${sanitizeForPrompt(request.style)}` : null,
      `Placement: ${sanitizeForPrompt(request.placement)}`,
      `Size: ${sanitizeForPrompt(request.size)}`,
      request.colorPreference ? `Color Preference: ${sanitizeForPrompt(request.colorPreference).replace(/_/g, " & ")}` : null,
      request.budgetMin || request.budgetMax ? `Budget: ${request.budgetMin ? `$${(request.budgetMin / 100).toFixed(0)}` : "?"} - ${request.budgetMax ? `$${(request.budgetMax / 100).toFixed(0)}` : "?"}` : null,
      request.desiredTimeframe ? `Timeframe: ${sanitizeForPrompt(request.desiredTimeframe)}` : null
    ].filter(Boolean).join("\n");
    const artistContext = [
      `Shop/Artist Name: ${sanitizeForPrompt(artist.shopName)}`,
      artist.styles ? `Specializes in: ${sanitizeForPrompt(artist.styles)}` : null,
      artist.specialties ? `Known for: ${sanitizeForPrompt(artist.specialties)}` : null,
      artist.experience ? `${artist.experience} years of experience` : null,
      artist.city && artist.state ? `Based in ${sanitizeForPrompt(artist.city)}, ${sanitizeForPrompt(artist.state)}` : null,
      artist.bio ? `Bio: ${sanitizeForPrompt(artist.bio)}` : null
    ].filter(Boolean).join("\n");
    const parsed2 = await groqGenerateJson(
      BID_ASSISTANT_PROMPT,
      `CLIENT'S REQUEST:
${requestContext}

ARTIST PROFILE:
${artistContext}`,
      { maxTokens: 1600 }
    );
    const draft = {
      message: typeof parsed2.message === "string" ? parsed2.message.slice(0, 2e3) : "",
      suggestedPrice: typeof parsed2.suggestedPrice === "number" ? Math.max(50, Math.round(parsed2.suggestedPrice)) : 200,
      suggestedHours: typeof parsed2.suggestedHours === "number" ? Math.max(1, Math.round(parsed2.suggestedHours)) : 2,
      pricingRationale: typeof parsed2.pricingRationale === "string" ? parsed2.pricingRationale.slice(0, 500) : "",
      toneNotes: typeof parsed2.toneNotes === "string" ? parsed2.toneNotes.slice(0, 300) : ""
    };
    logger.info(
      `Bid assistant draft: $${draft.suggestedPrice}, ${draft.suggestedHours}hrs for "${request.title}"`
    );
    return draft;
  } catch (error) {
    logger.error("Groq bid assistant failed:", error);
    return {
      message: "",
      suggestedPrice: 50,
      suggestedHours: 1,
      pricingRationale: "AI draft generation failed \u2014 please write your bid manually.",
      toneNotes: ""
    };
  }
}

// backend/server/clientRouters.ts
init_stripe();
init_env();

// backend/shared/tierCompat.ts
var AI_BID_ASSISTANT_TIERS = [
  "artist_paygo",
  "artist_pro",
  "artist_elite",
  "amateur",
  "frontPage",
  "professional"
];
function hasTierValue(tier, allowed) {
  return !!tier && allowed.includes(tier);
}
function canUseAiBidAssistant(tier) {
  return hasTierValue(tier, AI_BID_ASSISTANT_TIERS);
}

// backend/server/clientRouters.ts
init_onboarding();

// backend/shared/requestAddons.ts
var REQUEST_ADDON_PRICING = {
  priorityPlacementCents: 499,
  preBookingChatCents: 999,
  aiPriceEstimateCents: 299,
  incognitoModeCents: 299,
  conceptArtistCents: 499,
  perfectMatchRouterCents: 399,
  painAnalysisCents: 99,
  vipBundleCents: 1999
  // Discounted bundle of all
};
var REQUEST_ADDON_PAYMENT_STATUSES = {
  NOT_REQUESTED: "not_requested",
  CHECKOUT_PENDING: "checkout_pending",
  PAID: "paid",
  FAILED: "failed"
};
function calculateRequestAddonTotalCents(selection) {
  if (selection.vipBundle) {
    return REQUEST_ADDON_PRICING.vipBundleCents;
  }
  let total = 0;
  if (selection.priorityPlacement) total += REQUEST_ADDON_PRICING.priorityPlacementCents;
  if (selection.preBookingChat) total += REQUEST_ADDON_PRICING.preBookingChatCents;
  if (selection.aiPriceEstimate) total += REQUEST_ADDON_PRICING.aiPriceEstimateCents;
  if (selection.incognitoMode) total += REQUEST_ADDON_PRICING.incognitoModeCents;
  if (selection.conceptArtist) total += REQUEST_ADDON_PRICING.conceptArtistCents;
  if (selection.perfectMatchRouter) total += REQUEST_ADDON_PRICING.perfectMatchRouterCents;
  if (selection.painAnalysis) total += REQUEST_ADDON_PRICING.painAnalysisCents;
  return total;
}

// backend/server/clientRouters.ts
function sanitizeFileName(fileName, maxLength = 100) {
  let sanitized = path.basename(fileName);
  sanitized = sanitized.replace(/[\\\0]/g, "");
  sanitized = sanitized.replace(/\.\./g, "");
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");
  sanitized = sanitized.replace(/_+/g, "_");
  sanitized = sanitized.substring(0, maxLength);
  if (!sanitized || sanitized === "." || sanitized === "..") {
    sanitized = `upload_${Date.now()}`;
  }
  return sanitized;
}
async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError2({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database connection not available"
    });
  }
  return db;
}
var clientsRouter = router({
  // Get current user's client profile
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const [client] = await db.select().from(clients).where(eq2(clients.userId, ctx.user.id)).limit(1);
    return client || null;
  }),
  // Create client profile (onboarding)
  createProfile: protectedProcedure.input(
    z3.object({
      displayName: z3.string().min(2).max(255),
      bio: z3.string().max(1e3).optional(),
      preferredStyles: z3.string().optional(),
      city: z3.string().max(100).optional(),
      state: z3.string().max(50).optional(),
      phone: z3.string().max(50).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const existing = await db.select().from(clients).where(eq2(clients.userId, ctx.user.id)).limit(1);
    if (existing.length > 0) {
      throw new TRPCError2({
        code: "CONFLICT",
        message: "Client profile already exists"
      });
    }
    const newClient = await db.transaction(async (tx) => {
      await tx.update(users).set(buildClientOnboardingUserUpdate()).where(eq2(users.id, ctx.user.id));
      const [created] = await tx.insert(clients).values({
        userId: ctx.user.id,
        ...input,
        displayName: sanitizeInput(input.displayName, 255),
        bio: input.bio ? sanitizeInput(input.bio, 1e3) : void 0,
        preferredStyles: input.preferredStyles ? sanitizeInput(input.preferredStyles, 500) : void 0,
        onboardingCompleted: true
      }).returning();
      return created;
    });
    return newClient;
  }),
  // Update client profile
  updateProfile: protectedProcedure.input(
    z3.object({
      displayName: z3.string().min(2).max(255).optional(),
      bio: z3.string().max(1e3).optional(),
      preferredStyles: z3.string().optional(),
      city: z3.string().max(100).optional(),
      state: z3.string().max(50).optional(),
      phone: z3.string().max(50).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [updated] = await db.update(clients).set({
      ...input,
      displayName: input.displayName ? sanitizeInput(input.displayName, 255) : void 0,
      bio: input.bio ? sanitizeInput(input.bio, 1e3) : void 0,
      preferredStyles: input.preferredStyles ? sanitizeInput(input.preferredStyles, 500) : void 0,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq2(clients.userId, ctx.user.id)).returning();
    if (!updated) {
      throw new TRPCError2({
        code: "NOT_FOUND",
        message: "Client profile not found"
      });
    }
    return updated;
  })
});
function maskContactInfo(request, client, userClientId, isAdmin) {
  const isOwner = userClientId !== null && request.clientId === userClientId;
  const shouldMask = !isOwner && !isAdmin;
  return {
    ...request,
    guestEmail: shouldMask ? "[Masked - Use platform chat]" : request.guestEmail,
    client: client ? {
      ...client,
      phone: shouldMask ? "[Masked - Use platform chat]" : client.phone
    } : null
  };
}
var requestsRouter = router({
  // Get all open requests (for artists to browse)
  getOpen: publicProcedure.input(
    z3.object({
      style: z3.string().optional(),
      city: z3.string().optional(),
      state: z3.string().optional(),
      limit: z3.number().min(1).max(50).default(20),
      offset: z3.number().min(0).default(0)
    }).optional()
  ).query(async ({ ctx, input }) => {
    const db = await requireDb();
    const filters = input || { limit: 20, offset: 0 };
    let userClientId = null;
    let isAdmin = false;
    let isArtist = false;
    if (ctx?.user) {
      isAdmin = ctx.user.role === "admin";
      const [client] = await db.select().from(clients).where(eq2(clients.userId, ctx.user.id)).limit(1);
      if (client) {
        userClientId = client.id;
      }
      const [artist] = await db.select().from(artists).where(eq2(artists.userId, ctx.user.id)).limit(1);
      isArtist = !!artist;
    }
    const whereConditions = [eq2(tattooRequests.status, "open")];
    if (filters?.style) {
      whereConditions.push(
        sql2`${tattooRequests.style} ILIKE ${"%" + filters.style + "%"}`
      );
    }
    if (filters?.city) {
      whereConditions.push(
        eq2(clients.city, filters.city)
      );
    }
    if (filters?.state) {
      whereConditions.push(
        eq2(clients.state, filters.state)
      );
    }
    const results = await db.select({
      request: tattooRequests,
      client: clients,
      images: sql2`(
            SELECT json_agg(json_build_object('id', ri.id, 'imageUrl', ri."imageUrl", 'isMainImage', ri."isMainImage"))
            FROM "requestImages" ri
            WHERE ri."requestId" = "tattooRequests".id
          )`.as("images"),
      bidCount: sql2`(
            SELECT COUNT(*) FROM bids WHERE bids."requestId" = "tattooRequests".id
          )`.as("bidCount")
    }).from(tattooRequests).leftJoin(clients, eq2(tattooRequests.clientId, clients.id)).where(and2(...whereConditions)).orderBy(
      desc2(
        sql2`CASE WHEN "tattooRequests"."selectedAddons" @> '"priorityPlacement"'::jsonb AND "tattooRequests"."addOnPaymentStatus" = 'paid' THEN 1 ELSE 0 END`
      ),
      desc2(tattooRequests.createdAt)
    ).limit(filters.limit ?? 20).offset(filters.offset ?? 0);
    return results.map((r) => {
      const requestData = {
        ...r.request,
        images: r.images ? JSON.parse(r.images) : [],
        bidCount: Number(r.bidCount)
      };
      return maskContactInfo(requestData, r.client, userClientId, isAdmin);
    });
  }),
  // Get open requests for paid artists' dashboard
  listForArtistDashboard: protectedProcedure.input(
    z3.object({
      style: z3.string().optional(),
      city: z3.string().optional(),
      state: z3.string().optional(),
      limit: z3.number().min(1).max(50).default(20),
      offset: z3.number().min(0).default(0)
    }).optional()
  ).query(async ({ ctx, input }) => {
    const db = await requireDb();
    const [artist] = await db.select({ id: artists.id }).from(artists).where(eq2(artists.userId, ctx.user.id)).limit(1);
    const canonicalTierForDashboard = ctx.user.subscriptionTier ?? "artist_free";
    if (!artist || canonicalTierForDashboard === "artist_free") {
      throw new TRPCError2({
        code: "FORBIDDEN",
        message: "This feature is only available for paid artist plans."
      });
    }
    const filters = input || { limit: 20, offset: 0 };
    const whereConditions = [eq2(tattooRequests.status, "open")];
    if (filters?.style) {
      whereConditions.push(
        sql2`${tattooRequests.style} ILIKE ${"%" + filters.style + "%"}`
      );
    }
    if (filters?.city) {
      whereConditions.push(
        eq2(clients.city, filters.city)
      );
    }
    if (filters?.state) {
      whereConditions.push(
        eq2(clients.state, filters.state)
      );
    }
    const results = await db.select({
      request: tattooRequests,
      client: clients,
      images: sql2`(
            SELECT json_agg(json_build_object('id', ri.id, 'imageUrl', ri."imageUrl", 'isMainImage', ri."isMainImage"))
            FROM "requestImages" ri
            WHERE ri."requestId" = "tattooRequests".id
          )`.as("images"),
      bidCount: sql2`(
            SELECT COUNT(*) FROM bids WHERE bids."requestId" = "tattooRequests".id
          )`.as("bidCount")
    }).from(tattooRequests).leftJoin(clients, eq2(tattooRequests.clientId, clients.id)).where(and2(...whereConditions)).orderBy(
      desc2(
        sql2`CASE WHEN "tattooRequests"."selectedAddons" @> '"priorityPlacement"'::jsonb AND "tattooRequests"."addOnPaymentStatus" = 'paid' THEN 1 ELSE 0 END`
      ),
      desc2(tattooRequests.createdAt)
    ).limit(filters.limit ?? 20).offset(filters.offset ?? 0);
    return results.map((r) => ({
      ...r.request,
      client: r.client,
      images: r.images ? JSON.parse(r.images) : [],
      bidCount: Number(r.bidCount)
    }));
  }),
  // Get recent open requests for the homepage feed
  listForHomepage: publicProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    let userClientId = null;
    let isAdmin = false;
    if (ctx?.user) {
      isAdmin = ctx.user.role === "admin";
      const [client] = await db.select().from(clients).where(eq2(clients.userId, ctx.user.id)).limit(1);
      if (client) {
        userClientId = client.id;
      }
    }
    const results = await db.select({
      request: tattooRequests,
      client: clients,
      images: sql2`(
            SELECT json_agg(json_build_object('id', ri.id, 'imageUrl', ri."imageUrl", 'isMainImage', ri."isMainImage"))
            FROM "requestImages" ri
            WHERE ri."requestId" = "tattooRequests".id
          )`.as("images"),
      bidCount: sql2`(
            SELECT COUNT(*) FROM bids WHERE bids."requestId" = "tattooRequests".id
          )`.as("bidCount")
    }).from(tattooRequests).leftJoin(clients, eq2(tattooRequests.clientId, clients.id)).where(eq2(tattooRequests.status, "open")).orderBy(
      desc2(
        sql2`CASE WHEN "tattooRequests"."selectedAddons" @> '"priorityPlacement"'::jsonb AND "tattooRequests"."addOnPaymentStatus" = 'paid' THEN 1 ELSE 0 END`
      ),
      desc2(tattooRequests.createdAt)
    ).limit(8);
    return results.map((r) => {
      const requestData = {
        ...r.request,
        images: r.images ? JSON.parse(r.images) : [],
        bidCount: Number(r.bidCount)
      };
      return maskContactInfo(requestData, r.client, userClientId, isAdmin);
    });
  }),
  // Get request by ID
  getById: publicProcedure.input(z3.object({ id: z3.number() })).query(async ({ ctx, input }) => {
    const db = await requireDb();
    const [result] = await db.select({
      request: tattooRequests,
      client: clients
    }).from(tattooRequests).leftJoin(clients, eq2(tattooRequests.clientId, clients.id)).where(eq2(tattooRequests.id, input.id)).limit(1);
    if (!result) {
      throw new TRPCError2({
        code: "NOT_FOUND",
        message: "Request not found"
      });
    }
    const images = await db.select().from(requestImages).where(eq2(requestImages.requestId, input.id));
    const requestBids = await db.select({
      bid: bids,
      artist: artists
    }).from(bids).innerJoin(artists, eq2(bids.artistId, artists.id)).where(eq2(bids.requestId, input.id)).orderBy(desc2(bids.createdAt));
    await db.update(tattooRequests).set({ viewCount: sql2`${tattooRequests.viewCount} + 1` }).where(eq2(tattooRequests.id, input.id));
    let userClientId = null;
    let isAdmin = false;
    if (ctx?.user) {
      isAdmin = ctx.user.role === "admin";
      const [client] = await db.select().from(clients).where(eq2(clients.userId, ctx.user.id)).limit(1);
      if (client) {
        userClientId = client.id;
      }
    }
    const requestData = {
      ...result.request,
      images,
      bids: requestBids.map((b) => ({
        ...b.bid,
        artist: b.artist
      }))
    };
    return maskContactInfo(requestData, result.client, userClientId, isAdmin);
  }),
  // Get my requests (for clients)
  getMyRequests: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const [client] = await db.select().from(clients).where(eq2(clients.userId, ctx.user.id)).limit(1);
    if (!client) {
      return [];
    }
    const results = await db.select({
      request: tattooRequests,
      bidCount: sql2`(
          SELECT COUNT(*) FROM bids WHERE bids."requestId" = "tattooRequests".id
        )`.as("bidCount")
    }).from(tattooRequests).where(eq2(tattooRequests.clientId, client.id)).orderBy(desc2(tattooRequests.createdAt));
    return results.map((r) => ({
      ...r.request,
      bidCount: Number(r.bidCount)
    }));
  }),
  // Create a new tattoo request — open to everyone, including guests without an account
  create: publicProcedure.input(
    z3.object({
      title: z3.string().min(5).max(255),
      description: z3.string().min(20).max(5e3),
      style: z3.string().max(100).optional(),
      placement: z3.string().max(100),
      size: z3.string().max(50),
      colorPreference: z3.enum(["color", "black_and_grey", "either"]).optional(),
      budgetMin: z3.number().min(0).optional(),
      budgetMax: z3.number().min(0).optional(),
      preferredCity: z3.string().max(100).optional(),
      preferredState: z3.string().max(50).optional(),
      willingToTravel: z3.boolean().default(false),
      desiredTimeframe: z3.string().max(100).optional(),
      addOns: z3.object({
        priorityPlacement: z3.boolean().default(false),
        preBookingChat: z3.boolean().default(false),
        aiPriceEstimate: z3.boolean().default(false),
        incognitoMode: z3.boolean().default(false),
        conceptArtist: z3.boolean().default(false),
        perfectMatchRouter: z3.boolean().default(false),
        painAnalysis: z3.boolean().default(false),
        vipBundle: z3.boolean().default(false)
      }).optional(),
      guestEmail: z3.string().email().max(255).optional()
      // guests can optionally leave contact info
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const { guestEmail, addOns, ...requestInput } = input;
    const normalizedAddOns = {
      priorityPlacement: addOns?.priorityPlacement ?? false,
      preBookingChat: addOns?.preBookingChat ?? false,
      aiPriceEstimate: addOns?.aiPriceEstimate ?? false,
      incognitoMode: addOns?.incognitoMode ?? false,
      conceptArtist: addOns?.conceptArtist ?? false,
      perfectMatchRouter: addOns?.perfectMatchRouter ?? false,
      painAnalysis: addOns?.painAnalysis ?? false,
      vipBundle: addOns?.vipBundle ?? false
    };
    const addOnTotalCents = calculateRequestAddonTotalCents(normalizedAddOns);
    let clientId = null;
    let userEmail = "";
    if (ctx.user) {
      const [client] = await db.select({ id: clients.id }).from(clients).where(eq2(clients.userId, ctx.user.id)).limit(1);
      if (client) clientId = client.id;
      const [userRow] = await db.select({ email: users.email }).from(users).where(eq2(users.id, ctx.user.id)).limit(1);
      userEmail = userRow?.email ?? "";
    }
    const addOnArray = Object.entries(normalizedAddOns).filter(([_, value]) => value).map(([key]) => key);
    const [newRequest] = await db.insert(tattooRequests).values({
      clientId,
      guestEmail: clientId ? null : guestEmail ?? null,
      selectedAddons: addOnArray,
      addOnTotalCents,
      addOnPaymentStatus: addOnTotalCents > 0 ? REQUEST_ADDON_PAYMENT_STATUSES.CHECKOUT_PENDING : REQUEST_ADDON_PAYMENT_STATUSES.NOT_REQUESTED,
      ...requestInput,
      title: sanitizeInput(requestInput.title, 255),
      description: sanitizeInput(requestInput.description, 5e3)
    }).returning();
    if (addOnTotalCents <= 0) {
      return {
        ...newRequest,
        addOnPaymentRequired: false,
        addOnCheckoutUrl: null
      };
    }
    const checkoutEmail = userEmail || guestEmail || "";
    if (!checkoutEmail) {
      throw new TRPCError2({
        code: "BAD_REQUEST",
        message: "An email is required to purchase add-ons."
      });
    }
    const baseUrl = ENV.publicBaseUrl || "http://localhost:3000";
    try {
      const session = await createCheckoutSession({
        priceInCents: addOnTotalCents,
        productName: "Ink Connect Request Add-ons",
        productDescription: "Optional visibility and messaging add-ons for your tattoo request.",
        customerEmail: checkoutEmail,
        metadata: {
          paymentType: "request_addons",
          requestId: String(newRequest.id),
          userId: ctx.user ? String(ctx.user.id) : "guest"
        },
        successUrl: `${baseUrl}/requests/${newRequest.id}?addons=success`,
        cancelUrl: `${baseUrl}/requests/${newRequest.id}?addons=cancel`
      });
      await db.update(tattooRequests).set({
        addOnStripeCheckoutSessionId: session.id,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq2(tattooRequests.id, newRequest.id));
      return {
        ...newRequest,
        addOnPaymentRequired: true,
        addOnCheckoutUrl: session.url
      };
    } catch (error) {
      await db.update(tattooRequests).set({
        addOnPaymentStatus: REQUEST_ADDON_PAYMENT_STATUSES.FAILED,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq2(tattooRequests.id, newRequest.id));
      throw new TRPCError2({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unable to initialize add-on payment. Please try again.",
        cause: error
      });
    }
  }),
  // AI Prompt Refiner — open to everyone including guests
  refineDescription: publicProcedure.input(
    z3.object({
      description: z3.string().min(1).max(5e3),
      title: z3.string().max(255).optional(),
      style: z3.string().max(100).optional(),
      placement: z3.string().max(100).optional(),
      size: z3.string().max(50).optional(),
      colorPreference: z3.string().max(50).optional()
    })
  ).mutation(async ({ input }) => {
    if (!await isAiEnabled()) {
      throw new TRPCError2({
        code: "FORBIDDEN",
        message: "AI features are disabled until there are 100 registered users."
      });
    }
    const { description, ...context } = input;
    try {
      return await refineRequestPrompt(description, context);
    } catch (error) {
      logger.error("AI prompt refinement failed:", error);
      throw new TRPCError2({
        code: "INTERNAL_SERVER_ERROR",
        message: "AI refinement failed \u2014 please try again or submit your description as-is."
      });
    }
  }),
  // Get a signed URL for uploading a request image — open to guests too
  getUploadUrl: publicProcedure.input(
    z3.object({
      fileName: z3.string(),
      contentType: z3.string()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    let prefix = "guest";
    if (ctx.user) {
      const [client] = await db.select({ id: clients.id }).from(clients).where(eq2(clients.userId, ctx.user.id)).limit(1);
      if (client) prefix = String(client.id);
    }
    const sanitizedFileName = sanitizeFileName(input.fileName);
    const fileKey = `public/${prefix}/${Date.now()}-${sanitizedFileName}`;
    return await createSignedUploadUrl(BUCKETS.REQUEST_IMAGES, fileKey);
  }),
  // Add image to request — open to guests (guest requests have clientId = NULL)
  addImage: publicProcedure.input(
    z3.object({
      requestId: z3.number(),
      imageKey: z3.string(),
      caption: z3.string().max(500).optional(),
      isMainImage: z3.boolean().default(false)
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    let request;
    if (ctx.user) {
      const [client] = await db.select({ id: clients.id }).from(clients).where(eq2(clients.userId, ctx.user.id)).limit(1);
      const rows = await db.select().from(tattooRequests).where(
        and2(
          eq2(tattooRequests.id, input.requestId),
          eq2(tattooRequests.clientId, client?.id ?? 0)
        )
      ).limit(1);
      request = rows[0];
    } else {
      const rows = await db.select().from(tattooRequests).where(
        and2(
          eq2(tattooRequests.id, input.requestId),
          sql2`"clientId" IS NULL`
        )
      ).limit(1);
      request = rows[0];
    }
    if (!request) {
      throw new TRPCError2({
        code: "FORBIDDEN",
        message: "You can only add images to your own requests"
      });
    }
    if (input.isMainImage) {
      await db.update(requestImages).set({ isMainImage: false }).where(eq2(requestImages.requestId, input.requestId));
    }
    const imageUrl = getPublicUrl(BUCKETS.REQUEST_IMAGES, input.imageKey);
    const [image] = await db.insert(requestImages).values({
      requestId: input.requestId,
      imageKey: input.imageKey,
      imageUrl,
      caption: input.caption,
      isMainImage: input.isMainImage
    }).returning();
    return image;
  }),
  // Update request status
  updateStatus: protectedProcedure.input(
    z3.object({
      requestId: z3.number(),
      status: z3.enum(["open", "in_progress", "completed", "cancelled"])
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [client] = await db.select().from(clients).where(eq2(clients.userId, ctx.user.id)).limit(1);
    const [updated] = await db.update(tattooRequests).set({ status: input.status, updatedAt: /* @__PURE__ */ new Date() }).where(
      and2(
        eq2(tattooRequests.id, input.requestId),
        eq2(tattooRequests.clientId, client?.id ?? 0)
      )
    ).returning();
    if (!updated) {
      throw new TRPCError2({
        code: "FORBIDDEN",
        message: "You can only update your own requests"
      });
    }
    return updated;
  })
});
var bidsRouter = router({
  // Get bids for a request (client view)
  getForRequest: protectedProcedure.input(z3.object({ requestId: z3.number() })).query(async ({ ctx, input }) => {
    const db = await requireDb();
    const [client] = await db.select().from(clients).where(eq2(clients.userId, ctx.user.id)).limit(1);
    const [request] = await db.select().from(tattooRequests).where(
      and2(
        eq2(tattooRequests.id, input.requestId),
        eq2(tattooRequests.clientId, client?.id ?? 0)
      )
    ).limit(1);
    if (!request) {
      throw new TRPCError2({
        code: "FORBIDDEN",
        message: "You can only view bids on your own requests"
      });
    }
    const requestBids = await db.select({
      bid: bids,
      artist: artists
    }).from(bids).innerJoin(artists, eq2(bids.artistId, artists.id)).where(eq2(bids.requestId, input.requestId)).orderBy(desc2(bids.createdAt));
    return requestBids.map((b) => ({
      ...b.bid,
      artist: b.artist
    }));
  }),
  // Get my bids (for artists)
  getMyBids: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const [artist] = await db.select().from(artists).where(eq2(artists.userId, ctx.user.id)).limit(1);
    if (!artist) {
      return [];
    }
    const myBids = await db.select({
      bid: bids,
      request: tattooRequests,
      client: clients
    }).from(bids).innerJoin(tattooRequests, eq2(bids.requestId, tattooRequests.id)).leftJoin(clients, eq2(tattooRequests.clientId, clients.id)).where(eq2(bids.artistId, artist.id)).orderBy(desc2(bids.createdAt));
    return myBids.map((b) => ({
      ...b.bid,
      request: b.request,
      client: b.client
    }));
  }),
  // AI Bid Assistant — draft a bid response (Pro subscription/Icon tier only)
  draftBid: protectedProcedure.input(z3.object({ requestId: z3.number() })).mutation(async ({ ctx, input }) => {
    if (!await isAiEnabled()) {
      throw new TRPCError2({
        code: "FORBIDDEN",
        message: "AI features are disabled until there are 100 registered users."
      });
    }
    const db = await requireDb();
    const [artist] = await db.select().from(artists).where(eq2(artists.userId, ctx.user.id)).limit(1);
    if (!artist) {
      throw new TRPCError2({
        code: "FORBIDDEN",
        message: "Only artists can use the bid assistant"
      });
    }
    const canonicalTierForDraft = ctx.user.subscriptionTier ?? "artist_free";
    if (!canUseAiBidAssistant(canonicalTierForDraft)) {
      throw new TRPCError2({
        code: "FORBIDDEN",
        message: "AI Bid Assistant is available for Pro subscription and Icon tier artists. Upgrade to access this feature."
      });
    }
    const [request] = await db.select().from(tattooRequests).where(eq2(tattooRequests.id, input.requestId)).limit(1);
    if (!request) {
      throw new TRPCError2({
        code: "NOT_FOUND",
        message: "Request not found"
      });
    }
    if (request.status !== "open") {
      throw new TRPCError2({
        code: "BAD_REQUEST",
        message: `Cannot draft a bid for a request that is ${request.status}. Only open requests accept new bids.`
      });
    }
    const draft = await draftBidResponse(
      {
        title: request.title,
        description: request.description,
        style: request.style,
        placement: request.placement,
        size: request.size,
        colorPreference: request.colorPreference,
        budgetMin: request.budgetMin,
        budgetMax: request.budgetMax,
        desiredTimeframe: request.desiredTimeframe
      },
      {
        shopName: artist.shopName,
        bio: artist.bio,
        styles: artist.styles,
        specialties: artist.specialties,
        experience: artist.experience,
        city: artist.city,
        state: artist.state
      }
    );
    return draft;
  }),
  // Submit a bid (for artists)
  create: protectedProcedure.input(
    z3.object({
      requestId: z3.number(),
      priceEstimate: z3.number().min(100),
      // At least $1
      estimatedHours: z3.number().min(1).optional(),
      message: z3.string().min(20).max(2e3),
      availableDate: z3.string().optional(),
      portfolioLinks: z3.string().max(1e3).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [artist] = await db.select().from(artists).where(eq2(artists.userId, ctx.user.id)).limit(1);
    if (!artist) {
      throw new TRPCError2({
        code: "FORBIDDEN",
        message: "Only artists can submit bids"
      });
    }
    const canonicalTier = ctx.user.subscriptionTier ?? "artist_free";
    const tierLimits = getArtistTierLimits(canonicalTier);
    const bidsPerMonth = tierLimits.freeBidsPerMonth;
    if (bidsPerMonth === 0) {
      throw new TRPCError2({
        code: "FORBIDDEN",
        message: "Bidding on client posts requires a paid plan. Upgrade to Pro or switch to pay-as-you-go to start submitting proposals."
      });
    }
    if (bidsPerMonth !== Number.MAX_SAFE_INTEGER) {
      const currentMonth = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
      const isNewMonth = artist.bidsMonthYear !== currentMonth;
      if (isNewMonth) {
        await db.update(artists).set({ bidsThisMonth: 0, bidsMonthYear: currentMonth }).where(eq2(artists.id, artist.id));
        artist.bidsThisMonth = 0;
        artist.bidsMonthYear = currentMonth;
      }
      if (artist.bidsThisMonth >= bidsPerMonth) {
        throw new TRPCError2({
          code: "FORBIDDEN",
          message: `You have reached your ${bidsPerMonth} bid limit for this month. Upgrade your plan or wait until next month to submit more proposals.`
        });
      }
    }
    const [request] = await db.select().from(tattooRequests).where(eq2(tattooRequests.id, input.requestId)).limit(1);
    if (!request) {
      throw new TRPCError2({
        code: "NOT_FOUND",
        message: "Request not found"
      });
    }
    if (request.status !== "open") {
      throw new TRPCError2({
        code: "BAD_REQUEST",
        message: "This request is no longer accepting bids"
      });
    }
    const [existingBid] = await db.select().from(bids).where(
      and2(
        eq2(bids.requestId, input.requestId),
        eq2(bids.artistId, artist.id)
      )
    ).limit(1);
    if (existingBid) {
      throw new TRPCError2({
        code: "BAD_REQUEST",
        message: "Artist has already placed a bid on this request"
      });
    }
    const feeRate = tierLimits.transactionFeePercent / 100;
    const platformFeeRateBps = Math.round(feeRate * 1e4);
    const [newBid] = await db.insert(bids).values({
      requestId: input.requestId,
      artistId: artist.id,
      priceEstimate: input.priceEstimate,
      estimatedHours: input.estimatedHours,
      message: sanitizeInput(input.message, 2e3),
      availableDate: input.availableDate ? new Date(input.availableDate) : null,
      portfolioLinks: input.portfolioLinks,
      platformFeeRateBps
    }).returning();
    if (bidsPerMonth !== Number.MAX_SAFE_INTEGER) {
      await db.update(artists).set({
        bidsThisMonth: sql2`${artists.bidsThisMonth} + 1`,
        bidsUsed: sql2`${artists.bidsUsed} + 1`
      }).where(eq2(artists.id, artist.id));
    }
    return newBid;
  }),
  // Accept a bid (for clients)
  accept: protectedProcedure.input(z3.object({ bidId: z3.number() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [client] = await db.select().from(clients).where(eq2(clients.userId, ctx.user.id)).limit(1);
    if (!client) {
      throw new TRPCError2({
        code: "FORBIDDEN",
        message: "Only clients can accept bids"
      });
    }
    const [bid] = await db.select({
      bid: bids,
      request: tattooRequests
    }).from(bids).innerJoin(tattooRequests, eq2(bids.requestId, tattooRequests.id)).where(
      and2(eq2(bids.id, input.bidId), eq2(tattooRequests.clientId, client.id))
    ).limit(1);
    if (!bid) {
      throw new TRPCError2({
        code: "NOT_FOUND",
        message: "Bid not found or you don't own this request"
      });
    }
    const platformFeeAmountCents = bid.bid.platformFeeRateBps > 0 ? Math.round(bid.bid.priceEstimate * bid.bid.platformFeeRateBps / 1e4) : null;
    await db.transaction(async (tx) => {
      await tx.update(bids).set({ status: "accepted", platformFeeAmountCents, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(bids.id, input.bidId));
      await tx.update(bids).set({ status: "rejected", updatedAt: /* @__PURE__ */ new Date() }).where(
        and2(
          eq2(bids.requestId, bid.request.id),
          sql2`${bids.id} != ${input.bidId}`
        )
      );
      await tx.update(tattooRequests).set({
        status: "in_progress",
        selectedBidId: input.bidId,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq2(tattooRequests.id, bid.request.id));
    });
    return { success: true };
  }),
  // Withdraw a bid (for artists)
  withdraw: protectedProcedure.input(z3.object({ bidId: z3.number() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [artist] = await db.select().from(artists).where(eq2(artists.userId, ctx.user.id)).limit(1);
    if (!artist) {
      throw new TRPCError2({
        code: "FORBIDDEN",
        message: "Only artists can withdraw bids"
      });
    }
    const [updated] = await db.update(bids).set({ status: "withdrawn", updatedAt: /* @__PURE__ */ new Date() }).where(and2(eq2(bids.id, input.bidId), eq2(bids.artistId, artist.id))).returning();
    if (!updated) {
      throw new TRPCError2({
        code: "NOT_FOUND",
        message: "Bid not found or you don't own it"
      });
    }
    return updated;
  })
});

// backend/server/routers.ts
init_stripe();
init_schema();
init_db();
init_env();
import { eq as eq5, and as and4, desc as desc3, sql as sql4 } from "drizzle-orm";
import crypto2 from "crypto";

// backend/server/verificationRouter.ts
import { z as z4 } from "zod";
init_env();
init_db();
init_db();
init_schema();
init_supabaseStorage();
import { eq as eq3 } from "drizzle-orm";
import { TRPCError as TRPCError3 } from "@trpc/server";
import path2 from "path";
async function requireDb2() {
  const db = await getDb();
  if (!db)
    throw new TRPCError3({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });
  return db;
}
function sanitizeFileName2(fileName, maxLength = 100) {
  let sanitized = path2.basename(fileName);
  sanitized = sanitized.replace(/[\\\0]/g, "");
  sanitized = sanitized.replace(/\.\./g, "");
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");
  sanitized = sanitized.replace(/_+/g, "_");
  sanitized = sanitized.substring(0, maxLength);
  if (!sanitized || sanitized === "." || sanitized === "..") {
    sanitized = `upload_${Date.now()}`;
  }
  return sanitized;
}
var verificationRouter = router({
  /**
   * Get a signed URL for uploading a verification document.
   */
  getUploadUrl: protectedProcedure.input(
    z4.object({
      fileName: z4.string(),
      contentType: z4.enum(["image/jpeg", "image/png", "application/pdf"]),
      fileSize: z4.number()
    })
  ).mutation(async ({ ctx, input }) => {
    const { fileName, fileSize, contentType } = input;
    if (fileSize > 10 * 1024 * 1024) {
      throw new TRPCError3({
        code: "BAD_REQUEST",
        message: "File size cannot exceed 10MB."
      });
    }
    const sanitizedFileName = sanitizeFileName2(fileName);
    const fileKey = `private/${ctx.user.id}/${Date.now()}-${sanitizedFileName}`;
    return await createSignedUploadUrl(BUCKETS.ID_DOCUMENTS, fileKey);
  }),
  /**
   * Create a record for the uploaded verification document.
   */
  addDocument: protectedProcedure.input(
    z4.object({
      documentKey: z4.string(),
      documentType: z4.string(),
      originalFileName: z4.string(),
      fileSize: z4.number(),
      mimeType: z4.enum(["image/jpeg", "image/png", "application/pdf"])
    })
  ).mutation(async ({ ctx, input }) => {
    const drizzleDb = await requireDb2();
    const newDocument = await drizzleDb.transaction(async (tx) => {
      await tx.update(users).set({
        verificationStatus: "pending",
        verificationSubmittedAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq3(users.id, ctx.user.id));
      const [created] = await tx.insert(verificationDocuments).values({
        userId: ctx.user.id,
        status: "pending",
        submittedAt: /* @__PURE__ */ new Date(),
        documentKey: input.documentKey,
        documentType: input.documentType,
        originalFileName: input.originalFileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType
      }).returning();
      return created;
    });
    if (ENV.n8nVerificationWebhookUrl) {
      fetch(ENV.n8nVerificationWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ENV.n8nWebhookSecret}`
        },
        body: JSON.stringify({
          documentId: newDocument.id,
          userId: ctx.user.id,
          email: ctx.user.email,
          documentType: input.documentType
        })
      }).catch(() => {
      });
    }
    return newDocument;
  }),
  /**
   * Admin: Get all pending verification documents with OCR results.
   */
  getPending: adminProcedure.query(async () => {
    return await getPendingVerificationDocuments();
  }),
  /**
   * Admin: Approve or reject a verification document.
   */
  review: adminProcedure.input(
    z4.object({
      documentId: z4.number(),
      decision: z4.enum(["verified", "rejected"]),
      notes: z4.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    return await reviewVerificationDocument(input.documentId, {
      status: input.decision,
      reviewedBy: ctx.user.id,
      reviewNotes: input.notes
    });
  }),
  /**
   * Admin: Get OCR details for a specific document.
   */
  getDocument: adminProcedure.input(z4.object({ id: z4.number() })).query(async ({ input }) => {
    const doc = await getVerificationDocumentById(input.id);
    if (!doc) {
      throw new TRPCError3({
        code: "NOT_FOUND",
        message: "Verification document not found"
      });
    }
    return doc;
  })
});

// backend/server/healthRouter.ts
var healthRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  })
});

// backend/server/routers.ts
init_geminiVision();

// backend/server/geminiDiscovery.ts
init_aiProviders();
init_logger();
init_db();
var DISCOVERY_PROMPT = `You are a tattoo industry expert. A user is describing the tattoo they want. Parse their description and extract structured search criteria as a JSON object.

Return ONLY a raw JSON object (no markdown fences, no explanation) with these fields:

{
  "styles": string[],       // Tattoo styles that match the description. Pick from: "Traditional", "Neo-Traditional", "Realism", "Hyperrealism", "Watercolor", "Tribal", "Japanese", "Biomechanical", "Geometric", "Dotwork", "Pointillism", "Fine-line", "Minimalist", "Blackwork", "Trash Polka", "New School", "Old School", "Illustrative", "Surrealism", "Lettering", "Chicano", "Ornamental", "Abstract", "Sketch", "Portrait". Return 1-5 styles max.
  "tags": string[],          // Content/subject tags the user is describing. E.g. "floral", "rose", "skull", "dragon", "butterfly", "lion", "clock", "compass", "mandala", "snake", "eagle", "wolf", "heart", "dagger", "anchor", "phoenix", "eye", "tree", "mountain", "moon", "sun", "cross", "angel", "demon", "samurai", "koi fish", "octopus", "waves", "clouds", "fire", "sacred geometry", "lettering", "script", "portrait", "animal", "nature", "mythology". Return 1-8 tags.
  "keywords": string[],      // Additional freeform keywords extracted from the query that don't fit into styles/tags but are useful for text search. E.g. "couples", "matching", "cover-up", "sleeve", "half-sleeve", "backpiece", "colorful", "dark", "feminine", "masculine". Return 0-5 keywords.
  "placement": string | null, // Body placement if mentioned: "arm", "forearm", "upper arm", "wrist", "hand", "finger", "shoulder", "chest", "back", "ribs", "hip", "thigh", "calf", "ankle", "foot", "neck", "behind ear", "collarbone", "spine", "sleeve", "half-sleeve", "full back", or null.
  "size": string | null,      // Size if mentioned: "tiny", "small", "medium", "large", "full-sleeve", "half-sleeve", "backpiece" or null.
  "vibeDescription": string   // A concise 1-sentence summary of what the user wants, optimized for matching against AI-generated image descriptions. Focus on visual characteristics.
}

IMPORTANT:
- Be generous with style matching \u2014 if someone says "sketch" or "line drawing", include both "Sketch" and "Fine-line".
- If someone says "realistic" or "photo-realistic", include "Realism" and possibly "Hyperrealism" or "Portrait".
- "Norse mythology" should map to tags like "mythology", "viking", and styles like "Blackwork", "Traditional".
- "Couples" or "matching" tattoos should go into keywords.
- Always return at least 1 style and 1 tag. Make reasonable inferences from context.
- Return ONLY the raw JSON object.`;
var DEFAULT_INTENT = {
  styles: [],
  tags: [],
  keywords: [],
  placement: null,
  size: null,
  vibeDescription: ""
};
function parseDiscoveryQueryFallback(query) {
  const normalized = query.toLowerCase();
  const styles = [];
  const tags = [];
  const keywords = [];
  let placement = null;
  let size = null;
  const knownStyles = [
    "Traditional",
    "Neo-Traditional",
    "Realism",
    "Hyperrealism",
    "Watercolor",
    "Tribal",
    "Japanese",
    "Biomechanical",
    "Geometric",
    "Dotwork",
    "Pointillism",
    "Fine-line",
    "Minimalist",
    "Blackwork",
    "Trash Polka",
    "New School",
    "Old School",
    "Illustrative",
    "Surrealism",
    "Lettering",
    "Chicano",
    "Ornamental",
    "Abstract",
    "Sketch",
    "Portrait"
  ];
  for (const s of knownStyles) {
    if (normalized.includes(s.toLowerCase())) {
      styles.push(s);
    }
  }
  if (normalized.includes("line drawing") || normalized.includes("linework")) {
    if (!styles.includes("Fine-line")) styles.push("Fine-line");
    if (!styles.includes("Sketch")) styles.push("Sketch");
  }
  const knownPlacements = [
    "forearm",
    "upper arm",
    "wrist",
    "hand",
    "finger",
    "shoulder",
    "chest",
    "back",
    "ribs",
    "hip",
    "thigh",
    "calf",
    "ankle",
    "foot",
    "neck",
    "behind ear",
    "collarbone",
    "spine",
    "arm",
    "sleeve"
  ];
  for (const p of knownPlacements) {
    if (normalized.includes(p)) {
      placement = p;
      break;
    }
  }
  const knownSizes = ["tiny", "small", "medium", "large", "sleeve", "backpiece"];
  for (const sz of knownSizes) {
    if (normalized.includes(sz)) {
      size = sz;
      break;
    }
  }
  const knownTags = [
    "floral",
    "rose",
    "flower",
    "skull",
    "dragon",
    "butterfly",
    "lion",
    "clock",
    "compass",
    "mandala",
    "snake",
    "eagle",
    "wolf",
    "heart",
    "dagger",
    "anchor",
    "phoenix",
    "eye",
    "tree",
    "mountain",
    "moon",
    "sun",
    "cross",
    "angel",
    "demon",
    "samurai",
    "koi fish",
    "octopus",
    "waves",
    "clouds",
    "fire",
    "sacred geometry",
    "lettering",
    "script",
    "portrait",
    "animal",
    "nature",
    "mythology"
  ];
  for (const t2 of knownTags) {
    if (normalized.includes(t2)) {
      tags.push(t2);
    }
  }
  const words = normalized.split(/\s+/);
  const commonTrivial = ["i", "want", "a", "the", "on", "my", "to", "and", "in", "like", "looks", "is", "for", "with", "that", "of"];
  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/g, "");
    if (cleanWord.length > 3 && !commonTrivial.includes(cleanWord)) {
      if (!tags.includes(cleanWord) && !styles.map((s) => s.toLowerCase()).includes(cleanWord)) {
        keywords.push(cleanWord);
      }
    }
  }
  return {
    styles: styles.length > 0 ? styles : ["Traditional"],
    tags: tags.length > 0 ? tags : ["nature"],
    keywords: keywords.slice(0, 5),
    placement,
    size,
    vibeDescription: query
  };
}
async function parseDiscoveryQuery(query) {
  if (!await isAiEnabled()) {
    logger.info("AI features gated (< 100 users). Using local heuristic parser for discovery query.");
    return parseDiscoveryQueryFallback(query);
  }
  try {
    const parsed2 = await groqGenerateJson(
      DISCOVERY_PROMPT,
      `User query: "${query.slice(0, 500)}"`,
      { maxTokens: 1200 }
    );
    const intent = {
      styles: Array.isArray(parsed2.styles) ? parsed2.styles.slice(0, 5) : [],
      tags: Array.isArray(parsed2.tags) ? parsed2.tags.slice(0, 8) : [],
      keywords: Array.isArray(parsed2.keywords) ? parsed2.keywords.slice(0, 5) : [],
      placement: typeof parsed2.placement === "string" ? parsed2.placement : null,
      size: typeof parsed2.size === "string" ? parsed2.size : null,
      vibeDescription: typeof parsed2.vibeDescription === "string" ? parsed2.vibeDescription.slice(0, 300) : ""
    };
    logger.info(
      `Discovery query parsed: "${query.slice(0, 80)}${query.length > 80 ? "..." : ""}" => styles=[${intent.styles.join(", ")}] tags=[${intent.tags.join(", ")}] placement=${intent.placement} size=${intent.size}`
    );
    return intent;
  } catch (error) {
    logger.error("Groq discovery query parsing failed:", error);
    return DEFAULT_INTENT;
  }
}

// backend/server/geminiSafety.ts
init_aiProviders();
init_logger();
init_db();
var REVIEW_ANALYSIS_PROMPT = `You are a content moderation specialist for a tattoo artist booking platform. Analyze this review for potential issues that warrant human moderation.

Review details:
- Rating: {rating}/5
- Comment: "{comment}"
- Reviewer has verified booking: {verifiedBooking}

Analyze for the following concerns and return a JSON object:

{
  "overallSentiment": string,     // "positive", "neutral", "negative", "mixed"
  "toxicityScore": number,        // 0-100: How toxic/abusive the language is (0 = completely clean, 100 = severely abusive)
  "spamScore": number,            // 0-100: Likelihood of spam (generic text, SEO stuffing, promotional links, etc.)
  "fraudScore": number,           // 0-100: Likelihood of being fraudulent/fake. Consider:
                                  //   - Suspiciously generic praise/criticism
                                  //   - Mismatch between rating and comment tone
                                  //   - Competitor sabotage patterns (detailed negative review mentioning another shop)
                                  //   - Review bombing language
                                  //   - Impossible claims ("I've never been here but...")
  "flags": string[],              // Specific flags: "abusive-language", "hate-speech", "threats", "personal-info-exposed",
                                  //   "competitor-mention", "spam-link", "fake-positive", "fake-negative",
                                  //   "rating-comment-mismatch", "review-bombing", "irrelevant-content",
                                  //   "harassment", "defamation", "solicitation"
  "moderationAction": string,     // Recommended action: "approve", "flag_for_review", "auto_hide"
  "moderationReason": string,     // Brief explanation for the recommended action
  "summary": string               // 1-sentence summary of the review's content and tone
}

IMPORTANT:
- Return ONLY the raw JSON object, no markdown code fences.
- Most reviews are legitimate \u2014 don't over-flag. Only flag genuinely suspicious content.
- A negative review alone is NOT suspicious. Even harsh but factual criticism is legitimate.
- "auto_hide" should only be recommended for clearly abusive, spam, or obviously fake content.
- "flag_for_review" for borderline cases that need human judgment.
- "approve" for reviews that appear legitimate, even if negative.
- Rating-comment mismatch: e.g., 5-star rating with a scathing negative comment or 1-star with glowing praise.
- A verified booking review should have a lower fraud score since it's tied to an actual transaction.`;
var DEFAULT_REVIEW_ANALYSIS = {
  overallSentiment: "neutral",
  toxicityScore: 0,
  spamScore: 0,
  fraudScore: 0,
  flags: [],
  moderationAction: "approve",
  moderationReason: "Analysis unavailable \u2014 defaulting to approve",
  summary: "Review analysis could not be completed"
};
async function analyzeReviewSentiment(review) {
  if (!await isAiEnabled()) {
    logger.info("AI features gated (< 100 users). Skipping review sentiment analysis.");
    return {
      overallSentiment: "neutral",
      toxicityScore: 0,
      spamScore: 0,
      fraudScore: 0,
      flags: [],
      moderationAction: "approve",
      moderationReason: "AI moderation gated (< 100 users) \u2014 approved automatically",
      summary: "Sentiment analysis bypassed"
    };
  }
  if (!review.comment || review.comment.trim().length === 0) {
    return {
      ...DEFAULT_REVIEW_ANALYSIS,
      moderationReason: "No comment text to analyze \u2014 rating-only review auto-approved"
    };
  }
  try {
    const sanitizedComment = review.comment.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
    const prompt = REVIEW_ANALYSIS_PROMPT.replace(
      "{rating}",
      String(review.rating)
    ).replace("{verifiedBooking}", String(review.verifiedBooking ?? false)).replace("{comment}", sanitizedComment);
    const parsed2 = await groqGenerateJson(
      REVIEW_ANALYSIS_PROMPT,
      prompt,
      { maxTokens: 1400 }
    );
    const overallSentimentValue = typeof parsed2.overallSentiment === "string" ? parsed2.overallSentiment : "";
    const moderationActionValue = typeof parsed2.moderationAction === "string" ? parsed2.moderationAction : "";
    const analysis = {
      overallSentiment: ["positive", "neutral", "negative", "mixed"].includes(
        overallSentimentValue
      ) ? overallSentimentValue : "neutral",
      toxicityScore: typeof parsed2.toxicityScore === "number" ? Math.max(0, Math.min(100, Math.round(parsed2.toxicityScore))) : 0,
      spamScore: typeof parsed2.spamScore === "number" ? Math.max(0, Math.min(100, Math.round(parsed2.spamScore))) : 0,
      fraudScore: typeof parsed2.fraudScore === "number" ? Math.max(0, Math.min(100, Math.round(parsed2.fraudScore))) : 0,
      flags: Array.isArray(parsed2.flags) ? parsed2.flags : [],
      moderationAction: ["approve", "flag_for_review", "auto_hide"].includes(
        moderationActionValue
      ) ? moderationActionValue : "approve",
      moderationReason: typeof parsed2.moderationReason === "string" ? parsed2.moderationReason.slice(0, 500) : "No reason provided",
      summary: typeof parsed2.summary === "string" ? parsed2.summary.slice(0, 300) : "No summary available"
    };
    logger.info(
      `Review sentiment: ${analysis.overallSentiment} | toxicity=${analysis.toxicityScore} spam=${analysis.spamScore} fraud=${analysis.fraudScore} | action=${analysis.moderationAction}`
    );
    return analysis;
  } catch (error) {
    logger.error("Groq review sentiment analysis failed:", error);
    return DEFAULT_REVIEW_ANALYSIS;
  }
}

// backend/server/aiRouter.ts
import { z as z5 } from "zod";
init_db();
init_schema();
import { TRPCError as TRPCError4 } from "@trpc/server";
import { eq as eq4, sql as sql3, and as and3, gt } from "drizzle-orm";

// backend/server/geminiGeneration.ts
init_aiProviders();
init_logger();
init_supabaseStorage();
var TATTOO_GENERATION_PROMPT = `You are a world-class tattoo stencil artist. Create a highly detailed, professional tattoo design based on the following description. The design should:

1. Be rendered as clean black linework suitable for a tattoo stencil
2. Use a plain, pure, solid white background with NO skin texture, NO body parts, NO background scenery, and NO mockups
3. Be well-composed, isolated, and centered in the frame
4. Include appropriate shading using crosshatching, stippling, or dotwork techniques
5. Show fine detail that a real tattoo artist could replicate

STYLE DIRECTION: {style}

DESIGN REQUEST:
{prompt}

Generate a single cohesive tattoo design image. The output must be a clear, monochrome (black on white) tattoo-ready stencil design isolated on a solid white background. No text, no watermarks, no borders, no human skin visible.`;
var STYLE_MAP = {
  traditional: "Bold outlines, limited color palette feel, classic American Traditional with thick lines and iconic imagery",
  "neo-traditional": "Rich detail with bold lines, more complex shading and subtle depth than classic traditional",
  realism: "Photorealistic rendering with detailed shading, smooth gradients, and lifelike proportions",
  watercolor: "Splashy, painterly effects with watercolor-style washes, drips, and soft color transitions",
  japanese: "Irezumi-style with flowing composition, bold outlines, traditional Japanese motifs (waves, clouds, cherry blossoms)",
  geometric: "Precise geometric shapes, sacred geometry patterns, mathematical symmetry and clean lines",
  minimalist: "Ultra-clean single-line or simple linework, minimal detail, elegant simplicity",
  blackwork: "Bold solid black fills, heavy contrast, negative space design",
  dotwork: "Stippled shading, mandala-influenced patterns built from individual dots",
  "fine-line": "Ultra-thin delicate lines, subtle details, refined and elegant",
  tribal: "Bold tribal patterns, solid black geometric motifs, flowing organic shapes",
  biomechanical: "Mechanical components intertwined with organic forms, Giger-inspired",
  illustrative: "Comic/illustration style with dynamic linework and artistic shading",
  sketch: "Raw sketch-like quality with visible pencil strokes and construction lines"
};
async function generateTattooDesign(prompt, style, userId) {
  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt.length === 0) {
    throw new Error("Prompt cannot be empty");
  }
  if (trimmedPrompt.length > 2e3) {
    throw new Error("Prompt is too long (max 2000 characters)");
  }
  const styleDirection = style && STYLE_MAP[style.toLowerCase()] ? STYLE_MAP[style.toLowerCase()] : "Clean, versatile tattoo style with detailed linework";
  const fullPrompt = TATTOO_GENERATION_PROMPT.replace(
    "{style}",
    styleDirection
  ).replace("{prompt}", trimmedPrompt);
  try {
    const { buffer: imageBuffer, mimeType: imageMimeType } = await generateImageWithHuggingFace(fullPrompt);
    const extension = imageMimeType.includes("png") ? "png" : imageMimeType.includes("webp") ? "webp" : "jpg";
    const imageKey = `generated/${userId}/${Date.now()}-design.${extension}`;
    await uploadFile(
      BUCKETS.PORTFOLIO_IMAGES,
      imageKey,
      imageBuffer,
      imageMimeType
    );
    const imageUrl = getPublicUrl(BUCKETS.PORTFOLIO_IMAGES, imageKey);
    logger.info(`Tattoo design generated for user #${userId}: ${imageKey}`);
    return { imageUrl, imageKey };
  } catch (error) {
    logger.error("Hugging Face tattoo generation failed:", error);
    throw error;
  }
}

// backend/server/aiRouter.ts
init_logger();
async function requireDb3() {
  const db = await getDb();
  if (!db)
    throw new TRPCError4({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });
  return db;
}
var aiRouter = router({
  /**
   * Generate a tattoo design using Gemini AI.
   * Requires an active client profile with a paid subscription tier,
   * or available AI credits.
   */
  generateDesign: protectedProcedure.input(
    z5.object({
      prompt: z5.string().min(
        10,
        "Please provide at least 10 characters describing your tattoo"
      ).max(2e3),
      style: z5.string().max(50).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!await isAiEnabled()) {
      throw new TRPCError4({
        code: "FORBIDDEN",
        message: "AI Design Lab features are disabled until there are 100 registered users."
      });
    }
    const db = await requireDb3();
    const isArtist = ctx.user.subscriptionTier?.startsWith("artist_");
    let profileId;
    let availableCredits;
    let limitMax;
    let tableName;
    if (isArtist) {
      const [artistProfile] = await db.select().from(artists).where(eq4(artists.userId, ctx.user.id)).limit(1);
      if (!artistProfile) throw new TRPCError4({ code: "FORBIDDEN", message: "Artist profile not found" });
      const tier = ctx.user.subscriptionTier || "artist_free";
      const tierLimits = getArtistTierLimits(tier);
      if (tierLimits.aiGenerationsPerMonth === 0) {
        throw new TRPCError4({ code: "FORBIDDEN", message: "AI Studio is a Pro feature. Upgrade to Pro ($49/mo) to unlock." });
      }
      profileId = artistProfile.id;
      availableCredits = artistProfile.aiCredits;
      limitMax = tierLimits.aiGenerationsPerMonth;
      tableName = artists;
    } else {
      const [clientProfile] = await db.select().from(clients).where(eq4(clients.userId, ctx.user.id)).limit(1);
      if (!clientProfile) throw new TRPCError4({ code: "FORBIDDEN", message: "Profile not found." });
      if (clientProfile.aiCredits <= 0) {
        throw new TRPCError4({ code: "FORBIDDEN", message: "AI Generation requires AI credits. Purchase credits to generate." });
      }
      profileId = clientProfile.id;
      availableCredits = clientProfile.aiCredits;
      limitMax = clientProfile.aiCredits;
      tableName = clients;
    }
    if (limitMax !== Number.MAX_SAFE_INTEGER) {
      const [updated] = await db.update(tableName).set({
        aiCredits: sql3`${tableName.aiCredits} - 1`,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(
        and3(eq4(tableName.id, profileId), gt(tableName.aiCredits, 0))
      ).returning({ aiCredits: tableName.aiCredits });
      if (!updated) {
        throw new TRPCError4({
          code: "FORBIDDEN",
          message: `You've used all your AI generation credits. Please upgrade or purchase more.`
        });
      }
      availableCredits = updated.aiCredits;
    }
    try {
      const result = await generateTattooDesign(
        input.prompt,
        input.style,
        ctx.user.id
      );
      logger.info(
        `AI tattoo generated for user #${ctx.user.id}, credits remaining: ${limitMax === Number.MAX_SAFE_INTEGER ? "unlimited" : availableCredits}`
      );
      return {
        imageUrl: result.imageUrl,
        imageKey: result.imageKey,
        creditsRemaining: limitMax === Number.MAX_SAFE_INTEGER ? null : availableCredits
      };
    } catch (error) {
      logger.error("AI tattoo generation failed:", error);
      if (limitMax !== Number.MAX_SAFE_INTEGER) {
        await db.update(tableName).set({ aiCredits: sql3`${tableName.aiCredits} + 1`, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(tableName.id, profileId));
      }
      throw new TRPCError4({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate tattoo design. Please try again."
      });
    }
  }),
  /**
   * Get the current user's AI generation credits and tier info.
   */
  getCredits: protectedProcedure.query(async ({ ctx }) => {
    const isArtist = ctx.user.subscriptionTier?.startsWith("artist_");
    if (!await isAiEnabled()) {
      return {
        tier: isArtist ? ctx.user.subscriptionTier || "artist_free" : "client_free",
        tierName: isArtist ? "Directory Profile" : "Collector",
        aiCredits: 0,
        maxCredits: 0,
        isUnlimited: false
      };
    }
    const db = await requireDb3();
    if (isArtist) {
      const [artistProfile] = await db.select().from(artists).where(eq4(artists.userId, ctx.user.id)).limit(1);
      if (!artistProfile) return { tier: "artist_free", tierName: "Directory Profile", aiCredits: 0, maxCredits: 0, isUnlimited: false };
      const tier = ctx.user.subscriptionTier || "artist_free";
      const tierLimits = getArtistTierLimits(tier);
      return {
        tier,
        tierName: tierLimits.name,
        aiCredits: artistProfile.aiCredits,
        maxCredits: tierLimits.aiGenerationsPerMonth,
        isUnlimited: tierLimits.aiGenerationsPerMonth === Number.MAX_SAFE_INTEGER
      };
    } else {
      const [clientProfile] = await db.select().from(clients).where(eq4(clients.userId, ctx.user.id)).limit(1);
      if (!clientProfile) return { tier: "client_free", tierName: "Collector", aiCredits: 0, maxCredits: 0, isUnlimited: false };
      return {
        tier: "client_free",
        tierName: "Collector",
        aiCredits: clientProfile.aiCredits,
        maxCredits: clientProfile.aiCredits,
        isUnlimited: false
      };
    }
  })
});

// backend/server/shopRouter.ts
import { TRPCError as TRPCError5 } from "@trpc/server";
import { z as z6 } from "zod";
init_db();
var shopRouter = router({
  // Get all shops from the shops table.
  getAll: publicProcedure.query(async () => {
    try {
      return await getAllShops();
    } catch (error) {
      throw new TRPCError5({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch shops"
      });
    }
  }),
  // Search shops by name, city, or state.
  search: publicProcedure.input(
    z6.object({
      searchTerm: z6.string().trim()
    })
  ).query(async ({ input }) => {
    try {
      return await searchShops(input.searchTerm);
    } catch (error) {
      throw new TRPCError5({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to search shops"
      });
    }
  }),
  // Get all unique cities for filter dropdowns.
  getCities: publicProcedure.query(async () => {
    try {
      const allShops = await getAllShops();
      const uniqueCities = Array.from(
        new Set(
          allShops.map((shop) => shop.city).filter((city) => typeof city === "string" && city.length > 0)
        )
      );
      return uniqueCities.sort((a, b) => a.localeCompare(b));
    } catch (error) {
      throw new TRPCError5({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch cities"
      });
    }
  })
});

// backend/server/routers.ts
import path3 from "path";
function sanitizeFileName3(fileName, maxLength = 100) {
  let sanitized = path3.basename(fileName);
  sanitized = sanitized.replace(/[\\/\0]/g, "");
  sanitized = sanitized.replace(/\.\./g, "");
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");
  sanitized = sanitized.replace(/_+/g, "_");
  sanitized = sanitized.substring(0, maxLength);
  if (!sanitized || sanitized === "." || sanitized === "..") {
    sanitized = `upload_${Date.now()}`;
  }
  return sanitized;
}
var appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  health: healthRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  artists: router({
    getAll: publicProcedure.query(async () => {
      return await getAllArtists();
    }),
    /** Admin: list all artists (approved + unapproved) with user info */
    adminGetAll: adminProcedure.query(async () => {
      return await getAllArtistsAdmin();
    }),
    /** Admin: approve or reject an artist */
    adminSetApproval: adminProcedure.input(z7.object({ artistId: z7.number(), approved: z7.boolean() })).mutation(async ({ input }) => {
      await updateArtist(input.artistId, { isApproved: input.approved });
      if (input.approved) {
        const database = await getDb();
        if (database) {
          try {
            const [artist] = await database.select({ userId: artists.userId }).from(artists).where(eq5(artists.id, input.artistId)).limit(1);
            if (artist?.userId) {
              await database.update(invitations).set({ status: "approved" }).where(eq5(invitations.userId, artist.userId));
            }
          } catch (err) {
            logger.error("Failed to update invitation status on artist approval", {
              artistId: input.artistId,
              error: err instanceof Error ? err.message : String(err)
            });
          }
        }
      }
      if (ENV.n8nWebhookUrl && ENV.n8nWebhookSecret) {
        try {
          const webhookUrl = `${ENV.n8nWebhookUrl}/webhook/artist-approval`;
          const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${ENV.n8nWebhookSecret}`
            },
            body: JSON.stringify({
              artistId: input.artistId,
              approved: input.approved
            })
          });
          if (!response.ok) {
            logger.warn("n8n webhook returned non-2xx status", {
              artistId: input.artistId,
              status: response.status,
              statusText: response.statusText
            });
          }
        } catch (err) {
          logger.error("Failed to trigger n8n approval notification workflow", {
            artistId: input.artistId,
            error: err instanceof Error ? err.message : String(err)
          });
        }
      }
      return { success: true };
    }),
    adminSendInvitations: adminProcedure.input(
      z7.object({
        invitations: z7.array(
          z7.object({
            email: z7.string().email(),
            shopName: z7.string().min(1, "Shop name is required"),
            state: z7.string().optional()
          })
        ).max(50, "Maximum 50 invitations per batch allowed")
      })
    ).mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError6({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable"
        });
      }
      const results = [];
      for (const invite of input.invitations) {
        try {
          const inviteCode = crypto2.randomBytes(8).toString("hex");
          const [existing] = await database.select().from(invitations).where(eq5(invitations.email, invite.email)).limit(1);
          if (existing) {
            await database.update(invitations).set({
              shopName: invite.shopName,
              state: invite.state ?? null,
              inviteCode,
              sentAt: /* @__PURE__ */ new Date(),
              status: "sent",
              openedAt: null,
              registeredAt: null
            }).where(eq5(invitations.id, existing.id));
          } else {
            await database.insert(invitations).values({
              email: invite.email,
              shopName: invite.shopName,
              state: invite.state ?? null,
              inviteCode,
              status: "sent",
              sentAt: /* @__PURE__ */ new Date()
            });
          }
          await sendArtistInvitation(invite.email, invite.shopName, inviteCode);
          results.push({ email: invite.email, status: "success" });
        } catch (err) {
          logger.error("Failed to send batch invitation to " + invite.email, {
            error: err instanceof Error ? err.message : String(err)
          });
          results.push({
            email: invite.email,
            status: "failed",
            error: err instanceof Error ? err.message : String(err)
          });
        }
      }
      return results;
    }),
    adminResendInvitation: adminProcedure.input(z7.object({ id: z7.number() })).mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError6({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable"
        });
      }
      const [invite] = await database.select().from(invitations).where(eq5(invitations.id, input.id)).limit(1);
      if (!invite) {
        throw new TRPCError6({
          code: "NOT_FOUND",
          message: "Invitation not found"
        });
      }
      const newCode = crypto2.randomBytes(8).toString("hex");
      await database.update(invitations).set({
        inviteCode: newCode,
        sentAt: /* @__PURE__ */ new Date(),
        status: "sent",
        openedAt: null,
        registeredAt: null
      }).where(eq5(invitations.id, invite.id));
      await sendArtistInvitation(invite.email, invite.shopName, newCode);
      return { success: true };
    }),
    adminGetInvitations: adminProcedure.query(async () => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError6({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable"
        });
      }
      return await database.select().from(invitations).orderBy(desc3(invitations.sentAt));
    }),
    adminGetInvitationMetrics: adminProcedure.input(z7.object({ state: z7.string().optional() }).optional()).query(async ({ input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError6({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable"
        });
      }
      let query = database.select().from(invitations);
      if (input?.state) {
        query = query.where(eq5(invitations.state, input.state));
      }
      const allInvites = await query;
      let sent = 0;
      let opened = 0;
      let registered = 0;
      let approved = 0;
      for (const inv of allInvites) {
        sent++;
        if (inv.openedAt || inv.status === "opened" || inv.status === "registered" || inv.status === "approved") {
          opened++;
        }
        if (inv.registeredAt || inv.status === "registered" || inv.status === "approved") {
          registered++;
        }
        if (inv.status === "approved") {
          approved++;
        }
      }
      return { sent, opened, registered, approved };
    }),
    trackInviteOpen: publicProcedure.input(z7.object({ inviteCode: z7.string() })).mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) return { success: false };
      const [invite] = await database.select().from(invitations).where(eq5(invitations.inviteCode, input.inviteCode)).limit(1);
      if (!invite) return { success: false };
      if (invite.status === "sent") {
        await database.update(invitations).set({
          status: "opened",
          openedAt: /* @__PURE__ */ new Date()
        }).where(eq5(invitations.id, invite.id));
      }
      return { success: true };
    }),
    linkInviteCode: protectedProcedure.input(z7.object({ inviteCode: z7.string() })).mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError6({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable"
        });
      }
      const [invite] = await database.select().from(invitations).where(eq5(invitations.inviteCode, input.inviteCode)).limit(1);
      if (!invite) {
        throw new TRPCError6({
          code: "NOT_FOUND",
          message: "Invitation not found"
        });
      }
      const updateData = {
        userId: ctx.user.id
      };
      if (!invite.registeredAt) {
        updateData.registeredAt = /* @__PURE__ */ new Date();
      }
      const [artistProfile] = await database.select({ isApproved: artists.isApproved }).from(artists).where(eq5(artists.userId, ctx.user.id)).limit(1);
      if (artistProfile?.isApproved) {
        updateData.status = "approved";
      } else if (invite.status === "sent" || invite.status === "opened") {
        updateData.status = "registered";
      }
      await database.update(invitations).set(updateData).where(eq5(invitations.id, invite.id));
      return { success: true };
    }),
    /**
     * Create a Stripe Checkout Session for an artist subscription upgrade.
     * Returns the Checkout URL to redirect the artist to Stripe.
     */
    createSubscriptionCheckout: protectedProcedure.input(
      z7.object({
        tier: z7.enum(["artist_pro", "artist_elite"]),
        interval: z7.enum(["month", "year"]).default("month"),
        successUrl: z7.string().url(),
        cancelUrl: z7.string().url()
      })
    ).mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [artist] = await database.select({ id: artists.id }).from(artists).where(eq5(artists.userId, ctx.user.id)).limit(1);
      if (!artist) {
        throw new TRPCError6({
          code: "FORBIDDEN",
          message: "You must have an artist profile before subscribing."
        });
      }
      const priceIdMap = {
        artist_pro_month: ENV.stripeArtistProPriceIdMonth,
        artist_pro_year: ENV.stripeArtistProPriceIdYear,
        artist_elite_month: ENV.stripeArtistIconPriceIdMonth,
        artist_elite_year: ENV.stripeArtistIconPriceIdYear
      };
      const priceId = priceIdMap[`${input.tier}_${input.interval}`];
      if (!priceId) {
        throw new TRPCError6({
          code: "PRECONDITION_FAILED",
          message: `Stripe price for ${input.tier} (${input.interval}) is not configured.`
        });
      }
      const [user] = await database.select({ email: users.email, stripeCustomerId: users.stripeCustomerId }).from(users).where(eq5(users.id, ctx.user.id)).limit(1);
      const session = await createArtistSubscriptionCheckout({
        priceId,
        customerEmail: user?.email ?? "",
        stripeCustomerId: user?.stripeCustomerId ?? void 0,
        metadata: {
          userId: String(ctx.user.id),
          artistId: String(artist.id),
          tier: input.tier,
          interval: input.interval
        },
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl
      });
      return { checkoutUrl: session.url };
    }),
    getFoundingStatus: publicProcedure.query(async () => {
      const database = await getDb();
      if (!database) throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [res] = await database.select({ count: sql4`count(*)::int` }).from(artists).where(eq5(artists.isFoundingArtist, true));
      const count = res?.count ?? 0;
      return {
        count,
        limit: 50,
        isSoldOut: count >= 50
      };
    }),
    /**
     * Start the Founding Artist checkout:
     * - 90-day free trial then $19/mo locked rate
     * - Marks artist with isFoundingArtist=true and sets foundingTrialEndsAt on webhook completion
     */
    startFoundingCheckout: protectedProcedure.input(
      z7.object({
        successUrl: z7.string().url(),
        cancelUrl: z7.string().url()
      })
    ).mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [foundingCount] = await database.select({ count: sql4`count(*)::int` }).from(artists).where(eq5(artists.isFoundingArtist, true));
      const count = foundingCount?.count ?? 0;
      if (count >= 50) {
        throw new TRPCError6({
          code: "PRECONDITION_FAILED",
          message: "The Founding Artist offer is sold out."
        });
      }
      const [artist] = await database.select({ id: artists.id }).from(artists).where(eq5(artists.userId, ctx.user.id)).limit(1);
      if (!artist) {
        throw new TRPCError6({
          code: "FORBIDDEN",
          message: "You must have an artist profile before joining the Founding Artist offer."
        });
      }
      const [user] = await database.select({ email: users.email, stripeCustomerId: users.stripeCustomerId }).from(users).where(eq5(users.id, ctx.user.id)).limit(1);
      const priceId = ENV.stripeFoundingArtistPriceId;
      if (!priceId) {
        throw new TRPCError6({
          code: "PRECONDITION_FAILED",
          message: "Founding Artist price is not configured."
        });
      }
      const session = await createFoundingArtistCheckout({
        priceId,
        customerEmail: user?.email ?? "",
        stripeCustomerId: user?.stripeCustomerId ?? void 0,
        metadata: {
          userId: String(ctx.user.id),
          artistId: String(artist.id),
          tier: "artist_pro",
          interval: "month",
          isFoundingArtist: "true"
        },
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl
      });
      return { checkoutUrl: session.url };
    }),
    search: publicProcedure.input(
      z7.object({
        shopName: z7.string().optional(),
        styles: z7.array(z7.string()).optional(),
        minRating: z7.number().optional(),
        minExperience: z7.number().optional(),
        city: z7.string().optional(),
        state: z7.string().optional()
      })
    ).query(async ({ input }) => {
      const normalizeText = (value, maxLen = 100) => {
        if (!value) return void 0;
        const trimmed = value.trim();
        if (!trimmed) return void 0;
        return trimmed.slice(0, maxLen);
      };
      return await searchArtists({
        ...input,
        shopName: normalizeText(input.shopName),
        city: normalizeText(input.city),
        state: normalizeText(input.state, 50)
      });
    }),
    /**
     * Tattoo Discovery — natural language semantic search.
     * Parses the user's free-text query with Gemini AI, then matches against
     * AI-tagged portfolio images and artist profiles.
     */
    discover: protectedProcedure.input(
      z7.object({
        query: z7.string().min(1).max(500)
      })
    ).query(async ({ input }) => {
      const intent = await parseDiscoveryQuery(input.query);
      const results = await discoverArtists({
        styles: intent.styles,
        tags: intent.tags,
        keywords: intent.keywords,
        vibeDescription: intent.vibeDescription
      });
      return {
        intent,
        artists: results
      };
    }),
    getById: publicProcedure.input(z7.object({ id: z7.number() })).query(async ({ input }) => {
      const artist = await getArtistById(input.id);
      if (artist) {
        const database = await getDb();
        if (database) {
          database.update(artists).set({ profileViewCount: sql4`profileViewCount + 1` }).where(eq5(artists.id, artist.id)).returning().then(async ([updatedArtist]) => {
            if (updatedArtist && updatedArtist.profileViewCount % 15 === 0 && artist.subscriptionTier === "artist_free") {
              const [artistUser] = await database.select({ email: users.email, name: users.name }).from(users).where(eq5(users.id, artist.userId)).limit(1);
              if (artistUser && artistUser.email) {
                await sendFreeTierPerformanceInsights(artistUser.email, {
                  artistName: artistUser.name || artist.shopName,
                  viewsCount: updatedArtist.profileViewCount
                }).catch((err) => {
                  logger.error("Failed to send free tier view performance insights:", err);
                });
              }
            }
          }).catch((err) => {
            logger.error("Failed to increment profileViewCount or process insights:", err);
          });
        }
      }
      return artist;
    }),
    getByUserId: protectedProcedure.query(async ({ ctx }) => {
      return await getArtistByUserId(ctx.user.id);
    }),
    create: protectedProcedure.input(
      z7.object({
        shopName: z7.string(),
        bio: z7.string().optional(),
        experience: z7.number().int().positive().optional(),
        city: z7.string().default(""),
        state: z7.string().default(""),
        styles: z7.string().optional(),
        specialties: z7.string().optional(),
        instagram: z7.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const newArtist = await createArtist({
        ...input,
        shopName: sanitizeInput(input.shopName, 255),
        bio: input.bio ? sanitizeInput(input.bio, 2e3) : void 0,
        specialties: input.specialties ? sanitizeInput(input.specialties, 500) : void 0,
        userId: ctx.user.id
      });
      return newArtist;
    }),
    update: artistOwnerProcedure.input(
      z7.object({
        id: z7.number(),
        shopName: z7.string().optional(),
        bio: z7.string().optional(),
        specialties: z7.string().optional(),
        experience: z7.number().optional(),
        address: z7.string().optional(),
        city: z7.string().optional(),
        state: z7.string().optional(),
        zipCode: z7.string().optional(),
        phone: z7.string().optional(),
        website: z7.string().optional(),
        instagram: z7.string().optional(),
        facebook: z7.string().optional(),
        lat: z7.string().optional(),
        lng: z7.string().optional()
      })
    ).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await updateArtist(id, {
        ...data,
        shopName: data.shopName ? sanitizeInput(data.shopName, 255) : void 0,
        bio: data.bio ? sanitizeInput(data.bio, 2e3) : void 0,
        specialties: data.specialties ? sanitizeInput(data.specialties, 500) : void 0
      });
    }),
    /**
     * Enable the no-subscription transaction plan.
     * Sets canonical tier to artist_pro (mapped to pay-as-you-go fee logic).
     */
    enablePayAsYouGo: protectedProcedure.mutation(async ({ ctx }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError6({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable"
        });
      }
      const [artist] = await database.select({ id: artists.id }).from(artists).where(eq5(artists.userId, ctx.user.id)).limit(1);
      if (!artist) {
        throw new TRPCError6({
          code: "FORBIDDEN",
          message: "You must have an artist profile first."
        });
      }
      const [userRow] = await database.select({
        stripeSubscriptionId: users.stripeSubscriptionId,
        subscriptionTier: users.subscriptionTier
      }).from(users).where(eq5(users.id, ctx.user.id)).limit(1);
      if (!userRow) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "User not found" });
      }
      if (userRow.stripeSubscriptionId) {
        throw new TRPCError6({
          code: "PRECONDITION_FAILED",
          message: "You already have an active subscription. Cancel it first before switching to pay-as-you-go."
        });
      }
      await database.update(users).set({ subscriptionTier: "artist_pro" }).where(eq5(users.id, ctx.user.id));
      return { success: true, tier: "artist_pro" };
    })
  }),
  portfolio: router({
    get: publicProcedure.input(z7.object({ artistId: z7.number() })).query(async ({ input }) => {
      return await getPortfolioByArtistId(input.artistId);
    }),
    getUploadUrl: artistOwnerProcedure.input(
      z7.object({
        artistId: z7.number(),
        fileName: z7.string(),
        contentType: z7.string()
      })
    ).mutation(async ({ ctx, input }) => {
      const tier = ctx.user?.subscriptionTier ?? "artist_free";
      const limit = getArtistTierLimits(tier).portfolioPhotos;
      const currentCount = await getPortfolioCountByArtistId(
        input.artistId
      );
      if (currentCount >= limit) {
        throw new TRPCError6({
          code: "FORBIDDEN",
          message: `You have reached your tier's portfolio limit (${limit}). Please upgrade to add more images.`
        });
      }
      const sanitizedFileName = sanitizeFileName3(input.fileName);
      const fileKey = `public/${input.artistId}/${Date.now()}-${sanitizedFileName}`;
      return await createSignedUploadUrl(BUCKETS.PORTFOLIO_IMAGES, fileKey);
    }),
    add: artistOwnerProcedure.input(
      z7.object({
        artistId: z7.number(),
        imageKey: z7.string(),
        caption: z7.string().optional(),
        style: z7.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const tier = ctx.user?.subscriptionTier ?? "artist_free";
      const limit = getArtistTierLimits(tier).portfolioPhotos;
      const currentCount = await getPortfolioCountByArtistId(
        input.artistId
      );
      if (currentCount >= limit) {
        throw new TRPCError6({
          code: "FORBIDDEN",
          message: `You have reached your tier's portfolio limit (${limit}). Please upgrade to add more images.`
        });
      }
      let sanitizedKey = input.imageKey.replace(/\0/g, "");
      sanitizedKey = sanitizedKey.replace(/\\/g, "/");
      sanitizedKey = sanitizedKey.replace(/\/+/g, "/");
      sanitizedKey = sanitizedKey.replace(/\.\./g, "");
      sanitizedKey = sanitizedKey.replace(/^\/+/, "");
      sanitizedKey = sanitizedKey.split("/").filter(Boolean).join("/");
      const expectedPrefix = `public/${input.artistId}/`;
      if (!sanitizedKey.startsWith(expectedPrefix)) {
        throw new Error("Invalid image key: does not belong to this artist");
      }
      const imageUrl = getPublicUrl(BUCKETS.PORTFOLIO_IMAGES, sanitizedKey);
      const result = await addPortfolioImage({
        ...input,
        imageKey: sanitizedKey,
        imageUrl
      });
      analyzePortfolioImage(imageUrl).then(async (analysis) => {
        if (analysis.qualityScore > 0 && result?.id) {
          await updatePortfolioImageAI(result.id, {
            aiStyles: JSON.stringify(analysis.styles),
            aiTags: JSON.stringify(analysis.tags),
            aiDescription: analysis.description,
            qualityScore: analysis.qualityScore,
            qualityIssues: JSON.stringify(analysis.qualityIssues),
            aiProcessedAt: /* @__PURE__ */ new Date(),
            // Auto-fill style if not manually set
            ...!input.style && analysis.styles.length > 0 ? { style: analysis.styles[0] } : {}
          });
        }
      }).catch((err) => {
        console.error("Background AI analysis failed:", err);
      });
      return result;
    }),
    // Re-analyze an existing portfolio image with Gemini Vision
    reanalyze: artistOwnerProcedure.input(z7.object({ id: z7.number(), artistId: z7.number() })).mutation(async ({ input }) => {
      const image = await getPortfolioImageById(input.id);
      if (!image) throw new TRPCError6({ code: "NOT_FOUND", message: "Portfolio image not found" });
      if (image.artistId !== input.artistId) throw new TRPCError6({ code: "FORBIDDEN", message: "Forbidden" });
      const analysis = await analyzePortfolioImage(image.imageUrl);
      if (analysis.qualityScore === 0) {
        throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR", message: "AI analysis failed \u2014 please try again later" });
      }
      await updatePortfolioImageAI(input.id, {
        aiStyles: JSON.stringify(analysis.styles),
        aiTags: JSON.stringify(analysis.tags),
        aiDescription: analysis.description,
        qualityScore: analysis.qualityScore,
        qualityIssues: JSON.stringify(analysis.qualityIssues),
        aiProcessedAt: /* @__PURE__ */ new Date(),
        style: analysis.styles[0] || image.style
      });
      return analysis;
    }),
    delete: protectedProcedure.input(z7.object({ id: z7.number() })).mutation(async ({ ctx, input }) => {
      const image = await getPortfolioImageById(input.id);
      if (!image) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "Portfolio image not found" });
      }
      const artist = await getArtistById(image.artistId);
      if (!artist || artist.userId !== ctx.user.id) {
        throw new TRPCError6({ code: "FORBIDDEN", message: "You can only delete your own portfolio images" });
      }
      try {
        await deleteFile(BUCKETS.PORTFOLIO_IMAGES, image.imageKey);
      } catch (error) {
      }
      return await deletePortfolioImage(input.id);
    })
  }),
  reviews: router({
    getByArtistId: publicProcedure.input(z7.object({ artistId: z7.number() })).query(async ({ input }) => {
      return await getReviewsByArtistId(input.artistId);
    }),
    create: protectedProcedure.input(
      z7.object({
        artistId: z7.number(),
        rating: z7.number().min(1).max(5),
        comment: z7.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const result = await createReview({
        ...input,
        userId: ctx.user.id
      });
      if (input.comment && input.comment.trim().length > 0) {
        analyzeReviewSentiment({
          rating: input.rating,
          comment: input.comment,
          verifiedBooking: false
        }).then(async (analysis) => {
          if (result?.id) {
            let moderationStatus;
            if (analysis.moderationAction === "auto_hide") {
              moderationStatus = "hidden";
            } else if (analysis.moderationAction === "flag_for_review") {
              moderationStatus = "flagged";
            } else {
              moderationStatus = "approved";
            }
            await updateReviewModeration(result.id, {
              moderationStatus,
              moderationFlags: JSON.stringify(analysis.flags),
              toxicityScore: analysis.toxicityScore,
              spamScore: analysis.spamScore,
              fraudScore: analysis.fraudScore,
              moderationReason: analysis.moderationReason,
              moderatedAt: /* @__PURE__ */ new Date()
            });
          }
        }).catch((err) => {
          console.error("Background review moderation failed:", err);
        });
      }
      return result;
    })
  }),
  bookings: router({
    create: protectedProcedure.input(
      z7.object({
        artistId: z7.number(),
        customerName: z7.string().min(1).max(255),
        customerEmail: z7.string().email().max(320),
        customerPhone: z7.string().min(1).max(50),
        preferredDate: z7.date(),
        tattooDescription: z7.string().min(1).max(2e3),
        placement: z7.string().min(1).max(255),
        size: z7.string().min(1).max(100),
        budget: z7.string().max(100).optional(),
        additionalNotes: z7.string().max(2e3).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const sanitizedEmail = sanitizeEmail(input.customerEmail);
      if (!sanitizedEmail) {
        throw new TRPCError6({ code: "BAD_REQUEST", message: "Invalid email address" });
      }
      const booking = await createBooking({
        ...input,
        userId: ctx.user.id,
        customerName: sanitizeInput(input.customerName, 255),
        customerEmail: sanitizedEmail,
        customerPhone: sanitizePhone(input.customerPhone),
        tattooDescription: sanitizeInput(input.tattooDescription, 2e3),
        placement: sanitizeInput(input.placement, 255),
        size: sanitizeInput(input.size, 100),
        budget: input.budget ? sanitizeInput(input.budget, 100) : void 0,
        additionalNotes: input.additionalNotes ? sanitizeInput(input.additionalNotes, 2e3) : void 0
      });
      try {
        const database = await getDb();
        if (database) {
          const [artistWithUser] = await database.select({
            artistId: artists.id,
            shopName: artists.shopName,
            userEmail: users.email,
            userName: users.name,
            subscriptionTier: users.subscriptionTier
          }).from(artists).innerJoin(users, eq5(artists.userId, users.id)).where(eq5(artists.id, input.artistId)).limit(1);
          if (artistWithUser && artistWithUser.userEmail) {
            await sendBookingIntakeNotification(artistWithUser.userEmail, {
              artistName: artistWithUser.userName || artistWithUser.shopName,
              clientName: booking.customerName,
              clientEmail: booking.customerEmail,
              clientPhone: booking.customerPhone,
              tattooDescription: booking.tattooDescription,
              preferredDate: new Date(booking.preferredDate).toLocaleString(),
              placement: booking.placement,
              size: booking.size,
              budget: booking.budget || "N/A",
              additionalNotes: booking.additionalNotes || "N/A"
            });
            if (artistWithUser.subscriptionTier === "artist_free") {
              sendFreeTierPerformanceInsights(artistWithUser.userEmail, {
                artistName: artistWithUser.userName || artistWithUser.shopName,
                inquiryReceived: true
              }).catch((err) => {
                logger.error("Failed to send free tier inquiry performance insights:", err);
              });
            }
          }
        }
      } catch (err) {
        logger.error("Failed to send booking intake notification email:", err);
      }
      return booking;
    }),
    getByUserId: protectedProcedure.query(async ({ ctx }) => {
      return await getBookingsByUserId(ctx.user.id);
    }),
    getByArtistId: artistOwnerProcedure.input(z7.object({ artistId: z7.number() })).query(async ({ input }) => {
      return await getBookingsByArtistId(input.artistId);
    }),
    updateStatus: protectedProcedure.input(
      z7.object({
        id: z7.number(),
        status: z7.enum(["pending", "confirmed", "cancelled", "completed"])
      })
    ).mutation(async ({ ctx, input }) => {
      const booking = await getBookingById(input.id);
      if (!booking) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "Booking not found" });
      }
      const isCustomer = booking.userId === ctx.user.id;
      let isArtist = false;
      const artist = await getArtistById(booking.artistId);
      if (artist && artist.userId === ctx.user.id) {
        isArtist = true;
      }
      if (!isCustomer && !isArtist) {
        throw new TRPCError6({
          code: "FORBIDDEN",
          message: "You can only update your own bookings or bookings for your artist profile"
        });
      }
      if (input.status === "cancelled") {
        let refundProcessed = false;
        let refundId = void 0;
        if (isArtist) {
          if (booking.depositPaid && booking.stripePaymentIntentId) {
            try {
              const { refundPaymentIntent: refundPaymentIntent2 } = await Promise.resolve().then(() => (init_stripe(), stripe_exports));
              const refund = await refundPaymentIntent2(booking.stripePaymentIntentId);
              refundProcessed = true;
              refundId = refund.id;
            } catch (err) {
              logger.error("Failed to auto-refund deposit on artist cancellation:", err);
            }
          }
          await updateBooking(input.id, {
            status: "cancelled",
            cancelledBy: "artist",
            refundStatus: refundProcessed ? "refunded" : "not_requested",
            stripeRefundId: refundId,
            refundProcessedAt: refundProcessed ? /* @__PURE__ */ new Date() : null
          });
          return { success: true };
        } else if (isCustomer) {
          await updateBooking(input.id, {
            status: "cancelled",
            cancelledBy: "client"
          });
          return { success: true };
        }
      }
      return await updateBooking(input.id, { status: input.status });
    }),
    requestRefund: protectedProcedure.input(
      z7.object({
        bookingId: z7.number(),
        reason: z7.string().min(5).max(1e3)
      })
    ).mutation(async ({ ctx, input }) => {
      const booking = await getBookingById(input.bookingId);
      if (!booking) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "Booking not found" });
      }
      if (booking.userId !== ctx.user.id) {
        throw new TRPCError6({
          code: "FORBIDDEN",
          message: "You can only request refunds for your own bookings"
        });
      }
      if (!booking.depositPaid) {
        throw new TRPCError6({
          code: "BAD_REQUEST",
          message: "No deposit has been paid for this booking"
        });
      }
      if (booking.refundStatus !== "not_requested") {
        throw new TRPCError6({
          code: "BAD_REQUEST",
          message: "A refund has already been requested or processed for this booking"
        });
      }
      await updateBooking(input.bookingId, {
        refundStatus: "requested",
        refundReason: sanitizeInput(input.reason, 1e3),
        refundRequestedAt: /* @__PURE__ */ new Date()
      });
      return { success: true };
    }),
    adminGetRefundRequests: adminProcedure.query(async () => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }
      const results = await database.select({
        booking: bookings,
        artistName: artists.shopName,
        clientName: users.name
      }).from(bookings).leftJoin(artists, eq5(bookings.artistId, artists.id)).leftJoin(users, eq5(bookings.userId, users.id)).where(eq5(bookings.refundStatus, "requested")).orderBy(desc3(bookings.refundRequestedAt));
      return results;
    }),
    adminReviewRefund: adminProcedure.input(
      z7.object({
        bookingId: z7.number(),
        approve: z7.boolean()
      })
    ).mutation(async ({ input }) => {
      const booking = await getBookingById(input.bookingId);
      if (!booking) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "Booking not found" });
      }
      if (input.approve) {
        let refundProcessed = false;
        let refundId = void 0;
        if (booking.depositPaid && booking.stripePaymentIntentId) {
          try {
            const { refundPaymentIntent: refundPaymentIntent2 } = await Promise.resolve().then(() => (init_stripe(), stripe_exports));
            const refund = await refundPaymentIntent2(booking.stripePaymentIntentId);
            refundProcessed = true;
            refundId = refund.id;
          } catch (err) {
            throw new TRPCError6({
              code: "INTERNAL_SERVER_ERROR",
              message: `Stripe refund failed: ${err instanceof Error ? err.message : String(err)}`
            });
          }
        }
        await updateBooking(input.bookingId, {
          status: "cancelled",
          refundStatus: "refunded",
          stripeRefundId: refundId,
          refundProcessedAt: /* @__PURE__ */ new Date()
        });
      } else {
        await updateBooking(input.bookingId, {
          refundStatus: "rejected"
        });
      }
      return { success: true };
    })
  }),
  favorites: router({
    add: protectedProcedure.input(z7.object({ artistId: z7.number() })).mutation(async ({ ctx, input }) => {
      return await addFavorite({
        userId: ctx.user.id,
        artistId: input.artistId
      });
    }),
    remove: protectedProcedure.input(z7.object({ artistId: z7.number() })).mutation(async ({ ctx, input }) => {
      return await removeFavorite(ctx.user.id, input.artistId);
    }),
    getByUserId: protectedProcedure.query(async ({ ctx }) => {
      return await getFavoritesByUserId(ctx.user.id);
    }),
    isFavorite: protectedProcedure.input(z7.object({ artistId: z7.number() })).query(async ({ ctx, input }) => {
      return await isFavorite(ctx.user.id, input.artistId);
    })
  }),
  // Client marketplace routers
  clients: clientsRouter,
  requests: requestsRouter,
  bids: bidsRouter,
  shop: shopRouter,
  verification: verificationRouter,
  // Admin moderation
  moderation: router({
    /**
     * Get all flagged/hidden reviews for admin review.
     */
    getFlaggedReviews: adminProcedure.query(async () => {
      return await getFlaggedReviews();
    }),
    /**
     * Admin: Update moderation status of a review (approve, keep flagged, hide).
     */
    updateReviewStatus: adminProcedure.input(
      z7.object({
        reviewId: z7.number(),
        status: z7.enum(["approved", "flagged", "hidden"]),
        notes: z7.string().optional()
      })
    ).mutation(async ({ input }) => {
      return await updateReviewModeration(input.reviewId, {
        moderationStatus: input.status,
        moderationReason: input.notes || void 0
      });
    }),
    /**
     * Admin: Re-analyze a review with Gemini.
     */
    reanalyzeReview: adminProcedure.input(z7.object({ reviewId: z7.number() })).mutation(async ({ input }) => {
      const review = await getReviewById(input.reviewId);
      if (!review) throw new TRPCError6({ code: "NOT_FOUND", message: "Review not found" });
      const analysis = await analyzeReviewSentiment({
        rating: review.rating,
        comment: review.comment,
        verifiedBooking: review.verifiedBooking ?? false
      });
      let moderationStatus;
      if (analysis.moderationAction === "auto_hide") {
        moderationStatus = "hidden";
      } else if (analysis.moderationAction === "flag_for_review") {
        moderationStatus = "flagged";
      } else {
        moderationStatus = "approved";
      }
      await updateReviewModeration(input.reviewId, {
        moderationStatus,
        moderationFlags: JSON.stringify(analysis.flags),
        toxicityScore: analysis.toxicityScore,
        spamScore: analysis.spamScore,
        fraudScore: analysis.fraudScore,
        moderationReason: analysis.moderationReason,
        moderatedAt: /* @__PURE__ */ new Date()
      });
      return analysis;
    })
  }),
  flash: router({
    getUploadUrl: artistOwnerProcedure.input(
      z7.object({
        artistId: z7.number(),
        fileName: z7.string(),
        contentType: z7.string()
      })
    ).mutation(async ({ ctx, input }) => {
      const tier = ctx.user?.subscriptionTier ?? "artist_free";
      if (tier !== "artist_elite") {
        throw new TRPCError6({
          code: "FORBIDDEN",
          message: "Only Elite Icon tier artists can post flash art on the front page."
        });
      }
      const sanitizedFileName = sanitizeFileName3(input.fileName);
      const fileKey = `public/${input.artistId}/flash-${Date.now()}-${sanitizedFileName}`;
      return await createSignedUploadUrl(BUCKETS.PORTFOLIO_IMAGES, fileKey);
    }),
    create: artistOwnerProcedure.input(
      z7.object({
        artistId: z7.number(),
        imageUrl: z7.string().url(),
        imageKey: z7.string(),
        title: z7.string().min(1).max(255),
        description: z7.string().max(2e3).optional(),
        price: z7.number().int().positive(),
        depositAmount: z7.number().int().positive()
      })
    ).mutation(async ({ ctx, input }) => {
      const tier = ctx.user?.subscriptionTier ?? "artist_free";
      if (tier !== "artist_elite") {
        throw new TRPCError6({
          code: "FORBIDDEN",
          message: "Only Elite Icon tier artists can post flash art."
        });
      }
      if (input.depositAmount > input.price) {
        throw new TRPCError6({
          code: "BAD_REQUEST",
          message: "Deposit amount cannot exceed the total price."
        });
      }
      return await createFlashArt({
        ...input,
        title: sanitizeInput(input.title, 255),
        description: input.description ? sanitizeInput(input.description, 2e3) : void 0
      });
    }),
    delete: artistOwnerProcedure.input(
      z7.object({
        id: z7.number(),
        artistId: z7.number()
      })
    ).mutation(async ({ ctx, input }) => {
      const tier = ctx.user?.subscriptionTier ?? "artist_free";
      if (tier !== "artist_elite") {
        throw new TRPCError6({
          code: "FORBIDDEN",
          message: "Only Elite Icon tier artists can manage flash art."
        });
      }
      const flash = await getFlashArtById(input.id);
      if (!flash || flash.artistId !== input.artistId) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "Flash art not found" });
      }
      const deleted = await deleteFlashArt(input.id, input.artistId);
      if (deleted) {
        try {
          await deleteFile(BUCKETS.PORTFOLIO_IMAGES, deleted.imageKey);
        } catch (err) {
          logger.warn("Failed to delete flash art image from storage", { key: deleted.imageKey, err });
        }
      }
      return { success: true };
    }),
    getMyFlash: artistOwnerProcedure.input(z7.object({ artistId: z7.number() })).query(async ({ ctx, input }) => {
      const tier = ctx.user?.subscriptionTier ?? "artist_free";
      if (tier !== "artist_elite") {
        throw new TRPCError6({
          code: "FORBIDDEN",
          message: "Only Elite Icon tier artists have access to flash art management."
        });
      }
      return await getFlashArtByArtistId(input.artistId);
    }),
    getAllActive: publicProcedure.query(async () => {
      return await getAllActiveFlashArt();
    }),
    getByArtistId: publicProcedure.input(z7.object({ artistId: z7.number() })).query(async ({ input }) => {
      const database = await getDb();
      if (!database) return [];
      return await database.select().from(flashArt).where(and4(eq5(flashArt.artistId, input.artistId), eq5(flashArt.isLocked, false))).orderBy(desc3(flashArt.createdAt));
    }),
    createLockCheckout: protectedProcedure.input(
      z7.object({
        flashId: z7.number(),
        preferredDate: z7.string(),
        // ISO String
        customerPhone: z7.string().min(1).max(50),
        successUrl: z7.string().url(),
        cancelUrl: z7.string().url()
      })
    ).mutation(async ({ ctx, input }) => {
      const flash = await getFlashArtById(input.flashId);
      if (!flash) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "Flash art not found" });
      }
      if (flash.isLocked) {
        throw new TRPCError6({ code: "BAD_REQUEST", message: "This flash piece is already locked." });
      }
      const artist = await getArtistById(flash.artistId);
      if (!artist) {
        throw new TRPCError6({ code: "NOT_FOUND", message: "Artist not found" });
      }
      const session = await createCheckoutSession({
        priceInCents: flash.depositAmount,
        productName: `Lock Flash: "${flash.title}"`,
        productDescription: `Non-refundable deposit to claim and book this custom flash art by ${artist.shopName}.`,
        customerEmail: ctx.user.email ?? "",
        metadata: {
          paymentType: "flash_deposit",
          flashId: String(flash.id),
          userId: String(ctx.user.id),
          preferredDate: input.preferredDate,
          customerPhone: input.customerPhone,
          customerName: ctx.user.name || "",
          customerEmail: ctx.user.email || ""
        },
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl
      });
      return { checkoutUrl: session.url };
    })
  }),
  // ── AI Tattoo Generation ──────────────────────
  ai: aiRouter
});

// backend/server/_core/context.ts
init_supabase();
init_db();
init_schema();
import { eq as eq6 } from "drizzle-orm";
async function createContext(opts) {
  let user = null;
  try {
    const authHeader = opts.req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "") || opts.req.cookies?.[COOKIE_NAME];
    if (token) {
      const {
        data: { user: supabaseUser },
        error
      } = await supabaseAdmin.auth.getUser(token);
      if (!error && supabaseUser) {
        const db = await getDb();
        if (db) {
          const [dbUser] = await db.select().from(users).where(eq6(users.openId, supabaseUser.id)).limit(1);
          user = dbUser || null;
        }
      }
    }
  } catch (error) {
    console.error("[Context] Authentication error:", error);
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user,
    artist: null
  };
}

// backend/server/_core/vite.ts
import express from "express";
import fs from "fs";
import path5 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path4 from "path";
import { defineConfig } from "vite";
var plugins = [react(), tailwindcss()];
if (process.env.VITE_ENABLE_JSX_LOC === "true") {
  plugins.push(jsxLocPlugin());
}
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path4.resolve(import.meta.dirname, "frontend/client", "src"),
      "@shared": path4.resolve(import.meta.dirname, "backend/shared"),
      "@assets": path4.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path4.resolve(import.meta.dirname),
  root: path4.resolve(import.meta.dirname, "frontend/client"),
  publicDir: path4.resolve(import.meta.dirname, "frontend/client", "public"),
  build: {
    outDir: path4.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1e3
  },
  server: {
    host: true,
    hmr: {
      overlay: false
    },
    allowedHosts: ["localhost", "127.0.0.1"],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// backend/server/_core/vite.ts
function resolveWorkspaceRoot() {
  const candidates = [
    process.cwd(),
    path5.resolve(import.meta.dirname, "../../.."),
    path5.resolve(import.meta.dirname, "..")
  ];
  const matched = candidates.find(
    (candidate) => fs.existsSync(path5.resolve(candidate, "frontend", "client", "index.html"))
  );
  if (matched) {
    return matched;
  }
  throw new Error(
    `Could not locate workspace root. Checked: ${candidates.join(", ")}`
  );
}
function resolveClientTemplatePath(workspaceRoot) {
  return path5.resolve(workspaceRoot, "frontend", "client", "index.html");
}
async function setupVite(app2, server) {
  const workspaceRoot = resolveWorkspaceRoot();
  const clientRoot = path5.resolve(workspaceRoot, "frontend", "client");
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    envDir: workspaceRoot,
    root: clientRoot,
    publicDir: path5.resolve(clientRoot, "public"),
    resolve: {
      alias: {
        "@": path5.resolve(clientRoot, "src"),
        "@shared": path5.resolve(workspaceRoot, "backend", "shared"),
        "@assets": path5.resolve(workspaceRoot, "attached_assets")
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("/{*splat}", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = resolveClientTemplatePath(workspaceRoot);
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function resolveDistPath() {
  const candidates = [
    path5.resolve(import.meta.dirname, "public"),
    path5.resolve(process.cwd(), "dist", "public"),
    path5.resolve(import.meta.dirname, "../..", "dist", "public")
  ];
  const matched = candidates.find((candidate) => fs.existsSync(candidate));
  if (matched) {
    return matched;
  }
  throw new Error(
    `Could not find the build directory. Checked: ${candidates.join(", ")}`
  );
}
function serveStatic(app2) {
  const distPath = resolveDistPath();
  app2.use(express.static(distPath));
  app2.use("/{*splat}", (_req, res) => {
    res.sendFile(path5.resolve(distPath, "index.html"));
  });
}

// backend/server/webhookHandler.ts
init_stripe();
init_db();
init_db();
init_schema();
init_logger();
import { eq as eq8 } from "drizzle-orm";

// backend/server/webhookQueue.ts
init_db();
init_schema();
init_logger();
import { eq as eq7, and as and5, lte, inArray } from "drizzle-orm";
var RETRY_DELAYS = [
  1 * 60 * 1e3,
  // 1 minute
  5 * 60 * 1e3,
  // 5 minutes
  15 * 60 * 1e3,
  // 15 minutes
  60 * 60 * 1e3,
  // 1 hour
  4 * 60 * 60 * 1e3
  // 4 hours
];
var MAX_RETRIES2 = 5;
var PROCESSING_TIMEOUT_MS = 3e4;
async function queueWebhookForRetry(eventId, eventType, payload, error) {
  const db = await getDb();
  if (!db) return;
  try {
    const existing = await db.select().from(webhookQueue).where(eq7(webhookQueue.eventId, eventId)).limit(1);
    if (existing.length > 0) {
      logger.debug("Webhook event already in queue", { eventId });
      return;
    }
    const nextRetryAt = new Date(Date.now() + RETRY_DELAYS[0]);
    await db.insert(webhookQueue).values({
      eventId,
      eventType,
      payload: JSON.stringify(payload),
      status: "pending",
      retryCount: 0,
      maxRetries: MAX_RETRIES2,
      nextRetryAt,
      lastError: error ?? null
    });
    logger.info("Webhook event queued for retry", {
      eventId,
      eventType,
      nextRetryAt
    });
  } catch (err) {
    logger.error("Failed to queue webhook for retry", {
      eventId,
      error: err instanceof Error ? err.message : String(err)
    });
  }
}
async function processWebhookQueue(processor) {
  const db = await getDb();
  if (!db) return 0;
  const now = /* @__PURE__ */ new Date();
  let processedCount = 0;
  try {
    const pendingEvents = await db.select().from(webhookQueue).where(
      and5(
        eq7(webhookQueue.status, "pending"),
        lte(webhookQueue.nextRetryAt, now)
      )
    ).limit(10);
    if (pendingEvents.length === 0) {
      return 0;
    }
    logger.debug("Processing webhook queue", { count: pendingEvents.length });
    for (const event of pendingEvents) {
      try {
        await db.update(webhookQueue).set({ status: "processing", updatedAt: now }).where(eq7(webhookQueue.id, event.id));
        const payload = JSON.parse(event.payload);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error("Processing timeout")),
            PROCESSING_TIMEOUT_MS
          );
        });
        await Promise.race([
          processor(event.eventType, payload),
          timeoutPromise
        ]);
        await db.update(webhookQueue).set({ status: "completed", updatedAt: /* @__PURE__ */ new Date() }).where(eq7(webhookQueue.id, event.id));
        logger.info("Webhook event processed successfully", {
          eventId: event.eventId,
          eventType: event.eventType,
          retryCount: event.retryCount
        });
        processedCount++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const newRetryCount = event.retryCount + 1;
        if (newRetryCount >= MAX_RETRIES2) {
          await db.update(webhookQueue).set({
            status: "failed",
            retryCount: newRetryCount,
            lastError: errorMessage,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq7(webhookQueue.id, event.id));
          logger.error("Webhook event permanently failed after max retries", {
            eventId: event.eventId,
            eventType: event.eventType,
            retryCount: newRetryCount,
            lastError: errorMessage
          });
        } else {
          const delayIndex = Math.min(newRetryCount, RETRY_DELAYS.length - 1);
          const nextRetryAt = new Date(Date.now() + RETRY_DELAYS[delayIndex]);
          await db.update(webhookQueue).set({
            status: "pending",
            retryCount: newRetryCount,
            nextRetryAt,
            lastError: errorMessage,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq7(webhookQueue.id, event.id));
          logger.warn("Webhook event retry failed, scheduling next attempt", {
            eventId: event.eventId,
            eventType: event.eventType,
            retryCount: newRetryCount,
            nextRetryAt,
            error: errorMessage
          });
        }
      }
    }
    return processedCount;
  } catch (err) {
    logger.error("Failed to process webhook queue", {
      error: err instanceof Error ? err.message : String(err)
    });
    return processedCount;
  }
}
async function getQueueStats() {
  const db = await getDb();
  const defaultStats = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0
  };
  if (!db) return defaultStats;
  try {
    const allItems = await db.select().from(webhookQueue);
    const stats = {
      ...defaultStats,
      total: allItems.length
    };
    for (const item of allItems) {
      switch (item.status) {
        case "pending":
          stats.pending++;
          break;
        case "processing":
          stats.processing++;
          break;
        case "completed":
          stats.completed++;
          break;
        case "failed":
          stats.failed++;
          break;
      }
    }
    return stats;
  } catch (e) {
    logger.error("Failed to get queue stats", { error: e.message });
    return defaultStats;
  }
}
var processorInterval = null;
function startQueueProcessor(processor, intervalMs = 6e4) {
  if (processorInterval) {
    logger.warn("Queue processor already running");
    return;
  }
  logger.info("Starting webhook queue processor", { intervalMs });
  processorInterval = setInterval(async () => {
    const processed = await processWebhookQueue(processor);
    if (processed > 0) {
      logger.debug("Queue processor completed cycle", { processed });
    }
  }, intervalMs);
  processWebhookQueue(processor).catch((err) => {
    logger.error("Initial queue processing failed", { error: String(err) });
  });
}

// backend/server/webhookHandler.ts
var processorStarted = false;
function initWebhookProcessor() {
  if (processorStarted) return;
  startQueueProcessor(async (eventType, payload) => {
    await processWebhookEvent(eventType, payload);
  }, 6e4);
  processorStarted = true;
  logger.info("Webhook retry processor initialized");
}
async function processWebhookEvent(eventType, event) {
  switch (eventType) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.metadata?.paymentType === "request_addons") {
        await handleRequestAddonCheckoutCompleted(session);
        break;
      }
      if (session.metadata?.paymentType === "flash_deposit") {
        await handleFlashDepositCheckoutCompleted(session);
        break;
      }
      if (session.mode === "subscription") {
        await handleSubscriptionCheckoutCompleted(session);
        break;
      }
      const bookingId = parseInt(session.metadata?.bookingId || "0", 10);
      if (!bookingId || isNaN(bookingId) || bookingId <= 0) {
        logger.warn(
          "Webhook received checkout.session.completed with invalid bookingId",
          {
            sessionId: session.id,
            hasPaymentIntent: !!session.payment_intent
          }
        );
        return;
      }
      const existingBooking = await getBookingById(bookingId);
      if (existingBooking && (Boolean(existingBooking.depositPaid) || existingBooking.status === "confirmed")) {
        logger.debug("Webhook duplicate detected - booking already processed", {
          bookingId
        });
        return;
      }
      const depositAmount = session.amount_total ? Number(session.amount_total) : 0;
      await withTransaction(async (tx) => {
        await updateBooking(bookingId, {
          stripePaymentIntentId: session.payment_intent,
          depositAmount,
          depositPaid: true,
          status: "confirmed"
        }, tx);
      });
      logger.info("Payment confirmed for booking", { bookingId });
      break;
    }
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      logger.debug("Payment intent succeeded", { stripeId: paymentIntent.id });
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      logger.warn("Payment intent failed", {
        stripeId: paymentIntent.id,
        amount: paymentIntent.amount
      });
      const bookingId = paymentIntent.metadata?.bookingId ? parseInt(paymentIntent.metadata.bookingId, 10) : null;
      if (bookingId && !isNaN(bookingId) && bookingId > 0) {
        await updateBooking(bookingId, {
          status: "cancelled",
          stripePaymentIntentId: paymentIntent.id
        });
      } else {
        logger.warn(
          "Could not update booking for failed payment - missing or invalid bookingId"
        );
      }
      break;
    }
    // ============================================
    // CLIENT SUBSCRIPTION LIFECYCLE
    // ============================================
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      await handleSubscriptionChange(subscription, eventType);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      await handleSubscriptionCancelled(subscription);
      break;
    }
    default:
      logger.debug("Received unhandled webhook event type", { eventType });
  }
}
async function handleFlashDepositCheckoutCompleted(session) {
  const flashId = parseInt(session.metadata?.flashId || "0", 10);
  const userId = parseInt(session.metadata?.userId || "0", 10);
  const preferredDate = session.metadata?.preferredDate ? new Date(session.metadata.preferredDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
  const customerPhone = session.metadata?.customerPhone || "";
  const customerName = session.metadata?.customerName || "";
  const customerEmail = session.metadata?.customerEmail || "";
  if (!flashId || isNaN(flashId) || flashId <= 0) {
    logger.warn("Flash deposit checkout missing valid flashId", {
      sessionId: session.id
    });
    return;
  }
  const flash = await getFlashArtById(flashId);
  if (!flash) {
    logger.warn("Flash art piece not found in database", { flashId });
    return;
  }
  if (flash.isLocked) {
    logger.debug("Flash art piece is already locked, skipping processing", { flashId });
    return;
  }
  const depositAmount = session.amount_total ? Number(session.amount_total) : flash.depositAmount;
  const database = await getDb();
  if (!database) throw new Error("Database not available for flash locking");
  await database.transaction(async (tx) => {
    await tx.update(flashArt).set({ isLocked: true, lockedByUserId: userId, updatedAt: /* @__PURE__ */ new Date() }).where(eq8(flashArt.id, flashId));
    const [booking] = await tx.insert(bookings).values({
      artistId: flash.artistId,
      userId: userId || null,
      customerName: customerName || "Guest Collector",
      customerEmail: customerEmail || "guest@inkedconnect.com",
      customerPhone: customerPhone || "N/A",
      preferredDate,
      tattooDescription: `Locked Flash Art: "${flash.title}" (ID: ${flash.id})`,
      placement: "See Flash Art",
      size: "Custom (Flash Art)",
      depositAmount,
      depositPaid: true,
      status: "confirmed",
      stripePaymentIntentId: session.payment_intent || null
    }).returning();
    logger.info("Flash art locked and booking created successfully", {
      flashId,
      bookingId: booking.id
    });
  });
  try {
    const [artistWithUser] = await database.select({
      artistId: artists.id,
      shopName: artists.shopName,
      userEmail: users.email,
      userName: users.name
    }).from(artists).innerJoin(users, eq8(artists.userId, users.id)).where(eq8(artists.id, flash.artistId)).limit(1);
    if (artistWithUser && artistWithUser.userEmail) {
      await sendBookingIntakeNotification(artistWithUser.userEmail, {
        artistName: artistWithUser.userName || artistWithUser.shopName,
        clientName: customerName || "Guest Collector",
        clientEmail: customerEmail || "guest@inkedconnect.com",
        clientPhone: customerPhone || "N/A",
        tattooDescription: `Locked Flash Art: "${flash.title}"`,
        preferredDate: preferredDate.toLocaleString(),
        placement: "See Flash Art",
        size: "Custom (Flash Art)",
        budget: String(flash.price / 100) + " USD",
        additionalNotes: `Flash piece total price is $${(flash.price / 100).toFixed(2)}. Deposit paid is $${(depositAmount / 100).toFixed(2)}.`
      });
    }
  } catch (err) {
    logger.error("Failed to send booking intake notification email for locked flash:", err);
  }
}
async function handleRequestAddonCheckoutCompleted(session) {
  const rawRequestId = session.metadata?.requestId;
  const requestId = rawRequestId ? parseInt(rawRequestId, 10) : 0;
  if (!requestId || isNaN(requestId) || requestId <= 0) {
    logger.warn("Request add-on checkout missing valid requestId", {
      sessionId: session.id
    });
    return;
  }
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available for request add-on webhook");
  }
  await database.update(tattooRequests).set({
    addOnPaymentStatus: REQUEST_ADDON_PAYMENT_STATUSES.PAID,
    addOnStripePaymentIntentId: paymentIntentId ?? null,
    addOnPaidAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq8(tattooRequests.id, requestId));
  logger.info("Request add-on payment marked paid", {
    requestId,
    sessionId: session.id,
    paymentIntentId
  });
}
function parseUserIdFromMetadata(metadata) {
  const raw = metadata?.userId;
  if (!raw) return null;
  const userId = parseInt(raw, 10);
  if (isNaN(userId) || userId <= 0) return null;
  return userId;
}
async function resolveUserForSubscription(database, stripeCustomerId, metadata) {
  let user;
  if (stripeCustomerId) {
    [user] = await database.select({ id: users.id, stripeCustomerId: users.stripeCustomerId }).from(users).where(eq8(users.stripeCustomerId, stripeCustomerId)).limit(1);
  }
  if (!user) {
    const metadataUserId = parseUserIdFromMetadata(metadata);
    if (metadataUserId) {
      [user] = await database.select({ id: users.id, stripeCustomerId: users.stripeCustomerId }).from(users).where(eq8(users.id, metadataUserId)).limit(1);
    }
  }
  return user;
}
async function handleSubscriptionCheckoutCompleted(session) {
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  const database = await getDb();
  if (!database) {
    throw new Error(
      "Database not available for subscription checkout completion webhook"
    );
  }
  const user = await resolveUserForSubscription(
    database,
    customerId ?? "",
    session.metadata
  );
  if (!user) {
    logger.warn("No user found for completed subscription checkout", {
      sessionId: session.id,
      stripeCustomerId: customerId,
      subscriptionId,
      metadataUserId: session.metadata?.userId
    });
    return;
  }
  await database.transaction(async (tx) => {
    const userUpdate = { updatedAt: /* @__PURE__ */ new Date() };
    if (customerId) userUpdate.stripeCustomerId = customerId;
    if (subscriptionId) userUpdate.stripeSubscriptionId = subscriptionId;
    await tx.update(users).set(userUpdate).where(eq8(users.id, user.id));
  });
  logger.info("Subscription checkout completed and customer reconciled", {
    userId: user.id,
    sessionId: session.id,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId
  });
}
async function handleSubscriptionChange(subscription, eventType) {
  const stripeCustomerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const priceId = subscription.items.data[0]?.price?.id || subscription.items.data[0]?.plan?.id;
  if (!priceId) {
    logger.warn("Subscription event missing plan price ID", {
      eventType,
      subscriptionId: subscription.id
    });
    return;
  }
  const artistTier = stripePriceToArtistTier(priceId);
  if (artistTier) {
    await handleArtistSubscriptionChange(subscription, artistTier, eventType);
    return;
  }
  logger.debug(
    "Subscription price does not match any known artist tier",
    {
      priceId,
      subscriptionId: subscription.id
    }
  );
}
async function handleArtistSubscriptionChange(subscription, tier, eventType) {
  const stripeCustomerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const grantableStatuses = /* @__PURE__ */ new Set(["active", "trialing"]);
  if (!grantableStatuses.has(subscription.status)) {
    logger.info("Skipping artist tier grant for non-grantable subscription status", {
      subscriptionId: subscription.id,
      status: subscription.status,
      eventType
    });
    return;
  }
  const database = await getDb();
  if (!database) throw new Error("Database not available for artist subscription webhook");
  const user = await resolveUserForSubscription(database, stripeCustomerId, subscription.metadata);
  if (!user) {
    logger.warn("No user found for artist subscription change", {
      stripeCustomerId,
      subscriptionId: subscription.id
    });
    return;
  }
  await database.transaction(async (tx) => {
    await tx.update(users).set({ stripeCustomerId, subscriptionTier: tier, stripeSubscriptionId: subscription.id, updatedAt: /* @__PURE__ */ new Date() }).where(eq8(users.id, user.id));
    const isFoundingArtist = subscription.metadata?.isFoundingArtist === "true";
    const artistUpdate = { updatedAt: /* @__PURE__ */ new Date() };
    if (isFoundingArtist) {
      artistUpdate.isFoundingArtist = true;
      const trialEnd = subscription.trial_end;
      artistUpdate.foundingTrialEndsAt = trialEnd ? new Date(trialEnd * 1e3) : null;
    }
    await tx.update(artists).set(artistUpdate).where(eq8(artists.userId, user.id));
  });
  logger.info("Artist subscription changed", {
    userId: user.id,
    tier,
    subscriptionId: subscription.id,
    eventType
  });
}
async function handleSubscriptionCancelled(subscription) {
  const stripeCustomerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const database = await getDb();
  if (!database) {
    throw new Error(
      "Database not available for subscription cancellation webhook"
    );
  }
  const user = await resolveUserForSubscription(
    database,
    stripeCustomerId,
    subscription.metadata
  );
  if (!user) {
    logger.warn(
      "No user found for stripeCustomerId during subscription cancellation",
      {
        stripeCustomerId,
        subscriptionId: subscription.id
      }
    );
    return;
  }
  const [artistRow] = await database.select({ id: artists.id }).from(artists).where(eq8(artists.userId, user.id)).limit(1);
  const isArtist = !!artistRow;
  await database.transaction(async (tx) => {
    if (isArtist) {
      await tx.update(users).set({
        subscriptionTier: "artist_free",
        stripeSubscriptionId: null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq8(users.id, user.id));
      await tx.update(artists).set({
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq8(artists.userId, user.id));
    } else {
      await tx.update(users).set({
        subscriptionTier: "client_free",
        stripeSubscriptionId: null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq8(users.id, user.id));
      await tx.update(clients).set({
        aiCredits: 0,
        stripeSubscriptionId: null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq8(clients.userId, user.id));
    }
  });
  logger.info(
    `${isArtist ? "Artist" : "Client"} subscription cancelled \u2014 downgraded to free`,
    {
      userId: user.id,
      subscriptionId: subscription.id,
      isArtist
    }
  );
}
async function handleStripeWebhook(req, res) {
  const signature = req.headers["stripe-signature"];
  if (!signature || typeof signature !== "string") {
    logger.warn("Webhook request missing stripe-signature header");
    return res.status(400).send("Missing signature");
  }
  let event;
  try {
    event = await constructWebhookEvent(req.body, signature);
    logger.debug("Processing webhook event", {
      eventType: event.type,
      eventId: event.id
    });
  } catch (error) {
    logger.error("Webhook signature verification failed", {
      error: error instanceof Error ? error.message : String(error)
    });
    return res.status(400).send(
      `Webhook Error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
  if (event.id.startsWith("evt_test_")) {
    logger.info("Test event received and verified");
    return res.json({
      verified: true
    });
  }
  try {
    await processWebhookEvent(event.type, event);
    res.json({ received: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Webhook processing failed, queueing for retry", {
      eventId: event.id,
      eventType: event.type,
      error: errorMessage
    });
    await queueWebhookForRetry(event.id, event.type, event, errorMessage);
    res.json({ received: true, queued: true });
  }
}
async function getWebhookQueueStats() {
  return getQueueStats();
}

// backend/server/_core/index.ts
init_env();
init_logger();
init_supabaseStorage();
init_sentry();
import crypto3 from "crypto";
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
function isBundledDistRuntime() {
  return path6.basename(import.meta.dirname).toLowerCase() === "dist";
}
function parseAllowedOrigins() {
  const fromEnv = ENV.corsAllowedOrigins?.split(",").map((origin) => origin.trim()).filter(Boolean);
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }
  return ENV.isProduction ? [
    "https://inkedconnect.com",
    "https://www.inkedconnect.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ] : ["http://localhost:3000", "http://localhost:5173"];
}
var allowedOrigins = parseAllowedOrigins();
var require2 = createRequire(import.meta.url);
var app = express2();
app.set("trust proxy", 1);
initSentry();
app.use((req, res, next) => {
  const requestId = req.headers["x-request-id"] || crypto3.randomUUID();
  res.setHeader("X-Request-ID", requestId);
  requestStorage.run({ requestId }, () => {
    globalThis.__requestStorageStore = { requestId };
    next();
  });
});
app.use(
  helmet({
    contentSecurityPolicy: ENV.isProduction ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://js.stripe.com"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          new URL(ENV.supabaseUrl).hostname
        ],
        connectSrc: [
          "'self'",
          ENV.supabaseUrl,
          ENV.supabaseUrl.replace("https://", "wss://"),
          "https://api.stripe.com"
        ],
        frameSrc: [
          "https://js.stripe.com",
          "https://hooks.stripe.com"
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: []
      }
    } : false
  })
);
var compressionMiddleware = null;
try {
  const compressionModule = require2("compression");
  compressionMiddleware = compressionModule();
} catch {
  logger.warn("compression package not found; continuing without response compression");
}
if (compressionMiddleware) {
  app.use(compressionMiddleware);
}
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
    exposedHeaders: ["X-CSRF-Token"]
  })
);
var limiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: "Too many requests from this IP, please try again later.",
      retryAfter: 15
    });
  },
  skip: (req) => {
    if (req.method !== "GET" || !req.path.startsWith("/api/trpc/")) return false;
    const cheapQueries = [
      "healthCheck",
      "artists.getAll",
      "artists.getById",
      "reviews.getForArtist"
    ];
    return cheapQueries.some((query) => req.path.includes(query));
  }
});
app.use("/api/", limiter);
var authLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: "Too many authentication attempts, please try again later.",
      retryAfter: 15
    });
  }
});
app.use("/api/auth/", authLimiter);
var aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: "AI generation limit reached. Please try again in 15 minutes.",
      retryAfter: 15
    });
  },
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req.ip || req.socket.remoteAddress || "unknown");
    const session = req.cookies?.["app_session_id"] || "";
    return `${ip}:${session}`;
  }
});
app.use("/api/trpc/ai.", aiLimiter);
app.post(
  "/api/stripe/webhook",
  express2.raw({ type: "application/json" }),
  handleStripeWebhook
);
app.use(cookieParser());
app.use(express2.json({ limit: "1mb" }));
app.use(express2.urlencoded({ limit: "1mb", extended: true }));
app.use(csrfTokenMiddleware);
app.use(csrfProtectionMiddleware);
registerSupabaseAuthRoutes(app);
app.post("/api/portfolio/enqueue-analysis", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
      return;
    }
    const token = authHeader.substring(7);
    if (token !== ENV.jwtSecret) {
      res.status(401).json({ error: "Unauthorized: Invalid API secret" });
      return;
    }
    const { bucketId, filePath } = req.body;
    const ALLOWED_BUCKETS = ["portfolio-images", "request-images"];
    const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic"];
    if (!bucketId || !ALLOWED_BUCKETS.includes(bucketId)) {
      res.status(400).json({ error: `Invalid or disallowed bucket: ${bucketId}` });
      return;
    }
    if (typeof filePath !== "string" || !filePath.trim()) {
      res.status(400).json({ error: "Invalid or empty filePath" });
      return;
    }
    const lowercasePath = filePath.toLowerCase();
    const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) => lowercasePath.endsWith(ext));
    if (!hasAllowedExtension) {
      res.status(400).json({ error: "File extension not allowed" });
      return;
    }
    const { getPublicUrl: getPublicUrl2 } = await Promise.resolve().then(() => (init_supabaseStorage(), supabaseStorage_exports));
    const { analyzePortfolioImage: analyzePortfolioImage2 } = await Promise.resolve().then(() => (init_geminiVision(), geminiVision_exports));
    const db = await Promise.resolve().then(() => (init_db(), db_exports));
    const imageUrl = getPublicUrl2(bucketId, filePath);
    logger.info("Enqueuing background portfolio image analysis", { bucketId, filePath });
    db.getDb().then(async (database) => {
      if (!database) {
        logger.error("Database unavailable for background analysis update");
        return;
      }
      const { portfolioImages: portfolioImages2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq9 } = await import("drizzle-orm");
      const [existingImage] = await database.select().from(portfolioImages2).where(eq9(portfolioImages2.imageKey, filePath)).limit(1);
      if (!existingImage) {
        logger.warn("No portfolio image database record found yet for key; background analysis postponed or will retry via batch cron", { filePath });
        return;
      }
      analyzePortfolioImage2(imageUrl).then(async (analysis) => {
        if (analysis.qualityScore > 0) {
          await db.updatePortfolioImageAI(existingImage.id, {
            aiStyles: JSON.stringify(analysis.styles),
            aiTags: JSON.stringify(analysis.tags),
            aiDescription: analysis.description,
            qualityScore: analysis.qualityScore,
            qualityIssues: JSON.stringify(analysis.qualityIssues),
            aiProcessedAt: /* @__PURE__ */ new Date()
          });
          logger.info("Background portfolio image analysis completed and updated in database", { imageId: existingImage.id });
        }
      }).catch((err) => {
        logger.error("Background Gemini analysis failed:", err);
      });
    }).catch((err) => {
      logger.error("Failed to load database for background analysis:", err);
    });
    res.status(202).json({ success: true, message: "Analysis enqueued successfully" });
  } catch (error) {
    logger.error("Failed to enqueue image analysis:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/api/csrf-token", (_req, res) => {
  res.status(200).json({ status: "ok" });
});
app.get("/api/health", async (_req, res) => {
  try {
    const db = await Promise.resolve().then(() => (init_db(), db_exports)).then((m) => m.getDb());
    let dbStatus = "disconnected";
    if (db) {
      const { sql: sql5 } = await import("drizzle-orm");
      await db.execute(sql5`SELECT 1`);
      dbStatus = "connected";
    }
    const webhookStats = await getWebhookQueueStats();
    let storageReady = false;
    try {
      const { supabaseAdmin: supabaseAdmin2 } = await Promise.resolve().then(() => (init_supabase(), supabase_exports));
      const { data, error } = await supabaseAdmin2.storage.listBuckets();
      if (!error && data) {
        storageReady = true;
      }
    } catch (err) {
      logger.error("Health check storage ping failed", { error: err });
    }
    let stripeReady = false;
    if (ENV.stripeSecretKey) {
      try {
        const { stripe: stripe2 } = await Promise.resolve().then(() => (init_stripe(), stripe_exports));
        await stripe2.customers.list({ limit: 1 });
        stripeReady = true;
      } catch (err) {
        logger.error("Health check Stripe ping failed", { error: err });
      }
    }
    const overallStatus = dbStatus === "connected" && storageReady && stripeReady ? "ok" : "degraded";
    const httpStatus = dbStatus === "connected" && storageReady ? 200 : 503;
    res.status(httpStatus).json({
      status: overallStatus,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: ENV.nodeEnv,
      dependencies: {
        database: { status: dbStatus },
        storage: { ready: storageReady },
        webhookQueue: webhookStats,
        stripe: { ready: stripeReady }
      },
      version: process.env.npm_package_version || "unknown"
    });
  } catch (error) {
    logger.error("Health check failed", { error });
    res.status(503).json({
      status: "error",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      dependencies: {
        database: { status: "error" },
        storage: { ready: false },
        stripe: { ready: false }
      },
      error: error instanceof Error ? error.message : "Health check failed"
    });
  }
});
app.get("/sitemap.xml", async (_req, res) => {
  try {
    const { getAllArtists: getAllArtists2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    const artists2 = await getAllArtists2();
    const protocol = res.req.protocol || "http";
    const host = res.req.get("host");
    const baseUrl = ENV.publicBaseUrl || (host ? `${protocol}://${host}` : "http://localhost:3000");
    const staticPages = [
      { loc: "/", changefreq: "weekly", priority: "1.0" },
      { loc: "/artists", changefreq: "daily", priority: "0.9" },
      { loc: "/artist-finder", changefreq: "weekly", priority: "0.8" },
      { loc: "/for-artists", changefreq: "monthly", priority: "0.7" },
      { loc: "/pricing", changefreq: "monthly", priority: "0.6" },
      { loc: "/help", changefreq: "monthly", priority: "0.5" }
    ];
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    for (const page of staticPages) {
      xml += `
  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    }
    for (const artist of artists2) {
      const lastmod = artist.updatedAt.toISOString().split("T")[0];
      xml += `
  <url>
    <loc>${baseUrl}/artist/${artist.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }
    xml += `
</urlset>`;
    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch (error) {
    logger.error("Sitemap generation failed", { error });
    res.status(500).send("Error generating sitemap");
  }
});
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);
app.use(sentryErrorHandler());
app.use(
  (err, _req, res, _next) => {
    const statusCode = err.statusCode || err.status || 500;
    captureException2(err, {
      statusCode,
      url: _req.url,
      method: _req.method
    });
    logger.error("Unhandled request error", {
      message: err.message,
      statusCode,
      stack: err.stack
    });
    const isDev2 = !ENV.isProduction;
    res.status(statusCode).json({
      error: "Internal server error",
      ...isDev2 && { details: err.message, stack: err.stack }
    });
  }
);
{
  const server = createServer(app);
  const startServer = async () => {
    try {
      const storageInit = await initializeBuckets();
      logger.info("Supabase storage buckets initialized successfully", {
        existing: storageInit.existing,
        created: storageInit.created
      });
    } catch (error) {
      if (ENV.isProduction) {
        logger.error("FATAL: Storage bucket initialization failed in production", { error });
        process.exit(1);
      } else {
        logger.warn("Storage bucket initialization failed in development (non-fatal)", { error });
      }
    }
    try {
      initWebhookProcessor();
      logger.info("Webhook retry processor initialized");
    } catch (error) {
      logger.error("Failed to initialize webhook processor", { error });
    }
    const useViteDevMiddleware = process.env.NODE_ENV === "development" && !isBundledDistRuntime();
    if (useViteDevMiddleware) {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    const requestedPort = parseInt(process.env.PORT || String(ENV.port || 3e3), 10);
    const isHostedRuntime = ENV.isProduction;
    const port = isHostedRuntime ? requestedPort : await findAvailablePort(requestedPort);
    const host = isHostedRuntime ? "0.0.0.0" : "127.0.0.1";
    server.listen(port, host, () => {
      logger.info(`Server running on http://${host}:${port}/`);
    });
    const shutdown = (signal) => {
      logger.info(`${signal} received \u2014 shutting down gracefully`);
      server.close(() => {
        logger.info("HTTP server closed");
        process.exit(0);
      });
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 1e4).unref();
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  };
  startServer().catch((error) => {
    logger.error("Failed to start server", { error });
    process.exit(1);
  });
}
var index_default = app;
export {
  index_default as default
};
