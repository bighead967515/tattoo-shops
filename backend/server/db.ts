import { eq, desc, and, sql, or, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { InsertUser, users, artists, portfolioImages, reviews, bookings, favorites, verificationDocuments, clients, InsertArtist, InsertPortfolioImage, InsertReview, InsertBooking, InsertFavorite } from "../drizzle/schema";
import { ENV } from './_core/env';
import { logger } from './_core/logger';

let _db: ReturnType<typeof drizzle> | null = null;
let _sqlClient: ReturnType<typeof postgres> | null = null;

// Database pool statistics
interface PoolStats {
  totalConnections: number;
  idleConnections: number;
  waitingRequests: number;
  lastChecked: Date;
}

let _poolStats: PoolStats = {
  totalConnections: 0,
  idleConnections: 0,
  waitingRequests: 0,
  lastChecked: new Date(),
};

/**
 * Get current database pool statistics
 */
export function getPoolStats(): PoolStats {
  return { ..._poolStats };
}

/**
 * Log pool statistics periodically (call from health check or monitoring)
 */
export function logPoolStats(): void {
  if (_sqlClient) {
    // postgres.js exposes connection info
    const stats = {
      ..._poolStats,
      lastChecked: new Date(),
    };
    _poolStats = stats;
    logger.debug("Database pool stats", stats);
  }
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Create PostgreSQL connection with connection pooling
      _sqlClient = postgres(process.env.DATABASE_URL, {
        max: 20, // Max connections in pool
        idle_timeout: 30, // Close idle connections after 30 seconds
        connect_timeout: 5, // 5 second connection timeout
        onnotice: (notice) => {
          logger.debug("Database notice", { message: notice.message });
        },
        onclose: () => {
          logger.warn("Database connection closed");
        },
      });
      _db = drizzle(_sqlClient);
      
      // Log successful connection
      logger.info("Database connection pool initialized", { maxConnections: 20 });
    } catch (error) {
      logger.error("Database connection failed", { error });
      _db = null;
    }
  }
  return _db;
}
      
// Run async function within a database transaction for atomicity
export async function withTransaction<T>(
  callback: (tx: ReturnType<typeof drizzle>) => Promise<T>
): Promise<T> {
  const db = await getDb();
  if (!db || !_sqlClient) {
    throw new Error("Database not available for transactions");
  }
  
  return _sqlClient.begin(async (sql) => {
    const txDb = drizzle(sql as any);
    return callback(txDb);
  }) as Promise<T>;
}
      
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "stripeCustomerId"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Artist functions
export async function createArtist(artist: InsertArtist) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(artists).values(artist);
  return result;
}

