import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, CheckCircle, Info } from "lucide-react";
import { toast } from "sonner";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artistId: number;
  artistName: string;
}

export default function BookingDialog({
  open,
  onOpenChange,
  artistId,
  artistName,
}: BookingDialogProps) {
  const { user } = useAuth();

  const initialFormData = {
    customerName: user?.name || "",
    customerEmail: user?.email || "",
    customerPhone: "",
    preferredDate: "",
    tattooDescription: "",
    placement: "",
    size: "small",
    budget: "",
    additionalNotes: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  const createBookingMutation = trpc.bookings.create.useMutation({
    onSuccess: () => {
      toast.success("Booking request sent!");
      setFormData(initialFormData); // Reset form data
      onOpenChange(false); // Close dialog on success
    },
    onError: (error) => {
      const zodError = (
        error.data as
          | {
              zodError?: { fieldErrors?: Record<string, string[] | undefined> };
            }
          | undefined
      )?.zodError;
      if (zodError?.fieldErrors) {
        const errors = zodError.fieldErrors;
        for (const field in errors) {
          const messages = errors[field];
          if (messages) {
            toast.error(`${field}: ${messages.join(", ")}`);
          }
        }
      } else {
        toast.error(
          error.message ||
            "Failed to send booking request. Please try again later.",
        );
      }
    },
  });

  // Sync user data when user changes or dialog opens
  useEffect(() => {
    if (!open || !user) return;
    setFormData((prev) => ({
      ...prev,
      customerName: user.name || prev.customerName,
      customerEmail: user.email || prev.customerEmail,
    }));
  }, [user, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.customerName ||
      !formData.customerEmail ||
      !formData.customerPhone
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.preferredDate) {
      toast.error("Please select a preferred date");
      return;
    }

    const selectedDate = new Date(formData.preferredDate);
    if (selectedDate < new Date()) {
      toast.error("Please select a future date");
      return;
    }

    if (!formData.tattooDescription || !formData.placement) {
      toast.error("Please describe your tattoo and placement");
      return;
    }

    createBookingMutation.mutate({
      artistId,
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      preferredDate: new Date(formData.preferredDate),
      tattooDescription: formData.tattooDescription,
      placement: formData.placement,
      size: formData.size,
      budget: formData.budget,
      additionalNotes: formData.additionalNotes,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isLoading = createBookingMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Appointment with {artistName}</DialogTitle>
          <DialogDescription>
            Fill out the form below to request an appointment. The artist will
            contact you to confirm details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contact Information</h3>

            <div>
              <Label htmlFor="customerName">Full Name *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleChange("customerName", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="customerEmail">Email *</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => handleChange("customerEmail", e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="customerPhone">Phone Number *</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => handleChange("customerPhone", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-4">
            <h3 className="font-semibold">Appointment Details</h3>

            <div>
              <Label htmlFor="preferredDate">Preferred Date *</Label>
              <Input
                id="preferredDate"
                type="datetime-local"
                value={formData.preferredDate}
                onChange={(e) => handleChange("preferredDate", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Tattoo Details */}
          <div className="space-y-4">
            <h3 className="font-semibold">Tattoo Details</h3>

            <div>
              <Label htmlFor="tattooDescription">Tattoo Description *</Label>
              <Textarea
                id="tattooDescription"
                value={formData.tattooDescription}
                onChange={(e) =>
                  handleChange("tattooDescription", e.target.value)
                }
                placeholder="Describe your tattoo idea in detail..."
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="placement">Body Placement *</Label>
              <Input
                id="placement"
                value={formData.placement}
                onChange={(e) => handleChange("placement", e.target.value)}
                placeholder="e.g., Upper arm, back, ankle"
                required
              />
            </div>

            <div>
              <Label htmlFor="size">Approximate Size *</Label>
              <select
                id="size"
                value={formData.size}
                onChange={(e) => handleChange("size", e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                required
              >
                <option value="small">Small (2-4 inches)</option>
                <option value="medium">Medium (4-6 inches)</option>
                <option value="large">Large (6-10 inches)</option>
                <option value="extra-large">Extra Large (10+ inches)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="budget">Budget (Optional)</Label>
              <Input
                id="budget"
                value={formData.budget}
                onChange={(e) => handleChange("budget", e.target.value)}
                placeholder="e.g., $200-$500"
              />
            </div>

            <div>
              <Label htmlFor="additionalNotes">Additional Notes</Label>
              <Textarea
                id="additionalNotes"
                value={formData.additionalNotes}
                onChange={(e) =>
                  handleChange("additionalNotes", e.target.value)
                }
                placeholder="Any other details or questions..."
                rows={3}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-12 text-base"
            >
              {isLoading ? (
                "Sending..."
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Send Booking Request
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            The artist will receive your request and contact you to confirm the
            appointment and discuss payment.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
