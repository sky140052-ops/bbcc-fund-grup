import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../../lib/auth";
import { dbUpdateGroupMemberById, dbFindAllGroupMembers } from "../../../../../lib/astra";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session || (session.role !== "founder" && session.role !== "admin")) {
    return NextResponse.json({ error: "केवल मुख्य फाउंडर या एडमिन ही आवेदन स्वीकृत/अस्वीकृत कर सकते हैं।" }, { status: 403 });
  }

  try {
    const { membership_id, action } = await req.json();

    if (!membership_id || (action !== "approve" && action !== "reject")) {
      return NextResponse.json({ error: "अमान्य अनुरोध।" }, { status: 400 });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";
    await dbUpdateGroupMemberById(membership_id, { status: newStatus });

    const actionText = action === "approve" ? "स्वीकृत (Approved) किया गया" : "अस्वीकृत (Rejected) किया गया";

    return NextResponse.json({
      success: true,
      message: `सदस्य का ग्रुप में जुड़ने का आवेदन सफलतापूर्वक ${actionText}!`,
    });
  } catch (err) {
    console.error("Approve join request error:", err);
    return NextResponse.json({ error: "कार्रवाई दर्ज करने में समस्या आई।" }, { status: 500 });
  }
}
