import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../../lib/auth";
import {
  dbGetSystemSettings,
  dbFindMembers,
  dbFindContributions,
  dbFindLoans,
  dbFindUsers,
  dbResetDatabaseForFreshLaunch,
} from "../../../../../lib/astra";
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
      { error: "अनधिकृत अनुरोध। केवल मुख्य एडमिन ही यह क्रिया कर सकते हैं।" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const inputOtp = String(body.otp || "").trim();

    if (!inputOtp || inputOtp.length !== 6) {
      return NextResponse.json(
        { error: "कृपया 6-अंकीय सत्यापन OTP दर्ज करें।" },
        { status: 400 }
      );
    }

    const settings = await dbGetSystemSettings();

    // Verify OTP and Expiration
    if (!settings.reset_otp || settings.reset_otp !== inputOtp) {
      return NextResponse.json(
        { error: "गलत OTP कोड दर्ज किया गया है। कृपया अपने ईमेल में आया सही कोड दर्ज करें।" },
        { status: 400 }
      );
    }

    if (settings.reset_otp_expires_at) {
      const expires = new Date(settings.reset_otp_expires_at).getTime();
      if (Date.now() > expires) {
        return NextResponse.json(
          { error: "यह OTP समाप्त (Expired) हो चुका है। कृपया दोबारा नया OTP प्राप्त करें।" },
          { status: 400 }
        );
      }
    }

    const founderEmail = (
      process.env.FOUNDER_EMAIL ||
      settings.brevo_sender_email ||
      session.email ||
      "sky140052@gmail.com"
    )
      .trim()
      .toLowerCase();

    // 1. Snapshot Full Data for immediate backup download
    const [members, contributions, loans, users] = await Promise.all([
      dbFindMembers(),
      dbFindContributions(),
      dbFindLoans(),
      dbFindUsers(),
    ]);

    const backupData = {
      backup_title: "DFI Emergency Seva Group - Pre-Reset Full Database Backup",
      exported_at: new Date().toISOString(),
      exported_by: {
        id: session.userId,
        name: session.name,
        email: founderEmail,
      },
      summary: {
        total_members_archived: members.length,
        total_contributions_archived: contributions.length,
        total_loans_archived: loans.length,
        total_fund_archived: contributions
          .filter((c) => c.status === "paid")
          .reduce((sum, c) => sum + (Number(c.amount) || 0), 0),
      },
      settings_preserved: {
        monthly_contribution_amount: settings.monthly_contribution_amount || 100,
        platform_fee: settings.platform_fee !== undefined ? settings.platform_fee : 3,
        admin_upi_id: settings.admin_upi_id,
        admin_upi_name: settings.admin_upi_name,
        admin_bank_name: settings.admin_bank_name,
        admin_account_number: settings.admin_account_number,
        admin_ifsc: settings.admin_ifsc,
        admin_account_holder: settings.admin_account_holder,
      },
      data: {
        members,
        contributions,
        loans,
        users,
      },
    };

    // 2. Execute Database Reset & Wipe (keeps admin user & preserves UPI/bank/fee settings)
    const resetResult = await dbResetDatabaseForFreshLaunch(founderEmail);

    // 3. Send Success Notification Email to Admin
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #d1fae5; border-radius: 16px;">
        <div style="background: #10b981; color: #ffffff; padding: 18px 24px; border-radius: 12px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold;">✅ डेटाबेस रीसेट सफल - फ्रेश पब्लिक लॉन्च</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.95;">पोर्टल 100% नए सदस्यों व लाइव लॉन्च के लिए तैयार है</p>
        </div>

        <div style="padding: 24px 8px; color: #1e293b; font-size: 14px; line-height: 1.6;">
          <p>नमस्ते <b>${session.name || "मुख्य एडमिन"}</b>,</p>
          <p>DFI पोर्टल का डेटाबेस सफलतापूर्वक फ़ॉर्मेट कर दिया गया है। पोर्टल अब एकदम नए रूप में पब्लिक लॉन्च के लिए सक्रिय है।</p>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #0f172a;">रीसेट सारांश:</p>
            <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 13px;">
              <li>साफ़ किए गए टेस्ट सदस्य: <b>${members.length}</b></li>
              <li>हटाए गए जमा ट्रांजेक्शन: <b>${contributions.length}</b></li>
              <li>हटाए गए लोन रिकॉर्ड्स: <b>${loans.length}</b></li>
              <li>कुल संचित फंड रीसेट: <b>₹0 (शून्य)</b></li>
            </ul>
          </div>

          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 14px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #065f46; font-size: 13px;">सुरक्षित रखी गई सेटिंग्स:</p>
            <p style="margin: 6px 0 0 0; color: #047857; font-size: 12px;">
              आपकी <b>Admin UPI ID (${settings.admin_upi_id})</b>, <b>QR कोड</b>, <b>बैंक विवरण</b>, <b>मासिक अंशदान (₹${settings.monthly_contribution_amount || 100})</b>, तथा <b>प्लेटफ़ॉर्म शुल्क (₹${settings.platform_fee !== undefined ? settings.platform_fee : 3})</b> पूरी तरह सुरक्षित और सक्रिय हैं।
            </p>
          </div>

          <p style="color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
            सफल रीसेट समय: ${new Date().toLocaleString("hi-IN")}
          </p>
        </div>

        <div style="text-align: center; color: #94a3b8; font-size: 11px; padding-top: 8px;">
          DFI - Digital Financial Infrastructure • ऑटोमैटिक सुरक्षा प्रमाणीकरण
        </div>
      </div>
    `;

    sendGeneralEmail({
      toEmail: founderEmail,
      toName: session.name || "मुख्य एडमिन",
      subject: "✅ DFI डेटाबेस फ़ॉर्मेट व फ्रेश लॉन्च सफल!",
      htmlContent: emailHtml,
    }).catch(console.warn);

    return NextResponse.json({
      success: true,
      message: "डेटाबेस सफलतापूर्वक फ़ॉर्मेट हो गया है! सभी टेस्ट सदस्य, जमा व लोन साफ़ हो गए हैं और आपका पोर्टल फ्रेश पब्लिक लॉन्च के लिए 100% तैयार है।",
      backup: backupData,
      reset_result: resetResult,
    });
  } catch (err: any) {
    console.error("Error confirming reset:", err);
    return NextResponse.json(
      { error: err.message || "डेटाबेस फ़ॉर्मेट करने में विफलता आई।" },
      { status: 500 }
    );
  }
}
