import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../../backend/server/routers";
import { httpBatchLink, loggerLink } from "@trpc/client";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_STORAGE_KEY = "csrf_token";

function readStoredCsrfToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(CSRF_STORAGE_KEY);
}

function storeCsrfToken(token: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(CSRF_STORAGE_KEY, token);
}

export async function getCsrfToken(): Promise<string | null> {
  return ensureCsrfToken();
}

async function ensureCsrfToken(): Promise<string | null> {
  const existing = readStoredCsrfToken();
  if (existing) return existing;

  if (typeof window === "undefined") return null;

  let lastError: unknown = null;

  // Bootstrap token from a safe GET endpoint. The backend emits X-CSRF-Token on all responses.
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await window.fetch("/api/health", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`CSRF bootstrap failed with status ${response.status}`);
      }

      const token = response.headers.get("X-CSRF-Token");
      if (token) {
        storeCsrfToken(token);
        return token;
      }

      // Healthy response but no token is treated as an absent token, not a transport failure.
      return null;
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** (attempt - 1)));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unable to bootstrap CSRF token");
}

export const trpcClient = trpc.createClient({
  links: [
    loggerLink({
      enabled: () => import.meta.env.DEV,
    }),
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch: async (url, options) => {
        const response = await window.fetch(url, {
          ...options,
          credentials: "include",
        });

        const freshToken = response.headers.get("X-CSRF-Token");
        if (freshToken) {
          storeCsrfToken(freshToken);
        }

        return response;
      },
      async headers() {
        const token = await ensureCsrfToken();
        return token
          ? {
              [CSRF_HEADER_NAME]: token,
            }
          : {};
      },
    }),
  ],
});
