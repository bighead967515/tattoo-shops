let analyticsInitialized = false;

export function initAnalytics() {
  if (analyticsInitialized || typeof window === "undefined") {
    return;
  }

  const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID?.trim();
  if (!measurementId) {
    return;
  }

  const scriptId = "ga4-gtag-script";
  if (!document.getElementById(scriptId)) {
    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }

  const win = window as Window & {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  };

  win.dataLayer = win.dataLayer || [];
  if (typeof win.gtag !== "function") {
    win.gtag = (...args: unknown[]) => {
      win.dataLayer?.push(args);
    };
  }

  win.gtag("js", new Date());
  // App.tsx emits route-aware page_view events on location changes.
  win.gtag("config", measurementId, { send_page_view: false });

  analyticsInitialized = true;
}

// Build trigger: GA4 tracking enabled (G-93DVKJBFDV)
