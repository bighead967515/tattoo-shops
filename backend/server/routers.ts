import { COOKIE_NAME, TIER_LIMITS, type SubscriptionTier } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import {
  publicProcedure,
  protectedProcedure,
  artistProcedure,
  artistOwnerProcedure,
  adminProcedure,
  router,
} from "./_core/trpc";
import { sanitizeInput, sanitizeEmail, sanitizePhone } from "./_core/sanitize";
import { z } from "zod";
import * as db from "./db";
import {
  createSignedUploadUrl,
  deleteFile,
  BUCKETS,
  getPublicUrl,
} from "./_core/supabaseStorage";
import { clientsRouter, requestsRouter, bidsRouter } from "./clientRouters";
import { verificationRouter } from "./verificationRouter";
import { healthRouter } from "./healthRouter";
import { analyzePortfolioImage } from "./geminiVision";
import { parseDiscoveryQuery } from "./geminiDiscovery";
import { analyzeReviewSentiment } from "./geminiSafety";
import { aiRouter } from "./aiRouter";
import path from "path";

/**
 * Sanitize a filename to prevent path traversal attacks.
 * Strips path separators, removes dangerous characters, and enforces max length.
 */
function sanitizeFileName(fileName: string, maxLength = 100): string {
  // Get basename to strip any path
  let sanitized = path.basename(fileName);
  // Remove any remaining path separators and null bytes
  sanitized = sanitized.replace(/[\\/\0]/g, "");
  // Remove ".." sequences
  sanitized = sanitized.replace(/\.\./g, "");
  // Keep only safe characters: alphanumeric, dot, underscore, hyphen
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");
  // Collapse multiple underscores
  sanitized = sanitized.replace(/_+/g, "_");
  // Trim and enforce max length
  sanitized = sanitized.substring(0, maxLength);
  // Fallback if empty
  if (!sanitized || sanitized === "." || sanitized === "..") {
    sanitized = `upload_${Date.now()}`;
  }
  return sanitized;
}

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  health: healthRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  artists: router({
    getAll: publicProcedure.query(async () => {
      return await db.getAllArtists();
    }),

    search: publicProcedure
      .input(
        z.object({
          styles: z.array(z.string()).optional(),
          minRating: z.number().optional(),
          minExperience: z.number().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
        }),
      )
      .query(async ({ input }) => {
        return await db.searchArtists(input);
      }),

    /**
     * Tattoo Discovery — natural language semantic search.
     * Parses the user's free-text query with Gemini AI, then matches against
     * AI-tagged portfolio images and artist profiles.
     */
    discover: protectedProcedure
      .input(
        z.object({
          query: z.string().min(1).max(500),
        }),
      )
      .query(async ({ input }) => {
        // Step 1: Parse the natural language query into structured intent
        const intent = await parseDiscoveryQuery(input.query);

        // Step 2: Search artists + portfolio images using parsed intent
        const results = await db.discoverArtists({
          styles: intent.styles,
          tags: intent.tags,
          keywords: intent.keywords,
          vibeDescription: intent.vibeDescription,
        });

        return {
          intent,
          artists: results,
        };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getArtistById(input.id);
      }),

    getByUserId: protectedProcedure.query(async ({ ctx }) => {
      return await db.getArtistByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          shopName: z.string(),
          bio: z.string().optional(),
          specialties: z.string().optional(),
          experience: z.number().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          phone: z.string().optional(),
          website: z.string().optional(),
          instagram: z.string().optional(),
          facebook: z.string().optional(),
          lat: z.string().optional(),
          lng: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return await db.createArtist({
          userId: ctx.user.id,
          ...input,
        });
      }),

    update: artistOwnerProcedure
      .input(
        z.object({
          id: z.number(),
          shopName: z.string().optional(),
          bio: z.string().optional(),
          specialties: z.string().optional(),
          experience: z.number().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          phone: z.string().optional(),
          website: z.string().optional(),
          instagram: z.string().optional(),
          facebook: z.string().optional(),
          lat: z.string().optional(),
          lng: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateArtist(id, data);
      }),
  }),

  portfolio: router({
    get: publicProcedure
      .input(z.object({ artistId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPortfolioByArtistId(input.artistId);
      }),

    getUploadUrl: artistOwnerProcedure
      .input(
        z.object({
          artistId: z.number(),
          fileName: z.string(),
          contentType: z.string(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        // ── Tier Gatekeeper ──────────────────────────────────────
        const tier = (ctx.user?.subscriptionTier ??
          "artist_free") as SubscriptionTier;
        const limit = TIER_LIMITS[tier]?.portfolioMax ?? 0;
        const currentCount = await db.getPortfolioCountByArtistId(
          input.artistId,
        );
        if (currentCount >= limit) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You have reached your tier's portfolio limit (${limit}). Please upgrade to add more images.`,
          });
        }
        // ─────────────────────────────────────────────────────────
        // Sanitize filename to prevent path traversal
        const sanitizedFileName = sanitizeFileName(input.fileName);
        // Generate unique file key with sanitized filename
        const fileKey = `public/${input.artistId}/${Date.now()}-${sanitizedFileName}`;

        // Return the signed upload URL for client to upload
        return await createSignedUploadUrl(BUCKETS.PORTFOLIO_IMAGES, fileKey);
      }),

    add: artistOwnerProcedure
      .input(
        z.object({
          artistId: z.number(),
          imageKey: z.string(),
          caption: z.string().optional(),
          style: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        // ── Tier Gatekeeper ──────────────────────────────────────
        const tier = (ctx.user?.subscriptionTier ??
          "artist_free") as SubscriptionTier;
        const limit = TIER_LIMITS[tier]?.portfolioMax ?? 0;
        const currentCount = await db.getPortfolioCountByArtistId(
          input.artistId,
        );
        if (currentCount >= limit) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You have reached your tier's portfolio limit (${limit}). Please upgrade to add more images.`,
          });
        }
        // ─────────────────────────────────────────────────────────
        // Sanitize imageKey using same semantics as sanitizeFileName
        // Step 1: Remove null bytes
        let sanitizedKey = input.imageKey.replace(/\0/g, "");
        // Step 2: Convert backslashes to forward slashes (POSIX)
        sanitizedKey = sanitizedKey.replace(/\\/g, "/");
        // Step 3: Collapse consecutive slashes
        sanitizedKey = sanitizedKey.replace(/\/+/g, "/");
        // Step 4: Remove ".." path traversal sequences
        sanitizedKey = sanitizedKey.replace(/\.\./g, "");
        // Step 5: Remove leading slashes
        sanitizedKey = sanitizedKey.replace(/^\/+/, "");
        // Step 6: Normalize path segments (remove empty segments from collapsed slashes)
        sanitizedKey = sanitizedKey.split("/").filter(Boolean).join("/");

        // Validate ownership: imageKey must start with the artist's path
        const expectedPrefix = `public/${input.artistId}/`;
        if (!sanitizedKey.startsWith(expectedPrefix)) {
          throw new Error("Invalid image key: does not belong to this artist");
        }

        const imageUrl = getPublicUrl(BUCKETS.PORTFOLIO_IMAGES, sanitizedKey);
        const result = await db.addPortfolioImage({
          ...input,
          imageKey: sanitizedKey,
          imageUrl,
        });

        // Run Smart Portfolio Tagging in the background (non-blocking)
        // Analysis happens async — the image is immediately available while AI processes
        analyzePortfolioImage(imageUrl)
          .then(async (analysis) => {
            if (analysis.qualityScore > 0 && result?.id) {
              await db.updatePortfolioImageAI(result.id, {
                aiStyles: JSON.stringify(analysis.styles),
                aiTags: JSON.stringify(analysis.tags),
                aiDescription: analysis.description,
                qualityScore: analysis.qualityScore,
                qualityIssues: JSON.stringify(analysis.qualityIssues),
                aiProcessedAt: new Date(),
                // Auto-fill style if not manually set
                ...(!input.style && analysis.styles.length > 0
                  ? { style: analysis.styles[0] }
                  : {}),
              });
            }
          })
          .catch((err) => {
            // Non-fatal: log and continue — image is still saved
            console.error("Background AI analysis failed:", err);
          });

        return result;
      }),

    // Re-analyze an existing portfolio image with Gemini Vision
    reanalyze: artistOwnerProcedure
      .input(z.object({ id: z.number(), artistId: z.number() }))
      .mutation(async ({ input }) => {
        const image = await db.getPortfolioImageById(input.id);
        if (!image) throw new Error("Portfolio image not found");
        if (image.artistId !== input.artistId) throw new Error("Forbidden");

        const analysis = await analyzePortfolioImage(image.imageUrl);
        if (analysis.qualityScore === 0) {
          throw new Error("AI analysis failed — please try again later");
        }

        await db.updatePortfolioImageAI(input.id, {
          aiStyles: JSON.stringify(analysis.styles),
          aiTags: JSON.stringify(analysis.tags),
          aiDescription: analysis.description,
          qualityScore: analysis.qualityScore,
          qualityIssues: JSON.stringify(analysis.qualityIssues),
          aiProcessedAt: new Date(),
          style: analysis.styles[0] || image.style,
        });

        return analysis;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Get the portfolio image by ID to check ownership
        const image = await db.getPortfolioImageById(input.id);

        if (!image) {
          throw new Error("Portfolio image not found");
        }

        // Get artist to verify ownership
        const artist = await db.getArtistById(image.artistId);
        if (!artist || artist.userId !== ctx.user.id) {
          throw new Error(
            "Forbidden: You can only delete your own portfolio images",
          );
        }

        // Delete from Supabase storage
        try {
          await deleteFile(BUCKETS.PORTFOLIO_IMAGES, image.imageKey);
        } catch (error) {
          // Log but don't fail - continue with DB deletion even if storage deletion fails
          // This prevents orphaned DB records
        }

        return await db.deletePortfolioImage(input.id);
      }),
  }),

  reviews: router({
    getByArtistId: publicProcedure
      .input(z.object({ artistId: z.number() }))
      .query(async ({ input }) => {
        return await db.getReviewsByArtistId(input.artistId);
      }),

    create: protectedProcedure
      .input(
        z.object({
          artistId: z.number(),
          rating: z.number().min(1).max(5),
          comment: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.createReview({
          ...input,
          userId: ctx.user.id,
        });

        // Run Review Sentiment Analysis in the background (non-blocking)
        // The review is immediately saved; moderation flags are attached async.
        if (input.comment && input.comment.trim().length > 0) {
          analyzeReviewSentiment({
            rating: input.rating,
            comment: input.comment,
            verifiedBooking: false,
          })
            .then(async (analysis) => {
              if (result?.id) {
                // Map AI action to moderation status
                let moderationStatus: string;
                if (analysis.moderationAction === "auto_hide") {
                  moderationStatus = "hidden";
                } else if (analysis.moderationAction === "flag_for_review") {
                  moderationStatus = "flagged";
                } else {
                  moderationStatus = "approved";
                }

                await db.updateReviewModeration(result.id, {
                  moderationStatus,
                  moderationFlags: JSON.stringify(analysis.flags),
                  toxicityScore: analysis.toxicityScore,
                  spamScore: analysis.spamScore,
                  fraudScore: analysis.fraudScore,
                  moderationReason: analysis.moderationReason,
                  moderatedAt: new Date(),
                });
              }
            })
            .catch((err) => {
              // Non-fatal: log and continue — review is still saved
              console.error("Background review moderation failed:", err);
            });
        }

        return result;
      }),
  }),

  bookings: router({
    create: protectedProcedure
      .input(
        z.object({
          artistId: z.number(),
          customerName: z.string().min(1).max(255),
          customerEmail: z.string().email().max(320),
          customerPhone: z.string().min(1).max(50),
          preferredDate: z.date(),
          tattooDescription: z.string().min(1).max(2000),
          placement: z.string().min(1).max(255),
          size: z.string().min(1).max(100),
          budget: z.string().max(100).optional(),
          additionalNotes: z.string().max(2000).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        // Sanitize all user inputs
        const sanitizedEmail = sanitizeEmail(input.customerEmail);
        if (!sanitizedEmail) {
          throw new Error("Invalid email address");
        }

        return await db.createBooking({
          ...input,
          userId: ctx.user.id,
          customerName: sanitizeInput(input.customerName, 255),
          customerEmail: sanitizedEmail,
          customerPhone: sanitizePhone(input.customerPhone),
          tattooDescription: sanitizeInput(input.tattooDescription, 2000),
          placement: sanitizeInput(input.placement, 255),
          size: sanitizeInput(input.size, 100),
          budget: input.budget ? sanitizeInput(input.budget, 100) : undefined,
          additionalNotes: input.additionalNotes
            ? sanitizeInput(input.additionalNotes, 2000)
            : undefined,
        });
      }),

    getByUserId: protectedProcedure.query(async ({ ctx }) => {
      return await db.getBookingsByUserId(ctx.user.id);
    }),

    getByArtistId: artistOwnerProcedure
      .input(z.object({ artistId: z.number() }))
      .query(async ({ input }) => {
        return await db.getBookingsByArtistId(input.artistId);
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        // Get booking and verify ownership
        const booking = await db.getBookingById(input.id);
        if (!booking) {
          throw new Error("Booking not found");
        }

        // Check if user is either the customer or owns the artist profile
        const isCustomer = booking.userId === ctx.user.id;
        let isArtist = false;

        if (!isCustomer) {
          const artist = await db.getArtistById(booking.artistId);
          isArtist = !!(artist && artist.userId === ctx.user.id);
        }

        if (!isCustomer && !isArtist) {
          throw new Error(
            "Forbidden: You can only update your own bookings or bookings for your artist profile",
          );
        }

        return await db.updateBooking(input.id, { status: input.status });
      }),
  }),

  favorites: router({
    add: protectedProcedure
      .input(z.object({ artistId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.addFavorite({
          userId: ctx.user.id,
          artistId: input.artistId,
        });
      }),

    remove: protectedProcedure
      .input(z.object({ artistId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.removeFavorite(ctx.user.id, input.artistId);
      }),

    getByUserId: protectedProcedure.query(async ({ ctx }) => {
      return await db.getFavoritesByUserId(ctx.user.id);
    }),

    isFavorite: protectedProcedure
      .input(z.object({ artistId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.isFavorite(ctx.user.id, input.artistId);
      }),
  }),

  // Client marketplace routers
  clients: clientsRouter,
  requests: requestsRouter,
  bids: bidsRouter,
  verification: verificationRouter,

  // Admin moderation
  moderation: router({
    /**
     * Get all flagged/hidden reviews for admin review.
     */
    getFlaggedReviews: adminProcedure.query(async () => {
      return await db.getFlaggedReviews();
    }),

    /**
     * Admin: Update moderation status of a review (approve, keep flagged, hide).
     */
    updateReviewStatus: adminProcedure
      .input(
        z.object({
          reviewId: z.number(),
          status: z.enum(["approved", "flagged", "hidden"]),
          notes: z.string().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        return await db.updateReviewModeration(input.reviewId, {
          moderationStatus: input.status,
          moderationReason: input.notes || undefined,
        });
      }),

    /**
     * Admin: Re-analyze a review with Gemini.
     */
    reanalyzeReview: adminProcedure
      .input(z.object({ reviewId: z.number() }))
      .mutation(async ({ input }) => {
        const review = await db.getReviewById(input.reviewId);
        if (!review) throw new Error("Review not found");

        const analysis = await analyzeReviewSentiment({
          rating: review.rating,
          comment: review.comment,
          verifiedBooking: review.verifiedBooking ?? false,
        });

        let moderationStatus: string;
        if (analysis.moderationAction === "auto_hide") {
          moderationStatus = "hidden";
        } else if (analysis.moderationAction === "flag_for_review") {
          moderationStatus = "flagged";
        } else {
          moderationStatus = "approved";
        }

        await db.updateReviewModeration(input.reviewId, {
          moderationStatus,
          moderationFlags: JSON.stringify(analysis.flags),
          toxicityScore: analysis.toxicityScore,
          spamScore: analysis.spamScore,
          fraudScore: analysis.fraudScore,
          moderationReason: analysis.moderationReason,
          moderatedAt: new Date(),
        });

        return analysis;
      }),
  }),

  // ── AI Tattoo Generation ──────────────────────
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
