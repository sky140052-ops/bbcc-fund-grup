import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getLocalStore } from "@/lib/astra";
import { Contribution } from "@/lib/types";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = getLocalStore();
  return NextResponse.json({ contributions: store.contributions });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { group_id, amount, razorpay_payment_id } = await req.json();

    const store = getLocalStore();
    const group = store.groups.find((g) => g._id === group_id) || store.groups[0];

    if (!group) {
      return NextResponse.json({ error: "ग्रुप नहीं मिला।" }, { status: 404 });
    }

    // Check if already paid for this cycle
    const existingPayment = store.contributions.find(
      (c) =>
        c.group_id === group._id &&
        c.user_id === session.userId &&
        c.cycle_month === group.current_cycle_month &&
        c.status === "paid"
    );

    if (existingPayment) {
      return NextResponse.json({ error: "आप इस महीने का अंशदान पहले ही जमा कर चुके हैं।" }, { status: 400 });
    }

    const newPayment: Contribution = {
      _id: `pay_${Date.now()}`,
      group_id: group._id,
      user_id: session.userId,
      user_name: session.name,
      cycle_month: group.current_cycle_month,
      amount: Number(amount) || group.monthly_amount,
      razorpay_order_id: `order_${Date.now()}`,
      razorpay_payment_id: razorpay_payment_id || `rzp_mock_${Date.now()}`,
      status: "paid",
      paid_at: new Date().toISOString(),
    };

    store.contributions.push(newPayment);

    return NextResponse.json({
      success: true,
      contribution: newPayment,
      message: "मासिक अंशदान सफलतापूर्वक जमा हुआ!",
    });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "भुगतान दर्ज करने में त्रुटि हुई।" }, { status: 500 });
  }
}
