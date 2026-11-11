import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getLocalStore } from "@/lib/astra";

export async function GET(req: NextRequest) {
  const store = getLocalStore();
  const group = store.groups[0];

  if (!group) {
    return NextResponse.json({ group: null, members: [], pool_balance: 0 });
  }

  // Get all members assigned to this group
  const groupMemberIds = store.group_members
    .filter((gm) => gm.group_id === group._id)
    .map((gm) => gm.user_id);

  const members = store.users
    .filter((u) => groupMemberIds.includes(u._id))
    .map((u) => {
      // Find current month contribution
      const contribution = store.contributions.find(
        (c) =>
          c.group_id === group._id &&
          c.user_id === u._id &&
          c.cycle_month === group.current_cycle_month
      );

      const membership = store.group_members.find(
        (gm) => gm.group_id === group._id && gm.user_id === u._id
      );

      return {
        _id: u._id,
        name: u.name,
        role: u.role,
        mobile: u.mobile,
        dob: u.dob,
        aadhaar_last4: u.aadhaar.slice(-4),
        pan: u.pan,
        bank_details: u.bank_details,
        payment_status: contribution ? contribution.status : "pending",
        paid_amount: contribution ? contribution.amount : 0,
        paid_at: contribution?.paid_at,
        has_received_payout: membership?.has_received_payout || false,
      };
    });

  // Calculate total pool balance
  const totalCollected = store.contributions
    .filter((c) => c.group_id === group._id && c.status === "paid")
    .reduce((sum, c) => sum + c.amount, 0);

  // Subtract any completed payouts
  const totalDisbursed = store.payouts
    .filter((p) => p.group_id === group._id)
    .reduce((sum, p) => sum + p.gross_amount, 0);

  const availablePoolBalance = Math.max(0, totalCollected - totalDisbursed);

  return NextResponse.json({
    group,
    members,
    total_members: members.length,
    paid_members_count: members.filter((m) => m.payment_status === "paid").length,
    pending_members_count: members.filter((m) => m.payment_status === "pending").length,
    total_collected_lifetime: totalCollected,
    total_disbursed_lifetime: totalDisbursed,
    available_pool_balance: availablePoolBalance,
    monthly_target: members.length * group.monthly_amount,
  });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("bbcc_session")?.value;
  const session = token ? verifyToken(token) : null;

  if (!session || (session.role !== "founder" && session.role !== "admin")) {
    return NextResponse.json({ error: "केवल फाउंडर नया ग्रुप बना सकते हैं।" }, { status: 403 });
  }

  try {
    const { name, monthly_amount, due_date_day, total_cycle_months } = await req.json();

    const store = getLocalStore();
    const newGroup = {
      _id: `grp_bbcc_${Date.now()}`,
      name: name || "BBCC Fund Grup",
      monthly_amount: Number(monthly_amount) || 5000,
      due_date_day: Number(due_date_day) || 5,
      total_cycle_months: Number(total_cycle_months) || 12,
      current_cycle_month: 1,
      status: "active" as const,
      created_by: session.userId,
      created_at: new Date().toISOString(),
    };

    store.groups.unshift(newGroup);

    return NextResponse.json({ success: true, group: newGroup });
  } catch (error) {
    return NextResponse.json({ error: "ग्रुप बनाने में त्रुटि हुई।" }, { status: 500 });
  }
}
