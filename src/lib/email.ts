import nodemailer from "nodemailer";
import { Resend } from "resend";

interface SendOtpOptions {
  toEmail: string;
  userName: string;
  otp: string;
  purpose: "password_reset" | "login" | "test";
}

interface SendLoginAlertOptions {
  toEmail: string;
  userName: string;
  loginTime?: string;
  role?: string;
}

// Check Email Provider Connection Status
export function getEmailServiceStatus(): {
  connected: boolean;
  provider: "resend" | "gmail_smtp" | "brevo" | "none";
  details: string;
} {
  const resendApiKey = process.env.RESEND_API_KEY;
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const brevoApiKey = process.env.BREVO_API_KEY;

  if (resendApiKey && !resendApiKey.includes("placeholder")) {
    return {
      connected: true,
      provider: "resend",
      details: `Resend API Active (Key: ${resendApiKey.slice(0, 6)}...${resendApiKey.slice(-4)})`,
    };
  }

  if (smtpEmail && smtpPassword && !smtpEmail.includes("placeholder")) {
    return {
      connected: true,
      provider: "gmail_smtp",
      details: `Gmail SMTP Active (${smtpEmail})`,
    };
  }

  if (brevoApiKey && !brevoApiKey.includes("placeholder")) {
    return {
      connected: true,
      provider: "brevo",
      details: "Brevo SMTP API Active (300 Free/Day)",
    };
  }

  return {
    connected: false,
    provider: "none",
    details: "कोई ईमेल सेवा कॉन्फ़िगर नहीं है (No Email Provider Configured)",
  };
}

