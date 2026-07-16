import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
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
  AtSign,
  Shield,
  Star,
  Zap,
  Award,
  Users,
  DollarSign,
  Briefcase,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import LegalAcceptanceModal from "@/components/LegalAcceptanceModal";
import { APP_LOGO } from "@/const";

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

const PLAN_OPTIONS = [
  {
    id: "pay_as_you_go",
    name: "Pay-as-you-go",
    price: "$0/mo",
    desc: "No monthly commitment",
    details: "10% booking fee, 10 portfolio photos, 3 monthly bids limit, receive client bids, standard support.",
    popular: false,
    color: "border-primary/50 bg-primary/5 text-primary",
  },
  {
    id: "pro_studio",
    name: "Pro Studio",
    price: "$49/mo",
    desc: "For working professionals",
    details: "5% booking fee, unlimited portfolio photos, booking calendar + deposits, 50 AI generations/mo, Verified badge.",
    popular: true,
    color: "border-emerald-500/50 bg-emerald-500/5 text-emerald-500",
  },
  {
    id: "elite_icon",
    name: "Elite Icon",
    price: "$99/mo",
    desc: "Ultimate visibility & tools",
    details: "3% booking fee, homepage feature spotlight, unlimited portfolio photos, unlimited AI generations, VIP support.",
    popular: false,
    color: "border-accent bg-accent/5 text-accent-foreground",
  },
  {
    id: "free",
    name: "Free Trial",
    price: "$0/mo",
    desc: "Start your footprint",
    details: "10 portfolio photos, appear in directory, standard support.",
    popular: false,
    color: "border-border/60 bg-muted/30 text-muted-foreground",
  },
];

