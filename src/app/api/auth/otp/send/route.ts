import { NextRequest, NextResponse } from "next/server";
import {
  dbFindUser,
  dbUpdateUser,
  dbInsertUser,
  dbFindMemberByEmail,
  dbUpdateMember,
} from "../../../../../lib/astra";
import { sendOtpEmail } from "../../../../../lib/email";
import { sanitize } from "../../../../../lib/crypto";
import { getOrCreateAdmin } from "../../../../../lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const cleanEmail = sanitize(email).trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json({ error: "कृपया मान्य ईमेल (Gmail) पता दर्ज करें।" }, { status: 400 });
    }

    const envFounderEmail = (process.env.FOUNDER_EMAIL || "sky140052@gmail.com").trim().toLowerCase();
    const isAdmin = Boolean(envFounderEmail && cleanEmail === envFounderEmail);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    let userName = "उपयोगकर्ता";
    let isMember = false;

    if (isAdmin) {
      const admin = await getOrCreateAdmin(cleanEmail);
      userName = admin.name || "मुख्य एडमिन";
      await dbUpdateUser(admin._id, { otp_code: otp, otp_expires_at: expiresAt });
    } else {
      // Check if registered Member
      const member = await dbFindMemberByEmail(cleanEmail);
      if (member) {
        userName = member.name;
        isMember = true;
        await dbUpdateMember(member._id, { otp_code: otp, otp_expires_at: expiresAt });
      } else {
        // Not in database! Strictly reject with invalid email error
        return NextResponse.json(
          {
            error: "अमान्य ईमेल आईडी! यह ईमेल आईडी डेटाबेस में पंजीकृत नहीं है। कृपया पंजीकृत ईमेल दर्ज करें या पहले सदस्य पंजीकरण फॉर्म भरें।",
          },
          { status: 404 }
        );
      }
    }

    // Send OTP email (Brevo API prioritized)
    const sendResult = await sendOtpEmail({
      toEmail: cleanEmail,
      userName,
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
      message: `ईमेल ${cleanEmail} पर 6-अंकीय OTP भेज दिया गया है। कृपया अपना ईमेल चेक करें।`,
      is_admin: isAdmin,
      is_member: isMember,
    });
  } catch (err) {
    console.error("Send OTP error:", err);
    return NextResponse.json({ error: "OTP भेजने में त्रुटि हुई।" }, { status: 500 });
  }
}
