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

export default function RequestCard({ request }: RequestCardProps) {
  // Find the main image or default to the first one
  const mainImage = request.images.find((img: TattooRequest['images'][0]) => img.isMainImage) || request.images[0];

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
              by {request.client.displayName}
            </p>
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
