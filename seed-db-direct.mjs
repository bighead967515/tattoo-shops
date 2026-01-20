import fs from 'fs';
import { execSync } from 'child_process';

const sqlFile = '/home/ubuntu/upload/seed_artists_correct.sql';
const sqlContent = fs.readFileSync(sqlFile, 'utf-8');

// Split into individual statements
const statements = sqlContent
  .split('\n')
  .filter(line => line.trim() && !line.startsWith('--'))
  .join('\n')
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

console.log(`Found ${statements.length} SQL statements to execute\n`);

let successCount = 0;
let errorCount = 0;

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i];
  
  // Extract artist name from comment if available
  const match = stmt.match(/INSERT INTO users.*VALUES \('[^']+', '([^']+)'/);
  const artistName = match ? match[1] : `Statement ${i + 1}`;
  
  try {
    // Use pnpm db:execute to run the SQL
    const tempFile = `/tmp/sql_${i}.sql`;
    fs.writeFileSync(tempFile, stmt + ';');
    
    execSync(`cd /home/ubuntu/universalinc && pnpm db:execute < ${tempFile}`, {
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    
    fs.unlinkSync(tempFile);
    
    if (stmt.includes('INSERT INTO users')) {
      process.stdout.write(`✓ ${artistName}... `);
    } else {
      console.log('profile created');
    }
    
    successCount++;
  } catch (error) {
    console.error(`\n✗ Error: ${error.message}`);
    errorCount++;
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`✅ Seeding complete!`);
console.log(`   Success: ${successCount} statements`);
console.log(`   Errors: ${errorCount}`);
console.log(`   Artists added: ${Math.floor(successCount / 2)}`);
console.log('='.repeat(60));
