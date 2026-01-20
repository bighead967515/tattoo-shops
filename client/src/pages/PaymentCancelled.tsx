import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import Header from "@/components/Header";

export default function PaymentCancelled() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container flex items-center justify-center py-20">
        <Card className="p-12 max-w-lg text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Payment Cancelled</h1>
          
          <p className="text-muted-foreground mb-8">
            Your payment was cancelled. No charges have been made to your account. You can try booking again when you're ready.
          </p>

          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={() => setLocation("/artist-finder")}
            >
              Find Artists
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/")}
            >
              Back to Home
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t text-sm text-muted-foreground">
            <p>Need help? Contact our support team.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
