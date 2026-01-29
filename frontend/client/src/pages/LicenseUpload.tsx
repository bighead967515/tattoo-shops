import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, ArrowLeft } from "lucide-react";

export default function LicenseUpload() {
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setUploadMessage(null);

    // TODO: Implement the actual file upload logic here.
    // 1. Get a secure upload URL from the backend.
    // 2. Upload the file to Supabase Storage.
    // 3. On successful upload, create a record in the `verificationDocuments` table.
    // 4. Update the user's `verification_status` to 'pending'.
    console.log("Uploading file:", file.name);

    // Mocking an async upload for demonstration
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsLoading(false);
    // This is a mock success message.
    setUploadMessage("Your license has been submitted for verification.");
    // setFile(null); // Optionally clear the file input
  };

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
              To get verified, please upload a copy of your state-issued tattoo license.
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
                Accepted formats: PNG, JPG, PDF. Max file size: 5MB.
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {uploadMessage && (
              <p className="text-sm text-green-600">{uploadMessage}</p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading || !file}
            >
              {isLoading ? 'Uploading...' : 'Upload State License'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t text-center">
            <h3 className="font-semibold text-muted-foreground mb-3">What happens next?</h3>
            <div className="space-y-2 text-sm text-left text-muted-foreground">
                <p>1. Our team will review your submission.</p>
                <p>2. Verification can take up to 3-5 business days.</p>
                <p>3. You'll receive an email notification once the review is complete.</p>
                <p>4. Your profile will show a "Verified" badge upon approval.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
