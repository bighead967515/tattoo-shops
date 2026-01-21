import 'dotenv/config';
import { supabaseAdmin } from './backend/server/_core/supabase';
import { initializeBucket } from './backend/server/_core/supabaseStorage';

/**
 * Test Supabase connection and initialize storage
 * Run this once to verify setup
 */

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase connection...\n');

  try {
    // Test 1: Check database connection
    console.log('1️⃣ Testing database connection...');
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error.message);
      console.log('💡 Make sure DATABASE_URL points to your Supabase database');
      console.log('💡 Run: pnpm db:push to create tables\n');
    } else {
      console.log('✅ Database connection successful!\n');
    }

    // Test 2: Check auth service
    console.log('2️⃣ Testing auth service...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    if (authError) {
      console.error('❌ Auth service failed:', authError.message);
      console.log('💡 Check SUPABASE_SERVICE_KEY is correct\n');
    } else {
      console.log(`✅ Auth service working! (${authData.users.length} users found)\n`);
    }

    // Test 3: Check storage service
    console.log('3️⃣ Testing storage service...');
    const { data: buckets, error: storageError } = await supabaseAdmin.storage.listBuckets();

    if (storageError) {
      console.error('❌ Storage service failed:', storageError.message);
    } else {
      console.log(`✅ Storage service working! (${buckets?.length || 0} buckets found)`);
      
      const portfolioBucket = buckets?.find(b => b.name === 'portfolio-images');
      if (portfolioBucket) {
        console.log('✅ Portfolio images bucket already exists!\n');
      } else {
        console.log('⚠️  Portfolio images bucket not found. Creating...');
        await initializeBucket();
        console.log('✅ Portfolio images bucket created!\n');
      }
    }

    // Test 4: Test bucket access
    console.log('4️⃣ Testing bucket access...');
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('portfolio-images')
      .list('', { limit: 1 });

    if (listError) {
      console.error('❌ Cannot access bucket:', listError.message);
    } else {
      console.log('✅ Bucket access successful!\n');
    }

    console.log('🎉 All tests passed! Supabase is ready to use.\n');
    console.log('Next steps:');
    console.log('1. Make sure DATABASE_URL points to Supabase');
    console.log('2. Run: pnpm db:push');
    console.log('3. Apply RLS policies (see SUPABASE_MIGRATION.md)');
    console.log('4. Enable auth providers in Supabase dashboard');
    console.log('5. Start development: pnpm dev\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('- Check .env file has correct Supabase credentials');
    console.log('- Verify SUPABASE_URL format: https://xxxxx.supabase.co');
    console.log('- Verify SUPABASE_SERVICE_KEY starts with: eyJhbGc...');
    console.log('- Check your Supabase project is active');
  }
}

// Run the test
testSupabaseConnection()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
