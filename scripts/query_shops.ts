import "dotenv/config";
import { getDb } from "../backend/server/db.js";
import { shops } from "../backend/drizzle/schema.js";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("Failed to connect to database");
    process.exit(1);
  }

  const allShops = await db.select().from(shops);
  console.log(`Total shops: ${allShops.length}`);

  const corruptedNames = [
    "charlie",
    "hard case",
    "ink dragon",
    "birmingham",
    "awesom",
    "birdhouse",
    "fortune"
  ];

  for (const shop of allShops) {
    const isTarget = corruptedNames.some(name => 
      shop.shopName.toLowerCase().includes(name) ||
      (shop.city && shop.city.toLowerCase().includes(name)) ||
      (shop.address && shop.address.toLowerCase().includes(name))
    );

    if (isTarget || shop.shopName.includes(",") || (shop.city && (shop.city.includes("tland") || shop.city.includes("VA")))) {
      console.log(JSON.stringify(shop, null, 2));
    }
  }
}

main().catch(console.error);
