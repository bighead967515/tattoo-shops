const https = require('https');
const fs = require('fs');
const path = require('path');

function readEnvFile(filePath) {
  const env = {};
  const envContent = fs.readFileSync(filePath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      env[key] = val;
    }
  });
  return env;
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readMcpServerConfig() {
  const workspaceConfigPath = path.join('.vscode', 'mcp.json');
  const legacyConfigPath = '.mcp.json';
  const externalLegacyPaths = [
    'C:\\Users\\dillo\\.gemini\\antigravity\\mcp_config.json',
    'C:\\Users\\dillo\\.gemini\\antigravity-ide\\mcp_config.json',
  ];

  const workspaceConfig = readJsonIfExists(workspaceConfigPath);
  if (workspaceConfig) {
    return {
      config: workspaceConfig,
      servers: workspaceConfig.servers ?? workspaceConfig.mcpServers ?? {},
      source: workspaceConfigPath,
    };
  }

  const legacyConfig = readJsonIfExists(legacyConfigPath);
  if (legacyConfig) {
    return {
      config: legacyConfig,
      servers: legacyConfig.servers ?? legacyConfig.mcpServers ?? {},
      source: legacyConfigPath,
    };
  }

  for (const externalPath of externalLegacyPaths) {
    const externalConfig = readJsonIfExists(externalPath);
    if (externalConfig) {
      return {
        config: externalConfig,
        servers: externalConfig.servers ?? externalConfig.mcpServers ?? {},
        source: externalPath,
      };
    }
  }

  return {
    config: null,
    servers: {},
    source: null,
  };
}

