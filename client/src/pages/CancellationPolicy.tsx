import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";

export default function CancellationPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">Cancellation Policy</h1>
        <p className="text-lg text-muted-foreground mb-12">
          Last updated: January 2024
        </p>

        {/* Policy Overview */}
        <Card className="p-8 mb-8 bg-primary/5 border-primary/20">
          <h2 className="text-2xl font-semibold mb-4">Policy Overview</h2>
          <p className="text-muted-foreground mb-4">
            We understand that plans change. Our cancellation policy is designed to be fair to both customers and artists while respecting everyone's time and commitment.
          </p>
          <p className="text-muted-foreground">
            All bookings require a <strong>$50 deposit</strong> to secure your appointment. This deposit is deducted from your final tattoo cost.
          </p>
        </Card>

        {/* Cancellation Terms */}
        <div className="space-y-6 mb-12">
          <h2 className="text-2xl font-semibold">Cancellation Terms</h2>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">48+ Hours Before Appointment</h3>
                <p className="text-muted-foreground mb-3">
                  Cancellations made 48 hours or more before your scheduled appointment receive a <strong>full refund</strong> of the $50 deposit.
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>100% deposit refund</li>
                  <li>No cancellation fee</li>
                  <li>Refund processed within 5-7 business days</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">24-48 Hours Before Appointment</h3>
                <p className="text-muted-foreground mb-3">
                  Cancellations made between 24-48 hours before your appointment receive a <strong>50% refund</strong> of the deposit.
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>50% deposit refund ($25)</li>
                  <li>$25 cancellation fee retained</li>
                  <li>Refund processed within 5-7 business days</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Less Than 24 Hours Before Appointment</h3>
                <p className="text-muted-foreground mb-3">
                  Cancellations made less than 24 hours before your appointment or no-shows result in <strong>forfeiture of the full deposit</strong>.
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>No refund issued</li>
                  <li>Full $50 deposit retained</li>
                  <li>Artists reserve the right to decline future bookings</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Rescheduling */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Rescheduling Policy</h2>
          
          <Card className="p-6 mb-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Free Rescheduling</h3>
                <p className="text-muted-foreground">
                  You may reschedule your appointment <strong>once for free</strong> if done 48+ hours in advance. Contact your artist through your dashboard or their profile page to request a new date and time.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Additional Reschedules</h3>
                <p className="text-muted-foreground">
                  Additional reschedule requests may incur a $25 rescheduling fee at the artist's discretion. Late reschedules (less than 48 hours) follow the same policy as cancellations.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Special Circumstances */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Special Circumstances</h2>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3">Emergency Situations</h3>
            <p className="text-muted-foreground mb-4">
              We understand that emergencies happen. In cases of documented emergencies (medical, family, etc.), please contact our support team at <a href="mailto:support@universalinc.com" className="text-primary hover:underline">support@universalinc.com</a> with relevant documentation.
            </p>
            <p className="text-muted-foreground">
              Each case is reviewed individually, and we may offer exceptions to our standard policy on a case-by-case basis.
            </p>
          </Card>
        </div>

        {/* Artist Cancellations */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Artist-Initiated Cancellations</h2>
          
          <Card className="p-6">
            <p className="text-muted-foreground mb-4">
              If an artist needs to cancel your appointment for any reason, you will receive:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Full refund</strong> of your deposit</li>
              <li><strong>Priority rebooking</strong> with the same artist</li>
              <li><strong>$25 credit</strong> toward your next booking if rescheduling is not possible</li>
            </ul>
          </Card>
        </div>

        {/* How to Cancel */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">How to Cancel or Reschedule</h2>
          
          <Card className="p-6">
            <ol className="list-decimal list-inside text-muted-foreground space-y-3">
              <li>Log in to your account and go to your <strong>Dashboard</strong></li>
              <li>Find your booking under <strong>"Upcoming Appointments"</strong></li>
              <li>Click <strong>"Cancel"</strong> or <strong>"Reschedule"</strong></li>
              <li>Confirm your cancellation or select a new date/time</li>
              <li>You'll receive a confirmation email within minutes</li>
            </ol>
            <p className="text-muted-foreground mt-4">
              Alternatively, you can contact the artist directly through their profile page or reach out to our support team for assistance.
            </p>
          </Card>
        </div>

        {/* Contact */}
        <Card className="p-8 bg-muted/30">
          <h2 className="text-2xl font-semibold mb-4">Questions?</h2>
          <p className="text-muted-foreground mb-4">
            If you have questions about our cancellation policy or need assistance with a booking, please contact us:
          </p>
          <ul className="text-muted-foreground space-y-2">
            <li><strong>Email:</strong> <a href="mailto:support@universalinc.com" className="text-primary hover:underline">support@universalinc.com</a></li>
            <li><strong>Phone:</strong> <a href="tel:1-800-828-8661" className="text-primary hover:underline">1-800-TATTOO-1</a></li>
            <li><strong>Live Chat:</strong> Available on our Help Center page</li>
          </ul>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 Universal Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
