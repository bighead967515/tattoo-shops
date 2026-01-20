import { getDb } from "../server/db";
import { sendArtistInvitation } from "../server/email";
import { users, artists } from "../drizzle/schema";
import { eq, isNotNull } from "drizzle-orm";

/**
 * Send invitation emails to all Louisiana tattoo shops with email addresses
 */
async function sendInvitations() {
  console.log("🚀 Starting artist invitation campaign...\n");

  const db = await getDb();

  // Get all artists with their user email addresses
  const artistsWithEmails = await db
    .select({
      artistId: artists.id,
      shopName: artists.shopName,
      location: artists.city,
      email: users.email,
      userName: users.name,
    })
    .from(artists)
    .leftJoin(users, eq(artists.userId, users.id))
    .where(isNotNull(users.email)); // Filter out artists without an associated user email

  console.log(`Found ${artistsWithEmails.length} artists with email addresses\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ shop: string; error: string }> = [];

  for (const artist of artistsWithEmails) {
    if (!artist.email) {
      console.log(`⏭️  Skipping ${artist.shopName} - no email address`);
      continue;
    }

    try {
      console.log(`📧 Sending invitation to ${artist.shopName} (${artist.email})...`);
      
      await sendArtistInvitation(artist.email, artist.shopName);
      
      successCount++;
      console.log(`✅ Sent to ${artist.shopName}\n`);

      // Add a small delay to avoid rate limiting (Resend allows 10 emails/second on free tier)
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      errorCount++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({ shop: artist.shopName, error: errorMessage });
      console.error(`❌ Failed to send to ${artist.shopName}: ${errorMessage}\n`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 Campaign Summary:");
  console.log("=".repeat(60));
  console.log(`Total artists found: ${artistsWithEmails.length}`);
  console.log(`✅ Successfully sent: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);

  if (errors.length > 0) {
    console.log("\n❌ Errors:");
    errors.forEach(({ shop, error }) => {
      console.log(`  - ${shop}: ${error}`);
    });
  }

  console.log("\n✨ Campaign complete!");
  process.exit(0);
}

// Run the campaign
sendInvitations().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
