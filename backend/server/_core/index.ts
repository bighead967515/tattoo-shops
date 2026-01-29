import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerSupabaseAuthRoutes } from "./supabaseAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleStripeWebhook } from "../webhookHandler";
import { ENV } from "./env";
import { logger } from "./logger";
import { initializeBucket } from "./supabaseStorage";

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

// CORS configuration
app.use(
  cors({
    origin: ENV.isProduction 
      ? ["https://tattoo-shops.vercel.app", "https://universalinc.com"] 
      : ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

// Rate limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Stripe webhook needs raw body for signature verification
// MUST be registered BEFORE express.json()
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

// Configure body parser with larger size limit for file uploads
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
// Supabase auth routes under /api/auth
registerSupabaseAuthRoutes(app);

// Health check endpoint for monitoring
app.get("/api/health", async (_req, res) => {
  try {
    // Test database connection
    const db = await import("../db").then(m => m.getDb());
    const dbStatus = db ? "connected" : "disconnected";
    
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: ENV.nodeEnv,
      database: dbStatus,
      version: process.env.npm_package_version || "unknown"
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: "Health check failed"
    });
  }
});

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Global error handler - MUST be last middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error("Unhandled request error", {
    message: err.message || err,
    statusCode: err.statusCode || err.status || 500,
    stack: err.stack,
  });
  const statusCode = err.statusCode || err.status || 500;
  const isDev = !ENV.isProduction;
  res.status(statusCode).json({
    error: "Internal server error",
    ...(isDev && { details: err.message, stack: err.stack }),
  });
});

// This block handles local development and standalone server start.
// Vercel will ignore this and use the exported `app` directly.
if (process.env.NODE_ENV === "development" || !process.env.VERCEL) {
  const server = createServer(app);

  const startLocalServer = async () => {
    // Initialize Supabase Storage bucket on startup
    try {
      await initializeBucket();
      logger.info("Supabase storage bucket initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize storage bucket", { error });
    }

    // In development, Vite handles static serving. In production, serve from `dist/public`.
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const port = await findAvailablePort(parseInt(process.env.PORT || "3000"));
    server.listen(port, () => {
      logger.info(`Server running on http://localhost:${port}/`);
    });
  };

  startLocalServer().catch((error) => {
    logger.error("Failed to start server", { error });
    process.exit(1);
  });
}

// Export the Express app for Vercel to use as a serverless function
export default app;
