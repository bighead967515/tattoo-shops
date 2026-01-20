export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "App";

export const APP_LOGO = "/logo.png";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
  // Validate environment variables
  if (!oauthPortalUrl || !appId) {
    throw new Error("Missing required environment variables: VITE_OAUTH_PORTAL_URL and VITE_APP_ID");
  }
  
  try {
    new URL(oauthPortalUrl);
  } catch {
    throw new Error("Invalid VITE_OAUTH_PORTAL_URL: must be a valid URL");
  }
  
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  
  // Generate crypto-secure state nonce
  const stateArray = new Uint8Array(16);
  crypto.getRandomValues(stateArray);
  const state = btoa(String.fromCharCode(...stateArray));
  
  // Store state in sessionStorage for verification
  sessionStorage.setItem("oauth_state", state);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
