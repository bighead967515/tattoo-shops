import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

/**
 * Hook for Supabase authentication state
 * Replaces useAuth hook that used Manus OAuth
 */
export function useSupabaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });
  const lastSyncedAccessTokenRef = useRef<string | null>(null);

  async function syncCurrentSession(
    session: Session | null,
    options?: {
      silent?: boolean;
      signOutOnFailure?: boolean;
    },
  ) {
    if (!session?.access_token) {
      lastSyncedAccessTokenRef.current = null;
      return;
    }

    if (lastSyncedAccessTokenRef.current === session.access_token) {
      return;
    }

    try {
      await syncSessionWithBackend(
        session.access_token,
        session.refresh_token,
      );
      lastSyncedAccessTokenRef.current = session.access_token;
    } catch (error) {
      lastSyncedAccessTokenRef.current = null;

      if (options?.signOutOnFailure) {
        await supabase.auth.signOut();
      }

      if (options?.silent) {
        console.error("[Auth] Failed to sync session with backend:", error);
        return;
      }

      throw error;
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
        });

        await syncCurrentSession(session, { silent: true });
      })
      .catch((error) => {
        console.error("[Auth] Failed to restore session:", error);
        setAuthState({
          user: null,
          session: null,
          loading: false,
        });
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
      });

      // Sync session with backend on sign in
      if (event === "SIGNED_IN" && session?.access_token) {
        await syncCurrentSession(session, { silent: true });
      }

      // Clear backend cookie on sign out
      if (event === "SIGNED_OUT") {
        lastSyncedAccessTokenRef.current = null;
        await fetch("/api/auth/signout", {
          method: "POST",
          credentials: "include",
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sync Supabase session with backend cookie
   */
  async function syncSessionWithBackend(
    accessToken: string,
    refreshToken?: string,
  ) {
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      let message = "Failed to create app session";

      try {
        const payload = await response.json();
        if (payload?.error && typeof payload.error === "string") {
          message = payload.error;
        }
      } catch {
        // Ignore JSON parse failures and use the default message.
      }

      throw new Error(message);
    }
  }

  /**
   * Sign in with email and password
   */
  async function signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    await syncCurrentSession(data.session, { signOutOnFailure: true });

    return data;
  }

  /**
   * Sign up with email and password
   */
  async function signUpWithEmail(
    email: string,
    password: string,
    metadata?: { name?: string },
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;

    await syncCurrentSession(data.session, { signOutOnFailure: true });

    return data;
  }

  /**
   * Sign in with OAuth provider
   */
  async function signInWithOAuth(provider: "google" | "github") {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign out
   */
  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Send password reset email
   */
  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
  }

  /**
   * Update user metadata
   */
  async function updateUser(updates: { name?: string; email?: string }) {
    const { data, error } = await supabase.auth.updateUser({
      email: updates.email,
      data: { name: updates.name },
    });

    if (error) throw error;
    return data;
  }

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
    signOut,
    resetPassword,
    updateUser,
  };
}
