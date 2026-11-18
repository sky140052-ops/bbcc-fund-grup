import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import { dbFindWithdrawalRequestById, dbUpdateWithdrawalRequest } from "../../../../lib/astra";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session || (session.role !== "founder" && session.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized. केवल मुख्य एडमिन ही अप्रूव कर सकते हैं।" }, { status: 403 });
  }

  try {
    const { request_id } = await req.json();

    const targetReq = await dbFindWithdrawalRequestById(request_id);

    if (!targetReq) {
      return NextResponse.json({ error: "रिक्वेस्ट नहीं मिली।" }, { status: 404 });
    }

    const updates: Record<string, any> = {
      admin_approved: true,
      admin_approved_at: new Date().toISOString(),
      founder_approved: true,
      founder_approved_at: new Date().toISOString(),
      status: "approved",
    };

    await dbUpdateWithdrawalRequest(request_id, updates);

    return NextResponse.json({
      success: true,
      message: "एडमिन अप्रूवल Astra DB में दर्ज हुआ!",
    });
  } catch (error) {
    console.error("Approval error:", error);
    return NextResponse.json({ error: "अप्रूवल दर्ज करने में त्रुटि हुई।" }, { status: 500 });
  }
}
