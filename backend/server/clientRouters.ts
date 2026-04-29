import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { eq, and, desc, sql, ilike } from "drizzle-orm";
import { getDb } from "./db";
import {
  clients,
  tattooRequests,
  requestImages,
  bids,
  users,
  artists,
} from "../drizzle/schema";
import {
  BUCKETS,
  createSignedUploadUrl,
  getPublicUrl,
} from "./_core/supabaseStorage";
import { TRPCError } from "@trpc/server";
import { logger } from "./_core/logger";
import path from "path";
import { refineRequestPrompt, draftBidResponse } from "./geminiBidOptimizer";
import { createSubscriptionCheckout } from "./stripe";
import { ENV } from "./_core/env";
import {
  CLIENT_TIER_PRICING,
  TIER_LIMITS,
  getTransactionFeeRate,
  type ArtistTierKey,
  type ClientSubscriptionTier,
} from "../shared/tierLimits";
import {
  canUseAiBidAssistant,
  isFreeArtistTier,
  toLegacyArtistTier,
  type ArtistCanonicalTier,
} from "../shared/tierCompat";
import { buildClientOnboardingUserUpdate } from "./_core/onboarding";

/**
 * Sanitize a filename to prevent path traversal attacks.
 */
function sanitizeFileName(fileName: string, maxLength = 100): string {
  let sanitized = path.basename(fileName);
  sanitized = sanitized.replace(/[\\\0]/g, "");
  sanitized = sanitized.replace(/\.\./g, "");
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");
  sanitized = sanitized.replace(/_+/g, "_");
  sanitized = sanitized.substring(0, maxLength);
  if (!sanitized || sanitized === "." || sanitized === "..") {
    sanitized = `upload_${Date.now()}`;
  }
  return sanitized;
}

// Helper to get non-null database instance
async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database connection not available",
    });
  }
  return db;
}

