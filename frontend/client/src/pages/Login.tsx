import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, ArrowLeft, Mail } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const { signInWithEmail, signUpWithEmail, signInWithOAuth } =
    useSupabaseAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [loading, isAuthenticated, setLocation]);

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
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    try {
      await signInWithOAuth(provider);
    } catch (err: any) {
      setError(err.message || "OAuth login failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

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
              <FcGoogle className="w-5 h-5 mr-2" />
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => handleOAuthLogin("github")}
            >
              <FaGithub className="w-5 h-5 mr-2" />
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
                <Label htmlFor="password">Password</Label>
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
                  setIsSignUp(!isSignUp);
                  setError(null);
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
              New to Universal Inc?
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
