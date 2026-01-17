import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Heart, User, CreditCard, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();

  const { data: bookings, isLoading: bookingsLoading } = trpc.bookings.getByUserId.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: favorites, isLoading: favoritesLoading, refetch: refetchFavorites } = trpc.favorites.getByUserId.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const removeFavoriteMutation = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      toast.success("Removed from favorites");
      refetchFavorites();
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/");
    }
  }, [loading, isAuthenticated, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-500";
      case "pending":
        return "bg-yellow-500/10 text-yellow-500";
      case "cancelled":
        return "bg-red-500/10 text-red-500";
      case "completed":
        return "bg-blue-500/10 text-blue-500";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name || "User"}!
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="bookings">
              <Calendar className="w-4 h-4 mr-2" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="favorites">
              <Heart className="w-4 h-4 mr-2" />
              Favorites
            </TabsTrigger>
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">My Bookings</h2>
              <Button onClick={() => setLocation("/artist-finder")}>
                <Calendar className="w-4 h-4 mr-2" />
                New Booking
              </Button>
            </div>

            {bookingsLoading ? (
              <p className="text-muted-foreground">Loading bookings...</p>
            ) : bookings && bookings.length > 0 ? (
              <div className="grid gap-4">
                {bookings.map((item) => (
                  <Card key={item.booking.id} className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-semibold">
                            {item.artist?.shopName || "Unknown Artist"}
                          </h3>
                          <Badge className={getStatusColor(item.booking.status)}>
                            {item.booking.status}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              {new Date(item.booking.preferredDate).toLocaleString()}
                            </span>
                          </div>
                          
                          {item.artist?.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>
                                {item.artist.address}, {item.artist.city}, {item.artist.state}
                              </span>
                            </div>
                          )}

                          <div className="mt-3">
                            <p className="font-medium text-foreground">Tattoo Description:</p>
                            <p className="mt-1">{item.booking.tattooDescription}</p>
                          </div>

                          <div className="flex gap-4 mt-2">
                            <div>
                              <span className="font-medium text-foreground">Placement:</span>{" "}
                              {item.booking.placement}
                            </div>
                            <div>
                              <span className="font-medium text-foreground">Size:</span>{" "}
                              {item.booking.size}
                            </div>
                          </div>

                          {item.booking.depositPaid === 1 && (
                            <div className="flex items-center gap-2 text-green-600 mt-2">
                              <CreditCard className="w-4 h-4" />
                              <span className="font-medium">Deposit Paid: ${(item.booking.depositAmount || 0) / 100}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {item.artist && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/artist/${item.artist!.id}`)}
                          >
                            View Artist
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by finding an artist and booking your first appointment
                </p>
                <Button onClick={() => setLocation("/artist-finder")}>
                  Find Artists
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Favorite Artists</h2>

            {favoritesLoading ? (
              <p className="text-muted-foreground">Loading favorites...</p>
            ) : favorites && favorites.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((item) => {
                  if (!item.artist) return null;
                  
                  const avgRating = item.artist.averageRating
                    ? parseFloat(item.artist.averageRating)
                    : 0;

                  return (
                    <Card key={item.favorite.id} className="p-6">
                      <h3 className="text-lg font-semibold mb-2">
                        {item.artist.shopName}
                      </h3>
                      
                      {item.artist.city && (
                        <p className="text-sm text-muted-foreground mb-3">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {item.artist.city}, {item.artist.state}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-sm ${
                                star <= avgRating ? "text-primary" : "text-muted-foreground"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          ({item.artist.totalReviews})
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => setLocation(`/artist/${item.artist!.id}`)}
                        >
                          View Profile
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFavoriteMutation.mutate({ artistId: item.artist!.id })}
                        >
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No favorite artists yet</h3>
                <p className="text-muted-foreground mb-4">
                  Save your favorite artists to quickly access them later
                </p>
                <Button onClick={() => setLocation("/artist-finder")}>
                  Browse Artists
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">My Profile</h2>

            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg">{user.name || "Not set"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg">{user.email || "Not set"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <Badge>{user.role}</Badge>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                  <p className="text-lg">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
