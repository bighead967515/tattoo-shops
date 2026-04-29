import pg from 'pg';
const { Pool } = pg;
const url = process.env.DATABASE_URL || 'postgresql://postgres.ezapxeduupaadeosouko:vW5MLxv0dti3hdbf@aws-1-us-east-1.pooler.supabase.com:6543/postgres';
const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
const res = await pool.query('UPDATE artists SET "isApproved" = true WHERE "isApproved" = false OR "isApproved" IS NULL');
console.log('Updated rows:', res.rowCount);
await pool.end();
