var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
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
      // Artist subscription Stripe Price IDs (live — created 2026-04-20)
      STRIPE_ARTIST_AMATEUR_PRICE_ID_MONTH: z.string().default("price_1TOraXQRJTQEheTOvLHhTihz"),
      STRIPE_ARTIST_AMATEUR_PRICE_ID_YEAR: z.string().default("price_1TOraXQRJTQEheTOVr8zI9O4"),
      STRIPE_ARTIST_PRO_PRICE_ID_MONTH: z.string().default("price_1TOraYQRJTQEheTO3k4MS3PR"),
      STRIPE_ARTIST_PRO_PRICE_ID_YEAR: z.string().default("price_1TOraYQRJTQEheTOHNQL82m3"),
      STRIPE_ARTIST_ICON_PRICE_ID_MONTH: z.string().default("price_1TOraZQRJTQEheTOofBdpJwM"),
      STRIPE_ARTIST_ICON_PRICE_ID_YEAR: z.string().default("price_1TOraaQRJTQEheTOwDiBtF35"),
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
      CORS_ALLOWED_ORIGINS: z.string().optional(),
      PUBLIC_BASE_URL: z.string().url().optional(),
      PORT: z.string().default("3000")
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
      // Client tier price IDs
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
      corsAllowedOrigins: parsed.data.CORS_ALLOWED_ORIGINS,
      publicBaseUrl: parsed.data.PUBLIC_BASE_URL,
      nodeEnv: parsed.data.NODE_ENV,
      port: parseInt(parsed.data.PORT, 10)
    };
  }
});

// backend/drizzle/schema.ts
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
  unique
} from "drizzle-orm/pg-core";
var roleEnum, bookingStatusEnum, webhookStatusEnum, verificationStatusEnum, users, artists, shops, portfolioImages, reviews, bookings, favorites, webhookQueue, verificationDocuments, requestStatusEnum, bidStatusEnum, clients, tattooRequests, requestImages, bids, requestMessages;
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
      /** @deprecated Read from users.subscriptionTier instead. Kept for backward-compat queries. */
      subscriptionTier: varchar("subscriptionTier", { length: 30 }).$type().default("artist_free").notNull(),
      bidsUsed: integer("bidsUsed").default(0).notNull(),
      /** Number of bids submitted in the current calendar month (resets on 1st of each month) */
      bidsThisMonth: integer("bidsThisMonth").default(0).notNull(),
      /** Tracks which month the bidsThisMonth counter belongs to, format: YYYY-MM */
      bidsMonthYear: varchar("bidsMonthYear", { length: 7 }).default("2000-01").notNull(),
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
      /**
       * @deprecated Read from users.subscriptionTier instead. Kept for backward-compat queries.
       * During the transition, application-level sync propagates users.subscriptionTier → clients.subscriptionTier
       * whenever Stripe webhooks update the user record.
       */
      subscriptionTier: varchar("subscriptionTier", { length: 30 }).default("client_free").notNull(),
      // 'client_free', 'enthusiast', 'elite'
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
  }
});

