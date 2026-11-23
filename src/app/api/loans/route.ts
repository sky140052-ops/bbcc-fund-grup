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
import {
  sendLoanApplicationEmail,
  sendLoanDisbursalEmail,
  sendLoanRepaymentNotificationEmail,
} from "../../../lib/email";

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

    // 24-Hour Auto-Approval for pending loan repayments
    const now = Date.now();
    for (const l of allLoans) {
      if (l.repayment_status === "pending_approval" && l.repayment_submitted_at) {
        const subTime = new Date(l.repayment_submitted_at).getTime();
        if (now - subTime >= 24 * 60 * 60 * 1000) {
          l.status = "repaid";
          l.repayment_status = "approved";
          l.repayment_auto_approved = true;
          l.repaid_at = new Date(subTime + 24 * 60 * 60 * 1000).toISOString();
          await dbUpdateLoan(l._id, {
            status: "repaid",
            repayment_status: "approved",
            repayment_auto_approved: true,
            repaid_at: l.repaid_at,
          });
          // Send notification email to member
          dbFindMemberById(l.member_id).then((m) => {
            if (m?.email) {
              sendLoanRepaymentNotificationEmail({
                type: "approved",
                memberName: l.member_name,
                memberEmail: m.email,
                amount: l.total_repaid || l.requested_amount,
              }).catch(console.warn);
            }
          }).catch(console.warn);
        }
      }
    }

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

    // Trigger Email Notification to Admin & Member
    sendLoanApplicationEmail({
      memberName: newLoan.member_name,
      memberEmail: member?.email,
      requestedAmount,
      disbursedAmount,
      reason,
      totalDeposit: memberTotalDeposited,
      eligibleMax: maxEligibleAmount,
    }).catch(console.warn);

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

    const memberObj = await dbFindMemberById(loan.member_id);

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

      // Trigger Email Notification to Member with Disbursal Proof
      sendLoanDisbursalEmail({
        memberName: loan.member_name,
        memberEmail: memberObj?.email,
        requestedAmount: loan.requested_amount,
        disbursedAmount: loan.disbursed_amount,
        processingFee: loan.processing_fee_amount,
        interestRate: loan.interest_rate_monthly,
        utr: transactionUtr || loan.transaction_utr,
        paymentScreenshot,
      }).catch(console.warn);

      return NextResponse.json({
        success: true,
        message: `लोन सफलतापूर्वक चालू (Disbursed) कर दिया गया है! पेमेंट स्क्रीनशॉट सभी सदस्यों के लिए उपलब्ध है।`,
        loan: { ...loan, ...updates },
      });
    }

    // Action 2: Member Repays Loan via Direct UPI Screenshot
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

      // Check duplicate pending repayment
      if (loan.repayment_status === "pending_approval") {
        return NextResponse.json(
          { error: "आपका लोन अदायगी स्क्रीनशॉट पहले से समीक्षाधीन है (24 घंटे में स्वतः स्वीकृत)। दोबारा अपलोड नहीं कर सकते।" },
          { status: 400 }
        );
      }

      const calc = calculateLoanInterest(loan);
      const totalAmountPaid = Number(body.amount) || calc.totalPayable;
      const screenshot = body.repayment_screenshot || "";

      const isAdmin = session.role === "admin" || session.role === "founder";

      const updates: Partial<Loan> = {
        repayment_screenshot: screenshot,
        repayment_submitted_at: new Date().toISOString(),
        total_repaid: totalAmountPaid,
        repayment_status: isAdmin ? "approved" : "pending_approval",
        status: isAdmin ? "repaid" : loan.status,
        repaid_at: isAdmin ? new Date().toISOString() : undefined,
      };

      await dbUpdateLoan(loan_id, updates);

      // Trigger Email Notification
      sendLoanRepaymentNotificationEmail({
        type: isAdmin ? "approved" : "pending",
        memberName: loan.member_name,
        memberEmail: memberObj?.email,
        amount: totalAmountPaid,
        screenshotUrl: screenshot,
      }).catch(console.warn);

      const msg = isAdmin
        ? `₹${totalAmountPaid} का लोन चुकता दर्ज कर दिया गया!`
        : `₹${totalAmountPaid} का पेमेंट स्क्रीनशॉट दर्ज हो गया है! एडमिन द्वारा या 24 घंटे में स्वतः (Auto-Approve) चुकता हो जाएगा।`;

      return NextResponse.json({
        success: true,
        message: msg,
        loan: { ...loan, ...updates },
      });
    }

    // Action 2B: Admin Approves Loan Repayment
    if (action === "admin_approve_repayment") {
      if (session.role !== "admin" && session.role !== "founder") {
        return NextResponse.json({ error: "केवल एडमिन ही लोन चुकता स्वीकार कर सकते हैं।" }, { status: 403 });
      }

      const updates: Partial<Loan> = {
        status: "repaid",
        repayment_status: "approved",
        repaid_at: new Date().toISOString(),
        repayment_auto_approved: false,
      };

      await dbUpdateLoan(loan_id, updates);

      sendLoanRepaymentNotificationEmail({
        type: "approved",
        memberName: loan.member_name,
        memberEmail: memberObj?.email,
        amount: loan.total_repaid || loan.requested_amount,
      }).catch(console.warn);

      return NextResponse.json({
        success: true,
        message: "लोन चुकता अनुरोध सफलतापूर्वक स्वीकार कर लिया गया!",
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
