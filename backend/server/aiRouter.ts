/**
 * AI Router — tRPC procedures for AI Tattoo Generation
 *
 * Provides the `ai.generateDesign` mutation for paid clients to create
 * tattoo stencil concepts using Gemini AI.
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { clients } from "../drizzle/schema";
import { generateTattooDesign } from "./geminiGeneration";
import { getClientTierLimits, type ClientSubscriptionTier } from "../shared/tierLimits";
import { logger } from "./_core/logger";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  return db;
}

export const aiRouter = router({
  /**
   * Generate a tattoo design using Gemini AI.
   * Requires an active client profile with a paid subscription tier,
   * or available AI credits.
   */
  generateDesign: protectedProcedure
    .input(z.object({
      prompt: z.string().min(10, "Please provide at least 10 characters describing your tattoo").max(2000),
      style: z.string().max(50).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();

      // 1. Verify user has a client profile
      const [clientProfile] = await db
        .select()
        .from(clients)
        .where(eq(clients.userId, ctx.user.id))
        .limit(1);

      if (!clientProfile) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You need a client profile to use AI Generation. Complete client onboarding first.",
        });
      }

      // 2. Check subscription tier and AI credits
      const tier = (clientProfile.subscriptionTier || "free") as ClientSubscriptionTier;
      const tierLimits = getClientTierLimits(tier);

      if (tierLimits.aiGenerationsPerMonth === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "AI Generation is a premium feature. Upgrade to Enthusiast ($9/mo) or Elite Ink ($19/mo) to unlock tattoo design generation.",
        });
      }

      // 3. Check remaining credits (unless unlimited)
      if (tierLimits.aiGenerationsPerMonth !== Number.MAX_SAFE_INTEGER) {
        if (clientProfile.aiCredits <= 0) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You've used all ${tierLimits.aiGenerationsPerMonth} AI generation credits for this billing period. Upgrade to Elite Ink for unlimited generations.`,
          });
        }
      }

      // 4. Generate the tattoo design
      try {
        const result = await generateTattooDesign(
          input.prompt,
          input.style,
          ctx.user.id
        );

        // 5. Deduct an AI credit (if not unlimited tier)
        if (tierLimits.aiGenerationsPerMonth !== Number.MAX_SAFE_INTEGER) {
          await db
            .update(clients)
            .set({
              aiCredits: clientProfile.aiCredits - 1,
              updatedAt: new Date(),
            })
            .where(eq(clients.id, clientProfile.id));
        }

        logger.info(`AI tattoo generated for client #${clientProfile.id} (user #${ctx.user.id}), credits remaining: ${
          tierLimits.aiGenerationsPerMonth === Number.MAX_SAFE_INTEGER
            ? "unlimited"
            : clientProfile.aiCredits - 1
        }`);

        return {
          imageUrl: result.imageUrl,
          imageKey: result.imageKey,
          creditsRemaining: tierLimits.aiGenerationsPerMonth === Number.MAX_SAFE_INTEGER
            ? null
            : clientProfile.aiCredits - 1,
        };
      } catch (error) {
        logger.error("AI tattoo generation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate tattoo design. Please try again.",
        });
      }
    }),

  /**
   * Get the current user's AI generation credits and tier info.
   */
  getCredits: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();

    const [clientProfile] = await db
      .select()
      .from(clients)
      .where(eq(clients.userId, ctx.user.id))
      .limit(1);

    if (!clientProfile) {
      return {
        tier: "free" as const,
        tierName: "Collector",
        aiCredits: 0,
        maxCredits: 0,
        isUnlimited: false,
      };
    }

    const tier = (clientProfile.subscriptionTier || "free") as ClientSubscriptionTier;
    const tierLimits = getClientTierLimits(tier);

    return {
      tier,
      tierName: tierLimits.name,
      aiCredits: clientProfile.aiCredits,
      maxCredits: tierLimits.aiGenerationsPerMonth,
      isUnlimited: tierLimits.aiGenerationsPerMonth === Number.MAX_SAFE_INTEGER,
    };
  }),
});
