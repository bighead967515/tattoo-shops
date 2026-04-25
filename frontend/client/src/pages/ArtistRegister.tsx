import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Upload,
  X,
  Loader2,
  User,
  MapPin,
  Palette,
  Instagram,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import LegalAcceptanceModal from "@/components/LegalAcceptanceModal";

const STYLE_OPTIONS = [
  "Traditional",
  "Fineline",
  "Japanese",
  "Blackwork",
  "Realism",
  "Geometric",
  "Watercolor",
  "Neo-Traditional",
  "Dotwork",
  "Tribal",
  "Portrait",
  "Illustrative",
  "Surrealism",
  "Minimalist",
  "Lettering",
];

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming",
];

interface Screen1Data {
  fullName: string;
  email: string;
  password: string;
  city: string;
  state: string;
  styles: string[];
  experience: string;
}

interface Screen2Data {
  instagram: string;
  bio: string;
  shopName: string;
  studio: string; // "independent" or studio name
  portfolioFiles: File[];
}

export default function ArtistRegister() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [screen, setScreen] = useState<1 | 2>(1);
  const [showLegal, setShowLegal] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [s1, setS1] = useState<Screen1Data>({
    fullName: "",
    email: "",
    password: "",
    city: "",
    state: "Louisiana",
    styles: [],
    experience: "",
  });

  const [s2, setS2] = useState<Screen2Data>({
    instagram: "",
    bio: "",
    shopName: "",
    studio: "",
    portfolioFiles: [],
  });

  const createArtistMutation = trpc.artists.create.useMutation();
  const getUploadUrlMutation = trpc.portfolio.getUploadUrl.useMutation();
  const addPortfolioImageMutation = trpc.portfolio.add.useMutation();

  const toggleStyle = (style: string) => {
    setS1(prev => ({
      ...prev,
      styles: prev.styles.includes(style)
        ? prev.styles.filter(s => s !== style)
        : [...prev.styles, style],
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + s2.portfolioFiles.length > 6) {
      toast.error("Maximum 6 portfolio images allowed");
      return;
    }
    setS2(prev => ({ ...prev, portfolioFiles: [...prev.portfolioFiles, ...files] }));
  };

  const removeFile = (index: number) => {
    setS2(prev => ({
      ...prev,
      portfolioFiles: prev.portfolioFiles.filter((_, i) => i !== index),
    }));
  };

  const validateScreen1 = () => {
    if (!s1.fullName.trim()) { toast.error("Full name is required"); return false; }
    if (!user && !s1.email.trim()) { toast.error("Email is required"); return false; }
    if (!user && s1.password.length < 6) { toast.error("Password must be at least 6 characters"); return false; }
    if (!s1.city.trim()) { toast.error("City is required"); return false; }
    if (s1.styles.length === 0) { toast.error("Select at least one style"); return false; }
    return true;
  };

  const handleScreen1Next = () => {
    if (!validateScreen1()) return;
    setScreen(2);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (s2.portfolioFiles.length < 3) {
      toast.error("Please upload at least 3 portfolio photos");
      return;
    }
    if (!s2.bio.trim()) {
      toast.error("A short bio is required");
      return;
    }
    if (!legalAccepted) {
      setShowLegal(true);
      return;
    }
    await doSubmit();
  };

  const doSubmit = async () => {
    setIsSubmitting(true);
    try {
      // If not logged in, redirect to signup first with a message
      if (!user) {
        toast.info("Please create an account first, then complete your artist profile.");
        setLocation(`/signup?redirect=/artist/register`);
        return;
      }

      // Create artist profile
      const artist = await createArtistMutation.mutateAsync({
        shopName: s2.shopName || s1.fullName,
        bio: s2.bio,
        specialties: s1.styles.join(", "),
        experience: s1.experience ? parseInt(s1.experience) : undefined,
        city: s1.city,
        state: s1.state,
        instagram: s2.instagram,
      });

      // Upload portfolio images
      let uploadedCount = 0;
      for (const file of s2.portfolioFiles) {
        try {
          const ext = file.name.split(".").pop() || "jpg";
          const key = `${artist.id}/${Date.now()}_${uploadedCount}.${ext}`;
          const { uploadUrl, fileKey } = await getUploadUrlMutation.mutateAsync({
            fileKey: key,
            contentType: file.type,
          });
          await axios.put(uploadUrl, file, {
            headers: { "Content-Type": file.type },
          });
          await addPortfolioImageMutation.mutateAsync({
            artistId: artist.id,
            imageKey: fileKey,
            isMainImage: uploadedCount === 0,
          });
          uploadedCount++;
        } catch (err) {
          console.error("Failed to upload image", err);
        }
      }

      toast.success("🎉 Welcome to Ink Connect! Your profile is under review.");
      setLocation("/artist-dashboard");
    } catch (err: any) {
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <LegalAcceptanceModal
        open={showLegal}
        role="artist"
        onAccept={() => {
          setLegalAccepted(true);
          setShowLegal(false);
          doSubmit();
        }}
      />

      {/* Header */}
      <div className="border-b bg-muted/30 py-4">
        <div className="container max-w-2xl mx-auto px-4 flex items-center justify-between">
          <button onClick={() => setLocation("/for-artists")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            <span className="font-semibold">Ink Connect</span>
          </div>
          <div className="w-16" /> {/* spacer */}
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-10">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {screen === 1 ? "Step 1 of 2 — The Basics" : "Step 2 of 2 — Your Portfolio"}
            </span>
            <span className="text-sm text-muted-foreground">{screen === 1 ? "60 seconds" : "Almost done"}</span>
          </div>
          <Progress value={screen === 1 ? 50 : 100} className="h-2" />
        </div>

        {/* Screen 1 — Basics */}
        {screen === 1 && (
          <Card className="p-8 space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Tell us about yourself</h1>
              <p className="text-muted-foreground text-sm">This takes about 60 seconds.</p>
            </div>

            {/* Full name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">
                <User className="w-4 h-4 inline mr-1" />
                Full Name *
              </Label>
              <Input
                id="fullName"
                placeholder="Your name or artist alias"
                value={s1.fullName}
                onChange={e => setS1(p => ({ ...p, fullName: e.target.value }))}
              />
            </div>

            {/* Email + password — only if not logged in */}
            {!user && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={s1.email}
                    onChange={e => setS1(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={s1.password}
                    onChange={e => setS1(p => ({ ...p, password: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* Location */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  City *
                </Label>
                <Input
                  id="city"
                  placeholder="New Orleans"
                  value={s1.city}
                  onChange={e => setS1(p => ({ ...p, city: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <select
                  id="state"
                  value={s1.state}
                  onChange={e => setS1(p => ({ ...p, state: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {US_STATES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Styles */}
            <div className="space-y-3">
              <Label>
                <Palette className="w-4 h-4 inline mr-1" />
                Primary Style(s) * <span className="text-muted-foreground font-normal">(select all that apply)</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {STYLE_OPTIONS.map(style => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleStyle(style)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      s1.styles.includes(style)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary/50"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
              {s1.styles.length > 0 && (
                <p className="text-xs text-primary">{s1.styles.length} style{s1.styles.length > 1 ? "s" : ""} selected</p>
              )}
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                max="50"
                placeholder="e.g. 5"
                value={s1.experience}
                onChange={e => setS1(p => ({ ...p, experience: e.target.value }))}
              />
            </div>

            <Button size="lg" className="w-full" onClick={handleScreen1Next}>
              Continue
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Card>
        )}

        {/* Screen 2 — Portfolio seed */}
        {screen === 2 && (
          <Card className="p-8 space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">Show your work</h1>
              <p className="text-muted-foreground text-sm">
                Upload 3–6 portfolio photos. Artists with photos get <strong>3x more profile visits</strong>.
              </p>
            </div>

            {/* Portfolio upload */}
            <div className="space-y-3">
              <Label>
                Portfolio Photos * <span className="text-muted-foreground font-normal">(min 3, max 6)</span>
              </Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-8 text-center cursor-pointer transition-colors group"
              >
                <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary mx-auto mb-3 transition-colors" />
                <p className="text-sm font-medium">Click to upload photos</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP — up to 10MB each</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />

              {s2.portfolioFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {s2.portfolioFiles.map((file, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden aspect-square bg-muted">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Portfolio ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {i === 0 && (
                        <Badge className="absolute top-1 left-1 text-xs bg-primary/90 text-primary-foreground">
                          Main
                        </Badge>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className={`w-4 h-4 ${s2.portfolioFiles.length >= 3 ? "text-primary" : "text-muted-foreground"}`} />
                {s2.portfolioFiles.length}/3 minimum photos uploaded
              </div>
            </div>

            {/* Instagram */}
            <div className="space-y-2">
              <Label htmlFor="instagram">
                <Instagram className="w-4 h-4 inline mr-1" />
                Instagram Handle <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="instagram"
                placeholder="@yourusername"
                value={s2.instagram}
                onChange={e => setS2(p => ({ ...p, instagram: e.target.value }))}
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">
                Short Bio * <span className="text-muted-foreground font-normal">(max 150 chars)</span>
              </Label>
              <Textarea
                id="bio"
                placeholder="Your style, vibe, and what makes your work unique..."
                maxLength={150}
                rows={3}
                value={s2.bio}
                onChange={e => setS2(p => ({ ...p, bio: e.target.value }))}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{s2.bio.length}/150</p>
            </div>

            {/* Studio */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shopName">Artist/Shop Name *</Label>
                <Input
                  id="shopName"
                  placeholder="Your name or studio name"
                  value={s2.shopName}
                  onChange={e => setS2(p => ({ ...p, shopName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studio">Studio Affiliation</Label>
                <Input
                  id="studio"
                  placeholder="Studio name or 'Independent'"
                  value={s2.studio}
                  onChange={e => setS2(p => ({ ...p, studio: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => { setScreen(1); window.scrollTo(0, 0); }}
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Complete Registration
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree to our{" "}
              <a href="/terms-of-service" className="text-primary hover:underline">Terms of Service</a>
              {" "}and{" "}
              <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
