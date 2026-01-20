import { getDb } from "../server/db.ts";
import { users, bookings, reviews, artists } from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";

// Sample customer data
const sampleCustomers = [
  { name: "Sarah Johnson", email: "sarah.j@example.com" },
  { name: "Michael Chen", email: "michael.c@example.com" },
  { name: "Emily Rodriguez", email: "emily.r@example.com" },
  { name: "David Thompson", email: "david.t@example.com" },
  { name: "Jessica Williams", email: "jessica.w@example.com" },
  { name: "Robert Martinez", email: "robert.m@example.com" },
  { name: "Amanda Brown", email: "amanda.b@example.com" },
  { name: "Christopher Lee", email: "chris.l@example.com" },
];

// Sample review comments
const reviewComments = [
  {
    rating: 5,
    comment: "Absolutely amazing work! The detail and precision were incredible. Highly recommend!",
  },
  {
    rating: 5,
    comment: "Best tattoo experience I've ever had. Professional, clean, and the artwork is stunning.",
  },
  {
    rating: 4,
    comment: "Great artist with excellent attention to detail. Very happy with my new tattoo!",
  },
  {
    rating: 5,
    comment: "Phenomenal work! Exceeded my expectations. Will definitely be back for more ink.",
  },
  {
    rating: 4,
    comment: "Really talented artist. The shop was clean and the staff was friendly. Minor wait time but worth it.",
  },
  {
    rating: 5,
    comment: "Incredible artistry! Took their time to make sure everything was perfect. Love my new piece!",
  },
  {
    rating: 5,
    comment: "10/10 experience. Professional, skilled, and created exactly what I envisioned.",
  },
  {
    rating: 4,
    comment: "Very satisfied with the quality of work. The artist listened to my ideas and delivered beautifully.",
  },
];

// Artist responses
const artistResponses = [
  "Thank you so much! It was a pleasure working with you. Come back anytime!",
  "Really appreciate the kind words! Looking forward to your next piece.",
  "Thanks for the review! Glad you're happy with the result.",
  "Thank you! It was great bringing your vision to life.",
];

async function seedSampleData() {
  console.log("🌱 Starting sample data seeding...\n");

  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get top-rated artists
  const topArtists = await db
    .select()
    .from(artists)
    .where(eq(artists.isApproved, 1))
    .limit(10);

  console.log(`Found ${topArtists.length} artists to create sample data for\n`);

  let customerCount = 0;
  let bookingCount = 0;
  let reviewCount = 0;

  // Get existing sample customers or create new ones
  console.log("Getting sample customers...");
  const customerIds: number[] = [];

  for (const customer of sampleCustomers) {
    try {
      // Try to find existing customer first
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, customer.email))
        .limit(1);

      if (existing.length > 0) {
        customerIds.push(existing[0].id);
        console.log(`✓ Found existing customer: ${customer.name}`);
        customerCount++;
      } else {
        // Create new customer
        const crypto = await import("crypto");
        const openId = crypto
          .createHash("md5")
          .update(customer.email)
          .digest("hex")
          .substring(0, 32);

        const result = await db.insert(users).values({
          openId,
          name: customer.name,
          email: customer.email,
          role: "user",
        });

        const userId = Number(result[0].insertId);
        customerIds.push(userId);
        console.log(`✓ Created customer: ${customer.name}`);
        customerCount++;
      }
    } catch (error: any) {
      console.log(`  Error with ${customer.name}:`, error.message);
    }
  }

  console.log(`\n${customerCount} customers ready\n`);

  // Create sample bookings and reviews
  console.log("Creating sample bookings and reviews...\n");

  for (let i = 0; i < topArtists.length && i < 8; i++) {
    const artist = topArtists[i];
    const customerId = customerIds[i % customerIds.length];

    if (!customerId) continue;

    try {
      // Create a completed booking
      const bookingDate = new Date();
      bookingDate.setDate(bookingDate.getDate() - Math.floor(Math.random() * 30) - 7); // 7-37 days ago

      // Get customer info
      const customer = await db.select().from(users).where(eq(users.id, customerId)).limit(1);
      const customerInfo = customer[0];

      const bookingResult = await db.insert(bookings).values({
        userId: customerId,
        artistId: artist.id,
        customerName: customerInfo.name || "Customer",
        customerEmail: customerInfo.email || "customer@example.com",
        customerPhone: "555-0100",
        preferredDate: bookingDate,
        tattooDescription: "Custom tattoo design",
        placement: ["Arm", "Back", "Leg", "Shoulder"][Math.floor(Math.random() * 4)],
        size: ["Small", "Medium", "Large"][Math.floor(Math.random() * 3)],
        budget: "$200-$500",
        status: "completed",
        depositAmount: 5000, // $50 in cents
        depositPaid: 1,
        stripePaymentIntentId: `pi_test_${Math.random().toString(36).substring(7)}`,
      });

      console.log(`✓ Created booking for ${artist.shopName}`);
      bookingCount++;

      // Create a review for this booking
      const reviewData = reviewComments[i % reviewComments.length];
      const hasResponse = Math.random() > 0.5;

      await db.insert(reviews).values({
        artistId: artist.id,
        userId: customerId,
        rating: reviewData.rating,
        comment: reviewData.comment,
        helpfulVotes: Math.floor(Math.random() * 15),
        verifiedBooking: 1, // This is a verified booking
        photos: null,
        artistResponse: hasResponse
          ? artistResponses[Math.floor(Math.random() * artistResponses.length)]
          : null,
        artistResponseDate: hasResponse ? new Date() : null,
      });

      console.log(`✓ Created review (${reviewData.rating}⭐) for ${artist.shopName}`);
      reviewCount++;
    } catch (error: any) {
      console.error(`✗ Error creating data for ${artist.shopName}:`, error.message);
    }
  }

  // Create a few pending bookings
  console.log("\nCreating pending bookings...");
  for (let i = 0; i < 3 && i < topArtists.length; i++) {
    const artist = topArtists[i];
    const customerId = customerIds[(i + 3) % customerIds.length];

    if (!customerId) continue;

    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 14) + 1); // 1-15 days ahead

      // Get customer info
      const customer = await db.select().from(users).where(eq(users.id, customerId)).limit(1);
      const customerInfo = customer[0];

      await db.insert(bookings).values({
        userId: customerId,
        artistId: artist.id,
        customerName: customerInfo.name || "Customer",
        customerEmail: customerInfo.email || "customer@example.com",
        customerPhone: "555-0100",
        preferredDate: futureDate,
        tattooDescription: "Custom design consultation",
        placement: ["Arm", "Back", "Chest"][Math.floor(Math.random() * 3)],
        size: "Medium",
        budget: "$300-$600",
        status: "confirmed",
        depositAmount: 5000,
        depositPaid: 1,
        stripePaymentIntentId: `pi_test_${Math.random().toString(36).substring(7)}`,
      });

      console.log(`✓ Created pending booking for ${artist.shopName}`);
      bookingCount++;
    } catch (error: any) {
      console.error(`✗ Error:`, error.message);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`✅ Sample data seeding complete!`);
  console.log(`   Customers: ${customerCount}`);
  console.log(`   Bookings: ${bookingCount}`);
  console.log(`   Reviews: ${reviewCount}`);
  console.log("=".repeat(60));

  process.exit(0);
}

seedSampleData().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
