import { NextRequest, NextResponse } from "next/server";
import { verifyUserOtp, signToken } from "../../../../../lib/auth";
import { sendLoginAlertEmail } from "../../../../../lib/email";
import { sanitize } from "../../../../../lib/crypto";
import { dbInsertMember } from "../../../../../lib/astra";
import { Member, SessionPayload } from "../../../../../lib/types";

// Permanent 10-year session so mobile app and web NEVER auto logout
const PERMANENT_SESSION_SEC = 10 * 365 * 24 * 60 * 60; // 10 years (315,360,000s)

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    const cleanEmail = sanitize(email || "").trim().toLowerCase();
    const cleanOtp = sanitize(otp || "").trim();

    if (!cleanEmail || !cleanOtp) {
      return NextResponse.json({ error: "कृपया ईमेल और OTP दोनों दर्ज करें।" }, { status: 400 });
    }

    // 1. Check if user is a pending new registration in cache
    const cachedReg = global.__dfi_reg_cache?.[cleanEmail];
    if (cachedReg && cachedReg.otp === cleanOtp) {
      if (Date.now() > cachedReg.expiresAt) {
        delete global.__dfi_reg_cache![cleanEmail];
        return NextResponse.json({ error: "OTP की समय सीमा समाप्त हो गई है। कृपया पुनः नया OTP प्राप्त करें।" }, { status: 400 });
      }

      const regData = cachedReg.data;
      const newMember: Member = {
        _id: `dfi_mem_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: regData.name,
        email: cleanEmail,
        mobile: regData.mobile,
        photo: regData.photo || "",
        aadhaar_number: regData.aadhaar_number || "",
        pan_number: regData.pan_number || "",
        created_at: new Date().toISOString(),
      };

      await dbInsertMember(newMember);
      delete global.__dfi_reg_cache![cleanEmail];

      const sessionPayload: SessionPayload = {
        userId: newMember._id,
        name: newMember.name,
        email: newMember.email,
        role: "member",
        mobile: newMember.mobile,
        aadhaar: newMember.aadhaar_number?.slice(-4),
      };

      const token = signToken(sessionPayload, true);

      // Send Welcome / Login notification
      sendLoginAlertEmail({
        toEmail: newMember.email,
        userName: newMember.name,
        role: "member",
      }).catch((err) => console.warn("Login alert send failed:", err));

      const response = NextResponse.json({
        success: true,
        message: `बधाई हो ${newMember.name}! आपका पंजीकरण और लॉगिन सफल रहा।`,
        user: sessionPayload,
        token,
        redirectTo: "/dashboard",
      });

      response.cookies.set("bbcc_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: PERMANENT_SESSION_SEC,
        expires: new Date(Date.now() + PERMANENT_SESSION_SEC * 1000),
        path: "/",
      });

      return response;
    }

    // 2. Existing user verification
    const sessionPayload = await verifyUserOtp(cleanEmail, cleanOtp);

    if (!sessionPayload) {
      return NextResponse.json(
        { error: "अमान्य या समय समाप्त (Expired) OTP! कृपया पुनः OTP भेजें।" },
        { status: 401 }
      );
    }

    const token = signToken(sessionPayload, true);

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
      token,
      redirectTo,
    });

    response.cookies.set("bbcc_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: PERMANENT_SESSION_SEC,
      expires: new Date(Date.now() + PERMANENT_SESSION_SEC * 1000),
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Verify OTP error:", err);
    return NextResponse.json({ error: "सत्यापन प्रक्रिया में त्रुटि।" }, { status: 500 });
  }
}
