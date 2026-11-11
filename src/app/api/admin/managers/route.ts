import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getLocalStore } from "@/lib/astra";
import { User } from "@/lib/types";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session || session.role !== "founder") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const store = getLocalStore();
  const managers = store.users.filter((u) => u.role === "manager");

  return NextResponse.json({ managers });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session || session.role !== "founder") {
    return NextResponse.json({ error: "केवल मुख्य फाउंडर ही मैनेजर बना सकते हैं।" }, { status: 403 });
  }

  try {
    const { name, mobile, password, aadhaar, pan, dob, member_id } = await req.json();

    const store = getLocalStore();

    // Option 1: Promote an existing member to Manager (MD)
    if (member_id) {
      const existingMember = store.users.find((u) => u._id === member_id);
      if (!existingMember) {
        return NextResponse.json({ error: "सदस्य नहीं मिला।" }, { status: 404 });
      }
      existingMember.role = "manager";
      if (password) existingMember.custom_password = password.trim();

      return NextResponse.json({
        success: true,
        manager: existingMember,
        message: `${existingMember.name} को सफलतापूर्वक ग्रुप का मैनेजिंग डायरेक्टर (MD) बनाया गया!`,
      });
    }

    if (!name || !mobile || !password) {
      return NextResponse.json({ error: "नाम, मोबाइल और पासवर्ड आवश्यक हैं।" }, { status: 400 });
    }

    const existing = store.users.find((u) => u.mobile === mobile);
    if (existing) {
      return NextResponse.json({ error: "यह मोबाइल नंबर पहले से पंजीकृत है।" }, { status: 400 });
    }

    const newManager: User = {
      _id: `mgr_${Date.now()}`,
      name: name.trim(),
      mobile: mobile.trim(),
      dob: dob || "1990-01-01",
      role: "manager",
      aadhaar: aadhaar || "000000000000",
      pan: pan || "MANAGER123",
      custom_password: password.trim(),
      created_at: new Date().toISOString(),
    };

    store.users.push(newManager);

    // Also add to group_members so Manager contributes money to pool
    const targetGroupId = store.groups[0]?._id;
    if (targetGroupId) {
      store.group_members.push({
        _id: `gm_${Date.now()}`,
        group_id: targetGroupId,
        user_id: newManager._id,
        joined_at: new Date().toISOString(),
        has_received_payout: false,
      });
    }

    return NextResponse.json({
      success: true,
      manager: newManager,
      message: "मैनेजर (MD) सफलतापूर्वक बनाया गया और ग्रुप में अंशदान सदस्य के रूप में जोड़ दिया गया।",
    });
  } catch (error) {
    console.error("Create manager error:", error);
    return NextResponse.json({ error: "मैनेजर बनाने में त्रुटि हुई।" }, { status: 500 });
  }
}
