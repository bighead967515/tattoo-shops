import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MapPin, Star, ExternalLink, Phone, Mail } from "lucide-react";
import { loadTattooShops, parseRating, getInitials, type TattooShop } from "@/lib/tattooShops";
import BookingDialog from "@/components/BookingDialog";

export default function ArtistFinder() {
  const [shops, setShops] = useState<TattooShop[]>([]);
  const [filteredShops, setFilteredShops] = useState<TattooShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState("");
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<TattooShop | null>(null);

  useEffect(() => {
    async function loadShops() {
      try {
        const loadedShops = await loadTattooShops();
        setShops(loadedShops);
        setFilteredShops(loadedShops);
      } catch (error) {
        console.error('Error loading tattoo shops:', error);
      } finally {
        setLoading(false);
      }
    }
    loadShops();
  }, []);

  const handleSearch = () => {
    if (!searchCity.trim()) {
      setFilteredShops(shops);
      return;
    }

    const filtered = shops.filter(shop => 
      shop.city.toLowerCase().includes(searchCity.toLowerCase()) ||
      shop.name.toLowerCase().includes(searchCity.toLowerCase())
    );
    
    setFilteredShops(filtered);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">Find Tattoo Artists Near You</h1>
          <p className="text-muted-foreground mb-8">
            Discover talented tattoo artists and shops across Louisiana
          </p>

          {/* Search Bar */}
          <div className="flex gap-3 mb-8">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by city or shop name (e.g., New Orleans, Baton Rouge)"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-12 bg-card border-border text-foreground"
              />
            </div>
            <Button onClick={handleSearch} className="h-12 px-8">Search</Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading tattoo shops...</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {/* Shop List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">
                    {filteredShops.length} Shop{filteredShops.length !== 1 ? 's' : ''} Found
                  </h2>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {filteredShops.map((shop, index) => {
                    const { rating, count } = parseRating(shop.rating);
                    const initials = getInitials(shop.name);

                    return (
                      <Card key={index} className="p-4 bg-card border-border hover:border-primary/50 transition-colors">
                        <div className="flex gap-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg flex-shrink-0">
                            {initials}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div>
                                <h3 className="font-semibold text-foreground">{shop.name}</h3>
                                <p className="text-sm text-muted-foreground">{shop.city}</p>
                              </div>
                            </div>

                            {rating > 0 && (
                              <div className="flex items-center gap-1 mb-2">
                                <div className="flex gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-3 w-3 ${
                                        i < Math.floor(rating)
                                          ? "fill-primary text-primary"
                                          : "text-muted"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {rating.toFixed(1)} ({count})
                                </span>
                              </div>
                            )}

                            {shop.address && (
                              <p className="text-xs text-muted-foreground mb-2 flex items-start gap-1">
                                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span>{shop.address}</span>
                              </p>
                            )}

                            {shop.specialties && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {shop.specialties.split(',').slice(0, 3).map((specialty, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground"
                                  >
                                    {specialty.trim()}
                                  </span>
                                ))}
                              </div>
                            )}

                                   <div className="flex flex-wrap gap-2 mb-3">
                              {shop.phone && (
                                <a
                                  href={`tel:${shop.phone}`}
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  <Phone className="h-3 w-3" />
                                  {shop.phone}
                                </a>
                              )}
                              {shop.website && (
                                <a
                                  href={shop.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Website
                                </a>
                              )}
                              {shop.email && (
                                <a
                                  href={`mailto:${shop.email}`}
                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  <Mail className="h-3 w-3" />
                                  Email
                                </a>
                              )}
                            </div>

                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setSelectedShop(shop);
                                setBookingDialogOpen(true);
                              }}
                            >
                              Book Appointment
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Dialog */}
      {selectedShop && (
        <BookingDialog
          open={bookingDialogOpen}
          onOpenChange={setBookingDialogOpen}
          artistId={0}
          artistName={selectedShop.name}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-16">
        <div className="container">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 Universal Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
