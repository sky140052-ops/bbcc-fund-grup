import nodemailer from "nodemailer";
import { Resend } from "resend";

interface SendOtpOptions {
  toEmail: string;
  userName: string;
  otp: string;
  purpose: "password_reset" | "login";
}

interface SendLoginAlertOptions {
  toEmail: string;
  userName: string;
  loginTime?: string;
  role?: string;
}

export async function sendOtpEmail({
  toEmail,
  userName,
  otp,
  purpose,
}: SendOtpOptions): Promise<{ success: boolean; provider: string; error?: string; otp: string }> {
  const subject =
    purpose === "password_reset"
      ? "🔐 BBCC Fund - पासवर्ड रीसेट हेतु OTP"
      : "🔐 BBCC Fund - लॉगिन सत्यापन OTP";

  const purposeText =
    purpose === "password_reset"
      ? "आपके खाते का पासवर्ड रीसेट करने के लिए यह OTP भेजा गया है:"
      : "आपके खाते में सुरक्षित लॉगिन करने के लिए 6-अंकीय OTP:";

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

  // 1. Try Resend API
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
        return { success: true, provider: "resend", otp };
      }
    } catch (err: any) {
      console.warn("Resend email failed:", err?.message);
    }
  }

  // 2. Try Gmail SMTP / Nodemailer
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
        from: `"BBCC Fund Grup" <${smtpEmail}>`,
        to: toEmail,
        subject,
        html: htmlContent,
      });

      return { success: true, provider: "gmail_smtp", otp };
    } catch (err: any) {
      console.warn("SMTP email failed:", err?.message);
    }
  }

  // 3. Fallback: Log to console
  console.log("==========================================");
  console.log(`[BBCC OTP NOTIFICATION] To: ${toEmail} | OTP: ${otp} | Purpose: ${purpose}`);
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
  const subject = "🔔 BBCC Fund - आपके खाते में नया लॉगिन अलर्ट";

  const roleText =
    role === "founder" || role === "admin"
      ? "👑 मुख्य एडमिन"
      : "👤 सदस्य / क्लाइंट";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 20px; }
          .card { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
          .body { padding: 28px 24px; color: #1e293b; }
          .info-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 16px 0; }
          .footer { background: #f1f5f9; padding: 16px; font-size: 12px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h2 style="margin: 0; font-size: 20px;">🏛️ BBCC FUND GRUP</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">सुरक्षा सूचना प्रणाली</p>
          </div>
          <div class="body">
            <h3 style="margin: 0 0 8px 0;">नमस्ते, ${userName}</h3>
            <p style="color: #475569; font-size: 14px; margin: 0 0 12px 0;">
              आपके BBCC Fund खाते में अभी-अभी सफलतापूर्वक लॉगिन किया गया है।
            </p>
            <div class="info-box">
              <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>समय:</strong> ${loginTime}</p>
              <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>खाता प्रकार:</strong> ${roleText}</p>
              <p style="margin: 0; font-size: 13px;"><strong>ईमेल:</strong> ${toEmail}</p>
            </div>
            <p style="font-size: 12px; color: #64748b; margin: 0;">
              यदि यह लॉगिन आपने नहीं किया है, तो कृपया तुरंत मुख्य एडमिन से संपर्क करें।
            </p>
          </div>
          <div class="footer">
            सुरक्षित एवं पारदर्शी बचत समूह • © 2026 BBCC Fund Grup.
          </div>
        </div>
      </body>
    </html>
  `;

  // Try Resend
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

      if (!res.error) {
        return { success: true, provider: "resend" };
      }
    } catch (err: any) {
      console.warn("Resend login alert error:", err?.message);
    }
  }

  // Try SMTP
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;
  if (smtpEmail && smtpPassword && !smtpEmail.includes("placeholder")) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: smtpEmail, pass: smtpPassword },
      });
      await transporter.sendMail({
        from: `"BBCC Fund Grup" <${smtpEmail}>`,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      return { success: true, provider: "gmail_smtp" };
    } catch (err: any) {
      console.warn("SMTP login alert error:", err?.message);
    }
  }

  console.log(`[BBCC LOGIN ALERT] To: ${toEmail} at ${loginTime}`);
  return { success: true, provider: "console_fallback" };
}

// Helper: Broadcast email to multiple recipients
export async function sendNotificationToRecipients(
  toEmails: string[],
  subject: string,
  title: string,
  bodyHtml: string
): Promise<void> {
  const cleanEmails = Array.from(new Set(toEmails.filter((e) => e && e.includes("@"))));
  if (cleanEmails.length === 0) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 20px; }
          .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
          .body { padding: 28px 24px; color: #1e293b; line-height: 1.6; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; }
          .footer { background: #f1f5f9; padding: 16px; font-size: 12px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h2 style="margin: 0; font-size: 20px;">🏛️ BBCC GROUP FUND</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">${title}</p>
          </div>
          <div class="body">
            ${bodyHtml}
          </div>
          <div class="footer">
            BBCC Group Fund • 100% पारदर्शी बचत एवं पारस्परिक सहायता
          </div>
        </div>
      </body>
    </html>
  `;

  for (const email of cleanEmails) {
    try {
      if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("placeholder")) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "BBCC Fund <onboarding@resend.dev>",
          to: email,
          subject,
          html: htmlContent,
        });
      } else if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
        });
        await transporter.sendMail({
          from: `"BBCC Fund" <${process.env.SMTP_EMAIL}>`,
          to: email,
          subject,
          html: htmlContent,
        });
      } else {
        console.log(`[BBCC NOTIFICATION] To: ${email} | Subject: ${subject}`);
      }
    } catch (err: any) {
      console.warn(`Failed sending email to ${email}:`, err?.message);
    }
  }
}

