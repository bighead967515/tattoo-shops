import 'dotenv/config';
import { getDb } from './backend/server/db.ts';

const db = await getDb();
console.log('✅ Database connection successful!');
console.log('✅ All tables created in Supabase!');
console.log('\nNext: Apply RLS policies in Supabase dashboard');
process.exit(0);
