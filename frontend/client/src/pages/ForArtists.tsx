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
            Tattoo artists wanted
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Find clients who are actively looking for
            <span className="text-primary"> unique tattoo projects.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ink Connect helps artists of all styles attract better-fit clients and respond to requests with clear project details.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Button
              size="lg"
              className="w-full text-lg px-10 py-6 shadow-lg shadow-primary/20 sm:w-auto"
              onClick={() => setLocation("/artist/signup")}
            >
              Join as a tattoo artist
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
                Clients submit structured tattoo requests so you can focus on finding and responding to projects that match your style.
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
                Show portfolio proof, communicate your process clearly, and build trust with clients who care about quality tattoo results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Elite Icon Sponsorship Spotlight */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-4 py-1 text-sm bg-primary/20 text-primary border-primary/30 animate-pulse">
              🏆 Premium Sponsorship Available
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Become an Elite Icon Artist
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get the ultimate exposure, the lowest transaction fees, and dominate the local market.
            </p>
          </div>

          <Card className="p-8 md:p-12 border-primary/40 bg-background/80 backdrop-blur-md shadow-2xl shadow-primary/10 hover:border-primary transition-all duration-300">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-5">
                {[
                  { icon: Star, text: "Elite Homepage Spotlight placement" },
                  { icon: DollarSign, text: "Lowest platform rate: just 3% transaction fee" },
                  { icon: Zap, text: "Unlimited AI Tattoo Design Studio credits" },
                  { icon: Award, text: "Exclusive Elite Icon profile styling & badge" },
                  { icon: Shield, text: "24/7 dedicated VIP concierge support" },
                  { icon: Calendar, text: "Full custom scheduling & booking calendar" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm md:text-base font-medium">{text}</p>
                  </div>
                ))}
              </div>
              <div className="text-center space-y-6">
                <div className="inline-block p-6 rounded-2xl bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-2">Elite Icon Sponsorship</p>
                  <p className="text-5xl font-extrabold text-primary">$99<span className="text-xl text-muted-foreground font-normal">/mo</span></p>
                  <p className="text-xs text-primary font-semibold mt-3">Maximizes local visibility & profile traffic</p>
                </div>
                <Button
                  size="lg"
                  className="w-full text-lg py-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/25"
                  onClick={() => setLocation("/artist/signup")}
                >
                  Apply for Elite Icon
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  Upgrade your account to minimize fees and maximize bookings.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* What You Get (Tier Comparison) */}
      <section className="py-20 border-b">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Flexible Plans for Every Studio</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free */}
            <Card className="p-6 border-border/60 flex flex-col justify-between hover:border-border transition-all duration-300">
              <div>
                <h3 className="font-bold text-lg mb-1 text-muted-foreground">Free</h3>
                <p className="text-xs text-muted-foreground mb-4">Start your online footprint</p>
                <p className="text-3xl font-bold mb-6">$0<span className="text-base font-normal text-muted-foreground">/mo</span></p>
                <ul className="space-y-3 text-xs mb-6">
                  {["10 portfolio photos", "Appear in directory", "Basic profile tags", "Standard support"].map(f => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button variant="outline" className="w-full mt-auto" onClick={() => setLocation("/artist/signup")}>Get Started</Button>
            </Card>

            {/* Pro */}
            <Card className="p-6 border-primary/50 bg-primary/5 relative flex flex-col justify-between shadow-md hover:border-primary hover:shadow-xl transition-all duration-300">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-0.5 text-xs font-semibold">
                👑 Founding Offer
              </Badge>
              <div>
                <h3 className="font-bold text-lg mb-1 text-primary">Pro Studio</h3>
                <p className="text-xs text-muted-foreground mb-4">First 50 Artists Only</p>
                <p className="text-3xl font-bold mb-1">$19<span className="text-base font-normal text-muted-foreground">/mo</span></p>
                <p className="text-xs text-green-600 font-semibold mb-4">or $9.99/mo billed annually (3-Month Trial)</p>
                <ul className="space-y-3 text-xs mb-6">
                  {[
                    "5% platform transaction fee",
                    "Unlimited portfolio uploads",
                    "Booking calendar + deposits",
                    "50 AI generations/mo",
                    "Verified Artist badge",
                    "Client messaging tools",
                    "Analytics dashboard",
                  ].map(f => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button className="w-full mt-auto bg-emerald-600 hover:bg-emerald-700 text-white border-0" onClick={() => setLocation("/artist/signup")}>Claim Founding Offer</Button>
            </Card>

            {/* Elite */}
            <Card className="p-6 border-accent bg-accent/5 relative flex flex-col justify-between shadow-lg hover:border-accent hover:shadow-2xl transition-all duration-300">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-0.5 text-xs font-semibold">
                Best Value
              </Badge>
              <div>
                <h3 className="font-bold text-lg mb-1 text-accent">Elite Icon</h3>
                <p className="text-xs text-muted-foreground mb-4">Ultimate visibility & tools</p>
                <p className="text-3xl font-bold mb-6">$99<span className="text-base font-normal text-muted-foreground">/mo</span></p>
                <ul className="space-y-3 text-xs mb-6">
                  {[
                    "3% platform transaction fee",
                    "Homepage feature placement",
                    "Unlimited AI generations",
                    "Unlimited portfolio uploads",
                    "Verified Premium badge",
                    "VIP concierge support",
                    "Full booking calendar",
                  ].map(f => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Button className="w-full mt-auto bg-accent hover:bg-accent/90 text-accent-foreground font-bold" onClick={() => setLocation("/artist/signup")}>Get Elite Icon</Button>
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
          <h2 className="text-4xl font-bold">Ready to win more tattoo projects?</h2>
          <p className="text-xl text-muted-foreground">
            Join Ink Connect and connect with clients who are actively requesting custom tattoos.
          </p>
          <Button
            size="lg"
            className="w-full text-lg px-12 py-6 shadow-lg shadow-primary/20 sm:w-auto"
            onClick={() => setLocation("/artist/signup")}
          >
            Join as a tattoo artist
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
