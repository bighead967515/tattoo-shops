import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync } from 'fs';

const sql = postgres(process.env.DATABASE_URL);

try {
  const migration = readFileSync('./backend/drizzle/0000_open_the_order.sql', 'utf8');
  
  // Split by statement breakpoints and execute each
  const statements = migration
    .split('--> statement-breakpoint')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  console.log(`Applying ${statements.length} statements...`);
  
  for (const statement of statements) {
    try {
      await sql.unsafe(statement);
      console.log('✅', statement.substring(0, 50) + '...');
    } catch (error) {
      if (error.code === '42710' || error.code === '42P07') {
        console.log('⚠️  Already exists, skipping:', statement.substring(0, 50) + '...');
      } else {
        throw error;
      }
    }
  }
  
  console.log('✅ Migration applied successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
