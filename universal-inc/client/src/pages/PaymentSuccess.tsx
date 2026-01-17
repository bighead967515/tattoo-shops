import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Header from "@/components/Header";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container flex items-center justify-center py-20">
        <Card className="p-12 max-w-lg text-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
          
          <p className="text-muted-foreground mb-8">
            Your booking deposit has been processed successfully. The artist will review your request and contact you shortly to confirm your appointment details.
          </p>

          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={() => setLocation("/dashboard")}
            >
              View My Bookings
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
            <p>A confirmation email has been sent to your email address.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
