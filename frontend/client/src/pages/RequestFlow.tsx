import { useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, FileText, Goal, MessageSquare, CheckCircle2 } from "lucide-react";

const flowSteps = [
  {
    title: "Step 1: Share your tattoo idea",
    body: "Upload photos or describe your vision so artists can evaluate your project.",
    icon: FileText,
  },
  {
    title: "Step 2: Define your goals",
    body: "Describe your style, budget range, and timeline preferences.",
    icon: Goal,
  },
  {
    title: "Step 3: Receive artist responses",
    body: "Artists reply with their approach, scope, and expected timing.",
    icon: MessageSquare,
  },
  {
    title: "Step 4: Compare and move forward",
    body: "Review fit, ask follow-up questions, and choose your next step.",
    icon: CheckCircle2,
  },
];

export default function RequestFlow() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="border-b bg-gradient-to-br from-background via-background to-primary/10 py-20">
        <div className="container mx-auto max-w-5xl px-4 text-center">
          <h1 className="mb-5 text-3xl font-bold leading-tight sm:text-4xl md:text-6xl">
            How tattoo requests work on Ink Connect
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-lg text-muted-foreground md:text-xl">
            A clear process that helps clients submit better tattoo requests and helps artists respond with better-fit plans.
          </p>
          <Button size="lg" className="w-full px-8 py-6 text-lg sm:w-auto" onClick={() => setLocation("/client/new-request")}> 
            Start your tattoo request
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      <section className="container py-16">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          {flowSteps.map(({ title, body, icon: Icon }) => (
            <Card key={title} className="rounded-3xl border-border/60 p-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">{title}</h2>
              <p className="text-muted-foreground">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y bg-muted/20 py-16">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Why this flow works</h2>
          <p className="text-lg text-muted-foreground">
            Better request detail leads to better first responses. Clients gain clarity faster, and artists can focus on projects that match their process.
          </p>
        </div>
      </section>

      <section className="container py-16 text-center">
        <h2 className="mb-4 text-3xl font-bold">Your best tattoo starts with a better request.</h2>
        <Button size="lg" className="w-full px-8 py-6 text-lg sm:w-auto" onClick={() => setLocation("/client/new-request")}> 
          Start your tattoo request
        </Button>
      </section>
    </div>
  );
}
