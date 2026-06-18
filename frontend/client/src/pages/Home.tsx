import { Link, useLocation } from "wouter";
import HomepageFeed from "@/components/HomepageFeed";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  FileText,
  MapPin,
  MessageSquare,
  Palette,
  Shield,
  Star,
  Award,
  Wallet,
  Crown,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const audienceLanes = [
  {
    title: "Showcase your tattoo artistry",
    body:
      "Display your portfolio, styles, and specialties to attract clients looking for quality work.",
    cta: "Join as an artist",
    href: "/for-artists",
    icon: Palette,
  },
  {
    title: "Looking for a new tattoo?",
    body:
      "Describe your idea, style preferences, and budget. Artists will respond with proposals tailored to you.",
    cta: "Start your request",
    href: "/client/new-request",
    icon: FileText,
  },
];

const clientSteps = [
  {
    title: "Share what you have now",
    body:
      "Upload photos and include placement, size, and what you want to change. Better details help artists evaluate your options faster.",
    icon: FileText,
  },
  {
    title: "Get responses from specialists",
    body:
      "Artists review your request and respond with their approach, timeline, and scope. You can compare fit before deciding on next steps.",
    icon: MessageSquare,
  },
  {
    title: "Choose your next step",
    body:
      "Review portfolios, ask follow-up questions, and move forward when you are ready. There is no pressure to commit immediately.",
    icon: CheckCircle,
  },
];

const artistSteps = [
  {
    title: "Show your tattoo portfolio",
    body:
      "Showcase your best work and style strengths so clients can see why you are the perfect fit for their tattoo.",
    icon: Palette,
  },
  {
    title: "Review detailed requests",
    body:
      "Review detailed client requests, including placement, style goals, budget range, and timeline preferences.",
    icon: MapPin,
  },
  {
    title: "Respond with clarity",
    body:
      "Provide clear proposals and timelines so clients can make informed decisions and choose the best artist for their vision.",
    icon: Calendar,
  },
];

const whyInkConnect = [
  {
    title: "Built for informed decisions",
    body:
      "Requests capture essential details, so artists can respond with useful guidance tailored to each client.",
    icon: Star,
  },
  {
    title: "Portfolio-first trust",
    body:
      "Clients can evaluate artist portfolios and styles before deciding who to contact.",
    icon: Wallet,
  },
  {
    title: "Clear process on both sides",
    body:
      "Clients submit structured requests. Artists respond with specifics. Everyone saves time by starting with clear expectations.",
    icon: Award,
  },
  {
    title: "Practical expectations",
    body:
      "Tattoo projects vary by design and goals. Ink Connect supports realistic planning, not one-size-fits-all promises.",
    icon: Shield,
  },
];

