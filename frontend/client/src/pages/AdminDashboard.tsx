import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { safeJsonParse } from "@/lib/utils";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  RefreshCcw,
  AlertTriangle,
  Star,
  MapPin,
  Mail,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Artist Approval Tab
// ──────────────────────────────────────────────

function ArtistApprovalPanel() {
  const { data: artists, isLoading, refetch } = trpc.artists.adminGetAll.useQuery();

  const approveMutation = trpc.artists.adminSetApproval.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.approved ? "Artist approved" : "Artist rejected");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!artists || artists.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-40" />
        <p className="text-lg font-medium">No artists yet</p>
      </div>
    );
  }

  const pending = artists.filter((a) => !a.isApproved);
  const approved = artists.filter((a) => a.isApproved);

  return (
    <div className="space-y-8">
      {/* Pending */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          Pending Approval
          <Badge variant="secondary">{pending.length}</Badge>
        </h3>
        {pending.length === 0 ? (
          <p className="text-muted-foreground text-sm">No pending artists.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((artist) => (
              <ArtistRow
                key={artist.id}
                artist={artist}
                onApprove={() =>
                  approveMutation.mutate({ artistId: artist.id, approved: true })
                }
                onReject={() =>
                  approveMutation.mutate({ artistId: artist.id, approved: false })
                }
                isPending={approveMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Approved */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          Approved Artists
          <Badge variant="secondary">{approved.length}</Badge>
        </h3>
        {approved.length === 0 ? (
          <p className="text-muted-foreground text-sm">No approved artists yet.</p>
        ) : (
          <div className="space-y-3">
            {approved.map((artist) => (
              <ArtistRow
                key={artist.id}
                artist={artist}
                onReject={() =>
                  approveMutation.mutate({ artistId: artist.id, approved: false })
                }
                isPending={approveMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ArtistRow({
  artist,
  onApprove,
  onReject,
  isPending,
}: {
  artist: {
    id: number;
    shopName: string | null;
    city: string | null;
    state: string | null;
    isApproved: boolean | null;
    createdAt: Date | null;
    userName: string | null;
    userEmail: string | null;
    verificationStatus: string | null;
  };
  onApprove?: () => void;
  onReject?: () => void;
  isPending: boolean;
}) {
  const [, setLocation] = useLocation();

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold truncate">
              {artist.shopName || "Unnamed Shop"}
            </span>
            {artist.isApproved ? (
              <Badge className="bg-green-600 text-white text-xs">Approved</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Pending
              </Badge>
            )}
            {artist.verificationStatus === "verified" && (
              <Badge className="bg-blue-600 text-white text-xs">
                <ShieldCheck className="w-3 h-3 mr-1" /> ID Verified
              </Badge>
            )}
            {artist.verificationStatus === "pending" && (
              <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-400">
                ID Pending
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
            {(artist.city || artist.state) && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {[artist.city, artist.state].filter(Boolean).join(", ")}
              </span>
            )}
            {artist.userEmail && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {artist.userEmail}
              </span>
            )}
            {artist.createdAt && (
              <span>
                Joined {new Date(artist.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setLocation(`/artist/${artist.id}`)}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
          {!artist.isApproved && onApprove && (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isPending}
              onClick={onApprove}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
            </Button>
          )}
          {onReject && (
            <Button
              size="sm"
              variant={artist.isApproved ? "outline" : "destructive"}
              disabled={isPending}
              onClick={onReject}
            >
              <XCircle className="w-4 h-4 mr-1" />
              {artist.isApproved ? "Revoke" : "Reject"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// ──────────────────────────────────────────────
// ID Verification Tab
// ──────────────────────────────────────────────

function VerificationPanel() {
  const { data: documents, isLoading, refetch } = trpc.verification.getPending.useQuery();
  const reviewMutation = trpc.verification.review.useMutation({
    onSuccess: () => {
      toast.success("Verification decision saved");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-40" />
        <p className="text-lg font-medium">No pending verifications</p>
        <p className="text-sm">All documents have been reviewed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {documents.map((item) => {
        const doc = item.document;
        const ocrVerdict = doc.ocrVerdict;
        const ocrIssues: string[] = safeJsonParse<string[]>(doc.ocrIssues, []);

        const verdictColor =
          ocrVerdict === "verified"
            ? "text-green-600"
            : ocrVerdict === "rejected"
              ? "text-red-600"
              : "text-yellow-600";

        return (
          <Card key={doc.id} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold">
                    {item.userName || "Unknown User"}
                  </span>
                  <Badge variant="outline">{doc.documentType}</Badge>
                  {ocrVerdict && (
                    <Badge
                      variant="outline"
                      className={`${verdictColor} border-current`}
                    >
                      AI: {ocrVerdict.replace("_", " ")}
                    </Badge>
                  )}
                  {doc.ocrConfidence != null && (
                    <span className="text-sm text-muted-foreground">
                      Confidence: {doc.ocrConfidence}%
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  {doc.ocrExtractedName && (
                    <div>
                      <span className="text-muted-foreground">Name: </span>
                      <span className="font-medium">{doc.ocrExtractedName}</span>
                    </div>
                  )}
                  {doc.ocrExtractedBusinessName && (
                    <div>
                      <span className="text-muted-foreground">Business: </span>
                      <span className="font-medium">{doc.ocrExtractedBusinessName}</span>
                    </div>
                  )}
                  {doc.ocrLicenseNumber && (
                    <div>
                      <span className="text-muted-foreground">License #: </span>
                      <span className="font-medium">{doc.ocrLicenseNumber}</span>
                    </div>
                  )}
                  {doc.ocrExpirationDate && (
                    <div>
                      <span className="text-muted-foreground">Expires: </span>
                      <span className="font-medium">{doc.ocrExpirationDate}</span>
                    </div>
                  )}
                  {doc.ocrIssuingAuthority && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Issued by: </span>
                      <span className="font-medium">{doc.ocrIssuingAuthority}</span>
                    </div>
                  )}
                  {doc.ocrNameMatch && (
                    <div>
                      <span className="text-muted-foreground">Name match: </span>
                      <span
                        className={`font-medium ${
                          doc.ocrNameMatch === "exact"
                            ? "text-green-600"
                            : doc.ocrNameMatch === "mismatch"
                              ? "text-red-600"
                              : "text-yellow-600"
                        }`}
                      >
                        {doc.ocrNameMatch}
                      </span>
                    </div>
                  )}
                </div>

                {doc.ocrVerdictReason && (
                  <p className="text-xs text-muted-foreground italic">
                    AI notes: {doc.ocrVerdictReason}
                  </p>
                )}

                {ocrIssues.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {ocrIssues.map((issue) => (
                      <Badge
                        key={issue}
                        variant="outline"
                        className="text-xs text-orange-600 border-orange-300"
                      >
                        {issue}
                      </Badge>
                    ))}
                  </div>
                )}

                <Textarea
                  placeholder="Review notes (optional)..."
                  className="text-sm"
                  rows={2}
                  value={reviewNotes[doc.id] || ""}
                  onChange={(e) =>
                    setReviewNotes((prev) => ({
                      ...prev,
                      [doc.id]: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={reviewMutation.isPending}
                  onClick={() =>
                    reviewMutation.mutate({
                      documentId: doc.id,
                      decision: "verified",
                      notes: reviewNotes[doc.id],
                    })
                  }
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Verify
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={reviewMutation.isPending}
                  onClick={() =>
                    reviewMutation.mutate({
                      documentId: doc.id,
                      decision: "rejected",
                      notes: reviewNotes[doc.id],
                    })
                  }
                >
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// Flagged Reviews Tab
// ──────────────────────────────────────────────

function FlaggedReviewsPanel() {
  const { data: reviews, isLoading, refetch } = trpc.moderation.getFlaggedReviews.useQuery();
  const updateMutation = trpc.moderation.updateReviewStatus.useMutation({
    onSuccess: () => {
      toast.success("Review status updated");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const reanalyzeMutation = trpc.moderation.reanalyzeReview.useMutation({
    onSuccess: () => {
      toast.success("Review re-analyzed");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-40" />
        <p className="text-lg font-medium">No flagged reviews</p>
        <p className="text-sm">All reviews are clean.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((item) => {
        const review = item.review;
        const flags: string[] = safeJsonParse<string[]>(review.moderationFlags, []);

        return (
          <Card key={review.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    by {item.userName || "Anonymous"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    → {item.artistName || "Unknown Artist"}
                  </span>
                  {review.moderationStatus === "hidden" && (
                    <Badge variant="destructive">
                      <EyeOff className="w-3 h-3 mr-1" /> Hidden
                    </Badge>
                  )}
                  {review.moderationStatus === "flagged" && (
                    <Badge className="bg-yellow-600 text-white">
                      <AlertTriangle className="w-3 h-3 mr-1" /> Flagged
                    </Badge>
                  )}
                </div>

                <p className="text-sm bg-muted/30 rounded-lg p-3 leading-relaxed">
                  {review.comment || <em className="text-muted-foreground">No comment</em>}
                </p>

                <div className="flex items-center gap-6 text-sm">
                  <ScorePill label="Toxicity" score={review.toxicityScore ?? 0} />
                  <ScorePill label="Spam" score={review.spamScore ?? 0} />
                  <ScorePill label="Fraud" score={review.fraudScore ?? 0} />
                </div>

                {flags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {flags.map((flag) => (
                      <Badge
                        key={flag}
                        variant="outline"
                        className="text-xs text-orange-600 border-orange-300"
                      >
                        {flag}
                      </Badge>
                    ))}
                  </div>
                )}

                {review.moderationReason && (
                  <p className="text-xs text-muted-foreground italic">
                    AI: {review.moderationReason}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-300 hover:bg-green-50"
                  disabled={updateMutation.isPending}
                  onClick={() =>
                    updateMutation.mutate({ reviewId: review.id, status: "approved" })
                  }
                >
                  <Eye className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={updateMutation.isPending}
                  onClick={() =>
                    updateMutation.mutate({ reviewId: review.id, status: "hidden" })
                  }
                >
                  <EyeOff className="w-4 h-4 mr-1" /> Hide
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={reanalyzeMutation.isPending}
                  onClick={() => reanalyzeMutation.mutate({ reviewId: review.id })}
                >
                  <RefreshCcw
                    className={`w-4 h-4 mr-1 ${reanalyzeMutation.isPending ? "animate-spin" : ""}`}
                  />
                  Re-analyze
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ScorePill({ label, score }: { label: string; score: number }) {
  const color =
    score >= 70 ? "text-red-600" : score >= 40 ? "text-yellow-600" : "text-green-600";
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-semibold ${color}`}>{score}</span>
    </div>
  );
}

// ──────────────────────────────────────────────
// Admin Dashboard Page
// ──────────────────────────────────────────────

export default function AdminDashboard() {
  const { data: artists } = trpc.artists.adminGetAll.useQuery();
  const { data: pendingDocs } = trpc.verification.getPending.useQuery();
  const { data: flaggedReviews } = trpc.moderation.getFlaggedReviews.useQuery();

  const pendingArtists = artists?.filter((a) => !a.isApproved).length ?? 0;
  const pendingVerifications = pendingDocs?.length ?? 0;
  const pendingReviews = flaggedReviews?.length ?? 0;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Approve artists, review ID documents, and moderate content.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-500">{pendingArtists}</p>
            <p className="text-sm text-muted-foreground mt-1">Artists Pending</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-500">{pendingVerifications}</p>
            <p className="text-sm text-muted-foreground mt-1">IDs to Review</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-orange-500">{pendingReviews}</p>
            <p className="text-sm text-muted-foreground mt-1">Flagged Reviews</p>
          </Card>
        </div>

        <Tabs defaultValue="artists" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="artists" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Artists
              {pendingArtists > 0 && (
                <Badge className="bg-yellow-500 text-white text-xs ml-1 h-5 px-1.5">
                  {pendingArtists}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              ID Verification
              {pendingVerifications > 0 && (
                <Badge className="bg-blue-500 text-white text-xs ml-1 h-5 px-1.5">
                  {pendingVerifications}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Reviews
              {pendingReviews > 0 && (
                <Badge className="bg-orange-500 text-white text-xs ml-1 h-5 px-1.5">
                  {pendingReviews}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="artists">
            <ArtistApprovalPanel />
          </TabsContent>

          <TabsContent value="verification">
            <VerificationPanel />
          </TabsContent>

          <TabsContent value="reviews">
            <FlaggedReviewsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
