import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { tattooRequests, requestImages } from "../backend/drizzle/schema.js";
import { inArray } from "drizzle-orm";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL environment variable is required.");
    process.exit(1);
  }

  console.log("Connecting to database...");
  const client = postgres(connectionString);
  const db = drizzle(client);

  // 1. Get all request IDs that DO have images
  const reqImages = await db.select().from(requestImages);
  const requestIdsWithImages = reqImages.map((img) => img.requestId);

  // 2. Get all requests
  const allRequests = await db.select().from(tattooRequests);
  
  // 3. Filter requests that do NOT have images
  const requestsToDelete = allRequests.filter((r) => !requestIdsWithImages.includes(r.id));

  if (requestsToDelete.length > 0) {
    const idsToDelete = requestsToDelete.map((r) => r.id);
    console.log(`Found ${requestsToDelete.length} requests without photos:`);
    requestsToDelete.forEach((r) => {
      console.log(`- [ID: ${r.id}] "${r.title}"`);
    });

    console.log("Executing deletion...");
    await db.delete(tattooRequests).where(inArray(tattooRequests.id, idsToDelete));
    console.log(`Successfully deleted ${requestsToDelete.length} requests without photos.`);
  } else {
    console.log("No requests without photos found in the database.");
  }

  await client.end();
}

main().catch(console.error);