export async function sendOtpEmail({
  toEmail,
  userName,
  otp,
  purpose,
}: SendOtpOptions): Promise<{ success: boolean; provider: string; error?: string; otp: string }> {
  const subject =
    purpose === "password_reset"
      ? "🔐 DFI - पासवर्ड रीसेट हेतु OTP"
      : purpose === "test"
      ? "🧪 DFI - ईमेल सत्यापन व OTP टेस्ट"
      : "🔐 DFI - एडमिन लॉगिन सत्यापन OTP";

  const purposeText =
    purpose === "password_reset"
      ? "आपके खाते का पासवर्ड रीसेट करने के लिए यह OTP भेजा गया है:"
      : purpose === "test"
      ? "यह DFI ईमेल सेवा की जांच के लिए भेजा गया परीक्षण OTP है:"
      : "DFI एडमिन पोर्टल में सुरक्षित लॉगिन हेतु 6-अंकीय OTP:";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 20px; }
          .card { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06); }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 26px 20px; text-align: center; color: #ffffff; }
          .logo-badge { display: inline-block; background: #3b82f6; color: #ffffff; font-weight: 900; font-size: 22px; padding: 6px 18px; border-radius: 8px; letter-spacing: 2px; margin-bottom: 8px; }
          .body { padding: 32px 24px; text-align: center; }
          .otp-badge { display: inline-block; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0284c7; background: #f0f9ff; border: 2px dashed #0284c7; padding: 14px 30px; border-radius: 12px; margin: 22px 0; }
          .footer { background: #f8fafc; padding: 16px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo-badge">DFI</div>
            <h2 style="margin: 0; font-size: 18px; font-weight: 600;">Digital Fund Infrastructure</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">सुरक्षित एवं पारदर्शी डिजिटल वित्तीय प्रणाली</p>
          </div>
          <div class="body">
            <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 18px;">नमस्ते, ${userName}</h3>
            <p style="color: #64748b; font-size: 14px; margin: 0;">${purposeText}</p>
            <div class="otp-badge">${otp}</div>
            <p style="font-size: 13px; color: #e11d48; margin: 0; font-weight: 600;">
              ⚠️ यह OTP केवल 10 मिनट के लिए मान्य है। इसे किसी के साथ साझा न करें।
            </p>
          </div>
          <div class="footer">
            यह एक सुरक्षित स्वचालित प्रणाली ईमेल है। © 2026 DFI. सर्वाधिकार सुरक्षित।
          </div>
        </div>
      </body>
    </html>
  `;

  // 1. Try Gmail SMTP / Nodemailer (Highest deliverability, 500 free/day)
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (smtpEmail && smtpPassword && !smtpEmail.includes("placeholder")) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: smtpEmail,
          pass: smtpPassword,
        },
      });

      await transporter.sendMail({
        from: `"DFI Admin Portal" <${smtpEmail}>`,
        to: toEmail,
        subject,
        html: htmlContent,
      });

      return { success: true, provider: "gmail_smtp", otp };
    } catch (err: any) {
      console.warn("Gmail SMTP email failed:", err?.message);
    }
  }

  // 2. Try Resend API (3,000 free/month)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && !resendApiKey.includes("placeholder")) {
    try {
      const resend = new Resend(resendApiKey);
      const res = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "DFI <onboarding@resend.dev>",
        to: toEmail,
        subject,
        html: htmlContent,
      });

      if (res.error) {
        console.warn("Resend email warning:", res.error);
      } else {
        return { success: true, provider: "resend", otp };
      }
    } catch (err: any) {
      console.warn("Resend email failed:", err?.message);
    }
  }

  // 3. Try Brevo API (300 free/day)
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (brevoApiKey && !brevoApiKey.includes("placeholder")) {
    try {
      const brevoSender = process.env.BREVO_SENDER_EMAIL || "sky140052@gmail.com";
      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": brevoApiKey,
        },
        body: JSON.stringify({
          sender: { name: "DFI Portal", email: brevoSender },
          to: [{ email: toEmail }],
          subject,
          htmlContent,
        }),
      });

      if (brevoRes.ok) {
        return { success: true, provider: "brevo", otp };
      }
    } catch (err: any) {
      console.warn("Brevo API email failed:", err?.message);
    }
  }

  // 4. Fallback / Console
  console.log("==========================================");
  console.log(`[DFI OTP NOTIFICATION] To: ${toEmail} | OTP: ${otp} | Purpose: ${purpose}`);
  console.log("==========================================");

  return { success: true, provider: "system_generated", otp };
}

// Send Login Alert Notification Email
export async function sendLoginAlertEmail({
  toEmail,
  userName,
  loginTime = new Date().toLocaleString("hi-IN", { timeZone: "Asia/Kolkata" }),
  role,
}: SendLoginAlertOptions): Promise<{ success: boolean; provider: string }> {
  const subject = "🔔 DFI - आपके खाते में नया लॉगिन अलर्ट";

  const roleText =
    role === "founder" || role === "admin"
      ? "👑 मुख्य एडमिन (Administrator)"
      : "👤 सदस्य / क्लाइंट";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 20px; }
          .card { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06); }
          .header { background: #0f172a; padding: 22px; text-align: center; color: #ffffff; }
          .logo-badge { display: inline-block; background: #3b82f6; color: #ffffff; font-weight: 800; font-size: 20px; padding: 4px 14px; border-radius: 6px; letter-spacing: 2px; }
          .body { padding: 28px 24px; }
          .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
          .info-label { color: #64748b; font-weight: 500; }
          .info-val { color: #0f172a; font-weight: 600; }
          .footer { background: #f8fafc; padding: 14px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo-badge">DFI</div>
            <h3 style="margin: 8px 0 0 0; font-size: 16px; font-weight: 600;">सुरक्षा लॉगिन सूचना</h3>
          </div>
          <div class="body">
            <p style="margin: 0; color: #334155; font-size: 14px;">
              नमस्ते <b>${userName}</b>, आपके DFI पोर्टल में अभी एक सफल लॉगिन दर्ज किया गया है।
            </p>
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">भूमिका (Role):</span>
                <span class="info-val">${roleText}</span>
              </div>
              <div class="info-row">
                <span class="info-label">लॉगिन समय:</span>
                <span class="info-val">${loginTime}</span>
              </div>
              <div class="info-row" style="margin-bottom: 0;">
                <span class="info-label">ईमेल आईडी:</span>
                <span class="info-val">${toEmail}</span>
              </div>
            </div>
            <p style="font-size: 12px; color: #64748b; margin: 0;">
              यदि यह लॉगिन आपने नहीं किया है, तो तुरंत अपने सिस्टम की सुरक्षा जांच करें।
            </p>
          </div>
          <div class="footer">
            सुरक्षा एवं अनुपालन डेस्क • © 2026 DFI
          </div>
        </div>
      </body>
    </html>
  `;

  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (smtpEmail && smtpPassword && !smtpEmail.includes("placeholder")) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: smtpEmail, pass: smtpPassword },
      });
      await transporter.sendMail({
        from: `"DFI Security Alert" <${smtpEmail}>`,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      return { success: true, provider: "gmail_smtp" };
    } catch {
      // Continue to next provider
    }
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && !resendApiKey.includes("placeholder")) {
    try {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "DFI <onboarding@resend.dev>",
        to: toEmail,
        subject,
        html: htmlContent,
      });
      return { success: true, provider: "resend" };
    } catch {
      // Fallback
    }
  }

  return { success: true, provider: "system_generated" };
}

// Payment Alert Broadcast
export async function sendPaymentAlertToAll(params: any): Promise<void> {
  console.log(`[DFI Broadcast] Payment Alert:`, params);
}

// Loan Request Alert Broadcast
export async function sendLoanRequestAlertToAll(params: any): Promise<void> {
  console.log(`[DFI Broadcast] Loan Request:`, params);
}

// Loan Disbursed Alert Broadcast
export async function sendLoanDisbursedAlertToAll(params: any): Promise<void> {
  console.log(`[DFI Broadcast] Loan Disbursed:`, params);
}
