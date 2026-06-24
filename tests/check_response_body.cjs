const https = require('https');
const fs = require('fs');

console.log("Reading keys from .env...");
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
const anonKey = env['SUPABASE_ANON_KEY'];

console.log("Testing Supabase URL:", supabaseUrl);
console.log("Testing with anon key:", anonKey ? anonKey.substring(0, 15) + "..." : "undefined");

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
    console.log(`Status code: ${res.statusCode} (${res.statusMessage})`);
    
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      console.log("Response Body:\n", body);
    });
  });

  req.on('error', (e) => {
    console.error(`❌ HTTPS request failed: ${e.message}`);
  });

  req.setTimeout(5000, () => {
    console.error("❌ HTTPS request timed out.");
    req.destroy();
  });

  req.end();
} catch (e) {
  console.error("❌ Error:", e.message);
}
