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
      // Check if Member
      const member = await dbFindMemberByEmail(cleanEmail);
      if (member) {
        userName = member.name;
        isMember = true;
        await dbUpdateMember(member._id, { otp_code: otp, otp_expires_at: expiresAt });
      } else {
        // Provisional user record for quick testing
        let user = await dbFindUser({ email: cleanEmail });
        if (!user) {
          user = {
            _id: `usr_${Date.now()}`,
            name: cleanEmail.split("@")[0],
            email: cleanEmail,
            mobile: "",
            role: "member",
            otp_code: otp,
            otp_expires_at: expiresAt,
            created_at: new Date().toISOString(),
          };
          await dbInsertUser(user);
        } else {
          await dbUpdateUser(user._id, { otp_code: otp, otp_expires_at: expiresAt });
        }
        userName = user.name || cleanEmail.split("@")[0];
      }
    }

    // Send OTP email (Brevo API prioritized)
    const sendResult = await sendOtpEmail({
      toEmail: cleanEmail,
      userName,
      otp,
      purpose: "login",
    });

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
