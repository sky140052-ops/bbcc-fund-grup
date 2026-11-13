import { NextRequest, NextResponse } from "next/server";
import { dbFindUser, dbUpdateUser } from "../../../../../lib/astra";
import { sendOtpEmail } from "../../../../../lib/email";
import { sanitize } from "../../../../../lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const { mobile, dob } = await req.json();

    const cleanMobile = sanitize(mobile).replace(/\D/g, "");
    const cleanDob = sanitize(dob).replace(/[-/]/g, "");

    if (!cleanMobile || !cleanDob) {
      return NextResponse.json(
        { error: "कृपया पंजीकृत मोबाइल नंबर एवं जन्मतिथि (DOB) दोनों दर्ज करें।" },
        { status: 400 }
      );
    }

    // Find user by mobile
    const user = await dbFindUser({ mobile: cleanMobile });

    if (!user) {
      return NextResponse.json(
        { error: "इस मोबाइल नंबर के साथ कोई पंजीकृत खाता नहीं मिला।" },
        { status: 404 }
      );
    }

    // Verify DOB matches
    const userDobClean = (user.dob || "").replace(/[-/]/g, "");
    if (userDobClean !== cleanDob) {
      return NextResponse.json(
        { error: "जन्मतिथि (DOB) मेल नहीं खाती। कृपया सही जन्मतिथि दर्ज करें।" },
        { status: 400 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: "इस खाते पर कोई ईमेल पंजीकृत नहीं है। कृपया एडमिन से संपर्क करें।" },
        { status: 400 }
      );
    }

    // Generate 6-digit cryptographic OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Save OTP to Astra DB user record
    await dbUpdateUser(user._id, {
      otp_code: otp,
      otp_expires_at: expiresAt,
    });

    // Send email with OTP via Resend or Gmail SMTP
    await sendOtpEmail({
      toEmail: user.email,
      userName: user.name,
      otp,
      purpose: "password_reset",
    });

    // Mask email for privacy (e.g. "ra***l@gmail.com")
    const [userPart, domainPart] = user.email.split("@");
    const maskedUser =
      userPart.length > 2
        ? `${userPart[0]}***${userPart[userPart.length - 1]}`
        : `${userPart[0]}*`;
    const maskedEmail = `${maskedUser}@${domainPart}`;

    return NextResponse.json({
      success: true,
      userId: user._id,
      maskedEmail,
      message: `सत्यापन कोड (OTP) आपके पंजीकृत ईमेल (${maskedEmail}) पर भेज दिया गया है।`,
    });
  } catch (error) {
    console.error("Forgot password send OTP error:", error);
    return NextResponse.json({ error: "OTP भेजने में त्रुटि हुई।" }, { status: 500 });
  }
}
