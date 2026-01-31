import { Resend } from "resend";
import { ENV } from "./_core/env";
import { emailCircuit } from "./_core/circuitBreaker";
import { logger } from "./_core/logger";

const resend = new Resend(ENV.resendApiKey);

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeErrorForLogging(error: any): any {
  if (!error) return error;
  
  const sanitized = { ...error };
  const sensitiveKeys = ['to', 'from', 'email', 'recipient', 'address'];
  
  for (const key of sensitiveKeys) {
    if (key in sanitized && typeof sanitized[key] === 'string') {
      sanitized[key] = sanitized[key].replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED]');
    }
  }
  
  if (error.message) {
    sanitized.message = error.message.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED]');
  }
  
  return sanitized;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send an email using Resend with retry logic and circuit breaker
 */
export async function sendEmail(options: EmailOptions) {
  const { to, subject, html, from = "Universal Inc <noreply@universalinc.com>" } = options;

  return emailCircuit.execute(async () => {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { data, error } = await resend.emails.send({
          from,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
        });

        if (error) {
          throw new Error(`Resend API error: ${error.message}`);
        }

        logger.info("Email sent successfully", { id: data?.id, attempt });
        return { success: true, id: data?.id };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on certain errors (invalid email, auth issues)
        const errorMessage = lastError.message.toLowerCase();
        if (
          errorMessage.includes("invalid") ||
          errorMessage.includes("unauthorized") ||
          errorMessage.includes("forbidden")
        ) {
          logger.error("Email send failed (non-retryable)", sanitizeErrorForLogging({ error: lastError.message }));
          throw lastError;
        }
        
        if (attempt < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
          logger.warn(`Email send failed, retrying in ${delay}ms`, { 
            attempt, 
            maxRetries: MAX_RETRIES,
            error: sanitizeErrorForLogging({ message: lastError.message })
          });
          await sleep(delay);
        }
      }
    }

    logger.error("Email send failed after all retries", sanitizeErrorForLogging({ error: lastError?.message }));
    throw lastError;
  });
}

/**
 * Send artist invitation email
 */
export async function sendArtistInvitation(to: string, shopName: string) {
  const escapedShopName = escapeHtml(shopName);
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #10b981 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; }
    .content h2 { color: #8b5cf6; margin-top: 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #10b981); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .features { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .features ul { margin: 10px 0; padding-left: 20px; }
    .features li { margin: 8px 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎨 You're Invited to Join Universal Inc</h1>
    </div>
    
    <div class="content">
      <h2>Hello ${escapedShopName}!</h2>
      
      <p>We're excited to invite you to join <strong>Universal Inc</strong>, Louisiana's premier online platform connecting tattoo artists with clients looking for their perfect artist.</p>
      
      <p>We've noticed your excellent work and reputation in the Louisiana tattoo community, and we'd love to have you as part of our growing network.</p>
      
      <div class="features">
        <h3>✨ What You Get with a FREE Basic Listing:</h3>
        <ul>
          <li>📸 Showcase up to 3 portfolio photos</li>
          <li>⭐ Display your shop information and location</li>
          <li>💬 Receive and display customer reviews</li>
          <li>🔍 Appear in artist search results</li>
          <li>📱 Mobile-optimized profile page</li>
        </ul>
        
        <h3>🚀 Upgrade to Premium ($49/month) for:</h3>
        <ul>
          <li>📅 Real-time booking system with calendar sync</li>
          <li>📞 Display direct contact information</li>
          <li>🖼️ Unlimited portfolio photos & videos</li>
          <li>⭐ Featured artist placement & higher search ranking</li>
          <li>💬 Respond to customer reviews</li>
          <li>📊 Access to analytics and lead reports</li>
        </ul>
      </div>
      
      <p style="text-align: center;">
        <a href="https://universalinc.com/for-artists" class="cta-button">
          Create Your FREE Profile Now →
        </a>
      </p>
      
      <p>Join hundreds of Louisiana tattoo artists who are already growing their business with Universal Inc. It takes less than 5 minutes to get started!</p>
      
      <p>Questions? Just reply to this email and we'll be happy to help.</p>
      
      <p>Best regards,<br>
      <strong>The Universal Inc Team</strong></p>
    </div>
    
    <div class="footer">
      <p>Universal Inc - Louisiana's Tattoo Artist Network</p>
      <p>This is a one-time invitation. You can unsubscribe by replying to this email.</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: `${shopName} - You're Invited to Join Universal Inc! 🎨`,
    html,
  });
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmation(
  to: string,
  bookingDetails: {
    customerName: string;
    artistName: string;
    shopName: string;
    appointmentDate: string;
    depositAmount: number;
  }
) {
  const { customerName, artistName, shopName, appointmentDate, depositAmount } = bookingDetails;
  
  // Escape all user-provided inputs
  const escapedCustomerName = escapeHtml(customerName);
  const escapedArtistName = escapeHtml(artistName);
  const escapedShopName = escapeHtml(shopName);
  const escapedAppointmentDate = escapeHtml(appointmentDate);
  
  // Validate and sanitize depositAmount
  const safeDepositAmount = (typeof depositAmount === 'number' && !isNaN(depositAmount)) 
    ? depositAmount 
    : 0;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6, #10b981); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .booking-details { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .booking-details p { margin: 10px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Booking Confirmed!</h1>
    </div>
    <div class="content">
      <p>Hi ${escapedCustomerName},</p>
      
      <p>Your tattoo appointment has been confirmed! We're excited for you to get your new ink.</p>
      
      <div class="booking-details">
        <h3>Appointment Details:</h3>
        <p><strong>Artist:</strong> ${escapedArtistName}</p>
        <p><strong>Shop:</strong> ${escapedShopName}</p>
        <p><strong>Date & Time:</strong> ${escapedAppointmentDate}</p>
        <p><strong>Deposit Paid:</strong> $${safeDepositAmount.toFixed(2)}</p>
      </div>
      
      <p><strong>What's Next:</strong></p>
      <ul>
        <li>You'll receive a reminder 24 hours before your appointment</li>
        <li>Please arrive 10 minutes early</li>
        <li>Bring a valid ID</li>
        <li>Eat a meal before your appointment</li>
      </ul>
      
      <p>If you need to reschedule or have any questions, please contact the shop directly.</p>
      
      <p>See you soon!<br>
      <strong>Universal Inc Team</strong></p>
    </div>
    <div class="footer">
      <p>Universal Inc - Your Tattoo Journey Starts Here</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: `Booking Confirmed with ${artistName} at ${shopName}`,
    html,
  });
}
