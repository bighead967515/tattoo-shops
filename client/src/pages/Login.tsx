import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogIn, ArrowLeft } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [loading, isAuthenticated, setLocation]);

  const handleLogin = () => {
    window.location.href = getLoginUrl();
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
            <Button
              size="lg"
              className="w-full"
              onClick={handleLogin}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In / Sign Up
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy
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
