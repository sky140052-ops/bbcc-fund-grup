import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../lib/auth";
import {
  dbFindContributions,
  dbInsertContribution,
  dbFindMembers,
  dbFindMemberById,
} from "../../../lib/astra";
import { sanitize } from "../../../lib/crypto";
import { Contribution } from "../../../lib/types";
import Razorpay from "razorpay";

function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret || key_id.includes("placeholder")) {
    return null;
  }
  return new Razorpay({ key_id, key_secret });
}

// GET: Returns list of contributions, community total, and member's total
export async function GET(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const memberId = url.searchParams.get("member_id");

    const allContributions = await dbFindContributions();

    // Sort newest first
    allContributions.sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());

    // Calculate community total
    const totalCommunityPool = allContributions
      .filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

    // Calculate member's total
    const targetMemberId = memberId || (session.role === "member" ? session.userId : null);
    const memberContributions = targetMemberId
      ? allContributions.filter((c) => (c.member_id === targetMemberId || (c as any).user_id === targetMemberId) && c.status === "paid")
      : [];

    const memberTotalDeposited = memberContributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

    return NextResponse.json({
      success: true,
      contributions: allContributions,
      total_community_pool: totalCommunityPool,
      member_total_deposited: memberTotalDeposited,
      member_contributions: memberContributions,
    });
  } catch (err: any) {
    console.error("Contributions GET error:", err);
    return NextResponse.json({ error: "जमा सूची लोड करने में विफल।" }, { status: 500 });
  }
}

// POST: Create Razorpay Order or Save Confirmed Deposit
export async function POST(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const action = body.action || "save_deposit";

    // Action 1: Create Razorpay Order
    if (action === "create_order") {
      const amount = Math.max(1, Number(body.amount) || 100);
      const razorpay = getRazorpayInstance();

      if (!razorpay) {
        // Mock order ID if keys are missing
        const mockOrderId = `order_mock_${Date.now()}`;
        return NextResponse.json({
          success: true,
          order_id: mockOrderId,
          amount: amount * 100,
          currency: "INR",
          key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_mock",
          is_mock: true,
        });
      }

      const options = {
        amount: Math.round(amount * 100), // In Paise
        currency: "INR",
        receipt: `rcpt_${session.userId.slice(-6)}_${Date.now()}`,
        notes: {
          member_id: session.userId,
          member_name: session.name,
        },
      };

      const order = await razorpay.orders.create(options);
      return NextResponse.json({
        success: true,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID,
      });
    }

    // Action 2: Save Confirmed Deposit
    const amount = Math.max(1, Number(body.amount) || 100);
    const targetMemberId = body.member_id || session.userId;
    const targetMemberName = body.member_name || session.name;
    const targetMemberMobile = body.member_mobile || session.mobile || "";

    const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-11"

    const newContribution: Contribution = {
      _id: `cntr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      member_id: targetMemberId,
      member_name: targetMemberName,
      member_mobile: targetMemberMobile,
      amount,
      month: body.month || currentMonth,
      status: "paid",
      razorpay_order_id: body.razorpay_order_id || "",
      razorpay_payment_id: body.razorpay_payment_id || `pay_manual_${Date.now()}`,
      paid_at: new Date().toISOString(),
      note: sanitize(body.note || "DFI मासिक अंशदान जमा"),
    };

    await dbInsertContribution(newContribution);

    return NextResponse.json({
      success: true,
      message: `₹${amount} की राशि सफलतापूर्वक जमा कर दी गई है!`,
      contribution: newContribution,
    });
  } catch (err: any) {
    console.error("Contribution POST error:", err);
    return NextResponse.json({ error: "जमा राशि सुरक्षित करने में त्रुटि।" }, { status: 500 });
  }
}
