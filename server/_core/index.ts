import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleStripeWebhook } from "../webhookHandler";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

const app = express();

// Stripe webhook needs raw body for signature verification
// MUST be registered BEFORE express.json()
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

// Configure body parser with larger size limit for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
// OAuth callback under /api/oauth/callback
registerOAuthRoutes(app);
// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// This block handles local development and standalone server start.
// Vercel will ignore this and use the exported `app` directly.
if (process.env.NODE_ENV === "development" || !process.env.VERCEL) {
  const server = createServer(app);

  const startLocalServer = async () => {
    // In development, Vite handles static serving. In production, serve from `dist/public`.
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const port = await findAvailablePort(parseInt(process.env.PORT || "3000"));
    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}/`);
    });
  };

  startLocalServer().catch(console.error);
}

// Export the Express app for Vercel to use as a serverless function
export default app;
