import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, Eye, Briefcase, Calendar } from "lucide-react";
import UpgradePrompt from "./UpgradePrompt";
import { format } from "date-fns";

function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="p-4 border rounded-lg flex justify-between items-center">
          <div className="space-y-2 flex-grow">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
      ))}
    </div>
  );
}

export default function ArtistDashboardFeed() {
  const { data: requests, isLoading, isError, error } = trpc.requests.listForArtistDashboard.useQuery();

  if (isLoading) {
    return <FeedSkeleton />;
  }

  if (isError) {
    // Handle the specific "FORBIDDEN" error for free users
    if (error.data?.code === 'FORBIDDEN') {
      return (
        <UpgradePrompt 
          feature="View Tattoo Requests"
          description="Upgrade to a paid plan to view and bid on new tattoo requests from clients."
        />
      );
    }
    
    // Handle other generic errors
    return (
      <div className="text-center py-10 px-4 border rounded-md bg-destructive/10 text-destructive">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Could not load requests</h3>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }
  
  if (!requests || requests.length === 0) {
      return (
        <div className="text-center py-10 px-4 border-2 border-dashed rounded-md">
            <h3 className="text-xl font-semibold mb-2">No Open Requests Right Now</h3>
            <p className="text-muted-foreground">Check back later for new opportunities to bid on.</p>
        </div>
      )
  }

  return (
    <div className="space-y-4">
      {requests.map(request => (
        <div key={request.id} className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center">
            <div className="flex-grow mb-4 sm:mb-0">
              <h3 className="font-semibold text-lg">{request.title}</h3>
              <p className="text-sm text-muted-foreground">
                Posted on {format(new Date(request.createdAt), "MMM d, yyyy")} • {request.client.city}, {request.client.state}
              </p>
            </div>
            <Link href={`/requests/${request.id}`}>
              <Button asChild>
                <a>View & Bid</a>
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t text-sm">
            <div>
              <div className="text-muted-foreground font-semibold flex items-center"><Briefcase className="w-4 h-4 mr-2" />Style</div>
              <p>{request.style}</p>
            </div>
            <div>
              <div className="text-muted-foreground font-semibold flex items-center"><Calendar className="w-4 h-4 mr-2" />Timeframe</div>
              <p>{request.desiredTimeframe}</p>
            </div>
            <div>
              <div className="text-muted-foreground font-semibold flex items-center"><Eye className="w-4 h-4 mr-2" />Views</div>
              <p>{request.viewCount}</p>
            </div>
            <div>
              <div className="text-muted-foreground font-semibold flex items-center"><Eye className="w-4 h-4 mr-2" />Bids</div>
              <p>{request.bidCount}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
