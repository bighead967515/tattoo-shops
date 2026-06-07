import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { shops, artists } from "../backend/drizzle/schema.js";
import { eq } from "drizzle-orm";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL environment variable is required.");
    process.exit(1);
  }

  console.log("Connecting to database...");
  const client = postgres(connectionString);
  const db = drizzle(client);

  // 1. Clean shops table
  const allShops = await db.select().from(shops);
  console.log(`Checking ${allShops.length} shops...`);

  for (const shop of allShops) {
    const updates: Partial<typeof shop> = {};

    // Charlie's House Of Tattoos
    if (shop.shopName.toLowerCase().includes("charlie") && shop.shopName.toLowerCase().includes("tattoos")) {
      if (shop.address?.includes("95 Bullhead City")) {
        updates.address = "1105 Highway 95";
        updates.city = "Bullhead City";
        updates.state = "AZ";
      }
    }

    // Hard Case Tattoo
    if (shop.shopName.toLowerCase().includes("hard case")) {
      if (shop.address?.includes("MS 3636 N") || shop.city?.includes("MS 3636 N") || shop.state?.toLowerCase() === "ms") {
        updates.address = "3636 N Mississippi Ave";
        updates.city = "Portland";
        updates.state = "OR";
        updates.zipCode = "97227";
      }
    }

    // Ink Dragon
    if (shop.shopName.toLowerCase().includes("ink dragon")) {
      if (shop.shopName.includes("201 1/2 E") || shop.shopName.includes("Us Highway")) {
        updates.shopName = "Ink Dragon";
        updates.address = "201 1/2 E Us Highway 70";
        updates.city = "Safford";
        updates.state = "AZ";
        updates.zipCode = "85546";
      }
    }

    // Birmingham / Daphne placeholder names
    if (shop.shopName.includes("Birmingham, Alabama, 35222")) {
      updates.shopName = "Birmingham Tattoo Company";
      updates.city = "Birmingham";
      updates.state = "AL";
      updates.zipCode = "35222";
    }
    if (shop.shopName.includes("Daphne, Alabama, 36526")) {
      updates.shopName = "Daphne Tattoo Shop";
      updates.city = "Daphne";
      updates.state = "AL";
      updates.zipCode = "36526";
    }

    // Awesom Ink
    if (shop.shopName.toLowerCase().includes("awesom")) {
      if (shop.city?.includes("West, VA") || shop.address?.includes("West, VA")) {
        updates.city = "Beckley";
        updates.state = "WV";
        updates.address = "5458 Robert C Byrd Dr";
        updates.zipCode = "25801";
      }
    }

    // Tland/Portland truncation
    if (shop.city === "Tland") {
      updates.city = "Portland";
    }

    if (Object.keys(updates).length > 0) {
      console.log(`Updating shop ID ${shop.id} (${shop.shopName}):`, updates);
      await db.update(shops).set(updates).where(eq(shops.id, shop.id));
    }
  }

  // 2. Clean artists table
  const allArtists = await db.select().from(artists);
  console.log(`Checking ${allArtists.length} artists...`);

  for (const artist of allArtists) {
    const updates: Partial<typeof artist> = {};

    // Charlie's House Of Tattoos
    if (artist.shopName.toLowerCase().includes("charlie") && artist.shopName.toLowerCase().includes("tattoos")) {
      if (artist.address?.includes("95 Bullhead City")) {
        updates.address = "1105 Highway 95";
        updates.city = "Bullhead City";
        updates.state = "AZ";
      }
    }

    // Hard Case Tattoo
    if (artist.shopName.toLowerCase().includes("hard case")) {
      if (artist.address?.includes("MS 3636 N") || artist.city?.includes("MS 3636 N") || artist.state?.toLowerCase() === "ms") {
        updates.address = "3636 N Mississippi Ave";
        updates.city = "Portland";
        updates.state = "OR";
        updates.zipCode = "97227";
      }
    }

    // Ink Dragon
    if (artist.shopName.toLowerCase().includes("ink dragon")) {
      if (artist.shopName.includes("201 1/2 E") || artist.shopName.includes("Us Highway")) {
        updates.shopName = "Ink Dragon";
        updates.address = "201 1/2 E Us Highway 70";
        updates.city = "Safford";
        updates.state = "AZ";
        updates.zipCode = "85546";
      }
    }

    // Birmingham / Daphne placeholder names
    if (artist.shopName.includes("Birmingham, Alabama, 35222")) {
      updates.shopName = "Birmingham Tattoo Company";
      updates.city = "Birmingham";
      updates.state = "AL";
      updates.zipCode = "35222";
    }
    if (artist.shopName.includes("Daphne, Alabama, 36526")) {
      updates.shopName = "Daphne Tattoo Shop";
      updates.city = "Daphne";
      updates.state = "AL";
      updates.zipCode = "36526";
    }

    // Awesom Ink
    if (artist.shopName.toLowerCase().includes("awesom")) {
      if (artist.city?.includes("West, VA") || artist.address?.includes("West, VA")) {
        updates.city = "Beckley";
        updates.state = "WV";
        updates.address = "5458 Robert C Byrd Dr";
        updates.zipCode = "25801";
      }
    }

    // Tland/Portland truncation
    if (artist.city === "Tland") {
      updates.city = "Portland";
    }

    if (Object.keys(updates).length > 0) {
      console.log(`Updating artist ID ${artist.id} (${artist.shopName}):`, updates);
      await db.update(artists).set(updates).where(eq(artists.id, artist.id));
    }
  }

  console.log("Cleanup complete!");
  await client.end();
}

main().catch(console.error);
