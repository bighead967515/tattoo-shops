import { createClient } from "@supabase/supabase-js";
import { ENV } from "./env";

// Server-side Supabase client with service role key (bypasses RLS)
export const supabaseAdmin = createClient(
  ENV.supabaseUrl,
  ENV.supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// Create a client for a specific user (respects RLS)
export function createSupabaseClientForUser(accessToken: string) {
  return createClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
