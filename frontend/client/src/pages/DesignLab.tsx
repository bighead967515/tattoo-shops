import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Header from "@/components/Header";
import {
  Sparkles,
  Download,
  Wand2,
  Crown,
  ArrowLeft,
  Zap,
  ImageIcon,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isFreeClientTier } from "@shared/tierCompat";

const STYLE_OPTIONS = [
  { value: "traditional", label: "Traditional (American)" },
  { value: "neo-traditional", label: "Neo-Traditional" },
  { value: "realism", label: "Realism" },
  { value: "watercolor", label: "Watercolor" },
  { value: "japanese", label: "Japanese (Irezumi)" },
  { value: "geometric", label: "Geometric" },
  { value: "minimalist", label: "Minimalist" },
  { value: "blackwork", label: "Blackwork" },
  { value: "dotwork", label: "Dotwork" },
  { value: "fine-line", label: "Fine Line" },
  { value: "tribal", label: "Tribal" },
  { value: "biomechanical", label: "Biomechanical" },
  { value: "illustrative", label: "Illustrative" },
  { value: "sketch", label: "Sketch" },
] as const;

function DesignLab() {
  const { user, loading: authLoading } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<string>("");
  const [generatedImages, setGeneratedImages] = useState<
    Array<{ imageUrl: string; imageKey: string; prompt: string; style: string }>
  >([]);

  const creditsQuery = trpc.ai.getCredits.useQuery(undefined, {
    enabled: !!user,
  });

  const generateMutation = trpc.ai.generateDesign.useMutation({
    onSuccess: (data, variables) => {
      setGeneratedImages((prev) => [
        {
          imageUrl: data.imageUrl,
          imageKey: data.imageKey,
          prompt: variables.prompt,
          style: variables.style || "default",
        },
        ...prev,
      ]);
      // Refresh credits
      creditsQuery.refetch();
      toast.success("Design generated successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate design");
    },
  });

  const handleGenerate = () => {
    if (prompt.trim().length < 10) {
      toast.error(
        "Please describe your tattoo idea in at least 10 characters.",
      );
      return;
    }
    generateMutation.mutate({
      prompt: prompt.trim(),
      style: style || undefined,
    });
  };

  if (authLoading) {
    return <DesignLabSkeleton />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to use the AI Design Lab.
          </p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const credits = creditsQuery.data;
  const isFreeTier = isFreeClientTier(credits?.tier);
  const isGenerating = generateMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/client/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Dashboard
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              AI Design Lab
            </h1>
            <p className="text-muted-foreground mt-1">
              Generate tattoo design concepts powered by AI
            </p>
          </div>

          {/* Credits badge */}
          {credits && !isFreeTier && (
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Zap className="h-3.5 w-3.5 mr-1" />
              {credits.isUnlimited
                ? "Unlimited"
                : `${credits.aiCredits} credits left`}
            </Badge>
          )}
        </div>

        {/* Free tier upsell */}
        {isFreeTier && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-8 border-primary/30 bg-primary/5">
              <CardContent className="flex items-center gap-6 py-6">
                <div className="flex-shrink-0">
                  <Crown className="h-12 w-12 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">
                    Unlock AI Tattoo Generation
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Upgrade to <strong>Enthusiast</strong> ($9/mo for 10
                    generations) or <strong>Elite Ink</strong> ($19/mo for
                    unlimited) to turn your ideas into tattoo designs instantly.
                  </p>
                </div>
                <Link href="/pricing">
                  <Button>
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left column — Input */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Design Your Tattoo
                </CardTitle>
                <CardDescription>
                  Describe your tattoo idea in detail — the more specific, the
                  better the result.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Describe your tattoo
                  </label>
                  <Textarea
                    placeholder="e.g., A majestic wolf howling at a crescent moon, surrounded by pine trees and geometric patterns..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={5}
                    maxLength={2000}
                    className="resize-none"
                    disabled={isFreeTier || isGenerating}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {prompt.length}/2000 characters (minimum 10)
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Tattoo Style
                  </label>
                  <Select
                    value={style}
                    onValueChange={setStyle}
                    disabled={isFreeTier || isGenerating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a style (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {STYLE_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleGenerate}
                  disabled={
                    isFreeTier ||
                    isGenerating ||
                    prompt.trim().length < 10 ||
                    (!credits?.isUnlimited && (credits?.aiCredits ?? 0) <= 0)
                  }
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Generating Design...
                    </>
                  ) : isFreeTier ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Upgrade to Generate
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Design
                    </>
                  )}
                </Button>

                {!credits?.isUnlimited && !isFreeTier && credits && (
                  <p className="text-xs text-center text-muted-foreground">
                    {credits.aiCredits} of {credits.maxCredits} generation
                    {credits.maxCredits !== 1 ? "s" : ""} remaining this billing
                    period
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tips card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Tips for Great Results
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Be specific:</strong> "A koi fish swimming upstream
                  through cherry blossoms" beats "a fish."
                </p>
                <p>
                  <strong>Mention placement:</strong> "Designed for a forearm
                  sleeve" helps with proportions.
                </p>
                <p>
                  <strong>Include details:</strong> Shading style, line weight,
                  and size preferences all help.
                </p>
                <p>
                  <strong>Pick a style:</strong> Each style has unique
                  characteristics that shape the design.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right column — Results */}
          <div className="lg:col-span-3">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Generated Designs
              {generatedImages.length > 0 && (
                <Badge variant="secondary">{generatedImages.length}</Badge>
              )}
            </h2>

            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6"
              >
                <Card className="overflow-hidden">
                  <div className="aspect-square bg-muted animate-pulse flex items-center justify-center">
                    <div className="text-center">
                      <Sparkles className="h-10 w-10 mx-auto text-primary animate-bounce mb-3" />
                      <p className="text-sm text-muted-foreground font-medium">
                        AI is creating your design...
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This usually takes 10-30 seconds
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            <AnimatePresence>
              {generatedImages.length === 0 && !isGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="py-16">
                    <CardContent className="text-center">
                      <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        No designs yet
                      </h3>
                      <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        {isFreeTier
                          ? "Upgrade your plan to start generating tattoo design concepts with AI."
                          : "Describe your tattoo idea and click Generate to create your first design."}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {generatedImages.map((image, index) => (
                <motion.div
                  key={image.imageKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="mb-6"
                >
                  <Card className="overflow-hidden">
                    <div className="relative group">
                      <img
                        src={image.imageUrl}
                        alt={`AI generated tattoo: ${image.prompt.slice(0, 80)}`}
                        className="w-full aspect-square object-contain bg-white"
                        loading="lazy"
                      />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={async () => {
                            try {
                              const res = await fetch(image.imageUrl);
                              if (!res.ok)
                                throw new Error(
                                  `Download failed: ${res.status}`,
                                );
                              const blob = await res.blob();
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `tattoo-design-${Date.now()}.png`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              URL.revokeObjectURL(url);
                            } catch {
                              // Fallback: open in new tab
                              window.open(image.imageUrl, "_blank");
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm line-clamp-2">{image.prompt}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {STYLE_OPTIONS.find((s) => s.value === image.style)
                            ?.label || "Default Style"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function DesignLabSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-10 w-60 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DesignLab;
