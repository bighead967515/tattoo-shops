import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { createCheckoutSession } from "./stripe";
import { PRODUCTS } from "./products";

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
    
    add: protectedProcedure
      .input(z.object({
        artistId: z.number(),
        imageUrl: z.string(),
        imageKey: z.string(),
        caption: z.string().optional(),
        style: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.addPortfolioImage(input);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
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
      .query(async ({ input }) => {
        return await db.getBookingsByArtistId(input.artistId);
      }),
    
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
      }))
      .mutation(async ({ input }) => {
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

        return { url: session.url };
      }),
  }),
});

export type AppRouter = typeof appRouter;
