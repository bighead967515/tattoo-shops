import { Resend } from "resend";
import { ENV } from "./_core/env";

const resend = new Resend(ENV.resendApiKey);

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions) {
  const { to, subject, html, from = "Universal Inc <noreply@universalinc.com>" } = options;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.error("Email send error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Email sent successfully:", data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Email send exception:", error);
    throw error;
  }
}

/**
 * Send artist invitation email
 */
export async function sendArtistInvitation(to: string, shopName: string) {
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
      <h2>Hello ${shopName}!</h2>
      
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
      <p>Hi ${customerName},</p>
      
      <p>Your tattoo appointment has been confirmed! We're excited for you to get your new ink.</p>
      
      <div class="booking-details">
        <h3>Appointment Details:</h3>
        <p><strong>Artist:</strong> ${artistName}</p>
        <p><strong>Shop:</strong> ${shopName}</p>
        <p><strong>Date & Time:</strong> ${appointmentDate}</p>
        <p><strong>Deposit Paid:</strong> $${depositAmount.toFixed(2)}</p>
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
