import { getDb } from "../server/db.ts";
import { users, artists } from "../drizzle/schema.ts";
import fs from "fs";
import path from "path";

interface ArtistData {
  "Shop Name": string;
  City: string;
  Address?: string;
  "Phone Number"?: string;
  Website?: string;
  Facebook?: string;
  Instagram?: string;
  Email?: string;
  Specialties?: string;
  Rating?: string;
  Portfolio?: string;
}

function parseRating(ratingStr?: string): { rating: string; reviewCount: number } {
  if (!ratingStr) return { rating: "0", reviewCount: 0 };
  const match = ratingStr.match(/([\d.]+)\/5\s*\((\d+)\s*rating/i);
  if (match) {
    return {
      rating: match[1],
      reviewCount: parseInt(match[2]),
    };
  }
  return { rating: "0", reviewCount: 0 };
}

function mapSpecialtiesToStyles(specialties?: string): string[] {
  if (!specialties) return [];

  const styleMap: Record<string, string> = {
    Traditional: "Traditional",
    "Old School": "Traditional",
    Japanese: "Japanese",
    Oriental: "Japanese",
    Realism: "Realism",
    Realistic: "Realism",
    Watercolor: "Watercolor",
    Tribal: "Tribal",
    Geometric: "Geometric",
    Blackwork: "Blackwork",
    Black: "Blackwork",
    "Neo Traditional": "Neo-Traditional",
    Minimalist: "Minimalist",
    "Fine Line": "Fine Line",
    Portrait: "Portrait",
    Illustrative: "Illustrative",
    Dotwork: "Dotwork",
  };

  const styles = new Set<string>();
  const specialtyList = specialties.split(",").map((s) => s.trim());

  for (const specialty of specialtyList) {
    for (const [key, value] of Object.entries(styleMap)) {
      if (specialty.includes(key)) {
        styles.add(value);
      }
    }
  }

  return Array.from(styles);
}

async function seedArtists() {
  console.log("🌱 Starting artist database seeding...\n");

  // Read artist data
  const dataPath = path.join("/home/ubuntu/upload/new_tattoo_shops.json");
  const artistsData: ArtistData[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  let successCount = 0;
  let errorCount = 0;

  for (let idx = 0; idx < artistsData.length; idx++) {
    const artist = artistsData[idx];
    const shopName = artist["Shop Name"] || `Artist ${idx + 1}`;

    try {
      const { rating, reviewCount } = parseRating(artist.Rating);
      const styles = mapSpecialtiesToStyles(artist.Specialties);
      const stylesStr = styles.length > 0 ? styles.join(",") : "Traditional";

      // Create unique openId using MD5 hash
      const crypto = await import("crypto");
      const openId = crypto.createHash("md5").update(shopName).digest("hex").substring(0, 32);

      // Get database instance
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Insert user
      const userResult = await db.insert(users).values({
        openId,
        name: shopName,
        email: artist.Email || null,
        role: "artist",
      });

      const userId = Number(userResult[0].insertId);

      // Insert artist profile
      await db!.insert(artists).values({
        userId,
        shopName,
        bio: `Specializing in ${artist.Specialties || "various tattoo styles"}`,
        specialties: artist.Specialties || null,
        styles: stylesStr,
        experience: 5 + (idx % 10),
        address: artist.Address || `${artist.City || "New Orleans"}, Louisiana`,
        city: artist.City || "New Orleans",
        state: "Louisiana",
        phone: artist["Phone Number"] || null,
        website: artist.Website || null,
        instagram: artist.Instagram || null,
        facebook: artist.Facebook || null,
        averageRating: rating,
        totalReviews: reviewCount,
        isApproved: 1,
      });

      console.log(`✓ Added: ${shopName} (${artist.City || "New Orleans"})`);
      console.log(`  Styles: ${stylesStr}`);
      console.log(`  Rating: ${rating}/5 (${reviewCount} reviews)\n`);

      successCount++;
    } catch (error: any) {
      console.error(`✗ Error adding ${shopName}:`, error.message);
      errorCount++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`✅ Seeding complete!`);
  console.log(`   Success: ${successCount} artists`);
  console.log(`   Errors: ${errorCount}`);
  console.log("=".repeat(60));

  process.exit(0);
}

seedArtists().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
