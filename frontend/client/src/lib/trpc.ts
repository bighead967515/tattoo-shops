import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../../backend/server/routers";
import { httpBatchLink, loggerLink, TRPCClientError } from "@trpc/client";
import { toast } from "sonner";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === "development" ||
        (opts.direction === "down" && opts.result && !opts.result.ok),
      onError: ({ error }) => {
        if (error instanceof TRPCClientError && error.cause instanceof TypeError) {
          toast.error("Network error: Please check your internet connection.");
        }
      },
    }),
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      async headers() {
        return {
          // authorization: getAuthCookie(),
        };
      },
    }),
  ],
});
