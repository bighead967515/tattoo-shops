import path from "path";
import { pathToFileURL } from "url";
import { build, initialize, stop } from "esbuild-wasm";

const wasmPath = path.resolve("node_modules", "esbuild-wasm", "esbuild.wasm");

await initialize({
  wasmURL: pathToFileURL(wasmPath).href,
  worker: false,
});

try {
  await build({
    entryPoints: ["backend/server/_core/index.ts"],
    platform: "node",
    packages: "external",
    bundle: true,
    format: "esm",
    outdir: "dist",
    logLevel: "info",
  });
} finally {
  stop();
}
