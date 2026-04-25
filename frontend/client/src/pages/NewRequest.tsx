import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  X,
  Sparkles,
  MessageCircleQuestion,
  CheckCircle2,
  AlertTriangle,
  ImagePlus,
  Lightbulb,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Constants ────────────────────────────────────────────────────────────────

const TATTOO_STYLES = [
  "Traditional",
  "Neo-Traditional",
  "Realism",
  "Watercolor",
  "Blackwork",
  "Fine Line",
  "Tribal",
  "Japanese",
  "Minimalist",
  "Geometric",
  "Dotwork",
  "Trash Polka",
  "New School",
  "Illustrative",
  "Black & Grey",
];

const SIZES = [
  { value: "tiny", label: "Tiny — Patch (< 2 in)" },
  { value: "small", label: "Small (2–4 in)" },
  { value: "medium", label: "Medium (4–6 in)" },
  { value: "large", label: "Large (6–10 in)" },
  { value: "extra-large", label: "Extra Large (10+ in)" },
  { value: "half-sleeve", label: "Half Sleeve" },
  { value: "full-sleeve", label: "Full Sleeve" },
  { value: "back-piece", label: "Back Piece / Full Day" },
];

const PLACEMENTS = [
  "Forearm",
  "Upper Arm",
  "Wrist",
  "Hand",
  "Thigh",
  "Shin / Calf",
  "Ankle / Foot",
  "Chest",
  "Ribs",
  "Back — Upper",
  "Back — Lower",
  "Back — Full",
  "Shoulder",
  "Neck",
  "Other",
];

const BUDGET_PRESETS = [
  { label: "$100 – $300", min: 100, max: 300 },
  { label: "$300 – $600", min: 300, max: 600 },
  { label: "$600 – $1,000", min: 600, max: 1000 },
  { label: "$1,000+", min: 1000, max: 9999 },
];

const TIMEFRAMES = [
  "ASAP",
  "Within 2 weeks",
  "Within 1 month",
  "Within 3 months",
  "Flexible / No rush",
];

// ─── AI Prompt Refiner sub-component ─────────────────────────────────────────

interface PromptRefinerProps {
  description: string;
  context: {
    title?: string;
    style?: string;
    placement?: string;
    size?: string;
    colorPreference?: string;
  };
  onUseImproved: (improved: string) => void;
}

