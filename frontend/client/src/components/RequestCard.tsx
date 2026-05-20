import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import type { AppRouter } from "@/../../backend/server/routers";
import type { inferRouterOutputs } from "@trpc/server";

// Infer the type of a single request from the router output
type RouterOutput = inferRouterOutputs<AppRouter>;
type TattooRequest = RouterOutput["requests"]["listForHomepage"][0];

interface RequestCardProps {
  request: TattooRequest;
}

// Addon badge config — maps backend addon key → display props
const ADDON_BADGES = [
  {
    key: "priorityListing",
    label: "⚡ Priority",
    className:
      "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/20",
  },
  {
    key: "inAppChat",
    label: "💬 Chat",
    className:
      "bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/20",
  },
  {
    key: "aiDesign",
    label: "🤖 AI Design",
    className:
      "bg-violet-500/15 text-violet-400 border-violet-500/30 hover:bg-violet-500/20",
  },
  {
    key: "blindBids",
    label: "🔒 Blind Bids",
    className:
      "bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/20",
  },
] as const;

type AddonKey = (typeof ADDON_BADGES)[number]["key"];

export default function RequestCard({ request }: RequestCardProps) {
  // Find the main image or default to the first one
  const mainImage =
    request.images.find((img: TattooRequest["images"][0]) => img.isMainImage) ||
    request.images[0];
  const clientDisplayName = request.client?.displayName ?? "Unknown client";

  // selectedAddons is an array of string keys stored on the request
  const selectedAddons = (request.selectedAddons ?? []) as string[];
  const activeAddonBadges = ADDON_BADGES.filter((b) =>
    selectedAddons.includes(b.key as AddonKey),
  );

  return (
    <Link href={`/requests/${request.id}`} className="block group">
      <Card className="overflow-hidden h-full flex flex-col">
        <div className="aspect-square overflow-hidden">
          {mainImage ? (
            <img
              src={mainImage.imageUrl}
              alt={request.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-sm text-muted-foreground">No Image</span>
            </div>
          )}
        </div>
        <CardContent className="p-4 flex flex-col flex-grow">
          <h3 className="font-semibold text-lg leading-tight truncate group-hover:text-primary transition-colors">
            {request.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 flex-grow">
            by {clientDisplayName}
          </p>

          {/* Add-on badges row */}
          {activeAddonBadges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {activeAddonBadges.map((badge) => (
                <Badge
                  key={badge.key}
                  variant="outline"
                  className={`text-[10px] h-5 px-1.5 font-medium ${badge.className}`}
                >
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <Badge variant="secondary">{request.style || "Any Style"}</Badge>
            <div className="flex items-center text-sm text-muted-foreground">
              <MessageSquare className="w-4 h-4 mr-1.5" />
              {request.bidCount} {request.bidCount === 1 ? "Bid" : "Bids"}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
