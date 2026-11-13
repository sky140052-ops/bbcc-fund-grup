import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import { dbFindWithdrawalRequestById, dbUpdateWithdrawalRequest } from "../../../../lib/astra";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session || (session.role !== "founder" && session.role !== "manager" && session.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized. केवल मुख्य फाउंडर या MD ही अप्रूव कर सकते हैं।" }, { status: 403 });
  }

  try {
    const { request_id, role_approval } = await req.json();

    const targetReq = await dbFindWithdrawalRequestById(request_id);

    if (!targetReq) {
      return NextResponse.json({ error: "रिक्वेस्ट नहीं मिली।" }, { status: 404 });
    }

    const updates: Record<string, any> = {};

    if (session.role === "founder" || role_approval === "founder") {
      updates.founder_approved = true;
      updates.founder_approved_at = new Date().toISOString();
    }

    if (session.role === "manager" || role_approval === "md") {
      updates.md_approved = true;
      updates.md_approved_at = new Date().toISOString();
    }

    const isFounderOk = updates.founder_approved !== undefined ? updates.founder_approved : targetReq.founder_approved;
    const isMdOk = updates.md_approved !== undefined ? updates.md_approved : targetReq.md_approved;

    if (isFounderOk && isMdOk) {
      updates.status = "approved";
    }

    await dbUpdateWithdrawalRequest(request_id, updates);

    return NextResponse.json({
      success: true,
      message: `${session.role === "founder" ? "फाउंडर" : "MD (मैनेजिंग डायरेक्टर)"} अप्रूवल Astra DB में दर्ज हुआ!`,
    });
  } catch (error) {
    console.error("Approval error:", error);
    return NextResponse.json({ error: "अप्रूवल दर्ज करने में त्रुटि हुई।" }, { status: 500 });
  }
}
