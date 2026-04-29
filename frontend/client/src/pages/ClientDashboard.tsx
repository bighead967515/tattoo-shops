import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Gavel,
  Sparkles,
  ExternalLink,
} from "lucide-react";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function getStatusColor(status: string) {
  switch (status) {
    case "open":
      return "bg-green-500/10 text-green-600 border-green-500/20";
    case "in_progress":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "completed":
      return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    case "cancelled":
      return "bg-red-500/10 text-red-600 border-red-500/20";
    default:
      return "";
  }
}


export default function ClientDashboard() {
  const { user, loading: authLoading } = useAuth();

  const { data: myRequests, isLoading: requestsLoading, refetch: refetchRequests } =
    trpc.requests.getMyRequests.useQuery(undefined, {
      enabled: user?.role === "client",
    });

  const cancelRequestMutation = trpc.requests.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Request cancelled");
      void refetchRequests();
    },
    onError: (err) => toast.error(err.message),
  });

  if (authLoading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
        <p className="text-muted-foreground mb-4">
          You need to be signed in to access your dashboard.
        </p>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  if (user.role !== "client") {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Client Account Required</h1>
        <p className="text-muted-foreground mb-4">
          Create a client profile to access this dashboard.
        </p>
        <Link href="/client/onboarding">
          <Button>Become a Client</Button>
        </Link>
      </div>
    );
  }

  type RequestType = NonNullable<typeof myRequests>[number];

  const processRequests = (requests: RequestType[] | undefined) =>
    requests?.map((r) => ({ ...r, viewCount: r.viewCount ?? 0 })) ?? [];

  const allProcessedRequests = processRequests(myRequests);
  const openRequests = allProcessedRequests.filter((r) => r.status === "open");
  const inProgressRequests = allProcessedRequests.filter(
    (r) => r.status === "in_progress",
  );
  const completedRequests = allProcessedRequests.filter(
    (r) => r.status === "completed",
  );
  const totalBids =
    myRequests?.reduce(
      (sum: number, r: RequestType) => sum + (r.bidCount ?? 0),
      0,
    ) ?? 0;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Curation Hub</h1>
          <p className="text-muted-foreground mt-1">
            Manage your tattoo requests and artist bids
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <Link href="/client/design-lab">
            <Button variant="outline">
              <Sparkles className="mr-2 h-4 w-4" />
              AI Design Lab
            </Button>
          </Link>
          <Link href="/client/new-request">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{openRequests.length}</p>
                <p className="text-sm text-muted-foreground">Open Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {inProgressRequests.length}
                </p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Gavel className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalBids}</p>
                <p className="text-sm text-muted-foreground">Total Bids</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedRequests.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Tabs */}
      <Tabs defaultValue="open" className="space-y-4">
        <TabsList>
          <TabsTrigger value="open" className="gap-2">
            <FileText className="h-4 w-4" />
            Open ({openRequests.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="gap-2">
            <Clock className="h-4 w-4" />
            In Progress ({inProgressRequests.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed ({completedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            All ({myRequests?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open">
          <RequestList requests={openRequests} loading={requestsLoading} onCancel={(id) => cancelRequestMutation.mutate({ requestId: id, status: "cancelled" })} />
        </TabsContent>

        <TabsContent value="in_progress">
          <RequestList
            requests={inProgressRequests}
            loading={requestsLoading}
          />
        </TabsContent>

        <TabsContent value="completed">
          <RequestList requests={completedRequests} loading={requestsLoading} />
        </TabsContent>

        <TabsContent value="all">
          <RequestList
            requests={allProcessedRequests}
            loading={requestsLoading}
            onCancel={(id) => cancelRequestMutation.mutate({ requestId: id, status: "cancelled" })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface RequestListProps {
  requests: {
    id: number;
    title: string;
    description: string;
    status: string;
    style: string | null;
    placement: string;
    size: string;
    budgetMin: number | null;
    budgetMax: number | null;
    viewCount: number;
    bidCount: number;
    createdAt: Date;
  }[];
  loading: boolean;
  onCancel?: (id: number) => void;
}

function RequestList({ requests, loading, onCancel }: RequestListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <Skeleton className="h-4 w-1/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Requests</h3>
          <p className="text-muted-foreground mb-4">
            You haven't posted any tattoo requests yet.
          </p>
          <Link href="/client/new-request">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Post Your First Request
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        return (
          <Card key={request.id} className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold truncate">
                      {request.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className={getStatusColor(request.status)}
                    >
                      {request.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {request.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {request.style && (
                      <Badge variant="secondary">{request.style}</Badge>
                    )}
                    <Badge variant="secondary">{request.placement}</Badge>
                    <Badge variant="secondary">{request.size}</Badge>
                    {request.budgetMax && (
                      <Badge variant="outline">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {request.budgetMin
                          ? formatCurrency(request.budgetMin) + " – "
                          : "Up to "}
                        {formatCurrency(request.budgetMax)}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end gap-4 md:gap-2 text-sm text-muted-foreground shrink-0">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{request.viewCount} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Gavel className="h-4 w-4" />
                    <span className="font-medium text-foreground">
                      {request.bidCount} bids
                    </span>
                  </div>
                  <p className="text-xs">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <Link href={`/requests/${request.id}`}>
                  <Button size="sm" variant="outline">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {request.bidCount > 0 ? `View ${request.bidCount} Bid${request.bidCount !== 1 ? "s" : ""}` : "View Request"}
                  </Button>
                </Link>
                {request.status === "open" && onCancel && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => onCancel(request.id)}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Skeleton className="h-10 w-96 mb-4" />

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <Skeleton className="h-4 w-1/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
