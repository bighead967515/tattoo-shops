import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { createCheckoutSession } from "./stripe";
import { PRODUCTS } from "./products";
import { uploadFile, getPublicUrl, deleteFile } from "./_core/supabaseStorage";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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
      .input(z.object({
        styles: z.array(z.string()).optional(),
        minRating: z.number().optional(),
        minExperience: z.number().optional(),
        city: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.searchArtists(input);
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
      .input(z.object({
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
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createArtist({
          userId: ctx.user.id,
          ...input,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
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
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        
        // Verify ownership
        const artist = await db.getArtistById(id);
        if (!artist) {
          throw new Error("Artist not found");
        }
        if (artist.userId !== ctx.user.id) {
          throw new Error("Forbidden: You can only update your own artist profile");
        }
        
        return await db.updateArtist(id, data);
      }),
  }),

  portfolio: router({
    get: publicProcedure
      .input(z.object({ artistId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPortfolioByArtistId(input.artistId);
      }),
    
    getUploadUrl: protectedProcedure
      .input(z.object({
        artistId: z.number(),
        fileName: z.string(),
        contentType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify the user owns the artist profile
        const artist = await db.getArtistById(input.artistId);
        if (!artist) {
          throw new Error("Artist not found");
        }
        if (artist.userId !== ctx.user.id) {
          throw new Error("Forbidden: You can only upload to your own portfolio");
        }
        
        // Generate unique file key
        const fileKey = `${input.artistId}/${Date.now()}-${input.fileName}`;
        
        // Return the file key for client to upload
        return {
          fileKey,
          bucket: 'portfolio-images',
        };
      }),
    
    add: protectedProcedure
      .input(z.object({
        artistId: z.number(),
        imageUrl: z.string(),
        imageKey: z.string(),
        caption: z.string().optional(),
        style: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify the user owns the artist profile
        const artist = await db.getArtistById(input.artistId);
        if (!artist) {
          throw new Error("Artist not found");
        }
        if (artist.userId !== ctx.user.id) {
          throw new Error("Forbidden: You can only add images to your own portfolio");
        }
        
        return await db.addPortfolioImage(input);
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
          throw new Error("Forbidden: You can only delete your own portfolio images");
        }
        
        // Delete from Supabase storage
        try {
          await deleteFile(image.imageKey);
        } catch (error) {
          console.error("Failed to delete file from storage:", error);
          // Continue with DB deletion even if storage deletion fails
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
      .input(z.object({
        artistId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createReview({
          ...input,
          userId: ctx.user.id,
        });
      }),
  }),

  bookings: router({
    create: protectedProcedure
      .input(z.object({
        artistId: z.number(),
        customerName: z.string(),
        customerEmail: z.string().email(),
        customerPhone: z.string(),
        preferredDate: z.date(),
        tattooDescription: z.string(),
        placement: z.string(),
        size: z.string(),
        budget: z.string().optional(),
        additionalNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.createBooking({
          ...input,
          userId: ctx.user.id,
        });
      }),
    
    getByUserId: protectedProcedure.query(async ({ ctx }) => {
      return await db.getBookingsByUserId(ctx.user.id);
    }),
    
    getByArtistId: protectedProcedure
      .input(z.object({ artistId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Verify the user owns the artist profile
        const artist = await db.getArtistById(input.artistId);
        if (!artist) {
          throw new Error("Artist not found");
        }
        if (artist.userId !== ctx.user.id) {
          throw new Error("Forbidden: You can only view bookings for your own artist profile");
        }
        
        return await db.getBookingsByArtistId(input.artistId);
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
      }))
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
          isArtist = artist && artist.userId === ctx.user.id;
        }
        
        if (!isCustomer && !isArtist) {
          throw new Error("Forbidden: You can only update your own bookings or bookings for your artist profile");
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

  payments: router({
    createCheckout: protectedProcedure
      .input(z.object({
        bookingId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.bookingId);
        if (!booking) {
          throw new Error("Booking not found");
        }
        
        // Verify the user owns this booking
        if (booking.userId !== ctx.user.id) {
          throw new Error("Forbidden: You can only create checkout sessions for your own bookings");
        }

        const product = PRODUCTS.BOOKING_DEPOSIT;
        const origin = ctx.req.headers.origin || "http://localhost:3000";

        const session = await createCheckoutSession({
          priceInCents: product.priceInCents,
          productName: product.name,
          productDescription: product.description,
          customerEmail: ctx.user.email || booking.customerEmail,
          metadata: {
            bookingId: input.bookingId.toString(),
            userId: ctx.user.id.toString(),
            customerEmail: ctx.user.email || booking.customerEmail,
            customerName: ctx.user.name || booking.customerName,
          },
          successUrl: `${origin}/payment/success`,
          cancelUrl: `${origin}/payment/cancelled`,
        });
        
        if (!session.url) {
          throw new Error("Failed to create checkout session: No URL returned from Stripe");
        }

        return { url: session.url };
      }),
  }),
});

export type AppRouter = typeof appRouter;
