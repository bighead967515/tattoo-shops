import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, FileText, ImagePlus, MessageSquare } from "lucide-react";

const requestInputs = [
  "Current tattoo photos",
  "Placement and size",
  "Preferred style direction",
  "Budget range and timeline",
  "Willingness to travel",
];

const nextSteps = [
  {
    title: "Submit your details",
    body: "Share what you have now and what outcome you want next.",
    icon: FileText,
  },
  {
    title: "Get specialist responses",
    body: "Artists review your request and respond with realistic approaches.",
    icon: MessageSquare,
  },
  {
    title: "Compare and choose",
    body: "Review portfolios, ask follow-up questions, and move forward when ready.",
    icon: CheckCircle2,
  },
];

export default function CoverUps() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="border-b bg-gradient-to-br from-background via-background to-primary/10 py-20">
        <div className="container mx-auto max-w-5xl px-4 text-center">
          <h1 className="mb-5 text-3xl font-bold leading-tight sm:text-4xl md:text-6xl">
            From tattoo regret to a new masterpiece.
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-lg text-muted-foreground md:text-xl">
            You are not stuck. Start a clear tattoo request so artists can evaluate your options and help you move forward.
          </p>
          <Button size="lg" className="w-full px-8 py-6 text-lg sm:w-auto" onClick={() => setLocation("/client/new-request")}> 
            Start your tattoo request
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      <section className="container py-16">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          <Card className="rounded-3xl border-border/60 p-8">
            <h2 className="mb-3 text-2xl font-semibold">What to include in your request</h2>
            <p className="mb-5 text-muted-foreground">
              You do not need perfect wording. You only need enough detail for artists to assess fit.
            </p>
            <ul className="space-y-2">
              {requestInputs.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ImagePlus className="h-4 w-4 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="rounded-3xl border-border/60 p-8">
            <h2 className="mb-3 text-2xl font-semibold">Set clear expectations</h2>
            <p className="text-muted-foreground">
              Every tattoo is different. Some can be covered directly, while others may need a staged approach.
              Artist review is what determines the right path.
            </p>
          </Card>
        </div>
      </section>

      <section className="border-y bg-muted/20 py-16">
        <div className="container">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">How the process works</h2>
          </div>

          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
            {nextSteps.map(({ title, body, icon: Icon }) => (
              <Card key={title} className="rounded-3xl border-border/60 bg-background p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{title}</h3>
                <p className="text-muted-foreground">{body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-16 text-center">
        <h2 className="mb-4 text-3xl font-bold">Ready to take the next step?</h2>
        <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
          Start your request and hear from artists who understand how to transform your tattoo vision.
        </p>
        <Button size="lg" className="w-full px-8 py-6 text-lg sm:w-auto" onClick={() => setLocation("/client/new-request")}> 
          Start your tattoo request
        </Button>
      </section>
    </div>
  );
}
