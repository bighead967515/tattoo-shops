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
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import type { SubscriptionTier } from "@shared/const";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */

// Define role enum for PostgreSQL
export const roleEnum = pgEnum("role", ["user", "admin", "artist", "client"]);

// Define verification status enum
export const verificationStatusEnum = pgEnum("verification_status", [
  "unverified", // Default: Just signed up, can browse but not interact
  "pending", // Uploaded license, waiting for admin review
  "verified", // Admin approved, can accept payments/messages
  "rejected", // License was rejected, needs to re-upload
]);

export const users = pgTable("users", {
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
  verificationStatus: verificationStatusEnum("verification_status")
    .default("unverified")
    .notNull(),
  licenseDocumentKey: varchar("licenseDocumentKey", { length: 500 }), // Supabase Storage key for private license document
  licenseDocumentUrl: varchar("licenseDocumentUrl", { length: 1000 }), // Signed URL for license document
  verificationSubmittedAt: timestamp("verificationSubmittedAt"), // When they uploaded license
  verificationReviewedAt: timestamp("verificationReviewedAt"), // When admin reviewed
  verificationNotes: text("verificationNotes"), // Admin notes about verification
  /**
   * Canonical subscription tier — immutable fact from Stripe. See SubscriptionTier in @shared/const.
   * SOURCE OF TRUTH for billing tier. Nullable: set during onboarding based on role.
   * Onboarding must set: artists → "artist_free", clients → "client_free".
   * artists.subscriptionTier and clients.subscriptionTier are deprecated copies; prefer this column.
   */
  subscriptionTier: varchar("subscriptionTier", { length: 30 })
    .$type<SubscriptionTier | null>()
    .default(null),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Artist profiles - extends user information for artists
 */
export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  userId: integer("userId")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  shopName: varchar("shop_name", { length: 255 }).notNull(),
  bio: text("bio"),
  specialties: text("specialties"), // Comma-separated list
  styles: text("styles"), // Comma-separated list of tattoo styles (Realism, Traditional, Watercolor, etc.)
  experience: integer("experience"), // Years of experience
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
  subscriptionTier: varchar("subscriptionTier", { length: 30 })
    .$type<SubscriptionTier>()
    .default("artist_free")
    .notNull(),
  bidsUsed: integer("bidsUsed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Artist = typeof artists.$inferSelect;
export type InsertArtist = typeof artists.$inferInsert;

/**
 * Tattoo shops catalog
 */
export const shops = pgTable(
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
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    shopNameIdx: index("idx_shops_name").on(table.shopName),
    cityIdx: index("idx_shops_city").on(table.city),
  }),
);

export type Shop = typeof shops.$inferSelect;
export type InsertShop = typeof shops.$inferInsert;

/**
 * Portfolio images for artists
 */
export const portfolioImages = pgTable("portfolioImages", {
  id: serial("id").primaryKey(),
  artistId: integer("artistId")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  imageUrl: varchar("imageUrl", { length: 1000 }).notNull(),
  imageKey: varchar("imageKey", { length: 500 }).notNull(), // Supabase Storage key
  caption: text("caption"),
  style: varchar("style", { length: 100 }), // e.g., "Realism", "Traditional"
  // AI-generated fields (Smart Portfolio Tagging via Gemini Vision)
  aiStyles: text("aiStyles"), // JSON array of detected tattoo styles
  aiTags: text("aiTags"), // JSON array of content tags (subjects, themes)
  aiDescription: text("aiDescription"), // AI-generated description for SEO
  qualityScore: integer("qualityScore"), // 1-100 image quality score
  qualityIssues: text("qualityIssues"), // JSON array of detected issues (blurry, low-res, etc.)
  aiProcessedAt: timestamp("aiProcessedAt"), // When AI analysis was completed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PortfolioImage = typeof portfolioImages.$inferSelect;
export type InsertPortfolioImage = typeof portfolioImages.$inferInsert;

/**
 * Customer reviews for artists
 */
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  artistId: integer("artistId")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  userId: integer("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  helpfulVotes: integer("helpfulVotes").default(0), // Number of helpful votes
  verifiedBooking: boolean("verifiedBooking").default(false),
  photos: text("photos"), // Comma-separated URLs of review photos
  artistResponse: text("artistResponse"), // Artist's response to review
  artistResponseDate: timestamp("artistResponseDate"), // When artist responded
  // AI Moderation fields (Review Sentiment Analysis via Gemini)
  moderationStatus: varchar("moderationStatus", { length: 20 }).default(
    "pending",
  ), // "pending", "approved", "flagged", "hidden"
  moderationFlags: text("moderationFlags"), // JSON array of flag strings from AI analysis
  toxicityScore: integer("toxicityScore"), // 0-100
  spamScore: integer("spamScore"), // 0-100
  fraudScore: integer("fraudScore"), // 0-100
  moderationReason: text("moderationReason"), // AI explanation for the moderation decision
  moderatedAt: timestamp("moderatedAt"), // When AI moderation was completed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * Booking appointments
 */
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  artistId: integer("artistId")
    .notNull()
    .references(() => artists.id, { onDelete: "cascade" }),
  userId: integer("userId").references(() => users.id, {
    onDelete: "set null",
  }), // nullable for guest bookings
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 50 }).notNull(),
  preferredDate: timestamp("preferredDate").notNull(),
  tattooDescription: text("tattooDescription").notNull(),
  placement: varchar("placement", { length: 255 }).notNull(),
  size: varchar("size", { length: 100 }).notNull(),
  budget: varchar("budget", { length: 100 }),
  additionalNotes: text("additionalNotes"),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }), // For deposit payments
  depositAmount: integer("depositAmount"), // Amount in cents
  depositPaid: boolean("depositPaid").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * Favorite artists saved by users
 */
