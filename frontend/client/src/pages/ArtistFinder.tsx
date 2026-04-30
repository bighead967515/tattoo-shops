import { useMemo, useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  MapPin,
  Star,
  ExternalLink,
  Phone,
  Mail,
  SearchX,
  Store,
  BadgeCheck,
  User,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  filterTattooShops,
  parseRating,
  getInitials,
  mapArtistsToTattooShops,
  mapShopsToTattooShops,
  type TattooShop,
} from "@/lib/tattooShops";
import BookingDialog from "@/components/BookingDialog";
import { usePageSeo } from "@/hooks/usePageSeo";

export default function ArtistFinder() {
  const [searchCity, setSearchCity] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<TattooShop | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "artists" | "shops">("all");

  const {
    data: artists,
    isLoading: artistsLoading,
    isError: artistsError,
  } = trpc.artists.getAll.useQuery();

  const {
    data: shopRecords,
    isLoading: shopsLoading,
    isError: shopsError,
  } = trpc.shop.getAll.useQuery();

  const loading = artistsLoading || shopsLoading;
  const isError = artistsError || shopsError;

  const allEntries = useMemo(() => {
    const artistEntries = mapArtistsToTattooShops(artists ?? []);
    const shopEntries = mapShopsToTattooShops(shopRecords ?? []);
    // Merge: artists first, then shops — deduplicate by name+city to avoid showing
    // the same business twice if it appears in both tables.
    const seen = new Set<string>();
    const merged: TattooShop[] = [];
    for (const entry of [...artistEntries, ...shopEntries]) {
      const key = `${entry.name.toLowerCase()}|${entry.city.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(entry);
      }
    }
    return merged;
  }, [artists, shopRecords]);

  const tabFiltered = useMemo(() => {
    if (activeTab === "artists") return allEntries.filter((e) => e.source === "artist");
    if (activeTab === "shops") return allEntries.filter((e) => e.source === "shop");
    return allEntries;
  }, [allEntries, activeTab]);

  const filteredShops = useMemo(
    () => filterTattooShops(tabFiltered, activeSearch),
    [tabFiltered, activeSearch],
  );

  const handleSearch = () => {
    setActiveSearch(searchCity);
  };

  const artistCount = allEntries.filter((e) => e.source === "artist").length;
  const shopCount = allEntries.filter((e) => e.source === "shop").length;

  usePageSeo({
    title: "Find Tattoo Artists & Shops Near You | Ink Connect",
    description:
      "Browse verified tattoo artists and shops by city. Compare styles, portfolios, and ratings to book your next tattoo on Ink Connect.",
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Find Tattoo Artists &amp; Shops Near You
          </h1>
          <p className="text-muted-foreground mb-8">
            Discover verified tattoo artists and shops near you
          </p>

          {/* Search Bar */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by city or shop name (e.g., New Orleans, Baton Rouge)"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 h-12 bg-card border-border text-foreground"
              />
            </div>
            <Button onClick={handleSearch} className="h-12 px-8">
              Search
            </Button>
          </div>

          {/* Tab Filter */}
          {!loading && !isError && (
            <div className="flex gap-2 mb-6">
              <Button
                variant={activeTab === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("all")}
              >
                All ({allEntries.length})
              </Button>
              <Button
                variant={activeTab === "artists" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("artists")}
              >
                <User className="h-3.5 w-3.5 mr-1" />
                Artists ({artistCount})
              </Button>
              <Button
                variant={activeTab === "shops" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("shops")}
              >
                <Store className="h-3.5 w-3.5 mr-1" />
                Shops ({shopCount})
              </Button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Loading artists and shops from the database...
              </p>
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-2">
                Unable to load results. Please try again.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {/* Results List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">
                    {filteredShops.length} Result
                    {filteredShops.length !== 1 ? "s" : ""} Found
                  </h2>
                </div>

                <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
                  {filteredShops.length === 0 ? (
                    <Card className="p-8 text-center">
                      <SearchX className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">
                        No results matched your search.
                      </p>
                    </Card>
                  ) : (
                    filteredShops.map((shop) => {
                      const { rating, count } = parseRating(shop.rating);
                      const initials = getInitials(shop.name);
                      const isShopEntry = shop.source === "shop";

                      return (
                        <Card
                          key={`${shop.source}-${shop.id}`}
                          className="p-4 bg-card border-border hover:border-primary/50 transition-colors"
                        >
                          <div className="flex gap-4">
                            {/* Avatar */}
                            <div
                              className={`flex h-16 w-16 items-center justify-center rounded-full font-bold text-lg flex-shrink-0 ${
                                isShopEntry
                                  ? "bg-secondary text-secondary-foreground"
                                  : "bg-primary text-primary-foreground"
                              }`}
                            >
                              {isShopEntry ? (
                                <Store className="h-7 w-7" />
                              ) : (
                                initials
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold text-foreground">
                                      {shop.name}
                                    </h3>
                                    {/* Source badge */}
                                    <span
                                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded-full font-medium ${
                                        isShopEntry
                                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                          : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                      }`}
                                    >
                                      {isShopEntry ? (
                                        <>
                                          <Store className="h-3 w-3" />
                                          Shop
                                        </>
                                      ) : (
                                        <>
                                          <User className="h-3 w-3" />
                                          Artist
                                        </>
                                      )}
                                    </span>
                                    {/* Verified badge for shops */}
                                    {isShopEntry && shop.isVerified && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                        <BadgeCheck className="h-3 w-3" />
                                        Verified
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {shop.city}
                                  </p>
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
                                  {shop.specialties
                                    .split(",")
                                    .slice(0, 3)
                                    .map((specialty, i) => (
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

                              {/* Only show booking button for artist profiles */}
                              {!isShopEntry && (
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
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })
                  )}
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
          artistId={selectedShop.id}
          artistName={selectedShop.name}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-16">
        <div className="container">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">
              © {new Date().getFullYear()} Ink Connect. All rights reserved.
            </p>
            <div className="flex justify-center gap-4">
              <a href="/terms-of-service" className="hover:text-primary">
                Terms of Service
              </a>
              <a href="/cancellation-policy" className="hover:text-primary">
                Cancellation Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
