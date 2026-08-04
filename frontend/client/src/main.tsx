import * as Sentry from "@sentry/react";
import { trpc, trpcClient } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from "@shared/clientConst";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import { initAnalytics } from "./lib/analytics";
import "./index.css";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "https://e2de2529cc60ea38479b53231561460c@o4511500483231744.ingest.us.sentry.io/4511500485066752",
  // Disable automatic collection of IP addresses/PII
  sendDefaultPii: false,
  beforeSend(event) {
    if (event.request) {
      if (event.request.headers) {
        delete event.request.headers["Authorization"];
        delete event.request.headers["Cookie"];
        delete event.request.headers["cookie"];
      }
      if (event.request.url) {
        event.request.url = event.request.url.replace(/([?&])(?:email|token|password)=[^&]*/g, "$1$2=[filtered]");
      }
    }
    const sensitiveKeys = ["email", "phone", "password", "token", "tattooDescription", "description", "address", "guestEmail", "imageUrl", "imageKey"];
    const scrubObject = (obj: any) => {
      if (!obj || typeof obj !== "object") return;
      for (const key in obj) {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
          obj[key] = "[filtered]";
        } else if (typeof obj[key] === "object") {
          scrubObject(obj[key]);
        }
      }
    };
    scrubObject(event.extra);
    scrubObject(event.breadcrumbs);
    scrubObject(event.user);
    return event;
  }
});

initAnalytics();

// Register Service Worker for PWA support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("Service Worker registered successfully with scope: ", reg.scope);
      })
      .catch((err) => {
        console.error("Service Worker registration failed: ", err);
      });
  });
}

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

// Subscribe to query cache errors with proper cleanup
const unsubscribeQuery = queryClient.getQueryCache().subscribe((event) => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

// Subscribe to mutation cache errors with proper cleanup
const unsubscribeMutation = queryClient
  .getMutationCache()
  .subscribe((event) => {
    if (event.type === "updated" && event.action.type === "error") {
      const error = event.mutation.state.error;
      redirectToLoginIfUnauthorized(error);
      console.error("[API Mutation Error]", error);
    }
  });

// Cleanup subscriptions if module is reloaded (HMR)
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    unsubscribeQuery?.();
    unsubscribeMutation?.();
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>,
);
