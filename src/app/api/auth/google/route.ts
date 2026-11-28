import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { signToken, getOrCreateAdmin } from "../../../../lib/auth";
import { dbFindMemberByEmail, dbInsertMember, dbUpdateMember } from "../../../../lib/astra";
import { sendLoginAlertEmail } from "../../../../lib/email";
import { sanitize } from "../../../../lib/crypto";
import { Member, SessionPayload } from "../../../../lib/types";

// Permanent 10-year session (no auto logout)
const PERMANENT_SESSION_SEC = 10 * 365 * 24 * 60 * 60;

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json();

    if (!credential) {
      return NextResponse.json({ error: "Google क्रेडेंशियल टोकन प्राप्त नहीं हुआ।" }, { status: 400 });
    }

    // Verify token with Google's public tokeninfo endpoint
    let googlePayload: any = null;
    try {
      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (res.ok) {
        googlePayload = await res.json();
      }
    } catch (e) {
      console.warn("Google tokeninfo fetch failed, attempting jwt decode:", e);
    }

    // Fallback decoding if tokeninfo call failed
    if (!googlePayload) {
      googlePayload = jwt.decode(credential);
    }

    if (!googlePayload || !googlePayload.email) {
      return NextResponse.json({ error: "अमान्य Google क्रेडेंशियल टोकन।" }, { status: 400 });
    }

    const cleanEmail = sanitize(googlePayload.email).trim().toLowerCase();
    const googleName = sanitize(googlePayload.name || googlePayload.given_name || "Google सदस्य").trim();
    const googlePicture = googlePayload.picture || "";

    const envFounderEmail = (process.env.FOUNDER_EMAIL || "sky140052@gmail.com").trim().toLowerCase();
    const isAdmin = Boolean(envFounderEmail && cleanEmail === envFounderEmail);

    let sessionPayload: SessionPayload;
    let redirectTo = "/dashboard";
    let message = "Google लॉगिन सफल!";

    if (isAdmin) {
      const admin = await getOrCreateAdmin(cleanEmail);
      sessionPayload = {
        userId: admin._id,
        name: admin.name || googleName,
        email: cleanEmail,
        role: "admin",
        mobile: admin.mobile,
      };
      redirectTo = "/admin";
      message = "👑 मुख्य एडमिन Google लॉगिन सफल!";
    } else {
      // Check if Member exists
      const member = await dbFindMemberByEmail(cleanEmail);
      if (member) {
        if (googlePicture && !member.photo) {
          await dbUpdateMember(member._id, { photo: googlePicture });
        }
        sessionPayload = {
          userId: member._id,
          name: member.name,
          email: member.email,
          role: "member",
          mobile: member.mobile,
          aadhaar: member.aadhaar_number?.slice(-4),
        };
        message = `नमस्ते ${member.name}! Google लॉगिन सफल रहा।`;
      } else {
        // Auto-create new member via verified Google Account!
        const newMember: Member = {
          _id: `dfi_mem_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          name: googleName,
          email: cleanEmail,
          mobile: "",
          photo: googlePicture,
          aadhaar_number: "",
          created_at: new Date().toISOString(),
        };

        await dbInsertMember(newMember);

        sessionPayload = {
          userId: newMember._id,
          name: newMember.name,
          email: newMember.email,
          role: "member",
          mobile: "",
        };
        message = `बधाई हो ${newMember.name}! आपका Google अकाउंट स्वतः सत्यापित व पंजीकृत हो गया है।`;
      }
    }

    // Generate 10-year permanent token
    const token = signToken(sessionPayload, true);

    // Send Login Notification Alert Email
    sendLoginAlertEmail({
      toEmail: sessionPayload.email,
      userName: sessionPayload.name,
      role: sessionPayload.role,
    }).catch((err) => console.warn("Google login alert email failed:", err));

    const response = NextResponse.json({
      success: true,
      message,
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
  } catch (err: any) {
    console.error("Google Auth error:", err);
    return NextResponse.json({ error: "Google प्रमाणीकरण में त्रुटि।" }, { status: 500 });
  }
}
