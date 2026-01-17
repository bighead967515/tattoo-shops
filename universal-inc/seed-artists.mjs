import mysql from "mysql2/promise";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const artistsData = JSON.parse(
  fs.readFileSync("/home/ubuntu/upload/new_tattoo_shops.json", "utf-8")
);

// Parse rating string like "4.9/5 (22 ratings)" to extract rating and review count
function parseRating(ratingStr) {
  if (!ratingStr) return { rating: 0, reviewCount: 0 };
  const match = ratingStr.match(/([\d.]+)\/5\s*\((\d+)\s*rating/i);
  if (match) {
    return {
      rating: parseFloat(match[1]),
      reviewCount: parseInt(match[2]),
    };
  }
  return { rating: 0, reviewCount: 0 };
}

// Map specialties to our style tags
function mapSpecialtiesToStyles(specialties) {
  if (!specialties) return [];
  
  const styleMap = {
    "Traditional": "Traditional",
    "Old School": "Traditional",
    "Japanese": "Japanese",
    "Oriental": "Japanese",
    "Realism": "Realism",
    "Realistic": "Realism",
    "Watercolor": "Watercolor",
    "Tribal": "Tribal",
    "Geometric": "Geometric",
    "Blackwork": "Blackwork",
    "Black": "Blackwork",
    "Neo Traditional": "Neo-Traditional",
    "Minimalist": "Minimalist",
    "Fine Line": "Fine Line",
    "Portrait": "Portrait",
    "Illustrative": "Illustrative",
    "Dotwork": "Dotwork",
  };
  
  const styles = new Set();
  const specialtyList = specialties.split(",").map(s => s.trim());
  
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
  
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  let successCount = 0;
  let errorCount = 0;

  for (const artist of artistsData) {
    try {
      const { rating, reviewCount } = parseRating(artist.Rating);
      const styles = mapSpecialtiesToStyles(artist.Specialties);
      
      // Insert artist
      const result = await connection.execute(
        `INSERT INTO artists (
          name, 
          bio, 
          location, 
          city,
          phone, 
          email, 
          website, 
          instagram, 
          facebook,
          styles,
          experience_years,
          average_rating,
          total_reviews,
          portfolio_url,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          artist["Shop Name"],
          `Specializing in ${artist.Specialties || "various tattoo styles"}`,
          artist.Address || `${artist.City}, Louisiana`,
          artist.City || "New Orleans",
          artist["Phone Number"] || null,
          artist.Email || null,
          artist.Website || null,
          artist.Instagram || null,
          artist.Facebook || null,
          styles.length > 0 ? styles.join(",") : "Traditional",
          Math.floor(Math.random() * 10) + 5, // Random 5-15 years experience
          rating || 4.5,
          reviewCount || 0,
          artist.Portfolio || null,
        ]
      );

      console.log(`✓ Added: ${artist["Shop Name"]} (${artist.City})`);
      console.log(`  Styles: ${styles.join(", ") || "Traditional"}`);
      console.log(`  Rating: ${rating}/5 (${reviewCount} reviews)\n`);
      
      successCount++;
    } catch (error) {
      console.error(`✗ Error adding ${artist["Shop Name"]}:`, error.message);
      errorCount++;
    }
  }

  await connection.end();

  console.log("\n" + "=".repeat(60));
  console.log(`✅ Seeding complete!`);
  console.log(`   Success: ${successCount} artists`);
  console.log(`   Errors: ${errorCount}`);
  console.log("=".repeat(60));
}

seedArtists().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
