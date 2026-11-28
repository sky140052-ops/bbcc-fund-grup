import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/auth";
import {
  dbFindMemberById,
  dbFindContributions,
  dbInsertContribution,
  dbUpdateContribution,
} from "../../../../lib/astra";
import { sanitize } from "../../../../lib/crypto";
import { Contribution } from "../../../../lib/types";
import { sendDepositNotificationEmail } from "../../../../lib/email";

// Admin Session Validator
function getAdminSession(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = req.cookies.get("bbcc_session")?.value || bearerToken;
  if (!token) return null;
  const session = verifyToken(token);
  if (!session) return null;
  if (session.role === "admin" || session.role === "founder") {
    return session;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const session = getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: "अनधिकृत अनुरोध। केवल एडमिन ही यह बदलाव कर सकते हैं।" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      member_id,
      month,
      amount = 100,
      payment_date,
      payment_mode = "नकद (Cash)",
      note,
    } = body;

    if (!member_id) {
      return NextResponse.json({ error: "कृपया सदस्य का चयन करें।" }, { status: 400 });
    }

    const member = await dbFindMemberById(member_id);
    if (!member) {
      return NextResponse.json({ error: "सदस्य रिकॉर्ड नहीं मिला।" }, { status: 404 });
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const targetMonth = month || currentMonth;
    const numAmount = Math.max(1, Number(amount) || 100);

    // Determine timestamp from payment_date or now
    let paidAtIso = new Date().toISOString();
    if (payment_date) {
      const parsedDate = new Date(payment_date);
      if (!isNaN(parsedDate.getTime())) {
        paidAtIso = parsedDate.toISOString();
      }
    }

    const cleanNote = sanitize(note || `एडमिन डायरेक्ट भुगतान दर्ज (${payment_mode})`);
    const txnId = `ADMIN_MANUAL_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const allContributions = await dbFindContributions();
    const existing = allContributions.find(
      (c) => (c.member_id === member_id || (c as any).user_id === member_id) && c.month === targetMonth
    );

    let contributionRecord: Contribution;

    if (existing) {
      await dbUpdateContribution(existing._id, {
        amount: numAmount,
        total_paid: numAmount,
        status: "paid",
        paid_at: paidAtIso,
        approved_at: new Date().toISOString(),
        auto_approved: false,
        rejection_reason: undefined,
        transaction_id: txnId,
        note: cleanNote,
      });

      contributionRecord = {
        ...existing,
        amount: numAmount,
        total_paid: numAmount,
        status: "paid",
        paid_at: paidAtIso,
        approved_at: new Date().toISOString(),
        auto_approved: false,
        transaction_id: txnId,
        note: cleanNote,
      };
    } else {
      const newContrib: Contribution = {
        _id: `cntr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        member_id: member._id,
        member_name: member.name,
        member_mobile: member.mobile || "",
        amount: numAmount,
        platform_fee: 0,
        total_paid: numAmount,
        month: targetMonth,
        status: "paid",
        paid_at: paidAtIso,
        submitted_at: paidAtIso,
        approved_at: new Date().toISOString(),
        auto_approved: false,
        transaction_id: txnId,
        note: cleanNote,
      };

      await dbInsertContribution(newContrib);
      contributionRecord = newContrib;
    }

    // Send Email notification to Member if email exists
    if (member.email) {
      sendDepositNotificationEmail({
        type: "approved",
        memberName: member.name,
        memberEmail: member.email,
        amount: numAmount,
        month: targetMonth,
      }).catch(console.warn);
    }

    return NextResponse.json({
      success: true,
      message: `✓ सदस्य '${member.name}' का माह ${targetMonth} का ₹${numAmount} का अंशदान 'Paid' मार्क कर दिया गया!`,
      contribution: contributionRecord,
    });
  } catch (err: any) {
    console.error("Admin Mark Payment error:", err);
    return NextResponse.json({ error: err.message || "भुगतान दर्ज करने में विफलता।" }, { status: 500 });
  }
}
