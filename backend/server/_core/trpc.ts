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
  const { ctx } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return opts.next({
    ctx: {
      ...ctx,
      // user is now guaranteed non-null
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const artistProcedure = protectedProcedure.use(
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    const artist = await getArtistByUserId(ctx.user.id);
    
    if (!artist && ctx.user.role !== 'admin') {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You must have an artist profile to perform this action",
      });
    }

    return next({ ctx });
  })
);

/**
 * Ensures the user owns the artist profile specified in input
 * Checks input.artistId or input.id depending on the mutation/query
 */
export const artistOwnerProcedure = artistProcedure.use(
  t.middleware(async ({ ctx, next, input }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    if (ctx.user.role === 'admin') return next({ ctx });

    const artist = await getArtistByUserId(ctx.user.id);
    const parsedInput = input as { artistId?: number; id?: number } | undefined;
    const targetArtistId = parsedInput?.artistId ?? parsedInput?.id;

    if (!artist || (targetArtistId && artist.id !== targetArtistId)) {
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
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    if (ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({ ctx });
  }),
);
