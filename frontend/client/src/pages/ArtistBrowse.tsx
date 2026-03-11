import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import ArtistFilters, { FilterState } from "@/components/ArtistFilters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Star,
  Search,
  Sparkles,
  X,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import ArtistCardSkeleton from "@/components/ArtistCardSkeleton";

export default function ArtistBrowse() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const initialQuery = urlParams.get("search") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [mode, setMode] = useState<"discover" | "filters">(
    initialQuery ? "discover" : "filters",
  );

  const [filters, setFilters] = useState<FilterState>({
    styles: [],
    minRating: 0,
    minExperience: 0,
    city: "",
    state: "",
  });

  // Sync URL search param changes
  useEffect(() => {
    const q = urlParams.get("search") || "";
    if (q && q !== activeQuery) {
      setSearchQuery(q);
      setActiveQuery(q);
      setMode("discover");
    }
  }, [searchString, activeQuery]);

  // Structured filter search (existing)
  const filterSearch = trpc.artists.search.useQuery(
    {
      styles: filters.styles.length > 0 ? filters.styles : undefined,
      minRating: filters.minRating > 0 ? filters.minRating : undefined,
      minExperience:
        filters.minExperience > 0 ? filters.minExperience : undefined,
      city: filters.city || undefined,
      state: filters.state || undefined,
    },
    { enabled: mode === "filters" },
  );

  // AI-powered discovery search
  const discoverySearch = trpc.artists.discover.useQuery(
    { query: activeQuery },
    { enabled: mode === "discover" && activeQuery.length > 0 },
  );

  const handleSearch = () => {
    const q = searchQuery.trim();
    if (q) {
      setActiveQuery(q);
      setMode("discover");
      setLocation(`/artists?search=${encodeURIComponent(q)}`, {
        replace: true,
      });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveQuery("");
    setMode("filters");
    setLocation("/artists", { replace: true });
  };

  const handleClearFilters = () => {
    setFilters({
      styles: [],
      minRating: 0,
      minExperience: 0,
      city: "",
      state: "",
    });
  };

  const isDiscoveryMode = mode === "discover" && activeQuery.length > 0;
  const isLoading = isDiscoveryMode
    ? discoverySearch.isLoading
    : filterSearch.isLoading;
  const isError = isDiscoveryMode
    ? discoverySearch.isError
    : filterSearch.isError;
  const error = isDiscoveryMode ? discoverySearch.error : filterSearch.error;

  // Normalize results
  const discoveryArtists = discoverySearch.data?.artists || [];
  const filterArtists = filterSearch.data || [];
  const artists = isDiscoveryMode ? discoveryArtists : filterArtists;
  const intent = discoverySearch.data?.intent;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-12">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {isDiscoveryMode ? "Tattoo Discovery" : "Browse Artists"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isDiscoveryMode
              ? "AI-powered search matches your vision to artist portfolios"
              : "Find the perfect tattoo artist for your style"}
          </p>

          {/* Discovery Search Bar */}
          <div className="max-w-3xl">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Describe your dream tattoo... e.g. 'minimalist mountain range on my forearm'"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 h-12 text-base"
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button size="lg" onClick={handleSearch} className="h-12 px-6">
                <Search className="w-4 h-4 mr-2" />
                Discover
              </Button>
            </div>

            {/* Mode toggle */}
            {isDiscoveryMode && (
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMode("filters");
                    setLocation("/artists", { replace: true });
                  }}
                >
                  <SlidersHorizontal className="w-3 h-3 mr-1" />
                  Switch to Filters
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* AI Intent Display (discovery mode only) */}
        {isDiscoveryMode &&
          intent &&
          intent.styles.length > 0 &&
          !isLoading && (
            <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    AI understood your request:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {intent.styles.map((style) => (
                      <Badge
                        key={`style-${style}`}
                        variant="default"
                        className="text-xs"
                      >
                        {style}
                      </Badge>
                    ))}
                    {intent.tags.map((tag) => (
                      <Badge
                        key={`tag-${tag}`}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {intent.placement && (
                      <Badge variant="outline" className="text-xs">
                        📍 {intent.placement}
                      </Badge>
                    )}
                    {intent.size && (
                      <Badge variant="outline" className="text-xs">
                        📐 {intent.size}
                      </Badge>
                    )}
                    {intent.keywords.map((kw) => (
                      <Badge
                        key={`kw-${kw}`}
                        variant="outline"
                        className="text-xs"
                      >
                        {kw}
                      </Badge>
                    ))}
                  </div>
                  {intent.vibeDescription && (
                    <p className="text-xs text-muted-foreground italic">
                      "{intent.vibeDescription}"
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

        <div
          className={
            isDiscoveryMode ? "" : "grid lg:grid-cols-[300px_1fr] gap-8"
          }
        >
          {/* Filters Sidebar (structured mode only) */}
          {!isDiscoveryMode && (
            <aside>
              <ArtistFilters
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={handleClearFilters}
              />
            </aside>
          )}

          {/* Artists Grid */}
          <div>
            {isLoading ? (
              <div className="space-y-4">
                {isDiscoveryMode && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      AI is analyzing your request and matching portfolios...
                    </span>
                  </div>
                )}
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <ArtistCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            ) : isError ? (
              <div className="text-center py-12">
                <p className="text-destructive">
                  Error loading artists: {error?.message || "Unknown error"}
                </p>
              </div>
            ) : artists && artists.length > 0 ? (
              <>
                <div className="mb-6 text-sm text-muted-foreground">
                  Found {artists.length} artist{artists.length !== 1 ? "s" : ""}
                  {isDiscoveryMode && " matching your vision"}
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {artists.map((artist) => {
                    const avgRating = artist.averageRating
                      ? parseFloat(artist.averageRating)
                      : 0;

                    const artistStyles = artist.styles
                      ? artist.styles
                          .split(",")
                          .map((s) => s.trim())
                          .filter((s) => s)
                      : [];

                    // Discovery mode: get matched images
                    const matchedImages =
                      isDiscoveryMode && "matchedImages" in artist
                        ? (artist as any).matchedImages || []
                        : [];

                    return (
                      <Card
                        key={artist.id}
                        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setLocation(`/artist/${artist.id}`)}
                      >
                        {/* Matched Portfolio Images (discovery mode) */}
                        {matchedImages.length > 0 && (
                          <div className="grid grid-cols-3 gap-0.5">
                            {matchedImages.slice(0, 3).map((img: any) => (
                              <div
                                key={img.id}
                                className="aspect-square overflow-hidden bg-muted"
                              >
                                <img
                                  src={img.imageUrl}
                                  alt={img.caption || "Portfolio"}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="p-6">
                          <div className="mb-4">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-xl font-semibold mb-2">
                                {artist.shopName}
                              </h3>
                              {isDiscoveryMode &&
                                "relevanceScore" in artist && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs shrink-0"
                                  >
                                    <Sparkles className="w-3 h-3 mr-0.5" />
                                    {(artist as any).relevanceScore}
                                  </Badge>
                                )}
                            </div>

                            {artist.city && artist.state && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                                <MapPin className="w-3 h-3" />
                                {artist.city}, {artist.state}
                              </p>
                            )}

                            <div className="flex items-center gap-2 mb-3">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= avgRating
                                        ? "fill-primary text-primary"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {avgRating.toFixed(1)} ({artist.totalReviews})
                              </span>
                            </div>

                            {artist.experience && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {artist.experience} years experience
                              </p>
                            )}

                            {artistStyles.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {artistStyles.slice(0, 3).map((style) => (
                                  <span
                                    key={style}
                                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                                  >
                                    {style}
                                  </span>
                                ))}
                                {artistStyles.length > 3 && (
                                  <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                                    +{artistStyles.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}

                            {artist.bio && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                {artist.bio}
                              </p>
                            )}
                          </div>

                          <Button className="w-full" size="sm">
                            View Profile
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            ) : (
              <Card className="p-12 text-center">
                <h3 className="text-lg font-semibold mb-2">No artists found</h3>
                <p className="text-muted-foreground mb-4">
                  {isDiscoveryMode
                    ? "Try describing your tattoo idea differently, or switch to filters"
                    : "Try adjusting your filters to see more results"}
                </p>
                {isDiscoveryMode ? (
                  <Button onClick={handleClearSearch}>Switch to Filters</Button>
                ) : (
                  <Button onClick={handleClearFilters}>Clear Filters</Button>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
