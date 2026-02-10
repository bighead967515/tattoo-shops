import * as Sentry from "@sentry/node";
import { logger } from "./logger";

let initialized = false;

/**
 * Initialize Sentry for error tracking
 * Call this once at server startup
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    logger.warn("SENTRY_DSN not configured - error tracking disabled");
    return;
  }

  if (initialized) {
    logger.debug("Sentry already initialized");
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || "development",
      release: process.env.npm_package_version || "unknown",
      
      // Performance monitoring
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      
      // Integrations
      integrations: [
        // Express integration is automatically added
        Sentry.httpIntegration(),
        Sentry.expressIntegration(),
      ],
      
      // Filter out noisy errors
      beforeSend(event, hint) {
        const error = hint.originalException;
        
        // Don't send 4xx errors to Sentry
        if (error instanceof Error && error.message.includes("401")) {
          return null;
        }
        
        // Don't send rate limit errors
        if (error instanceof Error && error.message.includes("rate limit")) {
          return null;
        }
        
        return event;
      },

      // Tag important info
      initialScope: {
        tags: {
          component: "backend",
        },
      },
    });

    initialized = true;
    logger.info("Sentry error tracking initialized");
  } catch (err) {
    logger.error("Failed to initialize Sentry", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Capture an exception manually
 */
export function captureException(
  error: Error | unknown,
  context?: Record<string, unknown>
): string | undefined {
  if (!initialized) {
    return undefined;
  }

  return Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message
 */
export function captureMessage(
  message: string,
  level: "fatal" | "error" | "warning" | "info" | "debug" = "info",
  context?: Record<string, unknown>
): string | undefined {
  if (!initialized) {
    return undefined;
  }

  return Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; username?: string } | null): void {
  if (!initialized) return;
  Sentry.setUser(user);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: {
  category: string;
  message: string;
  level?: "fatal" | "error" | "warning" | "info" | "debug";
  data?: Record<string, unknown>;
}): void {
  if (!initialized) return;
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(name: string, op: string): ReturnType<typeof Sentry.startSpan> | undefined {
  if (!initialized) return undefined;
  
  return Sentry.startSpan({ name, op }, (span) => span);
}

/**
 * Express error handler middleware
 * Add this AFTER all routes
 */
export function sentryErrorHandler() {
  return Sentry.expressErrorHandler();
}

/**
 * Express request handler middleware
 * Add this BEFORE all routes
 */
export function sentryRequestHandler() {
  return Sentry.expressIntegration().setupOnce;
}

/**
 * Flush pending events (for graceful shutdown)
 */
export async function flushSentry(timeout: number = 2000): Promise<boolean> {
  if (!initialized) return true;
  return Sentry.close(timeout);
}

/**
 * Check if Sentry is initialized
 */
export function isSentryInitialized(): boolean {
  return initialized;
}
