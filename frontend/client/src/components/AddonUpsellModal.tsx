import { useState } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, MessageSquare, Bot, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

export interface AddonUpsellModalProps {
  requestId: number;
  open: boolean;
  onClose: () => void;
}

type AddonKey =
  | "priorityListing"
  | "inAppChat"
  | "aiDesign"
  | "blindBids";

interface Addon {
  key: AddonKey;
  icon: React.ReactNode;
  label: string;
  price: number;
  tagline: string;
  iconBg: string;
  badge?: string;
}

// ── Add-on data ────────────────────────────────────────────────────────────

const ADDONS: Addon[] = [
  {
    key: "priorityListing",
    icon: <Zap className="h-5 w-5 text-amber-400" />,
    label: "Priority Listing",
    price: 2.99,
    tagline: "Boost your request to the top of the artist feed for 7 days",
    iconBg: "bg-amber-500/15 border-amber-500/30",
    badge: "Most Popular",
  },
  {
    key: "inAppChat",
    icon: <MessageSquare className="h-5 w-5 text-green-400" />,
    label: "In-App Chat",
    price: 1.99,
    tagline: "Unlock direct chat with all artists who bid on your request",
    iconBg: "bg-green-500/15 border-green-500/30",
  },
  {
    key: "aiDesign",
    icon: <Bot className="h-5 w-5 text-violet-400" />,
    label: "AI Design Concept",
    price: 2.99,
    tagline: "Get an AI-generated concept image based on your description",
    iconBg: "bg-violet-500/15 border-violet-500/30",
  },
  {
    key: "blindBids",
    icon: <Lock className="h-5 w-5 text-blue-400" />,
    label: "Blind Bids",
    price: 3.99,
    tagline:
      "Hide bid amounts from competing artists so they can't undercut each other",
    iconBg: "bg-blue-500/15 border-blue-500/30",
  },
];

// ── Component ──────────────────────────────────────────────────────────────

export default function AddonUpsellModal({
  requestId,
  open,
  onClose,
}: AddonUpsellModalProps) {
  const [, setLocation] = useLocation();
  const [selected, setSelected] = useState<Set<AddonKey>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Mock purchase handler — simulates the tRPC call to
   * `trpc.requests.purchaseAddon.mutate({ requestId, addons: [...] })`
   * which will redirect to a Stripe Checkout URL.
   * Replace this with the real tRPC mutation once the backend endpoint is deployed.
   */
  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      // TODO: replace mock with real tRPC call:
      // const result = await trpc.requests.purchaseAddon.mutate({
      //   requestId,
      //   addons: Array.from(selected),
      // });
      // if (result.checkoutUrl) window.location.href = result.checkoutUrl;
      await new Promise<void>((resolve) => setTimeout(resolve, 1500));
      toast.success("Redirecting to checkout...", {
        description: "You'll be taken to Stripe to complete payment.",
      });
      onClose();
      setLocation(`/requests/${requestId}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Please try again.";
      toast.error("Failed to purchase add-ons", { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAddon = (key: AddonKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const total = Array.from(selected).reduce((sum, key) => {
    const addon = ADDONS.find((a) => a.key === key);
    return sum + (addon?.price ?? 0);
  }, 0);

  const noneSelected = selected.size === 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="max-w-md rounded-3xl border border-border/60 bg-background/95 backdrop-blur-xl p-0 overflow-hidden"
        aria-labelledby="addon-modal-title"
        aria-describedby="addon-modal-desc"
      >
        {/* Top gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-violet-500 to-blue-500" />

        <div className="px-6 pt-6 pb-8 space-y-6">
          <DialogHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle
                id="addon-modal-title"
                className="text-xl font-bold leading-tight"
              >
                Supercharge Your Request
              </DialogTitle>
            </div>
            <DialogDescription
              id="addon-modal-desc"
              className="text-muted-foreground text-sm"
            >
              Optional add-ons to help you get better bids faster
            </DialogDescription>
          </DialogHeader>

          {/* Add-on cards */}
          <div className="space-y-3">
            {ADDONS.map((addon) => {
              const isChecked = selected.has(addon.key);
              return (
                <button
                  key={addon.key}
                  type="button"
                  onClick={() => toggleAddon(addon.key)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
                    isChecked
                      ? "border-primary/50 bg-primary/8 shadow-[0_0_12px_rgba(112,255,112,0.1)]"
                      : "border-border/60 hover:border-border hover:bg-muted/40"
                  }`}
                  id={`addon-${addon.key}`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleAddon(addon.key)}
                      className="mt-0.5 flex-shrink-0"
                      aria-label={`Select ${addon.label}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border ${addon.iconBg}`}
                    >
                      {addon.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{addon.label}</span>
                        {addon.badge && (
                          <Badge className="text-[10px] h-4 px-1.5 bg-primary/15 text-primary border-primary/30">
                            {addon.badge}
                          </Badge>
                        )}
                        <span className="ml-auto font-bold text-sm text-primary">
                          ${addon.price.toFixed(2)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                        {addon.tagline}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Running total */}
          {!noneSelected && (
            <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
              <span className="text-sm text-muted-foreground">
                {selected.size} add-on{selected.size !== 1 ? "s" : ""} selected
              </span>
              <span className="font-bold text-base">
                Total: ${total.toFixed(2)}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              id="addon-purchase-btn"
              className="w-full gap-2 rounded-xl py-5 font-semibold shadow-[0_0_15px_rgba(112,255,112,0.25)] hover:shadow-[0_0_25px_rgba(112,255,112,0.5)] transition-all duration-300"
              disabled={noneSelected || isLoading}
              onClick={handlePurchase}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : noneSelected ? (
                "Select at least one add-on"
              ) : (
                <>
                  Add to Request — ${total.toFixed(2)}
                  <Zap className="h-4 w-4" />
                </>
              )}
            </Button>

            <Button
              id="addon-skip-btn"
              variant="ghost"
              className="w-full rounded-xl text-muted-foreground hover:text-foreground"
              onClick={onClose}
              disabled={isLoading}
            >
              Skip for Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
