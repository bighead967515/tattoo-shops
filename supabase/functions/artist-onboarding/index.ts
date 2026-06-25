// supabase/functions/artist-onboarding/index.ts
// Triggered by a Supabase Database Webhook on INSERT into the `artists` table.
// Sends a welcome email to the new artist and an admin notification for review.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_URL = "https://api.resend.com/emails";

interface ArtistRecord {
  id: number;
  user_id: string;
  shop_name: string;
  city: string | null;
  state: string | null;
  bio: string | null;
  specialties: string | null;
  created_at: string;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: ArtistRecord;
  schema: string;
}

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  resendApiKey: string;
}) {
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Ink Connect <noreply@inkedconnect.com>",
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error ${res.status}: ${err}`);
  }

  return res.json();
}

function buildWelcomeEmail(artistName: string, shopName: string): string {
  const baseUrl = "https://inkedconnect.com";
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #e5e7eb; background-color: #0f0f0f; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #2d2d2d; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #10b981 100%); padding: 48px 32px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0 0 8px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.85); margin: 0; font-size: 16px; }
    .content { padding: 40px 32px; }
    .content h2 { color: #f9fafb; margin-top: 0; font-size: 22px; }
    .content p { color: #9ca3af; font-size: 15px; }
    .checklist { background: #111; border: 1px solid #2d2d2d; border-radius: 8px; padding: 20px 24px; margin: 24px 0; }
    .checklist h3 { color: #10b981; margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .checklist ul { margin: 0; padding-left: 20px; }
    .checklist li { color: #d1d5db; margin: 8px 0; font-size: 14px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #10b981); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 24px 0; }
    .status-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
    .footer { background: #111; padding: 24px 32px; text-align: center; border-top: 1px solid #2d2d2d; }
    .footer p { color: #4b5563; font-size: 13px; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎨 Welcome to Ink Connect</h1>
      <p>Your artist profile has been created</p>
    </div>
    <div class="content">
      <h2>Hey ${escapeHtml(artistName)}! 👋</h2>
      <span class="status-badge">⏳ Pending Review</span>
      <p>Your artist profile for <strong style="color:#f9fafb">${escapeHtml(shopName)}</strong> has been successfully submitted to Ink Connect. Our team will review it shortly — typically within 24–48 hours.</p>
      <div class="checklist">
        <h3>✅ What happens next</h3>
        <ul>
          <li>Our team reviews your portfolio and shop details</li>
          <li>You'll receive an email once approved and listed publicly</li>
          <li>Clients can discover and book you directly on the platform</li>
          <li>Upgrade anytime for featured placement and more tools</li>
        </ul>
      </div>
      <p>In the meantime, log in to your dashboard to complete your profile, add more portfolio photos, or set your availability.</p>
      <p style="text-align:center">
        <a href="${baseUrl}/dashboard" class="cta-button">Go to Dashboard →</a>
      </p>
      <p>Questions? Reply to this email and we'll get back to you.</p>
      <p>Welcome to the network,<br><strong style="color:#f9fafb">The Ink Connect Team</strong></p>
    </div>
    <div class="footer">
      <p>Ink Connect — The Premier Tattoo Artist Platform</p>
      <p><a href="${baseUrl}" style="color:#6b7280">inkedconnect.com</a></p>
    </div>
  </div>
</body>
</html>`;
}

