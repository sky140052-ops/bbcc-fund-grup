import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import {
  dbFindUsers,
  dbFindUser,
  dbInsertUser,
  dbGetActiveGroup,
  dbInsertGroupMember,
} from "../../../../lib/astra";
import { hashAadhaar, sanitize } from "../../../../lib/crypto";
import { User, GroupMember } from "../../../../lib/types";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allMembers = await dbFindUsers({ role: "member" });
  const safeMembers = allMembers.map((m) => ({
    _id: m._id,
    name: m.name,
    mobile: m.mobile,
    dob: m.dob,
    role: m.role,
    aadhaar_last4: m.aadhaar_last4,
    pan: m.pan,
    bank_details: m.bank_details,
    created_at: m.created_at,
  }));

  return NextResponse.json({
    members: safeMembers,
    total: safeMembers.length,
  });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session || (session.role !== "founder" && session.role !== "manager" && session.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized. केवल एडमिन या मैनेजर सदस्य जोड़ सकते हैं।" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const name = sanitize(body.name);
    const mobile = sanitize(body.mobile).replace(/\D/g, "");
    const dob = sanitize(body.dob).replace(/\D/g, "");
    const rawAadhaar = sanitize(body.aadhaar).replace(/\D/g, "");
    const pan = sanitize(body.pan).toUpperCase();
    const bank_details = body.bank_details;

    if (!name || mobile.length < 10 || dob.length < 8 || rawAadhaar.length < 12 || pan.length < 10) {
      return NextResponse.json(
        { error: "कृपया सभी फ़ील्ड सही प्रारूप में भरें (10-अंकीय मोबाइल, 8-अंकीय जन्मतिथि, 12-अंकीय आधार, 10-अक्षरीय पैन)।" },
        { status: 400 }
      );
    }

    const hashedAadhaar = hashAadhaar(rawAadhaar);

    // Check if mobile or Aadhaar already registered
    const existingByMobile = await dbFindUser({ mobile });
    if (existingByMobile) {
      return NextResponse.json({ error: "यह मोबाइल नंबर पहले से पंजीकृत है।" }, { status: 400 });
    }

    const existingByAadhaar = await dbFindUser({ aadhaar_hash: hashedAadhaar });
    if (existingByAadhaar) {
      return NextResponse.json({ error: "यह आधार नंबर पहले से पंजीकृत है।" }, { status: 400 });
    }

    const newUser: User = {
      _id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name,
      mobile,
      dob,
      role: "member",
      aadhaar_last4: rawAadhaar.slice(-4),
      aadhaar_hash: hashedAadhaar,
      pan,
      bank_details: bank_details || {
        account_number: "",
        ifsc: "",
        upi_id: "",
      },
      created_at: new Date().toISOString(),
    };

    await dbInsertUser(newUser);

    const activeGroup = await dbGetActiveGroup();
    if (activeGroup) {
      const membership: GroupMember = {
        _id: `gm_${Date.now()}`,
        group_id: activeGroup._id,
        user_id: newUser._id,
        joined_at: new Date().toISOString(),
        has_received_payout: false,
      };
      await dbInsertGroupMember(membership);
    }

    return NextResponse.json({
      success: true,
      member: {
        _id: newUser._id,
        name: newUser.name,
        mobile: newUser.mobile,
        dob: newUser.dob,
        aadhaar_last4: newUser.aadhaar_last4,
        pan: newUser.pan,
      },
      message: "नया सदस्य Astra DB में सुरक्षित रूप से दर्ज किया गया।",
    });
  } catch (error) {
    console.error("Add member error:", error);
    return NextResponse.json({ error: "सदस्य जोड़ने में त्रुटि हुई।" }, { status: 500 });
  }
}
