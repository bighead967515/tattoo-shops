import { COOKIE_NAME, type SubscriptionTier } from "@shared/const";
import { getArtistTierLimits, type ArtistSubscriptionTier } from "@shared/tierLimits";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { logger } from "./_core/logger";
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
import { sendBookingIntakeNotification, sendArtistInvitation } from "./email";
import {
  createSignedUploadUrl,
  deleteFile,
  BUCKETS,
  getPublicUrl,
} from "./_core/supabaseStorage";
import { clientsRouter, requestsRouter, bidsRouter } from "./clientRouters";
import { createArtistSubscriptionCheckout, createFoundingArtistCheckout, createCheckoutSession } from "./stripe";
import { artists, users, flashArt, bookings, invitations } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";

import { getDb } from "./db";
import { ENV } from "./_core/env";
import { verificationRouter } from "./verificationRouter";
import { healthRouter } from "./healthRouter";
import { analyzePortfolioImage } from "./geminiVision";
import { parseDiscoveryQuery } from "./geminiDiscovery";
import { analyzeReviewSentiment } from "./geminiSafety";
import { aiRouter } from "./aiRouter";
import { shopRouter } from "./shopRouter";
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

    /** Admin: list all artists (approved + unapproved) with user info */
    adminGetAll: adminProcedure.query(async () => {
      return await db.getAllArtistsAdmin();
    }),

    /** Admin: approve or reject an artist */
    adminSetApproval: adminProcedure
      .input(z.object({ artistId: z.number(), approved: z.boolean() }))
      .mutation(async ({ input }) => {
        await db.updateArtist(input.artistId, { isApproved: input.approved });

        // Update associated invitation status if approved
        if (input.approved) {
          const database = await getDb();
          if (database) {
            try {
              const [artist] = await database
                .select({ userId: artists.userId })
                .from(artists)
                .where(eq(artists.id, input.artistId))
                .limit(1);

              if (artist?.userId) {
                await database
                  .update(invitations)
                  .set({ status: "approved" })
                  .where(eq(invitations.userId, artist.userId));
              }
            } catch (err) {
              logger.error("Failed to update invitation status on artist approval", {
                artistId: input.artistId,
                error: err instanceof Error ? err.message : String(err),
              });
            }
          }
        }
        
        // P1-3: Trigger n8n workflow for approval notification email
        if (ENV.n8nWebhookUrl && ENV.n8nWebhookSecret) {
          try {
            const webhookUrl = `${ENV.n8nWebhookUrl}/webhook/artist-approval`;
            const response = await fetch(webhookUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ENV.n8nWebhookSecret}`,
              },
              body: JSON.stringify({
                artistId: input.artistId,
                approved: input.approved,
              }),
            });
            
            if (!response.ok) {
              logger.warn("n8n webhook returned non-2xx status", {
                artistId: input.artistId,
                status: response.status,
                statusText: response.statusText,
              });
            }
          } catch (err) {
            // Log but don't fail user request if webhook fails
            logger.error("Failed to trigger n8n approval notification workflow", {
              artistId: input.artistId,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }
        
        return { success: true };
      }),

    adminSendInvitations: adminProcedure
      .input(
        z.object({
          invitations: z
            .array(
              z.object({
                email: z.string().email(),
                shopName: z.string().min(1, "Shop name is required"),
                state: z.string().optional(),
              }),
            )
            .max(50, "Maximum 50 invitations per batch allowed"),
        }),
      )
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable",
          });
        }

        const results: { email: string; status: "success" | "failed"; error?: string }[] = [];

        for (const invite of input.invitations) {
          try {
            const inviteCode = crypto.randomBytes(8).toString("hex");

            // Look for existing invitation
            const [existing] = await database
              .select()
              .from(invitations)
              .where(eq(invitations.email, invite.email))
              .limit(1);

            if (existing) {
              // Update existing invitation
              await database
                .update(invitations)
                .set({
                  shopName: invite.shopName,
                  state: invite.state ?? null,
                  inviteCode,
                  sentAt: new Date(),
                  status: "sent",
                  openedAt: null,
                  registeredAt: null,
                })
                .where(eq(invitations.id, existing.id));
            } else {
              // Insert new
              await database.insert(invitations).values({
                email: invite.email,
                shopName: invite.shopName,
                state: invite.state ?? null,
                inviteCode,
                status: "sent",
                sentAt: new Date(),
              });
            }

            // Send email
            await sendArtistInvitation(invite.email, invite.shopName, inviteCode);
            results.push({ email: invite.email, status: "success" });
          } catch (err) {
            logger.error("Failed to send batch invitation to " + invite.email, {
              error: err instanceof Error ? err.message : String(err),
            });
            results.push({
              email: invite.email,
              status: "failed",
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }

        return results;
      }),

    adminResendInvitation: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable",
          });
        }

        const [invite] = await database
          .select()
          .from(invitations)
          .where(eq(invitations.id, input.id))
          .limit(1);

        if (!invite) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invitation not found",
          });
        }

        // Generate a new invite code to refresh it
        const newCode = crypto.randomBytes(8).toString("hex");

        await database
          .update(invitations)
          .set({
            inviteCode: newCode,
            sentAt: new Date(),
            status: "sent",
            openedAt: null,
            registeredAt: null,
          })
          .where(eq(invitations.id, invite.id));

        await sendArtistInvitation(invite.email, invite.shopName, newCode);
        return { success: true };
      }),

    adminGetInvitations: adminProcedure.query(async () => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }

      return await database
        .select()
        .from(invitations)
        .orderBy(desc(invitations.sentAt));
    }),

    adminGetInvitationMetrics: adminProcedure
      .input(z.object({ state: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable",
          });
        }

        // We can query all invitations or filter by state
        let query = database.select().from(invitations);
        if (input?.state) {
          // @ts-ignore
          query = query.where(eq(invitations.state, input.state));
        }

        const allInvites = await query;
        
        let sent = 0;
        let opened = 0;
        let registered = 0;
        let approved = 0;

        for (const inv of allInvites) {
          sent++;
          if (inv.openedAt || inv.status === "opened" || inv.status === "registered" || inv.status === "approved") {
            opened++;
          }
          if (inv.registeredAt || inv.status === "registered" || inv.status === "approved") {
            registered++;
          }
          if (inv.status === "approved") {
            approved++;
          }
        }

        return { sent, opened, registered, approved };
      }),

    trackInviteOpen: publicProcedure
      .input(z.object({ inviteCode: z.string() }))
      .mutation(async ({ input }) => {
        const database = await getDb();
        if (!database) return { success: false };

        const [invite] = await database
          .select()
          .from(invitations)
          .where(eq(invitations.inviteCode, input.inviteCode))
          .limit(1);

        if (!invite) return { success: false };

        if (invite.status === "sent") {
          await database
            .update(invitations)
            .set({
              status: "opened",
              openedAt: new Date(),
            })
            .where(eq(invitations.id, invite.id));
        }

        return { success: true };
      }),

    linkInviteCode: protectedProcedure
      .input(z.object({ inviteCode: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable",
          });
        }

        const [invite] = await database
          .select()
          .from(invitations)
          .where(eq(invitations.inviteCode, input.inviteCode))
          .limit(1);

        if (!invite) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invitation not found",
          });
        }

        // Link the invitation to this user
        const updateData: any = {
          userId: ctx.user.id,
        };

        if (!invite.registeredAt) {
          updateData.registeredAt = new Date();
        }

        // Check if user is already an approved artist in the DB
        const [artistProfile] = await database
          .select({ isApproved: artists.isApproved })
          .from(artists)
          .where(eq(artists.userId, ctx.user.id))
          .limit(1);

        if (artistProfile?.isApproved) {
          updateData.status = "approved";
        } else if (invite.status === "sent" || invite.status === "opened") {
          updateData.status = "registered";
        }

        await database
          .update(invitations)
          .set(updateData)
          .where(eq(invitations.id, invite.id));

        return { success: true };
      }),


    /**
     * Create a Stripe Checkout Session for an artist subscription upgrade.
     * Returns the Checkout URL to redirect the artist to Stripe.
     */
    createSubscriptionCheckout: protectedProcedure
      .input(
        z.object({
          tier: z.enum(["artist_pro", "artist_elite"]),
          interval: z.enum(["month", "year"]).default("month"),
          successUrl: z.string().url(),
          cancelUrl: z.string().url(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Verify the user has an artist profile
        const [artist] = await database
          .select({ id: artists.id })
          .from(artists)
          .where(eq(artists.userId, ctx.user.id))
          .limit(1);

        if (!artist) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You must have an artist profile before subscribing.",
          });
        }

        // Resolve the correct Stripe Price ID
        const priceIdMap: Record<string, string | undefined> = {
          artist_pro_month: ENV.stripeArtistProPriceIdMonth,
          artist_pro_year:  ENV.stripeArtistProPriceIdYear,
          artist_elite_month:    ENV.stripeArtistIconPriceIdMonth,
          artist_elite_year:     ENV.stripeArtistIconPriceIdYear,
        };
        const priceId = priceIdMap[`${input.tier}_${input.interval}`];

        if (!priceId) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `Stripe price for ${input.tier} (${input.interval}) is not configured.`,
          });
        }

        // Look up user for stripeCustomerId
        const [user] = await database
          .select({ email: users.email, stripeCustomerId: users.stripeCustomerId })
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);

        const session = await createArtistSubscriptionCheckout({
          priceId,
          customerEmail: user?.email ?? "",
          stripeCustomerId: user?.stripeCustomerId ?? undefined,
          metadata: {
            userId: String(ctx.user.id),
            artistId: String(artist.id),
            tier: input.tier,
            interval: input.interval,
          },
          successUrl: input.successUrl,
          cancelUrl: input.cancelUrl,
        });

        return { checkoutUrl: session.url };
      }),

    /**
     * Start the Founding Artist checkout:
     * - 180-day free trial then $19/mo locked rate
     * - Marks artist with isFoundingArtist=true and sets foundingTrialEndsAt on webhook completion
     */
    startFoundingCheckout: protectedProcedure
      .input(
        z.object({
          successUrl: z.string().url(),
          cancelUrl: z.string().url(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        const [artist] = await database
          .select({ id: artists.id })
          .from(artists)
          .where(eq(artists.userId, ctx.user.id))
          .limit(1);

        if (!artist) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You must have an artist profile before joining the Founding Artist offer.",
          });
        }

        const [user] = await database
          .select({ email: users.email, stripeCustomerId: users.stripeCustomerId })
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);

        const priceId = ENV.stripeFoundingArtistPriceId;
        if (!priceId) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Founding Artist price is not configured.",
          });
        }

        const session = await createFoundingArtistCheckout({
          priceId,
          customerEmail: user?.email ?? "",
          stripeCustomerId: user?.stripeCustomerId ?? undefined,
          metadata: {
            userId: String(ctx.user.id),
            artistId: String(artist.id),
            tier: "artist_pro",
            interval: "month",
            isFoundingArtist: "true",
          },
          successUrl: input.successUrl,
          cancelUrl: input.cancelUrl,
        });

        return { checkoutUrl: session.url };
      }),

    search: publicProcedure
      .input(
        z.object({
          shopName: z.string().optional(),
          styles: z.array(z.string()).optional(),
          minRating: z.number().optional(),
          minExperience: z.number().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
        }),
      )
      .query(async ({ input }) => {
        const normalizeText = (value?: string, maxLen = 100) => {
          if (!value) return undefined;
          const trimmed = value.trim();
          if (!trimmed) return undefined;
          return trimmed.slice(0, maxLen);
        };

        return await db.searchArtists({
          ...input,
          shopName: normalizeText(input.shopName),
          city: normalizeText(input.city),
          state: normalizeText(input.state, 50),
        });
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
          experience: z.number().int().positive().optional(),
          city: z.string().default(""),
          state: z.string().default(""),
          styles: z.string().optional(),
          specialties: z.string().optional(),
          instagram: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const newArtist = await db.createArtist({
          ...input,
          shopName: sanitizeInput(input.shopName, 255),
          bio: input.bio ? sanitizeInput(input.bio, 2000) : undefined,
          specialties: input.specialties
            ? sanitizeInput(input.specialties, 500)
            : undefined,
          userId: ctx.user.id,
        });

        if (ENV.n8nOnboardingWebhookUrl) {
          fetch(ENV.n8nOnboardingWebhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${ENV.n8nWebhookSecret}`,
            },
            body: JSON.stringify({
              artistId: newArtist.id,
              userId: ctx.user.id,
              email: ctx.user.email,
              firstName: ctx.user.name?.split(" ")[0] ?? "there",
              shopName: input.shopName,
            }),
          }).catch(() => {});
        }

        return newArtist;
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
        return await db.updateArtist(id, {
          ...data,
          shopName: data.shopName ? sanitizeInput(data.shopName, 255) : undefined,
          bio: data.bio ? sanitizeInput(data.bio, 2000) : undefined,
          specialties: data.specialties ? sanitizeInput(data.specialties, 500) : undefined,
        });
      }),

    /**
     * Enable the no-subscription transaction plan.
     * Sets canonical tier to artist_pro (mapped to pay-as-you-go fee logic).
     */
    enablePayAsYouGo: protectedProcedure.mutation(async ({ ctx }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      }

      const [artist] = await database
        .select({ id: artists.id })
        .from(artists)
        .where(eq(artists.userId, ctx.user.id))
        .limit(1);

      if (!artist) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must have an artist profile first.",
        });
      }

      const [userRow] = await database
        .select({
          stripeSubscriptionId: users.stripeSubscriptionId,
          subscriptionTier: users.subscriptionTier,
        })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!userRow) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (userRow.stripeSubscriptionId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "You already have an active subscription. Cancel it first before switching to pay-as-you-go.",
        });
      }

      await database
        .update(users)
        .set({ subscriptionTier: "artist_pro" })
        .where(eq(users.id, ctx.user.id));

      return { success: true, tier: "artist_pro" as const };
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
          "artist_free") as ArtistSubscriptionTier;
        const limit = getArtistTierLimits(tier).portfolioPhotos;
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
          "artist_free") as ArtistSubscriptionTier;
        const limit = getArtistTierLimits(tier).portfolioPhotos;
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
        if (!image) throw new TRPCError({ code: "NOT_FOUND", message: "Portfolio image not found" });
        if (image.artistId !== input.artistId) throw new TRPCError({ code: "FORBIDDEN", message: "Forbidden" });

        const analysis = await analyzePortfolioImage(image.imageUrl);
        if (analysis.qualityScore === 0) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI analysis failed — please try again later" });
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
          throw new TRPCError({ code: "NOT_FOUND", message: "Portfolio image not found" });
        }

        // Get artist to verify ownership
        const artist = await db.getArtistById(image.artistId);
        if (!artist || artist.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own portfolio images" });
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
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid email address" });
        }

        const booking = await db.createBooking({
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

        // Stamp brand on lead and notify artist via email
        try {
          const database = await getDb();
          if (database) {
            const [artistWithUser] = await database
              .select({
                artistId: artists.id,
                shopName: artists.shopName,
                userEmail: users.email,
                userName: users.name,
              })
              .from(artists)
              .innerJoin(users, eq(artists.userId, users.id))
              .where(eq(artists.id, input.artistId))
              .limit(1);

            if (artistWithUser && artistWithUser.userEmail) {
              await sendBookingIntakeNotification(artistWithUser.userEmail, {
                artistName: artistWithUser.userName || artistWithUser.shopName,
                clientName: booking.customerName,
                clientEmail: booking.customerEmail,
                clientPhone: booking.customerPhone,
                tattooDescription: booking.tattooDescription,
                preferredDate: new Date(booking.preferredDate).toLocaleString(),
                placement: booking.placement,
                size: booking.size,
                budget: booking.budget || "N/A",
                additionalNotes: booking.additionalNotes || "N/A",
              });
            }
          }
        } catch (err) {
          logger.error("Failed to send booking intake notification email:", err);
        }

        return booking;
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
          throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
        }

        // Check if user is either the customer or owns the artist profile
        const isCustomer = booking.userId === ctx.user.id;
        let isArtist = false;

        const artist = await db.getArtistById(booking.artistId);
        if (artist && artist.userId === ctx.user.id) {
          isArtist = true;
        }

        if (!isCustomer && !isArtist) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only update your own bookings or bookings for your artist profile",
          });
        }

        // If the booking is being cancelled
        if (input.status === "cancelled") {
          let refundProcessed = false;
          let refundId: string | undefined = undefined;

          // If the artist is the one cancelling, auto-refund deposit if paid
          if (isArtist) {
            if (booking.depositPaid && booking.stripePaymentIntentId) {
              try {
                const { refundPaymentIntent } = await import("./stripe");
                const refund = await refundPaymentIntent(booking.stripePaymentIntentId);
                refundProcessed = true;
                refundId = refund.id;
              } catch (err) {
                logger.error("Failed to auto-refund deposit on artist cancellation:", err);
              }
            }

            await db.updateBooking(input.id, {
              status: "cancelled",
              cancelledBy: "artist",
              refundStatus: refundProcessed ? "refunded" : "not_requested",
              stripeRefundId: refundId,
              refundProcessedAt: refundProcessed ? new Date() : null,
            });
            return { success: true };
          } else if (isCustomer) {
            // Client cancelled
            await db.updateBooking(input.id, {
              status: "cancelled",
              cancelledBy: "client",
            });
            return { success: true };
          }
        }

        return await db.updateBooking(input.id, { status: input.status });
      }),

    requestRefund: protectedProcedure
      .input(
        z.object({
          bookingId: z.number(),
          reason: z.string().min(5).max(1000),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
        }
        if (booking.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only request refunds for your own bookings",
          });
        }
        if (!booking.depositPaid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No deposit has been paid for this booking",
          });
        }
        if (booking.refundStatus !== "not_requested") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A refund has already been requested or processed for this booking",
          });
        }

        await db.updateBooking(input.bookingId, {
          refundStatus: "requested",
          refundReason: sanitizeInput(input.reason, 1000),
          refundRequestedAt: new Date(),
        });

        return { success: true };
      }),

    adminGetRefundRequests: adminProcedure.query(async () => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const results = await database
        .select({
          booking: bookings,
          artistName: artists.shopName,
          clientName: users.name,
        })
        .from(bookings)
        .leftJoin(artists, eq(bookings.artistId, artists.id))
        .leftJoin(users, eq(bookings.userId, users.id))
        .where(eq(bookings.refundStatus, "requested"))
        .orderBy(desc(bookings.refundRequestedAt));

      return results;
    }),

    adminReviewRefund: adminProcedure
      .input(
        z.object({
          bookingId: z.number(),
          approve: z.boolean(),
        }),
      )
      .mutation(async ({ input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
        }

        if (input.approve) {
          let refundProcessed = false;
          let refundId: string | undefined = undefined;

          if (booking.depositPaid && booking.stripePaymentIntentId) {
            try {
              const { refundPaymentIntent } = await import("./stripe");
              const refund = await refundPaymentIntent(booking.stripePaymentIntentId);
              refundProcessed = true;
              refundId = refund.id;
            } catch (err) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Stripe refund failed: ${err instanceof Error ? err.message : String(err)}`,
              });
            }
          }

          await db.updateBooking(input.bookingId, {
            status: "cancelled",
            refundStatus: "refunded",
            stripeRefundId: refundId,
            refundProcessedAt: new Date(),
          });
        } else {
          await db.updateBooking(input.bookingId, {
            refundStatus: "rejected",
          });
        }

        return { success: true };
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
  shop: shopRouter,
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
        if (!review) throw new TRPCError({ code: "NOT_FOUND", message: "Review not found" });

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

  flash: router({
    getUploadUrl: artistOwnerProcedure
      .input(
        z.object({
          artistId: z.number(),
          fileName: z.string(),
          contentType: z.string(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        // Only Elite Icon artists can upload flash art
        const tier = (ctx.user?.subscriptionTier ?? "artist_free") as ArtistSubscriptionTier;
        if (tier !== "artist_elite") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only Elite Icon tier artists can post flash art on the front page.",
          });
        }

        const sanitizedFileName = sanitizeFileName(input.fileName);
        const fileKey = `public/${input.artistId}/flash-${Date.now()}-${sanitizedFileName}`;

        return await createSignedUploadUrl(BUCKETS.PORTFOLIO_IMAGES, fileKey);
      }),

    create: artistOwnerProcedure
      .input(
        z.object({
          artistId: z.number(),
          imageUrl: z.string().url(),
          imageKey: z.string(),
          title: z.string().min(1).max(255),
          description: z.string().max(2000).optional(),
          price: z.number().int().positive(),
          depositAmount: z.number().int().positive(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const tier = (ctx.user?.subscriptionTier ?? "artist_free") as ArtistSubscriptionTier;
        if (tier !== "artist_elite") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only Elite Icon tier artists can post flash art.",
          });
        }

        if (input.depositAmount > input.price) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Deposit amount cannot exceed the total price.",
          });
        }

        return await db.createFlashArt({
          ...input,
          title: sanitizeInput(input.title, 255),
          description: input.description ? sanitizeInput(input.description, 2000) : undefined,
        });
      }),

    delete: artistOwnerProcedure
      .input(
        z.object({
          id: z.number(),
          artistId: z.number(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const tier = (ctx.user?.subscriptionTier ?? "artist_free") as ArtistSubscriptionTier;
        if (tier !== "artist_elite") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only Elite Icon tier artists can manage flash art.",
          });
        }

        const flash = await db.getFlashArtById(input.id);
        if (!flash || flash.artistId !== input.artistId) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Flash art not found" });
        }

        const deleted = await db.deleteFlashArt(input.id, input.artistId);
        if (deleted) {
          try {
            await deleteFile(BUCKETS.PORTFOLIO_IMAGES, deleted.imageKey);
          } catch (err) {
            logger.warn("Failed to delete flash art image from storage", { key: deleted.imageKey, err });
          }
        }
        return { success: true };
      }),

    getMyFlash: artistOwnerProcedure
      .input(z.object({ artistId: z.number() }))
      .query(async ({ ctx, input }) => {
        const tier = (ctx.user?.subscriptionTier ?? "artist_free") as ArtistSubscriptionTier;
        if (tier !== "artist_elite") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only Elite Icon tier artists have access to flash art management.",
          });
        }
        return await db.getFlashArtByArtistId(input.artistId);
      }),

    getAllActive: publicProcedure.query(async () => {
      return await db.getAllActiveFlashArt();
    }),

    getByArtistId: publicProcedure
      .input(z.object({ artistId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) return [];
        return await database
          .select()
          .from(flashArt)
          .where(and(eq(flashArt.artistId, input.artistId), eq(flashArt.isLocked, false)))
          .orderBy(desc(flashArt.createdAt));
      }),

    createLockCheckout: protectedProcedure
      .input(
        z.object({
          flashId: z.number(),
          preferredDate: z.string(), // ISO String
          customerPhone: z.string().min(1).max(50),
          successUrl: z.string().url(),
          cancelUrl: z.string().url(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const flash = await db.getFlashArtById(input.flashId);
        if (!flash) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Flash art not found" });
        }
        if (flash.isLocked) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This flash piece is already locked." });
        }

        const artist = await db.getArtistById(flash.artistId);
        if (!artist) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Artist not found" });
        }

        // Create Stripe checkout session using existing helper
        const session = await createCheckoutSession({
          priceInCents: flash.depositAmount,
          productName: `Lock Flash: "${flash.title}"`,
          productDescription: `Non-refundable deposit to claim and book this custom flash art by ${artist.shopName}.`,
          customerEmail: ctx.user.email ?? "",
          metadata: {
            paymentType: "flash_deposit",
            flashId: String(flash.id),
            userId: String(ctx.user.id),
            preferredDate: input.preferredDate,
            customerPhone: input.customerPhone,
            customerName: ctx.user.name || "",
            customerEmail: ctx.user.email || "",
          },
          successUrl: input.successUrl,
          cancelUrl: input.cancelUrl,
        });

        return { checkoutUrl: session.url };
      }),
  }),

  // ── AI Tattoo Generation ──────────────────────
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
