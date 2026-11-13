import { NextRequest, NextResponse } from "next/server";
import { dbFindUser, dbInsertUser, dbInsertGroupMember, dbFindGroupById } from "../../../../lib/astra";
import { hashPassword, hashAadhaar, sanitize } from "../../../../lib/crypto";
import { signToken } from "../../../../lib/auth";
import { User, GroupMember } from "../../../../lib/types";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, mobile, dob, aadhaar, pan, bank_details, group_id } =
      await req.json();

    const cleanName = sanitize(name);
    const cleanEmail = sanitize(email).trim().toLowerCase();
    const cleanPassword = sanitize(password).trim();
    const cleanMobile = sanitize(mobile).replace(/\D/g, "");
    const cleanDob = sanitize(dob).replace(/[-/]/g, "");
    const rawAadhaar = sanitize(aadhaar || "").replace(/\D/g, "");
    const cleanPan = sanitize(pan || "").toUpperCase();

    if (!cleanName || !cleanEmail || !cleanEmail.includes("@") || cleanPassword.length < 6) {
      return NextResponse.json(
        { error: "कृपया मान्य नाम, ईमेल एवं कम से कम 6 अक्षरों का सुरक्षित पासवर्ड दर्ज करें।" },
        { status: 400 }
      );
    }

    if (cleanMobile.length < 10 || cleanDob.length < 8) {
      return NextResponse.json(
        { error: "कृपया 10-अंकीय मोबाइल नंबर एवं 8-अंकीय जन्मतिथि (DDMMYYYY) दर्ज करें।" },
        { status: 400 }
      );
    }

    if (rawAadhaar.length !== 12) {
      return NextResponse.json(
        { error: "कृपया सही 12-अंकीय आधार कार्ड नंबर दर्ज करें।" },
        { status: 400 }
      );
    }

    // Check if email or mobile already registered
    const existingEmail = await dbFindUser({ email: cleanEmail });
    if (existingEmail) {
      return NextResponse.json(
        { error: "यह ईमेल पहले से पंजीकृत है। कृपया लॉगिन करें।" },
        { status: 400 }
      );
    }

    const existingMobile = await dbFindUser({ mobile: cleanMobile });
    if (existingMobile) {
      return NextResponse.json(
        { error: "यह मोबाइल नंबर पहले से पंजीकृत है। कृपया लॉगिन करें।" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(cleanPassword);
    const hashedAadhaar = hashAadhaar(rawAadhaar);

    const newUser: User = {
      _id: `usr_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      mobile: cleanMobile,
      dob: cleanDob,
      role: "member",
      aadhaar_last4: rawAadhaar.slice(-4),
      aadhaar_hash: hashedAadhaar,
      pan: cleanPan,
      bank_details: bank_details || { account_number: "", ifsc: "", upi_id: "" },
      password_hash: hashedPassword,
      created_at: new Date().toISOString(),
    };

    await dbInsertUser(newUser);

    // If applied to a group during registration, create pending membership
    if (group_id) {
      const targetGroup = await dbFindGroupById(group_id);
      if (targetGroup) {
        const membership: GroupMember = {
          _id: `gm_${Date.now()}`,
          group_id: targetGroup._id,
          user_id: newUser._id,
          joined_at: new Date().toISOString(),
          status: "pending",
          has_received_payout: false,
        };
        await dbInsertGroupMember(membership);
      }
    }

    // Issue JWT Token (30 days default on new registration)
    const token = signToken(
      {
        userId: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        mobile: newUser.mobile,
        aadhaar: newUser.aadhaar_last4,
      },
      true
    );

    const response = NextResponse.json({
      success: true,
      message: "पंजीकरण सफल रहा! आपका खाता सक्रिय हो गया है।",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      redirectTo: "/dashboard",
    });

    response.cookies.set("bbcc_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: "पंजीकरण करने में त्रुटि हुई।" }, { status: 500 });
  }
}
