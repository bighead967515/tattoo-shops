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
import { Label } from "@/components/ui/label";
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
  CreditCard,
  Calendar,
  Sparkles,
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
                    {item.user?.name || "Unknown User"}
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
// Refund Requests Tab
// ──────────────────────────────────────────────

function RefundRequestsPanel() {
  const { data: requests, isLoading, refetch } = trpc.bookings.adminGetRefundRequests.useQuery();

  const reviewMutation = trpc.bookings.adminReviewRefund.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.approve ? "Refund approved and processed" : "Refund request rejected");
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

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-40" />
        <p className="text-lg font-medium">No pending refund requests</p>
        <p className="text-sm">All requests have been processed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((item) => {
        const booking = item.booking;
        const requestedAt = booking.refundRequestedAt
          ? new Date(booking.refundRequestedAt).toLocaleDateString()
          : "Unknown date";

        return (
          <Card key={booking.id} className="p-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-lg">
                    Refund Request #{booking.id}
                  </span>
                  <Badge className="bg-yellow-500 text-white text-xs">
                    Pending Review
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Requested: {requestedAt}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm bg-muted/20 p-4 rounded-lg border">
                  <div>
                    <h4 className="font-semibold text-muted-foreground mb-1">Client Details</h4>
                    <p className="font-medium text-foreground">{item.clientName || "Unknown Client"}</p>
                    <p className="text-muted-foreground text-xs">{booking.customerEmail || "No customer email"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-muted-foreground mb-1">Artist Details</h4>
                    <p className="font-medium text-foreground">{item.artistName || "Unknown Artist"}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                    Refund Reason
                  </h4>
                  <p className="text-sm text-foreground bg-muted/30 p-3 rounded border italic">
                    "{booking.refundReason || "No reason provided."}"
                  </p>
                </div>

                <div className="flex items-center gap-2 text-green-600">
                  <CreditCard className="w-4 h-4" />
                  <span className="font-medium">
                    Deposit Amount to Refund: ${(booking.depositAmount || 0) / 100}
                  </span>
                </div>
              </div>

              <div className="flex md:flex-col items-stretch gap-2 shrink-0 md:w-48">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                  disabled={reviewMutation.isPending}
                  onClick={() =>
                    reviewMutation.mutate({ bookingId: booking.id, approve: true })
                  }
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Approve Refund
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={reviewMutation.isPending}
                  onClick={() =>
                    reviewMutation.mutate({ bookingId: booking.id, approve: false })
                  }
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Reject Request
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming",
];

function InvitationsPanel() {
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>("all");
  const [entryMode, setEntryMode] = useState<"manual" | "csv">("manual");
  
  // Manual entry fields
  const [manualEmail, setManualEmail] = useState("");
  const [manualShopName, setManualShopName] = useState("");
  const [manualState, setManualState] = useState("Louisiana");
  const [manualBatch, setManualBatch] = useState<{ email: string; shopName: string; state: string }[]>([]);

  // CSV parsing state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvBatch, setCsvBatch] = useState<{ email: string; shopName: string; state: string; error?: string }[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);

  // Queries & Mutations
  const utils = trpc.useUtils();
  const { data: invitations, isLoading: historyLoading } = trpc.artists.adminGetInvitations.useQuery();
  const { data: metrics, isLoading: metricsLoading } = trpc.artists.adminGetInvitationMetrics.useQuery({
    state: selectedStateFilter === "all" ? undefined : selectedStateFilter,
  });

  const sendMutation = trpc.artists.adminSendInvitations.useMutation({
    onSuccess: (results) => {
      const failed = results.filter((r) => r.status === "failed");
      if (failed.length > 0) {
        toast.warning(`Sent with ${failed.length} failures.`);
      } else {
        toast.success("All invitations sent successfully!");
      }
      // Clear forms
      setManualBatch([]);
      setCsvBatch([]);
      setCsvFile(null);
      utils.artists.adminGetInvitations.invalidate();
      utils.artists.adminGetInvitationMetrics.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send invitations.");
    },
  });

  const resendMutation = trpc.artists.adminResendInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation resent successfully!");
      utils.artists.adminGetInvitations.invalidate();
      utils.artists.adminGetInvitationMetrics.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to resend invitation.");
    },
  });

  // Handle Manual Batch Addition
  const handleAddManual = () => {
    if (!manualEmail.trim() || !manualShopName.trim()) {
      toast.error("Please fill in both Email and Shop Name");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(manualEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (manualBatch.some((item) => item.email.toLowerCase() === manualEmail.toLowerCase())) {
      toast.error("This email is already in the batch list");
      return;
    }

    if (manualBatch.length >= 50) {
      toast.error("A batch cannot contain more than 50 invitations");
      return;
    }

    setManualBatch((prev) => [
      ...prev,
      { email: manualEmail.trim(), shopName: manualShopName.trim(), state: manualState },
    ]);
    setManualEmail("");
    setManualShopName("");
  };

  const handleRemoveManual = (index: number) => {
    setManualBatch((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle CSV File Upload and Client-side Parse
  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setCsvError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setCsvError("File is empty.");
          return;
        }

        const lines = text.split(/\r?\n/);
        const parsed: { email: string; shopName: string; state: string; error?: string }[] = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Split by comma, preserving commas inside quotes
          const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.trim().replace(/^["']|["']$/g, ""));
          if (cols.length < 2) continue;

          // Header row detection
          if (
            i === 0 &&
            (cols[0].toLowerCase().includes("email") ||
              cols[1].toLowerCase().includes("email") ||
              cols[0].toLowerCase().includes("shop") ||
              cols[1].toLowerCase().includes("shop"))
          ) {
            continue;
          }

          let email = "";
          let shopName = "";
          let stateVal = "";

          // Simple regex mapping columns: detect email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(cols[0])) {
            email = cols[0];
            shopName = cols[1];
            stateVal = cols[2] || "";
          } else if (emailRegex.test(cols[1])) {
            email = cols[1];
            shopName = cols[0];
            stateVal = cols[2] || "";
          } else {
            // Default ordering: email first, then shop name, then state
            email = cols[0];
            shopName = cols[1];
            stateVal = cols[2] || "";
          }

          let err: string | undefined = undefined;
          if (!emailRegex.test(email)) {
            err = "Invalid email format";
          } else if (!shopName) {
            err = "Missing shop name";
          }

          parsed.push({
            email,
            shopName,
            state: stateVal,
            error: err,
          });
        }

        if (parsed.length === 0) {
          setCsvError("No valid rows found in the CSV.");
        } else if (parsed.length > 50) {
          setCsvError("Batch size exceeds 50 rows. Please split the file.");
        } else {
          setCsvBatch(parsed);
        }
      } catch (err) {
        setCsvError("Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
  };

  const handleSendManualBatch = () => {
    if (manualBatch.length === 0) return;
    sendMutation.mutate({ invitations: manualBatch });
  };

  const handleSendCsvBatch = () => {
    const validInvites = csvBatch.filter((item) => !item.error);
    if (validInvites.length === 0) {
      toast.error("No valid invitations to send.");
      return;
    }
    sendMutation.mutate({ invitations: validInvites });
  };

  // Filtering invitations history
  const filteredHistory = invitations?.filter((item) => {
    if (selectedStateFilter === "all") return true;
    return item.state?.toLowerCase() === selectedStateFilter.toLowerCase();
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* State Filter and Conversion Funnel */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <Card className="p-6 flex-1 w-full bg-muted/20 border-muted">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Conversion Funnel Metrics
            </h3>
            <div className="flex items-center gap-2">
              <label htmlFor="state-filter" className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filter by State:</label>
              <select
                id="state-filter"
                value={selectedStateFilter}
                onChange={(e) => setSelectedStateFilter(e.target.value)}
                className="bg-background border border-input rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              >
                <option value="all">All States</option>
                {US_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          {metricsLoading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : metrics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-background/50 border border-muted text-center flex flex-col justify-center">
                <span className="text-3xl font-extrabold text-foreground">{metrics.sent}</span>
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-1">Sent</span>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border border-muted text-center flex flex-col justify-center">
                <span className="text-3xl font-extrabold text-blue-500">{metrics.opened}</span>
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-1">Opened</span>
                <span className="text-[10px] text-blue-400 mt-1">
                  {metrics.sent > 0 ? Math.round((metrics.opened / metrics.sent) * 100) : 0}% conv.
                </span>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border border-muted text-center flex flex-col justify-center">
                <span className="text-3xl font-extrabold text-purple-500">{metrics.registered}</span>
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-1">Registered</span>
                <span className="text-[10px] text-purple-400 mt-1">
                  {metrics.opened > 0 ? Math.round((metrics.registered / metrics.opened) * 100) : 0}% conv.
                </span>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border border-muted text-center flex flex-col justify-center">
                <span className="text-3xl font-extrabold text-green-500">{metrics.approved}</span>
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-1">Approved</span>
                <span className="text-[10px] text-green-400 mt-1">
                  {metrics.registered > 0 ? Math.round((metrics.approved / metrics.registered) * 100) : 0}% conv.
                </span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6 text-sm">No metrics available.</p>
          )}
        </Card>
      </div>

      {/* Sending Controls */}
      <Card className="p-6">
        <div className="flex border-b pb-4 mb-6 gap-6">
          <button
            onClick={() => setEntryMode("manual")}
            className={`font-semibold pb-2 border-b-2 text-sm transition-all ${entryMode === "manual" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Manual Batch Entry
          </button>
          <button
            onClick={() => setEntryMode("csv")}
            className={`font-semibold pb-2 border-b-2 text-sm transition-all ${entryMode === "csv" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            CSV Upload
          </button>
        </div>

        {entryMode === "manual" && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4 items-end">
              <div>
                <Label htmlFor="manual-shop">Shop Name</Label>
                <input
                  id="manual-shop"
                  type="text"
                  placeholder="E.g. Inked Art Studio"
                  value={manualShopName}
                  onChange={(e) => setManualShopName(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1.5 text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="manual-email">Email Address</Label>
                <input
                  id="manual-email"
                  type="email"
                  placeholder="artist@example.com"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1.5 text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="manual-state">State</Label>
                <select
                  id="manual-state"
                  value={manualState}
                  onChange={(e) => setManualState(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1.5 text-foreground"
                >
                  {US_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
              <Button onClick={handleAddManual} className="bg-primary hover:bg-primary/90 text-white font-bold h-10">Add to Batch</Button>
            </div>

            {manualBatch.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">Batch List ({manualBatch.length}/50)</h4>
                  <Button
                    onClick={handleSendManualBatch}
                    disabled={sendMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold"
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Send Batch Invitations
                  </Button>
                </div>
                <div className="max-h-48 overflow-y-auto border rounded-lg divide-y bg-muted/5">
                  {manualBatch.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 text-sm">
                      <div className="grid grid-cols-3 flex-1 gap-2">
                        <span className="font-semibold truncate">{item.shopName}</span>
                        <span className="text-muted-foreground truncate">{item.email}</span>
                        <span className="text-xs text-primary font-bold">{item.state}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveManual(index)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {entryMode === "csv" && (
          <div className="space-y-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/10 hover:bg-muted/15 transition-all">
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleCsvChange}
                className="hidden"
              />
              <label htmlFor="csv-file-input" className="cursor-pointer space-y-2 block">
                <Mail className="w-10 h-10 mx-auto text-muted-foreground/60 mb-2" />
                <span className="block text-sm font-semibold text-foreground">Click to upload CSV file</span>
                <span className="block text-xs text-muted-foreground">Supported format: Email, Shop Name, State (Max 50 rows)</span>
              </label>
              {csvFile && (
                <div className="mt-4 p-2 bg-background border inline-flex items-center gap-2 rounded-md text-sm">
                  <span className="font-semibold text-xs text-primary">{csvFile.name}</span>
                  <span className="text-[11px] text-muted-foreground">({(csvFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>

            {csvError && (
              <div className="p-4 border border-red-500/20 bg-red-500/10 rounded-lg text-red-500 text-sm">
                {csvError}
              </div>
            )}

            {csvBatch.length > 0 && !csvError && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">CSV Preview ({csvBatch.length} items parsed)</h4>
                    <p className="text-xs text-muted-foreground">
                      Valid: {csvBatch.filter((c) => !c.error).length} | Invalid: {csvBatch.filter((c) => c.error).length}
                    </p>
                  </div>
                  <Button
                    onClick={handleSendCsvBatch}
                    disabled={sendMutation.isPending || csvBatch.filter((c) => !c.error).length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold"
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Send Valid CSV Batches
                  </Button>
                </div>

                <div className="max-h-60 overflow-y-auto border rounded-lg divide-y bg-muted/5">
                  {csvBatch.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 text-sm">
                      <div className="grid grid-cols-3 flex-1 gap-2">
                        <span className="font-semibold truncate">{item.shopName || "[Missing Name]"}</span>
                        <span className="text-muted-foreground truncate">{item.email || "[Missing Email]"}</span>
                        <span className="text-xs text-primary font-bold truncate">{item.state || "[No State]"}</span>
                      </div>
                      <div>
                        {item.error ? (
                          <Badge variant="destructive" className="text-[10px]">{item.error}</Badge>
                        ) : (
                          <Badge className="bg-green-600 text-[10px] text-white">Valid</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* History List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Invitation Log & History
        </h3>

        {historyLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !filteredHistory || filteredHistory.length === 0 ? (
          <p className="text-muted-foreground text-center py-12 text-sm">No invitations found for this filter.</p>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="p-4 font-semibold text-muted-foreground">Shop Name</th>
                  <th className="p-4 font-semibold text-muted-foreground">State</th>
                  <th className="p-4 font-semibold text-muted-foreground">Email</th>
                  <th className="p-4 font-semibold text-muted-foreground">Sent At</th>
                  <th className="p-4 font-semibold text-muted-foreground">Status</th>
                  <th className="p-4 font-semibold text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                    <td className="p-4 font-medium">{item.shopName}</td>
                    <td className="p-4">
                      {item.state ? <Badge variant="secondary" className="text-xs">{item.state}</Badge> : "-"}
                    </td>
                    <td className="p-4 text-muted-foreground">{item.email}</td>
                    <td className="p-4 text-muted-foreground text-xs">
                      {item.sentAt ? new Date(item.sentAt).toLocaleString() : "-"}
                    </td>
                    <td className="p-4">
                      {item.status === "sent" && <Badge variant="secondary" className="bg-gray-600 text-white text-xs">Sent</Badge>}
                      {item.status === "opened" && <Badge className="bg-blue-600 text-white text-xs">Opened</Badge>}
                      {item.status === "registered" && <Badge className="bg-purple-600 text-white text-xs">Registered</Badge>}
                      {item.status === "approved" && <Badge className="bg-green-600 text-white text-xs">Approved</Badge>}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={resendMutation.isPending}
                        onClick={() => resendMutation.mutate({ id: item.id })}
                        className="text-xs h-7 px-3 border-primary/40 hover:bg-primary/5 hover:text-primary transition-all font-semibold"
                      >
                        {resendMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Resend"
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
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
  const { data: refundRequests } = trpc.bookings.adminGetRefundRequests.useQuery();

  const pendingArtists = artists?.filter((a) => !a.isApproved).length ?? 0;
  const pendingVerifications = pendingDocs?.length ?? 0;
  const pendingReviews = flaggedReviews?.length ?? 0;
  const pendingRefunds = refundRequests?.length ?? 0;

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
        <div className="grid grid-cols-4 gap-4 mb-8">
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
          <Card className="p-4 text-center">
            <p className="text-3xl font-bold text-red-500">{pendingRefunds}</p>
            <p className="text-sm text-muted-foreground mt-1">Refund Requests</p>
          </Card>
        </div>

        <Tabs defaultValue="artists" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
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
            <TabsTrigger value="refunds" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Refunds
              {pendingRefunds > 0 && (
                <Badge className="bg-red-500 text-white text-xs ml-1 h-5 px-1.5">
                  {pendingRefunds}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="invitations" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Invite
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

          <TabsContent value="refunds">
            <RefundRequestsPanel />
          </TabsContent>

          <TabsContent value="invitations">
            <InvitationsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
