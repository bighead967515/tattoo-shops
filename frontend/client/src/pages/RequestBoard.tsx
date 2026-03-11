import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  MapPin,
  DollarSign,
  Clock,
  Eye,
  MessageSquare,
  Filter,
  Plus,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const TATTOO_STYLES = [
  "All Styles",
  "Traditional",
  "Neo-Traditional",
  "Realism",
  "Watercolor",
  "Blackwork",
  "Tribal",
  "Japanese",
  "Minimalist",
  "Geometric",
  "Dotwork",
];

export default function RequestBoard() {
  const { user } = useAuth();
  const [styleFilter, setStyleFilter] = useState<string>("All Styles");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: requests, isLoading } = trpc.requests.getOpen.useQuery({
    style: styleFilter !== "All Styles" ? styleFilter : undefined,
    limit: 50,
  });

  type RequestType = NonNullable<typeof requests>[number];
  const filteredRequests = requests?.filter((request: RequestType) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (request.title || "").toLowerCase().includes(query) ||
      (request.description || "").toLowerCase().includes(query) ||
      (request.placement || "").toLowerCase().includes(query)
    );
  });

  const formatBudget = (min?: number | null, max?: number | null) => {
    const hasMin = min != null;
    const hasMax = max != null;

    if (!hasMin && !hasMax) return "Flexible";
    if (hasMin && hasMax)
      return `$${(min / 100).toFixed(2)} - $${(max / 100).toFixed(2)}`;
    if (hasMin) return `From $${(min / 100).toFixed(2)}`;
    return `Up to $${(max! / 100).toFixed(2)}`;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tattoo Request Board</h1>
          <p className="text-muted-foreground mt-1">
            Browse tattoo requests from clients looking for artists
          </p>
        </div>

        {user?.role === "client" && (
          <Link href="/client/new-request">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Post a Request
            </Button>
          </Link>
        )}

        {!user && (
          <Link href="/login">
            <Button variant="outline">Sign in to post a request</Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search requests"
              />
            </div>

            <Select value={styleFilter} onValueChange={setStyleFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by style" />
              </SelectTrigger>
              <SelectContent>
                {TATTOO_STYLES.map((style) => (
                  <SelectItem key={style} value={style}>
                    {style}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Request Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredRequests?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No requests found matching your criteria.
            </p>
            {user?.role === "client" && (
              <Link href="/client/new-request">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Be the first to post a request
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRequests?.map((request: RequestType) => (
            <Link key={request.id} href={`/requests/${request.id}`}>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                {/* Request Image */}
                {request.images?.[0] && (
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <img
                      src={
                        request.images.find(
                          (i: { isMainImage: boolean }) => i.isMainImage,
                        )?.imageUrl || request.images[0].imageUrl
                      }
                      alt={request.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-1">
                      {request.title}
                    </CardTitle>
                    {request.style && (
                      <Badge variant="secondary">{request.style}</Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {request.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {formatBudget(request.budgetMin, request.budgetMax)}
                    </span>
                    <span className="flex items-center gap-1">
                      {request.placement}
                    </span>
                  </div>

                  {(request.preferredCity || request.preferredState) && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {[request.preferredCity, request.preferredState]
                        .filter(Boolean)
                        .join(", ")}
                      {request.willingToTravel && " (willing to travel)"}
                    </div>
                  )}

                  {request.desiredTimeframe && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {request.desiredTimeframe}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="border-t pt-4">
                  <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {request.viewCount} views
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {request.bidCount} bids
                    </span>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
