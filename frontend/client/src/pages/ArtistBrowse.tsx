import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import ArtistFilters, { FilterState } from "@/components/ArtistFilters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Star } from "lucide-react";

export default function ArtistBrowse() {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState<FilterState>({
    styles: [],
    minRating: 0,
    minExperience: 0,
  });

  const { data: artists, isLoading } = trpc.artists.search.useQuery({
    styles: filters.styles.length > 0 ? filters.styles : undefined,
    minRating: filters.minRating > 0 ? filters.minRating : undefined,
    minExperience: filters.minExperience > 0 ? filters.minExperience : undefined,
  });

  const handleClearFilters = () => {
    setFilters({
      styles: [],
      minRating: 0,
      minExperience: 0,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Artists</h1>
          <p className="text-muted-foreground">
            Find the perfect tattoo artist for your style
          </p>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
          {/* Filters Sidebar */}
          <aside>
            <ArtistFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={handleClearFilters}
            />
          </aside>

          {/* Artists Grid */}
          <div>
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading artists...</p>
              </div>
            ) : artists && artists.length > 0 ? (
              <>
                <div className="mb-6 text-sm text-muted-foreground">
                  Found {artists.length} artist{artists.length !== 1 ? "s" : ""}
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {artists.map((artist) => {
                    const avgRating = artist.averageRating
                      ? parseFloat(artist.averageRating)
                      : 0;
                    
                    const artistStyles = artist.styles
                      ? artist.styles.split(",").map((s) => s.trim())
                      : [];

                    return (
                      <Card
                        key={artist.id}
                        className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setLocation(`/artist/${artist.id}`)}
                      >
                        <div className="mb-4">
                          <h3 className="text-xl font-semibold mb-2">
                            {artist.shopName}
                          </h3>

                          {artist.city && (
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
                      </Card>
                    );
                  })}
                </div>
              </>
            ) : (
              <Card className="p-12 text-center">
                <h3 className="text-lg font-semibold mb-2">No artists found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters to see more results
                </p>
                <Button onClick={handleClearFilters}>Clear Filters</Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
