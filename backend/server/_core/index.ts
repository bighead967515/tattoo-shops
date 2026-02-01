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
import { handleStripeWebhook, initWebhookProcessor, getWebhookQueueStats } from "../webhookHandler";
import { ENV } from "./env";
import { logger } from "./logger";
import { initializeBucket } from "./supabaseStorage";
import { initSentry, sentryErrorHandler, captureException } from "./sentry";

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

// Initialize Sentry early (must be before other middleware)
initSentry();

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

// Stricter rate limiting for auth routes: 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth/", authLimiter);

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
    // Test database connection with a simple query
    const db = await import("../db").then(m => m.getDb());
    let dbStatus = "disconnected";
    
    if (db) {
      // Execute a simple query to verify connection
      const { sql } = await import("drizzle-orm");
      await db.execute(sql`SELECT 1`);
      dbStatus = "connected";
    }
    
    // Get webhook queue stats
    const webhookStats = await getWebhookQueueStats();
    
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: ENV.nodeEnv,
      database: dbStatus,
      webhookQueue: webhookStats,
      version: process.env.npm_package_version || "unknown"
    });
  } catch (error) {
    logger.error("Health check failed", { error });
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: "Health check failed"
    });
  }
});

// Dynamic sitemap for SEO - includes all approved artists
app.get("/sitemap.xml", async (_req, res) => {
  try {
    const { getAllArtists } = await import("../db");
    const artists = await getAllArtists();
    const baseUrl = "https://universalinc.com";
    
    const staticPages = [
      { loc: "/", changefreq: "weekly", priority: "1.0" },
      { loc: "/artists", changefreq: "daily", priority: "0.9" },
      { loc: "/artist-finder", changefreq: "weekly", priority: "0.8" },
      { loc: "/for-artists", changefreq: "monthly", priority: "0.7" },
      { loc: "/pricing", changefreq: "monthly", priority: "0.6" },
      { loc: "/help", changefreq: "monthly", priority: "0.5" },
    ];
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    
    // Add static pages
    for (const page of staticPages) {
      xml += `
  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    }
    
    // Add dynamic artist pages
    for (const artist of artists) {
      const lastmod = artist.updatedAt.toISOString().split('T')[0];
      xml += `
  <url>
    <loc>${baseUrl}/artist/${artist.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }
    
    xml += `
</urlset>`;
    
    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    res.send(xml);
  } catch (error) {
    logger.error("Sitemap generation failed", { error });
    res.status(500).send("Error generating sitemap");
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
// Sentry error handler first to capture errors
app.use(sentryErrorHandler());

app.use((err: Error & { statusCode?: number; status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const statusCode = err.statusCode || err.status || 500;
  
  // Capture error in Sentry
  captureException(err, {
    statusCode,
    url: _req.url,
    method: _req.method,
  });
  
  logger.error("Unhandled request error", {
    message: err.message,
    statusCode,
    stack: err.stack,
  });
  const isDev = !ENV.isProduction;
  res.status(statusCode).json({
    error: "Internal server error",
    ...(isDev && { details: err.message, stack: err.stack }),
  });
});

// This block handles local development.
// Vercel will ignore this and use the exported `app` directly.
if (process.env.NODE_ENV === "development") {
  const server = createServer(app);

  const startLocalServer = async () => {
    // Initialize Supabase Storage bucket on startup
    try {
      await initializeBucket();
      logger.info("Supabase storage bucket initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize storage bucket", { error });
    }

    // Initialize webhook retry queue processor
    try {
      initWebhookProcessor();
      logger.info("Webhook retry processor initialized");
    } catch (error) {
      logger.error("Failed to initialize webhook processor", { error });
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
