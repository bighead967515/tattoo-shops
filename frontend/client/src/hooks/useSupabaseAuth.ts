import { useState, useEffect } from "react";
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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
      });

      // If we have a session, sync it with backend cookie
      if (session?.access_token) {
        syncSessionWithBackend(session.access_token, session.refresh_token);
      }
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
        await syncSessionWithBackend(
          session.access_token,
          session.refresh_token,
        );
      }

      // Clear backend cookie on sign out
      if (event === "SIGNED_OUT") {
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

    if (data.session?.access_token) {
      try {
        await syncSessionWithBackend(
          data.session.access_token,
          data.session.refresh_token,
        );
      } catch (syncError) {
        await supabase.auth.signOut();
        throw syncError;
      }
    }

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

    if (data.session?.access_token) {
      try {
        await syncSessionWithBackend(
          data.session.access_token,
          data.session.refresh_token,
        );
      } catch (syncError) {
        await supabase.auth.signOut();
        throw syncError;
      }
    }

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
