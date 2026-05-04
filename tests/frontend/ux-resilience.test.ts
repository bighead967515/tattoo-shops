import { describe, it, expect } from "vitest";

/**
 * UX Resilience Tests
 *
 * These tests lock in the deterministic error-message and state-transition
 * logic extracted from portfolio upload and booking form flows.  They run in
 * Node (no DOM) so they stay fast and dependency-free.
 */

// ---------------------------------------------------------------------------
// Upload error message derivation
// ---------------------------------------------------------------------------
function deriveUploadErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "Upload failed";
  if (message.toLowerCase().includes("network") || message.toLowerCase().includes("fetch")) {
    return "Network error — check your connection and retry.";
  }
  return "Failed to upload image. Tap Retry to try again.";
}

describe("deriveUploadErrorMessage", () => {
  it("returns network guidance for fetch errors", () => {
    const msg = deriveUploadErrorMessage(new Error("Failed to fetch"));
    expect(msg).toContain("Network error");
    expect(msg).toContain("connection");
  });

  it("returns network guidance for network errors", () => {
    const msg = deriveUploadErrorMessage(new Error("network timeout"));
    expect(msg).toContain("Network error");
  });

  it("returns retry guidance for generic errors", () => {
    const msg = deriveUploadErrorMessage(new Error("500 Internal Server Error"));
    expect(msg).toContain("Failed to upload image");
    expect(msg).toContain("Retry");
  });

  it("returns retry guidance for non-Error throws", () => {
    const msg = deriveUploadErrorMessage("something went wrong");
    expect(msg).toContain("Failed to upload image");
  });
});

// ---------------------------------------------------------------------------
// Upload state machine
// ---------------------------------------------------------------------------
type UploadState = "idle" | "uploading" | "success" | "failed";

function nextUploadState(
  current: UploadState,
  event: "start" | "progress" | "success" | "error" | "reset",
): UploadState {
  if (event === "start") return "uploading";
  if (event === "success") return "success";
  if (event === "error") return "failed";
  if (event === "reset") return "idle";
  return current;
}

describe("upload state machine", () => {
  it("transitions idle → uploading on start", () => {
    expect(nextUploadState("idle", "start")).toBe("uploading");
  });

  it("transitions uploading → success on success", () => {
    expect(nextUploadState("uploading", "success")).toBe("success");
  });

  it("transitions uploading → failed on error", () => {
    expect(nextUploadState("uploading", "error")).toBe("failed");
  });

  it("resets failed → idle on reset (retry trigger)", () => {
    expect(nextUploadState("failed", "reset")).toBe("idle");
  });

  it("does not leave success on spurious progress events", () => {
    expect(nextUploadState("success", "progress")).toBe("success");
  });
});

// ---------------------------------------------------------------------------
// Booking error message derivation
// ---------------------------------------------------------------------------
interface ZodFieldErrors {
  fieldErrors?: Record<string, string[] | undefined>;
}

function deriveBookingErrorMessage(
  error: { message?: string; data?: { zodError?: ZodFieldErrors } } | undefined,
): string {
  if (!error) return "An unexpected error occurred. Please try again.";

  const zodError = error.data?.zodError;
  if (zodError?.fieldErrors) {
    const fieldMessages = Object.entries(zodError.fieldErrors)
      .flatMap(([field, msgs]) => (msgs ?? []).map((m) => `${field}: ${m}`))
      .join(" • ");
    return fieldMessages || "Please check the form and try again.";
  }

  const msg = error.message ?? "";
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Network error — check your connection and try again.";
  }
  return msg || "Failed to send booking request. Please try again.";
}

describe("deriveBookingErrorMessage", () => {
  it("formats zod field errors into a readable string", () => {
    const msg = deriveBookingErrorMessage({
      data: {
        zodError: {
          fieldErrors: {
            customerEmail: ["Invalid email"],
            preferredDate: ["Required"],
          },
        },
      },
    });
    expect(msg).toContain("customerEmail: Invalid email");
    expect(msg).toContain("preferredDate: Required");
    expect(msg).toContain("•");
  });

  it("returns network guidance for fetch errors", () => {
    const msg = deriveBookingErrorMessage({ message: "Failed to fetch" });
    expect(msg).toContain("Network error");
  });

  it("returns the raw message for generic server errors", () => {
    const msg = deriveBookingErrorMessage({ message: "Artist not found" });
    expect(msg).toBe("Artist not found");
  });

  it("handles missing error gracefully", () => {
    const msg = deriveBookingErrorMessage(undefined);
    expect(msg).toContain("unexpected error");
  });
});

// ---------------------------------------------------------------------------
// Empty-state visibility logic
// ---------------------------------------------------------------------------
function shouldShowEmptyState(
  isLoading: boolean,
  items: unknown[] | undefined,
): boolean {
  return !isLoading && (items?.length ?? 0) === 0;
}

describe("shouldShowEmptyState", () => {
  it("returns true when loaded and array is empty", () => {
    expect(shouldShowEmptyState(false, [])).toBe(true);
  });

  it("returns false while still loading", () => {
    expect(shouldShowEmptyState(true, [])).toBe(false);
  });

  it("returns false when items are present", () => {
    expect(shouldShowEmptyState(false, [{ id: 1 }])).toBe(false);
  });

  it("returns true when items is undefined and not loading", () => {
    expect(shouldShowEmptyState(false, undefined)).toBe(true);
  });
});
