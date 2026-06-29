import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { artists, portfolioImages, tattooRequests, requestImages } from "../backend/drizzle/schema.js";
import { eq, inArray, notInArray, sql } from "drizzle-orm";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL environment variable is required.");
    process.exit(1);
  }

  console.log("Connecting to database...");
  const client = postgres(connectionString);
  const db = drizzle(client);

  // 1. Check artists without portfolios
  const allArtists = await db.select().from(artists);
  const images = await db.select().from(portfolioImages);
  
  const artistIdsWithPortfolios = new Set(images.map((img) => img.artistId));
  const artistsWithoutPortfolios = allArtists.filter((a) => !artistIdsWithPortfolios.has(a.id));

  console.log("\n=================== ARTISTS ===================");
  console.log(`Total Artists: ${allArtists.length}`);
  console.log(`Artists with portfolios: ${artistIdsWithPortfolios.size}`);
  console.log(`Artists without portfolios (DELETE CANDIDATES): ${artistsWithoutPortfolios.length}`);
  artistsWithoutPortfolios.forEach((a) => {
    console.log(`- [ID: ${a.id}] ${a.shopName} (Created: ${a.createdAt})`);
  });

  // 2. Check requests without photos
  const allRequests = await db.select().from(tattooRequests);
  const reqImages = await db.select().from(requestImages);

  const requestIdsWithImages = new Set(reqImages.map((img) => img.requestId));
  const requestsWithoutImages = allRequests.filter((r) => !requestIdsWithImages.has(r.id));

  console.log("\n=================== REQUESTS ===================");
  console.log(`Total Requests: ${allRequests.length}`);
  console.log(`Requests with images: ${requestIdsWithImages.size}`);
  console.log(`Requests without images (DELETE CANDIDATES): ${requestsWithoutImages.length}`);
  requestsWithoutImages.forEach((r) => {
    console.log(`- [ID: ${r.id}] "${r.title}" by guest/client ${r.guestEmail || r.clientId} (Created: ${r.createdAt})`);
  });

  await client.end();
}

main().catch(console.error);
