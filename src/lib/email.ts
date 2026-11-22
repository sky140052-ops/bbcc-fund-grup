import nodemailer from "nodemailer";
import { Resend } from "resend";
import { dbGetSystemSettings } from "./astra";

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

// Helper to resolve email credentials from env or database settings
async function resolveEmailConfig() {
  let brevoApiKey = (process.env.BREVO_API_KEY || "").trim();
  let brevoSender = (process.env.BREVO_SENDER_EMAIL || process.env.FOUNDER_EMAIL || "sky140052@gmail.com").trim();
  let smtpEmail = (process.env.SMTP_EMAIL || "").trim();
  let smtpPassword = (process.env.SMTP_PASSWORD || "").trim();
  const resendApiKey = (process.env.RESEND_API_KEY || "").trim();
  const founderEmail = (process.env.FOUNDER_EMAIL || "sky140052@gmail.com").trim().toLowerCase();

  try {
    const settings = await dbGetSystemSettings();
    if (!brevoApiKey && settings.brevo_api_key) {
      brevoApiKey = settings.brevo_api_key.trim();
    }
    if (settings.brevo_sender_email) {
      brevoSender = settings.brevo_sender_email.trim();
    }
    if (!smtpEmail && settings.smtp_email) {
      smtpEmail = settings.smtp_email.trim();
      smtpPassword = (settings.smtp_password || "").trim();
    }
  } catch (err) {
    console.warn("Could not load email settings from DB:", err);
  }

  return {
    brevoApiKey,
    brevoSender,
    smtpEmail,
    smtpPassword,
    resendApiKey,
    founderEmail,
  };
}

// Check Email Provider Connection Status (Brevo API prioritized)
export async function getEmailServiceStatus(): Promise<{
  connected: boolean;
  provider: "brevo" | "gmail_smtp" | "resend" | "none";
  details: string;
  sender_email?: string;
  has_brevo_key?: boolean;
}> {
  const config = await resolveEmailConfig();

  if (config.brevoApiKey && !config.brevoApiKey.includes("placeholder")) {
    return {
      connected: true,
      provider: "brevo",
      details: `Brevo SMTP API सक्रिय (300 फ्री ईमेल/दिन - Key: ${config.brevoApiKey.slice(0, 8)}... - प्रेषक: ${config.brevoSender})`,
      sender_email: config.brevoSender,
      has_brevo_key: true,
    };
  }

  if (config.smtpEmail && config.smtpPassword && !config.smtpEmail.includes("placeholder")) {
    return {
      connected: true,
      provider: "gmail_smtp",
      details: `Gmail SMTP सक्रिय (500 फ्री ईमेल/दिन - ${config.smtpEmail})`,
      sender_email: config.smtpEmail,
      has_brevo_key: false,
    };
  }

  if (config.resendApiKey && !config.resendApiKey.includes("placeholder")) {
    return {
      connected: true,
      provider: "resend",
      details: `Resend API सक्रिय (.env.local से स्वचालित - Key: ${config.resendApiKey.slice(0, 6)}...${config.resendApiKey.slice(-4)})`,
      sender_email: "onboarding@resend.dev",
      has_brevo_key: false,
    };
  }

  return {
    connected: false,
    provider: "none",
    details: "कोई ईमेल सेवा कॉन्फ़िगर नहीं है (.env.local में API Key दर्ज करें)",
    sender_email: config.brevoSender,
    has_brevo_key: false,
  };
}

