import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import {
  dbFindWithdrawalRequestById,
  dbFindUser,
  dbInsertPayout,
  dbUpdateWithdrawalRequest,
  dbUpdateGroupMember,
} from "../../../../lib/astra";
import { sanitize } from "../../../../lib/crypto";
import { PayoutDisbursal } from "../../../../lib/types";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  // Strict Security: Only Founder can execute the payout transfer and upload screenshot
  if (!session || (session.role !== "founder" && session.role !== "admin")) {
    return NextResponse.json({ error: "सुरक्षा प्रतिबंध: केवल मुख्य फाउंडर ही भुगतान भेजकर स्क्रीनशॉट अपलोड कर सकते हैं।" }, { status: 403 });
  }

  try {
    const { request_id, transaction_utr_id, screenshot_url } = await req.json();

    const cleanUtr = sanitize(transaction_utr_id);
    const cleanScreenshot = sanitize(screenshot_url);

    if (!request_id || !cleanUtr) {
      return NextResponse.json(
        { error: "कृपया मान्य UTR / ट्रांजैक्शन आईडी एवं पेमेंट स्क्रीनशॉट दर्ज करें।" },
        { status: 400 }
      );
    }

    const targetReq = await dbFindWithdrawalRequestById(request_id);

    if (!targetReq) {
      return NextResponse.json({ error: "रिक्वेस्ट नहीं मिली।" }, { status: 404 });
    }

    // Security Gate: MUST be approved by BOTH Founder and MD
    if (!targetReq.founder_approved || !targetReq.md_approved) {
      return NextResponse.json(
        { error: "भुगतान भेजने से पहले फाउंडर और MD दोनों का अप्रूवल आवश्यक है।" },
        { status: 400 }
      );
    }

    const recipientUser = await dbFindUser({ _id: targetReq.user_id });
    const now = new Date().toISOString();

    const newPayout: PayoutDisbursal = {
      _id: `payout_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      group_id: targetReq.group_id,
      request_id: targetReq._id,
      recipient_user_id: targetReq.user_id,
      recipient_name: targetReq.user_name,
      gross_amount: targetReq.requested_amount,
      deduction_fee: 20, // Flat ₹20 platform deduction
      net_disbursed_amount: targetReq.net_payable_amount,
      disbursed_at: now,
      payment_screenshot_url:
        cleanScreenshot ||
        "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60",
      transaction_utr_id: cleanUtr,
      repayment_due_date: targetReq.repayment_due_date,
      interest_start_date: now,
      interest_rate_monthly_percent: 1.0, // 1% per month
    };

    await dbInsertPayout(newPayout);
    await dbUpdateWithdrawalRequest(targetReq._id, { status: "disbursed" });

    // Lock user from requesting again until cycle completes
    await dbUpdateGroupMember(targetReq.group_id, targetReq.user_id, {
      has_received_payout: true,
      received_in_month: targetReq.cycle_month,
    });

    return NextResponse.json({
      success: true,
      payout: newPayout,
      message: `भुगतान Astra DB में सुरक्षित रूप से दर्ज हुआ! सदस्य ${recipientUser?.name || targetReq.user_name} को ₹${targetReq.net_payable_amount.toLocaleString()} ट्रांसफर कर दिए गए हैं। ₹1 सैकड़ा प्रतिमाह ब्याज की गणना प्रारंभ हो गई है।`,
    });
  } catch (error) {
    console.error("Disburse error:", error);
    return NextResponse.json({ error: "भुगतान दर्ज करने में त्रुटि हुई।" }, { status: 500 });
  }
}