export async function getArtistByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(artists).where(eq(artists.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getArtistById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(artists).where(eq(artists.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllArtists() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(artists).where(eq(artists.isApproved, true));
}

export async function searchArtists(filters: {
  styles?: string[];
  minRating?: number;
  minExperience?: number;
  city?: string;
  state?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [eq(artists.isApproved, true)];
  
  // Filter by styles
  if (filters.styles && filters.styles.length > 0) {
    const styleConditions = filters.styles.map(style => 
      sql`FIND_IN_SET(${style}, ${artists.styles}) > 0`
    );
    conditions.push(or(...styleConditions));
  }
  
  // Filter by minimum rating
  if (filters.minRating && filters.minRating > 0) {
    conditions.push(sql`CAST(${artists.averageRating} AS DECIMAL(3,2)) >= ${filters.minRating}`);
  }
  
  // Filter by minimum experience
  if (filters.minExperience && filters.minExperience > 0) {
    conditions.push(gte(artists.experience, filters.minExperience));
  }
  
  // Filter by city
  if (filters.city) {
    conditions.push(eq(artists.city, filters.city));
  }

  // Filter by state
  if (filters.state) {
	conditions.push(eq(artists.state, filters.state));
  }
  
  return await db.select().from(artists).where(and(...conditions));
}

export async function updateArtist(id: number, data: Partial<InsertArtist>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(artists).set(data).where(eq(artists.id, id));
}

// Portfolio functions
export async function addPortfolioImage(image: InsertPortfolioImage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [inserted] = await db.insert(portfolioImages).values(image).returning();
  return inserted;
}

export async function getPortfolioByArtistId(artistId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(portfolioImages).where(eq(portfolioImages.artistId, artistId)).orderBy(desc(portfolioImages.createdAt));
}

export async function getPortfolioCountByArtistId(artistId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(portfolioImages)
    .where(eq(portfolioImages.artistId, artistId));
  return result[0]?.count ?? 0;
}

export async function getPortfolioImageById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(portfolioImages).where(eq(portfolioImages.id, id)).limit(1);
  return result[0] || null;
}

export async function deletePortfolioImage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(portfolioImages).where(eq(portfolioImages.id, id));
}

/**
 * Update AI-generated fields on a portfolio image (Smart Portfolio Tagging)
 */
export async function updatePortfolioImageAI(
  id: number,
  data: {
    aiStyles?: string | null;
    aiTags?: string | null;
    aiDescription?: string | null;
    qualityScore?: number | null;
    qualityIssues?: string | null;
    aiProcessedAt?: Date | null;
    style?: string | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(portfolioImages)
    .set(data)
    .where(eq(portfolioImages.id, id));
}

// Review functions
export async function createReview(review: InsertReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [inserted] = await db.insert(reviews).values(review).returning();
  
  // Update artist average rating
  await updateArtistRating(review.artistId);
  
  return inserted;
}

export async function getReviewsByArtistId(artistId: number) {
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
    artistResponseDate: reviews.artistResponseDate,
  })
  .from(reviews)
  .leftJoin(users, eq(reviews.userId, users.id))
  .where(eq(reviews.artistId, artistId))
  .orderBy(desc(reviews.createdAt));
}

async function updateArtistRating(artistId: number) {
  const db = await getDb();
  if (!db) return;
  
  const result = await db.select({
    avgRating: sql<string>`AVG(${reviews.rating})`,
    count: sql<number>`COUNT(*)`,
  })
  .from(reviews)
  .where(eq(reviews.artistId, artistId));
  
  if (result.length > 0) {
    const avgRating = result[0].avgRating ? parseFloat(result[0].avgRating).toFixed(2) : "0";
    const count = result[0].count || 0;
    
    await db.update(artists).set({
      averageRating: avgRating,
      totalReviews: count,
    }).where(eq(artists.id, artistId));
  }
}

// Booking functions
export async function createBooking(booking: InsertBooking) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(bookings).values(booking).returning();
  return result[0];
}

export async function getBookingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBookingsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    booking: bookings,
    artist: artists,
  })
  .from(bookings)
  .leftJoin(artists, eq(bookings.artistId, artists.id))
  .where(eq(bookings.userId, userId))
  .orderBy(desc(bookings.createdAt));
}

export async function getBookingsByArtistId(artistId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(bookings).where(eq(bookings.artistId, artistId)).orderBy(desc(bookings.createdAt));
}

export async function updateBooking(id: number, data: Partial<InsertBooking>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(bookings).set(data).where(eq(bookings.id, id));
}

// Favorite functions
export async function addFavorite(favorite: InsertFavorite) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(favorites).values(favorite);
}

export async function removeFavorite(userId: number, artistId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.artistId, artistId)));
}

export async function getFavoritesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    favorite: favorites,
    artist: artists,
  })
  .from(favorites)
  .leftJoin(artists, eq(favorites.artistId, artists.id))
  .where(eq(favorites.userId, userId))
  .orderBy(desc(favorites.createdAt));
}

export async function isFavorite(userId: number, artistId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.artistId, artistId))).limit(1);
  return result.length > 0;
}

/**
 * Semantic search: find artists whose portfolio images match parsed AI intent.
 * Joins artists with portfolioImages and searches across aiStyles, aiTags,
 * aiDescription, plus artist-level styles, specialties, and bio.
 *
 * Returns artists ranked by relevance (number of matching signals) with their
 * top matching portfolio images attached.
 */
