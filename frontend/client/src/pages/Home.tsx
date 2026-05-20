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
  Sparkles,
} from "lucide-react";

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
          <Button size="lg" className="w-full sm:w-auto" variant="outline" onClick={() => setLocation("/artist/register")}> 
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

      {/* ── AI Price Estimator CTA Banner ── */}
      <section className="border-y">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-violet-500/8 to-primary/10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(112,255,112,0.08),_transparent_70%)]" />
          <div className="container relative py-14">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 border border-primary/30">
                  <Sparkles className="h-7 w-7 text-primary animate-pulse" />
                </div>
              </div>
              <h2 className="mb-3 text-3xl font-bold md:text-4xl">
                Not sure what your tattoo will cost?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Get a free instant estimate powered by AI — no account needed
              </p>
              <Button
                size="lg"
                className="gap-2 px-8 shadow-[0_0_20px_rgba(112,255,112,0.35)] hover:shadow-[0_0_30px_rgba(112,255,112,0.6)] transition-all duration-300"
                onClick={() => setLocation("/estimate")}
                id="home-estimator-cta"
              >
                <Sparkles className="h-4 w-4" />
                Get a Free Estimate
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <p className="mt-4 text-sm text-muted-foreground">
                Takes 30 seconds · Free · No sign-up required
              </p>
            </div>
          </div>
        </div>
      </section>

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
              onClick={() => setLocation("/artist/register")}
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
                    <Link href="/client/new-request" className="hover:text-primary">
                      Post a Request
                    </Link>
                  </li>
                  <li>
                    <Link href="/tattoo-planning" className="hover:text-primary">
                      Tattoo Planning Help
                    </Link>
                  </li>
                  <li>
                    <Link href="/request-flow" className="hover:text-primary">
                      Request Flow
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
                    <Link href="/help" className="hover:text-primary">
                      Help Center
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy-policy" className="hover:text-primary">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms-of-service" className="hover:text-primary">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="mb-4 font-semibold">Contact</h4>
                <a
                  href="mailto:hello@theinkednetwork.website"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  hello@theinkednetwork.website
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
