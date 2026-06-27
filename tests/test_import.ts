import 'dotenv/config';
console.log('1. dotenv loaded');

console.log('2. importing supabase...');
import { supabaseAdmin } from '../backend/server/_core/supabase';
console.log('Supabase imported');

console.log('3. importing db...');
import { getDb } from '../backend/server/db';
console.log('DB imported');

async function run() {
  console.log('4. Listing Supabase buckets...');
  const { data, error } = await supabaseAdmin.storage.listBuckets();
  console.log('Supabase buckets:', data, error);

  console.log('5. Connecting to DB...');
  const db = await getDb();
  console.log('DB connected:', !!db);
}

run().catch(console.error);