export async function discoverArtists(intent: {
  styles: string[];
  tags: string[];
  keywords: string[];
  vibeDescription: string;
}) {
  const db = await getDb();
  if (!db) return [];

  // Build ILIKE conditions for portfolio image AI fields
  const allTerms = [
    ...intent.styles,
    ...intent.tags,
    ...intent.keywords,
  ].filter(Boolean);

  if (allTerms.length === 0 && !intent.vibeDescription) {
    // No useful search terms — fall back to all approved artists
    return (await db.select().from(artists).where(eq(artists.isApproved, true))).map(a => ({
      ...a,
      matchedImages: [] as Array<typeof portfolioImages.$inferSelect>,
      relevanceScore: 0,
    }));
  }

  // Step 1: Find portfolio images that match any of the search terms
  const imageConditions: ReturnType<typeof sql>[] = [];

  for (const term of allTerms) {
    const likeTerm = `%${term}%`;
    imageConditions.push(sql`${portfolioImages.aiStyles} ILIKE ${likeTerm}`);
    imageConditions.push(sql`${portfolioImages.aiTags} ILIKE ${likeTerm}`);
    imageConditions.push(sql`${portfolioImages.aiDescription} ILIKE ${likeTerm}`);
    imageConditions.push(sql`${portfolioImages.caption} ILIKE ${likeTerm}`);
    imageConditions.push(sql`${portfolioImages.style} ILIKE ${likeTerm}`);
  }

  // Also search by vibe description keywords (split into individual words > 3 chars)
  if (intent.vibeDescription) {
    const vibeWords = intent.vibeDescription
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 8);
    for (const word of vibeWords) {
      const likeTerm = `%${word}%`;
      imageConditions.push(sql`${portfolioImages.aiDescription} ILIKE ${likeTerm}`);
    }
  }

  // Get matching images with artist info
  const matchingImages = await db
    .select({
      image: portfolioImages,
      artist: artists,
    })
    .from(portfolioImages)
    .innerJoin(artists, eq(portfolioImages.artistId, artists.id))
    .where(
      and(
        eq(artists.isApproved, true),
        or(...imageConditions)
      )
    )
    .orderBy(desc(portfolioImages.qualityScore));

  // Step 2: Also find artists matching at artist-level (styles, specialties, bio)
  const artistConditions: ReturnType<typeof sql>[] = [];
  for (const term of allTerms) {
    const likeTerm = `%${term}%`;
    artistConditions.push(sql`${artists.styles} ILIKE ${likeTerm}`);
    artistConditions.push(sql`${artists.specialties} ILIKE ${likeTerm}`);
    artistConditions.push(sql`${artists.bio} ILIKE ${likeTerm}`);
  }

  const matchingArtistsDirect = artistConditions.length > 0
    ? await db
        .select()
        .from(artists)
        .where(
          and(
            eq(artists.isApproved, true),
            or(...artistConditions)
          )
        )
    : [];

  // Step 3: Merge results — group by artist, calculate relevance score
  const artistMap = new Map<
    number,
    {
      artist: typeof artists.$inferSelect;
      matchedImages: Array<typeof portfolioImages.$inferSelect>;
      relevanceScore: number;
    }
  >();

  // Score from matched portfolio images (strongest signal)
  for (const row of matchingImages) {
    const existing = artistMap.get(row.artist.id);
    if (existing) {
      existing.matchedImages.push(row.image);
      existing.relevanceScore += 3; // Each matching image = +3
    } else {
      artistMap.set(row.artist.id, {
        artist: row.artist,
        matchedImages: [row.image],
        relevanceScore: 3,
      });
    }
  }

  // Score from artist-level matches (secondary signal)
  for (const artist of matchingArtistsDirect) {
    const existing = artistMap.get(artist.id);
    if (existing) {
      existing.relevanceScore += 2; // Artist-level match = +2 bonus
    } else {
      artistMap.set(artist.id, {
        artist,
        matchedImages: [],
        relevanceScore: 2,
      });
    }
  }

  // Sort by relevance score descending, then limit matched images per artist
  const results = Array.from(artistMap.values())
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .map((entry) => ({
      ...entry.artist,
      matchedImages: entry.matchedImages.slice(0, 6), // Top 6 images per artist
      relevanceScore: entry.relevanceScore,
    }));

  return results;
}

