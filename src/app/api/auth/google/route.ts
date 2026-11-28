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
    const body = await req.json();
    const { credential, memberDetails } = body;

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

    // 1. ADMIN 1-TAP LOGIN
    if (isAdmin) {
      const admin = await getOrCreateAdmin(cleanEmail);
      const sessionPayload: SessionPayload = {
        userId: admin._id,
        name: admin.name || googleName,
        email: cleanEmail,
        role: "admin",
        mobile: admin.mobile,
      };

      const token = signToken(sessionPayload, true);
      sendLoginAlertEmail({
        toEmail: sessionPayload.email,
        userName: sessionPayload.name,
        role: sessionPayload.role,
      }).catch((err) => console.warn("Google admin alert email failed:", err));

      const response = NextResponse.json({
        success: true,
        isNewUser: false,
        message: "👑 मुख्य एडमिन Google 1-Tap लॉगिन सफल!",
        user: sessionPayload,
        token,
        redirectTo: "/admin",
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

    // 2. CHECK IF EXISTING MEMBER
    const existingMember = await dbFindMemberByEmail(cleanEmail);

    // If existing member has both mobile and aadhaar filled, log them in instantly!
    if (existingMember && existingMember.mobile && existingMember.aadhaar_number && !memberDetails) {
      if (googlePicture && !existingMember.photo) {
        await dbUpdateMember(existingMember._id, { photo: googlePicture });
      }

      const sessionPayload: SessionPayload = {
        userId: existingMember._id,
        name: existingMember.name,
        email: existingMember.email,
        role: "member",
        mobile: existingMember.mobile,
        aadhaar: existingMember.aadhaar_number?.slice(-4),
      };

      const token = signToken(sessionPayload, true);
      sendLoginAlertEmail({
        toEmail: sessionPayload.email,
        userName: sessionPayload.name,
        role: sessionPayload.role,
      }).catch((err) => console.warn("Google member alert email failed:", err));

      const response = NextResponse.json({
        success: true,
        isNewUser: false,
        message: `नमस्ते ${existingMember.name}! Google लॉगिन सफल रहा।`,
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

    // 3. IF NEW USER OR INCOMPLETE PROFILE (AND memberDetails NOT YET SUBMITTED)
    // Return verified Google info so user can fill manual fields (mobile, aadhaar, pan)!
    if (!memberDetails) {
      return NextResponse.json({
        success: true,
        isNewUser: true,
        googleData: {
          email: cleanEmail,
          name: existingMember?.name || googleName,
          photo: existingMember?.photo || googlePicture,
          mobile: existingMember?.mobile || "",
          aadhaar: existingMember?.aadhaar_number || "",
          pan: existingMember?.pan_number || "",
        },
        message: "Google पहचान सत्यापित! कृपया शेष विवरण (मोबाइल व आधार) दर्ज करके रजिस्ट्रेशन पूरा करें।",
      });
    }

    // 4. MEMBER DETAILS SUBMITTED -> SAVE / COMPLETE REGISTRATION!
    const cleanMobile = sanitize(memberDetails.mobile || "").replace(/\D/g, "").slice(-10);
    const cleanAadhaar = sanitize(memberDetails.aadhaar_number || "").replace(/\D/g, "");
    const cleanPan = sanitize(memberDetails.pan_number || "").toUpperCase().trim();
    const finalName = sanitize(memberDetails.name || googleName).trim();
    const finalPhoto = memberDetails.photo || googlePicture;

    if (cleanMobile.length !== 10) {
      return NextResponse.json({ error: "कृपया 10-अंकीय मान्य मोबाइल नंबर दर्ज करें।" }, { status: 400 });
    }
    if (cleanAadhaar.length !== 12) {
      return NextResponse.json({ error: "कृपया 12-अंकों का आधार नंबर दर्ज करें।" }, { status: 400 });
    }

    let finalMemberId: string;

    if (existingMember) {
      await dbUpdateMember(existingMember._id, {
        name: finalName,
        mobile: cleanMobile,
        aadhaar_number: cleanAadhaar,
        pan_number: cleanPan,
        photo: finalPhoto,
      });
      finalMemberId = existingMember._id;
    } else {
      const newMember: Member = {
        _id: `dfi_mem_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: finalName,
        email: cleanEmail,
        mobile: cleanMobile,
        photo: finalPhoto,
        aadhaar_number: cleanAadhaar,
        pan_number: cleanPan,
        created_at: new Date().toISOString(),
      };
      await dbInsertMember(newMember);
      finalMemberId = newMember._id;
    }

    const sessionPayload: SessionPayload = {
      userId: finalMemberId,
      name: finalName,
      email: cleanEmail,
      role: "member",
      mobile: cleanMobile,
      aadhaar: cleanAadhaar.slice(-4),
    };

    const token = signToken(sessionPayload, true);
    sendLoginAlertEmail({
      toEmail: sessionPayload.email,
      userName: sessionPayload.name,
      role: sessionPayload.role,
    }).catch((err) => console.warn("Google registration alert email failed:", err));

    const response = NextResponse.json({
      success: true,
      isNewUser: false,
      message: `बधाई हो ${finalName}! आपका DFI सदस्यता पंजीकरण सफलतापूर्वक पूर्ण हो गया है।`,
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
  } catch (err: any) {
    console.error("Google Auth error:", err);
    return NextResponse.json({ error: "Google प्रमाणीकरण प्रक्रिया में त्रुटि।" }, { status: 500 });
  }
}
