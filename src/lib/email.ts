import nodemailer from "nodemailer";
import { Resend } from "resend";
import { dbGetSystemSettings, dbFindMembers } from "./astra";

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

// Generic Email Sender supporting Brevo -> Gmail SMTP -> Resend
export async function sendGeneralEmail({
  toEmail,
  toName,
  subject,
  htmlContent,
}: {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
}): Promise<{ success: boolean; provider: string; error?: string }> {
  const cleanEmail = toEmail.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, provider: "none", error: "अमान्य ईमेल आईडी" };
  }

  const config = await resolveEmailConfig();

  // 1. Brevo SMTP API (Priority 1)
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
          to: [{ email: cleanEmail, name: toName }],
          subject,
          htmlContent,
        }),
      });

      if (brevoRes.ok) {
        console.log(`[Brevo Email Sent] To: ${cleanEmail} | Subject: ${subject}`);
        return { success: true, provider: "brevo" };
      } else {
        const errJson = await brevoRes.json().catch(() => ({}));
        console.warn("Brevo API warning:", errJson);
      }
    } catch (err: any) {
      console.warn("Brevo API send error:", err?.message);
    }
  }

  // 2. Gmail SMTP
  if (config.smtpEmail && config.smtpPassword && !config.smtpEmail.includes("placeholder")) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: config.smtpEmail, pass: config.smtpPassword },
      });
      await transporter.sendMail({
        from: `"DFI इमरजेंसी सेवा" <${config.smtpEmail}>`,
        to: cleanEmail,
        subject,
        html: htmlContent,
      });
      console.log(`[Gmail SMTP Email Sent] To: ${cleanEmail}`);
      return { success: true, provider: "gmail_smtp" };
    } catch (err: any) {
      console.warn("Gmail SMTP send error:", err?.message);
    }
  }

  // 3. Resend fallback
  if (config.resendApiKey && !config.resendApiKey.includes("placeholder")) {
    try {
      const resend = new Resend(config.resendApiKey);
      const resendRes = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "DFI <onboarding@resend.dev>",
        to: cleanEmail,
        subject,
        html: htmlContent,
      });
      if (!resendRes.error) {
        console.log(`[Resend Email Sent] To: ${cleanEmail}`);
        return { success: true, provider: "resend" };
      }
    } catch (err: any) {
      console.warn("Resend send error:", err?.message);
    }
  }

  console.log(`[Email Log Fallback] To: ${cleanEmail} | Subject: ${subject}`);
  return { success: true, provider: "fallback_logged" };
}

// ==========================================
// Broadcast Email System (To Admin & ALL Members)
// Embeds & Attaches Payment / Transfer Screenshots
// ==========================================
export async function sendBroadcastEmail({
  subject,
  htmlContent,
  screenshot,
  additionalRecipients = [],
}: {
  subject: string;
  htmlContent: string;
  screenshot?: string;
  additionalRecipients?: { email: string; name: string }[];
}): Promise<{ totalSent: number; errors: number }> {
  const config = await resolveEmailConfig();
  const adminEmail = (config.founderEmail || "sky140052@gmail.com").trim().toLowerCase();

  const recipientMap = new Map<string, string>();
  recipientMap.set(adminEmail, "Admin");

  // Fetch all registered members from database
  try {
    const members = await dbFindMembers();
    for (const m of members) {
      if (m.email && m.email.includes("@")) {
        recipientMap.set(m.email.trim().toLowerCase(), m.name || "Member");
      }
    }
  } catch (err) {
    console.warn("Failed to fetch members for broadcast email:", err);
  }

  // Include any extra recipients
  for (const r of additionalRecipients) {
    if (r.email && r.email.includes("@")) {
      recipientMap.set(r.email.trim().toLowerCase(), r.name || "Member");
    }
  }

  const recipients = Array.from(recipientMap.entries()).map(([email, name]) => ({ email, name }));
  if (recipients.length === 0) {
    return { totalSent: 0, errors: 0 };
  }

  // Extract base64 attachment if screenshot is provided
  let attachments: { name: string; content: string }[] | undefined = undefined;
  if (screenshot) {
    let cleanBase64 = "";
    if (screenshot.includes(";base64,")) {
      cleanBase64 = screenshot.split(";base64,")[1];
    } else if (!screenshot.startsWith("http")) {
      cleanBase64 = screenshot;
    }
    if (cleanBase64 && cleanBase64.length > 20) {
      attachments = [{ name: "proof_screenshot.jpg", content: cleanBase64 }];
    }
  }

  let totalSent = 0;
  let errors = 0;

  // 1. Send via Brevo API in batches of up to 40 recipients per call
  if (config.brevoApiKey && !config.brevoApiKey.includes("placeholder")) {
    const batchSize = 40;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      try {
        const payload: any = {
          sender: { name: "DFI इमरजेंसी सेवा", email: config.brevoSender },
          to: batch,
          subject,
          htmlContent,
        };
        if (attachments && attachments.length > 0) {
          payload.attachment = attachments;
        }

        const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": config.brevoApiKey.trim(),
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (brevoRes.ok) {
          totalSent += batch.length;
          console.log(`[Brevo Broadcast Sent] ${batch.length} recipients | Subject: ${subject}`);
        } else {
          const errData = await brevoRes.json().catch(() => ({}));
          console.warn("[Brevo Broadcast Error]", errData);
          errors += batch.length;
        }
      } catch (err: any) {
        console.warn("[Brevo Broadcast Exception]", err?.message);
        errors += batch.length;
      }
    }

    if (totalSent > 0) {
      return { totalSent, errors };
    }
  }

  // 2. Fallback: Send individually via Gmail SMTP or Resend
  for (const r of recipients) {
    const res = await sendGeneralEmail({
      toEmail: r.email,
      toName: r.name,
      subject,
      htmlContent,
    });
    if (res.success) totalSent++;
    else errors++;
  }

  return { totalSent, errors };
}

