import { publicProcedure, router } from './_core/trpc';

export const healthRouter = router({
  healthCheck: publicProcedure.query(() => {
    return 'OK';
  }),
});
