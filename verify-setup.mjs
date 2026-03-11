import "dotenv/config";
import { supabaseAdmin } from "./backend/server/_core/supabase.js";

async function verifyAuth() {
  console.log("🔍 Verifying authentication flow...\n");

  try {
    // Test 1: Verify Supabase connection
    console.log("1. Testing Supabase connection...");
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;
    console.log(
      `✅ Connected to Supabase (${data.users.length} users found)\n`,
    );

    // Test 2: Test database connection
    console.log("2. Testing database connection...");
    const { getDb } = await import("./backend/server/db.js");
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    console.log("✅ Database connected successfully\n");

    // Test 3: Verify environment variables
    console.log("3. Verifying environment variables...");
    const requiredVars = [
      "DATABASE_URL",
      "SUPABASE_URL",
      "SUPABASE_SERVICE_KEY",
      "SUPABASE_ANON_KEY",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "RESEND_API_KEY",
      "JWT_SECRET",
    ];

    const missing = requiredVars.filter((v) => !process.env[v]);
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(", ")}`);
    }
    console.log("✅ All required environment variables are set\n");

    // Test 4: Verify storage bucket
    console.log("4. Testing storage bucket...");
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const portfolioBucket = buckets?.find((b) => b.name === "portfolio-images");

    if (!portfolioBucket) {
      console.log(
        "⚠️  Portfolio bucket not found - will be created on first server start",
      );
    } else {
      console.log("✅ Portfolio storage bucket exists");
    }

    console.log(
      "\n🎉 Authentication and environment setup verified successfully!",
    );
    console.log("\nNext steps:");
    console.log("1. Start the development server: pnpm dev");
    console.log("2. Test user registration and login flows");
    console.log("3. Verify artist profile creation works");
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    process.exit(1);
  }
}

verifyAuth();
