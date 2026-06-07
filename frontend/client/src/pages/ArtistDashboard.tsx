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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Gavel,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";
import { format } from "date-fns";
import ArtistDashboardFeed from "@/components/ArtistDashboardFeed";
import UpgradePrompt from "@/components/UpgradePrompt";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import axios from "axios";
import { getArtistTierLimits, type ArtistSubscriptionTier } from "@shared/tierLimits";
import { Link } from "wouter";

export default function ArtistDashboard() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [showAddFlashDialog, setShowAddFlashDialog] = useState(false);
  const [flashTitle, setFlashTitle] = useState("");
  const [flashDescription, setFlashDescription] = useState("");
  const [flashPrice, setFlashPrice] = useState("");
  const [flashDeposit, setFlashDeposit] = useState("");
  const [flashFile, setFlashFile] = useState<File | null>(null);
  const [isUploadingFlash, setIsUploadingFlash] = useState(false);
  const [flashUploadProgress, setFlashUploadProgress] = useState<number | null>(null);
  const [flashUploadError, setFlashUploadError] = useState<string | null>(null);

  const {
    data: artist,
    isLoading: artistLoading,
    refetch: refetchArtist,
  } = trpc.artists.getByUserId.useQuery(undefined, { enabled: !!user });

  const {
    data: flashArtItems,
    isLoading: flashLoading,
    refetch: refetchFlash,
  } = trpc.flash.getMyFlash.useQuery(
    { artistId: artist?.id || 0 },
    { enabled: !!artist && user?.subscriptionTier === "artist_elite" },
  );

  const getFlashUploadUrlMutation = trpc.flash.getUploadUrl.useMutation();
  const createFlashMutation = trpc.flash.create.useMutation({
    onSuccess: () => {
      refetchFlash();
      setShowAddFlashDialog(false);
      setFlashTitle("");
      setFlashDescription("");
      setFlashPrice("");
      setFlashDeposit("");
      setFlashFile(null);
      setIsUploadingFlash(false);
      setFlashUploadProgress(null);
      toast.success("Flash art added successfully!");
    },
    onError: (err) => {
      setIsUploadingFlash(false);
      setFlashUploadProgress(null);
      setFlashUploadError(err.message || "Failed to create flash art.");
    },
  });

  const deleteFlashMutation = trpc.flash.delete.useMutation({
    onSuccess: () => {
      refetchFlash();
      toast.success("Flash art piece removed.");
    },
    onError: (err) => {
      toast.error(`Error deleting: ${err.message}`);
    },
  });

  const handleCreateFlash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flashFile || !artist) {
      toast.error("Please select an image file first.");
      return;
    }
    const priceNum = parseFloat(flashPrice);
    const depositNum = parseFloat(flashDeposit);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Please enter a valid price.");
      return;
    }
    if (isNaN(depositNum) || depositNum <= 0) {
      toast.error("Please enter a valid deposit amount.");
      return;
    }
    if (depositNum > priceNum) {
      toast.error("Deposit amount cannot exceed the total price.");
      return;
    }

    setIsUploadingFlash(true);
    setFlashUploadProgress(0);
    setFlashUploadError(null);

    try {
      // 1. Get signed upload URL
      const { signedUrl, path } = await getFlashUploadUrlMutation.mutateAsync({
        artistId: artist.id,
        fileName: flashFile.name,
        contentType: flashFile.type,
      });

      // 2. Upload file directly to Supabase Storage
      await axios.put(signedUrl, flashFile, {
        headers: { "Content-Type": flashFile.type },
        onUploadProgress: (progressEvent) => {
          if (
            typeof progressEvent.total === "number" &&
            progressEvent.total > 0
          ) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setFlashUploadProgress(percentCompleted);
          }
        },
      });

      // 3. Construct the public URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const imageUrl = `${supabaseUrl}/storage/v1/object/public/portfolio_images/${path}`;

      // 4. Create database entry
      await createFlashMutation.mutateAsync({
        artistId: artist.id,
        imageUrl,
        imageKey: path,
        title: flashTitle,
        description: flashDescription || undefined,
        price: Math.round(priceNum * 100),
        depositAmount: Math.round(depositNum * 100),
      });
    } catch (error) {
      console.error(error);
      setIsUploadingFlash(false);
      setFlashUploadProgress(null);
      const message = error instanceof Error ? error.message : "Upload failed";
      setFlashUploadError(message);
      toast.error(`Failed to add flash art: ${message}`);
    }
  };


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
      setUploadProgress(null);
      setUploadError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Image added to portfolio!");
    },
    onError: (err) => {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadError(err.message || "Failed to save image. Tap Retry to try again.");
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
    setUploadError(null);
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
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      const message =
        error instanceof Error ? error.message : "Upload failed";
      setUploadError(
        message.includes("network") || message.includes("fetch")
          ? "Network error — check your connection and retry."
          : "Failed to upload image. Tap Retry to try again.",
      );
    }
  };

  const isElite = user?.subscriptionTier === "artist_elite";

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
          <div className="flex items-center gap-3">
            <Link href="/artist/design-lab">
              <Button variant="default" className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold shadow-lg shadow-primary/20">
                <Sparkles className="w-4 h-4 mr-2 fill-current" />
                Open AI Studio
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => setLocation(`/artist/${artist.id}`)}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Public Profile
            </Button>
          </div>
        </div>

        {/* Onboarding Checklist — shown until all steps complete */}
        {(() => {
          const portfolioCount = portfolio?.length ?? 0;
          const hasPortfolio = portfolioCount >= 3;
          const hasBio = !!(artist.bio && artist.bio.trim().length > 20);
          const hasInstagram = !!artist.instagram;
          const steps = [
            { id: "portfolio", label: "Upload 3+ portfolio photos", done: hasPortfolio, cta: "Add Photos", tab: "portfolio" },
            { id: "bio", label: "Write a bio (20+ characters)", done: hasBio, cta: "Edit Profile", tab: "settings" },
            { id: "instagram", label: "Add your Instagram handle", done: hasInstagram, cta: "Add Instagram", tab: "settings" },
          ];
          const completedCount = steps.filter(s => s.done).length;
          const allDone = completedCount === steps.length;
          if (allDone) return null;
          return (
            <Card className="mb-8 p-6 border-primary/30 bg-primary/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-lg">Complete Your Profile</h2>
                  <p className="text-sm text-muted-foreground">{completedCount} of {steps.length} steps done</p>
                </div>
                <span className="text-2xl font-bold text-primary">{Math.round((completedCount / steps.length) * 100)}%</span>
              </div>
              <Progress value={(completedCount / steps.length) * 100} className="h-2 mb-5" />
              <div className="space-y-3">
                {steps.map(step => (
                  <div key={step.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                    step.done ? "border-primary/20 bg-primary/5 opacity-60" : "border-border bg-background"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        step.done ? "bg-primary" : "border-2 border-muted-foreground"
                      }`}>
                        {step.done && (
                          <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm ${step.done ? "line-through text-muted-foreground" : "font-medium"}`}>
                        {step.label}
                      </span>
                    </div>
                    {!step.done && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-3 shrink-0"
                        onClick={() => {
                          const tabEl = document.querySelector(`[data-value="${step.tab}"]`) as HTMLElement;
                          tabEl?.click();
                        }}
                      >
                        {step.cta}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          );
        })()}

        {/* Lost Revenue Widget bypassed */}

        {/* Bookings Analytics strip */}
        {(() => {
          const totalBookings = bookings?.length ?? 0;
          const confirmedBookings = bookings?.filter((b) => b.status === "confirmed").length ?? 0;
          const pendingBookings = bookings?.filter((b) => b.status === "pending").length ?? 0;
          const completedBookings = bookings?.filter((b) => b.status === "completed").length ?? 0;
          return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg"><Calendar className="w-5 h-5 text-primary" /></div>
                  <div><p className="text-2xl font-bold">{totalBookings}</p><p className="text-xs text-muted-foreground">Total Inquiries</p></div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg"><Clock className="w-5 h-5 text-yellow-600" /></div>
                  <div><p className="text-2xl font-bold">{pendingBookings}</p><p className="text-xs text-muted-foreground">Pending Review</p></div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
                  <div><p className="text-2xl font-bold">{confirmedBookings}</p><p className="text-xs text-muted-foreground">Confirmed</p></div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg"><CheckCircle2 className="w-5 h-5 text-blue-600" /></div>
                  <div><p className="text-2xl font-bold">{completedBookings}</p><p className="text-xs text-muted-foreground">Completed</p></div>
                </div>
              </Card>
            </div>
          );
        })()}

        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="portfolio">
              <ImageIcon className="w-4 h-4 mr-2" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="bookings">
              <Calendar className="w-4 h-4 mr-2" />
              Bookings
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
                <Label>Uploading… {uploadProgress}%</Label>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
            {uploadError && (
              <div className="flex items-center gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <span className="flex-1">{uploadError}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => {
                    setUploadError(null);
                    fileInputRef.current?.click();
                  }}
                >
                  Retry
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {portfolioLoading ? (
                <p>Loading portfolio...</p>
              ) : portfolio?.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-muted/30 border border-dashed rounded-lg space-y-3">
                  <p className="text-muted-foreground">
                    Your portfolio is empty. Add your best work to attract clients!
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Your First Image
                  </Button>
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
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete this image?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove the image from your
                                portfolio. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  deletePortfolioImageMutation.mutate({
                                    id: image.id,
                                  })
                                }
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
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
                        <CardTitle className="text-lg flex items-center gap-2">
                          {booking.customerName}
                          {booking.source === "ink_connect" && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1 py-0.5 border border-primary/20 shrink-0">
                              <img src="/logo.png" alt="logo" className="w-3.5 h-3.5 object-contain" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Ink Connect</span>
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {booking.customerEmail} • {booking.customerPhone}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <Badge
                          variant={
                            booking.status === "confirmed" ? "default" : booking.status === "cancelled" ? "destructive" : "outline"
                          }
                        >
                          {booking.status}
                        </Badge>
                        {booking.refundStatus === "refunded" && (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-[10px] py-0">
                            Deposit Refunded
                          </Badge>
                        )}
                      </div>
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

          {/* Billing Tab Content removed */}

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
