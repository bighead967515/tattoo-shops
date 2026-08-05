import { z } from "zod";
import crypto from "crypto";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { eq, and, desc, sql, ilike, lt, inArray } from "drizzle-orm";
import { getDb, isAiEnabled } from "./db";
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
  deleteFiles,
} from "./_core/supabaseStorage";
import { TRPCError } from "@trpc/server";
import { logger } from "./_core/logger";
import path from "path";
import { sanitizeInput } from "./_core/sanitize";
import { refineRequestPrompt, draftBidResponse } from "./geminiBidOptimizer";
import { createCheckoutSession } from "./stripe";
import { ENV } from "./_core/env";
import {
  CLIENT_TIER_PRICING,
  getArtistTierLimits,
  type ArtistSubscriptionTier,
  type ClientSubscriptionTier,
} from "../shared/tierLimits";
import {
  canUseAiBidAssistant,
} from "../shared/tierCompat";
import { buildClientOnboardingUserUpdate } from "./_core/onboarding";
import {
  REQUEST_ADDON_PAYMENT_STATUSES,
  calculateRequestAddonTotalCents,
  type RequestAddonSelection,
} from "../shared/requestAddons";

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

/**
 * Cleanup job to delete expired image reservations and their associated files in Supabase Storage.
 */
export async function cleanupExpiredReservations(db: any) {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  try {
    const expired = await db
      .select({ id: requestImages.id, imageKey: requestImages.imageKey })
      .from(requestImages)
      .where(
        and(
          eq(requestImages.status, "reserved"),
          lt(requestImages.createdAt, tenMinutesAgo),
        )
      );

    if (expired.length > 0) {
      const keysToDelete = expired.map((e: any) => e.imageKey);
      
      // Delete files from Supabase Storage first; only delete database rows on success
      try {
        await deleteFiles(BUCKETS.REQUEST_IMAGES, keysToDelete);

        // Delete database rows ONLY after successful file deletion
        const idsToDelete = expired.map((e: any) => e.id);
        await db
          .delete(requestImages)
          .where(inArray(requestImages.id, idsToDelete));

        console.log(`[Cleanup Job] Cleaned up ${idsToDelete.length} expired image reservations.`);
      } catch (err) {
        console.error("[Cleanup Job] Failed to delete files from Supabase Storage, preserving database rows for retry:", err);
      }
    }
  } catch (error) {
    console.error("[Cleanup Job] Error running expired reservations cleanup:", error);
  }
}

// Start periodic background cleanup job (every 15 minutes)
const cleanupInterval = setInterval(async () => {
  try {
    const db = await getDb();
    if (db) {
      await cleanupExpiredReservations(db);
    }
  } catch (err) {
    console.error("[Cleanup Job] Failed to run on interval:", err);
  }
}, 15 * 60 * 1000);
if (cleanupInterval && typeof cleanupInterval.unref === "function") {
  cleanupInterval.unref();
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
            displayName: sanitizeInput(input.displayName, 255),
            bio: input.bio ? sanitizeInput(input.bio, 1000) : undefined,
            preferredStyles: input.preferredStyles ? sanitizeInput(input.preferredStyles, 500) : undefined,
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
        .set({
          ...input,
          displayName: input.displayName ? sanitizeInput(input.displayName, 255) : undefined,
          bio: input.bio ? sanitizeInput(input.bio, 1000) : undefined,
          preferredStyles: input.preferredStyles ? sanitizeInput(input.preferredStyles, 500) : undefined,
          updatedAt: new Date(),
        })
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

});

