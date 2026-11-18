import { NextRequest, NextResponse } from "next/server";
import { verifyUserOtp, signToken } from "../../../../../lib/auth";
import { sendLoginAlertEmail } from "../../../../../lib/email";
import { sanitize } from "../../../../../lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, remember_me } = await req.json();

    const cleanEmail = sanitize(email).trim().toLowerCase();
    const cleanOtp = sanitize(otp).trim();

    if (!cleanEmail || !cleanOtp) {
      return NextResponse.json({ error: "कृपया ईमेल और OTP दोनों दर्ज करें।" }, { status: 400 });
    }

    const user = await verifyUserOtp(cleanEmail, cleanOtp);

    if (!user) {
      return NextResponse.json(
        { error: "अमान्य या समय समाप्त (Expired) OTP! कृपया पुनः OTP भेजें।" },
        { status: 401 }
      );
    }

    const isRememberMe = remember_me !== false;
    const maxAgeSeconds = isRememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days default

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

    // Send Login Notification Email immediately
    sendLoginAlertEmail({
      toEmail: user.email,
      userName: user.name,
      role: user.role,
    }).catch((err) => console.warn("Login alert send failed:", err));

    const isFounder = user.role === "founder" || user.role === "admin";
    const redirectTo = isFounder ? "/admin" : "/dashboard";

    const response = NextResponse.json({
      success: true,
      message: isFounder ? "👑 मुख्य एडमिन लॉगिन सफल!" : "लॉगिन सफल रहा!",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
      },
      redirectTo,
    });

    response.cookies.set("bbcc_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: maxAgeSeconds,
    });

    return response;
  } catch (err) {
    console.error("OTP verification error:", err);
    return NextResponse.json({ error: "OTP सत्यापन में त्रुटि हुई।" }, { status: 500 });
  }
}
