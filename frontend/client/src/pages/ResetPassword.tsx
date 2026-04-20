import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, CheckCircle2, AlertTriangle, Loader2, Eye, EyeOff } from "lucide-react";

type PageState = "loading" | "form" | "success" | "error";

export default function ResetPassword() {
  const [, setLocation] = useLocation();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Supabase sends the recovery token in the URL hash as #access_token=...&type=recovery
  // The Supabase JS client automatically picks this up via onAuthStateChange
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        // User arrived via a valid reset link — show the new-password form
        setPageState("form");
      }
    });

    // Also check if there's already a session (user refreshed the page)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // If we have a session but haven't received PASSWORD_RECOVERY yet,
        // check the URL hash for the recovery type
        const hash = window.location.hash;
        if (hash.includes("type=recovery")) {
          setPageState("form");
        } else if (pageState === "loading") {
          // No recovery token — this page was accessed directly
          setPageState("error");
          setErrorMessage(
            "This link is invalid or has already been used. Please request a new password reset.",
          );
        }
      } else if (pageState === "loading") {
        // No session and no recovery event yet — wait a moment then show error
        const timer = setTimeout(() => {
          setPageState((prev) => {
            if (prev === "loading") {
              setErrorMessage(
                "This link is invalid or has expired. Please request a new password reset.",
              );
              return "error";
            }
            return prev;
          });
        }, 3000);
        return () => clearTimeout(timer);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPageState("success");
      // Sign out so user logs in fresh with the new password
      await supabase.auth.signOut();
    } catch (err: any) {
      setFormError(err.message || "Failed to update password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-sm">Verifying your link…</p>
        </div>
      </div>
    );
  }

  // ── Error (invalid / expired link) ──────────────────────────────────────────
  if (pageState === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold">Link expired</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {errorMessage}
            </p>
            <Button
              className="w-full"
              onClick={() => setLocation("/forgot-password")}
            >
              Request a new reset link
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setLocation("/login")}
            >
              Back to Sign In
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (pageState === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold">Password updated!</h1>
            <p className="text-muted-foreground text-sm">
              Your password has been changed successfully. Sign in with your new
              password to continue.
            </p>
            <Button className="w-full" onClick={() => setLocation("/login")}>
              Sign In
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // ── New Password Form ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Set a new password</h1>
            <p className="text-muted-foreground text-sm">
              Choose a strong password for your Ink Connect account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoFocus
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password strength hint */}
            {password.length > 0 && password.length < 8 && (
              <p className="text-xs text-amber-500">
                Password must be at least 8 characters.
              </p>
            )}
            {password.length >= 8 && confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="text-xs text-destructive">Passwords do not match.</p>
            )}

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={
                isSubmitting ||
                password.length < 8 ||
                password !== confirmPassword
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating…
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 mr-2" />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