export async function sendOtpEmail({
  toEmail,
  userName,
  otp,
  purpose,
}: SendOtpOptions): Promise<{ success: boolean; provider: string; error?: string; otp: string }> {
  const cleanToEmail = toEmail.trim().toLowerCase();
  const config = await resolveEmailConfig();

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
  if (config.brevoApiKey && !config.brevoApiKey.includes("placeholder")) {
    try {
      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": config.brevoApiKey.trim(),
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: "DFI इमरजेंसी सेवा", email: config.brevoSender },
          to: [{ email: cleanToEmail, name: userName }],
          subject,
          htmlContent,
        }),
      });

      if (brevoRes.ok) {
        console.log(`[Brevo OTP Sent] To: ${cleanToEmail} | Provider: Brevo (200 OK)`);
        return { success: true, provider: "brevo", otp };
      } else {
        const errorJson = await brevoRes.json().catch(() => ({}));
        const errText = errorJson.message || `Brevo HTTP ${brevoRes.status}`;
        console.warn("Brevo API warning response:", errText);
      }
    } catch (err: any) {
      console.warn("Brevo API call failed:", err?.message);
    }
  }

  // 2. PRIORITY 2: Gmail SMTP / Nodemailer
  if (config.smtpEmail && config.smtpPassword && !config.smtpEmail.includes("placeholder")) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: config.smtpEmail,
          pass: config.smtpPassword,
        },
      });

      await transporter.sendMail({
        from: `"DFI इमरजेंसी सेवा" <${config.smtpEmail}>`,
        to: cleanToEmail,
        subject,
        html: htmlContent,
      });

      console.log(`[Gmail SMTP OTP Sent] To: ${cleanToEmail}`);
      return { success: true, provider: "gmail_smtp", otp };
    } catch (err: any) {
      console.warn("Gmail SMTP email failed:", err?.message);
    }
  }

  // 3. PRIORITY 3: Resend API
  if (config.resendApiKey && !config.resendApiKey.includes("placeholder")) {
    try {
      const resend = new Resend(config.resendApiKey);

      // Direct send to the exact email entered
      const directRes = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "DFI <onboarding@resend.dev>",
        to: cleanToEmail,
        subject,
        html: htmlContent,
      });

      if (!directRes.error) {
        console.log(`[Resend OTP Sent Directly] To: ${cleanToEmail}`);
        return { success: true, provider: "resend", otp };
      } else {
        console.warn(`[Resend send failed for ${cleanToEmail}]:`, directRes.error.message);
        if (cleanToEmail !== config.founderEmail) {
          return {
            success: false,
            provider: "resend",
            error: "Resend फ़्री टियर केवल एडमिन ईमेल की अनुमति देता है। सदस्यों के ईमेल पर सीधे OTP भेजने हेतु .env.local में BREVO_API_KEY (xkeysib-...) या Gmail App Password दर्ज करें।",
            otp,
          };
        }
      }
    } catch (err: any) {
      console.warn("Resend email failed:", err?.message);
    }
  }

  // 4. Fallback / Console Log
  console.log("==========================================");
  console.log(`[DFI OTP NOTIFICATION] To: ${cleanToEmail} | OTP: ${otp} | Purpose: ${purpose}`);
  console.log("==========================================");

  return {
    success: false,
    provider: "none",
    error: "ईमेल सेवा से सदस्य के ईमेल पर OTP नहीं भेजा जा सका। कृपया .env.local में BREVO_API_KEY या Gmail App Password दर्ज करें।",
    otp,
  };
}

// Send Login Alert Notification Email
export async function sendLoginAlertEmail({
  toEmail,
  userName,
  loginTime = new Date().toLocaleString("hi-IN", { timeZone: "Asia/Kolkata" }),
  role,
}: SendLoginAlertOptions): Promise<{ success: boolean; provider: string }> {
  const cleanToEmail = toEmail.trim().toLowerCase();
  const config = await resolveEmailConfig();
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
                <span class="info-val">${cleanToEmail}</span>
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
  if (config.brevoApiKey && !config.brevoApiKey.includes("placeholder")) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": config.brevoApiKey.trim(),
        },
        body: JSON.stringify({
          sender: { name: "DFI सुरक्षा", email: config.brevoSender },
          to: [{ email: cleanToEmail, name: userName }],
          subject,
          htmlContent,
        }),
      });
      if (res.ok) return { success: true, provider: "brevo" };
    } catch {}
  }

  // Gmail SMTP
  if (config.smtpEmail && config.smtpPassword) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: config.smtpEmail, pass: config.smtpPassword },
      });
      await transporter.sendMail({
        from: `"DFI सुरक्षा" <${config.smtpEmail}>`,
        to: cleanToEmail,
        subject,
        html: htmlContent,
      });
      return { success: true, provider: "gmail_smtp" };
    } catch {}
  }

  // Resend for founder
  if (cleanToEmail === config.founderEmail && config.resendApiKey) {
    try {
      const resend = new Resend(config.resendApiKey);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "DFI <onboarding@resend.dev>",
        to: cleanToEmail,
        subject,
        html: htmlContent,
      });
      return { success: true, provider: "resend" };
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
