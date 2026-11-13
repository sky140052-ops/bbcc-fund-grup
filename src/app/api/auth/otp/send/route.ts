import { NextRequest, NextResponse } from "next/server";
import { dbFindUser, dbUpdateUser } from "../../../../../lib/astra";
import { sendOtpEmail } from "../../../../../lib/email";
import { sanitize } from "../../../../../lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const cleanEmail = sanitize(email).trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json({ error: "कृपया मान्य ईमेल (Gmail) पता दर्ज करें।" }, { status: 400 });
    }

    const user = await dbFindUser({ email: cleanEmail });

    if (!user) {
      return NextResponse.json(
        { error: "यह ईमेल पंजीकृत नहीं है। कृपया एडमिन से संपर्क करें या सही ईमेल दर्ज करें।" },
        { status: 404 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await dbUpdateUser(user._id, {
      otp_code: otp,
      otp_expires_at: expiresAt,
    });

    await sendOtpEmail({
      toEmail: user.email,
      userName: user.name,
      otp,
      purpose: "login",
    });

    return NextResponse.json({
      success: true,
      message: `6-अंकीय OTP आपके ईमेल (${cleanEmail}) पर भेज दिया गया है।`,
    });
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json({ error: "OTP भेजने में त्रुटि हुई।" }, { status: 500 });
  }
}