// backend/server/_core/logger.ts
import winston from "winston";
var isDev, transports, logger;
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
    logger = winston.createLogger({
      level: isDev ? "debug" : "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true })
      ),
      defaultMeta: { service: "tattoo-shops-api" },
      transports
    });
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection at:", { promise, reason });
    });
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", { error });
      process.exit(1);
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
  createArtist: () => createArtist,
  createBooking: () => createBooking,
  createReview: () => createReview,
  deletePortfolioImage: () => deletePortfolioImage,
  discoverArtists: () => discoverArtists,
  getAllArtists: () => getAllArtists,
  getAllShops: () => getAllShops,
  getArtistById: () => getArtistById,
  getArtistByUserId: () => getArtistByUserId,
  getBookingById: () => getBookingById,
  getBookingsByArtistId: () => getBookingsByArtistId,
  getBookingsByUserId: () => getBookingsByUserId,
  getDb: () => getDb,
  getFavoritesByUserId: () => getFavoritesByUserId,
  getFlaggedReviews: () => getFlaggedReviews,
  getPendingVerificationDocuments: () => getPendingVerificationDocuments,
  getPoolStats: () => getPoolStats,
  getPortfolioByArtistId: () => getPortfolioByArtistId,
  getPortfolioCountByArtistId: () => getPortfolioCountByArtistId,
  getPortfolioImageById: () => getPortfolioImageById,
  getReviewById: () => getReviewById,
  getReviewsByArtistId: () => getReviewsByArtistId,
  getUserByOpenId: () => getUserByOpenId,
  getVerificationDocumentById: () => getVerificationDocumentById,
  isFavorite: () => isFavorite,
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
      const dbUrl = process.env.DATABASE_URL;
      _sqlClient = postgres(dbUrl, {
        max: 20,
        // Max connections in pool
        idle_timeout: 30,
        // Close idle connections after 30 seconds
        connect_timeout: 5,
        // 5 second connection timeout
        prepare: false,
        // MUST be false for Supabase (Supavisor/PgBouncer incompatible)
        onnotice: (notice) => {
          logger.debug("Database notice", { message: notice.message });
        },
        onclose: () => {
          logger.warn("Database connection closed");
        }
      });
      _db = drizzle(_sqlClient);
      logger.info("Database connection pool initialized", {
        maxConnections: 20
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
  return _sqlClient.begin(async (sql4) => {
    const txDb = drizzle(sql4);
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
    const [created] = await tx.insert(artists).values(artist).returning();
    return created;
  });
}
async function getArtistByUserId(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(artists).where(eq(artists.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getArtistById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(artists).where(eq(artists.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllArtists() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(artists).where(eq(artists.isApproved, true));
}
async function searchArtists(filters) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(artists.isApproved, true)];
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
  if (filters.city) {
    conditions.push(eq(artists.city, filters.city));
  }
  if (filters.state) {
    conditions.push(eq(artists.state, filters.state));
  }
  return await db.select().from(artists).where(and(...conditions));
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
async function updateBooking(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(bookings).set(data).where(eq(bookings.id, id));
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
    return (await db.select().from(artists).where(eq(artists.isApproved, true))).map((a) => ({
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
    artist: artists
  }).from(portfolioImages).innerJoin(artists, eq(portfolioImages.artistId, artists.id)).where(and(eq(artists.isApproved, true), or(...imageConditions))).orderBy(desc(portfolioImages.qualityScore));
  const artistConditions = [];
  for (const term of allTerms) {
    const likeTerm = `%${term}%`;
    artistConditions.push(sql`${artists.styles} ILIKE ${likeTerm}`);
    artistConditions.push(sql`${artists.specialties} ILIKE ${likeTerm}`);
    artistConditions.push(sql`${artists.bio} ILIKE ${likeTerm}`);
  }
  const matchingArtistsDirect = artistConditions.length > 0 ? await db.select().from(artists).where(and(eq(artists.isApproved, true), or(...artistConditions))) : [];
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
var _db, _sqlClient, _poolStats;
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
  }
});

// backend/server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import path6 from "path";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// backend/server/_core/supabase.ts
init_env();
import { createClient } from "@supabase/supabase-js";
var supabaseAdmin = createClient(
  ENV.supabaseUrl,
  ENV.supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

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
  "artist_amateur",
  "artist_pro",
  "artist_icon",
  "client_free",
  "client_plus",
  "client_elite"
]);
var TIER_LIMITS = {
  artist_free: { portfolioMax: 3, aiCredits: 0, canBook: false },
  artist_amateur: { portfolioMax: 15, aiCredits: 0, canBook: true },
  artist_pro: { portfolioMax: 999, aiCredits: 0, canBook: true },
  artist_icon: { portfolioMax: 999, aiCredits: 0, canBook: true },
  client_free: { portfolioMax: 0, aiCredits: 0, canBook: true },
  client_plus: { portfolioMax: 0, aiCredits: 10, canBook: true },
  client_elite: { portfolioMax: 0, aiCredits: 999, canBook: true }
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
    sameSite: secure ? "none" : "lax",
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

// backend/server/routers.ts
import { TRPCError as TRPCError6 } from "@trpc/server";

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
    return next({ ctx });
  })
);
var artistOwnerProcedure = artistProcedure.use(
  t.middleware(async ({ ctx, next, input }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (ctx.user.role === "admin") return next({ ctx });
    const artist = await getArtistByUserId(ctx.user.id);
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

// backend/server/_core/supabaseStorage.ts
var BUCKETS = {
  PORTFOLIO_IMAGES: "portfolio-images",
  REQUEST_IMAGES: "request-images",
  ID_DOCUMENTS: "id-documents"
};
var BUCKET_CONFIGS = [
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
async function initializeBuckets() {
  const { data: existingBuckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) {
    console.error("[Storage] Failed to list buckets:", listError);
    throw new Error(`Failed to list storage buckets: ${listError.message}`);
  }
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
      } else {
        console.log(`[Storage] Bucket "${config.name}" created successfully.`);
      }
    }
  }
}

// backend/server/clientRouters.ts
import { z as z3 } from "zod";
init_db();
init_schema();
import { eq as eq2, and as and2, desc as desc2, sql as sql2 } from "drizzle-orm";
init_logger();
import { TRPCError as TRPCError2 } from "@trpc/server";
import path from "path";

// backend/server/_core/aiProviders.ts
init_env();
import OpenAI from "openai";
var GROQ_BASE_URL = ENV.groqBaseUrl || "https://api.groq.com/openai/v1";
var DEFAULT_GROQ_MODEL = ENV.groqModel || "llama-3.3-70b-versatile";
var HF_BASE_URL = "https://api-inference.huggingface.co/models";
var DEFAULT_HF_IMAGE_MODEL = ENV.huggingFaceImageModel || "stabilityai/stable-diffusion-xl-base-1.0";
var DEFAULT_HF_CAPTION_MODEL = ENV.huggingFaceCaptionModel || "Salesforce/blip-image-captioning-large";
var DEFAULT_HF_OCR_MODEL = ENV.huggingFaceOcrModel || "microsoft/trocr-base-printed";
var groqClient = new OpenAI({
  apiKey: ENV.groqApiKey,
  baseURL: GROQ_BASE_URL
});
function sleep(ms) {
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
      await sleep(waitMs);
    } catch {
      await sleep(1500);
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

// backend/server/geminiBidOptimizer.ts
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
    const requestContext = [
      `Title: "${request.title}"`,
      `Description: "${request.description}"`,
      request.style ? `Style: ${request.style}` : null,
      `Placement: ${request.placement}`,
      `Size: ${request.size}`,
      request.colorPreference ? `Color Preference: ${request.colorPreference.replace(/_/g, " & ")}` : null,
      request.budgetMin || request.budgetMax ? `Budget: ${request.budgetMin ? `$${(request.budgetMin / 100).toFixed(0)}` : "?"} - ${request.budgetMax ? `$${(request.budgetMax / 100).toFixed(0)}` : "?"}` : null,
      request.desiredTimeframe ? `Timeframe: ${request.desiredTimeframe}` : null
    ].filter(Boolean).join("\n");
    const artistContext = [
      `Shop/Artist Name: ${artist.shopName}`,
      artist.styles ? `Specializes in: ${artist.styles}` : null,
      artist.specialties ? `Known for: ${artist.specialties}` : null,
      artist.experience ? `${artist.experience} years of experience` : null,
      artist.city && artist.state ? `Based in ${artist.city}, ${artist.state}` : null,
      artist.bio ? `Bio: ${artist.bio}` : null
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

// backend/server/stripe.ts
init_env();
import Stripe from "stripe";

// backend/server/_core/circuitBreaker.ts
init_logger();
var circuits = /* @__PURE__ */ new Map();
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
var CircuitBreaker = class {
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
var stripeCircuit = new CircuitBreaker({
  name: "stripe",
  failureThreshold: 5,
  timeout: 6e4
  // 1 minute
});
var supabaseCircuit = new CircuitBreaker({
  name: "supabase",
  failureThreshold: 5,
  timeout: 3e4
});
var emailCircuit = new CircuitBreaker({
  name: "email",
  failureThreshold: 3,
  timeout: 12e4
  // 2 minutes - email services can be slow to recover
});

// backend/server/stripe.ts
if (!ENV.stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is required");
}
var stripe = new Stripe(ENV.stripeSecretKey, {
  apiVersion: "2025-10-29.clover",
  timeout: 3e4,
  // 30 second timeout
  maxNetworkRetries: 2
  // Stripe's built-in retry
});
async function createSubscriptionCheckout({
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
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: "subscription",
      ...stripeCustomerId ? { customer: stripeCustomerId } : { customer_email: customerEmail },
      metadata,
      subscription_data: {
        metadata
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true
    });
    return session;
  });
}
function stripePriceToClientTier(priceId) {
  if (priceId === ENV.stripeClientPlusPriceId) return "client_plus";
  if (priceId === ENV.stripeClientElitePriceId) return "client_elite";
  return null;
}
function stripePriceToArtistTier(priceId) {
  const {
    stripeArtistAmateurPriceIdMonth,
    stripeArtistAmateurPriceIdYear,
    stripeArtistProPriceIdMonth,
    stripeArtistProPriceIdYear,
    stripeArtistIconPriceIdMonth,
    stripeArtistIconPriceIdYear
  } = ENV;
  if (priceId === stripeArtistAmateurPriceIdMonth || priceId === stripeArtistAmateurPriceIdYear)
    return "artist_amateur";
  if (priceId === stripeArtistProPriceIdMonth || priceId === stripeArtistProPriceIdYear)
    return "artist_pro";
  if (priceId === stripeArtistIconPriceIdMonth || priceId === stripeArtistIconPriceIdYear)
    return "artist_icon";
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
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      ...stripeCustomerId ? { customer: stripeCustomerId } : { customer_email: customerEmail },
      metadata,
      subscription_data: { metadata },
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true
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

// backend/server/clientRouters.ts
init_env();

// backend/shared/tierLimits.ts
var TRANSACTION_FEE_RATES = {
  /** Free tier — no bidding, no fee */
  free: 0,
  /** Pro subscriber — reduced fee as reward for subscription */
  amateur: 0.05,
  // 5%
  /** Pay-as-you-go — higher fee, no subscription cost */
  professional: 0.1,
  // 10%
  /** Founding Artist — same as Pro (5%) */
  frontPage: 0.05
  // 5%
};
var TIER_LIMITS2 = {
  // ── Layer 1: Free (Artist Acquisition Funnel) ─────────────────────────────
  free: {
    name: "Free",
    displayName: "Free",
    description: "Get discovered. Build your presence.",
    portfolioPhotos: 10,
    canAcceptBookings: false,
    canShowDirectContact: false,
    canRespondToReviews: false,
    hasAnalytics: false,
    showExactLocation: false,
    isFeatured: false,
    isVerifiedBadge: false,
    /** 0 = bidding completely blocked on free tier */
    bidsPerMonth: 0,
    /** Platform transaction fee on accepted bids */
    transactionFeeRate: TRANSACTION_FEE_RATES.free,
    isFoundingArtist: false
  },
  // ── Layer 2: Pro Subscription ($19–29/mo) ─────────────────────────────────
  amateur: {
    name: "Pro",
    displayName: "Pro",
    description: "The full toolkit. Grow your clientele.",
    portfolioPhotos: Number.MAX_SAFE_INTEGER,
    // Unlimited
    canAcceptBookings: true,
    canShowDirectContact: true,
    canRespondToReviews: true,
    hasAnalytics: true,
    showExactLocation: true,
    isFeatured: false,
    isVerifiedBadge: true,
    /** Unlimited bids for Pro subscribers */
    bidsPerMonth: Number.MAX_SAFE_INTEGER,
    /** Reduced 5% fee as reward for subscription */
    transactionFeeRate: TRANSACTION_FEE_RATES.amateur,
    isFoundingArtist: false
  },
  // ── Layer 3: Pay-as-you-go (No subscription, higher fee) ─────────────────
  professional: {
    name: "Pay-as-you-go",
    displayName: "Pay-as-you-go",
    description: "Bid on clients. Pay only when you win.",
    portfolioPhotos: 10,
    canAcceptBookings: false,
    canShowDirectContact: false,
    canRespondToReviews: false,
    hasAnalytics: false,
    showExactLocation: false,
    isFeatured: false,
    isVerifiedBadge: false,
    /** Unlimited bids — they pay per transaction instead */
    bidsPerMonth: Number.MAX_SAFE_INTEGER,
    /** 10% fee on accepted bids — no subscription required */
    transactionFeeRate: TRANSACTION_FEE_RATES.professional,
    isFoundingArtist: false
  },
  // ── Founding Artist: Pro features + lifetime $19/mo lock-in ──────────────
  frontPage: {
    name: "Founding Artist",
    displayName: "Founding Artist",
    description: "Founding member. Pro features. Locked-in rate for life.",
    portfolioPhotos: Number.MAX_SAFE_INTEGER,
    canAcceptBookings: true,
    canShowDirectContact: true,
    canRespondToReviews: true,
    hasAnalytics: true,
    showExactLocation: true,
    isFeatured: true,
    // Featured badge on profile + homepage carousel
    isVerifiedBadge: true,
    /** Unlimited bids — same as Pro */
    bidsPerMonth: Number.MAX_SAFE_INTEGER,
    /** Same 5% fee as Pro */
    transactionFeeRate: TRANSACTION_FEE_RATES.frontPage,
    isFoundingArtist: true
  }
};
function getTransactionFeeRate(tier) {
  return TIER_LIMITS2[tier]?.transactionFeeRate ?? 0;
}
var CLIENT_TIER_LIMITS = {
  client_free: {
    name: "Collector",
    requestsPerMonth: 1,
    aiGenerationsPerMonth: 0,
    directChatWithArtists: false,
    priorityRequestBoard: false,
    depositFeeWaived: false
  },
  client_plus: {
    name: "Enthusiast",
    requestsPerMonth: 10,
    aiGenerationsPerMonth: 10,
    directChatWithArtists: false,
    priorityRequestBoard: true,
    depositFeeWaived: false
  },
  client_elite: {
    name: "Elite Ink",
    requestsPerMonth: Number.MAX_SAFE_INTEGER,
    // Unlimited
    aiGenerationsPerMonth: Number.MAX_SAFE_INTEGER,
    // Unlimited
    directChatWithArtists: true,
    priorityRequestBoard: true,
    depositFeeWaived: true
  }
};
var CLIENT_TIER_PRICING = {
  client_free: {
    monthly: 0,
    stripePriceIdMonth: null
  },
  client_plus: {
    monthly: 900,
    // $9.00
    stripePriceIdMonth: process.env.STRIPE_CLIENT_PLUS_PRICE_ID ?? null
  },
  client_elite: {
    monthly: 1900,
    // $19.00
    stripePriceIdMonth: process.env.STRIPE_CLIENT_ELITE_PRICE_ID ?? null
  }
};
function getClientTierLimits(tier) {
  return CLIENT_TIER_LIMITS[tier] || CLIENT_TIER_LIMITS.client_free;
}

// backend/shared/tierCompat.ts
var FREE_ARTIST_TIERS = ["artist_free", "free"];
var AI_BID_ASSISTANT_TIERS = [
  "artist_pro",
  "artist_icon",
  "professional",
  "frontPage"
];
function hasTierValue(tier, allowed) {
  return !!tier && allowed.includes(tier);
}
function isFreeArtistTier(tier) {
  return hasTierValue(tier, FREE_ARTIST_TIERS);
}
function canUseAiBidAssistant(tier) {
  return hasTierValue(tier, AI_BID_ASSISTANT_TIERS);
}
var LEGACY_ARTIST_TIER_BY_CANONICAL = {
  artist_free: "free",
  artist_amateur: "amateur",
  artist_pro: "professional",
  artist_icon: "frontPage"
};
function toLegacyArtistTier(tier) {
  return LEGACY_ARTIST_TIER_BY_CANONICAL[tier];
}

// backend/server/clientRouters.ts
init_onboarding();
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
    const [updated] = await db.update(clients).set({ ...input, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(clients.userId, ctx.user.id)).returning();
    if (!updated) {
      throw new TRPCError2({
        code: "NOT_FOUND",
        message: "Client profile not found"
      });
    }
    return updated;
  }),
  /**
   * Create a Stripe Checkout Session for a client subscription upgrade.
   * Returns the Checkout URL to redirect the user to.
   */
  createSubscriptionCheckout: protectedProcedure.input(
    z3.object({
      tier: z3.enum(["client_plus", "client_elite"]),
      successUrl: z3.string().url(),
      cancelUrl: z3.string().url()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [clientProfile] = await db.select().from(clients).where(eq2(clients.userId, ctx.user.id)).limit(1);
    if (!clientProfile) {
      throw new TRPCError2({
        code: "FORBIDDEN",
        message: "Complete client onboarding before upgrading your plan."
      });
    }
    const priceId = input.tier === "client_plus" ? ENV.stripeClientPlusPriceId : ENV.stripeClientElitePriceId;
    if (!priceId) {
      throw new TRPCError2({
        code: "PRECONDITION_FAILED",
        message: `Stripe price for ${input.tier} is not configured. Please contact support.`
      });
    }
    const [user] = await db.select().from(users).where(eq2(users.id, ctx.user.id)).limit(1);
    const session = await createSubscriptionCheckout({
      priceId,
      customerEmail: user?.email ?? "",
      stripeCustomerId: user?.stripeCustomerId ?? void 0,
      metadata: {
        userId: String(ctx.user.id),
        clientId: String(clientProfile.id),
        tier: input.tier
      },
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl
    });
    return { checkoutUrl: session.url };
  })
});
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
  ).query(async ({ input }) => {
    const db = await requireDb();
    const filters = input || { limit: 20, offset: 0 };
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
    }).from(tattooRequests).leftJoin(clients, eq2(tattooRequests.clientId, clients.id)).where(eq2(tattooRequests.status, "open")).orderBy(desc2(tattooRequests.createdAt)).limit(filters.limit ?? 20).offset(filters.offset ?? 0);
    return results.map((r) => ({
      ...r.request,
      client: r.client,
      images: r.images ? JSON.parse(r.images) : [],
      bidCount: Number(r.bidCount)
    }));
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
    const [artist] = await db.select({ subscriptionTier: artists.subscriptionTier }).from(artists).where(eq2(artists.userId, ctx.user.id)).limit(1);
    if (!artist || isFreeArtistTier(artist.subscriptionTier)) {
      throw new TRPCError2({
        code: "FORBIDDEN",
        message: "This feature is only available for paid artist plans."
      });
    }
    const filters = input || { limit: 20, offset: 0 };
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
    }).from(tattooRequests).leftJoin(clients, eq2(tattooRequests.clientId, clients.id)).where(eq2(tattooRequests.status, "open")).orderBy(desc2(tattooRequests.createdAt)).limit(filters.limit ?? 20).offset(filters.offset ?? 0);
    return results.map((r) => ({
      ...r.request,
      client: r.client,
      images: r.images ? JSON.parse(r.images) : [],
      bidCount: Number(r.bidCount)
    }));
  }),
  // Get recent open requests for the homepage feed
  listForHomepage: publicProcedure.query(async () => {
    const db = await requireDb();
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
    }).from(tattooRequests).leftJoin(clients, eq2(tattooRequests.clientId, clients.id)).where(eq2(tattooRequests.status, "open")).orderBy(desc2(tattooRequests.createdAt)).limit(8);
    return results.map((r) => ({
      ...r.request,
      client: r.client,
      images: r.images ? JSON.parse(r.images) : [],
      bidCount: Number(r.bidCount)
    }));
  }),
  // Get request by ID
  getById: publicProcedure.input(z3.object({ id: z3.number() })).query(async ({ input }) => {
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
    return {
      ...result.request,
      client: result.client,
      images,
      bids: requestBids.map((b) => ({
        ...b.bid,
        artist: b.artist
      }))
    };
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
      guestEmail: z3.string().email().max(255).optional()
      // guests can optionally leave contact info
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const { guestEmail, ...requestInput } = input;
    let clientId = null;
    if (ctx.user) {
      const [client] = await db.select({ id: clients.id }).from(clients).where(eq2(clients.userId, ctx.user.id)).limit(1);
      if (client) clientId = client.id;
    }
    const [newRequest] = await db.insert(tattooRequests).values({
      clientId,
      guestEmail: clientId ? null : guestEmail ?? null,
      ...requestInput
    }).returning();
    return newRequest;
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
  // AI Bid Assistant — draft a bid response (Professional/Icon tier only)
  draftBid: protectedProcedure.input(z3.object({ requestId: z3.number() })).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [artist] = await db.select().from(artists).where(eq2(artists.userId, ctx.user.id)).limit(1);
    if (!artist) {
      throw new TRPCError2({
        code: "FORBIDDEN",
        message: "Only artists can use the bid assistant"
      });
    }
    if (!canUseAiBidAssistant(artist.subscriptionTier)) {
      throw new TRPCError2({
        code: "FORBIDDEN",
        message: "AI Bid Assistant is available for Professional and Icon tier artists. Upgrade to access this feature."
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
    const canonicalTier = artist.subscriptionTier ?? "artist_free";
    const legacyTier = toLegacyArtistTier(canonicalTier);
    const tierLimits = TIER_LIMITS2[legacyTier] ?? TIER_LIMITS2.free;
    const bidsPerMonth = tierLimits.bidsPerMonth;
    if (bidsPerMonth === 0) {
      throw new TRPCError2({
        code: "FORBIDDEN",
        message: "Bidding on client posts requires a paid plan. Upgrade to the Artist plan ($9/mo) to start submitting proposals."
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
    const feeRate = getTransactionFeeRate(legacyTier);
    const platformFeeRateBps = Math.round(feeRate * 1e4);
    const [newBid] = await db.insert(bids).values({
      requestId: input.requestId,
      artistId: artist.id,
      priceEstimate: input.priceEstimate,
      estimatedHours: input.estimatedHours,
      message: input.message,
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
init_schema();
init_db();
init_env();
import { eq as eq5 } from "drizzle-orm";

// backend/server/verificationRouter.ts
import { z as z4 } from "zod";
init_db();
init_db();
init_schema();
import { eq as eq3 } from "drizzle-orm";
import { TRPCError as TRPCError3 } from "@trpc/server";

// backend/server/geminiSafety.ts
init_logger();
var LICENSE_OCR_PROMPT_TEMPLATE = () => `You are a document verification specialist. Analyze this uploaded document image and extract all verifiable information. The document should be a tattoo/body art license, health permit, state-issued ID, or business permit related to tattooing.

Return a JSON object with the following fields:

{
  "documentType": string,        // Detected document type: "tattoo_license", "health_permit", "business_permit", "state_id", "drivers_license", "other", "not_a_document"
  "isLegible": boolean,          // Whether the document is legible enough to extract information
  "extractedName": string|null,  // Full name as it appears on the document
  "extractedBusinessName": string|null, // Business/shop name if present
  "licenseNumber": string|null,  // License or permit number if present
  "issuingAuthority": string|null, // Who issued the document (state, county, health department, etc.)
  "issueDate": string|null,      // Issue date in ISO format (YYYY-MM-DD) if present
  "expirationDate": string|null, // Expiration date in ISO format (YYYY-MM-DD) if present
  "isExpired": boolean|null,     // Whether the document appears expired (based on expiration date vs today)
  "state": string|null,          // State/jurisdiction if identifiable
  "confidence": number,          // Overall extraction confidence 0-100
  "issues": string[]             // Any issues detected: "blurry", "partially-obscured", "possibly-altered", "low-resolution", "glare", "cropped", "not-a-license", "expired", "unrecognized-format"
}

IMPORTANT:
- Return ONLY the raw JSON object, no markdown code fences, no explanation.
- If the image is not a document at all, set documentType to "not_a_document" and confidence to 0.
- If the document is too blurry or obscured to read, set isLegible to false and confidence below 30.
- Be conservative with confidence scores \u2014 only go above 80 if details are clearly readable.
- Today's date is ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]} \u2014 use this to determine if expired.
- Extract names exactly as written on the document (preserve casing, middle names, suffixes).`;
var DEFAULT_OCR_RESULT = {
  documentType: "not_a_document",
  isLegible: false,
  extractedName: null,
  extractedBusinessName: null,
  licenseNumber: null,
  issuingAuthority: null,
  issueDate: null,
  expirationDate: null,
  isExpired: null,
  state: null,
  confidence: 0,
  issues: ["analysis-failed"]
};
function compareNames(extractedName, profileName) {
  if (!extractedName || !profileName) {
    return { match: "unavailable", details: "One or both names are missing" };
  }
  const normalize = (n) => n.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean).sort();
  const extracted = normalize(extractedName);
  const profile = normalize(profileName);
  if (extracted.join(" ") === profile.join(" ")) {
    return {
      match: "exact",
      details: `Names match exactly: "${extractedName}"`
    };
  }
  const overlap = extracted.filter((t2) => profile.includes(t2));
  const overlapRatio = overlap.length / Math.max(extracted.length, profile.length);
  if (overlapRatio >= 0.5) {
    return {
      match: "partial",
      details: `Partial match (${Math.round(overlapRatio * 100)}%): extracted "${extractedName}" vs profile "${profileName}". Common tokens: ${overlap.join(", ")}`
    };
  }
  return {
    match: "mismatch",
    details: `Name mismatch: extracted "${extractedName}" does not match profile "${profileName}"`
  };
}
async function verifyLicenseDocument(imageData, mimeType, artistProfile) {
  try {
    let base64Data;
    if (imageData.startsWith("http")) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15e3);
      try {
        const response = await fetch(imageData, { signal: controller.signal });
        if (!response.ok) {
          logger.warn(`Failed to fetch document for OCR: ${response.status}`);
          return {
            ...DEFAULT_OCR_RESULT,
            nameMatch: "unavailable",
            nameMatchDetails: "Could not fetch document image",
            overallVerdict: "needs_review",
            verdictReason: "Document image could not be retrieved for analysis"
          };
        }
        const arrayBuffer = await response.arrayBuffer();
        base64Data = Buffer.from(arrayBuffer).toString("base64");
        mimeType = response.headers.get("content-type") || mimeType;
      } finally {
        clearTimeout(timeoutId);
      }
    } else {
      base64Data = imageData;
    }
    if (mimeType === "application/pdf") {
      return {
        ...DEFAULT_OCR_RESULT,
        documentType: "unknown",
        issues: ["pdf-format-requires-manual-review"],
        nameMatch: "unavailable",
        nameMatchDetails: "PDF documents require manual review",
        overallVerdict: "needs_review",
        verdictReason: "PDF documents cannot be analyzed via OCR \u2014 requires manual admin review"
      };
    }
    const imageBuffer = Buffer.from(base64Data, "base64");
    const ocrText = await imageToTextWithHuggingFace(
      imageBuffer,
      mimeType,
      "ocr"
    );
    if (!ocrText) {
      return {
        ...DEFAULT_OCR_RESULT,
        issues: ["ocr-no-text-extracted"],
        nameMatch: "unavailable",
        nameMatchDetails: "No OCR text could be extracted",
        overallVerdict: "needs_review",
        verdictReason: "OCR returned no text \u2014 requires manual review"
      };
    }
    const parsed2 = await groqGenerateJson(
      LICENSE_OCR_PROMPT_TEMPLATE(),
      `OCR extracted text:
${ocrText.slice(0, 4e3)}

Artist profile context:
- Profile name: ${artistProfile.name || "unknown"}
- Shop name: ${artistProfile.shopName || "unknown"}
- State: ${artistProfile.state || "unknown"}`,
      { maxTokens: 1600 }
    );
    const ocr = {
      documentType: parsed2.documentType || "other",
      isLegible: Boolean(parsed2.isLegible),
      extractedName: parsed2.extractedName || null,
      extractedBusinessName: parsed2.extractedBusinessName || null,
      licenseNumber: parsed2.licenseNumber || null,
      issuingAuthority: parsed2.issuingAuthority || null,
      issueDate: parsed2.issueDate || null,
      expirationDate: parsed2.expirationDate || null,
      isExpired: parsed2.isExpired ?? null,
      state: parsed2.state || null,
      confidence: typeof parsed2.confidence === "number" ? Math.max(0, Math.min(100, Math.round(parsed2.confidence))) : 0,
      issues: Array.isArray(parsed2.issues) ? parsed2.issues : []
    };
    const nameComparison = compareNames(ocr.extractedName, artistProfile.name);
    let shopNameComparison = null;
    if (nameComparison.match === "mismatch" && ocr.extractedBusinessName) {
      shopNameComparison = compareNames(
        ocr.extractedBusinessName,
        artistProfile.shopName
      );
    }
    let verdict;
    let verdictReason;
    if (ocr.documentType === "not_a_document") {
      verdict = "rejected";
      verdictReason = "Uploaded file does not appear to be a valid document";
    } else if (!ocr.isLegible || ocr.confidence < 30) {
      verdict = "needs_review";
      verdictReason = "Document is too unclear for automated verification \u2014 needs manual review";
    } else if (ocr.isExpired === true) {
      verdict = "rejected";
      verdictReason = `Document appears to be expired (expiration: ${ocr.expirationDate})`;
    } else if (nameComparison.match === "exact" && ocr.confidence >= 70 && !ocr.isExpired) {
      verdict = "verified";
      verdictReason = `Name matches profile exactly, document type: ${ocr.documentType}, confidence: ${ocr.confidence}%`;
    } else if (nameComparison.match === "partial" || shopNameComparison && shopNameComparison.match !== "mismatch") {
      verdict = "needs_review";
      verdictReason = `Partial name match detected \u2014 admin should verify. ${nameComparison.details}`;
    } else if (nameComparison.match === "mismatch") {
      verdict = "needs_review";
      verdictReason = `Name on document does not match profile \u2014 possible issue. ${nameComparison.details}`;
    } else {
      verdict = "needs_review";
      verdictReason = "Automated checks inconclusive \u2014 requires manual admin review";
    }
    if (ocr.issues.includes("possibly-altered") && verdict !== "rejected") {
      verdict = "needs_review";
      verdictReason += " | Document may have been altered";
    }
    logger.info(
      `License OCR: type=${ocr.documentType} confidence=${ocr.confidence} name=${nameComparison.match} verdict=${verdict}`
    );
    return {
      ...ocr,
      nameMatch: nameComparison.match,
      nameMatchDetails: nameComparison.details,
      overallVerdict: verdict,
      verdictReason
    };
  } catch (error) {
    logger.error("Hugging Face/Groq license OCR failed:", error);
    return {
      ...DEFAULT_OCR_RESULT,
      nameMatch: "unavailable",
      nameMatchDetails: "OCR analysis failed",
      overallVerdict: "needs_review",
      verdictReason: "Automated verification failed \u2014 requires manual review"
    };
  }
}
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

// backend/server/verificationRouter.ts
init_logger();
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
      contentType: z4.string(),
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
      mimeType: z4.string()
    })
  ).mutation(async ({ ctx, input }) => {
    const expectedPrefix = `private/${ctx.user.id}/`;
    if (!input.documentKey.startsWith(expectedPrefix)) {
      throw new TRPCError3({
        code: "FORBIDDEN",
        message: "Invalid document key: does not belong to this user"
      });
    }
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
    if (newDocument && input.mimeType !== "application/pdf") {
      (async () => {
        try {
          const signedUrl = await createSignedUrl(
            BUCKETS.ID_DOCUMENTS,
            input.documentKey,
            300
          );
          const artist = await getArtistByUserId(ctx.user.id);
          const artistProfile = {
            name: ctx.user.name || null,
            shopName: artist?.shopName || null,
            state: artist?.state || null
          };
          const verification = await verifyLicenseDocument(
            signedUrl,
            input.mimeType,
            artistProfile
          );
          await updateVerificationDocumentOCR(newDocument.id, {
            ocrDocumentType: verification.documentType,
            ocrExtractedName: verification.extractedName,
            ocrExtractedBusinessName: verification.extractedBusinessName,
            ocrLicenseNumber: verification.licenseNumber,
            ocrExpirationDate: verification.expirationDate,
            ocrIssuingAuthority: verification.issuingAuthority,
            ocrConfidence: verification.confidence,
            ocrNameMatch: verification.nameMatch,
            ocrVerdict: verification.overallVerdict,
            ocrVerdictReason: verification.verdictReason,
            ocrIssues: JSON.stringify(verification.issues),
            ocrProcessedAt: /* @__PURE__ */ new Date()
          });
          logger.info(
            `License OCR complete for doc #${newDocument.id}: verdict=${verification.overallVerdict}, confidence=${verification.confidence}`
          );
        } catch (err) {
          logger.error(
            `Background license OCR failed for doc #${newDocument.id}:`,
            err
          );
        }
      })();
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
    if (!ctx.user) {
      throw new TRPCError3({
        code: "UNAUTHORIZED",
        message: "Authentication required"
      });
    }
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

// backend/server/geminiVision.ts
import dns from "dns";
import { isIPv4, isIPv6 } from "net";
init_logger();
var ANALYSIS_PROMPT = `You are a tattoo industry expert and image analyst. You will receive an image caption and technical metadata produced by an upstream vision model. Infer likely tattoo attributes and return a JSON object with the following fields. Be precise and concise.

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
var DEFAULT_ANALYSIS = {
  styles: [],
  tags: [],
  description: "",
  qualityScore: 0,
  qualityIssues: ["analysis-failed"]
};
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

// backend/server/geminiDiscovery.ts
init_logger();
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
async function parseDiscoveryQuery(query) {
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

// backend/server/aiRouter.ts
import { z as z5 } from "zod";
init_db();
init_schema();
import { TRPCError as TRPCError4 } from "@trpc/server";
import { eq as eq4, sql as sql3, and as and3, gt } from "drizzle-orm";

// backend/server/geminiGeneration.ts
init_logger();
var TATTOO_GENERATION_PROMPT = `You are a world-class tattoo stencil artist. Create a highly detailed, professional tattoo design based on the following description. The design should:

1. Be rendered as clean black linework suitable for a tattoo stencil
2. Use a plain white background
3. Be well-composed and centered in the frame
4. Include appropriate shading using crosshatching or dotwork techniques
5. Show fine detail that a real tattoo artist could replicate

STYLE DIRECTION: {style}

DESIGN REQUEST:
{prompt}

Generate a single cohesive tattoo design image. The output must be a clear, monochrome (black on white) tattoo-ready stencil design. No text, no watermarks, no borders.`;
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
    const db = await requireDb3();
    const [clientProfile] = await db.select().from(clients).where(eq4(clients.userId, ctx.user.id)).limit(1);
    if (!clientProfile) {
      throw new TRPCError4({
        code: "FORBIDDEN",
        message: "You need a client profile to use AI Generation. Complete client onboarding first."
      });
    }
    const tier = clientProfile.subscriptionTier || "client_free";
    const tierLimits = getClientTierLimits(tier);
    if (tierLimits.aiGenerationsPerMonth === 0) {
      throw new TRPCError4({
        code: "FORBIDDEN",
        message: "AI Generation is a premium feature. Upgrade to Enthusiast ($9/mo) or Elite Ink ($19/mo) to unlock tattoo design generation."
      });
    }
    if (tierLimits.aiGenerationsPerMonth !== Number.MAX_SAFE_INTEGER) {
      const [updated] = await db.update(clients).set({
        aiCredits: sql3`${clients.aiCredits} - 1`,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(
        and3(eq4(clients.id, clientProfile.id), gt(clients.aiCredits, 0))
      ).returning({ aiCredits: clients.aiCredits });
      if (!updated) {
        throw new TRPCError4({
          code: "FORBIDDEN",
          message: `You've used all ${tierLimits.aiGenerationsPerMonth} AI generation credits for this billing period. Upgrade to Elite Ink for unlimited generations.`
        });
      }
      clientProfile.aiCredits = updated.aiCredits;
    }
    try {
      const result = await generateTattooDesign(
        input.prompt,
        input.style,
        ctx.user.id
      );
      logger.info(
        `AI tattoo generated for client #${clientProfile.id} (user #${ctx.user.id}), credits remaining: ${tierLimits.aiGenerationsPerMonth === Number.MAX_SAFE_INTEGER ? "unlimited" : clientProfile.aiCredits}`
      );
      return {
        imageUrl: result.imageUrl,
        imageKey: result.imageKey,
        creditsRemaining: tierLimits.aiGenerationsPerMonth === Number.MAX_SAFE_INTEGER ? null : clientProfile.aiCredits
      };
    } catch (error) {
      logger.error("AI tattoo generation failed:", error);
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
    const db = await requireDb3();
    const [clientProfile] = await db.select().from(clients).where(eq4(clients.userId, ctx.user.id)).limit(1);
    if (!clientProfile) {
      return {
        tier: "client_free",
        tierName: "Collector",
        aiCredits: 0,
        maxCredits: 0,
        isUnlimited: false
      };
    }
    const tier = clientProfile.subscriptionTier || "client_free";
    const tierLimits = getClientTierLimits(tier);
    return {
      tier,
      tierName: tierLimits.name,
      aiCredits: clientProfile.aiCredits,
      maxCredits: tierLimits.aiGenerationsPerMonth,
      isUnlimited: tierLimits.aiGenerationsPerMonth === Number.MAX_SAFE_INTEGER
    };
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
    /**
     * Create a Stripe Checkout Session for an artist subscription upgrade.
     * Returns the Checkout URL to redirect the artist to Stripe.
     */
    createSubscriptionCheckout: protectedProcedure.input(
      z7.object({
        tier: z7.enum(["artist_amateur", "artist_pro", "artist_icon"]),
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
        artist_amateur_month: ENV.stripeArtistAmateurPriceIdMonth,
        artist_amateur_year: ENV.stripeArtistAmateurPriceIdYear,
        artist_pro_month: ENV.stripeArtistProPriceIdMonth,
        artist_pro_year: ENV.stripeArtistProPriceIdYear,
        artist_icon_month: ENV.stripeArtistIconPriceIdMonth,
        artist_icon_year: ENV.stripeArtistIconPriceIdYear
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
    search: publicProcedure.input(
      z7.object({
        styles: z7.array(z7.string()).optional(),
        minRating: z7.number().optional(),
        minExperience: z7.number().optional(),
        city: z7.string().optional(),
        state: z7.string().optional()
      })
    ).query(async ({ input }) => {
      return await searchArtists(input);
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
      return await getArtistById(input.id);
    }),
    getByUserId: protectedProcedure.query(async ({ ctx }) => {
      return await getArtistByUserId(ctx.user.id);
    }),
    create: protectedProcedure.input(
      z7.object({
        shopName: z7.string(),
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
    ).mutation(async ({ ctx, input }) => {
      return await createArtist({
        userId: ctx.user.id,
        ...input
      });
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
      return await updateArtist(id, data);
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
      const limit = TIER_LIMITS[tier]?.portfolioMax ?? 0;
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
      const limit = TIER_LIMITS[tier]?.portfolioMax ?? 0;
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
      if (!image) throw new Error("Portfolio image not found");
      if (image.artistId !== input.artistId) throw new Error("Forbidden");
      const analysis = await analyzePortfolioImage(image.imageUrl);
      if (analysis.qualityScore === 0) {
        throw new Error("AI analysis failed \u2014 please try again later");
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
        throw new Error("Portfolio image not found");
      }
      const artist = await getArtistById(image.artistId);
      if (!artist || artist.userId !== ctx.user.id) {
        throw new Error(
          "Forbidden: You can only delete your own portfolio images"
        );
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
        throw new Error("Invalid email address");
      }
      return await createBooking({
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
        throw new Error("Booking not found");
      }
      const isCustomer = booking.userId === ctx.user.id;
      let isArtist = false;
      if (!isCustomer) {
        const artist = await getArtistById(booking.artistId);
        isArtist = !!(artist && artist.userId === ctx.user.id);
      }
      if (!isCustomer && !isArtist) {
        throw new Error(
          "Forbidden: You can only update your own bookings or bookings for your artist profile"
        );
      }
      return await updateBooking(input.id, { status: input.status });
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
      if (!review) throw new Error("Review not found");
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
  // ── AI Tattoo Generation ──────────────────────
  ai: aiRouter
});

// backend/server/_core/context.ts
init_db();
init_schema();
import { eq as eq6 } from "drizzle-orm";
async function createContext(opts) {
  let user = null;
  try {
    const authHeader = opts.req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "") || opts.req.cookies?.["sb-access-token"];
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
    user
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
  app2.use("*", async (req, res, next) => {
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
  app2.use("*", (_req, res) => {
    res.sendFile(path5.resolve(distPath, "index.html"));
  });
}

// backend/server/webhookHandler.ts
init_db();
init_db();
init_schema();
init_logger();
import { eq as eq8 } from "drizzle-orm";

// backend/server/webhookQueue.ts
init_db();
init_schema();
init_logger();
import { eq as eq7, and as and4, lte, inArray } from "drizzle-orm";
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
var MAX_RETRIES = 5;
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
      maxRetries: MAX_RETRIES,
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
      and4(
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
        if (newRetryCount >= MAX_RETRIES) {
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
init_schema();
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
      await withTransaction(async () => {
        await updateBooking(bookingId, {
          stripePaymentIntentId: session.payment_intent,
          depositAmount,
          depositPaid: true,
          status: "confirmed"
        });
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
  const metadataTier = session.metadata?.tier;
  const tier = metadataTier === "client_plus" || metadataTier === "client_elite" ? metadataTier : null;
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
    if (tier) userUpdate.subscriptionTier = tier;
    await tx.update(users).set(userUpdate).where(eq8(users.id, user.id));
    if (tier) {
      const tierLimits = CLIENT_TIER_LIMITS[tier];
      const aiCredits = tierLimits.aiGenerationsPerMonth === Number.MAX_SAFE_INTEGER ? 999 : tierLimits.aiGenerationsPerMonth;
      await tx.update(clients).set({
        subscriptionTier: tier,
        aiCredits,
        stripeSubscriptionId: subscriptionId ?? null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq8(clients.userId, user.id));
    }
  });
  logger.info("Subscription checkout completed and customer reconciled", {
    userId: user.id,
    sessionId: session.id,
    tier,
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
  const tier = stripePriceToClientTier(priceId);
  if (!tier) {
    logger.debug(
      "Subscription price does not match any known tier",
      {
        priceId,
        subscriptionId: subscription.id
      }
    );
    return;
  }
  const grantableStatuses = /* @__PURE__ */ new Set([
    "active",
    "trialing"
  ]);
  if (!grantableStatuses.has(subscription.status)) {
    logger.info("Skipping tier grant for non-grantable subscription status", {
      subscriptionId: subscription.id,
      status: subscription.status,
      eventType
    });
    return;
  }
  const database = await getDb();
  if (!database) {
    throw new Error("Database not available for subscription webhook");
  }
  const user = await resolveUserForSubscription(
    database,
    stripeCustomerId,
    subscription.metadata
  );
  if (!user) {
    logger.warn(
      "No user found for stripeCustomerId during subscription change",
      {
        stripeCustomerId,
        subscriptionId: subscription.id
      }
    );
    return;
  }
  const tierLimits = CLIENT_TIER_LIMITS[tier];
  const aiCredits = tierLimits.aiGenerationsPerMonth === Number.MAX_SAFE_INTEGER ? 999 : tierLimits.aiGenerationsPerMonth;
  await database.transaction(async (tx) => {
    await tx.update(users).set({
      stripeCustomerId,
      subscriptionTier: tier,
      stripeSubscriptionId: subscription.id,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq8(users.id, user.id));
    await tx.update(clients).set({
      subscriptionTier: tier,
      aiCredits,
      stripeSubscriptionId: subscription.id,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq8(clients.userId, user.id));
  });
  logger.info("Client subscription changed", {
    userId: user.id,
    tier,
    aiCredits,
    subscriptionId: subscription.id,
    eventType
  });
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
    await tx.update(artists).set({ subscriptionTier: tier, updatedAt: /* @__PURE__ */ new Date() }).where(eq8(artists.userId, user.id));
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
  await database.transaction(async (tx) => {
    await tx.update(users).set({
      subscriptionTier: "client_free",
      stripeSubscriptionId: null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq8(users.id, user.id));
    await tx.update(clients).set({
      subscriptionTier: "client_free",
      aiCredits: 0,
      stripeSubscriptionId: null,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq8(clients.userId, user.id));
  });
  logger.info("Client subscription cancelled \u2014 downgraded to free", {
    userId: user.id,
    subscriptionId: subscription.id
  });
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

// backend/server/_core/sentry.ts
init_logger();
import * as Sentry from "@sentry/node";
var initialized = false;
function initSentry() {
  const dsn = process.env.SENTRY_DSN;
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
function sentryErrorHandler() {
  return Sentry.expressErrorHandler();
}

// backend/server/_core/index.ts
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
    "https://universalinc.pro",
    "https://www.universalinc.pro",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ] : ["http://localhost:3000", "http://localhost:5173"];
}
var allowedOrigins = parseAllowedOrigins();
var app = express2();
app.set("trust proxy", 1);
initSentry();
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
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
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
    return req.method === "GET" && req.path.startsWith("/api/trpc/");
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
app.post(
  "/api/stripe/webhook",
  express2.raw({ type: "application/json" }),
  handleStripeWebhook
);
app.use(cookieParser());
app.use(express2.json({ limit: "50mb" }));
app.use(express2.urlencoded({ limit: "50mb", extended: true }));
registerSupabaseAuthRoutes(app);
app.get("/api/health", async (_req, res) => {
  try {
    const db = await Promise.resolve().then(() => (init_db(), db_exports)).then((m) => m.getDb());
    let dbStatus = "disconnected";
    if (db) {
      const { sql: sql4 } = await import("drizzle-orm");
      await db.execute(sql4`SELECT 1`);
      dbStatus = "connected";
    }
    const webhookStats = await getWebhookQueueStats();
    res.json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: ENV.nodeEnv,
      database: dbStatus,
      webhookQueue: webhookStats,
      version: process.env.npm_package_version || "unknown"
    });
  } catch (error) {
    logger.error("Health check failed", { error });
    res.status(503).json({
      status: "error",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      error: "Health check failed"
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
      await initializeBuckets();
      logger.info("Supabase storage buckets initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize storage buckets", { error });
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
