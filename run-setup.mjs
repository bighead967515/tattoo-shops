import 'dotenv/config';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runSetup() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }
  
  console.log('🚀 Applying Supabase setup SQL...\n');
  
  try {
    // Parse DATABASE_URL
    const url = new URL(dbUrl);
    const host = url.hostname;
    const port = url.port;
    const database = url.pathname.slice(1);
    const username = url.username;
    const password = url.password;
    
    const command = `PGPASSWORD='${password}' psql -h ${host} -p ${port} -U ${username} -d ${database} -f supabase-setup.sql`;
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('\n✅ Setup complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Alternative: Copy supabase-setup.sql and run it manually in Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/ezapxeduupaadeosouko/sql/new');
  }
}

runSetup();
