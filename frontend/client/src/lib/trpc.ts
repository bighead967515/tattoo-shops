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

export function clearCsrfToken() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(CSRF_STORAGE_KEY);
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
  // NOTE: Due to a server-side quirk, the first request sets two cookies and returns the
  // first token in the header (which the browser overwrites with the second cookie value).
  // We make a second request so the server sees the already-set cookie and returns the
  // correct matching token in the header.
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      // First request — establishes the cookie
      const firstResponse = await window.fetch("/api/csrf-token", {
        method: "GET",
        credentials: "include",
      });

      if (!firstResponse.ok) {
        throw new Error(`CSRF bootstrap failed with status ${firstResponse.status}`);
      }

      // Second request — cookie is now set, server returns the matching token in header
      const secondResponse = await window.fetch("/api/csrf-token", {
        method: "GET",
        credentials: "include",
      });

      if (!secondResponse.ok) {
        throw new Error(`CSRF confirm failed with status ${secondResponse.status}`);
      }

      const token = secondResponse.headers.get("X-CSRF-Token");
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
