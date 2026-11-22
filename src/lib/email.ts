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

// Check Email Provider Connection Status (Brevo API prioritized)
export function getEmailServiceStatus(): {
  connected: boolean;
  provider: "brevo" | "gmail_smtp" | "resend" | "none";
  details: string;
} {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (brevoApiKey && !brevoApiKey.includes("placeholder")) {
    return {
      connected: true,
      provider: "brevo",
      details: `Brevo SMTP API सक्रिय (300 फ्री ईमेल/दिन - Key: ${brevoApiKey.slice(0, 8)}...)`,
    };
  }

  if (smtpEmail && smtpPassword && !smtpEmail.includes("placeholder")) {
    return {
      connected: true,
      provider: "gmail_smtp",
      details: `Gmail SMTP सक्रिय (500 फ्री ईमेल/दिन - ${smtpEmail})`,
    };
  }

  if (resendApiKey && !resendApiKey.includes("placeholder")) {
    return {
      connected: true,
      provider: "resend",
      details: `Resend API सक्रिय (Key: ${resendApiKey.slice(0, 6)}...${resendApiKey.slice(-4)})`,
    };
  }

  return {
    connected: false,
    provider: "none",
    details: "कोई ईमेल सेवा कॉन्फ़िगर नहीं है (Brevo API Key दर्ज करें)",
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
      ? "🧪 DFI - Brevo ईमेल सत्यापन व OTP टेस्ट"
      : "🔐 DFI इमरजेंसी सेवा - लॉगिन सत्यापन OTP";

  const purposeText =
    purpose === "password_reset"
      ? "आपके खाते का पासवर्ड रीसेट करने के लिए यह OTP भेजा गया है:"
      : purpose === "test"
      ? "यह DFI Brevo ईमेल सेवा की जांच के लिए भेजा गया परीक्षण OTP है:"
      : "DFI इमरजेंसी सेवा पोर्टल में सुरक्षित लॉगिन हेतु 6-अंकीय OTP:";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 20px; }
          .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 24px; text-align: center; color: #ffffff; }
          .logo-badge { display: inline-block; background: #2563eb; color: #ffffff; font-weight: 900; font-size: 22px; padding: 6px 20px; border-radius: 10px; letter-spacing: 2px; margin-bottom: 10px; }
          .body { padding: 32px 26px; text-align: center; }
          .otp-badge { display: inline-block; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0284c7; background: #f0f9ff; border: 2px dashed #0284c7; padding: 14px 32px; border-radius: 14px; margin: 24px 0; }
          .footer { background: #f8fafc; padding: 18px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo-badge">DFI</div>
            <h2 style="margin: 0; font-size: 20px; font-weight: 700;">इमरजेंसी सेवा ग्रुप - DFI 🙏</h2>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">पारदर्शी बचत, सहयोग एवं वित्तीय सहायता पोर्टल</p>
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
            यह एक सुरक्षित स्वचालित प्रणाली ईमेल है। © 2026 DFI इमरजेंसी सेवा ग्रुप.
          </div>
        </div>
      </body>
    </html>
  `;

  // 1. PRIORITY 1: Brevo SMTP API (https://app.brevo.com/settings/keys/api)
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (brevoApiKey && !brevoApiKey.includes("placeholder")) {
    try {
      const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.FOUNDER_EMAIL || "sky140052@gmail.com";
      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": brevoApiKey.trim(),
        },
        body: JSON.stringify({
          sender: { name: "DFI इमरजेंसी सेवा", email: senderEmail },
          to: [{ email: toEmail, name: userName }],
          subject,
          htmlContent,
        }),
      });

      if (brevoRes.ok) {
        return { success: true, provider: "brevo", otp };
      } else {
        const errorText = await brevoRes.text();
        console.warn("Brevo API warning response:", errorText);
      }
    } catch (err: any) {
      console.warn("Brevo API call failed:", err?.message);
    }
  }

  // 2. PRIORITY 2: Gmail SMTP / Nodemailer
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
        from: `"DFI इमरजेंसी सेवा" <${smtpEmail}>`,
        to: toEmail,
        subject,
        html: htmlContent,
      });

      return { success: true, provider: "gmail_smtp", otp };
    } catch (err: any) {
      console.warn("Gmail SMTP email failed:", err?.message);
    }
  }

  // 3. PRIORITY 3: Resend API
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

      if (!res.error) {
        return { success: true, provider: "resend", otp };
      }
    } catch (err: any) {
      console.warn("Resend email failed:", err?.message);
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
      : "👤 DFI सदस्य";

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
              यदि यह लॉगिन आपने नहीं किया है, तो तुरंत अपने एडमिन से संपर्क करें।
            </p>
          </div>
          <div class="footer">
            DFI सुरक्षा डेस्क • © 2026 DFI इमरजेंसी सेवा
          </div>
        </div>
      </body>
    </html>
  `;

  // Brevo
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (brevoApiKey && !brevoApiKey.includes("placeholder")) {
    try {
      const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.FOUNDER_EMAIL || "sky140052@gmail.com";
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": brevoApiKey.trim(),
        },
        body: JSON.stringify({
          sender: { name: "DFI सुरक्षा", email: senderEmail },
          to: [{ email: toEmail, name: userName }],
          subject,
          htmlContent,
        }),
      });
      return { success: true, provider: "brevo" };
    } catch {}
  }

  return { success: true, provider: "system_generated" };
}

// Stubs for broadcast alerts
export async function sendPaymentAlertToAll(params: any): Promise<void> {
  console.log(`[DFI Broadcast] Payment Alert:`, params);
}

export async function sendLoanRequestAlertToAll(params: any): Promise<void> {
  console.log(`[DFI Broadcast] Loan Request:`, params);
}

export async function sendLoanDisbursedAlertToAll(params: any): Promise<void> {
  console.log(`[DFI Broadcast] Loan Disbursed:`, params);
}
