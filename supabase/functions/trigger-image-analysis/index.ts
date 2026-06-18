import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ALLOWED_BUCKETS = ["portfolio-images", "request-images"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic"];

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    
    // A) Validate payload before calling backend
    if (!payload || !payload.record) {
      return new Response(JSON.stringify({ error: "Missing record payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { bucket_id, name: filePath } = payload.record;

    // Validate bucket exists and is allowed
    if (!bucket_id || !ALLOWED_BUCKETS.includes(bucket_id)) {
      return new Response(
        JSON.stringify({ error: `Bucket not allowed or missing: ${bucket_id}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate name/filePath is a non-empty string
    if (typeof filePath !== "string" || !filePath.trim()) {
      return new Response(
        JSON.stringify({ error: "Invalid or empty file path" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Enforce allowed file extensions
    const lowercasePath = filePath.toLowerCase();
    const hasAllowedExtension = ALLOWED_EXTENSIONS.some(ext => lowercasePath.endsWith(ext));
    if (!hasAllowedExtension) {
      return new Response(
        JSON.stringify({ error: `File extension not allowed. Must be one of: ${ALLOWED_EXTENSIONS.join(", ")}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const backendUrl = Deno.env.get("BACKEND_URL");
    const internalApiSecret = Deno.env.get("INTERNAL_API_SECRET");

    if (!backendUrl || !internalApiSecret) {
      console.error("Missing environment configuration: BACKEND_URL or INTERNAL_API_SECRET");
      return new Response(
        JSON.stringify({ error: "Internal Server Error: Missing configuration" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // C) Async timeout protection: call backend enqueue route and return 200/202 quickly
    const response = await fetch(`${backendUrl}/api/portfolio/enqueue-analysis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${internalApiSecret}`,
      },
      body: JSON.stringify({
        bucketId: bucket_id,
        filePath: filePath,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend returned error status ${response.status}: ${errorText}`);
      return new Response(
        JSON.stringify({ error: `Backend service error: ${response.status}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error processing storage webhook:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