function maskContactInfo(
  request: any,
  client: any,
  userClientId: number | null,
  isAdmin: boolean,
) {
  const isOwner = userClientId !== null && request.clientId === userClientId;
  const shouldMask = !isOwner && !isAdmin;

  const { guestToken, ...sanitizedRequest } = request;

  return {
    ...sanitizedRequest,
    guestEmail: shouldMask ? "[Masked - Use platform chat]" : request.guestEmail,
    client: client
      ? {
          ...client,
          phone: shouldMask ? "[Masked - Use platform chat]" : client.phone,
        }
      : null,
  };
}

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
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      const filters = input || { limit: 20, offset: 0 };

      let userClientId: number | null = null;
      let isAdmin = false;
      let isArtist = false;
      if (ctx?.user) {
        isAdmin = ctx.user.role === "admin";
        const [client] = await db
          .select()
          .from(clients)
          .where(eq(clients.userId, ctx.user.id))
          .limit(1);
        if (client) {
          userClientId = client.id;
        }
        const [artist] = await db
          .select()
          .from(artists)
          .where(eq(artists.userId, ctx.user.id))
          .limit(1);
        isArtist = !!artist;
      }

      // P1-2 Fix: Build WHERE clause dynamically based on filters
      const whereConditions = [eq(tattooRequests.status, "open")];
      
      if (filters?.style) {
        // Match against comma-separated styles in request
        whereConditions.push(
          sql`${tattooRequests.style} ILIKE ${'%' + filters.style + '%'}`
        );
      }
      
      if (filters?.city) {
        whereConditions.push(
          eq(clients.city, filters.city)
        );
      }
      
      if (filters?.state) {
        whereConditions.push(
          eq(clients.state, filters.state)
        );
      }

      const results = await db
        .select({
          request: tattooRequests,
          client: clients,
          images: sql<string>`(
            SELECT json_agg(json_build_object('id', ri.id, 'imageUrl', ri."imageUrl", 'isMainImage', ri."isMainImage"))
            FROM "requestImages" ri
            WHERE ri."requestId" = "tattooRequests".id AND ri.status = 'finalized'
          )`.as("images"),
          bidCount: sql<number>`(
            SELECT COUNT(*) FROM bids WHERE bids."requestId" = "tattooRequests".id
          )`.as("bidCount"),
        })
        .from(tattooRequests)
        .leftJoin(clients, eq(tattooRequests.clientId, clients.id))
        .where(and(...whereConditions))
        .orderBy(
          desc(
            sql<number>`CASE WHEN "tattooRequests"."selectedAddons" @> '"priorityPlacement"'::jsonb AND "tattooRequests"."addOnPaymentStatus" = 'paid' THEN 1 ELSE 0 END`,
          ),
          desc(tattooRequests.createdAt),
        )
        .limit(filters.limit ?? 20)
        .offset(filters.offset ?? 0);

      return results.map((r: (typeof results)[number]) => {
        const requestData = {
          ...r.request,
          images: r.images ? JSON.parse(r.images as unknown as string) : [],
          bidCount: Number(r.bidCount),
        };
        return maskContactInfo(requestData, r.client, userClientId, isAdmin);
      });
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

      // 1. Verify user is a paid artist (use canonical users.subscriptionTier)
      const [artist] = await db
        .select({ id: artists.id })
        .from(artists)
        .where(eq(artists.userId, ctx.user.id))
        .limit(1);

      const canonicalTierForDashboard = ctx.user.subscriptionTier ?? "artist_free";

      if (!artist || canonicalTierForDashboard === "artist_free") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This feature is only available for paid artist plans.",
        });
      }

      // 2. Fetch open requests with filters (P1-2 Fix: apply filters)
      const filters = input || { limit: 20, offset: 0 };
      
      // P1-2 Fix: Build WHERE clause dynamically based on filters
      const whereConditions = [eq(tattooRequests.status, "open")];
      
      if (filters?.style) {
        whereConditions.push(
          sql`${tattooRequests.style} ILIKE ${'%' + filters.style + '%'}`
        );
      }
      
      if (filters?.city) {
        whereConditions.push(
          eq(clients.city, filters.city)
        );
      }
      
      if (filters?.state) {
        whereConditions.push(
          eq(clients.state, filters.state)
        );
      }
      
      const results = await db
        .select({
          request: tattooRequests,
          client: clients,
          images: sql<string>`(
            SELECT json_agg(json_build_object('id', ri.id, 'imageUrl', ri."imageUrl", 'isMainImage', ri."isMainImage"))
            FROM "requestImages" ri
            WHERE ri."requestId" = "tattooRequests".id AND ri.status = 'finalized'
          )`.as("images"),
          bidCount: sql<number>`(
            SELECT COUNT(*) FROM bids WHERE bids."requestId" = "tattooRequests".id
          )`.as("bidCount"),
        })
        .from(tattooRequests)
        .leftJoin(clients, eq(tattooRequests.clientId, clients.id))
        .where(and(...whereConditions))
        .orderBy(
          desc(
            sql<number>`CASE WHEN "tattooRequests"."selectedAddons" @> '"priorityPlacement"'::jsonb AND "tattooRequests"."addOnPaymentStatus" = 'paid' THEN 1 ELSE 0 END`,
          ),
          desc(tattooRequests.createdAt),
        )
        .limit(filters.limit ?? 20)
        .offset(filters.offset ?? 0);

      return results.map((r: (typeof results)[number]) => {
        const { guestToken, ...sanitizedRequest } = r.request;
        return {
          ...sanitizedRequest,
          client: r.client,
          images: r.images ? JSON.parse(r.images as unknown as string) : [],
          bidCount: Number(r.bidCount),
        };
      });
    }),

  // Get recent open requests for the homepage feed
  listForHomepage: publicProcedure.query(async ({ ctx }) => {
    const db = await requireDb();

    let userClientId: number | null = null;
    let isAdmin = false;
    if (ctx?.user) {
      isAdmin = ctx.user.role === "admin";
      const [client] = await db
        .select()
        .from(clients)
        .where(eq(clients.userId, ctx.user.id))
        .limit(1);
      if (client) {
        userClientId = client.id;
      }
    }

    const results = await db
      .select({
        request: tattooRequests,
        client: clients,
        images: sql<string>`(
            SELECT json_agg(json_build_object('id', ri.id, 'imageUrl', ri."imageUrl", 'isMainImage', ri."isMainImage"))
            FROM "requestImages" ri
            WHERE ri."requestId" = "tattooRequests".id AND ri.status = 'finalized'
          )`.as("images"),
        bidCount: sql<number>`(
            SELECT COUNT(*) FROM bids WHERE bids."requestId" = "tattooRequests".id
          )`.as("bidCount"),
      })
      .from(tattooRequests)
      .leftJoin(clients, eq(tattooRequests.clientId, clients.id))
      .where(eq(tattooRequests.status, "open"))
      .orderBy(
        desc(
          sql<number>`CASE WHEN "tattooRequests"."selectedAddons" @> '"priorityPlacement"'::jsonb AND "tattooRequests"."addOnPaymentStatus" = 'paid' THEN 1 ELSE 0 END`,
        ),
        desc(tattooRequests.createdAt),
      )
      .limit(8);

    return results.map((r: (typeof results)[number]) => {
      const requestData = {
        ...r.request,
        images: r.images ? JSON.parse(r.images as unknown as string) : [],
        bidCount: Number(r.bidCount),
      };
      return maskContactInfo(requestData, r.client, userClientId, isAdmin);
    });
  }),

  // Get request by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
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
        .where(
          and(
            eq(requestImages.requestId, input.id),
            eq(requestImages.status, "finalized"),
          ),
        );

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

      let userClientId: number | null = null;
      let isAdmin = false;
      if (ctx?.user) {
        isAdmin = ctx.user.role === "admin";
        const [client] = await db
          .select()
          .from(clients)
          .where(eq(clients.userId, ctx.user.id))
          .limit(1);
        if (client) {
          userClientId = client.id;
        }
      }

      const requestData = {
        ...result.request,
        images,
        bids: requestBids.map((b: (typeof requestBids)[number]) => ({
          ...b.bid,
          artist: b.artist,
        })),
      };
      return maskContactInfo(requestData, result.client, userClientId, isAdmin);
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

    return results.map((r: (typeof results)[number]) => {
      const { guestToken, ...sanitizedRequest } = r.request;
      return {
        ...sanitizedRequest,
        bidCount: Number(r.bidCount),
      };
    });
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
        isCoverUp: z.boolean().default(false),
        desiredTimeframe: z.string().max(100).optional(),
        addOns: z
          .object({
            priorityPlacement: z.boolean().default(false),
            preBookingChat: z.boolean().default(false),
            aiPriceEstimate: z.boolean().default(false),
            incognitoMode: z.boolean().default(false),
            conceptArtist: z.boolean().default(false),
            perfectMatchRouter: z.boolean().default(false),
            painAnalysis: z.boolean().default(false),
            vipBundle: z.boolean().default(false),
          })
          .optional(),
        guestEmail: z.string().email().max(255).optional(), // guests can optionally leave contact info
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const { guestEmail, addOns, ...requestInput } = input;

      const normalizedAddOns: RequestAddonSelection = {
        priorityPlacement: addOns?.priorityPlacement ?? false,
        preBookingChat: addOns?.preBookingChat ?? false,
        aiPriceEstimate: addOns?.aiPriceEstimate ?? false,
        incognitoMode: addOns?.incognitoMode ?? false,
        conceptArtist: addOns?.conceptArtist ?? false,
        perfectMatchRouter: addOns?.perfectMatchRouter ?? false,
        painAnalysis: addOns?.painAnalysis ?? false,
        vipBundle: addOns?.vipBundle ?? false,
      };
      const addOnTotalCents = calculateRequestAddonTotalCents(normalizedAddOns);

      // If user is logged in, try to link to their client profile
      let clientId: number | null = null;
      let userEmail = "";
      if (ctx.user) {
        const [client] = await db
          .select({ id: clients.id })
          .from(clients)
          .where(eq(clients.userId, ctx.user.id))
          .limit(1);
        if (client) clientId = client.id;

        const [userRow] = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);
        userEmail = userRow?.email ?? "";
      }

      const addOnArray = Object.entries(normalizedAddOns)
        .filter(([_, value]) => value)
        .map(([key]) => key);

      const guestToken = clientId ? null : crypto.randomUUID();

      const [newRequest] = await db
        .insert(tattooRequests)
        .values({
          clientId,
          guestEmail: clientId ? null : (guestEmail ?? null),
          guestToken,
          selectedAddons: addOnArray,
          addOnTotalCents,
          addOnPaymentStatus:
            addOnTotalCents > 0
              ? REQUEST_ADDON_PAYMENT_STATUSES.CHECKOUT_PENDING
              : REQUEST_ADDON_PAYMENT_STATUSES.NOT_REQUESTED,
          ...requestInput,
          title: sanitizeInput(requestInput.title, 255),
          description: sanitizeInput(requestInput.description, 5000),
        })
        .returning();

      if (addOnTotalCents <= 0) {
        return {
          ...newRequest,
          addOnPaymentRequired: false,
          addOnCheckoutUrl: null,
          guestToken: newRequest.guestToken,
        };
      }

      const checkoutEmail = userEmail || guestEmail || "";
      if (!checkoutEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "An email is required to purchase add-ons.",
        });
      }

      const baseUrl = ENV.publicBaseUrl || "http://localhost:3000";

      try {
        const session = await createCheckoutSession({
          priceInCents: addOnTotalCents,
          productName: "Ink Connect Request Add-ons",
          productDescription:
            "Optional visibility and messaging add-ons for your tattoo request.",
          customerEmail: checkoutEmail,
          metadata: {
            paymentType: "request_addons",
            requestId: String(newRequest.id),
            userId: ctx.user ? String(ctx.user.id) : "guest",
          },
          successUrl: `${baseUrl}/requests/${newRequest.id}?addons=success`,
          cancelUrl: `${baseUrl}/requests/${newRequest.id}?addons=cancel`,
        });

        await db
          .update(tattooRequests)
          .set({
            addOnStripeCheckoutSessionId: session.id,
            updatedAt: new Date(),
          })
          .where(eq(tattooRequests.id, newRequest.id));

        return {
          ...newRequest,
          addOnPaymentRequired: true,
          addOnCheckoutUrl: session.url,
          guestToken: newRequest.guestToken,
        };
      } catch (error) {
        await db
          .update(tattooRequests)
          .set({
            addOnPaymentStatus: REQUEST_ADDON_PAYMENT_STATUSES.FAILED,
            updatedAt: new Date(),
          })
          .where(eq(tattooRequests.id, newRequest.id));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to initialize add-on payment. Please try again.",
          cause: error,
        });
      }
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
      if (!(await isAiEnabled())) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "AI features are disabled until there are 100 registered users.",
        });
      }
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
        requestId: z.number(),
        guestToken: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      let prefix = "guest";

      if (ctx.user) {
        const [client] = await db
          .select({ id: clients.id })
          .from(clients)
          .where(eq(clients.userId, ctx.user.id))
          .limit(1);
        if (!client) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Client profile not found",
          });
        }

        // Verify request ownership
        const [request] = await db
          .select()
          .from(tattooRequests)
          .where(
            and(
              eq(tattooRequests.id, input.requestId),
              eq(tattooRequests.clientId, client.id),
            ),
          )
          .limit(1);
        if (!request) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not own this request",
          });
        }
        prefix = String(client.id);
      } else {
        // Guest: verify token matches request
        if (!input.guestToken) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Guest request ownership token is required",
          });
        }
        const [request] = await db
          .select()
          .from(tattooRequests)
          .where(
            and(
              eq(tattooRequests.id, input.requestId),
              sql`"clientId" IS NULL`,
              eq(tattooRequests.guestToken, input.guestToken),
            ),
          )
          .limit(1);
        if (!request) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Invalid request ID or guest token",
          });
        }
      }

      // Sanitize filename to prevent path traversal
      const sanitizedFileName = sanitizeFileName(input.fileName);
      const fileKey = `public/${prefix}/${input.requestId}/${Date.now()}-${sanitizedFileName}`;

      // Reserve slot in a transaction
      await db.transaction(async (tx) => {
        // Lock the tattoo request row to serialize slot reservations
        await tx.execute(
          sql`SELECT id FROM "tattooRequests" WHERE id = ${input.requestId} FOR UPDATE`
        );

        // Delete expired reservations and files from Supabase Storage
        await cleanupExpiredReservations(tx);

        // Count non-expired images + active reservations
        const [imgCount] = await tx
          .select({ count: sql<number>`count(*)::int` })
          .from(requestImages)
          .where(eq(requestImages.requestId, input.requestId));

        if ((imgCount?.count ?? 0) >= 10) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Maximum image limit reached for this request (max 10)",
          });
        }

        // Insert placeholder reservation
        await tx
          .insert(requestImages)
          .values({
            requestId: input.requestId,
            imageKey: fileKey,
            imageUrl: "reserved",
            status: "reserved",
            isMainImage: false,
            isExistingTattoo: false,
          });
      });

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
        isExistingTattoo: z.boolean().default(false),
        guestToken: z.string().optional(),
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

        if (!client || !input.imageKey.startsWith(`public/${client.id}/${input.requestId}/`)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid image upload path",
          });
        }

        const rows = await db
          .select()
          .from(tattooRequests)
          .where(
            and(
              eq(tattooRequests.id, input.requestId),
              eq(tattooRequests.clientId, client.id),
            ),
          )
          .limit(1);
        request = rows[0];
      } else {
        // Guest: only allow adding images to guest requests matching guestToken
        if (!input.guestToken) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Guest request ownership token is required",
          });
        }
        if (!input.imageKey.startsWith(`public/guest/${input.requestId}/`)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid image upload path for guests",
          });
        }

        const rows = await db
          .select()
          .from(tattooRequests)
          .where(
            and(
              eq(tattooRequests.id, input.requestId),
              sql`"clientId" IS NULL`,
              eq(tattooRequests.guestToken, input.guestToken),
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

      const imageUrl = getPublicUrl(BUCKETS.REQUEST_IMAGES, input.imageKey);

      // Perform updates inside a transaction to serialize reservation completion
      const image = await db.transaction(async (tx) => {
        // Lock the tattoo request row
        await tx.execute(
          sql`SELECT id FROM "tattooRequests" WHERE id = ${input.requestId} FOR UPDATE`
        );

        // Delete expired reservations and files from Supabase Storage
        await cleanupExpiredReservations(tx);

        // Find the active reservation row for this imageKey
        const [reservation] = await tx
          .select()
          .from(requestImages)
          .where(
            and(
              eq(requestImages.imageKey, input.imageKey),
              eq(requestImages.requestId, input.requestId),
              eq(requestImages.status, "reserved")
            )
          )
          .limit(1);

        if (!reservation) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "No active reservation found for this image upload. It may have expired or already been completed.",
          });
        }

        // If this is main image, unset others
        if (input.isMainImage) {
          await tx
            .update(requestImages)
            .set({ isMainImage: false })
            .where(eq(requestImages.requestId, input.requestId));
        }

        // Update the reservation row to be a completed image upload
        const [updatedImage] = await tx
          .update(requestImages)
          .set({
            imageUrl,
            caption: input.caption || null,
            status: "finalized",
            isMainImage: input.isMainImage,
            isExistingTattoo: input.isExistingTattoo,
            createdAt: new Date(), // Reset creation time to completion time
          })
          .where(eq(requestImages.id, reservation.id))
          .returning();

        return updatedImage;
      });

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

    return myBids.map((b: (typeof myBids)[number]) => {
      const maskedRequest = maskContactInfo(b.request, b.client, null, false);
      return {
        ...b.bid,
        request: maskedRequest,
        client: maskedRequest.client,
      };
    });
  }),

  // AI Bid Assistant — draft a bid response (Pro subscription/Icon tier only)
  draftBid: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!(await isAiEnabled())) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "AI features are disabled until there are 100 registered users.",
        });
      }
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

      const canonicalTierForDraft = ctx.user.subscriptionTier ?? "artist_free";

      if (!canUseAiBidAssistant(canonicalTierForDraft)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "AI Bid Assistant is available for Pro subscription and Icon tier artists. Upgrade to access this feature.",
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
      // Use canonical users.subscriptionTier (updated by Stripe webhook) rather
      // than the deprecated artists.subscriptionTier column.
      const canonicalTier = (ctx.user.subscriptionTier ?? "artist_free") as ArtistSubscriptionTier;
      const tierLimits = getArtistTierLimits(canonicalTier);
      const bidsPerMonth = tierLimits.freeBidsPerMonth;

      // Free tier: bidding is completely blocked
      if (bidsPerMonth === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Bidding on client posts requires a paid plan. Upgrade to Pro or Elite to start submitting proposals.",
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
      const feeRate = tierLimits.transactionFeePercent / 100;
      const platformFeeRateBps = Math.round(feeRate * 10000); // e.g. 0.05 → 500 bps

      const [newBid] = await db
        .insert(bids)
        .values({
          requestId: input.requestId,
          artistId: artist.id,
          priceEstimate: input.priceEstimate,
          estimatedHours: input.estimatedHours,
          message: sanitizeInput(input.message, 2000),
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
