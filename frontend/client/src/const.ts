export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "App";

export const APP_LOGO = "/logo.png";

/**
 * Get login URL - redirects to Supabase Auth login page
 * Replaced old Manus OAuth with Supabase Auth
 */
export const getLoginUrl = () => {
  return "/login";
};
