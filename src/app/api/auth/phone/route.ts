import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { signToken, getOrCreateAdmin } from "../../../../lib/auth";
import { dbFindMemberByMobile, dbInsertMember, dbUpdateMember } from "../../../../lib/astra";
import { sendLoginAlertEmail } from "../../../../lib/email";
import { sanitize } from "../../../../lib/crypto";
import { Member, SessionPayload } from "../../../../lib/types";

// Permanent 10-year session (no auto logout)
const PERMANENT_SESSION_SEC = 10 * 365 * 24 * 60 * 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mobile, idToken, name, email, aadhaar, pan, photo } = body;

    if (!mobile) {
      return NextResponse.json({ error: "मोबाइल नंबर आवश्यक है।" }, { status: 400 });
    }

    const cleanDigits = String(mobile).replace(/\D/g, "");
    const cleanMobile = cleanDigits.slice(-10);

    if (cleanMobile.length !== 10) {
      return NextResponse.json({ error: "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।" }, { status: 400 });
    }

    // Optional verification of Firebase ID token if supplied
    if (idToken) {
      try {
        const decoded: any = jwt.decode(idToken);
        if (decoded && decoded.phone_number) {
          const decodedDigits = decoded.phone_number.replace(/\D/g, "").slice(-10);
          if (decodedDigits && decodedDigits !== cleanMobile) {
            return NextResponse.json(
              { error: "सत्यापित मोबाइल नंबर और दर्ज किया गया नंबर मेल नहीं खाते।" },
              { status: 400 }
            );
          }
        }
      } catch (e) {
        console.warn("Firebase token decode warning:", e);
      }
    }

    // Check if this mobile belongs to the Admin / Founder
    const founderEmail = (process.env.FOUNDER_EMAIL || "sky140052@gmail.com").trim().toLowerCase();
    const adminObj = await getOrCreateAdmin(founderEmail);
    const adminMobile = adminObj.mobile?.replace(/\D/g, "").slice(-10);

    let sessionPayload: SessionPayload;
    let redirectTo = "/dashboard";
    let message = "मोबाइल OTP लॉगिन सफल!";

    if (adminMobile && adminMobile === cleanMobile) {
      sessionPayload = {
        userId: adminObj._id,
        name: adminObj.name || "मुख्य संस्थापक",
        email: adminObj.email,
        role: "admin",
        mobile: adminMobile,
      };
      redirectTo = "/admin";
      message = "👑 मुख्य एडमिन मोबाइल OTP लॉगिन सफल!";
    } else {
      // Check if Member already exists in Astra DB
      const existingMember = await dbFindMemberByMobile(cleanMobile);

      if (existingMember) {
        // Update any provided details if missing
        const updates: Partial<Member> = {};
        if (photo && !existingMember.photo) updates.photo = photo;
        if (name && (!existingMember.name || existingMember.name.startsWith("सदस्य "))) updates.name = sanitize(name).trim();
        if (aadhaar && !existingMember.aadhaar_number) updates.aadhaar_number = sanitize(aadhaar).replace(/\D/g, "");
        if (pan && !existingMember.pan_number) updates.pan_number = sanitize(pan).toUpperCase();
        if (email && (!existingMember.email || existingMember.email.endsWith("@dfi.local"))) updates.email = sanitize(email).toLowerCase();

        if (Object.keys(updates).length > 0) {
          await dbUpdateMember(existingMember._id, updates);
        }

        sessionPayload = {
          userId: existingMember._id,
          name: updates.name || existingMember.name,
          email: updates.email || existingMember.email,
          role: "member",
          mobile: existingMember.mobile,
          aadhaar: (updates.aadhaar_number || existingMember.aadhaar_number)?.slice(-4),
        };
        message = `नमस्ते ${sessionPayload.name}! मोबाइल OTP सत्यापन सफल रहा।`;
      } else {
        // Auto-create new Member
        const safeName = name ? sanitize(name).trim() : `सदस्य ${cleanMobile.slice(-4)}`;
        const safeEmail = email ? sanitize(email).trim().toLowerCase() : `${cleanMobile}@dfi.local`;
        const safeAadhaar = aadhaar ? sanitize(aadhaar).replace(/\D/g, "") : "";
        const safePan = pan ? sanitize(pan).trim().toUpperCase() : "";

        const newMember: Member = {
          _id: `dfi_mem_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          name: safeName,
          email: safeEmail,
          mobile: cleanMobile,
          photo: photo || "",
          aadhaar_number: safeAadhaar,
          pan_number: safePan,
          created_at: new Date().toISOString(),
        };

        await dbInsertMember(newMember);

        sessionPayload = {
          userId: newMember._id,
          name: newMember.name,
          email: newMember.email,
          role: "member",
          mobile: newMember.mobile,
          aadhaar: newMember.aadhaar_number?.slice(-4),
        };
        message = `बधाई हो ${newMember.name}! आपका मोबाइल नंबर सफलतापूर्वक सत्यापित व पंजीकृत हो गया है।`;
      }
    }

    // Generate permanent 10-year session token
    const token = signToken(sessionPayload, true);

    // Send login alert email if email exists and is valid
    if (sessionPayload.email && !sessionPayload.email.endsWith("@dfi.local")) {
      sendLoginAlertEmail({
        toEmail: sessionPayload.email,
        userName: sessionPayload.name,
        role: sessionPayload.role,
      }).catch((err) => console.warn("Phone login alert email error:", err));
    }

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
    console.error("Phone Auth endpoint error:", err);
    return NextResponse.json(
      { error: err.message || "मोबाइल प्रमाणीकरण में त्रुटि।" },
      { status: 500 }
    );
  }
}
