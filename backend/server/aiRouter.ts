/**
 * AI Router — tRPC procedures for AI Tattoo Generation
 *
 * Provides the `ai.generateDesign` mutation for paid clients to create
 * tattoo stencil concepts using Gemini AI.
 */

import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { eq, sql, and, gt } from "drizzle-orm";
import { getDb } from "./db";
import { clients, artists } from "../drizzle/schema";
import { generateTattooDesign } from "./geminiGeneration";
import {
  getClientTierLimits,
  type ClientSubscriptionTier,
  getArtistTierLimits,
  type ArtistSubscriptionTier,
} from "../shared/tierLimits";
import { logger } from "./_core/logger";

async function requireDb() {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available",
    });
  return db;
}

export const aiRouter = router({
  /**
   * Generate a tattoo design using Gemini AI.
   * Requires an active client profile with a paid subscription tier,
   * or available AI credits.
   */
  generateDesign: protectedProcedure
    .input(
      z.object({
        prompt: z
          .string()
          .min(
            10,
            "Please provide at least 10 characters describing your tattoo",
          )
          .max(2000),
        style: z.string().max(50).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();

      const isArtist = ctx.user.subscriptionTier?.startsWith("artist_");

      let profileId: number;
      let availableCredits: number;
      let limitMax: number;
      let tableName: any;

      if (isArtist) {
        const [artistProfile] = await db.select().from(artists).where(eq(artists.userId, ctx.user.id)).limit(1);
        if (!artistProfile) throw new TRPCError({ code: "FORBIDDEN", message: "Artist profile not found" });
        
        const tier = (ctx.user.subscriptionTier || "artist_free") as ArtistSubscriptionTier;
        const tierLimits = getArtistTierLimits(tier);
        if (tierLimits.aiGenerationsPerMonth === 0) {
          throw new TRPCError({ code: "FORBIDDEN", message: "AI Studio is a Pro feature. Upgrade to Pro ($49/mo) to unlock." });
        }
        
        profileId = artistProfile.id;
        availableCredits = artistProfile.aiCredits;
        limitMax = tierLimits.aiGenerationsPerMonth;
        tableName = artists;
      } else {
        const [clientProfile] = await db.select().from(clients).where(eq(clients.userId, ctx.user.id)).limit(1);
        if (!clientProfile) throw new TRPCError({ code: "FORBIDDEN", message: "Profile not found." });

        const tier = (ctx.user.subscriptionTier || "client_free") as ClientSubscriptionTier;
        const tierLimits = getClientTierLimits(tier);
        if (tierLimits.aiGenerationsPerMonth === 0) {
          throw new TRPCError({ code: "FORBIDDEN", message: "AI Generation requires AI credits. Buy an add-on to generate." });
        }

        profileId = clientProfile.id;
        availableCredits = clientProfile.aiCredits;
        limitMax = tierLimits.aiGenerationsPerMonth;
        tableName = clients;
      }

      // 3. Check remaining credits (unless unlimited) — atomic deduction
      if (limitMax !== Number.MAX_SAFE_INTEGER) {
        // Atomic decrement: only succeeds if aiCredits > 0
        const [updated] = await db
          .update(tableName)
          .set({
            aiCredits: sql`${tableName.aiCredits} - 1`,
            updatedAt: new Date(),
          })
          .where(
            and(eq(tableName.id, profileId), gt(tableName.aiCredits, 0)),
          )
          .returning({ aiCredits: tableName.aiCredits });

        if (!updated) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You've used all your AI generation credits. Please upgrade or purchase more.`,
          });
        }

        availableCredits = updated.aiCredits;
      }

      // 4. Generate the tattoo design
      try {
        const result = await generateTattooDesign(
          input.prompt,
          input.style,
          ctx.user.id,
        );

        logger.info(
          `AI tattoo generated for user #${ctx.user.id}, credits remaining: ${
            limitMax === Number.MAX_SAFE_INTEGER
              ? "unlimited"
              : availableCredits
          }`,
        );

        return {
          imageUrl: result.imageUrl,
          imageKey: result.imageKey,
          creditsRemaining:
            limitMax === Number.MAX_SAFE_INTEGER
              ? null
              : availableCredits,
        };
      } catch (error) {
        logger.error("AI tattoo generation failed:", error);

        // Refund the credit if one was consumed — generation did not succeed
        if (limitMax !== Number.MAX_SAFE_INTEGER) {
          await db
            .update(tableName)
            .set({ aiCredits: sql`${tableName.aiCredits} + 1`, updatedAt: new Date() })
            .where(eq(tableName.id, profileId));
        }

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

    const isArtist = ctx.user.subscriptionTier?.startsWith("artist_");

    if (isArtist) {
      const [artistProfile] = await db.select().from(artists).where(eq(artists.userId, ctx.user.id)).limit(1);
      if (!artistProfile) return { tier: "artist_free", tierName: "Directory Profile", aiCredits: 0, maxCredits: 0, isUnlimited: false };

      const tier = (ctx.user.subscriptionTier || "artist_free") as ArtistSubscriptionTier;
      const tierLimits = getArtistTierLimits(tier);

      return {
        tier,
        tierName: tierLimits.name,
        aiCredits: artistProfile.aiCredits,
        maxCredits: tierLimits.aiGenerationsPerMonth,
        isUnlimited: tierLimits.aiGenerationsPerMonth === Number.MAX_SAFE_INTEGER,
      };
    } else {
      const [clientProfile] = await db.select().from(clients).where(eq(clients.userId, ctx.user.id)).limit(1);
      if (!clientProfile) return { tier: "client_free", tierName: "Collector", aiCredits: 0, maxCredits: 0, isUnlimited: false };

      const tier = (ctx.user.subscriptionTier || "client_free") as ClientSubscriptionTier;
      const tierLimits = getClientTierLimits(tier);

      return {
        tier,
        tierName: tierLimits.name,
        aiCredits: clientProfile.aiCredits,
        maxCredits: tierLimits.aiGenerationsPerMonth,
        isUnlimited: tierLimits.aiGenerationsPerMonth === Number.MAX_SAFE_INTEGER,
      };
    }
  }),
});
