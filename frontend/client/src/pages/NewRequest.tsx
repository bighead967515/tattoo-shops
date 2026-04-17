import { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Upload,
  X,
  Sparkles,
  MessageCircleQuestion,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const TATTOO_STYLES = [
  "Traditional",
  "Neo-Traditional",
  "Realism",
  "Watercolor",
  "Blackwork",
  "Tribal",
  "Japanese",
  "Minimalist",
  "Geometric",
  "Dotwork",
  "Trash Polka",
  "New School",
  "Illustrative",
];

const SIZES = [
  { value: "tiny", label: "Tiny (< 2 inches)" },
  { value: "small", label: "Small (2-4 inches)" },
  { value: "medium", label: "Medium (4-6 inches)" },
  { value: "large", label: "Large (6-10 inches)" },
  { value: "extra-large", label: "Extra Large (10+ inches)" },
  { value: "half-sleeve", label: "Half Sleeve" },
  { value: "full-sleeve", label: "Full Sleeve" },
  { value: "back-piece", label: "Back Piece" },
];

const PLACEMENTS = [
  "Arm - Upper",
  "Arm - Forearm",
  "Arm - Wrist",
  "Leg - Thigh",
  "Leg - Calf",
  "Leg - Ankle",
  "Back - Upper",
  "Back - Lower",
  "Back - Full",
  "Chest",
  "Shoulder",
  "Ribs",
  "Neck",
  "Hand",
  "Foot",
  "Other",
];

const TIMEFRAMES = [
  "ASAP",
  "Within 2 weeks",
  "Within 1 month",
  "Within 3 months",
  "Flexible / No rush",
];

export default function NewRequest() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    style: "",
    placement: "",
    size: "",
    colorPreference: "",
    budgetMin: "",
    budgetMax: "",
    preferredCity: "",
    preferredState: "",
    willingToTravel: false,
    desiredTimeframe: "",
  });

  const [uploadedImages, setUploadedImages] = useState<
    { file: File; preview: string }[]
  >([]);
  const blobUrlsRef = useRef<string[]>([]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      blobUrlsRef.current = [];
    };
  }, []);

  const { data: clientProfile } = trpc.clients.getMyProfile.useQuery();

  const createRequest = trpc.requests.create.useMutation();
  const getUploadUrl = trpc.requests.getUploadUrl.useMutation();
  const addImageToRequest = trpc.requests.addImage.useMutation();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Calculate available slots before creating blob URLs
    const availableSlots = 5 - uploadedImages.length;
    if (availableSlots <= 0) return;

    // Only process up to availableSlots files
    const filesToProcess = Array.from(files).slice(0, availableSlots);

    const newImages = filesToProcess.map((file) => {
      const preview = URL.createObjectURL(file);
      blobUrlsRef.current.push(preview);
      return { file, preview };
    });

    setUploadedImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => {
      const urlToRevoke = prev[index].preview;
      URL.revokeObjectURL(urlToRevoke);
      blobUrlsRef.current = blobUrlsRef.current.filter(
        (url) => url !== urlToRevoke,
      );
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Create the text-based request and get its ID
      const newRequest = await createRequest.mutateAsync({
        title: formData.title,
        description: formData.description,
        style: formData.style || undefined,
        placement: formData.placement,
        size: formData.size,
        colorPreference: formData.colorPreference as
          | "color"
          | "black_and_grey"
          | "either"
          | undefined,
        budgetMin: formData.budgetMin
          ? Math.round(parseFloat(formData.budgetMin) * 100)
          : undefined,
        budgetMax: formData.budgetMax
          ? Math.round(parseFloat(formData.budgetMax) * 100)
          : undefined,
        preferredCity: formData.preferredCity || undefined,
        preferredState: formData.preferredState || undefined,
        willingToTravel: formData.willingToTravel,
        desiredTimeframe: formData.desiredTimeframe || undefined,
      });

      // 2. If images are present, upload them using Promise.allSettled
      if (uploadedImages.length > 0) {
        toast.info("Uploading images...");
        const uploadResults = await Promise.allSettled(
          uploadedImages.map(async (img, index) => {
            const { signedUrl, path } = await getUploadUrl.mutateAsync({
              fileName: img.file.name,
              contentType: img.file.type,
            });

            const response = await fetch(signedUrl, {
              method: "PUT",
              body: img.file,
              headers: { "Content-Type": img.file.type },
            });

            if (!response.ok)
              throw new Error(`Failed to upload ${img.file.name}`);

            await addImageToRequest.mutateAsync({
              requestId: newRequest.id,
              imageKey: path,
              isMainImage: index === 0, // Set the first image as the main one
            });

            return img.file.name;
          }),
        );

        const failedUploads = uploadResults
          .filter(
            (result): result is PromiseRejectedResult =>
              result.status === "rejected",
          )
          .map((result) => result.reason?.message || "Unknown error");

        if (
          failedUploads.length > 0 &&
          failedUploads.length === uploadedImages.length
        ) {
          // All uploads failed - still redirect but show warning
          toast.warning(
            `Request created, but image uploads failed: ${failedUploads.join(", ")}`,
          );
        } else if (failedUploads.length > 0) {
          toast.warning(
            `Some images failed to upload: ${failedUploads.join(", ")}`,
          );
        }
      }

      toast.success("Request posted successfully!");
      setLocation(`/requests/${newRequest.id}`);
    } catch (error: any) {
      toast.error(
        error.message || "An error occurred while posting your request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect non-clients
  if (user && user.role !== "client") {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Client Account Required</h1>
        <p className="text-muted-foreground mb-4">
          You need a client account to post tattoo requests.
        </p>
        <Link href="/client/onboarding">
          <Button>Create Client Profile</Button>
        </Link>
      </div>
    );
  }

  if (user?.role === "client" && !clientProfile) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Complete Your Profile</h1>
        <p className="text-muted-foreground mb-4">
          Please complete your client profile before posting a request.
        </p>
        <Link href="/client/onboarding">
          <Button>Complete Onboarding</Button>
        </Link>
      </div>
    );
  }

  const isValid =
    formData.title.length >= 5 &&
    formData.description.length >= 20 &&
    formData.placement &&
    formData.size;

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Link href="/requests">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Request Board
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Post a Tattoo Request</CardTitle>
          <CardDescription>
            Describe your dream tattoo and let artists bid on your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="E.g., Realistic lion portrait on forearm"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
              <p className="text-sm text-muted-foreground mt-1">
                A short, descriptive title for your request
              </p>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your tattoo idea in detail. Include any specific elements, meaning, or references you want the artist to incorporate..."
                rows={5}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
              <p className="text-sm text-muted-foreground mt-1">
                {formData.description.length}/5000 characters (minimum 20)
              </p>

              {/* AI Prompt Refiner */}
              <PromptRefinerSection
                description={formData.description}
                context={{
                  title: formData.title,
                  style: formData.style,
                  placement: formData.placement,
                  size: formData.size,
                  colorPreference: formData.colorPreference,
                }}
                onUseImproved={(improved) =>
                  setFormData({ ...formData, description: improved })
                }
              />
            </div>

            {/* Reference Images */}
            <div>
              <Label>Reference Images</Label>
              <div className="mt-2">
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {uploadedImages.map((img, index) => (
                      <div key={index} className="relative aspect-square">
                        <img
                          src={img.preview}
                          alt={`Reference ${index + 1}`}
                          className="object-cover w-full h-full rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {uploadedImages.length < 5 && (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload reference images
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {uploadedImages.length}/5 images
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Upload inspiration or reference images (optional, max 5)
              </p>
            </div>

            {/* Style & Size Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="style">Tattoo Style</Label>
                <Select
                  value={formData.style}
                  onValueChange={(value) =>
                    setFormData({ ...formData, style: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a style" />
                  </SelectTrigger>
                  <SelectContent>
                    {TATTOO_STYLES.map((style) => (
                      <SelectItem key={style} value={style}>
                        {style}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="size">Size *</Label>
                <Select
                  value={formData.size}
                  onValueChange={(value) =>
                    setFormData({ ...formData, size: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZES.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Size directly affects price and session time.
                </p>
              </div>
            </div>

            {/* Placement */}
            <div>
              <Label htmlFor="placement">Placement on Body *</Label>
              <Select
                value={formData.placement}
                onValueChange={(value) =>
                  setFormData({ ...formData, placement: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Where on your body?" />
                </SelectTrigger>
                <SelectContent>
                  {PLACEMENTS.map((placement) => (
                    <SelectItem key={placement} value={placement}>
                      {placement}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Artists plan stencils, sizing, and flow around exact body placement — be as specific as possible.
              </p>
            </div>

            {/* Color Preference */}
            <div>
              <Label htmlFor="color">Color Preference</Label>
              <Select
                value={formData.colorPreference}
                onValueChange={(value) =>
                  setFormData({ ...formData, colorPreference: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Color or black & grey?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="color">Full Color</SelectItem>
                  <SelectItem value="black_and_grey">Black & Grey</SelectItem>
                  <SelectItem value="either">Either is fine</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Budget */}
            <div>
              <Label>Budget Range (USD)</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Input
                    type="number"
                    placeholder="Min (e.g., 200)"
                    value={formData.budgetMin}
                    onChange={(e) =>
                      setFormData({ ...formData, budgetMin: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Max (e.g., 500)"
                    value={formData.budgetMax}
                    onChange={(e) =>
                      setFormData({ ...formData, budgetMax: e.target.value })
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Typical ranges: small pieces $100–300 · medium $300–700 · sleeves &amp; back pieces $1,500+. Honest budgets attract better bids.
              </p>
            </div>

            {/* Location */}
            <div>
              <Label>Preferred Location</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Input
                  placeholder="City"
                  value={formData.preferredCity}
                  onChange={(e) =>
                    setFormData({ ...formData, preferredCity: e.target.value })
                  }
                />
                <Input
                  placeholder="State"
                  value={formData.preferredState}
                  onChange={(e) =>
                    setFormData({ ...formData, preferredState: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="travel"
                  checked={formData.willingToTravel}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      willingToTravel: checked as boolean,
                    })
                  }
                />
                <label
                  htmlFor="travel"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  I'm willing to travel for the right artist
                </label>
              </div>
            </div>

            {/* Timeframe */}
            <div>
              <Label htmlFor="timeframe">Desired Timeframe</Label>
              <Select
                value={formData.desiredTimeframe}
                onValueChange={(value) =>
                  setFormData({ ...formData, desiredTimeframe: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="When do you want this done?" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map((tf) => (
                    <SelectItem key={tf} value={tf}>
                      {tf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              disabled={!isValid || createRequest.isPending}
            >
              {createRequest.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Post Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// AI Prompt Refiner Component
// ============================================
function PromptRefinerSection({
  description,
  context,
  onUseImproved,
}: {
  description: string;
  context: {
    title?: string;
    style?: string;
    placement?: string;
    size?: string;
    colorPreference?: string;
  };
  onUseImproved: (improved: string) => void;
}) {
  const refine = trpc.requests.refineDescription.useMutation();
  const [lastRefinedDesc, setLastRefinedDesc] = useState("");

  // Track whether the description has changed since the last refinement
  const isStale = refine.data && description !== lastRefinedDesc;

  const handleRefine = () => {
    if (description.length < 10) {
      toast.error(
        "Write at least a short description before getting AI feedback.",
      );
      return;
    }
    setLastRefinedDesc(description);
    refine.mutate({
      description,
      title: context.title || undefined,
      style: context.style || undefined,
      placement: context.placement || undefined,
      size: context.size || undefined,
      colorPreference: context.colorPreference || undefined,
    });
  };

  if (!refine.data && !refine.isPending) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={handleRefine}
        disabled={description.length < 10}
      >
        <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />
        {isStale ? "Re-analyze (description changed)" : "Get AI Feedback"}
      </Button>
    );
  }

  if (refine.isPending) {
    return (
      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        AI is analyzing your description...
      </div>
    );
  }

  if (refine.isError) {
    return (
      <div className="mt-3 text-sm text-destructive">
        AI analysis failed. You can still submit your request.
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRefine}
          className="ml-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  const data = refine.data;
  if (!data) return null;

  const scoreColor =
    data.completenessScore >= 7
      ? "text-green-600 dark:text-green-400"
      : data.completenessScore >= 4
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-red-500";

  const ScoreIcon =
    data.completenessScore >= 7
      ? CheckCircle2
      : data.completenessScore >= 4
        ? MessageCircleQuestion
        : AlertTriangle;

  return (
    <Card
      className={`mt-3 bg-primary/5 border-primary/20 ${isStale ? "opacity-60" : ""}`}
    >
      <CardContent className="pt-4 pb-3 space-y-3">
        {/* Stale warning */}
        {isStale && (
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            Description changed since last analysis.
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2"
              onClick={handleRefine}
            >
              Re-analyze
            </Button>
          </div>
        )}
        {/* Score header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScoreIcon className={`w-4 h-4 ${scoreColor}`} />
            <span className={`text-sm font-medium ${scoreColor}`}>
              Completeness: {data.completenessScore}/10
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={handleRefine}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Re-analyze
          </Button>
        </div>

        {/* Suggested questions */}
        {data.suggestedQuestions.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1.5">
              To help artists give you the best bid, consider answering:
            </p>
            <ul className="space-y-1">
              {data.suggestedQuestions.map((q, i) => (
                <li
                  key={i}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <MessageCircleQuestion className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing aspects badges */}
        {data.missingAspects.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.missingAspects.map((aspect) => (
              <Badge key={aspect} variant="outline" className="text-xs">
                {aspect.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        )}

        {/* Improved description suggestion */}
        {data.improvedDescription && (
          <div className="bg-background/60 rounded-md p-3 border">
            <p className="text-xs font-medium mb-1">
              Suggested improved description:
            </p>
            <p className="text-sm text-muted-foreground italic mb-2">
              "{data.improvedDescription}"
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="text-xs h-7"
              onClick={() => onUseImproved(data.improvedDescription!)}
            >
              Use this description
            </Button>
          </div>
        )}

        {/* Tip */}
        {data.tip && (
          <p className="text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 inline mr-1 text-primary" />
            {data.tip}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
