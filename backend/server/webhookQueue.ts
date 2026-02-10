import { eq, and, lte, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { webhookQueue, type InsertWebhookQueueItem } from "../drizzle/schema";
import { logger } from "./_core/logger";

/**
 * Webhook Retry Queue Processor
 * 
 * Implements exponential backoff for failed webhook events:
 * - Retry 1: 1 minute delay
 * - Retry 2: 5 minutes delay
 * - Retry 3: 15 minutes delay
 * - Retry 4: 1 hour delay
 * - Retry 5: 4 hours delay
 * - After 5 retries: marked as failed, requires manual intervention
 */

// Exponential backoff delays in milliseconds
const RETRY_DELAYS = [
  1 * 60 * 1000,      // 1 minute
  5 * 60 * 1000,      // 5 minutes
  15 * 60 * 1000,     // 15 minutes
  60 * 60 * 1000,     // 1 hour
  4 * 60 * 60 * 1000, // 4 hours
];

const MAX_RETRIES = 5;
const PROCESSING_TIMEOUT_MS = 30000; // 30 seconds

type WebhookProcessor = (eventType: string, payload: unknown) => Promise<void>;

/**
 * Add a failed webhook event to the retry queue
 */
export async function queueWebhookForRetry(
  eventId: string,
  eventType: string,
  payload: unknown,
  error?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Check if already in queue
    const existing = await db
      .select()
      .from(webhookQueue)
      .where(eq(webhookQueue.eventId, eventId))
      .limit(1);

    if (existing.length > 0) {
      logger.debug("Webhook event already in queue", { eventId });
      return;
    }

    const nextRetryAt = new Date(Date.now() + RETRY_DELAYS[0]);

    await db.insert(webhookQueue).values({
      eventId,
      eventType,
      payload: JSON.stringify(payload),
      status: "pending",
      retryCount: 0,
      maxRetries: MAX_RETRIES,
      nextRetryAt,
      lastError: error ?? null,
    });

    logger.info("Webhook event queued for retry", { eventId, eventType, nextRetryAt });
  } catch (err) {
    logger.error("Failed to queue webhook for retry", {
      eventId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Process pending webhook events from the queue
 */
export async function processWebhookQueue(processor: WebhookProcessor): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const now = new Date();
  let processedCount = 0;

  try {
    // Get all pending events ready for retry
    const pendingEvents = await db
      .select()
      .from(webhookQueue)
      .where(
        and(
          eq(webhookQueue.status, "pending"),
          lte(webhookQueue.nextRetryAt, now)
        )
      )
      .limit(10); // Process in batches of 10

    if (pendingEvents.length === 0) {
      return 0;
    }

    logger.debug("Processing webhook queue", { count: pendingEvents.length });

    for (const event of pendingEvents) {
      try {
        // Mark as processing
        await db
          .update(webhookQueue)
          .set({ status: "processing", updatedAt: now })
          .where(eq(webhookQueue.id, event.id));

        // Parse payload and process
        const payload = JSON.parse(event.payload);
        
        // Add timeout to processing
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Processing timeout")), PROCESSING_TIMEOUT_MS);
        });

        await Promise.race([
          processor(event.eventType, payload),
          timeoutPromise,
        ]);

        // Mark as completed
        await db
          .update(webhookQueue)
          .set({ status: "completed", updatedAt: new Date() })
          .where(eq(webhookQueue.id, event.id));

        logger.info("Webhook event processed successfully", {
          eventId: event.eventId,
          eventType: event.eventType,
          retryCount: event.retryCount,
        });

        processedCount++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const newRetryCount = event.retryCount + 1;

        if (newRetryCount >= MAX_RETRIES) {
          // Mark as permanently failed
          await db
            .update(webhookQueue)
            .set({
              status: "failed",
              retryCount: newRetryCount,
              lastError: errorMessage,
              updatedAt: new Date(),
            })
            .where(eq(webhookQueue.id, event.id));

          logger.error("Webhook event permanently failed after max retries", {
            eventId: event.eventId,
            eventType: event.eventType,
            retryCount: newRetryCount,
            lastError: errorMessage,
          });
        } else {
          // Schedule next retry with exponential backoff
          const delayIndex = Math.min(newRetryCount, RETRY_DELAYS.length - 1);
          const nextRetryAt = new Date(Date.now() + RETRY_DELAYS[delayIndex]);

          await db
            .update(webhookQueue)
            .set({
              status: "pending",
              retryCount: newRetryCount,
              nextRetryAt,
              lastError: errorMessage,
              updatedAt: new Date(),
            })
            .where(eq(webhookQueue.id, event.id));

          logger.warn("Webhook event retry failed, scheduling next attempt", {
            eventId: event.eventId,
            eventType: event.eventType,
            retryCount: newRetryCount,
            nextRetryAt,
            error: errorMessage,
          });
        }
      }
    }

    return processedCount;
  } catch (err) {
    logger.error("Failed to process webhook queue", {
      error: err instanceof Error ? err.message : String(err),
    });
    return processedCount;
  }
}

/**
 * Get queue statistics for monitoring
 */
export async function getQueueStats(): Promise<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}> {
  const db = await getDb();
  const defaultStats = { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 };
  if (!db) return defaultStats;

  try {
    const allItems = await db.select().from(webhookQueue);
    
    const stats = {
      ...defaultStats,
      total: allItems.length,
    };

    for (const item of allItems) {
      switch (item.status) {
        case "pending":
          stats.pending++;
          break;
        case "processing":
          stats.processing++;
          break;
        case "completed":
          stats.completed++;
          break;
        case "failed":
          stats.failed++;
          break;
      }
    }

    return stats;
  } catch (e: any) {
    logger.error("Failed to get queue stats", { error: e.message });
    return defaultStats;
  }
}

