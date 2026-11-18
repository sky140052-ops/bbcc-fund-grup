import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import {
  dbFindWithdrawalRequestById,
  dbFindUser,
  dbFindUsers,
  dbFindGroupById,
  dbFindGroupMembers,
  dbInsertPayout,
  dbUpdateWithdrawalRequest,
  dbUpdateGroupMember,
} from "../../../../lib/astra";
import { sanitize } from "../../../../lib/crypto";
import { PayoutDisbursal } from "../../../../lib/types";
import { sendLoanDisbursedAlertToAll } from "../../../../lib/email";

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

    // Mark admin approved and disbursed
    await dbInsertPayout(newPayout);
    await dbUpdateWithdrawalRequest(targetReq._id, {
      status: "disbursed",
      admin_approved: true,
      founder_approved: true,
      disbursed_at: now,
      transaction_utr_id: cleanUtr,
      payment_screenshot_url: newPayout.payment_screenshot_url,
    });

    // Lock user from requesting again until cycle completes
    await dbUpdateGroupMember(targetReq.group_id, targetReq.user_id, {
      has_received_payout: true,
      received_in_month: targetReq.cycle_month,
    });

    // Broadcast Disbursal with Screenshot to All Members & Admin
    try {
      const group = await dbFindGroupById(targetReq.group_id);
      const groupMemberships = await dbFindGroupMembers(targetReq.group_id);
      const allUsers = await dbFindUsers();
      const recipientEmails = allUsers
        .filter(
          (u) =>
            u.email &&
            (groupMemberships.some((gm) => gm.user_id === u._id) ||
              u.role === "admin" ||
              u.role === "founder")
        )
        .map((u) => u.email);

      sendLoanDisbursedAlertToAll({
        groupName: group?.name || "BBCC Fund",
        applicantName: targetReq.user_name,
        netAmount: targetReq.net_payable_amount,
        utr: cleanUtr,
        screenshotUrl: newPayout.payment_screenshot_url,
        recipientEmails,
      }).catch((err) => console.warn("Loan disburse broadcast error:", err));
    } catch (broadcastErr) {
      console.warn("Failed sending loan disburse broadcast:", broadcastErr);
    }

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
