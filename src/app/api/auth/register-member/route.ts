import { NextRequest, NextResponse } from "next/server";
import {
  dbFindMemberByEmail,
  dbInsertMember,
  dbGetSystemSettings,
  dbCheckDuplicateMember,
} from "../../../../lib/astra";
import { sendOtpEmail, sendLoginAlertEmail } from "../../../../lib/email";
import { sanitize } from "../../../../lib/crypto";
import { signToken } from "../../../../lib/auth";
import { Member } from "../../../../lib/types";

// In-memory registration OTP cache (temporary until verified)
declare global {
  // eslint-disable-next-line no-var
  var __dfi_reg_cache: Record<string, { otp: string; expiresAt: number; data: any }> | undefined;
}
if (!global.__dfi_reg_cache) {
  global.__dfi_reg_cache = {};
}

export async function POST(req: NextRequest) {
  try {
    const settings = await dbGetSystemSettings();
    if (!settings.registration_link_active) {
      return NextResponse.json(
        { error: "सदस्य पंजीकरण लिंक वर्तमान में एडमिन द्वारा बंद (Disabled) कर दिया गया है। कृपया एडमिन से संपर्क करें।" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const action = body.action || "send_otp";
    const cleanEmail = sanitize(body.email || "").trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json({ error: "कृपया मान्य ईमेल आईडी दर्ज करें।" }, { status: 400 });
    }

    // Step 1: Send Registration OTP to Email
    if (action === "send_otp") {
      const name = sanitize(body.name || "").trim();
      const mobile = sanitize(body.mobile || "").replace(/\D/g, "");
      const aadhaar_number = sanitize(body.aadhaar_number || "").replace(/\D/g, "");
      const pan_number = sanitize(body.pan_number || "").toUpperCase().trim();

      if (!name) {
        return NextResponse.json({ error: "कृपया अपना नाम दर्ज करें।" }, { status: 400 });
      }
      if (mobile.length < 10) {
        return NextResponse.json({ error: "कृपया 10-अंकीय मोबाइल नंबर दर्ज करें।" }, { status: 400 });
      }
      if (!body.photo) {
        return NextResponse.json({ error: "कृपया अपनी लाइव फोटो (सेल्फी) अवश्य लें या अपलोड करें।" }, { status: 400 });
      }
      if (aadhaar_number.length !== 12) {
        return NextResponse.json({ error: "कृपया 12-अंकों का आधार नंबर दर्ज करें।" }, { status: 400 });
      }
      if (!body.aadhaar_file) {
        return NextResponse.json({ error: "कृपया आधार कार्ड का फोटो या पीडीएफ दस्तावेज अवश्य अपलोड करें।" }, { status: 400 });
      }
      if (!pan_number || pan_number.length < 10) {
        return NextResponse.json({ error: "कृपया 10-अंकों का वैध पैन कार्ड नंबर दर्ज करें।" }, { status: 400 });
      }
      if (!body.pan_file) {
        return NextResponse.json({ error: "कृपया पैन कार्ड का फोटो या पीडीएफ दस्तावेज अवश्य अपलोड करें।" }, { status: 400 });
      }
      const upi = sanitize(body.upi_id || "").trim();
      const acc = sanitize(body.account_number || "").trim();
      const ifsc = sanitize(body.ifsc || "").trim();
      const wallet = sanitize(body.wallet_number || "").trim();
      if (!upi && (!acc || !ifsc) && !wallet) {
        return NextResponse.json({ error: "कृपया बैंक खाता/IFSC, UPI आईडी, या वॉलेट नंबर दर्ज करें।" }, { status: 400 });
      }

      // Strictly check duplicate member across email, mobile, Aadhaar, and PAN
      const dupCheck = await dbCheckDuplicateMember({
        email: cleanEmail,
        mobile,
        aadhaar_number,
        pan_number,
      });
      if (dupCheck.isDuplicate) {
        return NextResponse.json({ error: dupCheck.message }, { status: 400 });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 10 * 60 * 1000;

      // Cache registration data temporarily
      global.__dfi_reg_cache![cleanEmail] = {
        otp,
        expiresAt,
        data: body,
      };

      // Send OTP via Brevo API
      const sendResult = await sendOtpEmail({
        toEmail: cleanEmail,
        userName: name,
        otp,
        purpose: "login",
      });

      if (!sendResult.success) {
        return NextResponse.json(
          {
            error:
              sendResult.error ||
              "ईमेल पर OTP भेजने में विफल। कृपया एडमिन पोर्टल में Brevo API Key या ईमेल सेवा कॉन्फ़िगर करें।",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `ईमेल ${cleanEmail} पर 6-अंकीय सत्यापन OTP भेज दिया गया है। कृपया अपना ईमेल चेक करें।`,
      });
    }

    // Step 2: Verify OTP and Register New Member
    if (action === "verify_register") {
      const otpCode = sanitize(body.otp || "").trim();
      const cached = global.__dfi_reg_cache![cleanEmail];

      if (!cached) {
        return NextResponse.json(
          { error: "सत्र समाप्त हो चुका है। कृपया पुनः विवरण भरकर OTP भेजें।" },
          { status: 400 }
        );
      }

      if (Date.now() > cached.expiresAt) {
        delete global.__dfi_reg_cache![cleanEmail];
        return NextResponse.json({ error: "OTP की समय सीमा समाप्त हो गई है। कृपया नया OTP प्राप्त करें।" }, { status: 400 });
      }

      if (cached.otp !== otpCode) {
        return NextResponse.json({ error: "अमान्य OTP! कृपया ईमेल पर आया सही कोड दर्ज करें।" }, { status: 400 });
      }

      const data = cached.data;
      const name = sanitize(data.name || "").trim();
      const mobile = sanitize(data.mobile || "").replace(/\D/g, "");
      const aadhaar_number = sanitize(data.aadhaar_number || "").replace(/\D/g, "");
      const pan_number = sanitize(data.pan_number || "").toUpperCase().trim();

      // Final duplicate check before database insertion
      const dupCheck = await dbCheckDuplicateMember({
        email: cleanEmail,
        mobile,
        aadhaar_number,
        pan_number,
      });
      if (dupCheck.isDuplicate) {
        delete global.__dfi_reg_cache![cleanEmail];
        return NextResponse.json({ error: dupCheck.message }, { status: 400 });
      }

      const newMember: Member = {
        _id: `dfi_mem_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name,
        email: cleanEmail,
        mobile,
        photo: data.photo || "",
        aadhaar_number,
        aadhaar_file: data.aadhaar_file || "",
        aadhaar_file_type: data.aadhaar_file_type || (data.aadhaar_file?.includes("application/pdf") ? "pdf" : "image"),
        aadhaar_file_name: data.aadhaar_file_name || "aadhaar_doc",
        pan_number,
        pan_file: data.pan_file || "",
        pan_file_type: data.pan_file_type || (data.pan_file?.includes("application/pdf") ? "pdf" : "image"),
        pan_file_name: data.pan_file_name || "pan_doc",
        upi_id: sanitize(data.upi_id || "").trim(),
        account_number: sanitize(data.account_number || "").trim(),
        ifsc: sanitize(data.ifsc || "").toUpperCase().trim(),
        bank_name: sanitize(data.bank_name || "").trim(),
        wallet_number: sanitize(data.wallet_number || "").replace(/\D/g, ""),
        created_at: new Date().toISOString(),
      };

      await dbInsertMember(newMember);
      delete global.__dfi_reg_cache![cleanEmail];

      // Create session token (30 days)
      const token = signToken(
        {
          userId: newMember._id,
          name: newMember.name,
          email: newMember.email,
          role: "member",
          mobile: newMember.mobile,
          aadhaar: newMember.aadhaar_number?.slice(-4),
        },
        true
      );

      // Trigger Login Alert Email
      sendLoginAlertEmail({
        toEmail: newMember.email,
        userName: newMember.name,
        role: "member",
      }).catch((e) => console.warn("Login alert failed:", e));

      const response = NextResponse.json({
        success: true,
        message: `बधाई हो ${name}! आप DFI इमरजेंसी सेवा ग्रुप में सफलतापूर्वक जुड़ गए हैं।`,
        redirectTo: "/dashboard",
      });

      const THIRTY_DAYS_SEC = 30 * 24 * 60 * 60;
      response.cookies.set("bbcc_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: THIRTY_DAYS_SEC,
        expires: new Date(Date.now() + THIRTY_DAYS_SEC * 1000),
        path: "/",
      });

      return response;
    }

    return NextResponse.json({ error: "अमान्य एक्शन।" }, { status: 400 });
  } catch (err: any) {
    console.error("Register member error:", err);
    return NextResponse.json({ error: "पंजीकरण में त्रुटि।" }, { status: 500 });
  }
}
