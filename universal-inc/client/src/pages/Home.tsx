import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import Header from "@/components/Header";
import TattooCard from "@/components/TattooCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Calendar, Shield, Star, CheckCircle, Award } from "lucide-react";

const tattooData = [
  { id: 1, image: "/tattoo-1.jpg", artistName: "Sarah Mitchell", artistInitials: "SM", location: "Ink Studio, New York", rating: 5, reviewCount: 124 },
  { id: 2, image: "/tattoo-2.jpg", artistName: "Kenji Tanaka", artistInitials: "KT", location: "Dragon Art Tattoo, Tokyo", rating: 5, reviewCount: 89 },
  { id: 3, image: "/tattoo-3.jpg", artistName: "Maya Rodriguez", artistInitials: "MR", location: "Sacred Geometry Studio, LA", rating: 5, reviewCount: 156 },
  { id: 4, image: "/tattoo-4.jpg", artistName: "Emma Laurent", artistInitials: "EL", location: "Fine Line Collective, Paris", rating: 5, reviewCount: 203 },
  { id: 5, image: "/tattoo-5.jpg", artistName: "Marcus Stone", artistInitials: "MS", location: "Traditional Ink, Chicago", rating: 5, reviewCount: 78 },
  { id: 6, image: "/tattoo-6.jpg", artistName: "Luna Chen", artistInitials: "LC", location: "Watercolor Dreams, San Francisco", rating: 4, reviewCount: 92 },
  { id: 7, image: "/tattoo-7.jpg", artistName: "Alex Rivers", artistInitials: "AR", location: "Minimalist Ink, Portland", rating: 5, reviewCount: 67 },
  { id: 8, image: "/tattoo-8.jpg", artistName: "Viktor Novak", artistInitials: "VN", location: "Neo Traditional Studio, Prague", rating: 5, reviewCount: 145 },
  { id: 9, image: "/tattoo-9.jpg", artistName: "Aria Patel", artistInitials: "AP", location: "Dotwork Gallery, London", rating: 5, reviewCount: 112 },
  { id: 10, image: "/tattoo-10.jpg", artistName: "Kai Makani", artistInitials: "KM", location: "Tribal Arts, Honolulu", rating: 5, reviewCount: 98 },
  { id: 11, image: "/tattoo-11.jpg", artistName: "Isabella Rossi", artistInitials: "IR", location: "Realism Masters, Milan", rating: 5, reviewCount: 187 },
  { id: 12, image: "/tattoo-12.jpg", artistName: "Yuki Nakamura", artistInitials: "YN", location: "Kawaii Ink, Osaka", rating: 4, reviewCount: 76 },
];

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
      <Header />

      {/* Hero Section with Value Proposition */}
      <div className="relative bg-gradient-to-br from-background via-background to-primary/5 border-b">
        <div className="container py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Find Your Perfect Tattoo Artist
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Browse portfolios, read verified reviews, and book appointments with top-rated tattoo artists in your area
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search by style, artist, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10 h-14 text-lg"
                  />
                </div>
                <Button size="lg" onClick={handleSearch} className="h-14 px-8">
                  Search
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
              <Button size="lg" onClick={() => setLocation("/artists")} className="text-lg px-8 py-6">
                <Search className="w-5 h-5 mr-2" />
                Browse Artists
              </Button>
              <Button size="lg" variant="outline" onClick={() => setLocation("/artist-finder")} className="text-lg px-8 py-6">
                <MapPin className="w-5 h-5 mr-2" />
                Find Near Me
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="border-b bg-muted/30">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Verified Artists</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <div className="text-sm text-muted-foreground">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">4.9</div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">Secure Payments</div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Book your next tattoo in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="p-8 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">1. Browse & Filter</h3>
            <p className="text-muted-foreground">
              Search by style, location, or rating. View portfolios and read verified reviews from real customers.
            </p>
          </Card>

          <Card className="p-8 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">2. Book Appointment</h3>
            <p className="text-muted-foreground">
              Choose your preferred date and time. Secure your spot with a $50 deposit paid safely online.
            </p>
          </Card>

          <Card className="p-8 text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">3. Get Your Tattoo</h3>
            <p className="text-muted-foreground">
              Receive confirmation and reminders. Show up and get the tattoo of your dreams from a verified artist.
            </p>
          </Card>
        </div>
      </div>

      {/* Featured Tattoos Gallery */}
      <div className="container py-20 border-t">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Explore Tattoos</h2>
          <p className="text-xl text-muted-foreground">
            Find your next tattoo inspiration with our extensive collection of designs and styles. Browse through curated galleries and{" "}
            <button
              onClick={() => setLocation("/artist-finder")}
              className="text-primary hover:underline font-medium"
            >
              book an appointment
            </button>{" "}
            with a talented artist to bring your idea to life.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {tattooData.map((tattoo) => (
            <TattooCard key={tattoo.id} {...tattoo} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" onClick={() => setLocation("/artists")} className="px-8">
            View All Artists
          </Button>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="bg-muted/30 border-y">
        <div className="container py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Universal Inc</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The trusted platform for finding and booking tattoo artists
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Your Dream Tattoo?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who found their perfect artist on Universal Inc
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setLocation("/artists")} className="text-lg px-8">
              Browse Artists
            </Button>
            {!isAuthenticated && (
              <Button size="lg" variant="outline" onClick={() => setLocation("/login")} className="text-lg px-8">
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
                <li><button onClick={() => setLocation("/about")} className="hover:text-primary">About Us</button></li>
                <li><button onClick={() => setLocation("/for-artists")} className="hover:text-primary">For Artists</button></li>
                <li><button onClick={() => setLocation("/contact")} className="hover:text-primary">Contact</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => setLocation("/help")} className="hover:text-primary">Help Center</button></li>
                <li><button onClick={() => setLocation("/faq")} className="hover:text-primary">FAQ</button></li>
                <li><button onClick={() => setLocation("/cancellation-policy")} className="hover:text-primary">Cancellation Policy</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => setLocation("/terms")} className="hover:text-primary">Terms of Service</button></li>
                <li><button onClick={() => setLocation("/privacy")} className="hover:text-primary">Privacy Policy</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Secure Payments</h3>
              <p className="text-sm text-muted-foreground mb-4">
                All transactions are encrypted and PCI compliant
              </p>
              <div className="flex gap-2">
                <div className="px-3 py-2 bg-background border rounded text-xs font-semibold">VISA</div>
                <div className="px-3 py-2 bg-background border rounded text-xs font-semibold">MC</div>
                <div className="px-3 py-2 bg-background border rounded text-xs font-semibold">AMEX</div>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2024 Universal Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
