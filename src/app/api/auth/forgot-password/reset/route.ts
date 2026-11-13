import { NextRequest, NextResponse } from "next/server";
import { dbFindUser, dbUpdateUser } from "../../../../../lib/astra";
import { hashPassword, sanitize } from "../../../../../lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const { userId, otp, newPassword } = await req.json();

    const cleanOtp = sanitize(otp).trim();
    const cleanPassword = sanitize(newPassword).trim();

    if (!userId || !cleanOtp || !cleanPassword) {
      return NextResponse.json(
        { error: "कृपया OTP और नया पासवर्ड दोनों दर्ज करें।" },
        { status: 400 }
      );
    }

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { error: "नया पासवर्ड कम से कम 6 अक्षरों का होना आवश्यक है।" },
        { status: 400 }
      );
    }

    const user = await dbFindUser({ _id: userId });

    if (!user) {
      return NextResponse.json({ error: "उपयोगकर्ता नहीं मिला।" }, { status: 404 });
    }

    if (!user.otp_code || user.otp_code !== cleanOtp) {
      return NextResponse.json({ error: "गलत OTP कोड! कृपया ईमेल में आया सही कोड दर्ज करें।" }, { status: 400 });
    }

    if (user.otp_expires_at && new Date() > new Date(user.otp_expires_at)) {
      return NextResponse.json(
        { error: "यह OTP समाप्त (Expired) हो चुका है। कृपया नया OTP मंगाएं।" },
        { status: 400 }
      );
    }

    // Hash new custom password using bcrypt
    const hashedPassword = await hashPassword(cleanPassword);

    await dbUpdateUser(user._id, {
      password_hash: hashedPassword,
      otp_code: undefined,
      otp_expires_at: undefined,
    });

    return NextResponse.json({
      success: true,
      message: "नया पासवर्ड सफलतापूर्वक बन गया! अब आप अपने ईमेल और नए पासवर्ड से लॉगिन कर सकते हैं।",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: "पासवर्ड रीसेट करने में समस्या आई।" }, { status: 500 });
  }
}
