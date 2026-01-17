import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "artist"]).default("user").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Artist profiles - extends user information for artists
 */
export const artists = mysqlTable("artists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // References users.id
  shopName: varchar("shopName", { length: 255 }).notNull(),
  bio: text("bio"),
  specialties: text("specialties"), // Comma-separated list
  styles: text("styles"), // Comma-separated list of tattoo styles (Realism, Traditional, Watercolor, etc.)
  experience: int("experience"), // Years of experience
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zipCode", { length: 20 }),
  phone: varchar("phone", { length: 50 }),
  website: varchar("website", { length: 500 }),
  instagram: varchar("instagram", { length: 255 }),
  facebook: varchar("facebook", { length: 500 }),
  lat: text("lat"),
  lng: text("lng"),
  averageRating: text("averageRating"),
  totalReviews: int("totalReviews").default(0),
  isApproved: int("isApproved").default(0), // 0 = false, 1 = true
  subscriptionTier: varchar("subscriptionTier", { length: 20 }).default("free").notNull(), // 'free' or 'premium'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Artist = typeof artists.$inferSelect;
export type InsertArtist = typeof artists.$inferInsert;

/**
 * Portfolio images for artists
 */
export const portfolioImages = mysqlTable("portfolioImages", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId").notNull(), // References artists.id
  imageUrl: varchar("imageUrl", { length: 1000 }).notNull(),
  imageKey: varchar("imageKey", { length: 500 }).notNull(), // S3 key
  caption: text("caption"),
  style: varchar("style", { length: 100 }), // e.g., "Realism", "Traditional"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PortfolioImage = typeof portfolioImages.$inferSelect;
export type InsertPortfolioImage = typeof portfolioImages.$inferInsert;

/**
 * Customer reviews for artists
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId").notNull(), // References artists.id
  userId: int("userId").notNull(), // References users.id
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  helpfulVotes: int("helpfulVotes").default(0), // Number of helpful votes
  verifiedBooking: int("verifiedBooking").default(0), // 0 = false, 1 = true
  photos: text("photos"), // Comma-separated URLs of review photos
  artistResponse: text("artistResponse"), // Artist's response to review
  artistResponseDate: timestamp("artistResponseDate"), // When artist responded
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * Booking appointments
 */
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  artistId: int("artistId").notNull(), // References artists.id
  userId: int("userId"), // References users.id (nullable for guest bookings)
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
  depositAmount: int("depositAmount"), // Amount in cents
  depositPaid: int("depositPaid").default(0), // 0 = false, 1 = true
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * Favorite artists saved by users
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // References users.id
  artistId: int("artistId").notNull(), // References artists.id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;