export default function ArtistSignupLanding() {
  const [, setLocation] = useLocation();
  const { user, refresh } = useAuth();
  const { signUpWithEmail, signInWithOAuth } = useSupabaseAuth();
  
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedPlan, setSelectedPlan] = useState("pay_as_you_go");
  const [showLegal, setShowLegal] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isLicenseUploading, setIsLicenseUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Louisiana");
  const [styles, setStyles] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  
  const [instagram, setInstagram] = useState("");
  const [bio, setBio] = useState("");
  const [shopName, setShopName] = useState("");
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  // TRPC Mutations
  const createArtistMutation = trpc.artists.create.useMutation();
  const getPortfolioUploadUrl = trpc.portfolio.getUploadUrl.useMutation();
  const addPortfolioImage = trpc.portfolio.add.useMutation();
  const getLicenseUploadUrl = trpc.verification.getUploadUrl.useMutation();
  const addLicenseDocument = trpc.verification.addDocument.useMutation();
  const { data: artistProfile, isLoading: isProfileLoading } =
    trpc.artists.getByUserId.useQuery(undefined, { enabled: !!user });

  useEffect(() => {
    if (user?.role === "artist" && artistProfile && !isProfileLoading) {
      setLocation("/dashboard");
    }
  }, [user, artistProfile, isProfileLoading, setLocation]);

  const toggleStyle = (style: string) => {
    setStyles(prev => 
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + portfolioFiles.length > 6) {
      toast.error("Maximum 6 portfolio images allowed");
      return;
    }
    setPortfolioFiles(prev => [...prev, ...files]);
  };

  const handleLicenseSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.size > 10 * 1024 * 1024) {
        toast.error("License file must be under 10MB");
        return;
      }
      setLicenseFile(selected);
    }
  };

  const handleAccountCreation = async () => {
    if (!user) {
      if (!fullName.trim()) {
        toast.error("Full name is required");
        return;
      }
      if (!email.trim() || !email.includes("@")) {
        toast.error("Please enter a valid email address");
        return;
      }
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      
      setIsCreatingAccount(true);
      try {
        await signUpWithEmail(email, password, { name: fullName });
        // Retry refresh until user is available (auth state propagation can be async)
        let retries = 0;
        let refreshResult = await refresh();
        while (!refreshResult?.data && retries < 6) {
          await new Promise((r) => setTimeout(r, 500));
          refreshResult = await refresh();
          retries++;
        }
        toast.success("Account created successfully!");
        setStep(3);
      } catch (err: any) {
        toast.error(err.message || "Account creation failed. Email might already exist.");
      } finally {
        setIsCreatingAccount(false);
      }
    } else {
      setStep(3);
    }
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    try {
      await signInWithOAuth(provider);
    } catch (err: any) {
      toast.error(err.message || "OAuth authentication failed");
    }
  };

  const handleNextStep3 = () => {
    if (!city.trim()) {
      toast.error("City is required");
      return;
    }
    if (styles.length === 0) {
      toast.error("Please select at least one primary style");
      return;
    }
    setStep(4);
  };

  const handleNextStep4 = () => {
    if (portfolioFiles.length < 3) {
      toast.error("Please upload at least 3 portfolio photos to showcase your work");
      return;
    }
    setStep(5);
  };

  const handleSubmit = async () => {
    if (!bio.trim()) {
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
      // Re-fetch the latest user to handle the case where reactive state
      // hasn't propagated yet after account creation (auth race condition)
      let currentUser = user;
      if (!currentUser) {
        const result = await refresh();
        currentUser = result?.data ?? null;
      }
      if (!currentUser) {
        toast.error("Please sign in or create an account first");
        setStep(2);
        setIsSubmitting(false);
        return;
      }

      // 1. Create artist profile
      const artist = await createArtistMutation.mutateAsync({
        shopName: shopName.trim() || fullName || currentUser.name || "Tattoo Studio",
        bio,
        specialties: styles.join(", "),
        experience: experience ? parseInt(experience) : undefined,
        city,
        state,
        instagram,
      });

      // 2. Upload portfolio images
      let uploadedCount = 0;
      for (const file of portfolioFiles) {
        try {
          const ext = file.name.split(".").pop() || "jpg";
          const { signedUrl, path: filePath } = await getPortfolioUploadUrl.mutateAsync({
            artistId: artist.id,
            fileName: `${Date.now()}_${uploadedCount}.${ext}`,
            contentType: file.type,
          });
          await axios.put(signedUrl, file, {
            headers: { "Content-Type": file.type },
          });
          await addPortfolioImage.mutateAsync({
            artistId: artist.id,
            imageKey: filePath,
          });
          uploadedCount++;
        } catch (err) {
          console.error("Failed to upload portfolio image:", err);
        }
      }

      // 3. Upload license document (if provided)
      if (licenseFile) {
        setIsLicenseUploading(true);
        try {
          const { signedUrl, path: licensePath } = await getLicenseUploadUrl.mutateAsync({
            fileName: licenseFile.name,
            contentType: licenseFile.type as any,
            fileSize: licenseFile.size,
          });
          await axios.put(signedUrl, licenseFile, {
            headers: { "Content-Type": licenseFile.type },
          });
          await addLicenseDocument.mutateAsync({
            documentKey: licensePath,
            documentType: "state_license",
            originalFileName: licenseFile.name,
            fileSize: licenseFile.size,
            mimeType: licenseFile.type as any,
          });
          toast.success("License document uploaded and queued for review");
        } catch (err) {
          console.error("Failed to upload license document:", err);
          toast.warning("Profile created, but license document upload failed. You can re-upload in settings.");
        } finally {
          setIsLicenseUploading(false);
        }
      }

      await refresh();
      toast.success("🎉 Welcome to Ink Connect! Your artist profile has been initialized.");
      setLocation("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Onboarding failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:grid md:grid-cols-[40%_60%]">
      <LegalAcceptanceModal
        open={showLegal}
        role="artist"
        onAccept={() => {
          setLegalAccepted(true);
          setShowLegal(false);
          // Small timeout to allow state to settle
          setTimeout(() => doSubmit(), 100);
        }}
      />

      {/* Left marketing column - Fixed on desktop */}
      <div className="relative bg-muted/30 border-b md:border-b-0 md:border-r border-border/60 bg-gradient-to-br from-background via-muted/20 to-primary/10 px-6 py-12 md:py-24 flex flex-col justify-between items-center text-center md:text-left overflow-y-auto">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_60%)] pointer-events-none" />
        
        <div className="max-w-md w-full space-y-8 z-10">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <img src={APP_LOGO} alt="Ink Connect Logo" className="w-10 h-10 rounded-xl" />
            <span className="font-bold text-xl tracking-tight">Ink Connect</span>
          </div>

          <div className="space-y-4">
            <Badge className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-semibold uppercase tracking-wider">
              Artist Network
            </Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
              Scale your tattoo studio with <span className="text-primary bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">verified clients.</span>
            </h1>
            <p className="text-muted-foreground md:text-lg">
              Ink Connect helps professional artists showcase their portfolios, secure bookings with deposits, and collaborate using AI stencil design tools.
            </p>
          </div>

          {/* Core Value Props List */}
          <div className="space-y-5 text-left">
            {[
              {
                icon: Users,
                title: "Informed Client Requests",
                desc: "Get requests showing placement, reference images, sizing details, and timeline before you chat.",
              },
              {
                icon: DollarSign,
                title: "Zero Booking No-Shows",
                desc: "Require upfront deposits processed securely via Stripe checkout integrations.",
              },
              {
                icon: Zap,
                title: "AI Design Co-Pilot",
                desc: "Access the AI Design Lab to generate and refine stencils alongside client specifications.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-sm md:text-base">{title}</h4>
                  <p className="text-xs md:text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial Quote */}
        <div className="max-w-md w-full mt-12 md:mt-20 z-10">
          <Card className="p-5 border-border/60 bg-background/60 backdrop-blur-md shadow-lg rounded-2xl">
            <p className="italic text-sm text-muted-foreground leading-relaxed">
              "The reference details and deposit system completely eliminated my no-shows. I'm filling my calendar with exactly the styles I love to tattoo."
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-8 h-8 rounded-full bg-primary/25 flex items-center justify-center font-bold text-xs">
                MV
              </div>
              <div>
                <p className="text-xs font-bold">Marcus Vance</p>
                <p className="text-[10px] text-muted-foreground">Fineline Specialist · New Orleans, LA</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Right Column - Step Wizard Form */}
      <div className="px-6 py-12 md:py-24 flex items-center justify-center overflow-y-auto">
        <div className="max-w-xl w-full space-y-8">
          {/* Stepper Header */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              <span>Step {step} of 5</span>
              <span>
                {step === 1 && "Choose Your Plan"}
                {step === 2 && "Create Account"}
                {step === 3 && "Basics & Style"}
                {step === 4 && "Portfolio upload"}
                {step === 5 && "Verification & Bio"}
              </span>
            </div>
            <Progress value={step * 20} className="h-1.5" />
          </div>

          {/* Form Content Cards */}

          {/* Step 1: Choose Subscription Plan */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Select your studio tier</h2>
                <p className="text-muted-foreground text-sm">
                  Choose a subscription plan to kick off onboarding. You can change plans at any time.
                </p>
              </div>

              <div className="grid gap-4">
                {PLAN_OPTIONS.map((plan) => (
                  <label
                    key={plan.id}
                    className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all hover:bg-muted/10 ${
                      selectedPlan === plan.id
                        ? "border-primary bg-primary/5"
                        : "border-border/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="subscription_plan"
                      value={plan.id}
                      checked={selectedPlan === plan.id}
                      onChange={() => setSelectedPlan(plan.id)}
                      className="sr-only"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">{plan.name}</span>
                        <span className="font-extrabold text-lg text-primary">{plan.price}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{plan.details}</p>
                    </div>
                  </label>
                ))}
              </div>

              <Button size="lg" className="w-full" onClick={() => setStep(2)}>
                Continue
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Create Account / Authenticate */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Let's create your account</h2>
                <p className="text-muted-foreground text-sm">
                  Already have an account? Log in first, or create a new credentials profile to start.
                </p>
              </div>

              {user ? (
                <Card className="p-6 border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5 text-emerald-500" />
                  <div className="space-y-1">
                    <p className="font-bold text-sm">Authenticated Successfully</p>
                    <p className="text-xs text-muted-foreground">
                      Logged in as <strong>{user.name || user.email}</strong>. Click below to continue profile setup.
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOAuthLogin("google")}
                      className="w-full"
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleOAuthLogin("github")}
                      className="w-full"
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                      </svg>
                      GitHub
                    </Button>
                  </div>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or with Email</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="artist@studio.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Min. 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button className="flex-1" onClick={handleAccountCreation} disabled={isCreatingAccount}>
                  {isCreatingAccount ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Location, Styles, & Experience */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Your studio & style basics</h2>
                <p className="text-muted-foreground text-sm">
                  Let clients know where you're located and what styles you specialize in.
                </p>
              </div>

              <div className="space-y-4">
                {/* Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      <MapPin className="w-4 h-4 inline mr-1 text-primary" />
                      City *
                    </Label>
                    <Input
                      id="city"
                      placeholder="New Orleans"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <select
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {US_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Experience */}
                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Professional Experience</Label>
                  <Input
                    id="experience"
                    type="number"
                    min="1"
                    placeholder="e.g. 5"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  />
                </div>

                {/* Styles */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-primary" />
                    Primary Styles * <span className="text-xs text-muted-foreground font-normal">(select all that apply)</span>
                  </Label>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 border border-border/40 rounded-xl bg-muted/20">
                    {STYLE_OPTIONS.map((style) => {
                      const selected = styles.includes(style);
                      return (
                        <button
                          key={style}
                          type="button"
                          onClick={() => toggleStyle(style)}
                          className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                            selected
                              ? "bg-primary/20 border-primary text-foreground font-semibold"
                              : "border-border/60 bg-background hover:border-primary/40 text-muted-foreground"
                          }`}
                        >
                          {style}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button className="flex-1" onClick={handleNextStep3}>
                  Continue
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Portfolio Uploads (Required) */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Showcase your portfolio</h2>
                <p className="text-muted-foreground text-sm">
                  Upload your best work. **At least 3 portfolio images are required** to start receiving client bookings.
                </p>
              </div>

              <Card
                className="p-8 border-dashed border-2 border-border/80 hover:border-primary/80 transition-all text-center cursor-pointer bg-muted/10"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm font-semibold">Drag & drop or click to upload</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Supports JPG, PNG, WEBP (Max 5MB each). Up to 6 images.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </Card>

              {portfolioFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider">
                    <span>Uploaded ({portfolioFiles.length})</span>
                    {portfolioFiles.length >= 3 ? (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Required count met
                      </span>
                    ) : (
                      <span className="text-amber-500">Need {3 - portfolioFiles.length} more</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {portfolioFiles.map((file, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border/60 bg-muted group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt="Portfolio preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setPortfolioFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/90 rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep(3)} className="flex-1">
                  Back
                </Button>
                <Button className="flex-1" onClick={handleNextStep4} disabled={portfolioFiles.length < 3}>
                  Continue
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Bio, Instagram, License & Submit */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Studio details & verification</h2>
                <p className="text-muted-foreground text-sm">
                  Add a bio to attract clients and optionally upload your state license for fast-track verification.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shopName">Studio / Shop Name</Label>
                  <Input
                    id="shopName"
                    placeholder="E.g. Sacred Dagger Tattoo"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram">
                    <AtSign className="w-4 h-4 inline mr-1 text-primary" />
                    Instagram Handle
                  </Label>
                  <Input
                    id="instagram"
                    placeholder="e.g. @artist_ink"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">About / Bio *</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell clients about your background, techniques, and style preferences..."
                    className="min-h-24"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                {/* Optional License Upload */}
                <div className="space-y-2 border-t pt-4">
                  <Label className="flex items-center gap-1 text-sm font-semibold">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    State License Verification <span className="text-xs text-muted-foreground font-normal">(Optional, PDF/PNG/JPG)</span>
                  </Label>
                  <div className="flex gap-4 items-center mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => licenseInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Select License
                    </Button>
                    <input
                      ref={licenseInputRef}
                      type="file"
                      accept="application/pdf,image/png,image/jpeg,image/jpg"
                      onChange={handleLicenseSelect}
                      className="hidden"
                    />
                    {licenseFile ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-500 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        <FileCheck className="w-3.5 h-3.5" />
                        <span className="truncate max-w-40">{licenseFile.name}</span>
                        <button type="button" onClick={() => setLicenseFile(null)}>
                          <X className="w-3 h-3 text-emerald-500 hover:text-emerald-700" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No document selected</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setStep(4)} className="flex-1" disabled={isSubmitting}>
                  Back
                </Button>
                <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting || isLicenseUploading}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit & Launch
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