// Deposit Screenshot Email Notification (Pending, Approved, Rejected)
// Broadcasts to Admin AND ALL MEMBERS with attached and embedded screenshot!
export async function sendDepositNotificationEmail(params: {
  type: "pending" | "approved" | "rejected";
  memberName: string;
  memberEmail?: string;
  amount: number;
  month: string;
  screenshotUrl?: string;
  rejectionReason?: string;
}) {
  const { type, memberName, memberEmail, amount, month, screenshotUrl, rejectionReason } = params;

  if (type === "pending") {
    const subject = `📥 नया अंशदान प्रमाण - ${memberName} (₹${amount}) - [समीक्षाधीन]`;
    const screenshotHtml = screenshotUrl
      ? `<div style="margin: 18px 0; padding: 14px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; text-align: center;">
           <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 13px; color: #1e293b;">📸 भुगतान स्क्रीनशॉट (पेमेंट प्रूफ):</p>
           <img src="${screenshotUrl}" alt="Payment Proof" style="max-width: 100%; max-height: 420px; border-radius: 8px; border: 1px solid #cbd5e1; display: inline-block;" />
         </div>`
      : "";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; padding: 24px;">
        <div style="background: #0f172a; padding: 20px; border-radius: 10px; color: #ffffff; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">DFI इमरजेंसी सेवा - नया अंशदान प्रमाण</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">पारदर्शी कम्युनिटी फंड सूचना (सभी सदस्य एवं एडमिन)</p>
        </div>
        <div style="padding: 20px 0; color: #334155;">
          <p style="font-size: 15px;">सदस्य <b>${memberName}</b> ने माह <b>${month}</b> के लिए <b>₹${amount}</b> का अंशदान जमा कर स्क्रीनशॉट अपलोड किया है।</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0;"><b>सदस्य का नाम:</b> ${memberName}</p>
            <p style="margin: 4px 0;"><b>अंशदान राशि:</b> ₹${amount}</p>
            <p style="margin: 4px 0;"><b>माह:</b> ${month}</p>
            <p style="margin: 4px 0;"><b>स्थिति:</b> <span style="color: #d97706; font-weight: bold;">लंबित समीक्षा (24 घंटे में स्वतः स्वीकृति)</span></p>
            <p style="margin: 6px 0 0 0; font-size: 12px; color: #64748b;">(एडमिन द्वारा सत्यापन अथवा 24 घंटे पूर्ण होने पर यह राशि कम्युनिटी फंड व सदस्य के खाते में स्वतः जुड़ जाएगी)</p>
          </div>
          ${screenshotHtml}
        </div>
        <div style="font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          DFI ऑटोमेशन डेस्क • पारदर्शी वित्तीय सहयोग प्रणाली
        </div>
      </div>
    `;

    // Broadcast to Admin AND ALL MEMBERS!
    await sendBroadcastEmail({
      subject,
      htmlContent,
      screenshot: screenshotUrl,
      additionalRecipients: memberEmail ? [{ email: memberEmail, name: memberName }] : [],
    });
  } else if (type === "approved") {
    const subject = `✅ अंशदान स्वीकृत - ${memberName} (₹${amount}) - कम्युनिटी फंड में जुड़ा`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; padding: 24px;">
        <div style="background: #15803d; padding: 20px; border-radius: 10px; color: #ffffff; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">अंशदान स्वीकृति पुष्टिकरण 🎉</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #bbf7d0;">सभी सदस्यों को पारदर्शी सूचना</p>
        </div>
        <div style="padding: 20px 0; color: #334155;">
          <p style="font-size: 15px;">सदस्य <b>${memberName}</b> का माह <b>${month}</b> हेतु <b>₹${amount}</b> का अंशदान स्वीकृत हो गया है और कम्युनिटी फंड में सफलतापूर्वक जुड़ चुका है।</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin: 16px 0;">
            <p style="margin: 4px 0;"><b>सदस्य:</b> ${memberName}</p>
            <p style="margin: 4px 0;"><b>स्वीकृत राशि:</b> ₹${amount}</p>
            <p style="margin: 4px 0;"><b>माह:</b> ${month}</p>
            <p style="margin: 4px 0; color: #15803d; font-weight: bold;">स्थिति: स्वीकृत एवं संचित</p>
          </div>
        </div>
        <div style="font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          DFI वित्तीय डेस्क • © 2026 DFI इमरजेंसी सेवा
        </div>
      </div>
    `;

    // Broadcast to Admin AND ALL MEMBERS!
    await sendBroadcastEmail({
      subject,
      htmlContent,
      additionalRecipients: memberEmail ? [{ email: memberEmail, name: memberName }] : [],
    });
  } else if (type === "rejected") {
    if (memberEmail) {
      const subject = `⚠️ DFI - आपका अंशदान स्क्रीनशॉट अस्वीकृत हुआ`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; padding: 24px;">
          <div style="background: #b91c1c; padding: 18px; border-radius: 10px; color: #ffffff; text-align: center;">
            <h2 style="margin: 0; font-size: 18px;">स्क्रीनशॉट अस्वीकृति सूचना</h2>
          </div>
          <div style="padding: 20px 0; color: #334155;">
            <p>नमस्ते <b>${memberName}</b>,</p>
            <p>माह <b>${month}</b> के लिए आपके द्वारा जमा किया गया स्क्रीनशॉट निम्नलिखित कारणवश अस्वीकृत हो गया है:</p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; margin: 16px 0; color: #991b1b; font-weight: bold;">
              कारण: ${rejectionReason || "अस्पष्ट अथवा अमान्य भुगतान प्रमाण"}
            </div>
            <p>कृपया सही भुगतान स्क्रीनशॉट पोर्टल पर दोबारा अपलोड करें।</p>
          </div>
        </div>
      `;
      await sendGeneralEmail({ toEmail: memberEmail, toName: memberName, subject, htmlContent });
    }
  }
}

// Loan Application Notification (Broadcasts to Admin & ALL MEMBERS)
export async function sendLoanApplicationEmail(params: {
  memberName: string;
  memberEmail?: string;
  requestedAmount: number;
  disbursedAmount: number;
  reason: string;
  totalDeposit: number;
  eligibleMax: number;
  communityPool?: number;
}) {
  const { memberName, memberEmail, requestedAmount, disbursedAmount, reason, totalDeposit, eligibleMax, communityPool } = params;
  const processingFee = Math.round(requestedAmount * 0.05); // 5% fee

  const subject = `📋 नया लोन आवेदन - ${memberName} (₹${requestedAmount})`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; padding: 24px;">
      <div style="background: #0f172a; padding: 20px; border-radius: 10px; color: #ffffff; text-align: center;">
        <h2 style="margin: 0; font-size: 20px;">DFI इमरजेंसी सेवा - नया लोन आवेदन</h2>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">सभी सदस्यों एवं एडमिन को सार्वजनिक वित्तीय सूचना</p>
      </div>
      <div style="padding: 20px 0; color: #334155;">
        <p style="font-size: 15px;">सदस्य <b>${memberName}</b> ने <b>₹${requestedAmount}</b> के लोन हेतु आवेदन किया है।</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0;"><b>आवेदक सदस्य:</b> ${memberName}</p>
          <p style="margin: 4px 0;"><b>कुल कम्युनिटी फंड:</b> ₹${communityPool || eligibleMax}</p>
          <p style="margin: 4px 0;"><b>आवेदक सदस्य की कुल जमा राशि:</b> ₹${totalDeposit}</p>
          <p style="margin: 4px 0;"><b>आवेदन लोन राशि:</b> ₹${requestedAmount}</p>
          <p style="margin: 4px 0;"><b>प्रोसेसिंग शुल्क (5%):</b> ₹${processingFee}</p>
          <p style="margin: 4px 0;"><b>हस्तांतरित होने वाली शुद्ध राशि (95%):</b> <span style="color: #16a34a; font-weight: bold;">₹${disbursedAmount}</span></p>
          <p style="margin: 4px 0;"><b>मासिक ब्याज दर:</b> 1% प्रति माह</p>
          <p style="margin: 4px 0;"><b>लोन का कारण:</b> ${reason}</p>
        </div>
        <p style="font-size: 13px; color: #64748b;">एडमिन द्वारा सत्यापन उपरांत राशि आवेदक को भेजकर ट्रांसफर स्क्रीनशॉट संलग्न किया जाएगा।</p>
      </div>
      <div style="font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px;">
        DFI लोन डेस्क • पारदर्शी सहयोग व्यवस्था
      </div>
    </div>
  `;

  // Broadcast to Admin AND ALL MEMBERS!
  await sendBroadcastEmail({
    subject,
    htmlContent,
    additionalRecipients: memberEmail ? [{ email: memberEmail, name: memberName }] : [],
  });
}

// Loan Disbursal Notification (Broadcasts to Admin & ALL MEMBERS with Transfer Screenshot)
export async function sendLoanDisbursalEmail(params: {
  memberName: string;
  memberEmail?: string;
  requestedAmount: number;
  disbursedAmount: number;
  processingFee: number;
  interestRate: number;
  utr?: string;
  paymentScreenshot?: string;
}) {
  const { memberName, memberEmail, requestedAmount, disbursedAmount, processingFee, interestRate, utr, paymentScreenshot } = params;

  const subject = `🎉 लोन स्वीकृत व राशि हस्तांतरित - ${memberName} (₹${disbursedAmount})`;
  const screenshotHtml = paymentScreenshot
    ? `<div style="margin: 18px 0; padding: 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; text-align: center;">
         <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 13px; color: #166534;">📸 एडमिन ट्रांसफर पेमेंट स्क्रीनशॉट प्रमाण:</p>
         <img src="${paymentScreenshot}" alt="Disbursal Proof" style="max-width: 100%; max-height: 420px; border-radius: 8px; border: 1px solid #bbf7d0; display: inline-block;" />
       </div>`
    : "";

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; padding: 24px;">
      <div style="background: #15803d; padding: 20px; border-radius: 10px; color: #ffffff; text-align: center;">
        <h2 style="margin: 0; font-size: 20px;">लोन डिस्बर्सल सूचना 🎉</h2>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #bbf7d0;">सभी सदस्यों एवं एडमिन को पारदर्शी सूचना</p>
      </div>
      <div style="padding: 20px 0; color: #334155;">
        <p style="font-size: 15px;">सदस्य <b>${memberName}</b> को <b>₹${requestedAmount}</b> का लोन स्वीकृत कर 5% प्रोसेसिंग शुल्क (₹${processingFee}) काटकर <b>₹${disbursedAmount}</b> की शुद्ध राशि हस्तांतरित कर दी गई है।</p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0;"><b>आवेदक सदस्य:</b> ${memberName}</p>
          <p style="margin: 4px 0;"><b>स्वीकृत लोन राशि:</b> ₹${requestedAmount}</p>
          <p style="margin: 4px 0;"><b>5% प्रोसेसिंग शुल्क:</b> ₹${processingFee}</p>
          <p style="margin: 4px 0;"><b>हस्तांतरित शुद्ध राशि:</b> <span style="font-size: 16px; font-weight: bold; color: #15803d;">₹${disbursedAmount}</span></p>
          <p style="margin: 4px 0;"><b>मासिक ब्याज:</b> ${interestRate}% प्रति माह</p>
          <p style="margin: 4px 0;"><b>ट्रांजेक्शन संदर्भ:</b> ${utr || "Direct UPI Transfer"}</p>
        </div>
        ${screenshotHtml}
      </div>
      <div style="font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px;">
        DFI वित्तीय डेस्क • पारदर्शी कम्युनिटी सेवा
      </div>
    </div>
  `;

  // Broadcast to Admin AND ALL MEMBERS with attached and embedded disbursal screenshot proof!
  await sendBroadcastEmail({
    subject,
    htmlContent,
    screenshot: paymentScreenshot,
    additionalRecipients: memberEmail ? [{ email: memberEmail, name: memberName }] : [],
  });
}

// Loan Repayment Notification (Pending, Approved, Rejected)
// Broadcasts to Admin & ALL MEMBERS with attached & embedded repayment screenshot!
export async function sendLoanRepaymentNotificationEmail(params: {
  type: "pending" | "approved" | "rejected";
  memberName: string;
  memberEmail?: string;
  amount: number;
  screenshotUrl?: string;
}) {
  const { type, memberName, memberEmail, amount, screenshotUrl } = params;

  if (type === "pending") {
    const subject = `📥 लोन अदायगी स्क्रीनशॉट - ${memberName} (₹${amount}) - [समीक्षाधीन]`;
    const screenshotHtml = screenshotUrl
      ? `<div style="margin: 18px 0; padding: 14px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; text-align: center;">
           <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 13px; color: #1e293b;">📸 लोन चुकता स्क्रीनशॉट प्रमाण:</p>
           <img src="${screenshotUrl}" alt="Repayment Proof" style="max-width: 100%; max-height: 420px; border-radius: 8px; border: 1px solid #cbd5e1; display: inline-block;" />
         </div>`
      : "";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; padding: 24px;">
        <div style="background: #0f172a; padding: 20px; border-radius: 10px; color: #ffffff; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">DFI इमरजेंसी सेवा - लोन अदायगी प्रमाण</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8;">सभी सदस्यों एवं एडमिन को सार्वजनिक सूचना</p>
        </div>
        <div style="padding: 20px 0; color: #334155;">
          <p style="font-size: 15px;">सदस्य <b>${memberName}</b> ने <b>₹${amount}</b> का लोन चुकता कर स्क्रीनशॉट अपलोड किया है।</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0;"><b>सदस्य का नाम:</b> ${memberName}</p>
            <p style="margin: 4px 0;"><b>भुगतान राशि:</b> ₹${amount}</p>
            <p style="margin: 4px 0;"><b>स्थिति:</b> <span style="color: #d97706; font-weight: bold;">लंबित समीक्षा (24 घंटे में स्वतः स्वीकृति)</span></p>
          </div>
          ${screenshotHtml}
        </div>
        <div style="font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          DFI वित्तीय डेस्क • पारदर्शी कम्युनिटी सेवा
        </div>
      </div>
    `;

    // Broadcast to Admin AND ALL MEMBERS with attached and embedded screenshot!
    await sendBroadcastEmail({
      subject,
      htmlContent,
      screenshot: screenshotUrl,
      additionalRecipients: memberEmail ? [{ email: memberEmail, name: memberName }] : [],
    });
  } else if (type === "approved") {
    const subject = `✅ लोन चुकता पुष्टिकरण (NOC) - ${memberName} (₹${amount}) लोन चुकता हुआ`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; padding: 24px;">
        <div style="background: #15803d; padding: 20px; border-radius: 10px; color: #ffffff; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">लोन चुकता पुष्टिकरण (NOC) 🎉</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #bbf7d0;">सभी सदस्यों को सार्वजनिक सूचना</p>
        </div>
        <div style="padding: 20px 0; color: #334155;">
          <p style="font-size: 15px;">सदस्य <b>${memberName}</b> की <b>₹${amount}</b> की लोन अदायगी स्वीकृत हो चुकी है और लोन खाता पूर्ण रूप से चुकता (Closed) हो गया है।</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin: 16px 0;">
            <p style="margin: 4px 0;"><b>सदस्य:</b> ${memberName}</p>
            <p style="margin: 4px 0;"><b>चुकता राशि:</b> ₹${amount}</p>
            <p style="margin: 4px 0; color: #15803d; font-weight: bold;">स्थिति: लोन पूर्णतः चुकता (Closed)</p>
          </div>
        </div>
        <div style="font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px;">
          DFI वित्तीय डेस्क • पारदर्शी कम्युनिटी सेवा
        </div>
      </div>
    `;

    // Broadcast to Admin AND ALL MEMBERS!
    await sendBroadcastEmail({
      subject,
      htmlContent,
      additionalRecipients: memberEmail ? [{ email: memberEmail, name: memberName }] : [],
    });
  }
}

// Legacy stubs for compatibility with legacy endpoints
export async function sendPaymentAlertToAll(params: any): Promise<void> {
  console.log(`[DFI Broadcast] Payment Alert:`, params);
}

export async function sendLoanRequestAlertToAll(params: any): Promise<void> {
  console.log(`[DFI Broadcast] Loan Request:`, params);
}

export async function sendLoanDisbursedAlertToAll(params: any): Promise<void> {
  console.log(`[DFI Broadcast] Loan Disbursed:`, params);
}