const faqs = [
  {
    question: "What if my tattoo is very dark or complex?",
    answer:
      "Artists can review your details and explain whether your goals are feasible now or whether a staged approach may be more realistic.",
  },
  {
    question: "I do not know how to describe what I want. Can I still start?",
    answer:
      "Yes. The request flow prompts you through the key details artists need to give useful responses.",
  },
  {
    question: "Do I have to commit once artists respond?",
    answer:
      "No. You can compare options and decide when or whether to move forward.",
  },
  {
    question: "I am an artist. Are requests detailed enough to evaluate fit?",
    answer:
      "Requests include core details like placement, style goals, timing, and budget range so you can respond with more clarity.",
  },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const [selectedFlash, setSelectedFlash] = useState<any | null>(null);
  const [preferredDate, setPreferredDate] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const { data: activeFlash, isLoading: flashLoading } =
    trpc.flash.getAllActive.useQuery();

  const createCheckoutMutation = trpc.flash.createLockCheckout.useMutation({
    onSuccess: (res) => {
      if (res && res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        toast.error("Failed to initiate checkout session.");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start deposit payment.");
    },
  });

  const handleLockFlashClick = (flash: any) => {
    if (!isAuthenticated) {
      toast.info("Please log in to purchase and lock flash art.");
      setLocation("/login");
      return;
    }
    setSelectedFlash(flash);
  };

  const handleConfirmLock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlash) return;

    if (!preferredDate) {
      toast.error("Please select a preferred date and time.");
      return;
    }
    if (!customerPhone.trim()) {
      toast.error("Please enter a contact phone number.");
      return;
    }

    createCheckoutMutation.mutate({
      flashId: selectedFlash.id,
      preferredDate: new Date(preferredDate).toISOString(),
      customerPhone,
      successUrl: `${window.location.origin}/client/dashboard?booking_success=true`,
      cancelUrl: `${window.location.origin}/`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-background via-background to-primary/10">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(112,255,112,0.18),_transparent_60%)]" />
        <div className="container relative py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-primary/80">
              Ink Connect
            </p>
            <h1 className="mb-6 text-3xl font-bold leading-tight sm:text-4xl md:text-6xl">
              Find the perfect tattoo artist for your next ink.
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-lg text-muted-foreground md:text-2xl">
              Ink Connect connects clients with talented tattoo artists and helps artists showcase their skills to attract the right clients.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={() => setLocation("/client/new-request")}
                className="w-full px-8 py-6 text-lg sm:w-auto"
              >
                Start your tattoo request
              </Button>
              <Button
                size="lg"
                variant="link"
                onClick={() => setLocation("/for-artists")}
                className="h-auto px-0 text-base text-foreground"
              >
                I'm a tattoo artist
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <p className="mt-5 text-sm text-muted-foreground">
              Built for both sides: clients who need a better next step and artists who want better-fit tattoo clients.
            </p>
          </div>
        </div>
      </div>

      <section className="border-b bg-muted/20">
        <div className="container py-16">
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            {audienceLanes.map(({ title, body, cta, href, icon: Icon }) => (
              <Card
                key={title}
                className="rounded-3xl border-border/60 bg-background/90 p-8 shadow-sm"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h2 className="mb-3 text-2xl font-bold">{title}</h2>
                <p className="mb-6 text-muted-foreground">{body}</p>
                <Button
                  variant="link"
                  className="h-auto px-0 text-base"
                  onClick={() => setLocation(href)}
                >
                  {cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="container py-20">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            How artists find better-fit clients
          </h2>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {artistSteps.map(({ title, body, icon: Icon }, index) => (
            <Card key={title} className="rounded-3xl border-border/60 p-8">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-7 w-7" />
              </div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">
                Step {index + 1}
              </p>
              <h3 className="mb-3 text-xl font-semibold">{title}</h3>
              <p className="text-muted-foreground">{body}</p>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button size="lg" className="w-full sm:w-auto" variant="outline" onClick={() => setLocation("/artist/signup")}> 
            Join as a tattoo artist
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="container py-20">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              How it works for clients
            </h2>
          </div>

          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
            {clientSteps.map(({ title, body, icon: Icon }, index) => (
              <Card key={title} className="rounded-3xl border-border/60 bg-background p-8">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-7 w-7" />
                </div>
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">
                  Step {index + 1}
                </p>
                <h3 className="mb-3 text-xl font-semibold">{title}</h3>
                <p className="text-muted-foreground">{body}</p>
              </Card>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button size="lg" className="w-full sm:w-auto" onClick={() => setLocation("/client/new-request")}> 
              Start your tattoo request
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-20">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Why clients and artists use Ink Connect
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {whyInkConnect.map(({ title, body, icon: Icon }) => (
            <Card key={title} className="rounded-3xl border-border/60 p-8">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">{title}</h3>
              <p className="text-sm leading-6 text-muted-foreground">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y bg-muted/20">
        <div className="container py-20">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Questions people ask before starting
            </h2>
          </div>

          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            {faqs.map(({ question, answer }) => (
              <Card key={question} className="rounded-3xl border-border/60 bg-background p-8">
                <h3 className="mb-3 text-lg font-semibold">{question}</h3>
                <p className="text-muted-foreground">{answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Available Flash Art Section */}
      <section className="container py-20 bg-gradient-to-b from-background via-amber-500/5 to-background border-y">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold uppercase tracking-wider mb-4">
            <Crown className="w-3.5 h-3.5" />
            Elite Icon Exclusives
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Available Custom Flash Designs
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Lock down an exclusive, original design from our top-tier artists. A small deposit secures the design and automatically starts your booking.
          </p>
        </div>

        {flashLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !activeFlash || activeFlash.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-2xl max-w-xl mx-auto bg-muted/20">
            <p className="text-muted-foreground">
              No custom flash designs are currently available. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {activeFlash.map((item) => (
              <Card key={item.id} className="overflow-hidden bg-card border-border hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 group flex flex-col h-full">
                <div className="aspect-square relative overflow-hidden bg-muted">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none font-semibold flex items-center gap-1 shadow-md">
                      <Crown className="w-3 h-3" /> Exclusive
                    </Badge>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg leading-tight text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                        by <span className="text-foreground hover:underline cursor-pointer">{item.artistShopName}</span>
                      </p>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between border-t pt-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Price</p>
                        <p className="font-extrabold text-xl text-foreground">
                          ${(item.price / 100).toFixed(0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">To Lock</p>
                        <p className="font-bold text-sm text-amber-600 dark:text-amber-400">
                          ${(item.depositAmount / 100).toFixed(0)} Deposit
                        </p>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-md shadow-amber-500/10 gap-1.5"
                      onClick={() => handleLockFlashClick(item)}
                    >
                      <Sparkles className="w-4 h-4 fill-current" />
                      Lock with Deposit
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Lock Flash Art Booking Dialog */}
      <Dialog open={!!selectedFlash} onOpenChange={(open) => { if (!open) setSelectedFlash(null); }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 font-bold text-xl">
              <Crown className="w-5 h-5 text-amber-500" />
              Lock Flash Design
            </DialogTitle>
          </DialogHeader>
          {selectedFlash && (
            <form onSubmit={handleConfirmLock} className="space-y-4 pt-4">
              <div className="flex gap-4 items-start border-b pb-4">
                <img
                  src={selectedFlash.imageUrl}
                  alt={selectedFlash.title}
                  className="w-16 h-16 object-cover rounded-lg border flex-shrink-0"
                />
                <div className="space-y-1">
                  <h4 className="font-bold text-foreground leading-tight">{selectedFlash.title}</h4>
                  <p className="text-xs text-muted-foreground">by {selectedFlash.artistShopName}</p>
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    ${(selectedFlash.depositAmount / 100).toFixed(0)} deposit required
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lock-date">Preferred Appointment Date & Time</Label>
                <Input
                  id="lock-date"
                  type="datetime-local"
                  required
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  disabled={createCheckoutMutation.isPending}
                />
                <p className="text-[10px] text-muted-foreground">
                  Choose a tentative date. The artist will verify and confirm final scheduling with you.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lock-phone">Your Phone Number</Label>
                <Input
                  id="lock-phone"
                  type="tel"
                  placeholder="(555) 555-5555"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  disabled={createCheckoutMutation.isPending}
                />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Paying the <strong>${(selectedFlash.depositAmount / 100).toFixed(0)} deposit</strong> locks this custom design exclusively for you. Other users will no longer be able to purchase it, and a pending booking will be created on the artist's schedule.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedFlash(null)}
                  disabled={createCheckoutMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                  disabled={createCheckoutMutation.isPending}
                >
                  {createCheckoutMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    "Proceed to Deposit"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <section className="container py-20 border-b">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Latest ideas from the community
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            These are real requests from real people looking for artists right now.
          </p>
        </div>

        <HomepageFeed />

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" variant="outline" onClick={() => setLocation("/requests")}> 
            See All Open Requests
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" onClick={() => setLocation("/client/new-request")}> 
            Post Your Own Idea
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      <section className="container pb-20">
        <Card className="rounded-[2rem] border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-12 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Ready to move forward on your tattoo?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
            Submit your request as a client, or join as an artist to connect with people actively looking for tattoo work.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" className="w-full sm:w-auto" onClick={() => setLocation("/client/new-request")}> 
              Start your tattoo request
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation("/artist/signup")}
            >
              Join as a tattoo artist
            </Button>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            Clear request details. Realistic responses. No pressure to commit right away.
          </p>
        </Card>
      </section>

      <footer className="border-t bg-muted/30">
        <div className="container py-12">
          <div className="grid gap-8 md:grid-cols-[1.2fr_2fr] md:items-start">
            <div>
              <h3 className="mb-3 text-2xl font-bold">Ink Connect</h3>
              <p className="text-muted-foreground">
                Ink Connect helps clients and artists connect around clear, realistic tattoo planning.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <h4 className="mb-4 font-semibold">Explore</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="/artists" className="hover:text-primary">
                      Browse Artists
                    </Link>
                  </li>
                  <li>
                    <Link href="/for-artists" className="hover:text-primary">
                      For Artists
                    </Link>
                  </li>
                  <li>
                    <a href="/#how-it-works" className="hover:text-primary">
                      How It Works
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="mb-4 font-semibold">Support</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <a href="#" className="hover:text-primary">
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-primary">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-primary">
                      Terms of Service
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="mb-4 font-semibold">Contact</h4>
                <a
                  href="mailto:hello@inkedconnect.com"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  hello@inkedconnect.com
                </a>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Ink Connect. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
