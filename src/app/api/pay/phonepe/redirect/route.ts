import { NextRequest, NextResponse } from "next/server";
import { checkPhonePeTransactionStatus } from "../../../../../lib/phonepe";
import {
  dbFindMemberById,
  dbFindContributions,
  dbInsertContribution,
  dbUpdateContribution,
  dbFindLoanById,
  dbUpdateLoan,
} from "../../../../../lib/astra";
import {
  sendDepositNotificationEmail,
  sendLoanRepaymentNotificationEmail,
} from "../../../../../lib/email";
import { Contribution } from "../../../../../lib/types";

export async function POST(req: NextRequest) {
  return handleRedirect(req);
}

export async function GET(req: NextRequest) {
  return handleRedirect(req);
}

async function handleRedirect(req: NextRequest) {
  const url = new URL(req.url);
  const txnId = url.searchParams.get("txnId") || "";
  const memberId = url.searchParams.get("memberId") || "";
  const action = url.searchParams.get("action") || "deposit";
  const loanId = url.searchParams.get("loanId") || "";

  const host = url.origin || "https://bbcc-grup.onrender.com";

  if (!txnId || !memberId) {
    return NextResponse.redirect(`${host}/pay?status=error&message=${encodeURIComponent("अमान्य ट्रांजैक्शन विवरण")}`);
  }

  try {
    // 1. Verify directly from PhonePe API
    const statusResult = await checkPhonePeTransactionStatus(txnId);

    if (statusResult.success) {
      const member = await dbFindMemberById(memberId);
      const currentMonth = new Date().toISOString().slice(0, 7);
      const nowIso = new Date().toISOString();

      if (action === "deposit") {
        const allContributions = await dbFindContributions();
        const existing = allContributions.find(
          (c) => (c.member_id === memberId || (c as any).user_id === memberId) && c.month === currentMonth
        );

        if (existing) {
          await dbUpdateContribution(existing._id, {
            status: "paid",
            auto_approved: true,
            approved_at: nowIso,
            paid_at: nowIso,
            transaction_id: statusResult.providerReferenceId || txnId,
            note: "PhonePe गेटवे द्वारा स्वतः सत्यापित",
          });
        } else {
          const newContrib: Contribution = {
            _id: `cntr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            member_id: memberId,
            member_name: member?.name || "सदस्य",
            member_mobile: member?.mobile || "",
            month: currentMonth,
            amount: 100,
            platform_fee: 3,
            total_paid: 103,
            status: "paid",
            paid_at: nowIso,
            submitted_at: nowIso,
            approved_at: nowIso,
            auto_approved: true,
            transaction_id: statusResult.providerReferenceId || txnId,
            note: "PhonePe गेटवे द्वारा स्वतः सत्यापित",
          };
          await dbInsertContribution(newContrib);
        }

        // Send Email Receipt
        if (member?.email) {
          sendDepositNotificationEmail({
            type: "approved",
            memberName: member.name,
            memberEmail: member.email,
            month: currentMonth,
            amount: 100,
          }).catch(console.warn);
        }

        return NextResponse.redirect(`${host}/pay?status=success&txn=${encodeURIComponent(txnId)}&amount=${statusResult.amount}&member=${encodeURIComponent(member?.name || "")}`);
      } else if (action === "loan_repay" && loanId) {
        // Loan Repayment
        const loan = await dbFindLoanById(loanId);
        if (loan) {
          await dbUpdateLoan(loan._id, {
            repayment_status: "approved",
            repayment_verified_at: nowIso,
            repayment_utr: statusResult.providerReferenceId || txnId,
            repayment_note: "PhonePe गेटवे द्वारा स्वतः सत्यापित",
          });

          if (member?.email) {
            sendLoanRepaymentNotificationEmail({
              type: "approved",
              memberName: member.name,
              memberEmail: member.email,
              amount: statusResult.amount,
            }).catch(console.warn);
          }
        }

        return NextResponse.redirect(`${host}/pay?status=loan_repay_success&txn=${encodeURIComponent(txnId)}`);
      }
    }

    // Payment failed or cancelled
    return NextResponse.redirect(`${host}/pay?status=failed&reason=${encodeURIComponent(statusResult.status || "भुगतान रद्द या विफल रहा")}`);
  } catch (err: any) {
    console.error("PhonePe redirect handler error:", err);
    return NextResponse.redirect(`${host}/pay?status=error&message=${encodeURIComponent("सत्यापन प्रक्रिया में त्रुटि")}`);
  }
}
