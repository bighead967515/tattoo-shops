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
  const state = btoa(String.fromCharCode(...Array.from(stateArray)));
  
  // Store state in sessionStorage for verification (handle multiple concurrent states)
  try {
    const stateKey = `oauth_state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const existingStates = sessionStorage.getItem("oauth_states");
    const statesMap = existingStates ? JSON.parse(existingStates) : {};
    statesMap[state] = { timestamp: Date.now(), key: stateKey };
    sessionStorage.setItem("oauth_states", JSON.stringify(statesMap));
  } catch (storageError) {
    // Fall back to in-memory storage if sessionStorage is restricted
    console.warn("SessionStorage unavailable, OAuth state verification may fail");
  }

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
