import "dotenv/config";
import express, {
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import { createRequire } from "module";
import path from "path";
import cors from "cors";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import helmet from "helmet";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerSupabaseAuthRoutes } from "./supabaseAuth";
import { csrfTokenMiddleware, csrfProtectionMiddleware } from "./csrf";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import {
  handleStripeWebhook,
  initWebhookProcessor,
  getWebhookQueueStats,
} from "../webhookHandler";
import { ENV } from "./env";
import { logger } from "./logger";
import { initializeBuckets } from "./supabaseStorage";
import { initSentry, sentryErrorHandler, captureException } from "./sentry";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
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

function isBundledDistRuntime(): boolean {
  return path.basename(import.meta.dirname).toLowerCase() === "dist";
}

function parseAllowedOrigins(): string[] {
  const fromEnv = ENV.corsAllowedOrigins
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }

  return ENV.isProduction
    ? [
        "https://theinkednetwork.website",
        "https://www.theinkednetwork.website",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ]
    : ["http://localhost:3000", "http://localhost:5173"];
}

const allowedOrigins = parseAllowedOrigins();
const require = createRequire(import.meta.url);

const app = express();

// Trust reverse proxy (required for Render, and other hosted environments)
// This allows express-rate-limit to correctly identify client IPs via X-Forwarded-For
app.set("trust proxy", 1);

// Initialize Sentry early (must be before other middleware)
initSentry();

// Security headers
// CSP is production-only — Vite dev middleware uses websockets and inline code for HMR
// that would be blocked by a strict policy.
//
// Policy notes:
//   script-src: 'self' covers the Vite-built bundle served from the same origin.
//               'strict-dynamic' is intentionally omitted — it disables domain
//               allowlisting and requires per-script nonces, which a static SPA
//               cannot provide, resulting in a blank page.
//   style-src:  'unsafe-inline' required by Tailwind/shadcn runtime class injection.
//   img-src:    Supabase hostname for portfolio/request images; data: + blob: for upload
//               previews generated with URL.createObjectURL().
//   connect-src: tRPC (same-origin), Supabase auth + realtime websocket, Stripe checkout.
//   frame-src:  Stripe payment iframe.
app.use(
  helmet({
    contentSecurityPolicy: ENV.isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://js.stripe.com"],
            styleSrc: [
              "'self'",
              "'unsafe-inline'",
              "https://fonts.googleapis.com",
            ],
            imgSrc: [
              "'self'",
              "data:",
              "blob:",
              new URL(ENV.supabaseUrl).hostname,
            ],
            connectSrc: [
              "'self'",
              ENV.supabaseUrl,
              ENV.supabaseUrl.replace("https://", "wss://"),
              "https://api.stripe.com",
            ],
            frameSrc: [
              "https://js.stripe.com",
              "https://hooks.stripe.com",
            ],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: [],
          },
        }
      : false,
  }),
);

// Gzip/deflate response compression — applied before all middleware so every
// response (API JSON, HTML, assets) benefits. Static assets already have
// Content-Encoding from Vite build, so this mainly helps API responses.
let compressionMiddleware: RequestHandler | null = null;
try {
  const compressionModule = require("compression") as () => RequestHandler;
  compressionMiddleware = compressionModule();
} catch {
  logger.warn("compression package not found; continuing without response compression");
}

if (compressionMiddleware) {
  app.use(compressionMiddleware);
}

// CORS configuration
app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser and same-origin requests with no Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
    exposedHeaders: ["X-CSRF-Token"],
  }),
);

// Rate limiting: 500 requests per 15 minutes per IP for general API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: "Too many requests from this IP, please try again later.",
      retryAfter: 15,
    });
  },
  skip: (req) => {
    // Only skip rate limiting for lightweight, cacheable GET tRPC queries.
    // AI discovery, search, and other expensive procedures remain rate-limited.
    if (req.method !== "GET" || !req.path.startsWith("/api/trpc/")) return false;
    const expensive = ["artists.discover", "requests.refineDescription", "ai."];
    return !expensive.some((prefix) => req.path.includes(prefix));
  },
});
app.use("/api/", limiter);

// Stricter rate limiting for auth routes: 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: "Too many authentication attempts, please try again later.",
      retryAfter: 15,
    });
  },
});
app.use("/api/auth/", authLimiter);

// Strict rate limiting for AI generation routes: 10 requests per 15 minutes per IP.
// Each call triggers a paid Hugging Face image generation; the general 500 req/15min
// limit is far too permissive for a billed external API.
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: "AI generation limit reached. Please try again in 15 minutes.",
      retryAfter: 15,
    });
  },
  keyGenerator: (req) => {
    // express-rate-limit v8 requires the helper for IPv6-safe IP fallback keys.
    // Keep authenticated users isolated by appending the session cookie.
    const ip = ipKeyGenerator(req.ip || req.socket.remoteAddress || "unknown");
    const session = req.cookies?.["app_session_id"] || "";
    return `${ip}:${session}`;
  },
});
// Applied before the generic /api/ limiter so AI routes hit this limit first.
app.use("/api/trpc/ai.", aiLimiter);

// Stripe webhook needs raw body for signature verification
// MUST be registered BEFORE express.json()
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook,
);

