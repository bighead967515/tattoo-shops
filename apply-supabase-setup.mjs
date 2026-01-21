import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync } from 'fs';

const sql = postgres(process.env.DATABASE_URL);

async function setupSupabase() {
  try {
    console.log('🚀 Setting up Supabase database...\n');
    
    const setupSQL = readFileSync('./supabase-setup.sql', 'utf8');
    
    // Split by semicolons and filter out comments and empty statements
    const statements = setupSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...\n`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      try {
        await sql.unsafe(statement + ';');
        successCount++;
        
        // Log important operations
        if (statement.includes('CREATE POLICY')) {
          const policyName = statement.match(/"([^"]+)"/)?.[1] || 'policy';
          console.log(`✅ Created policy: ${policyName}`);
        } else if (statement.includes('CREATE FUNCTION')) {
          const funcName = statement.match(/CREATE.*FUNCTION\s+(\w+\.\w+)/)?.[1] || 'function';
          console.log(`✅ Created function: ${funcName}`);
        } else if (statement.includes('CREATE TRIGGER')) {
          const triggerName = statement.match(/CREATE TRIGGER\s+(\w+)/)?.[1] || 'trigger';
          console.log(`✅ Created trigger: ${triggerName}`);
        } else if (statement.includes('CREATE INDEX')) {
          const indexName = statement.match(/CREATE INDEX\s+(?:IF NOT EXISTS\s+)?(\w+)/)?.[1] || 'index';
          console.log(`✅ Created index: ${indexName}`);
        } else if (statement.includes('ENABLE ROW LEVEL SECURITY')) {
          const tableName = statement.match(/TABLE\s+(\w+)/)?.[1] || 'table';
          console.log(`✅ Enabled RLS on: ${tableName}`);
        }
      } catch (error) {
        if (error.code === '42710' || error.code === '42P07' || error.code === '42P16' || error.message?.includes('already exists')) {
          skipCount++;
          // Silently skip already exists errors
        } else if (error.message?.includes('does not exist')) {
          // Skip missing table errors (like auth.users trigger)
          skipCount++;
          console.log(`⚠️  Skipped: ${error.message}`);
        } else {
          errorCount++;
          console.error(`❌ Error executing statement:`, error.message);
          console.error(`Statement: ${statement.substring(0, 100)}...`);
        }
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    // Verify setup
    console.log(`\n🔍 Verifying setup...`);
    
    const policies = await sql`
      SELECT tablename, COUNT(*) as count
      FROM pg_policies
      WHERE schemaname = 'public'
      GROUP BY tablename
    `;
    
    console.log(`\n📋 RLS Policies by table:`);
    for (const row of policies) {
      console.log(`   ${row.tablename}: ${row.count} policies`);
    }
    
    const triggers = await sql`
      SELECT tgname, tgrelid::regclass as table_name
      FROM pg_trigger
      WHERE tgname LIKE 'on_%' OR tgname LIKE 'update_%'
    `;
    
    console.log(`\n⚡ Triggers:`);
    for (const row of triggers) {
      console.log(`   ${row.tgname} on ${row.table_name}`);
    }
    
    console.log(`\n✅ Supabase setup complete!`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Enable auth providers in Supabase dashboard`);
    console.log(`   2. Configure OAuth redirect URLs`);
    console.log(`   3. Test authentication flow`);
    console.log(`   4. Start development server: pnpm dev`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

setupSupabase();
