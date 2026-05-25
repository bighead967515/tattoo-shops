#!/usr/bin/env node
/**
 * Import all Ink Connect n8n workflows from the workflows/json/ directory.
 *
 * Usage:
 *   node import-workflows.mjs
 *   node import-workflows.mjs --url http://myserver:5678 --user admin --pass mypassword
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const get = (flag, def) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : def;
};

const BASE_URL = get("--url", "http://localhost:5678");
const USER = get("--user", "admin");
const PASS = get("--pass", "inkconnect-local");
const AUTH = Buffer.from(`${USER}:${PASS}`).toString("base64");
const JSON_DIR = path.join(__dirname, "workflows", "json");

async function importWorkflow(filePath) {
  const name = path.basename(filePath, ".json");
  const body = fs.readFileSync(filePath, "utf-8");

  const res = await fetch(`${BASE_URL}/rest/workflows`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${AUTH}`,
    },
    body,
  });

  if (res.ok) {
    const data = await res.json();
    console.log(`✓  ${name}  (id: ${data.data?.id ?? data.id})`);
    return { name, status: "created", id: data.data?.id ?? data.id };
  } else {
    const text = await res.text();
    console.error(`✗  ${name}  ${res.status} — ${text.slice(0, 120)}`);
    return { name, status: "failed", error: text.slice(0, 120) };
  }
}

async function main() {
  if (!fs.existsSync(JSON_DIR)) {
    console.error(`No workflows/json/ directory found at ${JSON_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(JSON_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(JSON_DIR, f));

  if (files.length === 0) {
    console.error("No .json workflow files found in workflows/json/");
    process.exit(1);
  }

  console.log(`Importing ${files.length} workflows to ${BASE_URL}...\n`);

  const results = [];
  for (const f of files) {
    results.push(await importWorkflow(f));
  }

  const ok = results.filter((r) => r.status === "created").length;
  const fail = results.filter((r) => r.status === "failed").length;
  console.log(`\nDone — ${ok} created, ${fail} failed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
