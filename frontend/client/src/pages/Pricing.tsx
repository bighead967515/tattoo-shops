import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, Crown, Zap } from "lucide-react";
import { Link } from "wouter";

export default function Pricing() {
  const features = [
    {
      name: "Portfolio Photos",
      free: "3 photos maximum",
      premium: "Unlimited photos & videos",
      icon: "📸",
    },
    {
      name: "Profile Visibility",
      free: "Basic listing only",
      premium: "Featured artist + higher search ranking",
      icon: "⭐",
    },
    {
      name: "Booking & Scheduling",
      free: "Display only (disabled)",
      premium: "Real-time booking & calendar sync",
      icon: "📅",
    },
    {
      name: "Direct Contact",
      free: "Form only (no direct info)",
      premium: "Display phone number & email",
      icon: "📞",
    },
    {
      name: "Client Reviews",
      free: "Display only, no responses",
      premium: "Respond to reviews & build trust",
      icon: "💬",
    },
    {
      name: "Analytics & Leads",
      free: "None",
      premium: "Booking funnel metrics & lead reports",
      icon: "📊",
    },
    {
      name: "Shop Location",
      free: "General city/neighborhood",
      premium: "Exact map location & directions",
      icon: "📍",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container text-center">
            <h1 className="text-5xl font-bold mb-6">
              Choose Your <span className="text-primary">Artist Plan</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
              Start with a free basic listing or upgrade to premium to unlock bookings, direct client contact, and advanced features that drive revenue.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-16 container">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <Card className="p-8 border-2 border-border">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Basic Listing</h2>
                <div className="text-5xl font-bold mb-4">
                  $0<span className="text-2xl text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground">
                  Get started with a free profile
                </p>
              </div>

              <Link href="/for-artists">
                <Button variant="outline" className="w-full mb-8">
                  Get Started Free
                </Button>
              </Link>

              <div className="space-y-4">
                {features.map((feature) => (
                  <div key={feature.name} className="flex items-start gap-3">
                    <span className="text-2xl">{feature.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{feature.name}</div>
                      <div className="text-sm text-muted-foreground">{feature.free}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Premium Tier */}
            <Card className="p-8 border-2 border-primary bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  POPULAR
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">Premium Artist</h2>
                <div className="text-5xl font-bold mb-4 text-primary">
                  $49<span className="text-2xl text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground">
                  Unlock all features & grow your business
                </p>
              </div>

              <Button className="w-full mb-8 group">
                <Zap className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                Upgrade to Premium
              </Button>

              <div className="space-y-4">
                {features.map((feature) => (
                  <div key={feature.name} className="flex items-start gap-3">
                    <span className="text-2xl">{feature.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{feature.name}</div>
                      <div className="text-sm text-primary font-medium">{feature.premium}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">Detailed Feature Comparison</h2>
            
            <div className="max-w-4xl mx-auto bg-card rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 font-semibold">Feature</th>
                    <th className="text-center p-4 font-semibold">Basic Listing</th>
                    <th className="text-center p-4 font-semibold text-primary">Premium Artist</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <tr key={feature.name} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                      <td className="p-4 font-medium">{feature.name}</td>
                      <td className="p-4 text-center text-sm text-muted-foreground">{feature.free}</td>
                      <td className="p-4 text-center text-sm text-primary font-medium">{feature.premium}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20">
          <div className="container text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Grow Your Tattoo Business?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Join hundreds of professional tattoo artists who are booking more clients and growing their revenue with Universal Inc Premium.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/for-artists">
                <Button variant="outline" size="lg">
                  Start Free
                </Button>
              </Link>
              <Button size="lg" className="group">
                <Crown className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                Upgrade to Premium
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
