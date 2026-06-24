import "dotenv/config";
import { supabaseAdmin } from "../backend/server/_core/supabase";
import { getDb } from "../backend/server/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Checking connection status...\n");
  
  // 1. Check Supabase API / Storage
  try {
    console.log("Connecting to Supabase API/Storage...");
    const { data: buckets, error: storageError } = await supabaseAdmin.storage.listBuckets();
    if (storageError) {
      console.error("❌ Supabase Storage connection failed:", storageError.message);
    } else {
      console.log("✅ Supabase API/Storage connection successful!");
      console.log(`   Found ${buckets?.length || 0} buckets:`, buckets?.map(b => b.name).join(", ") || "none");
    }
  } catch (err: any) {
    console.error("❌ Supabase API/Storage connection error:", err.message || err);
  }

  console.log("");

  // 2. Check Database Connection
  try {
    console.log("Connecting to Supabase Postgres database via Drizzle...");
    const db = await getDb();
    if (!db) {
      console.error("❌ Database connection failed: Drizzle DB instance is null.");
    } else {
      const result = await db.execute(sql`SELECT 1 as connection_test`);
      console.log("✅ Supabase Postgres database connection successful!");
      console.log("   Result:", JSON.stringify(result));
    }
  } catch (err: any) {
    console.error("❌ Supabase Postgres database connection error:", err.message || err);
  }
}

main().catch(err => {
  console.error("Unhandled error in test script:", err);
});
