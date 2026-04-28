import { build } from "esbuild-wasm";

await build({
  entryPoints: ["backend/server/_core/index.ts"],
  platform: "node",
  packages: "external",
  bundle: true,
  format: "esm",
  outdir: "dist",
  logLevel: "info",
});
