import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getLocalStore } from "@/lib/astra";
import { PayoutDisbursal } from "@/lib/types";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  // Only Founder can execute the payout transfer and upload screenshot
  if (!session || (session.role !== "founder" && session.role !== "admin")) {
    return NextResponse.json({ error: "केवल मुख्य फाउंडर ही भुगतान भेजकर स्क्रीनशॉट अपलोड कर सकते हैं।" }, { status: 403 });
  }

  try {
    const { request_id, transaction_utr_id, screenshot_url } = await req.json();

    if (!request_id || !transaction_utr_id) {
      return NextResponse.json(
        { error: "कृपया UTR / ट्रांजैक्शन आईडी एवं पेमेंट स्क्रीनशॉट दर्ज करें।" },
        { status: 400 }
      );
    }

    const store = getLocalStore();
    const targetReq = store.withdrawal_requests.find((r) => r._id === request_id);

    if (!targetReq) {
      return NextResponse.json({ error: "रिक्वेस्ट नहीं मिली।" }, { status: 404 });
    }

    if (!targetReq.founder_approved || !targetReq.md_approved) {
      return NextResponse.json(
        { error: "भुगतान भेजने से पहले फाउंडर और MD दोनों का अप्रूवल आवश्यक है।" },
        { status: 400 }
      );
    }

    const recipientUser = store.users.find((u) => u._id === targetReq.user_id);

    const now = new Date().toISOString();

    const newPayout: PayoutDisbursal = {
      _id: `payout_${Date.now()}`,
      group_id: targetReq.group_id,
      request_id: targetReq._id,
      recipient_user_id: targetReq.user_id,
      recipient_name: targetReq.user_name,
      gross_amount: targetReq.requested_amount,
      deduction_fee: 20, // ₹20 deduction
      net_disbursed_amount: targetReq.net_payable_amount,
      disbursed_at: now,
      payment_screenshot_url: screenshot_url || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60",
      transaction_utr_id: transaction_utr_id.trim(),
      repayment_due_date: targetReq.repayment_due_date,
      interest_start_date: now,
      interest_rate_monthly_percent: 1.0, // 1% per month
    };

    store.payouts.push(newPayout);
    targetReq.status = "disbursed";

    // Lock user for this cycle
    const membership = store.group_members.find(
      (gm) => gm.group_id === targetReq.group_id && gm.user_id === targetReq.user_id
    );
    if (membership) {
      membership.has_received_payout = true;
      membership.received_in_month = targetReq.cycle_month;
    }

    return NextResponse.json({
      success: true,
      payout: newPayout,
      message: `भुगतान सफलतापूर्वक दर्ज हुआ! सदस्य ${recipientUser?.name || ""} को ₹${targetReq.net_payable_amount.toLocaleString()} ट्रांसफर कर दिए गए हैं। ब्याज दर: ₹1 सैकड़ा प्रतिमाह लागू हो गया है।`,
    });
  } catch (error) {
    console.error("Disburse error:", error);
    return NextResponse.json({ error: "भुगतान दर्ज करने में त्रुटि हुई।" }, { status: 500 });
  }
}
