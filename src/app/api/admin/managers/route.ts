import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import {
  dbFindUsers,
  dbFindUser,
  dbInsertUser,
  dbUpdateUser,
  dbGetActiveGroup,
  dbInsertGroupMember,
} from "../../../../lib/astra";
import { hashPassword, hashAadhaar, sanitize } from "../../../../lib/crypto";
import { User } from "../../../../lib/types";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session || session.role !== "founder") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const managers = await dbFindUsers({ role: "manager" });
  // Exclude password_hash and aadhaar_hash from response
  const safeManagers = managers.map((m) => ({
    _id: m._id,
    name: m.name,
    email: m.email,
    mobile: m.mobile,
    dob: m.dob,
    role: m.role,
    aadhaar_last4: m.aadhaar_last4,
    pan: m.pan,
    created_at: m.created_at,
  }));

  return NextResponse.json({ managers: safeManagers });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session || session.role !== "founder") {
    return NextResponse.json({ error: "केवल मुख्य फाउंडर ही मैनेजर (MD) बना सकते हैं।" }, { status: 403 });
  }

  try {
    const { name, email, mobile, password, aadhaar, pan, dob, member_id } = await req.json();

    // Option 1: Promote an existing member to Manager (MD)
    if (member_id) {
      const existingMember = await dbFindUser({ _id: member_id });
      if (!existingMember) {
        return NextResponse.json({ error: "सदस्य नहीं मिला।" }, { status: 404 });
      }

      const updates: Partial<User> = { role: "manager" };
      if (email && email.trim()) {
        updates.email = sanitize(email).trim().toLowerCase();
      }
      if (password && password.trim()) {
        updates.password_hash = await hashPassword(password.trim());
      }

      await dbUpdateUser(member_id, updates);

      return NextResponse.json({
        success: true,
        manager: {
          _id: existingMember._id,
          name: existingMember.name,
          mobile: existingMember.mobile,
          role: "manager",
        },
        message: `${existingMember.name} को सफलतापूर्वक ग्रुप का MD (मैनेजिंग डायरेक्टर) नियुक्त किया गया!`,
      });
    }

    const cleanName = sanitize(name);
    const cleanEmail = sanitize(email || `${mobile}@gmail.com`).trim().toLowerCase();
    const cleanMobile = sanitize(mobile).replace(/\D/g, "");
    const cleanPassword = sanitize(password);

    if (!cleanName || cleanMobile.length < 10 || cleanPassword.length < 4) {
      return NextResponse.json({ error: "कृपया मान्य नाम, 10-अंकीय मोबाइल एवं सुरक्षित पासवर्ड दर्ज करें।" }, { status: 400 });
    }

    const existing = await dbFindUser({ mobile: cleanMobile });
    if (existing) {
      return NextResponse.json({ error: "यह मोबाइल नंबर पहले से पंजीकृत है।" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(cleanPassword);
    const rawAadhaar = sanitize(aadhaar || "000000000000").replace(/\D/g, "");
    const hashedAadhaar = hashAadhaar(rawAadhaar);

    const newManager: User = {
      _id: `mgr_${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      mobile: cleanMobile,
      dob: sanitize(dob) || "19900101",
      role: "manager",
      aadhaar_last4: rawAadhaar.slice(-4),
      aadhaar_hash: hashedAadhaar,
      pan: sanitize(pan) || "MANAGER123",
      password_hash: hashedPassword,
      created_at: new Date().toISOString(),
    };

    await dbInsertUser(newManager);

    // Also add to active group members so Manager participates and contributes
    const activeGroup = await dbGetActiveGroup();
    if (activeGroup) {
      await dbInsertGroupMember({
        _id: `gm_${Date.now()}`,
        group_id: activeGroup._id,
        user_id: newManager._id,
        joined_at: new Date().toISOString(),
        has_received_payout: false,
      });
    }

    return NextResponse.json({
      success: true,
      manager: {
        _id: newManager._id,
        name: newManager.name,
        mobile: newManager.mobile,
        role: newManager.role,
      },
      message: "मैनेजर (MD) सफलतापूर्वक बनाया गया और पासवर्ड Bcrypt से हैश करके सेव किया गया।",
    });
  } catch (error) {
    console.error("Create manager error:", error);
    return NextResponse.json({ error: "मैनेजर बनाने में त्रुटि हुई।" }, { status: 500 });
  }
}
