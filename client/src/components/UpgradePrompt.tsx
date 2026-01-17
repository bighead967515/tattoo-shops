import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Crown, Zap } from "lucide-react";
import { Link } from "wouter";

interface UpgradePromptProps {
  feature: string;
  description: string;
  inline?: boolean;
}

export default function UpgradePrompt({ feature, description, inline = false }: UpgradePromptProps) {
  if (inline) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-lg">
        <Crown className="h-4 w-4 text-primary" />
        <span className="text-sm text-muted-foreground">{description}</span>
        <Link href="/pricing">
          <Button size="sm" variant="default" className="ml-2">
            <Zap className="h-3 w-3 mr-1" />
            Upgrade
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 border-primary/30">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-full bg-primary/20">
          <Crown className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">{feature} - Premium Feature</h3>
          <p className="text-muted-foreground mb-4">{description}</p>
          <Link href="/pricing">
            <Button variant="default" className="group">
              <Zap className="h-4 w-4 mr-2 group-hover:animate-pulse" />
              Upgrade to Premium
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
