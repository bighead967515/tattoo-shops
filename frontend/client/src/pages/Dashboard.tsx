import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation, Link } from "wouter";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Heart,
  User,
  CreditCard,
  MapPin,
  Clock,
  LayoutDashboard,
  Sparkles,
  Info,
  CheckCircle,
  XCircle,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

// Import other dashboards/onboarding flows to render them inline
import AdminDashboard from "./AdminDashboard";
import ArtistDashboard from "./ArtistDashboard";
import ClientOnboarding from "./ClientOnboarding";
import ArtistRegister from "./ArtistRegister";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!isAuthenticated || !user)) {
      setLocation("/login");
    }
  }, [loading, isAuthenticated, user, setLocation]);

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

  // Redirect if not authenticated after loading completes
  if (!isAuthenticated || !user) {
    return null;
  }

  // Unified Dashboard Router
  if (user.role === "admin") {
    return <AdminDashboard />;
  }

  if (user.role === "artist") {
    return <ArtistDashboard />;
  }

  if (user.role === "client") {
    return <ClientDashboardView />;
  }

  // If role is "user" (onboarding/registration selector is required)
  return <OnboardingSelector />;
}

function OnboardingSelector() {
  const [mode, setMode] = useState<"select" | "client" | "artist">("select");

  if (mode === "client") {
    return (
      <div>
        <div className="container py-4 flex justify-between items-center border-b">
          <Button variant="ghost" onClick={() => setMode("select")}>← Back</Button>
          <span className="font-semibold text-muted-foreground">Client Onboarding</span>
        </div>
        <ClientOnboarding />
      </div>
    );
  }

  if (mode === "artist") {
    return (
      <div>
        <div className="container py-4 flex justify-between items-center border-b">
          <Button variant="ghost" onClick={() => setMode("select")}>← Back</Button>
          <span className="font-semibold text-muted-foreground">Artist Registration</span>
        </div>
        <ArtistRegister />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Header />
      <div className="container max-w-4xl py-16 px-4">
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            Welcome to Ink Connect
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose how you want to use the platform to get started. You can register as a tattoo client to book appointments, or as a tattoo artist to list your shop and receive requests.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-8 flex flex-col justify-between border-muted hover:border-primary/50 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(112,255,112,0.1)]">
            <div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold mb-3">I want to get a Tattoo</h2>
              <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                Browse professional artists, save your favorites, and submit booking requests for custom designs or flash art.
              </p>
            </div>
            <Button className="w-full font-bold shadow-md hover:shadow-primary/25 transition-all" onClick={() => setMode("client")}>
              Become a Client
            </Button>
          </Card>

          <Card className="p-8 flex flex-col justify-between border-muted hover:border-purple-500/50 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]">
            <div>
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="w-6 h-6 text-purple-500" />
              </div>
              <h2 className="text-2xl font-bold mb-3">I am a Tattoo Artist</h2>
              <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                Create your shop profile, upload your portfolio, manage your booking calendar, and connect with local clients.
              </p>
            </div>
            <Button variant="secondary" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md hover:shadow-purple-500/25 transition-all" onClick={() => setMode("artist")}>
              Register as Artist
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ClientDashboardView() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  if (!user) return null;

  const { data: artist } = trpc.artists.getByUserId.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");

  const { data: bookings, isLoading: bookingsLoading, refetch: refetchBookings } =
    trpc.bookings.getByUserId.useQuery(undefined, { enabled: isAuthenticated });

  const requestRefundMutation = trpc.bookings.requestRefund.useMutation({
    onSuccess: () => {
      toast.success("Refund request submitted successfully!");
      setIsRefundDialogOpen(false);
      setRefundReason("");
      refetchBookings();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit refund request.");
    },
  });

  const {
    data: favorites,
    isLoading: favoritesLoading,
    refetch: refetchFavorites,
  } = trpc.favorites.getByUserId.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const removeFavoriteMutation = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      toast.success("Removed from favorites");
      refetchFavorites();
    },
  });

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
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user.name || "User"}!
            </p>
          </div>
          {artist && (
            <Link href="/dashboard">
              <Button className="w-full md:w-auto bg-gradient-to-r from-primary to-purple-600 hover:shadow-[0_0_20px_rgba(112,255,112,0.4)]">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Artist Dashboard
              </Button>
            </Link>
          )}
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
              <Button onClick={() => setLocation("/artists")}>
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
                          <Badge
                            className={getStatusColor(item.booking.status)}
                          >
                            {item.booking.status}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              {new Date(
                                item.booking.preferredDate,
                              ).toLocaleString()}
                            </span>
                          </div>

                          {item.artist?.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>
                                {item.artist.address}, {item.artist.city},{" "}
                                {item.artist.state}
                              </span>
                            </div>
                          )}

                          <div className="mt-3">
                            <p className="font-medium text-foreground">
                              Tattoo Description:
                            </p>
                            <p className="mt-1">
                              {item.booking.tattooDescription}
                            </p>
                          </div>

                          <div className="flex gap-4 mt-2">
                            <div>
                              <span className="font-medium text-foreground">
                                Placement:
                              </span>{" "}
                              {item.booking.placement}
                            </div>
                            <div>
                              <span className="font-medium text-foreground">
                                Size:
                              </span>{" "}
                              {item.booking.size}
                            </div>
                          </div>

                          {item.booking.depositPaid && (
                            <div className="flex items-center gap-2 text-green-600 mt-2">
                              <CreditCard className="w-4 h-4" />
                              <span className="font-medium">
                                Deposit Paid: $
                                {(item.booking.depositAmount || 0) / 100}
                              </span>
                            </div>
                          )}

                          {item.booking.depositPaid && item.booking.refundStatus === "requested" && (
                            <div className="flex items-center gap-2 text-yellow-600 mt-2">
                              <Info className="w-4 h-4" />
                              <span className="font-medium">Refund Status: Requested</span>
                            </div>
                          )}

                          {item.booking.depositPaid && item.booking.refundStatus === "refunded" && (
                            <div className="flex items-center gap-2 text-green-600 mt-2">
                              <CheckCircle className="w-4 h-4" />
                              <span className="font-medium">Refund Status: Refunded</span>
                            </div>
                          )}

                          {item.booking.depositPaid && item.booking.refundStatus === "rejected" && (
                            <div className="flex items-center gap-2 text-red-600 mt-2">
                              <XCircle className="w-4 h-4" />
                              <span className="font-medium">Refund Status: Request Rejected</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {item.artist && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setLocation(`/artist/${item.artist!.id}`)
                            }
                          >
                            View Artist
                          </Button>
                        )}
                        {item.booking.depositPaid && item.booking.refundStatus === "not_requested" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedBookingId(item.booking.id);
                              setIsRefundDialogOpen(true);
                            }}
                          >
                            Request Refund
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
                <Button onClick={() => setLocation("/artists")}>
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

                  let avgRating = 0;
                  if (item.artist.averageRating) {
                    const parsed = parseFloat(item.artist.averageRating);
                    avgRating =
                      Number.isNaN(parsed) || !isFinite(parsed) ? 0 : parsed;
                  }

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
                                star <= avgRating
                                  ? "text-primary"
                                  : "text-muted-foreground"
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
                          onClick={() =>
                            setLocation(`/artist/${item.artist!.id}`)
                          }
                        >
                          View Profile
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            removeFavoriteMutation.mutate({
                              artistId: item.artist!.id,
                            })
                          }
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
                <h3 className="text-lg font-semibold mb-2">
                  No favorite artists yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Save your favorite artists to quickly access them later
                </p>
                <Button onClick={() => setLocation("/artists")}>
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
                  <label className="text-sm font-medium text-muted-foreground">
                    Name
                  </label>
                  <p className="text-lg">{user.name || "Not set"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <p className="text-lg">{user.email || "Not set"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Role
                  </label>
                  <Badge>{user.role}</Badge>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Member Since
                  </label>
                  <p className="text-lg">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Deposit Refund</DialogTitle>
            <DialogDescription>
              Please provide the reason for requesting a refund. The admin will review your request and process it.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedBookingId) return;
              if (refundReason.trim().length < 5) {
                toast.error("Please provide a reason with at least 5 characters.");
                return;
              }
              requestRefundMutation.mutate({
                bookingId: selectedBookingId,
                reason: refundReason,
              });
            }}
            className="space-y-4 pt-2"
          >
            <div className="space-y-2">
              <Label htmlFor="refund-reason">Reason for Refund *</Label>
              <Textarea
                id="refund-reason"
                placeholder="e.g. Artist failed to show up at the scheduled time, or cancelled the appointment offline."
                rows={4}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRefundDialogOpen(false)}
                disabled={requestRefundMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={requestRefundMutation.isPending}
              >
                {requestRefundMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
