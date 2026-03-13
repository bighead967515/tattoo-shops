import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../../vite.config.ts";

function resolveWorkspaceRoot(): string {
  // Resolve workspace root reliably in both tsx source and bundled dist runtimes.
  const candidates = [
    process.cwd(),
    path.resolve(import.meta.dirname, "../../.."),
    path.resolve(import.meta.dirname, ".."),
  ];

  const matched = candidates.find((candidate) =>
    fs.existsSync(path.resolve(candidate, "frontend", "client", "index.html")),
  );
  if (matched) {
    return matched;
  }

  throw new Error(
    `Could not locate workspace root. Checked: ${candidates.join(", ")}`,
  );
}

function resolveClientTemplatePath(workspaceRoot: string): string {
  return path.resolve(workspaceRoot, "frontend", "client", "index.html");
}

export async function setupVite(app: Express, server: Server) {
  const workspaceRoot = resolveWorkspaceRoot();
  const clientRoot = path.resolve(workspaceRoot, "frontend", "client");

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    envDir: workspaceRoot,
    root: clientRoot,
    publicDir: path.resolve(clientRoot, "public"),
    resolve: {
      alias: {
        "@": path.resolve(clientRoot, "src"),
        "@shared": path.resolve(workspaceRoot, "backend", "shared"),
        "@assets": path.resolve(workspaceRoot, "attached_assets"),
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = resolveClientTemplatePath(workspaceRoot);

      // Always reload the index.html file from disk in case it changes.
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

function resolveDistPath(): string {
  // Support both bundled runtime (dist/index.js) and source runtime (tsx).
  const candidates = [
    path.resolve(import.meta.dirname, "public"),
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(import.meta.dirname, "../..", "dist", "public"),
  ];

  const matched = candidates.find((candidate) => fs.existsSync(candidate));
  if (matched) {
    return matched;
  }

  throw new Error(
    `Could not find the build directory. Checked: ${candidates.join(", ")}`,
  );
}

export function serveStatic(app: Express) {
  const distPath = resolveDistPath();

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
