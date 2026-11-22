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

    const sessionPayload = await verifyUserOtp(cleanEmail, cleanOtp);

    if (!sessionPayload) {
      return NextResponse.json(
        { error: "अमान्य या समय समाप्त (Expired) OTP! कृपया पुनः OTP भेजें।" },
        { status: 401 }
      );
    }

    const isRememberMe = remember_me !== false;
    const maxAgeSeconds = isRememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days default

    const token = signToken(sessionPayload, isRememberMe);

    // Send Login Notification Email
    sendLoginAlertEmail({
      toEmail: sessionPayload.email,
      userName: sessionPayload.name,
      role: sessionPayload.role,
    }).catch((err) => console.warn("Login alert send failed:", err));

    const isAdmin = sessionPayload.role === "admin" || sessionPayload.role === "founder";
    const redirectTo = isAdmin ? "/admin" : "/dashboard";

    const response = NextResponse.json({
      success: true,
      message: isAdmin ? "👑 मुख्य एडमिन लॉगिन सफल!" : "👤 सदस्य लॉगिन सफल रहा!",
      user: sessionPayload,
      redirectTo,
    });

    response.cookies.set("bbcc_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: maxAgeSeconds,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Verify OTP error:", err);
    return NextResponse.json({ error: "सत्यापन प्रक्रिया में त्रुटि।" }, { status: 500 });
  }
}
