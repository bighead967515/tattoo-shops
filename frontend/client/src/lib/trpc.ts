import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../../backend/server/routers";
import { httpBatchLink, loggerLink } from "@trpc/client";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    loggerLink({
      enabled: () => process.env.NODE_ENV === "development",
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