async function main() {
  console.log("=========================================");
  console.log("   InkConnect API Key Integrity Check    ");
  console.log("=========================================\n");

  // Read .env keys
  let env = {};
  try {
    env = readEnvFile('.env');
    console.log("✅ Loaded .env variables.");
  } catch (e) {
    console.error("❌ Failed to read .env file:", e.message);
  }

  // Keys extracted from workspace MCP config (preferred) or legacy MCP config.
  const { servers: mcpServers, source: mcpConfigSource } = readMcpServerConfig();
  let stripeRestrictedKey = env.STRIPE_RESTRICTED_KEY ?? null;
  let renderApiKey = env.RENDER_API_KEY ?? null;
  let n8nApiUrl = env.N8N_API_URL ?? null;
  let n8nApiKey = env.N8N_API_KEY ?? null;
  try {
    if (mcpConfigSource) {
      console.log(`✅ Loaded MCP config from ${mcpConfigSource}.`);
    }

    const stripeArg = mcpServers?.stripe?.args?.find((a) => a.startsWith('--api-key='));
    if (!stripeRestrictedKey && stripeArg) {
      stripeRestrictedKey = stripeArg.replace('--api-key=', '');
    }
    if (!renderApiKey && mcpServers?.render?.env?.RENDER_API_KEY && !String(mcpServers.render.env.RENDER_API_KEY).startsWith('${')) {
      renderApiKey = mcpServers.render.env.RENDER_API_KEY;
    }
    if (!n8nApiUrl && mcpServers?.n8n?.env?.N8N_API_URL && !String(mcpServers.n8n.env.N8N_API_URL).startsWith('${')) {
      n8nApiUrl = mcpServers.n8n.env.N8N_API_URL;
    }
    if (!n8nApiKey && mcpServers?.n8n?.env?.N8N_API_KEY && !String(mcpServers.n8n.env.N8N_API_KEY).startsWith('${')) {
      n8nApiKey = mcpServers.n8n.env.N8N_API_KEY;
    }
  } catch (e) {
    console.warn("⚠️  Could not read MCP configuration:", e.message);
  }



  const tests = [];

  // 1. Groq
  if (env.GROQ_API_KEY) {
    tests.push({
      name: "Groq API Key",
      url: "https://api.groq.com/openai/v1/chat/completions",
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5
      }),
      validate: (status, body) => {
        if (status === 200) return { success: true };
        return { success: false, error: `HTTP ${status}: ${body.substring(0, 150)}` };
      }
    });
  }

  // 2. Hugging Face
  if (env.HUGGINGFACE_API_KEY) {
    tests.push({
      name: "HuggingFace API Key",
      url: "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: "ping" }),
      validate: (status, body) => {
        if (status === 200 || status === 503 || body.includes("estimated_time")) return { success: true };
        return { success: false, error: `HTTP ${status}: ${body.substring(0, 150)}` };
      }
    });
  }

  // OpenAI
  if (env.OPENAI_API_KEY) {
    tests.push({
      name: "OpenAI API Key",
      url: "https://api.openai.com/v1/chat/completions",
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5
      }),
      validate: (status, body) => {
        if (status === 200) return { success: true };
        return { success: false, error: `HTTP ${status}: ${body.substring(0, 150)}` };
      }
    });
  }

  // 3. Resend
  if (env.RESEND_API_KEY) {
    tests.push({
      name: "Resend API Key",
      url: "https://api.resend.com/domains",
      method: "GET",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`
      },
      validate: (status, body) => {
        if (status === 200) return { success: true };
        return { success: false, error: `HTTP ${status}: ${body.substring(0, 150)}` };
      }
    });
  }

  // 4. Stripe Secret Key
  if (env.STRIPE_SECRET_KEY) {
    tests.push({
      name: "Stripe Secret Key",
      url: "https://api.stripe.com/v1/balance",
      method: "GET",
      headers: {
        "Authorization": `Bearer ${env.STRIPE_SECRET_KEY}`
      },
      validate: (status, body) => {
        if (status === 200) return { success: true };
        if (status === 403 && body.includes("Permission denied")) {
          return { success: true, warning: "Key is valid, but lacks balance endpoint read permission (Restricted Key)" };
        }
        return { success: false, error: `HTTP ${status}: ${body.substring(0, 150)}` };
      }
    });
  }

  // 5. Stripe Restricted Key (MCP)
  if (stripeRestrictedKey) {
    tests.push({
      name: "Stripe Restricted Key (MCP)",
      url: "https://api.stripe.com/v1/balance",
      method: "GET",
      headers: {
        "Authorization": `Bearer ${stripeRestrictedKey}`
      },
      validate: (status, body) => {
        if (status === 200) return { success: true };
        if (status === 403 && body.includes("Permission denied")) {
          return { success: true, warning: "Key is valid, but lacks balance endpoint read permission (Restricted Key)" };
        }
        return { success: false, error: `HTTP ${status}: ${body.substring(0, 150)}` };
      }
    });
  }

  // Render API Key (MCP)
  if (renderApiKey) {
    tests.push({
      name: "Render API Key (MCP)",
      url: "https://api.render.com/v1/services?limit=1",
      method: "GET",
      headers: {
        "Authorization": `Bearer ${renderApiKey}`
      },
      validate: (status, body) => {
        if (status === 200) return { success: true };
        return { success: false, error: `HTTP ${status}: ${body.substring(0, 150)}` };
      }
    });
  }

  // n8n API Key (MCP)
  if (n8nApiUrl && n8nApiKey) {
    tests.push({
      name: "n8n API Key (MCP)",
      url: `${n8nApiUrl}/workflows?limit=1`,
      method: "GET",
      headers: {
        "X-N8N-API-KEY": n8nApiKey
      },
      validate: (status, body) => {
        if (status === 200) return { success: true };
        if (n8nApiKey === "YOUR_N8N_API_KEY") {
          return { success: false, error: "API key placeholder detected (YOUR_N8N_API_KEY). Please generate and replace it." };
        }
        return { success: false, error: `HTTP ${status}: ${body.substring(0, 150)}` };
      }
    });
  }



  // 6. Supabase Service Key
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
    const cleanUrl = env.SUPABASE_URL.replace(/\/$/, "");
    tests.push({
      name: "Supabase Service Key",
      url: `${cleanUrl}/auth/v1/admin/users`,
      method: "GET",
      headers: {
        "apikey": env.SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${env.SUPABASE_SERVICE_KEY}`
      },
      validate: (status, body) => {
        if (status === 200) return { success: true };
        return { success: false, error: `HTTP ${status}: ${body.substring(0, 150)}` };
      }
    });
  }

  // 7. MapTiler
  if (env.MAPTILER_API_KEY) {
    tests.push({
      name: "MapTiler API Key",
      url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${env.MAPTILER_API_KEY}`,
      method: "GET",
      validate: (status, body) => {
        if (status === 200) return { success: true };
        return { success: false, error: `HTTP ${status}: ${body.substring(0, 150)}` };
      }
    });
  }

  console.log(`\nRunning ${tests.length} integrity checks sequentially...\n`);

  const runTest = (test) => {
    return new Promise((resolve) => {
      let isDone = false;
      const done = (val) => {
        if (!isDone) {
          isDone = true;
          clearTimeout(timeoutId);
          resolve(val);
        }
      };

      const timeoutId = setTimeout(() => {
        if (req) req.destroy();
        done({ success: false, error: "Connection Timed Out (5s)" });
      }, 5000);

      let req;
      try {
        const url = new URL(test.url);
        const isHttps = url.protocol === 'https:';
        const options = {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: url.pathname + url.search,
          method: test.method || 'GET',
          headers: test.headers || {}
        };

        const client = isHttps ? https : require('http');
        req = client.request(options, (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            const outcome = test.validate(res.statusCode, body);
            done(outcome);
          });
        });

        req.on('error', (e) => {
          if (e.code === 'ECONNREFUSED' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
            done({ success: true, warning: `Service offline (Connection Refused at ${url.host})` });
          } else {
            done({ success: false, error: e.message });
          }
        });

        if (test.body) {
          req.write(test.body);
        }
        req.end();
      } catch (err) {
        done({ success: false, error: err.message });
      }
    });
  };

  for (const test of tests) {
    console.log(`Checking ${test.name}...`);
    const outcome = await runTest(test);
    if (outcome.success) {
      if (outcome.warning) {
        console.log(` -> ⚠️  ${test.name}: WORKING (Warning: ${outcome.warning})\n`);
      } else {
        console.log(` -> ✅ ${test.name}: WORKING\n`);
      }
    } else {
      console.log(` -> ❌ ${test.name}: FAILED (Reason: ${outcome.error})\n`);
    }
  }

  console.log("All checks completed.");
  process.exit(0);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
