import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import HomepageFeed from "@/components/HomepageFeed";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search,
  MapPin,
  Shield,
  Star,
  CheckCircle,
  Award,
  Sparkles,
  Palette,
} from "lucide-react";

const suggestionTags = [
  "Norse mythology",
  "Tattoos for couples",
  "Fineline roses on my thigh",
  "An eagle on the chest",
  "Japanese dragon backpiece",
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setLocation(`/artists?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Value Proposition */}
      <div className="relative bg-gradient-to-br from-background via-background to-primary/5 border-b">
        <div className="container py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Find Your Perfect Tattoo Artist
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              <span className="text-primary font-semibold">Ink Connect</span> — browse portfolios, post your tattoo idea, and get bids from top-rated artists and shops
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Sparkles className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Describe your dream tattoo... AI will find matching artists"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10 h-14 text-lg"
                  />
                </div>
                <Button size="lg" onClick={handleSearch} className="h-14 px-8">
                  <Search className="w-5 h-5 mr-2" />
                  Discover
                </Button>
              </div>

              {/* Suggestion Tags */}
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {suggestionTags.map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchQuery(tag);
                      setLocation(`/artists?search=${encodeURIComponent(tag)}`);
                    }}
                    className="px-4 py-2 bg-muted hover:bg-primary/10 rounded-full text-sm transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setLocation("/artists")}
                className="text-lg px-8 py-6"
              >
                <Search className="w-5 h-5 mr-2" />
                Browse Artists
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLocation("/client/new-request")}
                className="text-lg px-8 py-6"
              >
                <MapPin className="w-5 h-5 mr-2" />
                Post a Request
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Artist CTA Strip */}
      <div className="border-b border-primary/20 bg-primary/5">
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Palette className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm md:text-base font-medium">
                <span className="text-primary font-semibold">Are you a tattoo artist?</span>{" "}
                Join free — get discovered by clients in your city.
              </p>
            </div>
            <Button
              size="sm"
              className="shrink-0 px-6"
              onClick={() => setLocation("/for-artists")}
            >
              Join as an Artist →
            </Button>
          </div>
        </div>
      </div>

      {/* Value Proposition Cards */}
      <div className="border-b bg-muted/30">
        <div className="container py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Card 1 — Hand-Picked Artists */}
            <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-background border border-border/60 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(112,255,112,0.08)] transition-all duration-300 group">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <Star className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">Hand-Picked Artists</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Every artist on Ink Connect is individually reviewed for quality, professionalism, and portfolio excellence.</p>
            </div>
            {/* Card 2 — Custom Designs */}
            <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-background border border-border/60 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(112,255,112,0.08)] transition-all duration-300 group">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">Custom Designs</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Post your idea and receive unique design concepts tailored specifically to your vision from multiple artists.</p>
            </div>
            {/* Card 3 — Safe & Sanitary Studios */}
            <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-background border border-border/60 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(112,255,112,0.08)] transition-all duration-300 group">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">Safe &amp; Sanitary Studios</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">All listed studios follow strict health and safety standards, so you can focus on your art, not your safety.</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get your dream tattoo in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="p-8 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">1. Post Your Idea</h3>
            <p className="text-muted-foreground">
              Describe your desired tattoo, upload reference images, and set
              your budget.
            </p>
          </Card>

          <Card className="p-8 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">2. Receive Artist Bids</h3>
            <p className="text-muted-foreground">
              Interested artists review your idea and send you personalised bids — compare portfolios, styles, and prices.
            </p>
          </Card>

          <Card className="p-8 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">3. Book &amp; Get Inked</h3>
            <p className="text-muted-foreground">
              Pick your favourite artist, confirm the appointment, and walk out with the tattoo of your dreams.
            </p>
          </Card>
        </div>
      </div>

      {/* Latest Tattoo Requests */}
      <div className="container py-20 border-t">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Latest Tattoo Requests
          </h2>
          <p className="text-xl text-muted-foreground">
            Browse ideas from the community or{" "}
            <button
              onClick={() => setLocation("/client/new-request")}
              className="text-primary hover:underline font-medium"
            >
              post your own request
            </button>{" "}
            to get bids from artists.
          </p>
        </div>

        <HomepageFeed />
      </div>

      {/* Why Choose Us Section */}
      <div className="bg-muted/30 border-y">
        <div className="container py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose Ink Connect
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The trusted platform for finding and booking tattoo artists and shops
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Verified Artists</h3>
              <p className="text-sm text-muted-foreground">
                All artists are verified and background-checked for your safety
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Verified Reviews</h3>
              <p className="text-sm text-muted-foreground">
                Read authentic reviews from customers with verified bookings
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Secure Payments</h3>
              <p className="text-sm text-muted-foreground">
                SSL encrypted payments with full PCI compliance protection
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Quality Guarantee</h3>
              <p className="text-sm text-muted-foreground">
                Top-rated artists with proven portfolios and experience
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container py-20">
        <Card className="p-12 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Your Dream Tattoo?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Post your idea, get bids from hand-picked artists, and book the
            tattoo you've always imagined — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => setLocation("/artists")}
              className="text-lg px-8"
            >
              Browse Artists
            </Button>
            {!isAuthenticated && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLocation("/signup")}
                className="text-lg px-8"
              >
                Sign Up Free
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">About</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-primary">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/for-artists" className="hover:text-primary">
                    For Artists
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-primary">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/help" className="hover:text-primary">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-primary">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cancellation-policy"
                    className="hover:text-primary"
                  >
                    Cancellation Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/terms-of-service" className="hover:text-primary">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="hover:text-primary">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-service" className="hover:text-primary">
                    Platform Disclaimer
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Secure Payments</h3>
              <p className="text-sm text-muted-foreground mb-4">
                All transactions are encrypted and PCI compliant
              </p>
              <div className="flex gap-2">
                <div className="px-3 py-2 bg-background border rounded text-xs font-semibold">
                  VISA
                </div>
                <div className="px-3 py-2 bg-background border rounded text-xs font-semibold">
                  MC
                </div>
                <div className="px-3 py-2 bg-background border rounded text-xs font-semibold">
                  AMEX
                </div>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Ink Connect. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
