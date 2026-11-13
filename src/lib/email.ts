import nodemailer from "nodemailer";
import { Resend } from "resend";

interface SendOtpOptions {
  toEmail: string;
  userName: string;
  otp: string;
  purpose: "password_reset" | "login";
}

export async function sendOtpEmail({
  toEmail,
  userName,
  otp,
  purpose,
}: SendOtpOptions): Promise<{ success: boolean; provider: string; error?: string }> {
  const subject =
    purpose === "password_reset"
      ? "🔐 BBCC Fund - पासवर्ड रीसेट हेतु OTP"
      : "🔐 BBCC Fund - लॉगिन सत्यापन OTP";

  const purposeText =
    purpose === "password_reset"
      ? "आपके खाते का पासवर्ड रीसेट करने के लिए यह OTP भेजा गया है:"
      : "आपके खाते में सुरक्षित लॉगिन करने के लिए यह OTP भेजा गया है:";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 20px; }
          .card { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
          .body { padding: 32px 24px; text-align: center; }
          .otp-badge { display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0284c7; background: #f0f9ff; border: 2px dashed #0284c7; padding: 12px 28px; border-radius: 12px; margin: 20px 0; }
          .footer { background: #f1f5f9; padding: 16px; font-size: 12px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h2 style="margin: 0; font-size: 20px;">🏛️ BBCC FUND GRUP</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">पारदर्शी बचत एवं सहयोग समिति</p>
          </div>
          <div class="body">
            <h3 style="margin: 0 0 8px 0; color: #1e293b;">नमस्ते, ${userName}</h3>
            <p style="color: #64748b; font-size: 14px; margin: 0;">${purposeText}</p>
            <div class="otp-badge">${otp}</div>
            <p style="font-size: 13px; color: #e11d48; margin: 0; font-weight: 600;">
              ⚠️ यह OTP केवल 10 मिनट के लिए मान्य है। इसे किसी के साथ साझा न करें।
            </p>
          </div>
          <div class="footer">
            यह एक सुरक्षित स्वचालित ईमेल है। © 2026 BBCC Fund Grup.
          </div>
        </div>
      </body>
    </html>
  `;

  // 1. Try Resend API (Free 3,000 emails/month)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && !resendApiKey.includes("placeholder")) {
    try {
      const resend = new Resend(resendApiKey);
      const res = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "BBCC Fund <onboarding@resend.dev>",
        to: toEmail,
        subject,
        html: htmlContent,
      });

      if (res.error) {
        console.warn("Resend email warning:", res.error);
      } else {
        return { success: true, provider: "resend" };
      }
    } catch (err: any) {
      console.warn("Resend email failed, trying SMTP:", err?.message);
    }
  }

  // 2. Try Gmail SMTP / Nodemailer (100% Free with Gmail App Password)
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (smtpEmail && smtpPassword && !smtpEmail.includes("placeholder")) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: smtpEmail,
          pass: smtpPassword, // 16-digit Google App Password
        },
      });

      await transporter.sendMail({
        from: `"BBCC Fund Grup" <${smtpEmail}>`,
        to: toEmail,
        subject,
        html: htmlContent,
      });

      return { success: true, provider: "gmail_smtp" };
    } catch (err: any) {
      console.warn("SMTP email failed:", err?.message);
    }
  }

  // 3. Fallback for Local Dev & Testing: Log OTP to console so process never blocks
  console.log("==========================================");
  console.log(`[BBCC OTP NOTIFICATION] To: ${toEmail} | OTP: ${otp} | Purpose: ${purpose}`);
  console.log("==========================================");

  return { success: true, provider: "console_fallback" };
}