/**
 * Clean up old completed and failed events
 */
export async function cleanupOldEvents(olderThanDays: number = 30): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  try {
    const oldEvents = await db
      .select({ id: webhookQueue.id })
      .from(webhookQueue)
      .where(
        and(
          inArray(webhookQueue.status, ["completed", "failed"]),
          lte(webhookQueue.updatedAt, cutoffDate)
        )
      );

    if (oldEvents.length === 0) {
      return 0;
    }

    const ids = oldEvents.map((e) => e.id);
    await db.delete(webhookQueue).where(inArray(webhookQueue.id, ids));

    logger.info("Cleaned up old webhook queue events", { count: ids.length });
    return ids.length;
  } catch (err) {
    logger.error("Failed to cleanup old webhook events", {
      error: err instanceof Error ? err.message : String(err),
    });
    return 0;
  }
}

/**
 * Manually retry a failed event
 */
export async function retryFailedEvent(eventId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const result = await db
      .update(webhookQueue)
      .set({
        status: "pending",
        retryCount: 0,
        nextRetryAt: new Date(),
        lastError: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(webhookQueue.eventId, eventId),
          eq(webhookQueue.status, "failed")
        )
      );

    const updated = (result as unknown as { rowCount?: number }).rowCount ?? 0;
    
    if (updated > 0) {
      logger.info("Failed webhook event reset for retry", { eventId });
      return true;
    }
    
    return false;
  } catch (err) {
    logger.error("Failed to retry event", {
      eventId,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

// Queue processor interval handle
let processorInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the background queue processor
 */
export function startQueueProcessor(
  processor: WebhookProcessor,
  intervalMs: number = 60000 // Check every minute
): void {
  if (processorInterval) {
    logger.warn("Queue processor already running");
    return;
  }

  logger.info("Starting webhook queue processor", { intervalMs });

  processorInterval = setInterval(async () => {
    const processed = await processWebhookQueue(processor);
    if (processed > 0) {
      logger.debug("Queue processor completed cycle", { processed });
    }
  }, intervalMs);

  // Run immediately on start
  processWebhookQueue(processor).catch((err) => {
    logger.error("Initial queue processing failed", { error: String(err) });
  });
}

/**
 * Stop the background queue processor
 */
export function stopQueueProcessor(): void {
  if (processorInterval) {
    clearInterval(processorInterval);
    processorInterval = null;
    logger.info("Webhook queue processor stopped");
  }
}
