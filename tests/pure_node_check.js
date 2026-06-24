const https = require('https');
const net = require('net');
const fs = require('fs');

console.log("--- Checking Supabase and DB Connections ---\n");

console.log("Reading .env file...");
let env = {};
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      env[key] = val;
    }
  });
} catch (e) {
  console.error("Could not read .env file:", e.message);
}

const supabaseUrl = env['SUPABASE_URL'] || 'https://ezapxeduupaadeosouko.supabase.co';
const dbUrl = env['DATABASE_URL'] || 'postgresql://postgres.ezapxeduupaadeosouko:biggdaddy967515@aws-1-us-east-1.pooler.supabase.com:6543/postgres';
const anonKey = env['SUPABASE_ANON_KEY'];

console.log("Configured endpoints:");
console.log(" - Supabase URL:", supabaseUrl);
console.log(" - Database URL (parsed):");

// Parse database host/port from connection string
const dbUrlRegex = /@([^:/]+):?(\d+)?/;
const match = dbUrl.match(dbUrlRegex);
const dbHost = match ? match[1] : 'aws-1-us-east-1.pooler.supabase.com';
const dbPort = match && match[2] ? parseInt(match[2], 10) : 6543;
console.log(`    Host: ${dbHost}`);
console.log(`    Port: ${dbPort}`);

// 1. Check database TCP connection
console.log(`\n[Test 1] Testing TCP Connection to Database at ${dbHost}:${dbPort}...`);
const socket = new net.Socket();
socket.setTimeout(6000);

socket.on('connect', () => {
  console.log("✅ TCP Connection to Supabase Postgres database successful!");
  socket.destroy();
});

socket.on('timeout', () => {
  console.log("❌ TCP Connection to Supabase Postgres database timed out (6s).");
  socket.destroy();
});

socket.on('error', (err) => {
  console.log("❌ TCP Connection to Supabase Postgres database failed:", err.message);
});

socket.connect(dbPort, dbHost);

// 2. Check Supabase API connection via HTTPS
console.log(`\n[Test 2] Testing HTTPS Connection to Supabase API...`);
try {
  const url = new URL(supabaseUrl);
  const options = {
    hostname: url.hostname,
    port: 443,
    path: '/rest/v1/',
    method: 'GET',
    headers: {
      'apikey': anonKey
    }
  };

  const req = https.request(options, (res) => {
    console.log(`✅ Supabase HTTPS Request successful!`);
    console.log(`   Status code: ${res.statusCode} (${res.statusMessage})`);
    res.resume();
  });

  req.on('error', (e) => {
    console.error(`❌ HTTPS request failed: ${e.message}`);
  });

  req.setTimeout(6000, () => {
    console.error("❌ HTTPS request timed out (6s).");
    req.destroy();
  });

  req.end();
} catch (e) {
  console.error("❌ Invalid Supabase URL configuration:", e.message);
}
