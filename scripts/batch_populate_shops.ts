import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { shops, artists, users } from "../backend/drizzle/schema.js";
import { inArray } from "drizzle-orm";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL environment variable is required.");
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("Starting batch profile generation...");

  const allShops = await db.select().from(shops);
  const existingArtists = await db.select().from(artists);

  const existingShopKeys = new Set(
    existingArtists.map((a) => `${a.shopName.toLowerCase().trim()}_${(a.city || "").toLowerCase().trim()}`)
  );

  const shopsToProcess = allShops.filter((shop) => {
    const key = `${shop.shopName.toLowerCase().trim()}_${(shop.city || "").toLowerCase().trim()}`;
    return !existingShopKeys.has(key);
  });

  console.log(`Found ${shopsToProcess.length} shops needing profiles.`);

  if (shopsToProcess.length === 0) {
    console.log("All shops already have profiles!");
    await client.end();
    return;
  }

  // Prepare batch insert arrays
  const timestamp = Date.now();
  const userInserts = shopsToProcess.map((shop, i) => ({
    openId: `shop_claimable_${shop.id}_${timestamp}_${i}`,
    name: shop.shopName,
    email: shop.email || null,
    loginMethod: "claimable_shop",
    role: "artist" as const,
    verificationStatus: "unverified" as const,
  }));

  // Insert users in chunks of 50
  const chunkSize = 50;
  let insertedUsers: Array<typeof users.$inferSelect> = [];

  for (let i = 0; i < userInserts.length; i += chunkSize) {
    const chunk = userInserts.slice(i, i + chunkSize);
    const result = await db.insert(users).values(chunk).returning();
    insertedUsers.push(...result);
  }

  console.log(`Batch inserted ${insertedUsers.length} system users.`);

  // Map users to shop profiles
  const artistInserts = insertedUsers.map((user, idx) => {
    const shop = shopsToProcess[idx];
    return {
      userId: user.id,
      shopName: shop.shopName,
      address: shop.address,
      city: shop.city,
      state: shop.state,
      zipCode: shop.zipCode || undefined,
      phone: shop.phone,
      website: shop.email ? `mailto:${shop.email}` : undefined,
      isApproved: true,
      isHidden: false,
      isFoundingArtist: false,
      bidsUsed: 0,
      bidsThisMonth: 0,
      bidsMonthYear: "2026-08",
      bidTokens: 0,
      chatTokens: 0,
      aiCredits: 0,
      profileViewCount: 0,
    };
  });

  for (let i = 0; i < artistInserts.length; i += chunkSize) {
    const chunk = artistInserts.slice(i, i + chunkSize);
    await db.insert(artists).values(chunk);
  }

  console.log(`Batch inserted ${artistInserts.length} artist profiles.`);

  const finalShops = await db.select().from(shops);
  const finalArtists = await db.select().from(artists);

  console.log("\n=================================");
  console.log("BATCH PROFILE GENERATION COMPLETE");
  console.log("=================================");
  console.log(`Total shops: ${finalShops.length}`);
  console.log(`Total artist/shop profiles: ${finalArtists.length}`);

  await client.end();
}

main().catch(console.error);
