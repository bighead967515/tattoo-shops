import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, ArrowLeft, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function LicenseUpload() {
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getUploadUrlMutation = trpc.verification.getUploadUrl.useMutation();
  const addDocumentMutation = trpc.verification.addDocument.useMutation();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    // Client-side validation
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File must be under 10MB.");
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("File must be PDF, PNG, or JPG.");
      return;
    }

    setIsUploading(true);

    try {
      // 1. Get signed upload URL from our backend
      const { signedUrl, path } = await getUploadUrlMutation.mutateAsync({
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      });

      // 2. Upload file directly to Supabase Storage with timeout
      const controller = new AbortController();
      const uploadTimeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

      try {
        const response = await fetch(signedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
          signal: controller.signal,
        });
        clearTimeout(uploadTimeout);

        if (!response.ok) {
          throw new Error("File upload failed. Please try again.");
        }
      } catch (err: any) {
        clearTimeout(uploadTimeout);
        if (err.name === "AbortError") {
          throw new Error("Upload timed out. Please try again.");
        }
        throw err;
      }

      // 3. Create document record in our database
      await addDocumentMutation.mutateAsync({
        documentKey: path,
        documentType: "state_license",
        originalFileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });

      toast.success(
        "License submitted for verification! We'll notify you upon review.",
      );
      // Redirect user after a short delay - leave isUploading true to keep button disabled
      redirectTimeoutRef.current = setTimeout(
        () => setLocation("/dashboard"),
        2000,
      );
    } catch (error: any) {
      toast.error(error.message || "An unknown error occurred during upload.");
      setIsUploading(false); // Only reset on error
    }
  };

  const isLoading =
    getUploadUrlMutation.isPending ||
    addDocumentMutation.isPending ||
    isUploading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => setLocation("/dashboard")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UploadCloud className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Artist Verification</h1>
            <p className="text-muted-foreground">
              To get verified, please upload a copy of your state-issued tattoo
              license.
            </p>
          </div>

          <form onSubmit={handleUpload} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="license-file">State License</Label>
              <Input
                id="license-file"
                type="file"
                onChange={handleFileChange}
                className="file:text-foreground"
                accept="image/png, image/jpeg, application/pdf"
              />
              <p className="text-xs text-muted-foreground pt-1">
                Accepted formats: PNG, JPG, PDF. Max file size: 10MB.
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading || !file}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLoading ? "Submitting..." : "Upload State License"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t text-center">
            <h3 className="font-semibold text-muted-foreground mb-3">
              What happens next?
            </h3>
            <div className="space-y-2 text-sm text-left text-muted-foreground">
              <p>1. Our team will review your submission.</p>
              <p>2. Verification can take up to 3-5 business days.</p>
              <p>
                3. You'll receive an email notification once the review is
                complete.
              </p>
              <p>4. Your profile will show a "Verified" badge upon approval.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
