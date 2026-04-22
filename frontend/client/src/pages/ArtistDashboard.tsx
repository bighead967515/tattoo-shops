import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { safeJsonParse } from "@/lib/utils";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  User,
  Image as ImageIcon,
  Settings,
  Plus,
  Trash2,
  Loader2,
  ExternalLink,
  Briefcase,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  CreditCard,
  Crown,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";
import { format } from "date-fns";
import ArtistDashboardFeed from "@/components/ArtistDashboardFeed";
import UpgradePrompt from "@/components/UpgradePrompt";
import { Progress } from "@/components/ui/progress";
import axios from "axios";
import { isFreeArtistTier, toLegacyArtistTier, type ArtistCanonicalTier } from "@shared/tierCompat";
import { TIER_LIMITS, TIER_PRICING, type ArtistTierKey } from "@shared/tierLimits";
import { Link } from "wouter";

export default function ArtistDashboard() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const {
    data: artist,
    isLoading: artistLoading,
    refetch: refetchArtist,
  } = trpc.artists.getByUserId.useQuery(undefined, { enabled: !!user });

  const { data: bookings, isLoading: bookingsLoading } =
    trpc.bookings.getByArtistId.useQuery(
      { artistId: artist?.id || 0 },
      { enabled: !!artist },
    );

  const {
    data: portfolio,
    isLoading: portfolioLoading,
    refetch: refetchPortfolio,
  } = trpc.portfolio.get.useQuery(
    { artistId: artist?.id || 0 },
    { enabled: !!artist },
  );

  const updateArtistMutation = trpc.artists.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      refetchArtist();
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  const getUploadUrlMutation = trpc.portfolio.getUploadUrl.useMutation();
  const addPortfolioImageMutation = trpc.portfolio.add.useMutation({
    onSuccess: () => {
      refetchPortfolio();
      setIsUploading(false);
      toast.success("Image added to portfolio!");
    },
  });

  const deletePortfolioImageMutation = trpc.portfolio.delete.useMutation({
    onSuccess: () => {
      refetchPortfolio();
      toast.success("Image removed from portfolio");
    },
  });

  const updateBookingStatusMutation = trpc.bookings.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Booking status updated");
    },
  });

  if (loading || artistLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading artist dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    setLocation("/login");
    return null;
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">No Artist Profile Found</h1>
          <p className="text-muted-foreground mb-8">
            You need to register as an artist first.
          </p>
          <Button onClick={() => setLocation("/for-artists")}>
            Register as Artist
          </Button>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateArtistMutation.mutate({
      id: artist.id,
      shopName: formData.get("shopName") as string,
      bio: formData.get("bio") as string,
      specialties: formData.get("specialties") as string,
      experience: parseInt(formData.get("experience") as string),
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      website: formData.get("website") as string,
      instagram: formData.get("instagram") as string,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !artist) return;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      // 1. Get signed upload URL
      const { signedUrl, path } = await getUploadUrlMutation.mutateAsync({
        artistId: artist.id,
        fileName: file.name,
        contentType: file.type,
      });

      // 2. Upload file directly to Supabase Storage using axios for progress
      await axios.put(signedUrl, file, {
        headers: { "Content-Type": file.type },
        onUploadProgress: (progressEvent) => {
          if (
            typeof progressEvent.total === "number" &&
            progressEvent.total > 0
          ) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress(percentCompleted);
          }
        },
      });

      // 3. Add to portfolio database by passing the key
      await addPortfolioImageMutation.mutateAsync({
        artistId: artist.id,
        imageKey: path,
        caption: file.name,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image");
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Artist Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your profile, portfolio, and bookings for{" "}
              <span className="font-semibold text-foreground">
                {artist.shopName}
              </span>
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation(`/artist/${artist.id}`)}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View Public Profile
          </Button>
        </div>

        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="portfolio">
              <ImageIcon className="w-4 h-4 mr-2" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="requests">
              <Briefcase className="w-4 h-4 mr-2" />
              Requests
            </TabsTrigger>
            <TabsTrigger value="bookings">
              <Calendar className="w-4 h-4 mr-2" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="billing">
              <CreditCard className="w-4 h-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Your Portfolio</h2>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Image
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
            </div>
            {isUploading && uploadProgress !== null && (
              <div className="space-y-2">
                <Label>Uploading...</Label>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {portfolioLoading ? (
                <p>Loading portfolio...</p>
              ) : portfolio?.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-muted/30 border border-dashed rounded-lg">
                  <p className="text-muted-foreground">
                    Your portfolio is empty. Add your best work!
                  </p>
                </div>
              ) : (
                portfolio?.map((image) => {
                  const aiStyles: string[] = safeJsonParse<string[]>(
                    image.aiStyles,
                    [],
                  );
                  const aiTags: string[] = safeJsonParse<string[]>(
                    image.aiTags,
                    [],
                  );
                  const qualityIssues: string[] = safeJsonParse<string[]>(
                    image.qualityIssues,
                    [],
                  );
                  const hasQualityWarning =
                    image.qualityScore !== null && image.qualityScore < 50;
                  const isProcessing =
                    image.aiProcessedAt === null && image.qualityScore === null;

                  return (
                    <Card
                      key={image.id}
                      className="overflow-hidden group relative"
                    >
                      <img
                        src={image.imageUrl}
                        alt={image.aiDescription || image.caption || ""}
                        className="w-full aspect-square object-cover"
                      />
                      {/* Quality warning overlay */}
                      {hasQualityWarning && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-destructive/90 text-destructive-foreground text-xs px-2 py-1 rounded">
                          <AlertTriangle className="h-3 w-3" />
                          Quality: {image.qualityScore}/100
                        </div>
                      )}
                      {/* AI processing indicator */}
                      {isProcessing && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded">
                          <Sparkles className="h-3 w-3 animate-pulse" />
                          Analyzing...
                        </div>
                      )}
                      {/* AI tags display */}
                      {(aiStyles.length > 0 || aiTags.length > 0) && (
                        <div className="p-2 space-y-1 border-t">
                          {aiStyles.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {aiStyles.map((style) => (
                                <Badge
                                  key={`style-${style}`}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {style}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {aiTags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {aiTags.slice(0, 3).map((tag) => (
                                <Badge
                                  key={`tag-${tag}`}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {/* Quality issues — shown independently of AI tag presence */}
                      {qualityIssues.length > 0 &&
                        !qualityIssues.includes("analysis-failed") && (
                          <div className="p-2 border-t">
                            <p className="text-xs text-muted-foreground">
                              Issues: {qualityIssues.join(", ")}
                            </p>
                          </div>
                        )}
                      {/* Hover overlay with delete + re-analyze buttons */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() =>
                            deletePortfolioImageMutation.mutate({
                              id: image.id,
                            })
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <h2 className="text-2xl font-semibold">Open Tattoo Requests</h2>
            {isFreeArtistTier(artist.subscriptionTier) ? (
              <UpgradePrompt
                feature="View & Bid on Requests"
                description="Upgrade to a paid plan to view and bid on new tattoo requests from clients."
              />
            ) : (
              <ArtistDashboardFeed />
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <h2 className="text-2xl font-semibold">Inquiries & Bookings</h2>
            <div className="grid gap-4">
              {bookingsLoading ? (
                <p>Loading bookings...</p>
              ) : bookings?.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center bg-muted/30 rounded-lg">
                  No bookings yet.
                </p>
              ) : (
                bookings?.map((booking) => (
                  <Card key={booking.id}>
                    <CardHeader className="flex flex-row items-center justify-between py-4">
                      <div>
                        <CardTitle className="text-lg">
                          {booking.customerName}
                        </CardTitle>
                        <CardDescription>
                          {booking.customerEmail} • {booking.customerPhone}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          booking.status === "confirmed" ? "default" : "outline"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-semibold text-muted-foreground mb-1">
                            Preferred Date
                          </p>
                          <p>
                            {format(new Date(booking.preferredDate), "PPP")}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-muted-foreground mb-1">
                            Tattoo Details
                          </p>
                          <p>
                            {booking.size} • {booking.placement}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="font-semibold text-muted-foreground mb-1">
                            Description
                          </p>
                          <p>{booking.tattooDescription}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        {booking.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateBookingStatusMutation.mutate({
                                id: booking.id,
                                status: "confirmed",
                              })
                            }
                          >
                            Mark Confirmed
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            updateBookingStatusMutation.mutate({
                              id: booking.id,
                              status: "cancelled",
                            })
                          }
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <h2 className="text-2xl font-semibold">Subscription & Billing</h2>
            {(() => {
              const tier = (artist.subscriptionTier ?? "artist_free") as ArtistCanonicalTier;
              const legacy = toLegacyArtistTier(tier);
              const limits = TIER_LIMITS[legacy as ArtistTierKey];
              const pricing = TIER_PRICING[legacy as ArtistTierKey];
              const isFree = isFreeArtistTier(tier);
              return (
                <>
                  {/* Current plan card */}
                  <Card className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-primary/10">
                          <Crown className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Current Plan</p>
                          <h3 className="text-2xl font-bold">{limits.name}</h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            {isFree
                              ? "Free — upgrade to unlock more features"
                              : `$${pricing.monthly / 100}/mo or $${pricing.yearly! / 100}/yr`}
                          </p>
                        </div>
                      </div>
                      <Link href="/artist/billing">
                        <Button variant={isFree ? "default" : "outline"} className="gap-2">
                          {isFree ? (
                            <><Zap className="h-4 w-4" /> Upgrade Plan</>
                          ) : (
                            <><CreditCard className="h-4 w-4" /> Manage Plan</>
                          )}
                        </Button>
                      </Link>
                    </div>

                    {/* Feature summary */}
                    <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { label: "Portfolio Photos", value: limits.portfolioPhotos === Number.MAX_SAFE_INTEGER ? "Unlimited" : String(limits.portfolioPhotos) },
                        { label: "Accept Bookings", value: limits.canAcceptBookings ? "Yes" : "No" },
                        { label: "Analytics", value: limits.hasAnalytics ? "Yes" : "No" },
                        { label: "Featured", value: limits.isFeatured ? "Yes" : "No" },
                      ].map(({ label, value }) => (
                        <div key={label} className="p-3 rounded-lg bg-muted/40 border">
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Upgrade CTA for free users */}
                  {isFree && (
                    <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-primary/20">
                          <Sparkles className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">Unlock Your Full Potential</h3>
                          <p className="text-muted-foreground mb-4">
                            Upgrade to an Artist plan to accept bookings, show your contact info,
                            get a verified badge, and appear higher in search results.
                          </p>
                          <Link href="/artist/billing">
                            <Button className="gap-2">
                              <Zap className="h-4 w-4" />
                              View Plans & Pricing
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  )}
                </>
              );
            })()}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Edit Artist Profile</CardTitle>
                <CardDescription>
                  Update your shop information and contact details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shopName">Shop Name</Label>
                      <Input
                        id="shopName"
                        name="shopName"
                        defaultValue={artist.shopName}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience">Years Experience</Label>
                      <Input
                        id="experience"
                        name="experience"
                        type="number"
                        defaultValue={artist.experience || 0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        defaultValue={artist.city || ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        name="state"
                        defaultValue={artist.state || ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        name="website"
                        defaultValue={artist.website || ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        name="instagram"
                        defaultValue={artist.instagram || ""}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="specialties">
                        Specialties (comma separated)
                      </Label>
                      <Input
                        id="specialties"
                        name="specialties"
                        defaultValue={artist.specialties || ""}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        defaultValue={artist.bio || ""}
                        className="h-32"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full md:w-auto"
                    disabled={updateArtistMutation.isPending}
                  >
                    {updateArtistMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