// ============================================
// CLIENT ROUTER
// ============================================
export const clientsRouter = router({
  // Get current user's client profile
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.userId, ctx.user.id))
      .limit(1);
    return client || null;
  }),

  // Create client profile (onboarding)
  createProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().min(2).max(255),
        bio: z.string().max(1000).optional(),
        preferredStyles: z.string().optional(),
        city: z.string().max(100).optional(),
        state: z.string().max(50).optional(),
        phone: z.string().max(50).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      // Check if profile already exists
      const existing = await db
        .select()
        .from(clients)
        .where(eq(clients.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Client profile already exists",
        });
      }

      // Wrap role update and client creation in a transaction
      const newClient = await db.transaction(async (tx) => {
        // Update user role to client
        await tx
          .update(users)
          .set(buildClientOnboardingUserUpdate())
          .where(eq(users.id, ctx.user.id));

        // Create client profile
        const [created] = await tx
          .insert(clients)
          .values({
            userId: ctx.user.id,
            ...input,
            onboardingCompleted: true,
          })
          .returning();

        return created;
      });

      return newClient;
    }),

  // Update client profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().min(2).max(255).optional(),
        bio: z.string().max(1000).optional(),
        preferredStyles: z.string().optional(),
        city: z.string().max(100).optional(),
        state: z.string().max(50).optional(),
        phone: z.string().max(50).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [updated] = await db
        .update(clients)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(clients.userId, ctx.user.id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Client profile not found",
        });
      }

      return updated;
    }),

  /**
   * Create a Stripe Checkout Session for a client subscription upgrade.
   * Returns the Checkout URL to redirect the user to.
   */
  createSubscriptionCheckout: protectedProcedure
    .input(
      z.object({
        tier: z.enum(["client_plus", "client_elite"]),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();

      // Verify the user has a client profile
      const [clientProfile] = await db
        .select()
        .from(clients)
        .where(eq(clients.userId, ctx.user.id))
        .limit(1);

      if (!clientProfile) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Complete client onboarding before upgrading your plan.",
        });
      }

      // Resolve the Stripe Price ID for the requested tier
      const priceId =
        input.tier === "client_plus"
          ? ENV.stripeClientPlusPriceId
          : ENV.stripeClientElitePriceId;

      if (!priceId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Stripe price for ${input.tier} is not configured. Please contact support.`,
        });
      }

      // Look up the user for stripeCustomerId (may be null for new subscribers)
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      const session = await createSubscriptionCheckout({
        priceId,
        customerEmail: user?.email ?? "",
        stripeCustomerId: user?.stripeCustomerId ?? undefined,
        metadata: {
          userId: String(ctx.user.id),
          clientId: String(clientProfile.id),
          tier: input.tier,
        },
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
      });

      return { checkoutUrl: session.url };
    }),
});

// ============================================
// TATTOO REQUESTS ROUTER
// ============================================
export const requestsRouter = router({
  // Get all open requests (for artists to browse)
  getOpen: publicProcedure
    .input(
      z
        .object({
          style: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          limit: z.number().min(1).max(50).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const db = await requireDb();
      const filters = input || { limit: 20, offset: 0 };

      const results = await db
        .select({
          request: tattooRequests,
          client: clients,
          images: sql<string>`(
            SELECT json_agg(json_build_object('id', ri.id, 'imageUrl', ri."imageUrl", 'isMainImage', ri."isMainImage"))
            FROM "requestImages" ri
            WHERE ri."requestId" = "tattooRequests".id
          )`.as("images"),
          bidCount: sql<number>`(
            SELECT COUNT(*) FROM bids WHERE bids."requestId" = "tattooRequests".id
          )`.as("bidCount"),
        })
        .from(tattooRequests)
        .leftJoin(clients, eq(tattooRequests.clientId, clients.id))
        .where(eq(tattooRequests.status, "open"))
        .orderBy(desc(tattooRequests.createdAt))
        .limit(filters.limit ?? 20)
        .offset(filters.offset ?? 0);

      return results.map((r: (typeof results)[number]) => ({
        ...r.request,
        client: r.client,
        images: r.images ? JSON.parse(r.images as unknown as string) : [],
        bidCount: Number(r.bidCount),
      }));
    }),

  // Get open requests for paid artists' dashboard
  listForArtistDashboard: protectedProcedure
    .input(
      z
        .object({
          style: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          limit: z.number().min(1).max(50).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const db = await requireDb();

      // 1. Verify user is a paid artist
      const [artist] = await db
        .select({ subscriptionTier: artists.subscriptionTier })
        .from(artists)
        .where(eq(artists.userId, ctx.user.id))
        .limit(1);

      if (!artist || isFreeArtistTier(artist.subscriptionTier)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This feature is only available for paid artist plans.",
        });
      }

      // 2. Fetch open requests (same logic as getOpen)
      const filters = input || { limit: 20, offset: 0 };
      const results = await db
        .select({
          request: tattooRequests,
          client: clients,
          images: sql<string>`(
            SELECT json_agg(json_build_object('id', ri.id, 'imageUrl', ri."imageUrl", 'isMainImage', ri."isMainImage"))
            FROM "requestImages" ri
            WHERE ri."requestId" = "tattooRequests".id
          )`.as("images"),
          bidCount: sql<number>`(
            SELECT COUNT(*) FROM bids WHERE bids."requestId" = "tattooRequests".id
          )`.as("bidCount"),
        })
        .from(tattooRequests)
        .leftJoin(clients, eq(tattooRequests.clientId, clients.id))
        .where(eq(tattooRequests.status, "open"))
        .orderBy(desc(tattooRequests.createdAt))
        .limit(filters.limit ?? 20)
        .offset(filters.offset ?? 0);

      return results.map((r: (typeof results)[number]) => ({
        ...r.request,
        client: r.client,
        images: r.images ? JSON.parse(r.images as unknown as string) : [],
        bidCount: Number(r.bidCount),
      }));
    }),

  // Get recent open requests for the homepage feed
  listForHomepage: publicProcedure.query(async () => {
    const db = await requireDb();

    const results = await db
      .select({
        request: tattooRequests,
        client: clients,
        images: sql<string>`(
            SELECT json_agg(json_build_object('id', ri.id, 'imageUrl', ri."imageUrl", 'isMainImage', ri."isMainImage"))
            FROM "requestImages" ri
            WHERE ri."requestId" = "tattooRequests".id
          )`.as("images"),
        bidCount: sql<number>`(
            SELECT COUNT(*) FROM bids WHERE bids."requestId" = "tattooRequests".id
          )`.as("bidCount"),
      })
      .from(tattooRequests)
      .leftJoin(clients, eq(tattooRequests.clientId, clients.id))
      .where(eq(tattooRequests.status, "open"))
      .orderBy(desc(tattooRequests.createdAt))
      .limit(8);

    return results.map((r: (typeof results)[number]) => ({
      ...r.request,
      client: r.client,
      images: r.images ? JSON.parse(r.images as unknown as string) : [],
      bidCount: Number(r.bidCount),
    }));
  }),

  // Get request by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const [result] = await db
        .select({
          request: tattooRequests,
          client: clients,
        })
        .from(tattooRequests)
        .leftJoin(clients, eq(tattooRequests.clientId, clients.id))
        .where(eq(tattooRequests.id, input.id))
        .limit(1);

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }

      // Get images
      const images = await db
        .select()
        .from(requestImages)
        .where(eq(requestImages.requestId, input.id));

      // Get bids with artist info
      const requestBids = await db
        .select({
          bid: bids,
          artist: artists,
        })
        .from(bids)
        .innerJoin(artists, eq(bids.artistId, artists.id))
        .where(eq(bids.requestId, input.id))
        .orderBy(desc(bids.createdAt));

      // Increment view count
      await db
        .update(tattooRequests)
        .set({ viewCount: sql`${tattooRequests.viewCount} + 1` })
        .where(eq(tattooRequests.id, input.id));

      return {
        ...result.request,
        client: result.client,
        images,
        bids: requestBids.map((b: (typeof requestBids)[number]) => ({
          ...b.bid,
          artist: b.artist,
        })),
      };
    }),

  // Get my requests (for clients)
  getMyRequests: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    // Get client ID
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.userId, ctx.user.id))
      .limit(1);

    if (!client) {
      return [];
    }

    const results = await db
      .select({
        request: tattooRequests,
        bidCount: sql<number>`(
          SELECT COUNT(*) FROM bids WHERE bids."requestId" = "tattooRequests".id
        )`.as("bidCount"),
      })
      .from(tattooRequests)
      .where(eq(tattooRequests.clientId, client.id))
      .orderBy(desc(tattooRequests.createdAt));

    return results.map((r: (typeof results)[number]) => ({
      ...r.request,
      bidCount: Number(r.bidCount),
    }));
  }),

  // Create a new tattoo request — open to everyone, including guests without an account
  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(5).max(255),
        description: z.string().min(20).max(5000),
        style: z.string().max(100).optional(),
        placement: z.string().max(100),
        size: z.string().max(50),
        colorPreference: z
          .enum(["color", "black_and_grey", "either"])
          .optional(),
        budgetMin: z.number().min(0).optional(),
        budgetMax: z.number().min(0).optional(),
        preferredCity: z.string().max(100).optional(),
        preferredState: z.string().max(50).optional(),
        willingToTravel: z.boolean().default(false),
        desiredTimeframe: z.string().max(100).optional(),
        guestEmail: z.string().email().max(255).optional(), // guests can optionally leave contact info
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const { guestEmail, ...requestInput } = input;
      // If user is logged in, try to link to their client profile
      let clientId: number | null = null;
      if (ctx.user) {
        const [client] = await db
          .select({ id: clients.id })
          .from(clients)
          .where(eq(clients.userId, ctx.user.id))
          .limit(1);
        if (client) clientId = client.id;
      }
      const [newRequest] = await db
        .insert(tattooRequests)
        .values({
          clientId,
          guestEmail: clientId ? null : (guestEmail ?? null),
          ...requestInput,
        })
        .returning();
      return newRequest;
    }),

  // AI Prompt Refiner — open to everyone including guests
  refineDescription: publicProcedure
    .input(
      z.object({
        description: z.string().min(1).max(5000),
        title: z.string().max(255).optional(),
        style: z.string().max(100).optional(),
        placement: z.string().max(100).optional(),
        size: z.string().max(50).optional(),
        colorPreference: z.string().max(50).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { description, ...context } = input;
      try {
        return await refineRequestPrompt(description, context);
      } catch (error) {
        logger.error("AI prompt refinement failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "AI refinement failed — please try again or submit your description as-is.",
        });
      }
    }),

  // Get a signed URL for uploading a request image — open to guests too
  getUploadUrl: publicProcedure
    .input(
      z.object({
        fileName: z.string(),
        contentType: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Use client ID if logged in, otherwise use a guest prefix
      const db = await requireDb();
      let prefix = "guest";
      if (ctx.user) {
        const [client] = await db
          .select({ id: clients.id })
          .from(clients)
          .where(eq(clients.userId, ctx.user.id))
          .limit(1);
        if (client) prefix = String(client.id);
      }
      // Sanitize filename to prevent path traversal
      const sanitizedFileName = sanitizeFileName(input.fileName);
      const fileKey = `public/${prefix}/${Date.now()}-${sanitizedFileName}`;
      return await createSignedUploadUrl(BUCKETS.REQUEST_IMAGES, fileKey);
    }),

  // Add image to request — open to guests (guest requests have clientId = NULL)
  addImage: publicProcedure
    .input(
      z.object({
        requestId: z.number(),
        imageKey: z.string(),
        caption: z.string().max(500).optional(),
        isMainImage: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      let request: typeof tattooRequests.$inferSelect | undefined;

      if (ctx.user) {
        // Logged-in user: verify they own the request via clientId
        const [client] = await db
          .select({ id: clients.id })
          .from(clients)
          .where(eq(clients.userId, ctx.user.id))
          .limit(1);
        const rows = await db
          .select()
          .from(tattooRequests)
          .where(
            and(
              eq(tattooRequests.id, input.requestId),
              eq(tattooRequests.clientId, client?.id ?? 0),
            ),
          )
          .limit(1);
        request = rows[0];
      } else {
        // Guest: only allow adding images to guest requests (clientId IS NULL)
        const rows = await db
          .select()
          .from(tattooRequests)
          .where(
            and(
              eq(tattooRequests.id, input.requestId),
              sql`"clientId" IS NULL`,
            ),
          )
          .limit(1);
        request = rows[0];
      }

      if (!request) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only add images to your own requests",
        });
      }

      // If this is main image, unset others
      if (input.isMainImage) {
        await db
          .update(requestImages)
          .set({ isMainImage: false })
          .where(eq(requestImages.requestId, input.requestId));
      }

      const imageUrl = getPublicUrl(BUCKETS.REQUEST_IMAGES, input.imageKey);

      // Explicitly map only expected columns to avoid injecting unexpected fields
      const [image] = await db
        .insert(requestImages)
        .values({
          requestId: input.requestId,
          imageKey: input.imageKey,
          imageUrl,
          caption: input.caption,
          isMainImage: input.isMainImage,
        })
        .returning();

      return image;
    }),

  // Update request status
  updateStatus: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        status: z.enum(["open", "in_progress", "completed", "cancelled"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.userId, ctx.user.id))
        .limit(1);

      const [updated] = await db
        .update(tattooRequests)
        .set({ status: input.status, updatedAt: new Date() })
        .where(
          and(
            eq(tattooRequests.id, input.requestId),
            eq(tattooRequests.clientId, client?.id ?? 0),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own requests",
        });
      }

      return updated;
    }),
});

// ============================================
// BIDS ROUTER
// ============================================
export const bidsRouter = router({
  // Get bids for a request (client view)
  getForRequest: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      // Verify client owns the request
      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.userId, ctx.user.id))
        .limit(1);

      const [request] = await db
        .select()
        .from(tattooRequests)
        .where(
          and(
            eq(tattooRequests.id, input.requestId),
            eq(tattooRequests.clientId, client?.id ?? 0),
          ),
        )
        .limit(1);

      if (!request) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view bids on your own requests",
        });
      }

      const requestBids = await db
        .select({
          bid: bids,
          artist: artists,
        })
        .from(bids)
        .innerJoin(artists, eq(bids.artistId, artists.id))
        .where(eq(bids.requestId, input.requestId))
        .orderBy(desc(bids.createdAt));

      return requestBids.map((b: (typeof requestBids)[number]) => ({
        ...b.bid,
        artist: b.artist,
      }));
    }),

  // Get my bids (for artists)
  getMyBids: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    const [artist] = await db
      .select()
      .from(artists)
      .where(eq(artists.userId, ctx.user.id))
      .limit(1);

    if (!artist) {
      return [];
    }

    const myBids = await db
      .select({
        bid: bids,
        request: tattooRequests,
        client: clients,
      })
      .from(bids)
      .innerJoin(tattooRequests, eq(bids.requestId, tattooRequests.id))
      .leftJoin(clients, eq(tattooRequests.clientId, clients.id))
      .where(eq(bids.artistId, artist.id))
      .orderBy(desc(bids.createdAt));

    return myBids.map((b: (typeof myBids)[number]) => ({
      ...b.bid,
      request: b.request,
      client: b.client,
    }));
  }),

  // AI Bid Assistant — draft a bid response (Professional/Icon tier only)
  draftBid: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();

      // 1. Verify artist and tier
      const [artist] = await db
        .select()
        .from(artists)
        .where(eq(artists.userId, ctx.user.id))
        .limit(1);

      if (!artist) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only artists can use the bid assistant",
        });
      }

      if (!canUseAiBidAssistant(artist.subscriptionTier)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "AI Bid Assistant is available for Professional and Icon tier artists. Upgrade to access this feature.",
        });
      }

      // 2. Get the request
      const [request] = await db
        .select()
        .from(tattooRequests)
        .where(eq(tattooRequests.id, input.requestId))
        .limit(1);

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }

      // 2b. Only draft bids for open requests
      if (request.status !== "open") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot draft a bid for a request that is ${request.status}. Only open requests accept new bids.`,
        });
      }

      // 3. Draft the bid
      const draft = await draftBidResponse(
        {
          title: request.title,
          description: request.description,
          style: request.style,
          placement: request.placement,
          size: request.size,
          colorPreference: request.colorPreference,
          budgetMin: request.budgetMin,
          budgetMax: request.budgetMax,
          desiredTimeframe: request.desiredTimeframe,
        },
        {
          shopName: artist.shopName,
          bio: artist.bio,
          styles: artist.styles,
          specialties: artist.specialties,
          experience: artist.experience,
          city: artist.city,
          state: artist.state,
        },
      );

      return draft;
    }),

  // Submit a bid (for artists)
  create: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        priceEstimate: z.number().min(100), // At least $1
        estimatedHours: z.number().min(1).optional(),
        message: z.string().min(20).max(2000),
        availableDate: z.string().optional(),
        portfolioLinks: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      // Get artist ID and check their subscription status
      const [artist] = await db
        .select()
        .from(artists)
        .where(eq(artists.userId, ctx.user.id))
        .limit(1);

      if (!artist) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only artists can submit bids",
        });
      }

      // ── Per-tier monthly bid quota enforcement ──────────────────────────
      const canonicalTier = (artist.subscriptionTier ?? "artist_free") as ArtistCanonicalTier;
      const legacyTier = toLegacyArtistTier(canonicalTier) as ArtistTierKey;
      const tierLimits = TIER_LIMITS[legacyTier] ?? TIER_LIMITS.free;
      const bidsPerMonth = tierLimits.bidsPerMonth;

      // Free tier: bidding is completely blocked
      if (bidsPerMonth === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Bidding on client posts requires a paid plan. Upgrade to Pro or switch to pay-as-you-go to start submitting proposals.",
        });
      }

      // Paid tiers with a finite monthly quota: check and auto-reset if new month
      if (bidsPerMonth !== Number.MAX_SAFE_INTEGER) {
        const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
        const isNewMonth = artist.bidsMonthYear !== currentMonth;

        if (isNewMonth) {
          await db
            .update(artists)
            .set({ bidsThisMonth: 0, bidsMonthYear: currentMonth })
            .where(eq(artists.id, artist.id));
          artist.bidsThisMonth = 0;
          artist.bidsMonthYear = currentMonth;
        }

        if (artist.bidsThisMonth >= bidsPerMonth) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You have reached your ${bidsPerMonth} bid limit for this month. Upgrade your plan or wait until next month to submit more proposals.`,
          });
        }
      }

      // Check request exists and is open
      const [request] = await db
        .select()
        .from(tattooRequests)
        .where(eq(tattooRequests.id, input.requestId))
        .limit(1);

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }

      if (request.status !== "open") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This request is no longer accepting bids",
        });
      }

      // Check for duplicate bid - artist can only bid once per request
      const [existingBid] = await db
        .select()
        .from(bids)
        .where(
          and(
            eq(bids.requestId, input.requestId),
            eq(bids.artistId, artist.id),
          ),
        )
        .limit(1);

      if (existingBid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Artist has already placed a bid on this request",
        });
      }

      // Store the platform fee rate (in basis points) at bid creation time
      const feeRate = getTransactionFeeRate(legacyTier);
      const platformFeeRateBps = Math.round(feeRate * 10000); // e.g. 0.05 → 500 bps

      const [newBid] = await db
        .insert(bids)
        .values({
          requestId: input.requestId,
          artistId: artist.id,
          priceEstimate: input.priceEstimate,
          estimatedHours: input.estimatedHours,
          message: input.message,
          availableDate: input.availableDate
            ? new Date(input.availableDate)
            : null,
          portfolioLinks: input.portfolioLinks,
          platformFeeRateBps,
        })
        .returning();

      // Increment monthly bid counter for finite-quota tiers
      if (bidsPerMonth !== Number.MAX_SAFE_INTEGER) {
        await db
          .update(artists)
          .set({
            bidsThisMonth: sql`${artists.bidsThisMonth} + 1`,
            bidsUsed: sql`${artists.bidsUsed} + 1`,
          })
          .where(eq(artists.id, artist.id));
      }

      return newBid;
    }),

  // Accept a bid (for clients)
  accept: protectedProcedure
    .input(z.object({ bidId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      // Get client
      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.userId, ctx.user.id))
        .limit(1);

      if (!client) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only clients can accept bids",
        });
      }

      // Get the bid and verify ownership of request
      const [bid] = await db
        .select({
          bid: bids,
          request: tattooRequests,
        })
        .from(bids)
        .innerJoin(tattooRequests, eq(bids.requestId, tattooRequests.id))
        .where(
          and(eq(bids.id, input.bidId), eq(tattooRequests.clientId, client.id)),
        )
        .limit(1);

      if (!bid) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bid not found or you don't own this request",
        });
      }

      // Calculate platform fee at acceptance time
      const platformFeeAmountCents = bid.bid.platformFeeRateBps > 0
        ? Math.round(bid.bid.priceEstimate * bid.bid.platformFeeRateBps / 10000)
        : null;

      // Wrap all bid/request updates in a transaction
      await db.transaction(async (tx) => {
        // Update bid status to accepted + record the platform fee
        await tx
          .update(bids)
          .set({ status: "accepted", platformFeeAmountCents, updatedAt: new Date() })
          .where(eq(bids.id, input.bidId));

        // Reject all other bids for this request
        await tx
          .update(bids)
          .set({ status: "rejected", updatedAt: new Date() })
          .where(
            and(
              eq(bids.requestId, bid.request.id),
              sql`${bids.id} != ${input.bidId}`,
            ),
          );

        // Update request status
        await tx
          .update(tattooRequests)
          .set({
            status: "in_progress",
            selectedBidId: input.bidId,
            updatedAt: new Date(),
          })
          .where(eq(tattooRequests.id, bid.request.id));
      });

      return { success: true };
    }),

  // Withdraw a bid (for artists)
  withdraw: protectedProcedure
    .input(z.object({ bidId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [artist] = await db
        .select()
        .from(artists)
        .where(eq(artists.userId, ctx.user.id))
        .limit(1);

      if (!artist) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only artists can withdraw bids",
        });
      }

      const [updated] = await db
        .update(bids)
        .set({ status: "withdrawn", updatedAt: new Date() })
        .where(and(eq(bids.id, input.bidId), eq(bids.artistId, artist.id)))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bid not found or you don't own it",
        });
      }

      return updated;
    }),
});
