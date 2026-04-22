import { useState } from "react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Shield, FileText } from "lucide-react";

interface LegalAcceptanceModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Role-specific context for the disclaimer */
  role: "client" | "artist";
  /** Called when the user clicks Accept — parent should persist acceptance */
  onAccept: () => void;
}

/**
 * Blocking modal that requires explicit agreement to Terms of Service,
 * Privacy Policy, and the Platform Liability Disclaimer before proceeding.
 * Must be shown once per user during onboarding and stored server-side.
 */
export default function LegalAcceptanceModal({
  open,
  role,
  onAccept,
}: LegalAcceptanceModalProps) {
  const [checkedTerms, setCheckedTerms] = useState(false);
  const [checkedPrivacy, setCheckedPrivacy] = useState(false);
  const [checkedDisclaimer, setCheckedDisclaimer] = useState(false);

  const allChecked = checkedTerms && checkedPrivacy && checkedDisclaimer;

  const artistExtra =
    role === "artist"
      ? "As an artist, you also confirm that you hold all required licenses, permits, and health certifications required by your local jurisdiction to perform tattooing services."
      : "";

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      {/* Prevent closing by clicking outside — user MUST accept */}
      <DialogContent
        className="max-w-lg"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle className="text-xl">
              Legal Agreement Required
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed">
            Before you can continue, you must read and agree to the following.
            This is required by law and protects both you and Ink Connect.
            {artistExtra && (
              <span className="block mt-2 font-semibold text-foreground">
                {artistExtra}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Disclaimer Summary */}
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-4 my-2 space-y-2">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
              <strong>Platform Disclaimer:</strong> Ink Connect verifies and
              endorses the artists listed on our platform based on portfolio
              review. However, we do not employ artists and are not responsible
              for the quality, safety, or outcome of any tattoo service.
              All transactions are between you and the artist directly.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
              <strong>Assumption of Risk:</strong> Tattooing carries inherent
              health risks. By using this platform you accept full personal
              responsibility for any outcome.
            </p>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={checkedTerms}
              onCheckedChange={(v) => setCheckedTerms(Boolean(v))}
            />
            <Label htmlFor="terms" className="text-sm leading-snug cursor-pointer">
              I have read and agree to the{" "}
              <Link href="/terms-of-service" target="_blank" className="text-primary underline">
                Terms of Service
              </Link>
              , including the Platform Liability Disclaimer in Section 4.
            </Label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="privacy"
              checked={checkedPrivacy}
              onCheckedChange={(v) => setCheckedPrivacy(Boolean(v))}
            />
            <Label htmlFor="privacy" className="text-sm leading-snug cursor-pointer">
              I have read and agree to the{" "}
              <Link href="/privacy-policy" target="_blank" className="text-primary underline">
                Privacy Policy
              </Link>
              .
            </Label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="disclaimer"
              checked={checkedDisclaimer}
              onCheckedChange={(v) => setCheckedDisclaimer(Boolean(v))}
            />
            <Label htmlFor="disclaimer" className="text-sm leading-snug cursor-pointer">
              I understand that while Ink Connect verifies and endorses artists
              on our platform, it does not employ them and is not responsible
              for the quality, safety, or outcome of any tattoo service. I
              release Ink Connect from any liability related to tattoo services,
              artist conduct, or physical outcomes.
            </Label>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mr-auto">
            <FileText className="w-3 h-3" />
            Your acceptance is recorded with a timestamp.
          </div>
          <Button
            onClick={onAccept}
            disabled={!allChecked}
            className="w-full sm:w-auto"
          >
            I Agree — Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