export const favorites = pgTable(
  "favorites",
  {
    id: serial("id").primaryKey(),
    userId: integer("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    artistId: integer("artistId")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    uniqueUserArtist: unique().on(table.userId, table.artistId),
  }),
);

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * Webhook event retry queue for reliability
 * Stores failed webhook events for retry with exponential backoff
 */
export const webhookQueue = pgTable("webhookQueue", {
  id: serial("id").primaryKey(),
  eventId: varchar("eventId", { length: 255 }).notNull().unique(),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  payload: text("payload").notNull(), // JSON stringified
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, processing, completed, failed
  retryCount: integer("retryCount").notNull().default(0),
  maxRetries: integer("maxRetries").notNull().default(5),
  nextRetryAt: timestamp("nextRetryAt").notNull(),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type WebhookQueueItem = typeof webhookQueue.$inferSelect;
export type InsertWebhookQueueItem = typeof webhookQueue.$inferInsert;

/**
 * Verification documents for artists/users
 * Stores sensitive legal documents (licenses, permits) separately with enhanced security
 */
export const verificationDocuments = pgTable("verificationDocuments", {
  id: serial("id").primaryKey(),
  userId: integer("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  documentType: varchar("documentType", { length: 100 }).notNull(), // "state_license", "business_permit", etc.
  documentKey: varchar("documentKey", { length: 500 }).notNull(), // Supabase Storage key (private bucket)
  originalFileName: varchar("originalFileName", { length: 255 }).notNull(),
  fileSize: integer("fileSize"), // In bytes
  mimeType: varchar("mimeType", { length: 100 }),
  status: verificationStatusEnum("status").default("pending").notNull(),
  reviewedBy: integer("reviewedBy").references(() => users.id, {
    onDelete: "set null",
  }), // Admin who reviewed
  reviewNotes: text("reviewNotes"), // Admin review notes
  // AI OCR Verification fields (License Verification via Gemini)
  ocrDocumentType: varchar("ocrDocumentType", { length: 50 }), // Detected document type
  ocrExtractedName: varchar("ocrExtractedName", { length: 255 }), // Name from OCR
  ocrExtractedBusinessName: varchar("ocrExtractedBusinessName", {
    length: 255,
  }), // Business name from OCR
  ocrLicenseNumber: varchar("ocrLicenseNumber", { length: 100 }), // License number from OCR
  ocrExpirationDate: varchar("ocrExpirationDate", { length: 20 }), // Expiration date string
  ocrIssuingAuthority: varchar("ocrIssuingAuthority", { length: 255 }), // Issuing body
  ocrConfidence: integer("ocrConfidence"), // 0-100 confidence score
  ocrNameMatch: varchar("ocrNameMatch", { length: 20 }), // "exact", "partial", "mismatch", "unavailable"
  ocrVerdict: varchar("ocrVerdict", { length: 20 }), // "verified", "needs_review", "rejected"
  ocrVerdictReason: text("ocrVerdictReason"), // AI explanation for verdict
  ocrIssues: text("ocrIssues"), // JSON array of detected issues
  ocrProcessedAt: timestamp("ocrProcessedAt"), // When OCR analysis was completed
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type VerificationDocument = typeof verificationDocuments.$inferSelect;
export type InsertVerificationDocument =
  typeof verificationDocuments.$inferInsert;

// ============================================
// CLIENT MARKETPLACE TABLES
// ============================================

// Define request status enum
export const requestStatusEnum = pgEnum("request_status", [
  "open", // Accepting bids
  "in_progress", // Artist selected, work in progress
  "completed", // Tattoo completed
  "cancelled", // Client cancelled
]);

// Define bid status enum
export const bidStatusEnum = pgEnum("bid_status", [
  "pending", // Waiting for client review
  "accepted", // Client accepted this bid
  "rejected", // Client rejected this bid
  "withdrawn", // Artist withdrew bid
]);

/**
 * Client profiles - extends user information for clients
 */
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("userId")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  displayName: varchar("displayName", { length: 255 }).notNull(),
  bio: text("bio"),
  preferredStyles: text("preferredStyles"), // Comma-separated list
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  phone: varchar("phone", { length: 50 }),
  onboardingCompleted: boolean("onboardingCompleted").default(false),
  /**
   * @deprecated Read from users.subscriptionTier instead. Kept for backward-compat queries.
   * During the transition, application-level sync propagates users.subscriptionTier → clients.subscriptionTier
   * whenever Stripe webhooks update the user record.
   */
  subscriptionTier: varchar("subscriptionTier", { length: 30 })
    .default("client_free")
    .notNull(), // 'client_free', 'enthusiast', 'elite'
  aiCredits: integer("aiCredits").default(0).notNull(), // Number of AI generation credits remaining
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }), // Stripe subscription ID for billing
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Tattoo requests posted by clients
 * Clients describe what they want and artists can bid
 */
export const tattooRequests = pgTable(
  "tattooRequests",
  {
    id: serial("id").primaryKey(),
    clientId: integer("clientId")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    style: varchar("style", { length: 100 }), // e.g., "Realism", "Traditional", "Watercolor"
    placement: varchar("placement", { length: 100 }).notNull(), // e.g., "forearm", "back", "sleeve"
    size: varchar("size", { length: 50 }).notNull(), // e.g., "small", "medium", "large", "full sleeve"
    colorPreference: varchar("colorPreference", { length: 50 }), // "color", "black_and_grey", "either"
    budgetMin: integer("budgetMin"), // In cents
    budgetMax: integer("budgetMax"), // In cents
    preferredCity: varchar("preferredCity", { length: 100 }),
    preferredState: varchar("preferredState", { length: 50 }),
    willingToTravel: boolean("willingToTravel").default(false),
    desiredTimeframe: varchar("desiredTimeframe", { length: 100 }), // e.g., "ASAP", "Within 1 month", "Flexible"
    status: requestStatusEnum("status").default("open").notNull(),
    selectedBidId: integer("selectedBidId"), // Will be set when client accepts a bid
    viewCount: integer("viewCount").default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    expiresAt: timestamp("expiresAt"), // Optional expiration date
  },
  (table) => ({
    // Table-level FK keeps circular request <-> bid relationship explicit in schema snapshots.
    selectedBidFk: foreignKey({
      name: "tattooRequests_selectedBidId_bids_id_fk",
      columns: [table.selectedBidId],
      foreignColumns: [bids.id as AnyPgColumn],
    })
      .onDelete("set null")
      .onUpdate("no action"),
  }),
);

export type TattooRequest = typeof tattooRequests.$inferSelect;
export type InsertTattooRequest = typeof tattooRequests.$inferInsert;

/**
 * Reference images for tattoo requests
 * Clients upload inspiration/reference images
 */
export const requestImages = pgTable("requestImages", {
  id: serial("id").primaryKey(),
  requestId: integer("requestId")
    .notNull()
    .references(() => tattooRequests.id, { onDelete: "cascade" }),
  imageUrl: varchar("imageUrl", { length: 1000 }).notNull(),
  imageKey: varchar("imageKey", { length: 500 }).notNull(), // Supabase Storage key
  caption: text("caption"),
  isMainImage: boolean("isMainImage").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RequestImage = typeof requestImages.$inferSelect;
export type InsertRequestImage = typeof requestImages.$inferInsert;

/**
 * Artist bids on tattoo requests
 */
export const bids = pgTable(
  "bids",
  {
    id: serial("id").primaryKey(),
    requestId: integer("requestId")
      .notNull()
      .references((): AnyPgColumn => tattooRequests.id, {
        onDelete: "cascade",
      }),
    artistId: integer("artistId")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    priceEstimate: integer("priceEstimate").notNull(), // In cents
    estimatedHours: integer("estimatedHours"),
    message: text("message").notNull(), // Artist's pitch to the client
    availableDate: timestamp("availableDate"), // When artist can do the work
    portfolioLinks: text("portfolioLinks"), // Links to relevant portfolio pieces
    status: bidStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    // One bid per artist per request
    uniqueArtistRequest: unique().on(table.artistId, table.requestId),
  }),
);

export type Bid = typeof bids.$inferSelect;
export type InsertBid = typeof bids.$inferInsert;

/**
 * Messages between clients and artists about a request/bid
 */
export const requestMessages = pgTable("requestMessages", {
  id: serial("id").primaryKey(),
  requestId: integer("requestId")
    .notNull()
    .references(() => tattooRequests.id, { onDelete: "cascade" }),
  bidId: integer("bidId").references(() => bids.id, { onDelete: "cascade" }), // Optional - can be general request message
  senderId: integer("senderId").references(() => users.id, {
    onDelete: "set null",
  }), // Nullable - set null if user deleted
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RequestMessage = typeof requestMessages.$inferSelect;
export type InsertRequestMessage = typeof requestMessages.$inferInsert;
