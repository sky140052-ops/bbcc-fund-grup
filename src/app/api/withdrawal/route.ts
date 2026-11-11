import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../lib/auth";
import { getLocalStore } from "../../../lib/astra";
import { WithdrawalRequest } from "../../../lib/types";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = getLocalStore();
  const requests = store.withdrawal_requests.map((r) => {
    // Count votes
    const votesCount = store.votes.filter((v) => v.candidate_request_id === r._id).length;
    const hasVoted = store.votes.some(
      (v) => v.candidate_request_id === r._id && v.voter_user_id === session.userId
    );

    return {
      ...r,
      votes_count: votesCount,
      has_user_voted: hasVoted,
    };
  });

  return NextResponse.json({ requests, payouts: store.payouts });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { group_id, requested_amount, reason, repayment_duration_days, repayment_due_date } =
      await req.json();

    const store = getLocalStore();
    const group = store.groups.find((g) => g._id === group_id) || store.groups[0];

    if (!group) {
      return NextResponse.json({ error: "ग्रुप नहीं मिला।" }, { status: 404 });
    }

    // 1. Calculate Available Pool Balance
    const totalCollected = store.contributions
      .filter((c) => c.group_id === group._id && c.status === "paid")
      .reduce((sum, c) => sum + c.amount, 0);

    const totalDisbursed = store.payouts
      .filter((p) => p.group_id === group._id)
      .reduce((sum, p) => sum + p.gross_amount, 0);

    const availablePoolBalance = Math.max(0, totalCollected - totalDisbursed);

    const amountNum = Number(requested_amount);

    // Rule: "paisa nikalne oxen utna hi hoga jitna jama hua hai"
    if (amountNum <= 0 || amountNum > availablePoolBalance) {
      return NextResponse.json(
        {
          error: `अमान्य राशि! आप अधिकतम ₹${availablePoolBalance.toLocaleString()} (पूल में उपलब्ध कुल राशि) ही निकाल सकते हैं।`,
        },
        { status: 400 }
      );
    }

    // Rule: "kitne din me lotayega isme ye v dalna parega us date me dalna parega"
    if (!repayment_due_date && !repayment_duration_days) {
      return NextResponse.json(
        { error: "कृपया पैसा लौटाने की निर्धारित तारीख या दिनों की संख्या अवश्य चुनें।" },
        { status: 400 }
      );
    }

    // Check if member already has active request this cycle
    const existingReq = store.withdrawal_requests.find(
      (r) =>
        r.group_id === group._id &&
        r.user_id === session.userId &&
        r.cycle_month === group.current_cycle_month &&
        r.status !== "rejected"
    );

    if (existingReq) {
      return NextResponse.json(
        { error: "आपकी निकासी रिक्वेस्ट इस महीने पहले से सक्रिय है।" },
        { status: 400 }
      );
    }

    // Check if user already won in this cycle
    const memberRecord = store.group_members.find(
      (gm) => gm.group_id === group._id && gm.user_id === session.userId
    );
    if (memberRecord?.has_received_payout) {
      return NextResponse.json(
        { error: "आप इस चक्र में पहले ही फंड प्राप्त कर चुके हैं। चक्र पूर्ण होने तक प्रतीक्षा करें।" },
        { status: 400 }
      );
    }

    // Rule: Fixed 20 rs deduction
    const deductionFee = 20;
    const netPayable = Math.max(0, amountNum - deductionFee);

    const newRequest: WithdrawalRequest = {
      _id: `req_${Date.now()}`,
      group_id: group._id,
      user_id: session.userId,
      user_name: session.name,
      cycle_month: group.current_cycle_month,
      reason: reason || "ज़रूरत अनुसार फंड मांग",
      requested_amount: amountNum,
      deduction_fee: deductionFee,
      net_payable_amount: netPayable,
      repayment_duration_days: Number(repayment_duration_days) || 30,
      repayment_due_date:
        repayment_due_date ||
        new Date(Date.now() + 86400000 * (Number(repayment_duration_days) || 30))
          .toISOString()
          .split("T")[0],
      interest_rate_monthly_percent: 1.0, // 1 Rs Saikda / month
      votes_count: 0,
      status: "voting",
      founder_approved: false,
      md_approved: false,
      created_at: new Date().toISOString(),
    };

    store.withdrawal_requests.push(newRequest);

    return NextResponse.json({
      success: true,
      request: newRequest,
      message: `फंड रिक्वेस्ट दर्ज हुई! स्वीकृत होने पर ₹20 कटौती के बाद ₹${netPayable.toLocaleString()} मिलेंगे। (ब्याज दर: ₹1 सैकड़ा प्रतिमाह)`,
    });
  } catch (error) {
    console.error("Withdrawal request error:", error);
    return NextResponse.json({ error: "रिक्वेस्ट दर्ज करने में त्रुटि हुई।" }, { status: 500 });
  }
}
