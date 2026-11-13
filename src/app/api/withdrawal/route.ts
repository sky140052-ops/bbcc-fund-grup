import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../lib/auth";
import {
  dbGetActiveGroup,
  dbFindWithdrawalRequests,
  dbFindVotes,
  dbFindPayouts,
  dbFindContributions,
  dbFindGroupMembers,
  dbInsertWithdrawalRequest,
} from "../../../lib/astra";
import { sanitize } from "../../../lib/crypto";
import { WithdrawalRequest } from "../../../lib/types";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeGroup = await dbGetActiveGroup();
  const allRequests = await dbFindWithdrawalRequests(activeGroup?._id);
  const allVotes = await dbFindVotes(activeGroup?._id);
  const allPayouts = await dbFindPayouts(activeGroup?._id);

  const requests = allRequests.map((r) => {
    const votesCount = allVotes.filter((v) => v.candidate_request_id === r._id).length;
    const hasVoted = allVotes.some(
      (v) => v.candidate_request_id === r._id && v.voter_user_id === session.userId
    );

    return {
      ...r,
      votes_count: votesCount,
      has_user_voted: hasVoted,
    };
  });

  return NextResponse.json({ requests, payouts: allPayouts });
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

    const activeGroup = await dbGetActiveGroup();
    if (!activeGroup) {
      return NextResponse.json({ error: "सक्रिय ग्रुप नहीं मिला।" }, { status: 404 });
    }

    const targetGroupId = group_id || activeGroup._id;

    // 1. Calculate Available Pool Balance
    const contributions = await dbFindContributions(targetGroupId);
    const payouts = await dbFindPayouts(targetGroupId);

    const totalCollected = contributions
      .filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + c.amount, 0);

    const totalDisbursed = payouts.reduce((sum, p) => sum + p.gross_amount, 0);
    const availablePoolBalance = Math.max(0, totalCollected - totalDisbursed);

    const amountNum = Number(requested_amount);

    if (isNaN(amountNum) || amountNum <= 0 || amountNum > availablePoolBalance) {
      return NextResponse.json(
        {
          error: `अमान्य राशि! आप अधिकतम ₹${availablePoolBalance.toLocaleString()} (पूल में उपलब्ध कुल राशि) ही निकाल सकते हैं।`,
        },
        { status: 400 }
      );
    }

    const cleanReason = sanitize(reason) || "इमर्जेंसी सहायता हेतु मांग";
    const cleanDueDate = sanitize(repayment_due_date);
    const durationDays = Math.max(1, Number(repayment_duration_days) || 30);

    // Check if user already won in this cycle
    const groupMemberships = await dbFindGroupMembers(targetGroupId);
    const userMembership = groupMemberships.find((gm) => gm.user_id === session.userId);

    if (userMembership?.has_received_payout) {
      return NextResponse.json(
        { error: "आप इस चक्र में पहले ही फंड प्राप्त कर चुके हैं। चक्र पूर्ण होने तक प्रतीक्षा करें।" },
        { status: 400 }
      );
    }

    // Check if user already has an active request this month
    const existingRequests = await dbFindWithdrawalRequests(targetGroupId);
    const alreadyRequested = existingRequests.find(
      (r) =>
        r.user_id === session.userId &&
        r.cycle_month === activeGroup.current_cycle_month &&
        r.status !== "rejected"
    );

    if (alreadyRequested) {
      return NextResponse.json(
        { error: "आपकी निकासी रिक्वेस्ट इस महीने पहले से सक्रिय है।" },
        { status: 400 }
      );
    }

    const deductionFee = 20;
    const netPayable = Math.max(0, amountNum - deductionFee);

    const newRequest: WithdrawalRequest = {
      _id: `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      group_id: targetGroupId,
      user_id: session.userId,
      user_name: session.name,
      cycle_month: activeGroup.current_cycle_month,
      reason: cleanReason,
      requested_amount: amountNum,
      deduction_fee: deductionFee,
      net_payable_amount: netPayable,
      repayment_duration_days: durationDays,
      repayment_due_date:
        cleanDueDate ||
        new Date(Date.now() + 86400000 * durationDays).toISOString().split("T")[0],
      interest_rate_monthly_percent: 1.0, // 1 Rs Saikda / month
      votes_count: 0,
      status: "voting",
      founder_approved: false,
      md_approved: false,
      created_at: new Date().toISOString(),
    };

    await dbInsertWithdrawalRequest(newRequest);

    return NextResponse.json({
      success: true,
      request: newRequest,
      message: `फंड रिक्वेस्ट Astra DB में दर्ज हुई! स्वीकृत होने पर ₹20 कटौती के बाद ₹${netPayable.toLocaleString()} मिलेंगे। (ब्याज दर: ₹1 सैकड़ा प्रतिमाह)`,
    });
  } catch (error) {
    console.error("Withdrawal request error:", error);
    return NextResponse.json({ error: "रिक्वेस्ट दर्ज करने में त्रुटि हुई।" }, { status: 500 });
  }
}
