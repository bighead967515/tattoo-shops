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
} from "lucide-react";

const audienceLanes = [
  {
    title: "Looking for a tattoo artist?",
    body:
      "Describe your idea, upload a few references, and let local artists come to you. Compare portfolios, styles, and real quotes, then pick the one that feels right.",
    cta: "Post a Request",
    href: "/client/new-request",
    icon: FileText,
  },
  {
    title: "Looking to fill your books?",
    body:
      "Browse client requests that match your style, send quotes on projects you actually want, and grow your client base without chasing leads or paying for ads.",
    cta: "Apply as an Artist",
    href: "/artist/register",
    icon: Palette,
  },
];

const clientSteps = [
  {
    title: "Describe your idea",
    body:
      "Tell us what you're thinking, style, placement, size, vibe. Upload any references you've got. The more detail, the better the quotes.",
    icon: FileText,
  },
  {
    title: "Get quotes from real artists",
    body:
      "Artists near you who do your style will review your post and send quotes. You'll see their portfolio, their message, and their price, all in one place.",
    icon: MessageSquare,
  },
  {
    title: "Book the right one",
    body:
      "Pick the artist that feels like the best fit. No commitment until you're ready. No pressure.",
    icon: CheckCircle,
  },
];

const artistSteps = [
  {
    title: "Build your profile",
    body:
      "Showcase your portfolio, tag your styles, and set your location. We review every artist before they go live, so the clients who find you know you're the real deal.",
    icon: Palette,
  },
  {
    title: "Browse client requests",
    body:
      "See what people in your area are looking for. Filter by style, placement, and budget. Send a quote when you see a project worth your time.",
    icon: MapPin,
  },
  {
    title: "Grow your books your way",
    body:
      "You set your price. You choose your projects. Ink Connect just connects the dots.",
    icon: Calendar,
  },
];

const whyInkConnect = [
  {
    title: "Hand-picked artists",
    body:
      "Every artist on the platform is individually reviewed. No random listings, no unvetted accounts.",
    icon: Star,
  },
  {
    title: "Real quotes, not estimates",
    body:
      "Artists send quotes based on your actual idea, not a generic price list. You know what you're getting into before you book.",
    icon: Wallet,
  },
  {
    title: "You're in control",
    body:
      "Browse at your own pace. Compare as many quotes as you want. Nobody's pushing you to book before you're ready.",
    icon: Award,
  },
  {
    title: "Safe studios, verified work",
    body:
      "All listed studios meet health and safety standards. Verified reviews come from clients with real bookings, not anonymous posts.",
    icon: Shield,
  },
];

const clientTestimonials = [
  {
    quote:
      '"I posted my idea on a Tuesday and had three quotes by Thursday. The artist I picked nailed exactly what I had in mind."',
    byline: "Client Name, City",
  },
  {
    quote:
      "\"I'd been trying to find someone who does Japanese traditional for months. Posted on Ink Connect and found them in two days.\"",
    byline: "Client Name, City",
  },
  {
    quote:
      '"It made the whole process way less stressful. I could compare portfolios and prices without feeling pressured."',
    byline: "Client Name, City",
  },
];

const artistTestimonials = [
  {
    quote:
      '"I get to pick the projects I actually want to do. That alone is worth it."',
    byline: "Artist Name, Style, City",
  },
  {
    quote:
      '"My books have been full for three months straight. Most of those bookings came through Ink Connect."',
    byline: "Artist Name, Style, City",
  },
];

const faqs = [
  {
    question: "Is it really free to post a request?",
    answer:
      "Yes. Posting your tattoo idea and receiving quotes is completely free for clients.",
  },
  {
    question: "How are artists vetted?",
    answer:
      "Every artist goes through a manual review before their profile goes live. We check portfolio quality, professionalism, and studio standards, not just follower counts.",
  },
  {
    question: "Do I have to book once I get quotes?",
    answer:
      "Not at all. You can receive quotes, compare artists, and take your time. There's no obligation until you decide to move forward.",
  },
  {
    question: "I'm an artist, is there a commission on bookings?",
    answer:
      "No commission on quotes. You work out the booking details directly with your client through Ink Connect.",
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
            <h1 className="mb-6 text-4xl font-bold leading-tight md:text-6xl">
              Your next tattoo starts with the right artist.
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-lg text-muted-foreground md:text-2xl">
              Post your idea, get quotes from vetted artists near you, and book the one that fits your style and your budget. No guesswork. No cold DMs.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={() => setLocation("/client/new-request")}
                className="px-8 py-6 text-lg"
              >
                Post Your Idea, It's Free
              </Button>
              <Button
                size="lg"
                variant="link"
                onClick={() => setLocation("/artists")}
                className="h-auto px-0 text-base text-foreground"
              >
                Browse Artist Portfolios
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <p className="mt-5 text-sm text-muted-foreground">
              Clients in Louisiana and beyond are already getting quotes. Join them.
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
            Here's how it works for clients
          </h2>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {clientSteps.map(({ title, body, icon: Icon }, index) => (
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
          <Button size="lg" onClick={() => setLocation("/client/new-request")}> 
            Post Your Idea, It's Free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="container py-20">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Here's how it works for artists
            </h2>
          </div>

          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
            {artistSteps.map(({ title, body, icon: Icon }, index) => (
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
            <Button size="lg" variant="outline" onClick={() => setLocation("/artist/register")}> 
              Apply to Join as an Artist
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-20">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Why people use Ink Connect
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
              What clients are saying
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {clientTestimonials.map(({ quote, byline }) => (
              <Card key={quote} className="rounded-3xl border-border/60 bg-background p-8">
                <p className="mb-5 text-lg leading-8">{quote}</p>
                <p className="text-sm font-medium text-muted-foreground">{byline}</p>
              </Card>
            ))}
          </div>

          <div className="mt-20 mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              What artists are saying
            </h2>
          </div>

          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {artistTestimonials.map(({ quote, byline }) => (
              <Card key={quote} className="rounded-3xl border-border/60 bg-background p-8">
                <p className="mb-5 text-lg leading-8">{quote}</p>
                <p className="text-sm font-medium text-muted-foreground">{byline}</p>
              </Card>
            ))}
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

      <section className="container py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            A few things people ask before signing up
          </h2>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          {faqs.map(({ question, answer }) => (
            <Card key={question} className="rounded-3xl border-border/60 p-8">
              <h3 className="mb-3 text-lg font-semibold">{question}</h3>
              <p className="text-muted-foreground">{answer}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="container pb-20">
        <Card className="rounded-[2rem] border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-12 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Ready to find your match?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
            Whether you're looking for your next tattoo or your next client, Ink Connect is where that starts.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" onClick={() => setLocation("/client/new-request")}> 
              Post Your Idea, It's Free
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation("/artist/register")}
            >
              Apply as an Artist
            </Button>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
            No pressure. No spam. Just the right connection.
          </p>
        </Card>
      </section>

      <footer className="border-t bg-muted/30">
        <div className="container py-12">
          <div className="grid gap-8 md:grid-cols-[1.2fr_2fr] md:items-start">
            <div>
              <h3 className="mb-3 text-2xl font-bold">Ink Connect</h3>
              <p className="text-muted-foreground">
                Ink Connect, Where ideas meet artists.
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
                  href="mailto:hello@universalinc.pro"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  hello@universalinc.pro
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
