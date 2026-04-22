import { useEffect, useState, type CSSProperties } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  MapPin,
  DollarSign,
  Clock,
  Palette,
  Ruler,
  User,
  Star,
  Check,
  X,
  ArrowLeft,
  Loader2,
  Calendar,
  Sparkles,
} from "lucide-react";
import UpgradePrompt from "@/components/UpgradePrompt";
import {
  canUseAiBidAssistant,
  isFreeArtistTier,
  isFreeClientTier,
  toLegacyArtistTier,
  type ArtistCanonicalTier,
} from "@shared/tierCompat";
import { TIER_LIMITS, type ArtistTierKey } from "@shared/tierLimits";

const FONT_FAMILY_OPTIONS = [
  { label: "System Sans", value: "ui-sans-serif, system-ui, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Monospace", value: "'Courier New', monospace" },
  { label: "Display", value: "'Trebuchet MS', 'Segoe UI', sans-serif" },
  { label: "Script", value: "'Brush Script MT', cursive" },
] as const;

const FONT_WEIGHT_OPTIONS = [
  { label: "Regular", value: "400" },
  { label: "Medium", value: "500" },
  { label: "Semibold", value: "600" },
  { label: "Bold", value: "700" },
] as const;

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function RequestDetail() {
  const [, params] = useRoute("/requests/:id");
  const requestId = parseInt(params?.id || "0");
  const { user } = useAuth();

  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [bidForm, setBidForm] = useState({
    priceEstimate: "",
    estimatedHours: "",
    message: "",
    availableDate: "",
    portfolioLinks: "",
  });
  const [textFontFamily, setTextFontFamily] = useState<string>(
    FONT_FAMILY_OPTIONS[0].value,
  );
  const [textFontWeight, setTextFontWeight] = useState<string>("500");
  const [textColor, setTextColor] = useState<string>("#111827");
  const [titleFontSize, setTitleFontSize] = useState<number>(30);
  const [bodyFontSize, setBodyFontSize] = useState<number>(14);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [overlayText, setOverlayText] = useState<string>("");
  const [overlayFontFamily, setOverlayFontFamily] = useState<string>(
    FONT_FAMILY_OPTIONS[0].value,
  );
  const [overlayFontWeight, setOverlayFontWeight] = useState<string>("700");
  const [overlayFontSize, setOverlayFontSize] = useState<number>(26);
  const [overlayColor, setOverlayColor] = useState<string>("#ffffff");
  const [overlayX, setOverlayX] = useState<number>(50);
  const [overlayY, setOverlayY] = useState<number>(80);

  const {
    data: request,
    isLoading,
    refetch,
  } = trpc.requests.getById.useQuery(
    { id: requestId },
    { enabled: requestId > 0 },
  );

  const { data: artistProfile } = trpc.artists.getByUserId.useQuery(undefined, {
    enabled: user?.role === "artist",
  });

  const submitBid = trpc.bids.create.useMutation({
    onSuccess: () => {
      toast.success("Bid Submitted! Your bid has been sent to the client.");
      setBidDialogOpen(false);
      refetch();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to submit bid");
    },
  });

  const draftBid = trpc.bids.draftBid.useMutation({
    onSuccess: (data) => {
      setBidForm((prev) => ({
        ...prev,
        priceEstimate:
          data.suggestedPrice > 0
            ? String(data.suggestedPrice)
            : prev.priceEstimate,
        estimatedHours:
          data.suggestedHours > 0
            ? String(data.suggestedHours)
            : prev.estimatedHours,
        message: data.message || prev.message,
      }));
      setAiDraftLoading(false);
      if (data.pricingRationale) {
        toast.info(data.pricingRationale, { duration: 6000 });
      }
    },
    onError: (error: { message?: string }) => {
      setAiDraftLoading(false);
      toast.error(
        error.message || "AI draft failed — write your bid manually.",
      );
    },
  });

  const handleAiDraft = () => {
    setAiDraftLoading(true);
    draftBid.mutate({ requestId });
  };

  const acceptBid = trpc.bids.accept.useMutation({
    onSuccess: () => {
      toast.success("Bid Accepted! The artist has been notified.");
      refetch();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to accept bid");
    },
  });

  const handleSubmitBid = () => {
    const trimmedPrice = bidForm.priceEstimate.trim();
    const trimmedHours = bidForm.estimatedHours.trim();

    const parsedPrice = parseFloat(trimmedPrice);
    const parsedHours = trimmedHours ? parseInt(trimmedHours, 10) : undefined;

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      toast.error("Please enter a valid price estimate.");
      return;
    }

    if (trimmedHours && (!Number.isFinite(parsedHours) || parsedHours! <= 0)) {
      toast.error("Please enter a valid number of hours.");
      return;
    }

    if (!bidForm.message.trim()) {
      toast.error("Please enter a message for the client.");
      return;
    }

    submitBid.mutate({
      requestId,
      priceEstimate: Math.round(parsedPrice * 100),
      estimatedHours: parsedHours,
      message: bidForm.message,
      availableDate: bidForm.availableDate || undefined,
      portfolioLinks: bidForm.portfolioLinks || undefined,
    });
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`;

  type BidType = NonNullable<typeof request>["bids"][number];
  type ImageType = NonNullable<typeof request>["images"][number];

  useEffect(() => {
    if (!request?.images?.length) {
      setSelectedImageId(null);
      return;
    }

    const stillExists = request.images.some(
      (image: ImageType) => image.id === selectedImageId,
    );
    if (!stillExists) {
      setSelectedImageId(request.images[0].id);
    }
  }, [request?.images, selectedImageId]);

  const isClient = user?.role === "client";
  const isArtist = user?.role === "artist";
  const isOwner = request?.client.userId === user?.id;
  const ownerTier = (user?.subscriptionTier ??
    request?.client.subscriptionTier ??
    "client_free") as string | null | undefined;
  const isPaidClientOwner = Boolean(
    isClient && isOwner && !isFreeClientTier(ownerTier),
  );
  const isFreeClientOwner = Boolean(
    isClient && isOwner && isFreeClientTier(ownerTier),
  );
  const hasAlreadyBid = request?.bids.some(
    (b: BidType) => b.artist.userId === user?.id,
  );
  // Per-tier monthly bid quota logic
  const isFreeTier = isFreeArtistTier(artistProfile?.subscriptionTier);
  const canonicalTier = (artistProfile?.subscriptionTier ?? "artist_free") as ArtistCanonicalTier;
  const legacyTier = toLegacyArtistTier(canonicalTier) as ArtistTierKey;
  const tierLimits = TIER_LIMITS[legacyTier] ?? TIER_LIMITS.free;
  const bidsPerMonth = tierLimits.bidsPerMonth;
  const isUnlimitedBids = bidsPerMonth === Number.MAX_SAFE_INTEGER;
  // Auto-reset: if the stored month doesn't match current month, treat counter as 0
  const currentMonth = new Date().toISOString().slice(0, 7);
  const effectiveBidsThisMonth =
    artistProfile?.bidsMonthYear === currentMonth
      ? (artistProfile?.bidsThisMonth ?? 0)
      : 0;
  const bidsRemaining = isUnlimitedBids
    ? Number.MAX_SAFE_INTEGER
    : Math.max(0, bidsPerMonth - effectiveBidsThisMonth);
  const canBid = bidsPerMonth > 0 && (isUnlimitedBids || bidsRemaining > 0);

  const detailTitleStyle: CSSProperties | undefined = isPaidClientOwner
    ? {
        fontFamily: textFontFamily,
        fontWeight: textFontWeight as CSSProperties["fontWeight"],
        fontSize: `${titleFontSize}px`,
        color: textColor,
      }
    : undefined;

  const detailBodyStyle: CSSProperties | undefined = isPaidClientOwner
    ? {
        fontFamily: textFontFamily,
        fontWeight: textFontWeight as CSSProperties["fontWeight"],
        fontSize: `${bodyFontSize}px`,
        color: textColor,
      }
    : undefined;

  const resetTextStyle = () => {
    setTextFontFamily(FONT_FAMILY_OPTIONS[0].value);
    setTextFontWeight("500");
    setTextColor("#111827");
    setTitleFontSize(30);
    setBodyFontSize(14);
  };

  const clearOverlay = () => {
    setOverlayText("");
    setOverlayFontFamily(FONT_FAMILY_OPTIONS[0].value);
    setOverlayFontWeight("700");
    setOverlayFontSize(26);
    setOverlayColor("#ffffff");
    setOverlayX(50);
    setOverlayY(80);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Request not found</h1>
        <Link href="/requests">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Request Board
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Back button */}
      <Link href="/requests">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Request Board
        </Button>
      </Link>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Request details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl" style={detailTitleStyle}>
                    {request.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <User className="h-4 w-4" />
                    Posted by {request.client.displayName}
                  </CardDescription>
                </div>
                <Badge
                  variant={request.status === "open" ? "default" : "secondary"}
                >
                  {request.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Images */}
              {request.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {request.images.map((image: ImageType) => (
                    <div
                      key={image.id}
                      className={`relative aspect-square overflow-hidden rounded-lg ${
                        image.isMainImage ? "col-span-2 row-span-2" : ""
                      } ${
                        isPaidClientOwner && selectedImageId === image.id
                          ? "ring-2 ring-primary/70"
                          : ""
                      }`}
                      onClick={() => {
                        if (!isPaidClientOwner) return;
                        setSelectedImageId(image.id);
                      }}
                      onKeyDown={(event) => {
                        if (!isPaidClientOwner) return;
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedImageId(image.id);
                        }
                      }}
                      role={isPaidClientOwner ? "button" : undefined}
                      tabIndex={isPaidClientOwner ? 0 : undefined}
                      aria-label={
                        isPaidClientOwner
                          ? `Select image ${image.id} for text overlay`
                          : undefined
                      }
                    >
                      <img
                        src={image.imageUrl}
                        alt={image.caption || "Reference image"}
                        className="object-cover w-full h-full"
                      />
                      {isPaidClientOwner &&
                        overlayText.trim() &&
                        selectedImageId === image.id && (
                          <div className="pointer-events-none absolute inset-0">
                            <span
                              className="absolute max-w-[90%] whitespace-pre-wrap break-words drop-shadow-[0_2px_6px_rgba(0,0,0,0.75)]"
                              style={{
                                left: `${overlayX}%`,
                                top: `${overlayY}%`,
                                transform: "translate(-50%, -50%)",
                                fontFamily: overlayFontFamily,
                                fontWeight:
                                  overlayFontWeight as CSSProperties["fontWeight"],
                                fontSize: `${overlayFontSize}px`,
                                color: overlayColor,
                                lineHeight: 1.1,
                              }}
                            >
                              {overlayText}
                            </span>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2" style={detailBodyStyle}>
                  Description
                </h3>
                <p
                  className="text-muted-foreground whitespace-pre-wrap"
                  style={detailBodyStyle}
                >
                  {request.description}
                </p>
              </div>

              <Separator />

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4" style={detailBodyStyle}>
                {request.style && (
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Style:</strong> {request.style}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Size:</strong> {request.size}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Placement:</strong> {request.placement}
                  </span>
                </div>
                {request.colorPreference && (
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Color:</strong>{" "}
                      {request.colorPreference.replace("_", " & ")}
                    </span>
                  </div>
                )}
                {(request.budgetMin || request.budgetMax) && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Budget:</strong>{" "}
                      {request.budgetMin && request.budgetMax
                        ? `${formatPrice(request.budgetMin)} - ${formatPrice(request.budgetMax)}`
                        : request.budgetMin
                          ? `From ${formatPrice(request.budgetMin)}`
                          : `Up to ${formatPrice(request.budgetMax!)}`}
                    </span>
                  </div>
                )}
                {request.desiredTimeframe && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Timeframe:</strong> {request.desiredTimeframe}
                    </span>
                  </div>
                )}
                {(request.preferredCity || request.preferredState) && (
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Location:</strong>{" "}
                      {[request.preferredCity, request.preferredState]
                        .filter(Boolean)
                        .join(", ")}
                      {request.willingToTravel && " (willing to travel)"}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bids section */}
          <Card>
            <CardHeader>
              <CardTitle>Bids ({request.bids.length})</CardTitle>
              <CardDescription>
                {isOwner
                  ? "Review bids from artists interested in your project"
                  : "Artists who have submitted proposals"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {request.bids.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No bids yet. Be the first to submit a proposal!
                </p>
              ) : (
                <div className="space-y-4">
                  {request.bids.map((bid: BidType) => (
                    <Card
                      key={bid.id}
                      className={
                        bid.status === "accepted" ? "border-green-500" : ""
                      }
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {bid.artist.shopName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <Link href={`/artist/${bid.artist.id}`}>
                                <span className="font-semibold hover:underline cursor-pointer">
                                  {bid.artist.shopName}
                                </span>
                              </Link>
                              {bid.artist.averageRating && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  {bid.artist.averageRating}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">
                              {formatPrice(bid.priceEstimate)}
                            </p>
                            {bid.estimatedHours && (
                              <p className="text-sm text-muted-foreground">
                                ~{bid.estimatedHours} hours
                              </p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <p className="text-sm">{bid.message}</p>
                        {bid.availableDate && (
                          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Available:{" "}
                            {new Date(bid.availableDate).toLocaleDateString()}
                          </p>
                        )}
                        {bid.status === "accepted" && (
                          <Badge className="mt-2 bg-green-500">
                            <Check className="h-3 w-3 mr-1" />
                            Accepted
                          </Badge>
                        )}
                        {bid.status === "rejected" && (
                          <Badge variant="secondary" className="mt-2">
                            <X className="h-3 w-3 mr-1" />
                            Not Selected
                          </Badge>
                        )}
                      </CardContent>
                      {isOwner &&
                        request.status === "open" &&
                        bid.status === "pending" && (
                          <CardFooter className="border-t pt-4">
                            <Button
                              onClick={() =>
                                acceptBid.mutate({ bidId: bid.id })
                              }
                              disabled={acceptBid.isPending}
                              className="w-full"
                            >
                              {acceptBid.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="mr-2 h-4 w-4" />
                              )}
                              Accept This Bid
                            </Button>
                          </CardFooter>
                        )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Actions */}
        <div className="space-y-6">
          {/* Text and font tools for paid request owners */}
          {isPaidClientOwner && (
            <Card>
              <CardHeader>
                <CardTitle>Text &amp; Font Tools</CardTitle>
                <CardDescription>
                  Style this request text and preview text overlays on your
                  reference images.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">
                    Request Text Styling
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="request-text-font-family">
                        Font Family
                      </Label>
                      <Select
                        value={textFontFamily}
                        onValueChange={setTextFontFamily}
                      >
                        <SelectTrigger
                          id="request-text-font-family"
                          className="w-full"
                        >
                          <SelectValue placeholder="Choose a font family" />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_FAMILY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="request-text-font-weight">
                        Font Weight
                      </Label>
                      <Select
                        value={textFontWeight}
                        onValueChange={setTextFontWeight}
                      >
                        <SelectTrigger
                          id="request-text-font-weight"
                          className="w-full"
                        >
                          <SelectValue placeholder="Choose a font weight" />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_WEIGHT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="request-title-font-size">
                          Title Size
                        </Label>
                        <Input
                          id="request-title-font-size"
                          type="number"
                          min={20}
                          max={56}
                          value={titleFontSize}
                          onChange={(event) => {
                            const parsed = Number(event.target.value);
                            if (Number.isNaN(parsed)) return;
                            setTitleFontSize(clampNumber(parsed, 20, 56));
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="request-body-font-size">
                          Body Size
                        </Label>
                        <Input
                          id="request-body-font-size"
                          type="number"
                          min={12}
                          max={28}
                          value={bodyFontSize}
                          onChange={(event) => {
                            const parsed = Number(event.target.value);
                            if (Number.isNaN(parsed)) return;
                            setBodyFontSize(clampNumber(parsed, 12, 28));
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="request-text-color">Text Color</Label>
                      <Input
                        id="request-text-color"
                        type="color"
                        value={textColor}
                        onChange={(event) => setTextColor(event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Image Text Overlay</h3>
                  <div className="space-y-2">
                    <Label htmlFor="overlay-target-image">Target Image</Label>
                    <Select
                      value={
                        selectedImageId ? String(selectedImageId) : undefined
                      }
                      onValueChange={(value) =>
                        setSelectedImageId(Number(value))
                      }
                    >
                      <SelectTrigger
                        id="overlay-target-image"
                        className="w-full"
                      >
                        <SelectValue placeholder="Select an image" />
                      </SelectTrigger>
                      <SelectContent>
                        {request.images.map(
                          (image: ImageType, index: number) => (
                            <SelectItem key={image.id} value={String(image.id)}>
                              Image {index + 1}
                              {image.isMainImage ? " (Main)" : ""}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overlay-text">Overlay Text</Label>
                    <Textarea
                      id="overlay-text"
                      rows={3}
                      maxLength={200}
                      placeholder="Add text to preview on the selected image..."
                      value={overlayText}
                      onChange={(event) => setOverlayText(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overlay-font-family">
                      Overlay Font Family
                    </Label>
                    <Select
                      value={overlayFontFamily}
                      onValueChange={setOverlayFontFamily}
                    >
                      <SelectTrigger
                        id="overlay-font-family"
                        className="w-full"
                      >
                        <SelectValue placeholder="Choose overlay font family" />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_FAMILY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overlay-font-weight">
                      Overlay Font Weight
                    </Label>
                    <Select
                      value={overlayFontWeight}
                      onValueChange={setOverlayFontWeight}
                    >
                      <SelectTrigger
                        id="overlay-font-weight"
                        className="w-full"
                      >
                        <SelectValue placeholder="Choose overlay font weight" />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_WEIGHT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="overlay-font-size">Font Size</Label>
                      <Input
                        id="overlay-font-size"
                        type="number"
                        min={10}
                        max={120}
                        value={overlayFontSize}
                        onChange={(event) => {
                          const parsed = Number(event.target.value);
                          if (Number.isNaN(parsed)) return;
                          setOverlayFontSize(clampNumber(parsed, 10, 120));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="overlay-color">Text Color</Label>
                      <Input
                        id="overlay-color"
                        type="color"
                        value={overlayColor}
                        onChange={(event) =>
                          setOverlayColor(event.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="overlay-x-position">X Position (%)</Label>
                      <Input
                        id="overlay-x-position"
                        type="number"
                        min={0}
                        max={100}
                        value={overlayX}
                        onChange={(event) => {
                          const parsed = Number(event.target.value);
                          if (Number.isNaN(parsed)) return;
                          setOverlayX(clampNumber(parsed, 0, 100));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="overlay-y-position">Y Position (%)</Label>
                      <Input
                        id="overlay-y-position"
                        type="number"
                        min={0}
                        max={100}
                        value={overlayY}
                        onChange={(event) => {
                          const parsed = Number(event.target.value);
                          if (Number.isNaN(parsed)) return;
                          setOverlayY(clampNumber(parsed, 0, 100));
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={resetTextStyle}
                >
                  Reset Text Style
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearOverlay}
                >
                  Clear Overlay
                </Button>
              </CardFooter>
            </Card>
          )}

          {isFreeClientOwner && (
            <UpgradePrompt
              feature="Text & Font Tools"
              description="Upgrade to Client Plus or Elite to style request text and add image text overlays."
            />
          )}

          {/* Submit bid card (for artists) */}
          {isArtist &&
            request.status === "open" &&
            !hasAlreadyBid &&
            artistProfile && (
              <Card>
                <CardHeader>
                  <CardTitle>Interested?</CardTitle>
                  <CardDescription>
                    Submit your proposal to work on this tattoo.
                    {!isFreeTier && !isUnlimitedBids && canBid && (
                      <span className="block font-semibold text-primary mt-1">
                        {bidsRemaining} of {bidsPerMonth} bids remaining this month.
                      </span>
                    )}
                    {!isFreeTier && !isUnlimitedBids && !canBid && (
                      <span className="block font-semibold text-destructive mt-1">
                        Monthly bid limit reached ({bidsPerMonth}/{bidsPerMonth}). Resets on the 1st.
                      </span>
                    )}
                    {isUnlimitedBids && (
                      <span className="block font-semibold text-primary mt-1">
                        Unlimited bids — Icon plan.
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {canBid ? (
                    <Dialog
                      open={bidDialogOpen}
                      onOpenChange={setBidDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button className="w-full">Submit a Bid</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Submit Your Bid</DialogTitle>
                          <DialogDescription>
                            Provide your pricing and availability for this
                            tattoo request.
                          </DialogDescription>
                        </DialogHeader>

                        {/* AI Bid Assistant — Professional/Icon tier only */}
                        {artistProfile &&
                          canUseAiBidAssistant(
                            artistProfile.subscriptionTier,
                          ) && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={handleAiDraft}
                              disabled={aiDraftLoading}
                            >
                              {aiDraftLoading ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />
                              )}
                              {aiDraftLoading
                                ? "Drafting with AI..."
                                : "AI Draft Bid"}
                            </Button>
                          )}

                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="price">Your Price ($) *</Label>
                            <Input
                              id="price"
                              type="number"
                              placeholder="500"
                              value={bidForm.priceEstimate}
                              onChange={(e) =>
                                setBidForm({
                                  ...bidForm,
                                  priceEstimate: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div>
                            <Label htmlFor="hours">Estimated Hours</Label>
                            <Input
                              id="hours"
                              type="number"
                              placeholder="4"
                              value={bidForm.estimatedHours}
                              onChange={(e) =>
                                setBidForm({
                                  ...bidForm,
                                  estimatedHours: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div>
                            <Label htmlFor="message">Your Pitch *</Label>
                            <Textarea
                              id="message"
                              placeholder="Tell the client why you're the perfect artist for this piece..."
                              rows={4}
                              value={bidForm.message}
                              onChange={(e) =>
                                setBidForm({
                                  ...bidForm,
                                  message: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div>
                            <Label htmlFor="date">Available Date</Label>
                            <Input
                              id="date"
                              type="datetime-local"
                              value={bidForm.availableDate}
                              onChange={(e) =>
                                setBidForm({
                                  ...bidForm,
                                  availableDate: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div>
                            <Label htmlFor="links">
                              Relevant Portfolio Links
                            </Label>
                            <Textarea
                              id="links"
                              placeholder="Links to similar work you've done..."
                              rows={2}
                              value={bidForm.portfolioLinks}
                              onChange={(e) =>
                                setBidForm({
                                  ...bidForm,
                                  portfolioLinks: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>

                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setBidDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSubmitBid}
                            disabled={
                              submitBid.isPending ||
                              !bidForm.priceEstimate ||
                              !bidForm.message ||
                              bidForm.message.length < 20
                            }
                          >
                            {submitBid.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Submit Bid
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  ) : isFreeTier ? (
                    <UpgradePrompt
                      feature="Bid on Client Posts"
                      description="Bidding on client tattoo idea posts requires a paid plan. Upgrade to the Artist plan ($9/mo) to submit up to 15 proposals per month."
                    />
                  ) : (
                    <UpgradePrompt
                      feature="More Bids This Month"
                      description={`You've used all ${bidsPerMonth} bids for this month. Upgrade your plan for a higher monthly quota, or wait until the 1st to get a fresh ${bidsPerMonth} bids.`}
                    />
                  )}
                </CardContent>
              </Card>
            )}

          {/* Already bid message */}
          {isArtist && hasAlreadyBid && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  You've already submitted a bid for this request.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Client info */}
          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {request.client.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{request.client.displayName}</p>
                  {request.client.city && request.client.state && (
                    <p className="text-sm text-muted-foreground">
                      {request.client.city}, {request.client.state}
                    </p>
                  )}
                </div>
              </div>
              {request.client.bio && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {request.client.bio}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Sign in prompt for non-users */}
          {!user && (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground mb-4">
                  Sign in as an artist to submit a bid
                </p>
                <Link href="/login">
                  <Button className="w-full">Sign In</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
