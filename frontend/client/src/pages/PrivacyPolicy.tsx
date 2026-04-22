import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Shield, Lock, Eye, Server } from "lucide-react";

const POLICY_LAST_UPDATED = new Date("2024-04-22");

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
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
            Your Privacy Matters to Us
          </h2>
          <p className="text-muted-foreground">
            This Privacy Policy explains how Ink Connect ("we", "us", or "our") collects, uses, discloses, and safeguards your information when you visit our website or use our application. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
          </p>
        </Card>

        <div className="space-y-8">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  1. Information We Collect
                </h3>
                <p className="text-muted-foreground mb-3">
                  We may collect information about you in a variety of ways. The information we may collect via the Service includes:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email address, and telephone number, and demographic information that you voluntarily give to us when you register with the Service.</li>
                  <li><strong>Tattoo Requests & Portfolio Data:</strong> Images, descriptions, and details of tattoo ideas submitted by clients, and portfolio images uploaded by artists.</li>
                  <li><strong>Financial Data:</strong> Financial information related to your payment method (e.g., valid credit card number, card brand, expiration date) is processed by our payment processor (Stripe). We do not store full credit card numbers on our servers.</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Server className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">2. Use of Your Information</h3>
                <p className="text-muted-foreground mb-3">
                  Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Service to:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>Create and manage your account.</li>
                  <li>Facilitate connections and bidding between clients and tattoo artists.</li>
                  <li>Process payments and refunds.</li>
                  <li>Deliver targeted advertising, newsletters, and other information regarding promotions and the Service to you.</li>
                  <li>Improve our AI bid assistant and image processing features.</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  3. Disclosure of Your Information
                </h3>
                <p className="text-muted-foreground mb-3">
                  We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others.</li>
                  <li><strong>Interactions with Other Users:</strong> If you interact with other users of the Service, those users may see your name, profile photo, and descriptions of your activity (e.g., tattoo requests, bids, reviews).</li>
                  <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  4. Security of Your Information
                </h3>
                <p className="text-muted-foreground mb-3">
                  We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-8 mt-8 bg-muted/30">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions or comments about this Privacy Policy, please contact us at{" "}
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
