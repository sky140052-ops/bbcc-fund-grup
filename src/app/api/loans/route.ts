import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../lib/auth";
import {
  dbFindLoans,
  dbFindLoanById,
  dbInsertLoan,
  dbUpdateLoan,
  dbFindContributions,
  dbFindMemberById,
  dbGetSystemSettings,
} from "../../../lib/astra";
import { sanitize } from "../../../lib/crypto";
import { Loan } from "../../../lib/types";

// Helper: Calculate 1% p.m. interest
function calculateLoanInterest(loan: Loan): { months: number; interest: number; totalPayable: number } {
  if (loan.status !== "disbursed" || !loan.disbursed_at) {
    return { months: 0, interest: 0, totalPayable: loan.requested_amount };
  }

  const disbursalDate = new Date(loan.disbursed_at);
  const now = new Date();

  // Difference in milliseconds
  const diffTime = Math.max(0, now.getTime() - disbursalDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Months calculated (each 30 days or partial month up to 10th)
  const months = Math.max(1, Math.ceil(diffDays / 30));
  const monthlyRate = 0.01; // 1% p.m.
  const interest = Math.round(loan.requested_amount * monthlyRate * months);
  const totalPayable = loan.requested_amount + interest;

  return { months, interest, totalPayable };
}

// GET: Fetch loans (All loans or member specific loans)
export async function GET(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const memberId = url.searchParams.get("member_id");

    const allLoans = await dbFindLoans();

    // Attach dynamic interest calculations
    const enrichedLoans = allLoans.map((l) => {
      const calc = calculateLoanInterest(l);
      return {
        ...l,
        interest_accumulated: calc.interest,
        total_payable: calc.totalPayable,
        elapsed_months: calc.months,
      };
    });

    // Sort newest first
    enrichedLoans.sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime());

    // Target member's loan
    const targetMemberId = memberId || (session.role === "member" ? session.userId : null);
    const memberLoans = targetMemberId
      ? enrichedLoans.filter((l) => l.member_id === targetMemberId)
      : [];

    const activeLoan = memberLoans.find((l) => l.status === "disbursed" || l.status === "pending") || null;

    return NextResponse.json({
      success: true,
      loans: enrichedLoans,
      member_loans: memberLoans,
      active_loan: activeLoan,
    });
  } catch (err: any) {
    console.error("Loans GET error:", err);
    return NextResponse.json({ error: "लोन सूची लोड करने में विफल।" }, { status: 500 });
  }
}

