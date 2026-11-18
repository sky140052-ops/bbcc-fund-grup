import { NextRequest, NextResponse } from "next/server";
import { dbFindUser, dbUpdateUser, dbInsertUser } from "../../../../../lib/astra";
import { sendOtpEmail } from "../../../../../lib/email";
import { sanitize } from "../../../../../lib/crypto";
import { getOrCreateAdmin } from "../../../../../lib/auth";
import { User } from "../../../../../lib/types";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const cleanEmail = sanitize(email).trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json({ error: "कृपया मान्य ईमेल (Gmail) पता दर्ज करें।" }, { status: 400 });
    }

    const envFounderEmail = (process.env.FOUNDER_EMAIL || "").trim().toLowerCase();
    const isAdmin = Boolean(envFounderEmail && cleanEmail === envFounderEmail);

    let user: User | null = null;
    let isRegistered = false;

    if (isAdmin) {
      user = await getOrCreateAdmin(cleanEmail);
      isRegistered = true;
    } else {
      user = await dbFindUser({ email: cleanEmail });
      isRegistered = Boolean(user && user.mobile && user.name && user.role);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    if (!user) {
      // Provisional record storing OTP so they can verify during registration
      user = {
        _id: `usr_${Date.now()}`,
        name: cleanEmail.split("@")[0],
        email: cleanEmail,
        mobile: "",
        dob: "",
        role: "client",
        aadhaar_last4: "0000",
        aadhaar_hash: "",
        pan: "",
        otp_code: otp,
        otp_expires_at: expiresAt,
        created_at: new Date().toISOString(),
      };
      await dbInsertUser(user);
    } else {
      await dbUpdateUser(user._id, {
        otp_code: otp,
        otp_expires_at: expiresAt,
      });
    }

    // Send OTP email
    await sendOtpEmail({
      toEmail: cleanEmail,
      userName: user.name || "उपयोगकर्ता",
      otp,
      purpose: "login",
    });

    return NextResponse.json({
      success: true,
      message: `ईमेल ${cleanEmail} पर 6-अंकीय OTP भेजा गया है।`,
      backup_otp: otp, // Backup OTP on screen for fast testing
      is_registered: isRegistered,
      is_admin: isAdmin,
    });
  } catch (err) {
    console.error("Send OTP error:", err);
    return NextResponse.json({ error: "OTP भेजने में त्रुटि हुई।" }, { status: 500 });
  }
}
