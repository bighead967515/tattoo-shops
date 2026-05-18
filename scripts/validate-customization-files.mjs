#!/usr/bin/env node

import { readdir } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const STRICT = process.argv.includes("--strict");

const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "playwright-report",
  "test-results",
]);

const buckets = {
  Prompt: [],
  Agent: [],
  Instructions: [],
};

const expectedBaseByType = {
  Prompt: ".github/prompts/",
  Agent: ".github/agents/",
  Instructions: ".github/instructions/",
};

const allowedNonPatternFiles = new Set([
  ".github/copilot-instructions.md",
]);

const issues = [];
const suspiciousFiles = [];

function getType(fileName) {
  if (fileName.endsWith(".prompt.md")) return "Prompt";
  if (fileName.endsWith(".agent.md")) return "Agent";
  if (fileName.endsWith(".instructions.md")) return "Instructions";
  return null;
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(ROOT, fullPath).replace(/\\/g, "/");

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      await walk(fullPath);
      continue;
    }

    const type = getType(entry.name);
    if (type) {
      buckets[type].push(relativePath);

      const expectedBase = expectedBaseByType[type];
      if (!relativePath.startsWith(expectedBase)) {
        issues.push(
          `Misplaced ${type}: ${relativePath} (expected under ${expectedBase})`,
        );
      }
      continue;
    }

    const looksLikeCustomization =
      /(?:^|[-_.])(prompt|agent|instructions)(?:[-_.]|$)/i.test(entry.name) &&
      entry.name.endsWith(".md");

    if (looksLikeCustomization && !allowedNonPatternFiles.has(relativePath)) {
      suspiciousFiles.push(relativePath);
    }
  }
}

function printSection(title, files) {
  console.log(`\n${title} (${files.length})`);
  if (files.length === 0) {
    console.log("  - none");
    return;
  }
  for (const file of files.sort((a, b) => a.localeCompare(b))) {
    console.log(`  - ${file}`);
  }
}

async function main() {
  await walk(ROOT);

  console.log("Customization File Validation");
  console.log("============================");
  console.log("Patterns:");
  console.log("  *.prompt.md        => Prompt");
  console.log("  *.agent.md         => Agent");
  console.log("  *.instructions.md  => Instructions");

  printSection("Prompt", buckets.Prompt);
  printSection("Agent", buckets.Agent);
  printSection("Instructions", buckets.Instructions);

  if (suspiciousFiles.length > 0) {
    console.log(`\nSuspicious Markdown files (${suspiciousFiles.length})`);
    for (const file of suspiciousFiles.sort((a, b) => a.localeCompare(b))) {
      console.log(`  - ${file}`);
    }
    console.log("  Hint: ensure customization files end with .prompt.md, .agent.md, or .instructions.md");
  }

  if (issues.length > 0) {
    console.log(`\nBest-practice issues (${issues.length})`);
    for (const issue of issues) {
      console.log(`  - ${issue}`);
    }
  } else {
    console.log("\nBest-practice checks: PASS");
  }

  const total = buckets.Prompt.length + buckets.Agent.length + buckets.Instructions.length;
  console.log(`\nTotal matched files: ${total}`);

  if (STRICT && (issues.length > 0 || suspiciousFiles.length > 0)) {
    console.error("\nStrict mode failed.");
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Validation failed:", error);
  process.exitCode = 1;
});
