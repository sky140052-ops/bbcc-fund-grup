import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import { getLocalStore } from "../../../../lib/astra";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session || (session.role !== "founder" && session.role !== "manager" && session.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized. केवल फाउंडर या MD अप्रूव कर सकते हैं।" }, { status: 403 });
  }

  try {
    const { request_id, role_approval } = await req.json();

    const store = getLocalStore();
    const targetReq = store.withdrawal_requests.find((r) => r._id === request_id);

    if (!targetReq) {
      return NextResponse.json({ error: "रिक्वेस्ट नहीं मिली।" }, { status: 404 });
    }

    if (session.role === "founder" || role_approval === "founder") {
      targetReq.founder_approved = true;
      targetReq.founder_approved_at = new Date().toISOString();
    }

    if (session.role === "manager" || role_approval === "md") {
      targetReq.md_approved = true;
      targetReq.md_approved_at = new Date().toISOString();
    }

    // If both have approved, advance status to "approved"
    if (targetReq.founder_approved && targetReq.md_approved) {
      targetReq.status = "approved";
    }

    return NextResponse.json({
      success: true,
      request: targetReq,
      message: `${session.role === "founder" ? "फाउंडर" : "मैनेजिंग डायरेक्टर"} अप्रूवल दर्ज हुआ!`,
    });
  } catch (error) {
    console.error("Approval error:", error);
    return NextResponse.json({ error: "अप्रूवल दर्ज करने में त्रुटि हुई।" }, { status: 500 });
  }
}
