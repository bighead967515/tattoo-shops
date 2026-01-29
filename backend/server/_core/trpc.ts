import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { getArtistByUserId } from "../db";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const artistProcedure = protectedProcedure.use(
  t.middleware(async ({ ctx, next }) => {
    const artist = await getArtistByUserId(ctx.user!.id);
    
    if (!artist && ctx.user!.role !== 'admin') {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You must have an artist profile to perform this action",
      });
    }

    return next({
      ctx: {
        ...ctx,
        artist,
      },
    });
  })
);

/**
 * Ensures the user owns the artist profile specified in input
 * Checks input.artistId or input.id depending on the mutation/query
 */
export const artistOwnerProcedure = artistProcedure.use(
  t.middleware(async ({ ctx, next, rawInput }) => {
    if (ctx.user!.role === 'admin') return next({ ctx });

    const input = rawInput as any;
    const targetArtistId = input?.artistId || input?.id;

    if (!ctx.artist || (targetArtistId && ctx.artist.id !== targetArtistId)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not authorized to manage this artist profile",
      });
    }

    return next({ ctx });
  })
);

export const adminProcedure = protectedProcedure.use(
  t.middleware(async ({ ctx, next }) => {
    if (ctx.user!.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx,
    });
  }),
);