// POST: Member applies for Loan (Max 90% of total deposited amount)
export async function POST(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const requestedAmount = Math.round(Number(body.amount) || 0);
    const reason = sanitize(body.reason || "आपातकालीन वित्तीय आवश्यकता");

    if (requestedAmount < 10) {
      return NextResponse.json({ error: "कृपया न्यूनतम ₹10 की राशि दर्ज करें।" }, { status: 400 });
    }

    // Check member's total deposited amount
    const allContributions = await dbFindContributions();
    const memberTotalDeposited = allContributions
      .filter((c) => (c.member_id === session.userId || (c as any).user_id === session.userId) && c.status === "paid")
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

    const maxEligibleAmount = Math.floor(memberTotalDeposited * 0.90);

    if (memberTotalDeposited <= 0) {
      return NextResponse.json(
        { error: "आपने अभी तक कोई अंशदान जमा नहीं किया है। लोन लेने के लिए कम से कम एक जमा होना आवश्यक है।" },
        { status: 400 }
      );
    }

    if (requestedAmount > maxEligibleAmount) {
      return NextResponse.json(
        {
          error: `आपकी अधिकतम लोन पात्रता ₹${maxEligibleAmount} है (आपकी कुल जमा राशि ₹${memberTotalDeposited} का 90%)।`,
        },
        { status: 400 }
      );
    }

    // Check if member already has an active loan
    const existingLoans = await dbFindLoans({ member_id: session.userId });
    const hasUnresolvedLoan = existingLoans.some((l) => l.status === "pending" || l.status === "disbursed");

    if (hasUnresolvedLoan) {
      return NextResponse.json(
        { error: "आपका पहले से ही एक लोन आवेदन लंबित या सक्रिय है। कृपया पहले उसे पूरा या चुकता करें।" },
        { status: 400 }
      );
    }

    // Fetch member payment details
    const member = await dbFindMemberById(session.userId);

    // Calculate 10% processing fee
    const processingFeePercent = 10;
    const processingFeeAmount = Math.round(requestedAmount * 0.10);
    const disbursedAmount = requestedAmount - processingFeeAmount; // 90% net to member

    const newLoan: Loan = {
      _id: `loan_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      member_id: session.userId,
      member_name: member?.name || session.name,
      member_mobile: member?.mobile || session.mobile,
      member_upi: member?.upi_id || "",
      member_wallet: member?.wallet_number || "",
      member_account: member?.account_number || "",
      member_ifsc: member?.ifsc || "",
      requested_amount: requestedAmount,
      processing_fee_percent: processingFeePercent,
      processing_fee_amount: processingFeeAmount,
      disbursed_amount: disbursedAmount,
      interest_rate_monthly: 1, // 1% p.m.
      status: "pending",
      requested_at: new Date().toISOString(),
      reason,
    };

    await dbInsertLoan(newLoan);

    return NextResponse.json({
      success: true,
      message: `₹${requestedAmount} के लोन का आवेदन सफलतापूर्वक दर्ज हो गया है! (10% प्रोसेसिंग शुल्क कटने के बाद आपके खाते में ₹${disbursedAmount} भेजे जाएंगे)।`,
      loan: newLoan,
    });
  } catch (err: any) {
    console.error("Loan application error:", err);
    return NextResponse.json({ error: "लोन आवेदन में त्रुटि।" }, { status: 500 });
  }
}

// PUT: Admin Approves & Disburses with Screenshot OR Member Repays Loan
export async function PUT(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { loan_id, action } = body;

    if (!loan_id) {
      return NextResponse.json({ error: "Loan ID आवश्यक है।" }, { status: 400 });
    }

    const loan = await dbFindLoanById(loan_id);
    if (!loan) {
      return NextResponse.json({ error: "लोन रिकॉर्ड नहीं मिला।" }, { status: 404 });
    }

    // Action 1: Admin Approves & Disburses with Screenshot Proof
    if (action === "admin_disburse") {
      if (session.role !== "admin" && session.role !== "founder") {
        return NextResponse.json({ error: "केवल एडमिन ही लोन डिस्बर्स कर सकते हैं।" }, { status: 403 });
      }

      const transactionUtr = sanitize(body.transaction_utr || "").trim();
      const paymentScreenshot = body.payment_screenshot || "";
      const adminNotes = sanitize(body.admin_notes || "");

      if (!paymentScreenshot) {
        return NextResponse.json(
          { error: "कृपया सदस्य को पैसा भेजने का स्क्रीनशॉट प्रूफ अपलोड/संलग्न करें।" },
          { status: 400 }
        );
      }

      const updates: Partial<Loan> = {
        status: "disbursed",
        disbursed_at: new Date().toISOString(),
        transaction_utr: transactionUtr || `UTR_${Date.now()}`,
        payment_screenshot: paymentScreenshot,
        admin_notes: adminNotes,
      };

      await dbUpdateLoan(loan_id, updates);

      return NextResponse.json({
        success: true,
        message: `लोन सफलतापूर्वक चालू (Disbursed) कर दिया गया है! पेमेंट स्क्रीनशॉट सभी सदस्यों के लिए उपलब्ध है।`,
        loan: { ...loan, ...updates },
      });
    }

    // Action 2: Member Repays Loan via Razorpay
    if (action === "member_repay") {
      const currentDay = new Date().getDate();
      const settings = await dbGetSystemSettings();
      const isRepayAllowed = (currentDay <= 15) || settings.allow_loan_repay_after_15th || session.role === "admin";
      if (!isRepayAllowed) {
        return NextResponse.json(
          { error: "लोन चुकता करने की निर्धारित तारीख (15 तारीख) निकल चुकी है। कृपया एडमिन से इसे पुनः सक्रिय (Enable) करवाएं।" },
          { status: 403 }
        );
      }

      const calc = calculateLoanInterest(loan);
      const totalAmountPaid = Number(body.amount) || calc.totalPayable;
      const razorpayId = sanitize(body.razorpay_payment_id || `repay_${Date.now()}`);

      const updates: Partial<Loan> = {
        status: "repaid",
        repaid_at: new Date().toISOString(),
        total_repaid: totalAmountPaid,
        repayment_razorpay_id: razorpayId,
      };

      await dbUpdateLoan(loan_id, updates);

      return NextResponse.json({
        success: true,
        message: `₹${totalAmountPaid} का लोन ब्याज सहित सफलतापूर्वक चुकता कर दिया गया है!`,
        loan: { ...loan, ...updates },
      });
    }

    // Action 3: Admin Rejects Loan
    if (action === "admin_reject") {
      if (session.role !== "admin" && session.role !== "founder") {
        return NextResponse.json({ error: "केवल एडमिन ही लोन रद्द कर सकते हैं।" }, { status: 403 });
      }

      await dbUpdateLoan(loan_id, { status: "rejected", admin_notes: sanitize(body.reason || "एडमिन द्वारा अस्वीकृत") });

      return NextResponse.json({
        success: true,
        message: "लोन आवेदन अस्वीकृत कर दिया गया।",
      });
    }

    return NextResponse.json({ error: "अमान्य एक्शन।" }, { status: 400 });
  } catch (err: any) {
    console.error("Loan PUT error:", err);
    return NextResponse.json({ error: "लोन प्रक्रिया में त्रुटि।" }, { status: 500 });
  }
}