// ============================================
// Verification Document functions
// ============================================

/**
 * Update OCR analysis results on a verification document.
 */
export async function updateVerificationDocumentOCR(
  id: number,
  data: {
    ocrDocumentType?: string | null;
    ocrExtractedName?: string | null;
    ocrExtractedBusinessName?: string | null;
    ocrLicenseNumber?: string | null;
    ocrExpirationDate?: string | null;
    ocrIssuingAuthority?: string | null;
    ocrConfidence?: number | null;
    ocrNameMatch?: string | null;
    ocrVerdict?: string | null;
    ocrVerdictReason?: string | null;
    ocrIssues?: string | null;
    ocrProcessedAt?: Date | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(verificationDocuments)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(verificationDocuments.id, id));
}

/**
 * Get a verification document by ID.
 */
export async function getVerificationDocumentById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(verificationDocuments)
    .where(eq(verificationDocuments.id, id))
    .limit(1);
  return result[0] || null;
}

/**
 * Get all verification documents pending review, with user + artist info.
 */
export async function getPendingVerificationDocuments() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      document: verificationDocuments,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        verificationStatus: users.verificationStatus,
      },
      artist: {
        id: artists.id,
        shopName: artists.shopName,
        state: artists.state,
      },
    })
    .from(verificationDocuments)
    .innerJoin(users, eq(verificationDocuments.userId, users.id))
    .leftJoin(artists, eq(users.id, artists.userId))
    .where(eq(verificationDocuments.status, "pending"))
    .orderBy(desc(verificationDocuments.submittedAt));
}

/**
 * Admin: update verification document status and user verification status.
 */
export async function reviewVerificationDocument(
  documentId: number,
  decision: {
    status: "verified" | "rejected";
    reviewedBy: number;
    reviewNotes?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.transaction(async (tx) => {
    // Update the document
    const [doc] = await tx
      .update(verificationDocuments)
      .set({
        status: decision.status,
        reviewedBy: decision.reviewedBy,
        reviewNotes: decision.reviewNotes || null,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(verificationDocuments.id, documentId))
      .returning();

    if (!doc) throw new Error("Verification document not found");

    // Update the user's verification status
    await tx
      .update(users)
      .set({
        verificationStatus: decision.status,
        verificationReviewedAt: new Date(),
        verificationNotes: decision.reviewNotes || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, doc.userId));

    return doc;
  });
}

// ============================================
// Review Moderation functions
// ============================================

/**
 * Update AI moderation results on a review.
 */
export async function updateReviewModeration(
  id: number,
  data: {
    moderationStatus?: string | null;
    moderationFlags?: string | null;
    toxicityScore?: number | null;
    spamScore?: number | null;
    fraudScore?: number | null;
    moderationReason?: string | null;
    moderatedAt?: Date | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(reviews)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(reviews.id, id));
}

/**
 * Get reviews flagged or pending moderation.
 */
export async function getFlaggedReviews() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      review: reviews,
      userName: users.name,
      artistName: artists.shopName,
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .leftJoin(artists, eq(reviews.artistId, artists.id))
    .where(
      or(
        eq(reviews.moderationStatus, "flagged"),
        eq(reviews.moderationStatus, "hidden")
      )
    )
    .orderBy(desc(reviews.createdAt));
}

/**
 * Get a review by ID.
 */
export async function getReviewById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(reviews)
    .where(eq(reviews.id, id))
    .limit(1);
  return result[0] || null;
}
