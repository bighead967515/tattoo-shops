const https = require('https');
const net = require('net');
const fs = require('fs');

console.log("Reading .env...");
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
} catch (e) {}

const supabaseUrl = env['SUPABASE_URL'] || 'https://ezapxeduupaadeosouko.supabase.co';
const anonKey = env['SUPABASE_ANON_KEY'];
const serviceKey = env['SUPABASE_SERVICE_KEY'];
const dbUrl = env['DATABASE_URL'] || '';

const dbUrlRegex = /@([^:/]+):?(\d+)?/;
const match = dbUrl.match(dbUrlRegex);
const dbHost = match ? match[1] : 'aws-1-us-east-1.pooler.supabase.com';
const dbPort = match && match[2] ? parseInt(match[2], 10) : 6543;

console.log(`Testing Database TCP on ${dbHost}:${dbPort}...`);
const socket = new net.Socket();
socket.setTimeout(3000);

socket.on('connect', () => {
  console.log("✅ Database TCP Connection Successful!");
  socket.destroy();
  testHttps();
});

socket.on('timeout', () => {
  console.log("❌ Database TCP Connection Timed Out!");
  socket.destroy();
  testHttps();
});

socket.on('error', (err) => {
  console.log("❌ Database TCP Connection Failed:", err.message);
  testHttps();
});

socket.connect(dbPort, dbHost);

function testHttps() {
  console.log("\nTesting Supabase REST API HTTPS request...");
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
      console.log(`✅ Supabase HTTPS Response Status: ${res.statusCode} (${res.statusMessage})`);
      
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        console.log("   Response Body preview:", body.substring(0, 200));
        process.exit(0);
      });
    });

    req.on('error', (e) => {
      console.error(`❌ HTTPS request failed: ${e.message}`);
      process.exit(0);
    });

    req.setTimeout(3000, () => {
      console.error("❌ HTTPS request timed out.");
      req.destroy();
      process.exit(0);
    });

    req.end();
  } catch (e) {
    console.error("❌ Invalid URL:", e.message);
    process.exit(0);
  }
}
