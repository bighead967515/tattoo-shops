import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { shops, artists, users } from "../backend/drizzle/schema.js";
import { eq, sql } from "drizzle-orm";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL environment variable is required.");
    process.exit(1);
  }

  console.log("Connecting to database...");
  const client = postgres(connectionString);
  const db = drizzle(client);

  // 1. Clean up existing shop names and addresses
  const allShops = await db.select().from(shops);
  console.log(`Analyzing ${allShops.length} shops in public.shops...`);

  let cleanedCount = 0;
  let deletedCount = 0;

  for (const shop of allShops) {
    const updates: Partial<typeof shop> = {};

    // Fix corrupted Birmingham / Daphne shop names
    if (shop.shopName.includes("Birmingham, Alabama, 35222")) {
      updates.shopName = "Birmingham Tattoo Company";
      updates.city = "Birmingham";
      updates.state = "AL";
      updates.zipCode = "35222";
    } else if (shop.shopName.includes("Daphne, Alabama, 36526")) {
      updates.shopName = "Daphne Tattoo Shop";
      updates.city = "Daphne";
      updates.state = "AL";
      updates.zipCode = "36526";
    }

    // Fix truncated city names like Tland
    if (shop.city === "Tland") {
      updates.city = "Portland";
    }

    // Fix zip codes (4 digits to 5 digits with leading 0, e.g. '4330' -> '04330')
    if (shop.zipCode && /^\d{4}$/.test(shop.zipCode.trim())) {
      updates.zipCode = "0" + shop.zipCode.trim();
    }

    if (Object.keys(updates).length > 0) {
      console.log(`Cleaning shop ID ${shop.id} (${shop.shopName}):`, updates);
      await db.update(shops).set(updates).where(eq(shops.id, shop.id));
      cleanedCount++;
    }
  }

  // Delete shops with completely invalid shop names (e.g. if shop_name still contains full CSV address lines)
  const remainingShops = await db.select().from(shops);
  console.log(`Current shop count after initial cleanup: ${remainingShops.length}`);

  // 2. Fetch existing artists to avoid creating duplicates
  const existingArtists = await db.select().from(artists);
  console.log(`Existing artist profiles count: ${existingArtists.length}`);

  const existingShopNamesMap = new Set(
    existingArtists.map((a) => `${a.shopName.toLowerCase().trim()}_${(a.city || "").toLowerCase().trim()}`)
  );

  let profilesCreated = 0;

  for (const shop of remainingShops) {
    const shopKey = `${shop.shopName.toLowerCase().trim()}_${(shop.city || "").toLowerCase().trim()}`;
    
    // Check if an artist profile already exists for this shop
    if (existingShopNamesMap.has(shopKey)) {
      continue;
    }

    // Create a system user for this claimable shop profile
    const openId = `shop_claimable_${shop.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const [newUser] = await db
      .insert(users)
      .values({
        openId: openId,
        name: shop.shopName,
        email: shop.email || null,
        loginMethod: "claimable_shop",
        role: "artist",
        verificationStatus: "unverified",
      })
      .returning();

    // Create corresponding claimable artist profile
    await db.insert(artists).values({
      userId: newUser.id,
      shopName: shop.shopName,
      address: shop.address,
      city: shop.city,
      state: shop.state,
      zipCode: shop.zipCode || shop.zipCode,
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
    });

    existingShopNamesMap.add(shopKey);
    profilesCreated++;
  }

  // 3. Final summary
  const finalShops = await db.select().from(shops);
  const finalArtists = await db.select().from(artists);

  console.log("\n=================================");
  console.log("SHOP PROFILES GENERATION COMPLETE");
  console.log("=================================");
  console.log(`Cleaned shops count: ${cleanedCount}`);
  console.log(`Total valid shops in database: ${finalShops.length}`);
  console.log(`Total artist/shop profiles in database: ${finalArtists.length}`);
  console.log(`New claimable profiles created: ${profilesCreated}`);

  await client.end();
}

main().catch(console.error);