// 1. Payment deposit alert broadcast
export async function sendPaymentAlertToAll(params: {
  groupName: string;
  payerName: string;
  amount: number;
  paymentDate: string;
  recipientEmails: string[];
}) {
  const subject = `📢 BBCC Fund - ₹${params.amount} अंशदान जमा (${params.payerName})`;
  const bodyHtml = `
    <h3 style="margin-top: 0; color: #0284c7;">✅ मासिक अंशदान जमा हुआ</h3>
    <p>ग्रुप <strong>${params.groupName}</strong> के सदस्य <strong>${params.payerName}</strong> ने अपना मासिक अंशदान सफलतापूर्वक जमा कर दिया है:</p>
    <div class="box">
      <p style="margin: 0 0 8px 0;"><strong>जमाकर्ता:</strong> ${params.payerName}</p>
      <p style="margin: 0 0 8px 0;"><strong>राशि:</strong> ₹${params.amount.toLocaleString()}</p>
      <p style="margin: 0 0 8px 0;"><strong>ग्रुप:</strong> ${params.groupName}</p>
      <p style="margin: 0;"><strong>तारीख:</strong> ${params.paymentDate}</p>
    </div>
    <p style="font-size: 13px; color: #64748b;">यह पारदर्शी सूचना ग्रुप के सभी सदस्यों और एडमिन को भेजी गई है।</p>
  `;
  return sendNotificationToRecipients(params.recipientEmails, subject, "मासिक अंशदान सूचना", bodyHtml);
}

// 2. Loan request voting alert broadcast
export async function sendLoanRequestAlertToAll(params: {
  groupName: string;
  applicantName: string;
  amount: number;
  reason: string;
  repayDate: string;
  recipientEmails: string[];
}) {
  const subject = `🗳️ BBCC Fund - नया लोन आवेदन व वोटिंग (${params.applicantName})`;
  const bodyHtml = `
    <h3 style="margin-top: 0; color: #9333ea;">🗳️ नए लोन हेतु वोटिंग शुरू</h3>
    <p>ग्रुप <strong>${params.groupName}</strong> के सदस्य <strong>${params.applicantName}</strong> ने फंड से लोन हेतु आवेदन किया है:</p>
    <div class="box">
      <p style="margin: 0 0 8px 0;"><strong>आवेदक:</strong> ${params.applicantName}</p>
      <p style="margin: 0 0 8px 0;"><strong>मांग राशि:</strong> ₹${params.amount.toLocaleString()}</p>
      <p style="margin: 0 0 8px 0;"><strong>कारण:</strong> ${params.reason}</p>
      <p style="margin: 0;"><strong>लौटाने की तारीख:</strong> ${params.repayDate}</p>
    </div>
    <p style="font-weight: bold; color: #1e293b;">कृपया अपने डैशबोर्ड पर लॉगिन कर ज़रूरतमंद सदस्य को अपना वोट दें!</p>
  `;
  return sendNotificationToRecipients(params.recipientEmails, subject, "लोन आवेदन एवं वोटिंग", bodyHtml);
}

// 3. Loan disbursal confirmation broadcast with screenshot
export async function sendLoanDisbursedAlertToAll(params: {
  groupName: string;
  applicantName: string;
  netAmount: number;
  utr: string;
  screenshotUrl: string;
  recipientEmails: string[];
}) {
  const subject = `💸 BBCC Fund - लोन भुगतान प्रमाण सूचना (${params.applicantName})`;
  const bodyHtml = `
    <h3 style="margin-top: 0; color: #16a34a;">💸 लोन भुगतान सफलतापूर्वक पूर्ण हुआ</h3>
    <p>एडमिन द्वारा <strong>${params.applicantName}</strong> को स्वीकृत लोन राशि सफलतापूर्वक बैंक/UPI खाते में ट्रांसफर कर दी गई है:</p>
    <div class="box">
      <p style="margin: 0 0 8px 0;"><strong>प्राप्तकर्ता:</strong> ${params.applicantName}</p>
      <p style="margin: 0 0 8px 0;"><strong>भुगतान राशि:</strong> ₹${params.netAmount.toLocaleString()}</p>
      <p style="margin: 0 0 8px 0;"><strong>ग्रुप:</strong> ${params.groupName}</p>
      <p style="margin: 0;"><strong>बैंक UTR / ट्रांजैक्शन ID:</strong> ${params.utr}</p>
    </div>
    ${
      params.screenshotUrl
        ? `<div style="text-align: center; margin: 20px 0;">
            <p style="font-size: 13px; font-weight: bold; color: #475569; margin-bottom: 8px;">पेमेंट स्क्रीनशॉट प्रमाण:</p>
            <img src="${params.screenshotUrl}" alt="Payment Proof" style="max-width: 100%; border-radius: 12px; border: 1px solid #cbd5e1;" />
          </div>`
        : ""
    }
    <p style="font-size: 13px; color: #64748b;">यह पारदर्शी सूचना ग्रुप के सभी सदस्यों और एडमिन को भेजी गई है।</p>
  `;
  return sendNotificationToRecipients(params.recipientEmails, subject, "लोन भुगतान प्रमाण", bodyHtml);
}
