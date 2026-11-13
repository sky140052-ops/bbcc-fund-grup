import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../lib/auth";
import {
  dbGetActiveGroup,
  dbFindContributions,
  dbInsertContribution,
} from "../../../lib/astra";
import { sanitize } from "../../../lib/crypto";
import { Contribution } from "../../../lib/types";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contributions = await dbFindContributions();
  return NextResponse.json({ contributions });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { group_id, amount, razorpay_payment_id } = await req.json();

    const activeGroup = await dbGetActiveGroup();
    if (!activeGroup) {
      return NextResponse.json({ error: "सक्रिय ग्रुप नहीं मिला।" }, { status: 404 });
    }

    const targetGroupId = group_id || activeGroup._id;

    // Check if already paid for this cycle
    const contributions = await dbFindContributions(targetGroupId);
    const existingPayment = contributions.find(
      (c) =>
        c.user_id === session.userId &&
        c.cycle_month === activeGroup.current_cycle_month &&
        c.status === "paid"
    );

    if (existingPayment) {
      return NextResponse.json({ error: "आप इस महीने का अंशदान पहले ही जमा कर चुके हैं।" }, { status: 400 });
    }

    const paymentAmount = Math.max(1, Number(amount) || activeGroup.monthly_amount);

    const newPayment: Contribution = {
      _id: `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      group_id: targetGroupId,
      user_id: session.userId,
      user_name: session.name,
      cycle_month: activeGroup.current_cycle_month,
      amount: paymentAmount,
      razorpay_order_id: `order_${Date.now()}`,
      razorpay_payment_id: sanitize(razorpay_payment_id) || `rzp_live_${Date.now()}`,
      status: "paid",
      paid_at: new Date().toISOString(),
    };

    await dbInsertContribution(newPayment);

    return NextResponse.json({
      success: true,
      contribution: newPayment,
      message: `मासिक अंशदान ₹${paymentAmount.toLocaleString()} सफलतापूर्वक Astra DB में दर्ज हुआ!`,
    });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "अंशदान दर्ज करने में त्रुटि हुई।" }, { status: 500 });
  }
}
