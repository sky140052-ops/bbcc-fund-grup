import { NextRequest, NextResponse } from "next/server";
import {
  dbFindMembers,
  dbFindMemberById,
  dbFindContributions,
  dbInsertContribution,
  dbUpdateContribution,
  dbFindLoans,
  dbFindLoanById,
  dbUpdateLoan,
  dbGetSystemSettings,
} from "../../../lib/astra";
import { sanitize } from "../../../lib/crypto";
import { Contribution, Loan } from "../../../lib/types";
import {
  sendDepositNotificationEmail,
  sendLoanRepaymentNotificationEmail,
} from "../../../lib/email";

// Helper: Calculate 1% p.m. interest
function calculateLoanInterest(loan: Loan): { months: number; interest: number; totalPayable: number } {
  if (loan.status !== "disbursed" || !loan.disbursed_at) {
    return { months: 0, interest: 0, totalPayable: loan.requested_amount };
  }
  const disbursalDate = new Date(loan.disbursed_at);
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - disbursalDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const months = Math.max(1, Math.ceil(diffDays / 30));
  const interest = Math.round(loan.requested_amount * 0.01 * months);
  return { months, interest, totalPayable: loan.requested_amount + interest };
}

// GET: Public details for payment link (/pay)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const queriedMemberId = url.searchParams.get("member_id");

    const [members, settings, allContributions, allLoans] = await Promise.all([
      dbFindMembers(),
      dbGetSystemSettings(),
      dbFindContributions(),
      dbFindLoans(),
    ]);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentDay = new Date().getDate();
    const isDepositAllowed = (currentDay >= 1 && currentDay <= 10) || !!settings.allow_deposit_after_10th;
    const isRepayAllowed = currentDay <= 15 || !!settings.allow_loan_repay_after_15th;

    // 24-hr auto approval for pending deposits
    const now = Date.now();
    for (const c of allContributions) {
      if (c.status === "pending") {
        const subTime = new Date(c.submitted_at || c.paid_at).getTime();
        if (now - subTime >= 24 * 60 * 60 * 1000) {
          c.status = "paid";
          c.auto_approved = true;
          c.approved_at = new Date(subTime + 24 * 60 * 60 * 1000).toISOString();
          await dbUpdateContribution(c._id, {
            status: "paid",
            auto_approved: true,
            approved_at: c.approved_at,
          });
          dbFindMemberById(c.member_id).then((m) => {
            if (m?.email) {
              sendDepositNotificationEmail({
                type: "approved",
                memberName: c.member_name,
                memberEmail: m.email,
                amount: c.amount,
                month: c.month,
              }).catch(console.warn);
            }
          }).catch(console.warn);
        }
      }
    }

    // 24-hr auto approval for pending loan repayments
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

    // Public list of active members
    const publicMembers = members
      .map((m) => ({
        _id: m._id,
        name: m.name,
        mobile: m.mobile ? `XXXXXX${m.mobile.slice(-4)}` : "",
        aadhaar_last4: m.aadhaar_number ? m.aadhaar_number.slice(-4) : "",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Active loans eligible for repayment
    const loansForRepay = allLoans
      .filter((l) => l.status === "disbursed")
      .map((l) => {
        const calc = calculateLoanInterest(l);
        return {
          loan_id: l._id,
          member_id: l.member_id,
          member_name: l.member_name,
          requested_amount: l.requested_amount,
          disbursed_amount: l.disbursed_amount,
          interest: calc.interest,
          total_payable: calc.totalPayable,
          months: calc.months,
          repayment_status: l.repayment_status || "none",
          repayment_screenshot: l.repayment_screenshot || "",
        };
      });

    // Specific member status if queried
    let memberDepositStatus = null;
    let memberActiveLoan = null;

    if (queriedMemberId) {
      const existingCntr = allContributions.find(
        (c) => (c.member_id === queriedMemberId || (c as any).user_id === queriedMemberId) && c.month === currentMonth
      );
      if (existingCntr) {
        memberDepositStatus = {
          status: existingCntr.status,
          amount: existingCntr.amount,
          month: existingCntr.month,
          submitted_at: existingCntr.submitted_at || existingCntr.paid_at,
          rejection_reason: existingCntr.rejection_reason,
          auto_approved: existingCntr.auto_approved,
        };
      }

      const activeLoan = allLoans.find((l) => l.member_id === queriedMemberId && l.status === "disbursed");
      if (activeLoan) {
        const calc = calculateLoanInterest(activeLoan);
        memberActiveLoan = {
          loan_id: activeLoan._id,
          member_id: activeLoan.member_id,
          requested_amount: activeLoan.requested_amount,
          interest: calc.interest,
          total_payable: calc.totalPayable,
          months: calc.months,
          repayment_status: activeLoan.repayment_status || "none",
        };
      }
    }

    return NextResponse.json({
      success: true,
      current_month: currentMonth,
      current_day: currentDay,
      is_deposit_allowed: isDepositAllowed,
      is_repay_allowed: isRepayAllowed,
      settings: {
        admin_upi_id: settings.admin_upi_id || "sky140052@okaxis",
        admin_upi_name: settings.admin_upi_name || "DFI इमरजेंसी सेवा",
        admin_qr_code: settings.admin_qr_code || "",
        admin_bank_name: settings.admin_bank_name || "",
        admin_account_number: settings.admin_account_number || "",
        admin_ifsc: settings.admin_ifsc || "",
        allow_deposit_after_10th: !!settings.allow_deposit_after_10th,
        allow_loan_repay_after_15th: !!settings.allow_loan_repay_after_15th,
        monthly_contribution_amount: settings.monthly_contribution_amount || 100,
        platform_fee: settings.platform_fee !== undefined ? settings.platform_fee : 3,
        total_monthly_payable: (settings.monthly_contribution_amount || 100) + (settings.platform_fee !== undefined ? settings.platform_fee : 3),
      },
      members: publicMembers,
      loans_for_repay: loansForRepay,
      member_deposit_status: memberDepositStatus,
      member_active_loan: memberActiveLoan,
    });
  } catch (err: any) {
    console.error("Public pay GET error:", err);
    return NextResponse.json({ error: "डेटा लोड करने में विफल।" }, { status: 500 });
  }
}

// POST: Public submission for Deposit Screenshot OR Loan Repayment Screenshot
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "submit_deposit";
    const settings = await dbGetSystemSettings();

    // 1. Action: Monthly Deposit Screenshot Submission (₹100)
    if (action === "submit_deposit") {
      const currentDay = new Date().getDate();
      const isDepositAllowed = (currentDay >= 1 && currentDay <= 10) || !!settings.allow_deposit_after_10th;

      if (!isDepositAllowed) {
        return NextResponse.json(
          { error: "इस माह की निर्धारित अंशदान अवधि (1 से 10 तारीख) समाप्त हो चुकी है। 10 तारीख के बाद पोर्टल पर जमा बंद रहता है।" },
          { status: 403 }
        );
      }

      const memberId = body.member_id;
      if (!memberId) {
        return NextResponse.json({ error: "कृपया सदस्य का चयन करें।" }, { status: 400 });
      }

      const screenshot = body.payment_screenshot;
      if (!screenshot) {
        return NextResponse.json({ error: "कृपया ₹100 का भुगतान स्क्रीनशॉट अवश्य अपलोड करें।" }, { status: 400 });
      }

      const member = await dbFindMemberById(memberId);
      if (!member) {
        return NextResponse.json({ error: "सदस्य रिकॉर्ड नहीं मिला।" }, { status: 404 });
      }

      const currentMonth = new Date().toISOString().slice(0, 7);
      const allContributions = await dbFindContributions();

      const monthlyAmount = settings.monthly_contribution_amount || 100;
      const platformFee = settings.platform_fee !== undefined ? settings.platform_fee : 3;
      const totalPayable = monthlyAmount + platformFee;

      // Check duplicate
      const existing = allContributions.find(
        (c) => (c.member_id === memberId || (c as any).user_id === memberId) && c.month === currentMonth
      );

      if (existing) {
        if (existing.status === "paid") {
          return NextResponse.json(
            { error: `सदस्य '${member.name}' का माह ${currentMonth} का ₹${existing.amount} अंशदान पहले से स्वीकृत (Paid) है। दोबारा जमा करने की आवश्यकता नहीं है।` },
            { status: 400 }
          );
        }
        if (existing.status === "pending") {
          return NextResponse.json(
            { error: `सदस्य '${member.name}' का माह ${currentMonth} का स्क्रीनशॉट पहले से समीक्षाधीन है (24 घंटे में स्वतः स्वीकृत हो जाएगा)। दोबारा अपलोड नहीं कर सकते।` },
            { status: 400 }
          );
        }
      }

      if (existing && existing.status === "rejected") {
        // Re-uploading after rejection: update existing record to pending
        await dbUpdateContribution(existing._id, {
          amount: monthlyAmount, // Original savings amount
          platform_fee: platformFee, // ₹3 platform fee
          total_paid: totalPayable,
          status: "pending",
          payment_screenshot: screenshot,
          submitted_at: new Date().toISOString(),
          auto_approved: false,
          rejection_reason: undefined,
          note: sanitize(body.note || "DFI सार्वजनिक लिंक द्वारा पुनः अपलोड"),
        });
      } else {
        const newContribution: Contribution = {
          _id: `cntr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          member_id: member._id,
          member_name: member.name,
          member_mobile: member.mobile,
          amount: monthlyAmount, // Original savings credited to member fund
          platform_fee: platformFee, // ₹3 platform fee
          total_paid: totalPayable, // Total amount paid via UPI
          month: currentMonth,
          status: "pending",
          payment_screenshot: screenshot,
          submitted_at: new Date().toISOString(),
          paid_at: new Date().toISOString(),
          auto_approved: false,
          note: sanitize(body.note || "DFI सार्वजनिक लिंक से जमा"),
        };
        await dbInsertContribution(newContribution);
      }

      // Trigger Email Notification to Admin & Member
      sendDepositNotificationEmail({
        type: "pending",
        memberName: member.name,
        memberEmail: member.email,
        amount: monthlyAmount,
        month: currentMonth,
        screenshotUrl: screenshot,
      }).catch(console.warn);

      return NextResponse.json({
        success: true,
        message: `सदस्य '${member.name}' का कुल ₹${totalPayable} (अंशदान ₹${monthlyAmount} + ₹${platformFee} प्लेटफॉर्म शुल्क) का स्क्रीनशॉट सफलतापूर्वक दर्ज हो गया है! एडमिन द्वारा सत्यापन उपरांत अथवा 24 घंटे में सिस्टम द्वारा स्वतः (Auto-Approved) मूल अंशदान ₹${monthlyAmount} आपके खाते में जुड़ जाएगा।`,
      });
    }

    // 2. Action: Loan Repayment Screenshot Submission
    if (action === "submit_repayment") {
      const currentDay = new Date().getDate();
      const isRepayAllowed = currentDay <= 15 || !!settings.allow_loan_repay_after_15th;

      if (!isRepayAllowed) {
        return NextResponse.json(
          { error: "लोन चुकता करने की निर्धारित तारीख (15 तारीख) निकल चुकी है। कृपया एडमिन से इसे पुनः सक्रिय करवाएं।" },
          { status: 403 }
        );
      }

      const loanId = body.loan_id;
      if (!loanId) {
        return NextResponse.json({ error: "कृपया लोन का चयन करें।" }, { status: 400 });
      }

      const screenshot = body.repayment_screenshot;
      if (!screenshot) {
        return NextResponse.json({ error: "कृपया लोन अदायगी का स्क्रीनशॉट अपलोड करें।" }, { status: 400 });
      }

      const loan = await dbFindLoanById(loanId);
      if (!loan) {
        return NextResponse.json({ error: "लोन रिकॉर्ड नहीं मिला।" }, { status: 404 });
      }

      if (loan.status !== "disbursed") {
        return NextResponse.json({ error: "यह लोन पहले से चुकता या अमान्य है।" }, { status: 400 });
      }

      if (loan.repayment_status === "pending_approval") {
        return NextResponse.json(
          { error: "इस लोन का अदायगी स्क्रीनशॉट पहले से समीक्षाधीन है (24 घंटे में स्वतः स्वीकृत हो जाएगा)। दोबारा अपलोड नहीं कर सकते।" },
          { status: 400 }
        );
      }

      const calc = calculateLoanInterest(loan);
      const totalAmountPaid = Number(body.amount) || calc.totalPayable;

      const updates: Partial<Loan> = {
        repayment_screenshot: screenshot,
        repayment_submitted_at: new Date().toISOString(),
        total_repaid: totalAmountPaid,
        repayment_status: "pending_approval",
      };

      await dbUpdateLoan(loanId, updates);

      const member = await dbFindMemberById(loan.member_id);

      // Trigger Email Notification to Admin & Member
      sendLoanRepaymentNotificationEmail({
        type: "pending",
        memberName: loan.member_name,
        memberEmail: member?.email,
        amount: totalAmountPaid,
        screenshotUrl: screenshot,
      }).catch(console.warn);

      return NextResponse.json({
        success: true,
        message: `₹${totalAmountPaid} का लोन अदायगी स्क्रीनशॉट सफलतापूर्वक दर्ज हो गया है! एडमिन द्वारा सत्यापन उपरांत अथवा 24 घंटे में स्वतः (Auto-Approved) आपका लोन चुकता हो जाएगा।`,
      });
    }

    return NextResponse.json({ error: "अमान्य एक्शन।" }, { status: 400 });
  } catch (err: any) {
    console.error("Public pay POST error:", err);
    return NextResponse.json({ error: "स्क्रीनशॉट जमा करने में त्रुटि।" }, { status: 500 });
  }
}