function buildAdminNotificationEmail(
  artistName: string,
  shopName: string,
  city: string | null,
  state: string | null,
  artistId: number,
  userId: string,
): string {
  const baseUrl = "https://inkedconnect.com";
  const location = [city, state].filter(Boolean).join(", ") || "Unknown";
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; color: #333; }
    .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 32px; border: 1px solid #e5e7eb; }
    h2 { margin-top: 0; color: #111; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
    .label { color: #6b7280; }
    .value { font-weight: 600; color: #111; }
    .cta { display: inline-block; margin-top: 24px; background: #8b5cf6; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>🆕 New Artist Signup — Needs Review</h2>
    <p>A new artist has registered on Ink Connect and is awaiting approval.</p>
    <div class="detail-row"><span class="label">Artist Name</span><span class="value">${escapeHtml(artistName)}</span></div>
    <div class="detail-row"><span class="label">Shop Name</span><span class="value">${escapeHtml(shopName)}</span></div>
    <div class="detail-row"><span class="label">Location</span><span class="value">${escapeHtml(location)}</span></div>
    <div class="detail-row"><span class="label">Artist ID</span><span class="value">#${artistId}</span></div>
    <div class="detail-row"><span class="label">User ID</span><span class="value">${escapeHtml(userId)}</span></div>
    <a href="${baseUrl}/admin" class="cta">Review in Admin Panel →</a>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

Deno.serve(async (req: Request) => {
  try {
    // Only accept POST
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Authenticate the webhook request
    const webhookSecret = Deno.env.get("SUPABASE_WEBHOOK_SECRET");
    if (webhookSecret) {
      const authHeader = req.headers.get("Authorization");
      const token = authHeader?.replace("Bearer ", "");
      if (token !== webhookSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const payload: WebhookPayload = await req.json();

    // Only handle INSERT events on the artists table
    if (payload.type !== "INSERT" || payload.table !== "artists") {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Not an artist INSERT event" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const artist = payload.record;

    // Required environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_EMAIL") ?? "admin@inkedconnect.com";

    if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
      console.error("Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or RESEND_API_KEY");
      return new Response(
        JSON.stringify({ error: "Internal configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Fetch the associated user record to get their email and name
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: userRecord, error: userError } = await supabase.auth.admin.getUserById(artist.user_id);

    if (userError || !userRecord?.user) {
      console.error("Failed to fetch user for artist", artist.user_id, userError);
      // Continue anyway — we'll use fallback values
    }

    const userEmail = userRecord?.user?.email ?? "";
    const userName =
      (userRecord?.user?.user_metadata?.name as string | undefined) ??
      artist.shop_name ??
      "Artist";

    // --- Run all side effects in parallel ---
    const results = await Promise.allSettled([
      // 1. Welcome email to the artist
      userEmail
        ? sendEmail({
            to: userEmail,
            subject: `🎨 Welcome to Ink Connect, ${userName}! Your profile is under review`,
            html: buildWelcomeEmail(userName, artist.shop_name),
            resendApiKey,
          })
        : Promise.resolve({ skipped: "no user email" }),

      // 2. Admin notification
      sendEmail({
        to: adminEmail,
        subject: `🆕 New Artist Signup: ${artist.shop_name} — Needs Review`,
        html: buildAdminNotificationEmail(
          userName,
          artist.shop_name,
          artist.city,
          artist.state,
          artist.id,
          artist.user_id,
        ),
        resendApiKey,
      }),

      // 3. Optional n8n onboarding webhook
      (async () => {
        const n8nUrl = Deno.env.get("N8N_ONBOARDING_WEBHOOK_URL");
        const n8nSecret = Deno.env.get("N8N_WEBHOOK_SECRET");
        if (!n8nUrl) return { skipped: "n8n not configured" };

        const n8nRes = await fetch(n8nUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(n8nSecret ? { Authorization: `Bearer ${n8nSecret}` } : {}),
          },
          body: JSON.stringify({
            artistId: artist.id,
            userId: artist.user_id,
            email: userEmail,
            firstName: userName.split(" ")[0] ?? "there",
            shopName: artist.shop_name,
          }),
        });

        if (!n8nRes.ok) {
          throw new Error(`n8n webhook returned ${n8nRes.status}`);
        }
        return { n8n: "ok" };
      })(),
    ]);

    // Log outcomes without failing the response
    const summary = results.map((r, i) => {
      const label = ["welcome_email", "admin_email", "n8n_webhook"][i];
      if (r.status === "fulfilled") {
        return { [label]: "ok", result: r.value };
      } else {
        console.error(`${label} failed:`, r.reason);
        return { [label]: "error", error: String(r.reason) };
      }
    });

    console.log("artist-onboarding completed", JSON.stringify({ artistId: artist.id, summary }));

    return new Response(
      JSON.stringify({ success: true, artistId: artist.id, summary }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Unhandled error in artist-onboarding function:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
