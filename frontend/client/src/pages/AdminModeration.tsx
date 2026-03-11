import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeJsonParse } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  RefreshCcw,
  FileText,
  Star,
  Loader2,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

// ──────────────────────────────────────────────
// License Verification Tab
// ──────────────────────────────────────────────

function VerificationDocumentsPanel() {
  const {
    data: documents,
    isLoading,
    refetch,
  } = trpc.verification.getPending.useQuery();
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
        const ocrConfidence = doc.ocrConfidence ?? 0;
        const ocrIssues: string[] = safeJsonParse<string[]>(doc.ocrIssues, []);

        return (
          <Card key={doc.id} className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <h3 className="font-semibold text-lg">
                    {item.user.name || "Unknown User"}
                  </h3>
                  <Badge variant="outline">{doc.documentType}</Badge>
                  {item.artist && (
                    <Badge variant="secondary">{item.artist.shopName}</Badge>
                  )}
                </div>

                {/* OCR Results */}
                {doc.ocrProcessedAt ? (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">
                        AI OCR Analysis
                      </span>
                      {ocrVerdict === "verified" && (
                        <Badge className="bg-green-600 text-white">
                          <CheckCircle2 className="w-3 h-3 mr-1" />{" "}
                          Auto-Verified
                        </Badge>
                      )}
                      {ocrVerdict === "needs_review" && (
                        <Badge className="bg-yellow-600 text-white">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Needs
                          Review
                        </Badge>
                      )}
                      {ocrVerdict === "rejected" && (
                        <Badge className="bg-red-600 text-white">
                          <XCircle className="w-3 h-3 mr-1" /> AI Rejected
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Extracted Name:
                        </span>{" "}
                        <span className="font-medium">
                          {doc.ocrExtractedName || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Business Name:
                        </span>{" "}
                        <span className="font-medium">
                          {doc.ocrExtractedBusinessName || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          License #:
                        </span>{" "}
                        <span className="font-medium">
                          {doc.ocrLicenseNumber || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Expiration:
                        </span>{" "}
                        <span className="font-medium">
                          {doc.ocrExpirationDate || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Issuing Authority:
                        </span>{" "}
                        <span className="font-medium">
                          {doc.ocrIssuingAuthority || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Doc Type:</span>{" "}
                        <span className="font-medium">
                          {doc.ocrDocumentType || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Name Match:
                        </span>{" "}
                        <Badge
                          variant={
                            doc.ocrNameMatch === "exact"
                              ? "default"
                              : doc.ocrNameMatch === "partial"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {doc.ocrNameMatch || "—"}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Confidence:
                        </span>{" "}
                        <span
                          className={`font-medium ${ocrConfidence >= 70 ? "text-green-600" : ocrConfidence >= 40 ? "text-yellow-600" : "text-red-600"}`}
                        >
                          {ocrConfidence}%
                        </span>
                      </div>
                    </div>

                    {doc.ocrVerdictReason && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        {doc.ocrVerdictReason}
                      </p>
                    )}

                    {ocrIssues.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {ocrIssues.map((issue) => (
                          <Badge
                            key={issue}
                            variant="outline"
                            className="text-xs text-red-600 border-red-300"
                          >
                            {issue}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI OCR analysis in progress…
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>File: {doc.originalFileName}</span>
                  <span>{doc.mimeType}</span>
                  <span>
                    {doc.fileSize
                      ? `${(doc.fileSize / 1024).toFixed(0)} KB`
                      : ""}
                  </span>
                  <span>
                    Submitted: {new Date(doc.submittedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Admin Notes */}
                <Textarea
                  placeholder="Admin notes (optional)..."
                  value={reviewNotes[doc.id] || ""}
                  onChange={(e) =>
                    setReviewNotes((prev) => ({
                      ...prev,
                      [doc.id]: e.target.value,
                    }))
                  }
                  className="h-16 text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={reviewMutation.isPending}
                  onClick={() =>
                    reviewMutation.mutate({
                      documentId: doc.id,
                      decision: "verified",
                      notes: reviewNotes[doc.id],
                    })
                  }
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
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
  const {
    data: reviews,
    isLoading,
    refetch,
  } = trpc.moderation.getFlaggedReviews.useQuery();
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
        const flags: string[] = safeJsonParse<string[]>(
          review.moderationFlags,
          [],
        );

        return (
          <Card key={review.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-3">
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

                {/* Comment */}
                <p className="text-sm leading-relaxed bg-muted/30 rounded-lg p-3">
                  {review.comment || (
                    <em className="text-muted-foreground">No comment</em>
                  )}
                </p>

                {/* Moderation Scores */}
                <div className="flex items-center gap-6 text-sm">
                  <ScorePill
                    label="Toxicity"
                    score={review.toxicityScore ?? 0}
                  />
                  <ScorePill label="Spam" score={review.spamScore ?? 0} />
                  <ScorePill label="Fraud" score={review.fraudScore ?? 0} />
                </div>

                {/* Flags */}
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

                {/* Moderation Reason */}
                {review.moderationReason && (
                  <p className="text-xs text-muted-foreground italic">
                    AI: {review.moderationReason}
                  </p>
                )}

                <div className="text-xs text-muted-foreground">
                  Posted: {new Date(review.createdAt).toLocaleDateString()}
                  {review.moderatedAt && (
                    <>
                      {" "}
                      · Moderated:{" "}
                      {new Date(review.moderatedAt).toLocaleDateString()}
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-300 hover:bg-green-50"
                  disabled={updateMutation.isPending}
                  onClick={() =>
                    updateMutation.mutate({
                      reviewId: review.id,
                      status: "approved",
                    })
                  }
                >
                  <Eye className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={updateMutation.isPending}
                  onClick={() =>
                    updateMutation.mutate({
                      reviewId: review.id,
                      status: "hidden",
                    })
                  }
                >
                  <EyeOff className="w-4 h-4 mr-1" /> Hide
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={reanalyzeMutation.isPending}
                  onClick={() =>
                    reanalyzeMutation.mutate({ reviewId: review.id })
                  }
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
    score >= 70
      ? "text-red-600"
      : score >= 40
        ? "text-yellow-600"
        : "text-green-600";

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-semibold ${color}`}>{score}</span>
    </div>
  );
}

// ──────────────────────────────────────────────
// Admin Moderation Page
// ──────────────────────────────────────────────

export default function AdminModeration() {
  const [, setLocation] = useLocation();

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-primary" />
              Admin Moderation
            </h1>
            <p className="text-muted-foreground mt-1">
              Review flagged content and verify artist licenses with AI
              assistance.
            </p>
          </div>
        </div>

        <Tabs defaultValue="verification" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="verification"
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              License Verification
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Flagged Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verification">
            <VerificationDocumentsPanel />
          </TabsContent>

          <TabsContent value="reviews">
            <FlaggedReviewsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
