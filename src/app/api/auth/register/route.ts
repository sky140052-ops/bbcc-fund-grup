import { NextRequest, NextResponse } from "next/server";
import { dbFindUser, dbInsertUser, dbUpdateUser, dbInsertGroupMember, dbFindGroupById } from "../../../../lib/astra";
import { hashPassword, hashAadhaar, sanitize } from "../../../../lib/crypto";
import { signToken } from "../../../../lib/auth";
import { sendLoginAlertEmail } from "../../../../lib/email";
import { User, GroupMember } from "../../../../lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      mobile,
      dob,
      father_name,
      gender,
      marital_status,
      address,
      city,
      pincode,
      occupation,
      monthly_income,
      nominee_name,
      nominee_relation,
      nominee_mobile,
      aadhaar,
      pan,
      photo_live,
      aadhaar_front,
      aadhaar_back,
      pan_type,
      pan_document,
      epan_password,
      bank_details,
      group_id,
    } = body;

    const cleanName = sanitize(name);
    const cleanEmail = sanitize(email).trim().toLowerCase();
    const cleanMobile = sanitize(mobile).replace(/\D/g, "");
    const cleanDob = sanitize(dob).replace(/[-/]/g, "");
    const rawAadhaar = sanitize(aadhaar || "").replace(/\D/g, "");
    const cleanPan = sanitize(pan || "").toUpperCase();

    if (!cleanName || !cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json({ error: "कृपया मान्य नाम एवं ईमेल पता दर्ज करें।" }, { status: 400 });
    }

    if (cleanMobile.length < 10) {
      return NextResponse.json({ error: "कृपया सही 10-अंकीय मोबाइल नंबर दर्ज करें।" }, { status: 400 });
    }

    if (rawAadhaar.length !== 12) {
      return NextResponse.json({ error: "कृपया 12-अंकीय आधार कार्ड नंबर दर्ज करें।" }, { status: 400 });
    }

    // If e-PAN selected, require e-PAN password
    if (pan_type === "epan" && (!epan_password || !epan_password.trim())) {
      return NextResponse.json(
        { error: "ई-पैन (e-PAN) के लिए कृपया e-PAN पीडीएफ का पासवर्ड (उदा. DDMMYYYY) दर्ज करें।" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await dbFindUser({ email: cleanEmail });
    const hashedPassword = await hashPassword(body.password || cleanDob || "bbcc@2026");
    const hashedAadhaar = hashAadhaar(rawAadhaar);

    let user: User;

    if (existingUser) {
      // Update provisional user with full loan-grade KYC details
      await dbUpdateUser(existingUser._id, {
        name: cleanName,
        mobile: cleanMobile,
        dob: cleanDob,
        father_name: sanitize(father_name || ""),
        gender: sanitize(gender || "पुरुष"),
        marital_status: sanitize(marital_status || "विवाहित"),
        address: sanitize(address || ""),
        city: sanitize(city || ""),
        pincode: sanitize(pincode || ""),
        occupation: sanitize(occupation || ""),
        monthly_income: sanitize(monthly_income || ""),
        nominee_name: sanitize(nominee_name || ""),
        nominee_relation: sanitize(nominee_relation || ""),
        nominee_mobile: sanitize(nominee_mobile || "").replace(/\D/g, ""),
        aadhaar_last4: rawAadhaar.slice(-4),
        aadhaar_hash: hashedAadhaar,
        pan: cleanPan,
        photo_live: photo_live || existingUser.photo_live || "",
        aadhaar_front: aadhaar_front || existingUser.aadhaar_front || "",
        aadhaar_back: aadhaar_back || existingUser.aadhaar_back || "",
        pan_type: pan_type || "physical",
        pan_document: pan_document || existingUser.pan_document || "",
        epan_password: epan_password || "",
        bank_details: bank_details || existingUser.bank_details,
      });

      user = {
        ...existingUser,
        name: cleanName,
        mobile: cleanMobile,
        dob: cleanDob,
      };
    } else {
      user = {
        _id: `usr_${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        mobile: cleanMobile,
        dob: cleanDob,
        role: "member",
        father_name: sanitize(father_name || ""),
        gender: sanitize(gender || "पुरुष"),
        marital_status: sanitize(marital_status || "विवाहित"),
        address: sanitize(address || ""),
        city: sanitize(city || ""),
        pincode: sanitize(pincode || ""),
        occupation: sanitize(occupation || ""),
        monthly_income: sanitize(monthly_income || ""),
        nominee_name: sanitize(nominee_name || ""),
        nominee_relation: sanitize(nominee_relation || ""),
        nominee_mobile: sanitize(nominee_mobile || "").replace(/\D/g, ""),
        aadhaar_last4: rawAadhaar.slice(-4),
        aadhaar_hash: hashedAadhaar,
        pan: cleanPan,
        photo_live: photo_live || "",
        aadhaar_front: aadhaar_front || "",
        aadhaar_back: aadhaar_back || "",
        pan_type: pan_type || "physical",
        pan_document: pan_document || "",
        epan_password: epan_password || "",
        bank_details: bank_details || { account_number: "", ifsc: "", upi_id: "" },
        password_hash: hashedPassword,
        created_at: new Date().toISOString(),
      };

      await dbInsertUser(user);
    }

    // Apply to group if specified
    if (group_id) {
      const targetGroup = await dbFindGroupById(group_id);
      if (targetGroup) {
        const membership: GroupMember = {
          _id: `gm_${Date.now()}`,
          group_id: targetGroup._id,
          user_id: user._id,
          joined_at: new Date().toISOString(),
          status: "pending", // Requires Admin Approval
          has_received_payout: false,
        };
        await dbInsertGroupMember(membership);
      }
    }

    // Issue JWT Token (30 Days default)
    const token = signToken(
      {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        aadhaar: user.aadhaar_last4,
      },
      true
    );

    // Send Login/Registration Notification Email
    sendLoginAlertEmail({
      toEmail: user.email,
      userName: user.name,
      role: user.role,
    }).catch((err) => console.warn("Email alert error:", err));

    const response = NextResponse.json({
      success: true,
      message: "लोन-ग्रेड KYC पंजीकरण सफल रहा! आपका आवेदन मुख्य एडमिन के पास समीक्षा हेतु भेज दिया गया है।",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      redirectTo: "/dashboard",
    });

    const THIRTY_DAYS_SEC = 30 * 24 * 60 * 60;
    response.cookies.set("bbcc_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: THIRTY_DAYS_SEC,
      expires: new Date(Date.now() + THIRTY_DAYS_SEC * 1000),
    });

    return response;
  } catch (err) {
    console.error("KYC Registration error:", err);
    return NextResponse.json({ error: "पंजीकरण करने में त्रुटि हुई।" }, { status: 500 });
  }
}
