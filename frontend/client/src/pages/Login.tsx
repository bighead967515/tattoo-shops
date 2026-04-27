import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, ArrowLeft, Mail } from "lucide-react";

// Inline SVG icons to avoid react-icons bundle dependency
function GoogleIcon() {
  return (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );
}

export default function Login() {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const { isAuthenticated, refresh } = useAuth();
  const { signInWithEmail, signUpWithEmail, signInWithOAuth } =
    useSupabaseAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(() => {
    const params = new URLSearchParams(search);
    return params.get("mode") === "signup" || location === "/signup";
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const params = new URLSearchParams(search);
  const redirectTarget = params.get("redirect") || "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      setLocation(redirectTarget);
    }
  }, [isAuthenticated, redirectTarget, setLocation]);

  useEffect(() => {
    const oauthError = params.get("oauth_error");

    if (oauthError) {
      setError(oauthError);
    }
  }, [params]);

  useEffect(() => {
    setIsSignUp(params.get("mode") === "signup" || location === "/signup");
  }, [location, params]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        setError("Check your email for confirmation link!");
      } else {
        await signInWithEmail(email, password);
        await refresh();
        setLocation(redirectTarget);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    setError(null);
    try {
      await signInWithOAuth(provider);
    } catch (err: any) {
      setError(err.message || "OAuth login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">
              Sign in to access your dashboard, bookings, and favorite artists
            </p>
          </div>

          <div className="space-y-4">
            {/* OAuth Buttons */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => handleOAuthLogin("google")}
            >
              <GoogleIcon />
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => handleOAuthLogin("github")}
            >
              <GitHubIcon />
              Continue with GitHub
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {!isSignUp && (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => setLocation("/forgot-password")}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <p
                  className={`text-sm ${error.includes("Check your email") ? "text-green-600" : "text-destructive"}`}
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                <Mail className="w-4 h-4 mr-2" />
                {isLoading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setError(null);
                  setLocation(isSignUp ? "/login" : "/login?mode=signup");
                }}
              >
                {isSignUp
                  ? "Already have an account? Sign In"
                  : "Don't have an account? Sign Up"}
              </Button>
            </form>

            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy
              Policy
            </p>
          </div>

          <div className="mt-8 pt-6 border-t text-center">
            <p className="text-sm text-muted-foreground mb-4">
              New to Ink Connect?
            </p>
            <div className="space-y-2 text-sm">
              <p>✓ Save your favorite artists</p>
              <p>✓ Track your bookings</p>
              <p>✓ Leave reviews</p>
              <p>✓ Secure payment processing</p>
            </div>
          </div>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Are you a tattoo artist?{" "}
          <button
            onClick={() => setLocation("/for-artists")}
            className="text-primary hover:underline font-medium"
          >
            Join as an Artist
          </button>
        </p>
      </div>
    </div>
  );
}
