import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Users,
  DollarSign,
  Star,
  Zap,
  Award,
  TrendingUp,
  ArrowRight,
  Palette,
  Calendar,
  Shield,
} from "lucide-react";

const STYLE_TAGS = [
  "Traditional",
  "Fineline",
  "Japanese",
  "Blackwork",
  "Realism",
  "Geometric",
  "Watercolor",
  "Neo-Traditional",
  "Dotwork",
  "Tribal",
];

export default function ForArtists() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-background via-background to-primary/10 border-b py-24">
        <div className="container max-w-5xl mx-auto text-center space-y-6 px-4">
          <Badge className="mb-2 px-4 py-1 text-sm bg-primary/20 text-primary border-primary/30">
            Cover-up specialists wanted
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Find clients who are actively looking for
            <span className="text-primary"> cover-ups and reworks.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ink Connect helps artists who do complex cover-up work attract better-fit clients and respond to requests with clear project details.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Button
              size="lg"
              className="w-full text-lg px-10 py-6 shadow-lg shadow-primary/20 sm:w-auto"
              onClick={() => setLocation("/artist/register")}
            >
              Join as a cover-up artist
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full text-lg px-10 py-6 sm:w-auto"
              onClick={() => setLocation("/artists")}
            >
              See Artist Directory
            </Button>
          </div>
          <p className="text-sm text-muted-foreground pt-2">
            Build trust with better-fit requests and clearer client intent.
          </p>
        </div>
      </section>

      {/* 3 Core Value Props */}
      <section className="py-16 border-b">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-muted/30 border border-border/60 hover:border-primary/40 transition-all group">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">Clients Come to You</h3>
              <p className="text-sm text-muted-foreground">
                Clients submit structured cover-up requests so you can focus on finding and responding to projects that match your style.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-muted/30 border border-border/60 hover:border-primary/40 transition-all group">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <DollarSign className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">Get Paid Securely</h3>
              <p className="text-sm text-muted-foreground">
                Use built-in booking and payment tools so clients can move from request to confirmed work with less friction.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-muted/30 border border-border/60 hover:border-primary/40 transition-all group">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <TrendingUp className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">Build Your Reputation</h3>
              <p className="text-sm text-muted-foreground">
                Show portfolio proof, communicate your process clearly, and build trust with clients who care about cover-up results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Founding Artist Offer */}
      <section className="py-20 bg-primary/5 border-b">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-4 py-1 text-sm bg-primary/20 text-primary border-primary/30">
              Limited Time Offer
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              The Founding Artist Offer
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Early artists can unlock long-term pricing and extra visibility perks.
            </p>
          </div>

          <Card className="p-8 md:p-12 border-primary/30 bg-background shadow-lg shadow-primary/5">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-5">
                {[
                  { icon: Zap, text: "6 months of Pro access — completely free" },
                  { icon: Award, text: "Founding Artist badge on your profile" },
                  { icon: DollarSign, text: "Locked-in rate: $19/mo after trial (vs. $29 regular)" },
                  { icon: Star, text: "Priority placement in search results" },
                  { icon: Shield, text: "Early access to new features before public launch" },
                  { icon: Calendar, text: "Dedicated onboarding call with our team" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm md:text-base">{text}</p>
                  </div>
                ))}
              </div>
              <div className="text-center space-y-6">
                <div className="inline-block">
                  <p className="text-sm text-muted-foreground mb-1">Regular price after launch</p>
                  <p className="text-2xl font-bold line-through text-muted-foreground">$29/month</p>
                  <p className="text-sm text-muted-foreground mt-3 mb-1">Your locked-in Founding Artist rate</p>
                  <p className="text-5xl font-bold text-primary">$19<span className="text-xl text-muted-foreground">/mo</span></p>
                  <p className="text-sm text-primary font-medium mt-2">After your 6-month free trial</p>
                </div>
                <Button
                  size="lg"
                  className="w-full text-lg py-6 shadow-lg shadow-primary/20"
                  onClick={() => setLocation("/artist/register")}
                >
                  Join as a cover-up artist
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  No credit card required to start. Cancel anytime.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* What You Get (Tier Comparison) */}
      <section className="py-20 border-b">
        <div className="container max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What's Included</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <Card className="p-6 border-border/60">
              <h3 className="font-bold text-lg mb-1">Free</h3>
              <p className="text-sm text-muted-foreground mb-5">Get started, no commitment</p>
              <p className="text-3xl font-bold mb-6">$0<span className="text-base font-normal text-muted-foreground">/mo</span></p>
              <ul className="space-y-3 text-sm">
                {["Public portfolio page", "Appear in directory", "Receive client inquiries", "Basic profile + style tags"].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </Card>
            {/* Pro */}
            <Card className="p-6 border-primary/50 bg-primary/5 relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4">
                Most Popular
              </Badge>
              <h3 className="font-bold text-lg mb-1">Pro</h3>
              <p className="text-sm text-muted-foreground mb-5">For working artists</p>
              <p className="text-3xl font-bold mb-6">$29<span className="text-base font-normal text-muted-foreground">/mo</span></p>
              <ul className="space-y-3 text-sm">
                {[
                  "Everything in Free",
                  "Unlimited portfolio uploads",
                  "Access to bidding system",
                  "Booking calendar + deposits",
                  "Verified Artist badge",
                  "Client messaging tools",
                  "Analytics dashboard",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </Card>
            {/* Pay-as-you-go */}
            <Card className="p-6 border-border/60">
              <h3 className="font-bold text-lg mb-1">Pay-as-you-go</h3>
              <p className="text-sm text-muted-foreground mb-5">No subscription needed</p>
              <p className="text-3xl font-bold mb-6">10%<span className="text-base font-normal text-muted-foreground"> per bid</span></p>
              <ul className="space-y-3 text-sm">
                {[
                  "Everything in Free",
                  "Bidding access",
                  "10% platform fee on accepted bids",
                  "No monthly commitment",
                ].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Style Tags — social proof of platform breadth */}
      <section className="py-16 border-b bg-muted/20">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">All Styles Welcome</h2>
          <p className="text-muted-foreground mb-8">
            Clients search by style — make sure yours is represented.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {STYLE_TAGS.map(tag => (
              <span
                key={tag}
                className="px-4 py-2 rounded-full bg-background border border-border/60 text-sm font-medium hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="container max-w-3xl mx-auto px-4 text-center space-y-6">
          <Palette className="w-12 h-12 text-primary mx-auto" />
          <h2 className="text-4xl font-bold">Ready to win more cover-up projects?</h2>
          <p className="text-xl text-muted-foreground">
            Join Ink Connect and connect with clients who are actively requesting cover-up and rework work.
          </p>
          <Button
            size="lg"
            className="w-full text-lg px-12 py-6 shadow-lg shadow-primary/20 sm:w-auto"
            onClick={() => setLocation("/artist/register")}
          >
            Join as a cover-up artist
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => setLocation("/login")}
              className="text-primary hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Ink Connect. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="/terms-of-service" className="hover:text-primary">Terms</a>
            <a href="/privacy-policy" className="hover:text-primary">Privacy</a>
            <a href="/cancellation-policy" className="hover:text-primary">Cancellation Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
