import { NextRequest, NextResponse } from "next/server";
import { dbFindUser, dbUpdateUser } from "../../../../../lib/astra";
import { signToken } from "../../../../../lib/auth";
import { sanitize } from "../../../../../lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, remember_me } = await req.json();

    const cleanEmail = sanitize(email).trim().toLowerCase();
    const cleanOtp = sanitize(otp).trim();

    if (!cleanEmail || !cleanOtp) {
      return NextResponse.json({ error: "कृपया ईमेल और OTP दोनों दर्ज करें।" }, { status: 400 });
    }

    const user = await dbFindUser({ email: cleanEmail });

    if (!user) {
      return NextResponse.json({ error: "उपयोगकर्ता नहीं मिला।" }, { status: 404 });
    }

    if (!user.otp_code || user.otp_code !== cleanOtp) {
      return NextResponse.json({ error: "गलत OTP कोड! कृपया ईमेल में आया सही कोड दर्ज करें।" }, { status: 400 });
    }

    if (user.otp_expires_at && new Date() > new Date(user.otp_expires_at)) {
      return NextResponse.json({ error: "यह OTP समाप्त (Expired) हो चुका है।" }, { status: 400 });
    }

    // Clear used OTP
    await dbUpdateUser(user._id, {
      otp_code: undefined,
      otp_expires_at: undefined,
    });

    const isRememberMe = Boolean(remember_me);
    const maxAgeSeconds = isRememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days

    const token = signToken(
      {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        aadhaar: user.aadhaar_last4,
      },
      isRememberMe
    );

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        aadhaar_last4: user.aadhaar_last4,
      },
      redirectTo: user.role === "member" ? "/dashboard" : "/admin",
      message: isRememberMe ? "लॉगिन सफल (30 दिनों तक याद रखा जाएगा)" : "लॉगिन सफल",
    });

    response.cookies.set("bbcc_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: maxAgeSeconds,
    });

    return response;
  } catch (error) {
    console.error("OTP login verify error:", error);
    return NextResponse.json({ error: "सत्यापन में त्रुटि हुई।" }, { status: 500 });
  }
}
