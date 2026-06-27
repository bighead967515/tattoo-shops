import winston from "winston";
import { ENV } from "./env";
import { AsyncLocalStorage } from "node:async_hooks";

const isDev = !ENV.isProduction;

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isDev
      ? winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
        )
      : winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
  }),
];

// In production, also log to file
if (ENV.isProduction) {
  try {
    transports.push(
      new winston.transports.File({
        // Render and similar hosts may not allow writing to /var/log.
        // Keep the file in app working directory so startup does not crash.
        filename: process.env.LOG_FILE_PATH || "app-error.log",
        level: "error",
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    );
  } catch {
    // Continue with console logging only if file transport fails.
  }
}

// Request context storage for correlation request IDs in logs
export const requestStorage = new AsyncLocalStorage<{ requestId: string }>();

const requestContextFormat = winston.format((info) => {
  const store = (globalThis as any).__requestStorageStore || requestStorage.getStore();
  if (store?.requestId) {
    info.requestId = store.requestId;
  }
  return info;
});

export const logger = winston.createLogger({
  level: isDev ? "debug" : "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    requestContextFormat(),
    winston.format.errors({ stack: true }),
  ),
  defaultMeta: { service: "tattoo-shops-api" },
  transports,
});

function serializeUnknownError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    value: error,
  };
}

// Handle unhandled promise rejections
process.on("unhandledRejection", async (reason, promise) => {
  logger.error("Unhandled Rejection at:", {
    promise,
    reason: serializeUnknownError(reason),
  });
  try {
    const sentry = await import("./sentry");
    sentry.captureException(reason, {
      type: "unhandledRejection",
      promise: String(promise),
    });
  } catch (err) {
    // Avoid crashing the error handler itself
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", async (error) => {
  logger.error("Uncaught Exception:", {
    error: serializeUnknownError(error),
  });
  try {
    const sentry = await import("./sentry");
    sentry.captureException(error, { type: "uncaughtException" });
    await sentry.flushSentry(2000);
  } catch (err) {
    // Avoid crashing the error handler itself
  } finally {
    process.exit(1);
  }
});
