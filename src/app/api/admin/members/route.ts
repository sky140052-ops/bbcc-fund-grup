import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getLocalStore } from "@/lib/astra";
import { User, GroupMember } from "@/lib/types";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = getLocalStore();
  const members = store.users.filter((u) => u.role === "member");

  return NextResponse.json({
    members,
    total: members.length,
  });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  // Both Founder and Manager can add members
  if (!session || (session.role !== "founder" && session.role !== "manager" && session.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized. केवल एडमिन या मैनेजर सदस्य जोड़ सकते हैं।" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, mobile, dob, aadhaar, pan, bank_details, group_id } = body;

    if (!name || !mobile || !dob || !aadhaar || !pan) {
      return NextResponse.json({ error: "सभी आवश्यक फ़ील्ड (नाम, मोबाइल, जन्मतिथि, आधार, पैन) भरें।" }, { status: 400 });
    }

    const store = getLocalStore();

    // Check if mobile or aadhaar already registered
    const existing = store.users.find((u) => u.mobile === mobile || u.aadhaar === aadhaar);
    if (existing) {
      return NextResponse.json({ error: "यह मोबाइल नंबर अथवा आधार नंबर पहले से पंजीकृत है।" }, { status: 400 });
    }

    const newUser: User = {
      _id: `user_${Date.now()}`,
      name: name.trim(),
      mobile: mobile.trim(),
      dob: dob.trim(),
      role: "member",
      aadhaar: aadhaar.trim(),
      pan: pan.trim().toUpperCase(),
      bank_details: bank_details || {
        account_number: "",
        ifsc: "",
        upi_id: "",
      },
      created_at: new Date().toISOString(),
    };

    store.users.push(newUser);

    // If a group was specified or default group exists, attach member
    const targetGroupId = group_id || store.groups[0]?._id;
    if (targetGroupId) {
      const membership: GroupMember = {
        _id: `gm_${Date.now()}`,
        group_id: targetGroupId,
        user_id: newUser._id,
        joined_at: new Date().toISOString(),
        has_received_payout: false,
      };
      store.group_members.push(membership);
    }

    return NextResponse.json({
      success: true,
      member: newUser,
      message: "नया सदस्य सफलतापूर्वक जोड़ा गया।",
    });
  } catch (error) {
    console.error("Add member error:", error);
    return NextResponse.json({ error: "सदस्य जोड़ने में त्रुटि हुई।" }, { status: 500 });
  }
}
