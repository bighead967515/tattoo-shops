import { trpc } from "@/lib/trpc";
import RequestCard from "./RequestCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { AlertCircle } from "lucide-react";

function FeedSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex flex-col space-y-3">
          <Skeleton className="h-[250px] w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomepageFeed() {
  const [, setLocation] = useLocation();
  const { data: requests, isLoading, isError, error } = trpc.requests.listForHomepage.useQuery();

  if (isLoading) {
    return <FeedSkeleton />;
  }

  if (isError) {
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
            <h3 className="text-xl font-semibold mb-2">No open requests yet!</h3>
            <p className="text-muted-foreground mb-6">Be the first one to post a public request and get bids from artists.</p>
            <Button onClick={() => setLocation('/client/new-request')}>Post a Request</Button>
        </div>
      )
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {requests.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </div>
      <div className="text-center mt-12">
        <Button size="lg" onClick={() => setLocation("/requests")} className="px-8">
          View All Requests
        </Button>
      </div>
    </>
  );
}
