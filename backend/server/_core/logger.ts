import winston from "winston";
import { ENV } from "./env";

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

export const logger = winston.createLogger({
  level: isDev ? "debug" : "info",
  format: winston.format.combine(
    winston.format.timestamp(),
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
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", {
    promise,
    reason: serializeUnknownError(reason),
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", {
    error: serializeUnknownError(error),
  });
  process.exit(1);
});
