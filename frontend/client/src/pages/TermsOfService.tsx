import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { FileText, User, Shield, AlertTriangle } from "lucide-react";

const POLICY_LAST_UPDATED = new Date("2024-03-01");

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-lg text-muted-foreground mb-12">
          Last updated:{" "}
          {POLICY_LAST_UPDATED.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <Card className="p-8 mb-8 bg-primary/5 border-primary/20">
          <h2 className="text-2xl font-semibold mb-4">
            Welcome to Ink Connect.
          </h2>
          <p className="text-muted-foreground">
            These Terms of Service ("Terms") govern your access to and use of
            the Ink Connect website, services, and applications
            (collectively, the "Service"). Please read them carefully.
          </p>
        </Card>

        <div className="space-y-8">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  1. Acceptance of Terms
                </h3>
                <p className="text-muted-foreground">
                  By accessing or using our Service, you agree to be bound by
                  these Terms and our Privacy Policy. If you do not agree to
                  these Terms, you may not use the Service.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">2. User Accounts</h3>
                <p className="text-muted-foreground mb-3">
                  To access certain features, you must create an account. You
                  are responsible for safeguarding your account details and for
                  all activities that occur under your account. You must be at
                  least 18 years old to use our platform to book an appointment.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  3. Content and Conduct
                </h3>
                <p className="text-muted-foreground mb-3">
                  You are responsible for any content you post. You agree not to
                  post content that is illegal, offensive, or infringes on the
                  rights of others. We reserve the right to remove any content
                  that violates these terms.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  4. Disclaimers and Limitation of Liability
                </h3>
                <p className="text-muted-foreground mb-3">
                  The Service is provided "as is." Ink Connect makes no
                  warranties regarding the service and is not liable for any
                  damages arising from your use of the service. We are a
                  platform that connects clients with tattoo artists; we do not
                  employ the artists and are not responsible for the services
                  they provide.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-8 mt-8 bg-muted/30">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms, please contact us at{" "}
              <a
                href="mailto:legal@inkconnect.pro"
                className="text-primary hover:underline"
              >
                legal@inkconnect.pro
              </a>
              .
            </p>
          </Card>
        </div>
      </div>

      <footer className="border-t bg-muted/30 mt-16">
        <div className="container py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} Ink Connect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
