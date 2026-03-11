import { useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from URL hash parameters
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          setLocation("/login");
          return;
        }

        if (session) {
          // Exchange Supabase token for backend session cookie
          try {
            const response = await fetch("/api/auth/session", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                accessToken: session.access_token,
                refreshToken: session.refresh_token,
              }),
            });

            if (!response.ok) {
              throw new Error("Failed to create session");
            }

            // Redirect to dashboard
            setLocation("/dashboard");
          } catch (err) {
            console.error("Session creation error:", err);
            setLocation("/login");
          }
        } else {
          // No session, redirect to login
          setLocation("/login");
        }
      } catch (err) {
        console.error("Callback handling error:", err);
        setLocation("/login");
      }
    };

    handleCallback();
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
