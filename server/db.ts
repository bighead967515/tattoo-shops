import { eq, desc, and, sql, or, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, artists, portfolioImages, reviews, bookings, favorites, InsertArtist, InsertPortfolioImage, InsertReview, InsertBooking, InsertFavorite } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // The mysql2 adapter needs a pool object, not a connection string.
      const pool = mysql.createPool(process.env.DATABASE_URL);
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
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

    await db.insert(users).values(values).onDuplicateKeyUpdate({
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
  
  return await db.select().from(artists).where(eq(artists.isApproved, 1));
}

export async function searchArtists(filters: {
  styles?: string[];
  minRating?: number;
  minExperience?: number;
  city?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [eq(artists.isApproved, 1)];
  
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
  
  return await db.insert(portfolioImages).values(image);
}

export async function getPortfolioByArtistId(artistId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(portfolioImages).where(eq(portfolioImages.artistId, artistId)).orderBy(desc(portfolioImages.createdAt));
}

export async function deletePortfolioImage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(portfolioImages).where(eq(portfolioImages.id, id));
}

// Review functions
export async function createReview(review: InsertReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(reviews).values(review);
  
  // Update artist average rating
  await updateArtistRating(review.artistId);
  
  return result;
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
  
  return await db.insert(bookings).values(booking);
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
