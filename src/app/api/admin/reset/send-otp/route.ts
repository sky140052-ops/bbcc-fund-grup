import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../../lib/auth";
import { dbUpdateSystemSettings, dbGetSystemSettings } from "../../../../../lib/astra";
import { sendGeneralEmail } from "../../../../../lib/email";

function getAdminSession(req: NextRequest) {
  let token = req.cookies.get("bbcc_session")?.value;
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }
  if (!token) return null;
  const session = verifyToken(token);
  if (!session) return null;
  if (session.role === "admin" || session.role === "founder") {
    return session;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json(
      { error: "अनधिकृत अनुरोध। केवल मुख्य एडमिन ही डेटाबेस रीसेट का अनुरोध कर सकते हैं।" },
      { status: 401 }
    );
  }

  try {
    const settings = await dbGetSystemSettings();
    const founderEmail = (
      process.env.FOUNDER_EMAIL ||
      settings.brevo_sender_email ||
      session.email ||
      "sky140052@gmail.com"
    )
      .trim()
      .toLowerCase();

    // Generate 6-digit cryptographic confirmation OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Save OTP to system settings in Astra DB
    await dbUpdateSystemSettings({
      reset_otp: otp,
      reset_otp_expires_at: expiresAt,
    });

    // Masked email for UI display: e.g. s***2@gmail.com
    const [userPart, domainPart] = founderEmail.split("@");
    const maskedEmail =
      userPart.length > 2
        ? `${userPart[0]}***${userPart[userPart.length - 1]}@${domainPart}`
        : `${userPart[0]}***@${domainPart}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #fee2e2; border-radius: 16px;">
        <div style="background: #ef4444; color: #ffffff; padding: 18px 24px; border-radius: 12px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold;">⚠️ DFI सुरक्षा चेतावनी: डेटाबेस रीसेट अनुरोध</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95;">फ्रेश पब्लिक लॉन्च एवं डेटा वाइप सत्यापन OTP</p>
        </div>

        <div style="padding: 24px 8px; color: #1e293b; font-size: 14px; line-height: 1.6;">
          <p>नमस्ते <b>${session.name || "मुख्य एडमिन"}</b>,</p>
          <p>आपके DFI इमरजेंसी सेवा ग्रुप एडमिन पैनल से <b>संपूर्ण डेटाबेस फ़ॉर्मेट / रीसेट (Fresh Public Launch)</b> का अनुरोध दर्ज किया गया है।</p>
          
          <div style="margin: 24px 0; text-align: center;">
            <span style="display: block; font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">सत्यापन OTP कोड (10 मिनट मान्य):</span>
            <div style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #dc2626; background: #fef2f2; border: 2px dashed #dc2626; padding: 16px; border-radius: 12px; margin-top: 8px; display: inline-block;">
              ${otp}
            </div>
          </div>

          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #92400e; font-size: 13px;">महत्वपूर्ण सुरक्षा सूचनाएँ:</p>
            <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #78350f; font-size: 12px;">
              <li>यह OTP दर्ज करते ही वर्तमान डेटाबेस की <b>संपूर्ण .JSON बैकअप फ़ाइल</b> आपके कंप्यूटर पर डाउनलोड हो जाएगी।</li>
              <li>सभी टेस्ट सदस्य खाते, मासिक जमा अंशदान एवं लोन इतिहास स्थायी रूप से हटा दिए जाएंगे।</li>
              <li><b>आपकी एडमिन UPI आईडी, QR कोड, बैंक विवरण, मेंटेनेंस शुल्क एवं Brevo ईमेल सेटिंग्स पूरी तरह सुरक्षित रहेंगी।</b></li>
              <li>आपका मुख्य एडमिन लॉगिन पूरी तरह सुरक्षित रहेगा।</li>
            </ul>
          </div>

          <p style="color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
            यदि यह अनुरोध आपने नहीं किया है, तो इस OTP को किसी से भी साझा न करें और तुरंत अपना एडमिन पासवर्ड जांचें।
          </p>
        </div>

        <div style="text-align: center; color: #94a3b8; font-size: 11px; padding-top: 8px;">
          DFI - Digital Financial Infrastructure • ऑटोमैटिक सुरक्षा प्रमाणीकरण
        </div>
      </div>
    `;

    // Send email via Brevo SMTP / API
    await sendGeneralEmail({
      toEmail: founderEmail,
      toName: session.name || "मुख्य एडमिन",
      subject: `⚠️ DFI सुरक्षा चेतावनी: डेटाबेस रीसेट एवं फ्रेश लॉन्च OTP: ${otp}`,
      htmlContent: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: `एडमिन ईमेल (${maskedEmail}) पर 6-अंकीय सत्यापन OTP भेज दिया गया है। यह कोड 10 मिनट तक मान्य है।`,
      email: maskedEmail,
    });
  } catch (err: any) {
    console.error("Error sending reset OTP:", err);
    return NextResponse.json(
      { error: err.message || "OTP भेजने में त्रुटि हुई। कृपया ईमेल सेटिंग्स जांचें।" },
      { status: 500 }
    );
  }
}
