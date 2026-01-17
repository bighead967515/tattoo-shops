import { useState, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MapPin, Star, Navigation, ExternalLink, Phone, Mail } from "lucide-react";
import { MapView } from "@/components/Map";
import { loadTattooShops, geocodeAddress, parseRating, getInitials, type TattooShop } from "@/lib/tattooShops";
import BookingDialog from "@/components/BookingDialog";

interface ShopWithLocation extends TattooShop {
  distance?: string;
}

export default function ArtistFinder() {
  const [location, setLocation] = useState("Louisiana");
  const [shops, setShops] = useState<ShopWithLocation[]>([]);
  const [filteredShops, setFilteredShops] = useState<ShopWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [searchCity, setSearchCity] = useState("");
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<ShopWithLocation | null>(null);

  const handleMapReady = useCallback(async (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    const geocoderInstance = new google.maps.Geocoder();
    setGeocoder(geocoderInstance);

    // Load shops from CSV
    const loadedShops = await loadTattooShops();
    
    // Geocode addresses with delay to avoid rate limiting
    const shopsWithCoords: ShopWithLocation[] = [];
    
    for (const shop of loadedShops) {
      if (shop.address) {
        const fullAddress = `${shop.address}, ${shop.city}, Louisiana`;
        const coords = await geocodeAddress(fullAddress, geocoderInstance);
        
        if (coords) {
          shopsWithCoords.push({ ...shop, ...coords });
        } else {
          // Try just city if full address fails
          const cityCoords = await geocodeAddress(`${shop.city}, Louisiana`, geocoderInstance);
          if (cityCoords) {
            shopsWithCoords.push({ ...shop, ...cityCoords });
          }
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } else if (shop.city) {
        // If no address, geocode just the city
        const cityCoords = await geocodeAddress(`${shop.city}, Louisiana`, geocoderInstance);
        if (cityCoords) {
          shopsWithCoords.push({ ...shop, ...cityCoords });
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setShops(shopsWithCoords);
    setFilteredShops(shopsWithCoords);
    setLoading(false);

    // Add markers for shops with coordinates
    const newMarkers = shopsWithCoords
      .filter(shop => shop.lat && shop.lng)
      .map((shop) => {
        const marker = new google.maps.Marker({
          position: { lat: shop.lat!, lng: shop.lng! },
          map: mapInstance,
          title: shop.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#ff8c42",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });

        const { rating, count } = parseRating(shop.rating);
        const ratingStars = rating > 0 ? `⭐ ${rating}/5 (${count})` : 'No ratings yet';

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; color: #000; max-width: 250px;">
              <h3 style="margin: 0 0 4px 0; font-weight: bold; font-size: 16px;">${shop.name}</h3>
              <p style="margin: 0 0 4px 0; font-size: 13px; color: #666;">${shop.city}</p>
              ${shop.address ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #888;">${shop.address}</p>` : ''}
              <p style="margin: 0; font-size: 12px; color: #ff8c42;">${ratingStars}</p>
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open(mapInstance, marker);
        });

        return marker;
      });

    setMarkers(newMarkers);

    // Fit bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      shopsWithCoords.forEach((shop) => {
        if (shop.lat && shop.lng) {
          bounds.extend({ lat: shop.lat, lng: shop.lng });
        }
      });
      mapInstance.fitBounds(bounds);
    }
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

    // Update map to show only filtered markers
    markers.forEach(marker => marker.setMap(null));
    
    const newMarkers = filtered
      .filter(shop => shop.lat && shop.lng)
      .map((shop) => {
        const marker = new google.maps.Marker({
          position: { lat: shop.lat!, lng: shop.lng! },
          map: map!,
          title: shop.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#ff8c42",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });

        const { rating, count } = parseRating(shop.rating);
        const ratingStars = rating > 0 ? `⭐ ${rating}/5 (${count})` : 'No ratings yet';

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; color: #000; max-width: 250px;">
              <h3 style="margin: 0 0 4px 0; font-weight: bold; font-size: 16px;">${shop.name}</h3>
              <p style="margin: 0 0 4px 0; font-size: 13px; color: #666;">${shop.city}</p>
              ${shop.address ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #888;">${shop.address}</p>` : ''}
              <p style="margin: 0; font-size: 12px; color: #ff8c42;">${ratingStars}</p>
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open(map!, marker);
        });

        return marker;
      });

    setMarkers(newMarkers);

    // Fit bounds to filtered results
    if (newMarkers.length > 0 && map) {
      const bounds = new google.maps.LatLngBounds();
      filtered.forEach((shop) => {
        if (shop.lat && shop.lng) {
          bounds.extend({ lat: shop.lat, lng: shop.lng });
        }
      });
      map.fitBounds(bounds);
    }
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation && map) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setCenter({ lat: latitude, lng: longitude });
          map.setZoom(13);
          setLocation("Current Location");
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
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
            <Button onClick={handleUseMyLocation} variant="outline" className="h-12 px-6">
              <Navigation className="h-4 w-4 mr-2" />
              My Location
            </Button>
            <Button onClick={handleSearch} className="h-12 px-8">Search</Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading tattoo shops and geocoding addresses...</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Map */}
              <div className="lg:sticky lg:top-24 h-[600px] rounded-lg overflow-hidden border border-border">
                <MapView
                  onMapReady={handleMapReady}
                  initialCenter={{ lat: 30.9843, lng: -91.9623 }} // Louisiana center
                  initialZoom={7}
                  className="w-full h-full"
                />
              </div>

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