// Configure body parser — files are uploaded directly to Supabase Storage via signed URLs,
// so the JSON body limit only needs to cover text payloads (descriptions, bids, reviews).
app.use(cookieParser());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

// P1-1 CSRF Protection Middleware
// Verify CSRF tokens on all mutations (POST/PUT/PATCH/DELETE)
app.use(csrfTokenMiddleware); // Set CSRF token in response header
app.use(csrfProtectionMiddleware); // Verify CSRF on mutations

// Supabase auth routes under /api/auth
registerSupabaseAuthRoutes(app);

// Health check endpoint for monitoring
// Returns status of all critical dependencies: database, storage, webhook queue, Stripe connectivity
app.get("/api/health", async (_req, res) => {
  try {
    // Test database connection with a simple query
    const db = await import("../db").then((m) => m.getDb());
    let dbStatus = "disconnected";

    if (db) {
      // Execute a simple query to verify connection
      const { sql } = await import("drizzle-orm");
      await db.execute(sql`SELECT 1`);
      dbStatus = "connected";
    }

    // Get webhook queue stats
    const webhookStats = await getWebhookQueueStats();

    // Check if storage buckets are initialized
    // In production, this should be true because startup fails if buckets unavailable
    const storageReady = true; // Extended check can be added if bucket ping is available

    // Check Stripe connectivity (basic: just verify API key and artist price IDs are set)
    const stripeReady =
      ENV.stripeSecretKey &&
      ENV.stripeArtistAmateurPriceIdMonth
        ? true
        : false;

    const overallStatus =
      dbStatus === "connected" && storageReady && stripeReady ? "ok" : "degraded";

    const httpStatus = overallStatus === "ok" ? 200 : 503;

    res.status(httpStatus).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      environment: ENV.nodeEnv,
      dependencies: {
        database: { status: dbStatus },
        storage: { ready: storageReady },
        webhookQueue: webhookStats,
        stripe: { ready: stripeReady },
      },
      version: process.env.npm_package_version || "unknown",
    });
  } catch (error) {
    logger.error("Health check failed", { error });
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      dependencies: {
        database: { status: "error" },
        storage: { ready: false },
        stripe: { ready: false },
      },
      error: error instanceof Error ? error.message : "Health check failed",
    });
  }
});

// Dynamic sitemap for SEO - Ink Connect artist and shop pages
app.get("/sitemap.xml", async (_req, res) => {
  try {
    const { getAllArtists } = await import("../db");
    const artists = await getAllArtists();
    const protocol = res.req.protocol || "http";
    const host = res.req.get("host");
    const baseUrl = ENV.publicBaseUrl || (host ? `${protocol}://${host}` : "http://localhost:3000");

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
      const lastmod = artist.updatedAt.toISOString().split("T")[0];
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
  }),
);

// Global error handler - MUST be last middleware
// Sentry error handler first to capture errors
app.use(sentryErrorHandler());

app.use(
  (
    err: Error & { statusCode?: number; status?: number },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
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
  },
);

// Start the server in both development and production.
// In development, Vite provides HMR. In production, static files are served from dist/public.
// When deployed to Vercel, this block is ignored and the exported `app` is used directly.
{
  const server = createServer(app);

  const startServer = async () => {
    // Initialize Supabase Storage buckets on startup
    // In production, this must succeed — if buckets are unavailable, server should not start
    try {
      const storageInit = await initializeBuckets();
      logger.info("Supabase storage buckets initialized successfully", {
        existing: storageInit.existing,
        created: storageInit.created,
      });
    } catch (error) {
      if (ENV.isProduction) {
        logger.error("FATAL: Storage bucket initialization failed in production", { error });
        process.exit(1);
      } else {
        logger.warn("Storage bucket initialization failed in development (non-fatal)", { error });
      }
    }

    // Initialize webhook retry queue processor
    try {
      initWebhookProcessor();
      logger.info("Webhook retry processor initialized");
    } catch (error) {
      logger.error("Failed to initialize webhook processor", { error });
    }

    // Use Vite middleware only when running source in development.
    // Bundled dist runtime should always serve built static assets.
    const useViteDevMiddleware =
      process.env.NODE_ENV === "development" && !isBundledDistRuntime();

    if (useViteDevMiddleware) {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const requestedPort = parseInt(process.env.PORT || String(ENV.port || 3000), 10);
    const isHostedRuntime = ENV.isProduction;
    const port = isHostedRuntime
      ? requestedPort
      : await findAvailablePort(requestedPort);
    const host = isHostedRuntime ? "0.0.0.0" : "127.0.0.1";

    server.listen(port, host, () => {
      logger.info(`Server running on http://${host}:${port}/`);
    });

    // Graceful shutdown: allow in-flight requests to complete before exiting.
    // Render (and most container orchestrators) send SIGTERM before force-killing.
    const shutdown = (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(() => {
        logger.info("HTTP server closed");
        process.exit(0);
      });
      // Force exit after 10 s if connections don't drain
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10_000).unref();
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  };

  startServer().catch((error) => {
    logger.error("Failed to start server", { error });
    process.exit(1);
  });
}

// Export the Express app for Vercel to use as a serverless function
export default app;