function PromptRefinerSection({ description, context, onUseImproved }: PromptRefinerProps) {
  const refine = trpc.requests.refineDescription.useMutation();
  const lastDescRef = useRef(description);
  const isStale = refine.data !== undefined && description !== lastDescRef.current;

  const handleRefine = () => {
    lastDescRef.current = description;
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
        className="mt-2 border-primary/30 text-primary hover:bg-primary/10"
        onClick={handleRefine}
        disabled={description.length < 10}
      >
        <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />
        Get AI Feedback
      </Button>
    );
  }

  if (refine.isPending) {
    return (
      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        AI is analyzing your description…
      </div>
    );
  }

  if (refine.isError) {
    return (
      <div className="mt-3 text-sm text-destructive flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        AI analysis failed — you can still submit as-is.
        <Button type="button" variant="ghost" size="sm" onClick={handleRefine}>
          Retry
        </Button>
      </div>
    );
  }

  const data = refine.data;
  if (!data) return null;

  const scoreColor =
    data.completenessScore >= 7
      ? "text-green-400"
      : data.completenessScore >= 4
        ? "text-yellow-400"
        : "text-red-400";
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
        {isStale && (
          <div className="flex items-center gap-2 text-xs text-amber-400">
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
        {data.suggestedQuestions.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1.5">
              To help artists give you the best bid:
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
        {data.missingAspects.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.missingAspects.map((aspect) => (
              <Badge key={aspect} variant="outline" className="text-xs">
                {aspect.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        )}
        {data.improvedDescription && (
          <div className="bg-background/60 rounded-md p-3 border border-border/50">
            <p className="text-xs font-medium mb-1">Suggested improvement:</p>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewRequest() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState<number | null>(null);
  const [selectedBudgetPreset, setSelectedBudgetPreset] = useState<
    number | null
  >(null);

  const [guestEmail, setGuestEmail] = useState("");

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
    const availableSlots = 3 - uploadedImages.length;
    if (availableSlots <= 0) return;
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

  const handleBudgetPreset = (
    preset: (typeof BUDGET_PRESETS)[0],
    idx: number,
  ) => {
    setSelectedBudgetPreset(idx);
    setFormData({
      ...formData,
      budgetMin: String(preset.min),
      budgetMax: String(preset.max),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newRequest = await createRequest.mutateAsync({
        title: formData.title,
        description: formData.description,
        style: formData.style || undefined,
        placement: formData.placement,
        size: formData.size,
        colorPreference:
          (formData.colorPreference as
            | "color"
            | "black_and_grey"
            | "either"
            | undefined) || undefined,
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
        // Only send guestEmail if user is not logged in
        guestEmail: !user && guestEmail ? guestEmail : undefined,
      });

      if (uploadedImages.length > 0) {
        toast.info("Uploading reference images…");
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
              throw new Error(`Upload failed for image ${index + 1}`);
            await addImageToRequest.mutateAsync({
              requestId: newRequest.id,
              imageKey: path,
              isMainImage: index === 0,
            });
          }),
        );
        const failedUploads = uploadResults
          .filter(
            (result): result is PromiseRejectedResult =>
              result.status === "rejected",
          )
          .map((result) => result.reason?.message || "Unknown error");
        if (failedUploads.length > 0)
          toast.warning(
            `Some images failed to upload: ${failedUploads.join(", ")}`,
          );
      }

      toast.success("Your idea has been posted!");
      setSubmittedRequestId(newRequest.id);
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid =
    formData.title.length >= 5 &&
    formData.description.length >= 20 &&
    !!formData.placement &&
    !!formData.size;

  // ── Render ──────────────────────────────────────────────────────────────────────────

  // Post-submit confirmation screen
  if (submittedRequestId !== null) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-lg mx-auto text-center pt-20">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Your idea is out there. 🎨</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Artists near you can now see your request and send quotes. We'll notify you when someone reaches out — usually within a day or two, sometimes faster.
            <br /><br />
            Sit tight, and feel free to browse artist portfolios while you wait.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              className="h-11 px-6 font-semibold"
              onClick={() => setLocation("/artists")}
            >
              Browse Artists
            </Button>
            <Button
              variant="outline"
              className="h-11 px-6"
              onClick={() => setLocation(`/requests/${submittedRequestId}`)}
            >
              View My Request
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar trust block */}
          <aside className="lg:col-span-1 order-last lg:order-first">
            <div className="sticky top-8 space-y-4">
              <Card className="bg-card border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">How this works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Post your idea</p>
                      <p className="text-xs text-muted-foreground">Describe your vision and upload any references you have.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Artists reach out</p>
                      <p className="text-xs text-muted-foreground">Local artists who do your style will send you quotes.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">You choose</p>
                      <p className="text-xs text-muted-foreground">Pick the artist that fits your vision and your budget. No obligation until you book.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Main form */}          <div className="lg:col-span-2">

          {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Tell Us About Your Tattoo Idea
              </h1>
              <p className="text-sm text-muted-foreground">
                Describe your vision, drop some reference photos, and we'll put it in front of artists who actually do this style. You'll get real quotes, no pressure, no commitment yet.
              </p>
            </div>
          </div>
        </div>

          <form onSubmit={handleSubmit} className="space-y-5">
          {/* Card 1: The Idea */}
          <Card className="bg-card border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                The Idea
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm font-medium">
                  What are you thinking? <span className="text-primary">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder='e.g., "Black and grey wolf howling at the moon, forearm-sized"'
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="bg-background/50 border-border/60 focus:border-primary"
                  minLength={5}
                  maxLength={255}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-medium">
                  Tell us more <span className="text-primary">*</span>
                </Label>
                <p className="text-xs text-muted-foreground -mt-1 mb-1.5">
                  Don't overthink it. "A black and grey wolf howling at the moon, kind of realistic, maybe forearm-sized" is a great start. The more detail you give, the better the quotes you'll get.
                </p>
                <Textarea
                  id="description"
                  placeholder="Describe the tattoo, style, subject, mood, size, placement... whatever you've got."
                  rows={5}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="bg-background/50 border-border/60 focus:border-primary resize-none"
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/5000 characters (min 20)
                </p>
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
            </CardContent>
          </Card>

          {/* Card 2: Design Details */}
          <Card className="bg-card border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Where are you putting it, and how big?
              </CardTitle>
              <p className="text-xs text-muted-foreground pt-1">
                Placement and size affect the quote a lot. Even a rough answer helps — "half sleeve" or "something around 4 inches on my forearm" works fine.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Style</Label>
                  <Select
                    value={formData.style}
                    onValueChange={(value) =>
                      setFormData({ ...formData, style: value })
                    }
                  >
                    <SelectTrigger className="bg-background/50 border-border/60">
                      <SelectValue placeholder="Select style" />
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
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Size <span className="text-primary">*</span>
                  </Label>
                  <Select
                    value={formData.size}
                    onValueChange={(value) =>
                      setFormData({ ...formData, size: value })
                    }
                  >
                    <SelectTrigger className="bg-background/50 border-border/60">
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
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Placement <span className="text-primary">*</span>
                </Label>
                <Select
                  value={formData.placement}
                  onValueChange={(value) =>
                    setFormData({ ...formData, placement: value })
                  }
                >
                  <SelectTrigger className="bg-background/50 border-border/60">
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
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Color Preference
                </Label>
                <Select
                  value={formData.colorPreference}
                  onValueChange={(value) =>
                    setFormData({ ...formData, colorPreference: value })
                  }
                >
                  <SelectTrigger className="bg-background/50 border-border/60">
                    <SelectValue placeholder="Color or black & grey?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="color">Full Color</SelectItem>
                    <SelectItem value="black_and_grey">
                      Black & Grey
                    </SelectItem>
                    <SelectItem value="either">Either is fine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Budget */}
          <Card className="bg-card border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                What's your budget range?
              </CardTitle>
              <CardDescription className="text-xs">
                There's no wrong answer here. Being upfront about your budget helps artists send you quotes that actually work for both sides. You can always discuss it further once they reach out.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {BUDGET_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleBudgetPreset(preset, idx)}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                      selectedBudgetPreset === idx
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Min ($)
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g., 200"
                    value={formData.budgetMin}
                    onChange={(e) => {
                      setSelectedBudgetPreset(null);
                      setFormData({ ...formData, budgetMin: e.target.value });
                    }}
                    className="bg-background/50 border-border/60 focus:border-primary"
                    min={0}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Max ($)
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g., 600"
                    value={formData.budgetMax}
                    onChange={(e) => {
                      setSelectedBudgetPreset(null);
                      setFormData({ ...formData, budgetMax: e.target.value });
                    }}
                    className="bg-background/50 border-border/60 focus:border-primary"
                    min={0}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Reference Images */}
          <Card className="bg-card border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Got reference photos? Upload them here.
              </CardTitle>
              <CardDescription className="text-xs">
                Screenshots, Pinterest saves, artist work you love — anything that helps show what you're going for. You can upload multiple images.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="relative aspect-square group">
                      <img
                        src={img.preview}
                        alt={`Reference ${index + 1}`}
                        className="object-cover w-full h-full rounded-lg border border-border/40"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {uploadedImages.length < 3 && (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                  <ImagePlus className="h-7 w-7 text-muted-foreground mb-1.5" />
                  <span className="text-sm text-muted-foreground">
                    Add Photos (Optional)
                  </span>
                  <span className="text-xs text-muted-foreground/60 mt-0.5">
                    {uploadedImages.length}/3 images · PNG, JPG, WEBP
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
            </CardContent>
          </Card>

          {/* Pre-submit account gate (only shown when not logged in) */}
          {!user && (
            <Card className="bg-primary/5 border-primary/30 shadow-sm">
              <CardContent className="pt-5 pb-5">
                <h3 className="font-semibold text-base mb-1">Almost there — save your idea so artists can find it.</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a free account to post your request to the local artist feed. It takes about 30 seconds, and your idea will be waiting right here when you're done.
                </p>
                <div className="space-y-1.5 mb-4">
                  <Label htmlFor="guestEmail" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="guestEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="bg-background/50 border-border/60 focus:border-primary"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <a href="/login" className="text-primary underline underline-offset-2">Sign in</a>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Card 6: Location & Timing */}
          <Card className="bg-card border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Location & Timing{" "}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  optional
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Preferred City</Label>
                  <Input
                    placeholder="e.g., Austin"
                    value={formData.preferredCity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferredCity: e.target.value,
                      })
                    }
                    className="bg-background/50 border-border/60 focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">State</Label>
                  <Input
                    placeholder="e.g., TX"
                    value={formData.preferredState}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferredState: e.target.value,
                      })
                    }
                    className="bg-background/50 border-border/60 focus:border-primary"
                    maxLength={2}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Desired Timeframe
                </Label>
                <Select
                  value={formData.desiredTimeframe}
                  onValueChange={(value) =>
                    setFormData({ ...formData, desiredTimeframe: value })
                  }
                >
                  <SelectTrigger className="bg-background/50 border-border/60">
                    <SelectValue placeholder="When do you want this done?" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEFRAMES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="willingToTravel"
                  checked={formData.willingToTravel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      willingToTravel: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-primary rounded"
                />
                <Label
                  htmlFor="willingToTravel"
                  className="text-sm cursor-pointer"
                >
                  I'm willing to travel for the right artist
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="space-y-3 pb-8">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Post My Idea
                </>
              )}
            </Button>

            {/* Trust line */}
            <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your request is visible to verified artists on Ink Connect. We don't share your contact info until you decide to move forward.
              </p>
            </div>
          </div>
          </form>
          </div>{/* end main form col */}
        </div>{/* end grid */}
      </div>
    </div>
  );
}
