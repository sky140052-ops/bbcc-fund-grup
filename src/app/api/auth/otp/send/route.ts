import { NextRequest, NextResponse } from "next/server";
import {
  dbFindUser,
  dbUpdateUser,
  dbInsertUser,
  dbFindMemberByEmail,
  dbUpdateMember,
  dbCheckDuplicateMember,
} from "../../../../../lib/astra";
import { sendOtpEmail } from "../../../../../lib/email";
import { sanitize } from "../../../../../lib/crypto";
import { getOrCreateAdmin } from "../../../../../lib/auth";

// Shared memory registration cache across routes
declare global {
  // eslint-disable-next-line no-var
  var __dfi_reg_cache: Record<string, { otp: string; expiresAt: number; data: any }> | undefined;
}
if (!global.__dfi_reg_cache) {
  global.__dfi_reg_cache = {};
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, mobile, photo, aadhaar_number, pan_number } = body;
    const cleanEmail = sanitize(email || "").trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json({ error: "कृपया मान्य ईमेल (Gmail) पता दर्ज करें।" }, { status: 400 });
    }

    const envFounderEmail = (process.env.FOUNDER_EMAIL || "sky140052@gmail.com").trim().toLowerCase();
    const isAdmin = Boolean(envFounderEmail && cleanEmail === envFounderEmail);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    let userName = name ? sanitize(name).trim() : "उपयोगकर्ता";
    let isMember = false;

    if (isAdmin) {
      const admin = await getOrCreateAdmin(cleanEmail);
      userName = admin.name || "मुख्य एडमिन";
      await dbUpdateUser(admin._id, { otp_code: otp, otp_expires_at: expiresAt });
    } else {
      // Check if registered Member in DB
      const member = await dbFindMemberByEmail(cleanEmail);
      if (member) {
        userName = member.name;
        isMember = true;
        // If user submitted updated photo, update it too
        const updateFields: any = { otp_code: otp, otp_expires_at: expiresAt };
        if (photo && !member.photo) updateFields.photo = photo;
        await dbUpdateMember(member._id, updateFields);
      } else {
        // If new registration details provided (Name, Mobile, Aadhaar)
        const cleanName = sanitize(name || "").trim();
        const cleanMobile = sanitize(mobile || "").replace(/\D/g, "");
        const cleanAadhaar = sanitize(aadhaar_number || "").replace(/\D/g, "");
        const cleanPan = sanitize(pan_number || "").toUpperCase().trim();

        if (cleanName || cleanMobile || cleanAadhaar) {
          if (!cleanName) {
            return NextResponse.json({ error: "कृपया अपना पूरा नाम दर्ज करें।" }, { status: 400 });
          }
          if (cleanMobile.length < 10) {
            return NextResponse.json({ error: "कृपया 10-अंकीय मोबाइल नंबर दर्ज करें।" }, { status: 400 });
          }
          if (cleanAadhaar && cleanAadhaar.length !== 12) {
            return NextResponse.json({ error: "कृपया 12-अंकों का आधार नंबर दर्ज करें।" }, { status: 400 });
          }

          // Check duplicate across DB
          const dupCheck = await dbCheckDuplicateMember({
            email: cleanEmail,
            mobile: cleanMobile,
            aadhaar_number: cleanAadhaar,
            pan_number: cleanPan,
          });
          if (dupCheck.isDuplicate) {
            return NextResponse.json({ error: dupCheck.message }, { status: 400 });
          }

          // Cache pending registration in memory
          global.__dfi_reg_cache![cleanEmail] = {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000,
            data: {
              name: cleanName,
              mobile: cleanMobile,
              email: cleanEmail,
              photo: photo || "",
              aadhaar_number: cleanAadhaar,
              pan_number: cleanPan,
            },
          };
          userName = cleanName;
        } else {
          // Unregistered email and no registration details provided
          return NextResponse.json(
            {
              error: "यह ईमेल आईडी पंजीकृत नहीं है! कृपया नीचे अपना नाम, मोबाइल और आधार नंबर भरकर नया सदस्य पंजीकरण करें।",
              needs_registration: true,
            },
            { status: 404 }
          );
        }
      }
    }

    // Send OTP email (Brevo API prioritized)
    const sendResult = await sendOtpEmail({
      toEmail: cleanEmail,
      userName,
      otp,
      purpose: "login",
    });

    if (!sendResult.success) {
      return NextResponse.json(
        {
          error:
            sendResult.error ||
            "ईमेल पर OTP भेजने में विफल। कृपया एडमिन पोर्टल में Brevo API Key या ईमेल सेवा कॉन्फ़िगर करें।",
        },
        { status: 500 }
      );
    }

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
